import { GoogleGenerativeAI } from "@google/generative-ai";
import { useStore } from "./store";
import { AI_CONFIG } from "./config";

export interface AIResponse {
  text: string;
  provider: 'gemini' | 'groq';
  error?: string;
}

export interface GenerateOptions {
  model?: string;         // Override the default model (e.g. use Pro instead of Flash)
  useGrounding?: boolean; // Enable Google Search grounding
}

function toFriendlyErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("429") || normalized.includes("quota") || normalized.includes("rate limit")) {
    return "AI quota/rate limit reached. Wait and retry, or switch provider in Settings (add Groq key as fallback).";
  }

  if (normalized.includes("gemini api key not configured")) {
    return "Gemini API key not configured. Add it in Settings.";
  }

  if (normalized.includes("groq api key not configured")) {
    return "Groq API key not configured. Add it in Settings to use fallback.";
  }

  if (normalized.includes("invalid api key") || normalized.includes("401")) {
    return "Invalid API key. Update your key in Settings.";
  }

  if (normalized.includes("not supported for generatecontent")) {
    return "Selected Gemini model is not supported for this API/key. The app will try fallback models automatically.";
  }

  if (normalized.includes("google_search_retrieval not supported")) {
    return "Grounded search mode is not supported by this model/API version. Retrying without grounding.";
  }

  return message;
}

// API Call Logging
interface APILogEntry {
  timestamp: string;
  provider: 'gemini' | 'groq';
  model: string;
  promptLength: number;
  responseLength: number;
  success: boolean;
  error?: string;
  durationMs: number;
}

const MAX_LOG_ENTRIES = 100;

function logAPICall(entry: APILogEntry) {
  try {
    const logs = JSON.parse(localStorage.getItem('api_logs') || '[]') as APILogEntry[];
    logs.unshift(entry); // Add to front
    // Keep only last MAX_LOG_ENTRIES
    const trimmed = logs.slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem('api_logs', JSON.stringify(trimmed));
    console.log(`[API Log] ${entry.provider}/${entry.model}: ${entry.success ? 'OK' : 'FAIL'} in ${entry.durationMs}ms`);
  } catch (e) {
    console.warn('[API Log] Failed to save log:', e);
  }
}

// Export logs for debugging
export function getAPILogs(): APILogEntry[] {
  try {
    return JSON.parse(localStorage.getItem('api_logs') || '[]');
  } catch {
    return [];
  }
}

export function clearAPILogs() {
  localStorage.removeItem('api_logs');
}

