
import { GoogleGenAI, Type } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { getStoredApiKey } from './apiKeyService';

export type ApiKeyValidationResult = 'ok' | 'quota' | 'invalid' | 'error';

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');

type CacheEntry<T> = { value: T; expiresAt: number };
const MAX_CACHE_ENTRIES = {
  motivation: 50,
  refine: 200,
  template: 80,
} as const;

const PERSIST_KEY = 'curvycloud_ai_cache_v1';

type PersistedCacheShape = {
  v: 1;
  motivation: Array<[string, CacheEntry<string>]>;
  refine: Array<[string, CacheEntry<{ category: string; tags: string[]; isUrgent: boolean; extractedTime?: string }>]>;
  template: Array<[string, CacheEntry<{ name: string; items: string[]; category: string; tags: string[] }>]>
};

let persistentLoaded = false;
let persistTimer: number | null = null;

const storageGet = async (key: string): Promise<string> => {
  if (Capacitor.isNativePlatform()) {
    const res = await Preferences.get({ key });
    return res.value || '';
  }
  return localStorage.getItem(key) || '';
};

const storageSet = async (key: string, value: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
};

const touch = <T>(cache: Map<string, CacheEntry<T>>, key: string) => {
  const existing = cache.get(key);
  if (!existing) return;
  cache.delete(key);
  cache.set(key, existing);
};

const cacheGet = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | null => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  touch(cache, key);
  return hit.value;
};

const cacheSet = <T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number, maxEntries: number) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  touch(cache, key);
  if (cache.size <= maxEntries) return;
  // Map preserves insertion order; delete the oldest entries.
  const toRemove = cache.size - maxEntries;
  const keys = cache.keys();
  for (let i = 0; i < toRemove; i++) {
    const k = keys.next().value as string | undefined;
    if (!k) break;
    cache.delete(k);
  }
};

const motivationCache = new Map<string, CacheEntry<string>>();
const refineCache = new Map<
  string,
  CacheEntry<{ category: string; tags: string[]; isUrgent: boolean; extractedTime?: string }>
>();
const templateCache = new Map<
  string,
  CacheEntry<{ name: string; items: string[]; category: string; tags: string[] }>
>();

const pruneExpired = <T>(cache: Map<string, CacheEntry<T>>) => {
  const now = Date.now();
  for (const [k, v] of cache.entries()) {
    if (now > v.expiresAt) cache.delete(k);
  }
};

const schedulePersist = () => {
  if (persistTimer !== null) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    void persistCaches();
  }, 750);
};

const persistCaches = async () => {
  pruneExpired(motivationCache);
  pruneExpired(refineCache);
  pruneExpired(templateCache);

  const payload: PersistedCacheShape = {
    v: 1,
    motivation: Array.from(motivationCache.entries()),
    refine: Array.from(refineCache.entries()),
    template: Array.from(templateCache.entries()),
  };

  try {
    await storageSet(PERSIST_KEY, JSON.stringify(payload));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to persist AI cache', e);
  }
};

const ensurePersistentLoaded = async () => {
  if (persistentLoaded) return;
  persistentLoaded = true;
  try {
    const raw = await storageGet(PERSIST_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PersistedCacheShape;
    if (!parsed || parsed.v !== 1) return;

    for (const [k, v] of parsed.motivation || []) motivationCache.set(k, v);
    for (const [k, v] of parsed.refine || []) refineCache.set(k, v);
    for (const [k, v] of parsed.template || []) templateCache.set(k, v);

    pruneExpired(motivationCache);
    pruneExpired(refineCache);
    pruneExpired(templateCache);

    // Enforce caps immediately.
    while (motivationCache.size > MAX_CACHE_ENTRIES.motivation) motivationCache.delete(motivationCache.keys().next().value);
    while (refineCache.size > MAX_CACHE_ENTRIES.refine) refineCache.delete(refineCache.keys().next().value);
    while (templateCache.size > MAX_CACHE_ENTRIES.template) templateCache.delete(templateCache.keys().next().value);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to load AI cache', e);
  }
};

const inflightMotivation = new Map<string, Promise<string>>();
const inflightRefine = new Map<string, Promise<{ category: string; tags: string[]; isUrgent: boolean; extractedTime?: string }>>();
const inflightTemplate = new Map<string, Promise<{ name: string; items: string[]; category: string; tags: string[] }>>();

// Gentle throttle for background-ish calls like metadata refinement.
const REFINE_LIMIT_PER_MIN = 5;
const refineCallTimestamps: number[] = [];
const canRefineNow = () => {
  const now = Date.now();
  while (refineCallTimestamps.length && now - refineCallTimestamps[0] > 60_000) {
    refineCallTimestamps.shift();
  }
  if (refineCallTimestamps.length >= REFINE_LIMIT_PER_MIN) return false;
  refineCallTimestamps.push(now);
  return true;
};

export const validateApiKey = async (apiKey: string): Promise<ApiKeyValidationResult> => {
  const key = apiKey.trim();
  if (!key) return 'invalid';

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return 'ok';
  } catch (e: any) {
    const msg = ((e?.message as string) || '').toUpperCase();
    const status = e?.status || e?.response?.status;

    if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA') || msg.includes('429')) {
      return 'quota';
    }

    // Common invalid key shapes/messages can vary by SDK; treat 401/403 and related text as invalid.
    if (status === 401 || status === 403 || msg.includes('API KEY') || msg.includes('UNAUTH') || msg.includes('PERMISSION')) {
      return 'invalid';
    }

    return 'error';
  }
};

/**
 * 201 IQ Retry Wrapper: Handles rate limiting (429) with exponential backoff.
 */
