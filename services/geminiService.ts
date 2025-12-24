
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
  breakdown: 200,
} as const;

const PERSIST_KEY_V2 = 'curvycloud_ai_cache_v2';
const PERSIST_KEY_V1 = 'curvycloud_ai_cache_v1';

type PersistedCacheShapeV2 = {
  v: 2;
  motivation: Array<[string, CacheEntry<string>]>;
  refine: Array<[string, CacheEntry<{ category: string; tags: string[]; isUrgent: boolean; extractedTime?: string }>]>;
  template: Array<[string, CacheEntry<{ name: string; items: string[]; category: string; tags: string[] }>]>
  breakdown?: Array<[string, CacheEntry<string[]>]>;
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
const breakdownCache = new Map<string, CacheEntry<string[]>>();

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
  pruneExpired(breakdownCache);

  // Limit cache sizes to prevent storage bloat (keep most recent).
  const limitCache = (cache: Map<string, any>, max: number) => {
    if (cache.size > max) {
      const entries = Array.from(cache.entries());
      cache.clear();
      entries.slice(-max).forEach(([k, v]) => cache.set(k, v));
    }
  };
  limitCache(motivationCache, 200);
  limitCache(refineCache, 500);
  limitCache(templateCache, 200);
  limitCache(breakdownCache, 200);

  const payload: PersistedCacheShapeV2 = {
    v: 2,
    motivation: Array.from(motivationCache.entries()),
    refine: Array.from(refineCache.entries()),
    template: Array.from(templateCache.entries()),
    breakdown: Array.from(breakdownCache.entries()),
  };

  try {
    await storageSet(PERSIST_KEY_V2, JSON.stringify(payload));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to persist AI cache', e);
  }
};

const ensurePersistentLoaded = async () => {
  if (persistentLoaded) return;
  persistentLoaded = true;
  try {
    const rawV2 = await storageGet(PERSIST_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as PersistedCacheShapeV2;
      if (parsed?.v === 2) {
        for (const [k, v] of parsed.motivation || []) motivationCache.set(k, v);
        for (const [k, v] of parsed.refine || []) refineCache.set(k, v);
        for (const [k, v] of parsed.template || []) templateCache.set(k, v);
        for (const [k, v] of parsed.breakdown || []) breakdownCache.set(k, v);
      }
    } else {
      // Migrate legacy v1 cache into v2 under a neutral scope to avoid mixing with keyed caches.
      const rawV1 = await storageGet(PERSIST_KEY_V1);
      if (rawV1) {
        const legacy = JSON.parse(rawV1) as any;
        if (legacy?.v === 1) {
          for (const [k, v] of (legacy.motivation || []) as Array<[string, CacheEntry<string>]>) {
            motivationCache.set(`legacy:${k}`, v);
          }
          for (
            const [k, v] of (legacy.refine || []) as Array<
              [string, CacheEntry<{ category: string; tags: string[]; isUrgent: boolean; extractedTime?: string }>]
            >
          ) {
            refineCache.set(`legacy:${k}`, v);
          }
          for (
            const [k, v] of (legacy.template || []) as Array<
              [string, CacheEntry<{ name: string; items: string[]; category: string; tags: string[] }>]
            >
          ) {
            templateCache.set(`legacy:${k}`, v);
          }
          await persistCaches();
        }
      }
    }

    pruneExpired(motivationCache);
    pruneExpired(refineCache);
    pruneExpired(templateCache);
    pruneExpired(breakdownCache);

    // Enforce caps immediately.
    while (motivationCache.size > MAX_CACHE_ENTRIES.motivation) motivationCache.delete(motivationCache.keys().next().value);
    while (refineCache.size > MAX_CACHE_ENTRIES.refine) refineCache.delete(refineCache.keys().next().value);
    while (templateCache.size > MAX_CACHE_ENTRIES.template) templateCache.delete(templateCache.keys().next().value);
    while (breakdownCache.size > MAX_CACHE_ENTRIES.breakdown) breakdownCache.delete(breakdownCache.keys().next().value);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to load AI cache', e);
  }
};