async function callGemini(apiKey: string, prompt: string, options?: GenerateOptions): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // If a specific model is requested, try it first, then fallback models.
  const modelsToTry = options?.model
    ? [options.model, ...AI_CONFIG.geminiModels.filter((m) => m !== options.model)]
    : AI_CONFIG.geminiModels;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    const startTime = Date.now();
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}${options?.useGrounding ? ' (with grounding)' : ''}`);

      // Build model config — optionally enable Google Search grounding
      const runGenerate = async (useGrounding: boolean) => {
        const modelConfig: any = { model: modelName };
        if (useGrounding) {
          // For v1beta, use googleSearch tool.
          modelConfig.tools = [{ googleSearch: {} }];
        }
        const model = genAI.getGenerativeModel(modelConfig);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      };

      let text = "";
      try {
        text = await runGenerate(Boolean(options?.useGrounding));
      } catch (groundingError: unknown) {
        const gErr = groundingError as Error;
        const lower = gErr.message.toLowerCase();
        const groundingUnsupported =
          lower.includes("google_search_retrieval not supported") ||
          lower.includes("google_search tool not supported") ||
          lower.includes("please use google_search tool instead");

        if (options?.useGrounding && groundingUnsupported) {
          console.warn(`[AI] Grounding unsupported for ${modelName}, retrying without grounding`);
          text = await runGenerate(false);
        } else {
          throw groundingError;
        }
      }

      logAPICall({
        timestamp: new Date().toISOString(),
        provider: 'gemini',
        model: modelName,
        promptLength: prompt.length,
        responseLength: text.length,
        success: true,
        durationMs: Date.now() - startTime,
      });

      console.log(`[AI] Success with ${modelName}`);
      return text;
    } catch (e: unknown) {
      const error = e as Error & { status?: number };
      console.warn(`[AI] Model ${modelName} failed:`, error.message);

      logAPICall({
        timestamp: new Date().toISOString(),
        provider: 'gemini',
        model: modelName,
        promptLength: prompt.length,
        responseLength: 0,
        success: false,
        error: error.message,
        durationMs: Date.now() - startTime,
      });

      lastError = error;
      if (error.message?.includes('401') || error.status === 401) {
        throw new Error('Invalid API key');
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const modelsToTry = AI_CONFIG.groqModels;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    const startTime = Date.now();
    try {
      console.log(`[AI] Trying Groq model: ${modelName}`);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: modelName,
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText;

        logAPICall({
          timestamp: new Date().toISOString(),
          provider: 'groq',
          model: modelName,
          promptLength: prompt.length,
          responseLength: 0,
          success: false,
          error: `${response.status}: ${errMsg}`,
          durationMs: Date.now() - startTime,
        });

        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`${response.status}: ${errMsg}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || "";

      logAPICall({
        timestamp: new Date().toISOString(),
        provider: 'groq',
        model: modelName,
        promptLength: prompt.length,
        responseLength: text.length,
        success: true,
        durationMs: Date.now() - startTime,
      });

      console.log(`[AI] Success with ${modelName}`);
      return text;
    } catch (e: unknown) {
      const error = e as Error;
      console.warn(`[AI] Model ${modelName} failed:`, error.message);

      logAPICall({
        timestamp: new Date().toISOString(),
        provider: 'groq',
        model: modelName,
        promptLength: prompt.length,
        responseLength: 0,
        success: false,
        error: error.message,
        durationMs: Date.now() - startTime,
      });

      lastError = error;
      if (error.message?.includes('Invalid API key')) throw error;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function generateAIContent(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
  const { aiSettings } = useStore.getState();
  const { geminiKey, groqKey, primaryProvider, enableFallback } = aiSettings;
  const fallbackAvailable =
    primaryProvider === "gemini" ? Boolean(groqKey) : Boolean(geminiKey);

  const tryGemini = async (): Promise<AIResponse> => {
    if (!geminiKey) throw new Error("Gemini API key not configured");
    const text = await callGemini(geminiKey, prompt, options);
    return { text, provider: 'gemini' };
  };

  const tryGroq = async (): Promise<AIResponse> => {
    if (!groqKey) throw new Error("Groq API key not configured");
    const text = await callGroq(groqKey, prompt);
    return { text, provider: 'groq' };
  };

  try {
    if (primaryProvider === 'gemini') {
      return await tryGemini();
    } else {
      return await tryGroq();
    }
  } catch (primaryError: unknown) {
    const pErr = primaryError as Error;
    if (enableFallback && fallbackAvailable) {
      console.warn("[AI] Primary failed, trying fallback...", pErr.message);
      try {
        if (primaryProvider === 'gemini') {
          return await tryGroq();
        } else {
          return await tryGemini();
        }
      } catch (fallbackError: unknown) {
        const fErr = fallbackError as Error;
        const primaryMsg = toFriendlyErrorMessage(pErr.message);
        const fallbackMsg = toFriendlyErrorMessage(fErr.message);
        return { 
          text: "", 
          provider: primaryProvider, 
          error: `All providers failed. Primary (${primaryProvider}): ${primaryMsg} Fallback: ${fallbackMsg}` 
        };
      }
    }
    
    return { 
      text: "", 
      provider: primaryProvider, 
      error: toFriendlyErrorMessage(pErr.message)
    };
  }
}

