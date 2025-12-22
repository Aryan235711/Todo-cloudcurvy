
import { GoogleGenAI, Type } from "@google/genai";
import { getStoredApiKey } from './apiKeyService';

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
        const delay = Math.pow(2, retries) * 1000;
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
  return callWithRetry(async (ai) => {
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
    return JSON.parse(jsonStr);
  });
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
  return callWithRetry(async (ai) => {
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
    return JSON.parse(jsonStr);
  });
};

export const getSmartMotivation = async (pendingCount: number): Promise<string> => {
  return callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give me a short, refreshing, and encouraging one-sentence quote for someone who has ${pendingCount} tasks remaining. Keep it breezy and cool.`,
    });

    return response.text?.trim() || "Let's make today beautiful!";
  });
};