const fingerprintCache = new Map<string, string>();

const fnv1a = (input: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const sha256Hex8 = async (input: string): Promise<string> => {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const bytes = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const arr = Array.from(new Uint8Array(digest));
      const hex = arr.map(b => b.toString(16).padStart(2, '0')).join('');
      return hex.slice(0, 8);
    }
  } catch {
    // ignore
  }
  return fnv1a(input);
};

const resolveApiKey = async (): Promise<string> => {
  const storedKey = await getStoredApiKey();
  const envKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
  return (storedKey || envKey || '').trim();
};

const getKeyScope = async (): Promise<string> => {
  const apiKey = await resolveApiKey();
  if (!apiKey) return 'nokey';

  const cached = fingerprintCache.get(apiKey);
  if (cached) return cached;

  const fp = await sha256Hex8(apiKey);
  const scope = `k:${fp}`;
  fingerprintCache.set(apiKey, scope);
  return scope;
};

const inflightMotivation = new Map<string, Promise<string>>();
const inflightRefine = new Map<string, Promise<{ category: string; tags: string[]; isUrgent: boolean; extractedTime?: string }>>();
const inflightTemplate = new Map<string, Promise<{ name: string; items: string[]; category: string; tags: string[] }>>();
const inflightBreakdown = new Map<string, Promise<string[]>>();

// Circuit breaker: once quota is exhausted, pause further AI attempts.
const COOLDOWN_KEY = 'curvycloud_ai_cooldown_until';
let cooldownUntilMs = 0;
let cooldownLoaded = false;

const ensureCooldownLoaded = async () => {
  if (cooldownLoaded) return;
  cooldownLoaded = true;
  try {
    const raw = await storageGet(COOLDOWN_KEY);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) cooldownUntilMs = parsed;
  } catch {
    // ignore
  }
};

const setCooldown = async (untilMs: number) => {
  cooldownUntilMs = untilMs;
  try {
    await storageSet(COOLDOWN_KEY, String(untilMs));
  } catch {
    // ignore
  }
};

type RateLimitKind = 'quota' | 'rate_limit' | null;
const classifyRateLimit = (e: any): RateLimitKind => {
  const msg = ((e?.message as string) || '').toUpperCase();
  const status = e?.status || e?.response?.status;

  const mentionsQuota = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA');
  if (mentionsQuota) return 'quota';

  if (status === 429 || msg.includes(' 429') || msg.includes('429 ')) return 'rate_limit';
  return null;
};

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
 * Handles rate limiting (429) with exponential backoff.
 */