const callWithRetry = async <T>(fn: (ai: GoogleGenAI) => Promise<T>, maxRetries = 2): Promise<T> => {
  let retries = 0;
  
  while (true) {
    // Instantiate a fresh client right before the call to pick up the latest selected key.
    // BYOK precedence: stored (UI-provided) key -> env (dev fallback).
    const storedKey = await getStoredApiKey();
    const envKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
    const apiKey = (storedKey || envKey || '').trim();

    const ai = new GoogleGenAI({ apiKey });
    
    try {
      return await fn(ai);
    } catch (e: any) {
      const errorMessage = (e.message || "").toUpperCase();
      const isRateLimit = errorMessage.includes("429") || 
                          errorMessage.includes("RESOURCE_EXHAUSTED") || 
                          errorMessage.includes("QUOTA");

      if (isRateLimit && retries < maxRetries) {
        retries++;
        // Exponential backoff: 2s, 4s...
        const baseDelay = Math.pow(2, retries) * 1000;
        const jitter = 0.8 + Math.random() * 0.4; // 0.8x - 1.2x
        const delay = Math.round(baseDelay * jitter);
        console.warn(`Gemini Quota/Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we reach here, it's either not a rate limit or we've exhausted retries.
      // Re-throw so the UI can handle specifically (e.g. 429 notification).
      throw e;
    }
  }
};

/**
 * AI Governance: Refines category, tags, and detects Temporal Urgency.
 */
export const refineTaskMetadata = async (text: string): Promise<{ category: string, tags: string[], isUrgent: boolean, extractedTime?: string }> => {
  await ensurePersistentLoaded();
  const normalized = normalizeText(text).toLowerCase();
  const cached = cacheGet(refineCache, normalized);
  if (cached) return cached;

  const existing = inflightRefine.get(normalized);
  if (existing) return existing;

  // This call is non-critical; avoid hammering quota if users add lots of tasks quickly.
  if (!canRefineNow()) {
    if (import.meta.env.DEV) console.warn('Refine throttled; returning defaults');
    return { category: 'other', tags: [], isUrgent: false };
  }

  const p = callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Task: "${text}". 
      1. Categorize: work, personal, health, or other.
      2. Tags: 2-3 relevant tags.
      3. Urgency: Is this time-sensitive? (e.g., contains 'today', 'tomorrow', a specific time like '5pm', or 'urgent').
      4. Extraction: If a specific time or deadline is mentioned, extract it concisely (e.g., '5:00 PM', 'EOD').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['work', 'personal', 'health', 'other'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            isUrgent: { type: Type.BOOLEAN },
            extractedTime: { type: Type.STRING, description: "The extracted time or deadline if found" }
          },
          required: ["category", "tags", "isUrgent"]
        }
      }
    });

    const jsonStr = response.text || '{"category": "other", "tags": [], "isUrgent": false}';
    const parsed = JSON.parse(jsonStr);
    cacheSet(refineCache, normalized, parsed, 30 * 24 * 60 * 60 * 1000, MAX_CACHE_ENTRIES.refine); // 30 days
    schedulePersist();
    return parsed;
  });

  inflightRefine.set(normalized, p);
  try {
    return await p;
  } finally {
    inflightRefine.delete(normalized);
  }
};

export const getTaskBreakdown = async (taskText: string): Promise<string[]> => {
  return callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down this task into 3-5 simple, actionable sub-tasks: "${taskText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["steps"]
        }
      }
    });

    const jsonStr = response.text || '{"steps": []}';
    const data = JSON.parse(jsonStr);
    return data.steps || [];
  });
};

export const generateTemplateFromPrompt = async (prompt: string): Promise<{ name: string; items: string[]; category: string; tags: string[] }> => {
  await ensurePersistentLoaded();
  const normalized = normalizeText(prompt).toLowerCase();
  const cached = cacheGet(templateCache, normalized);
  if (cached) return cached;

  const existing = inflightTemplate.get(normalized);
  if (existing) return existing;

  const p = callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user wants a REUSABLE todo list template for: "${prompt}". 
      - Keep items GENERIC and reusable.
      - Focus on categories and placeholders.
      - Create a catchy name.
      - Choose a category (work, personal, health, other).
      - Suggest 2-3 tags for the WHOLE TEMPLATE.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['work', 'personal', 'health', 'other'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            items: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "items", "category", "tags"]
        }
      }
    });

    const jsonStr = response.text || '{"name": "Custom List", "items": [], "category": "other", "tags": []}';
    const parsed = JSON.parse(jsonStr);
    cacheSet(templateCache, normalized, parsed, 24 * 60 * 60 * 1000, MAX_CACHE_ENTRIES.template); // 1 day
    schedulePersist();
    return parsed;
  });

  inflightTemplate.set(normalized, p);
  try {
    return await p;
  } finally {
    inflightTemplate.delete(normalized);
  }
};

export const getSmartMotivation = async (pendingCount: number): Promise<string> => {
  await ensurePersistentLoaded();
  const key = String(pendingCount);
  const cached = cacheGet(motivationCache, key);
  if (cached) return cached;

  const existing = inflightMotivation.get(key);
  if (existing) return existing;

  const p = callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give me a short, refreshing, and encouraging one-sentence quote for someone who has ${pendingCount} tasks remaining. Keep it breezy and cool.`,
    });

    const msg = response.text?.trim() || "Let's make today beautiful!";
    cacheSet(motivationCache, key, msg, 3 * 60 * 1000, MAX_CACHE_ENTRIES.motivation); // 3 minutes
    schedulePersist();
    return msg;
  });

  inflightMotivation.set(key, p);
  try {
    return await p;
  } finally {
    inflightMotivation.delete(key);
  }
};