const callWithRetry = async <T>(fn: (ai: GoogleGenAI) => Promise<T>, maxRetries = 1): Promise<T> => {
  let retries = 0;
  
  while (true) {
    await ensureCooldownLoaded();
    if (cooldownUntilMs && Date.now() < cooldownUntilMs) {
      const err: any = new Error('AI_COOLDOWN_ACTIVE');
      err.code = 'AI_COOLDOWN';
      err.status = 429;
      err.cooldownUntil = cooldownUntilMs;
      throw err;
    }

    // Instantiate a fresh client right before the call to pick up the latest selected key.
    // BYOK precedence: stored (UI-provided) key -> env (dev fallback).
    const apiKey = await resolveApiKey();

    const ai = new GoogleGenAI({ apiKey });
    
    try {
      return await fn(ai);
    } catch (e: any) {
      const kind = classifyRateLimit(e);

      // Hard quota exhaustion: do NOT retry; set a cooldown to prevent burning more calls.
      if (kind === 'quota') {
        const until = Date.now() + 30 * 60 * 1000; // 30 minutes
        await setCooldown(until);
        throw e;
      }

      // Transient rate limiting: allow limited retries.
      if (kind === 'rate_limit' && retries < maxRetries) {
        retries++;
        const baseDelay = Math.pow(2, retries) * 1000;
        const jitter = 0.8 + Math.random() * 0.4;
        const delay = Math.round(baseDelay * jitter);
        console.warn(`Gemini rate limited. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
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
  const scope = await getKeyScope();
  const cacheKey = `${scope}:refine:${normalized}`;
  const cached = cacheGet(refineCache, cacheKey);
  if (cached) return cached;

  const existing = inflightRefine.get(cacheKey);
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
    cacheSet(refineCache, cacheKey, parsed, 30 * 24 * 60 * 60 * 1000, MAX_CACHE_ENTRIES.refine); // 30 days
    schedulePersist();
    return parsed;
  });

  inflightRefine.set(cacheKey, p);
  try {
    return await p;
  } finally {
    inflightRefine.delete(cacheKey);
  }
};

export const getTaskBreakdown = async (taskText: string): Promise<string[]> => {
  await ensurePersistentLoaded();
  const normalized = normalizeText(taskText).toLowerCase();
  const scope = await getKeyScope();
  const cacheKey = `${scope}:breakdown:${normalized}`;

  const cached = cacheGet(breakdownCache, cacheKey);
  if (cached) return cached;

  const existing = inflightBreakdown.get(cacheKey);
  if (existing) return existing;

  const p = callWithRetry(async (ai) => {
    try {
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
      const steps: string[] = Array.isArray(data?.steps) ? data.steps : [];
      cacheSet(breakdownCache, cacheKey, steps, 30 * 24 * 60 * 60 * 1000, MAX_CACHE_ENTRIES.breakdown); // 30 days
      schedulePersist();
      return steps;
    } catch (error) {
      console.error('AI breakdown failed:', error);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ai-error', { detail: { message: 'AI breakdown failed', error } }));
      }
      return [];
    }
  });

  inflightBreakdown.set(cacheKey, p);
  try {
    return await p;
  } finally {
    inflightBreakdown.delete(cacheKey);
  }
};

export const generateTemplateFromPrompt = async (prompt: string): Promise<{ name: string; items: string[]; category: string; tags: string[] }> => {
  await ensurePersistentLoaded();
  const normalized = normalizeText(prompt).toLowerCase();
  const scope = await getKeyScope();
  const cacheKey = `${scope}:template:${normalized}`;
  const cached = cacheGet(templateCache, cacheKey);
  if (cached) return cached;

  const existing = inflightTemplate.get(cacheKey);
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
    cacheSet(templateCache, cacheKey, parsed, 24 * 60 * 60 * 1000, MAX_CACHE_ENTRIES.template); // 1 day
    schedulePersist();
    return parsed;
  });

  inflightTemplate.set(cacheKey, p);
  try {
    return await p;
  } finally {
    inflightTemplate.delete(cacheKey);
  }
};

export const getSmartMotivation = async (pendingCount: number): Promise<string> => {
  await ensurePersistentLoaded();
  const scope = await getKeyScope();
  const cacheKey = `${scope}:motivation:${pendingCount}`;
  const cached = cacheGet(motivationCache, cacheKey);
  if (cached) return cached;

  const existing = inflightMotivation.get(cacheKey);
  if (existing) return existing;

  const p = callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give me a short, refreshing, and encouraging one-sentence quote for someone who has ${pendingCount} tasks remaining. Keep it breezy and cool.`,
    });

    const msg = response.text?.trim() || "Let's make today beautiful!";
    cacheSet(motivationCache, cacheKey, msg, 3 * 60 * 1000, MAX_CACHE_ENTRIES.motivation); // 3 minutes
    schedulePersist();
    return msg;
  });

  inflightMotivation.set(cacheKey, p);
  try {
    return await p;
  } finally {
    inflightMotivation.delete(cacheKey);
  }
};
