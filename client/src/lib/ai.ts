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

  // If a specific model is requested, only try that one; otherwise iterate fallback list
  const modelsToTry = options?.model ? [options.model] : AI_CONFIG.geminiModels;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    const startTime = Date.now();
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}${options?.useGrounding ? ' (with grounding)' : ''}`);

      // Build model config — optionally enable Google Search grounding
      const modelConfig: { model: string; tools?: Array<{ googleSearchRetrieval: Record<string, never> }> } = {
        model: modelName,
      };
      if (options?.useGrounding) {
        modelConfig.tools = [{ googleSearchRetrieval: {} }];
      }

      const model = genAI.getGenerativeModel(modelConfig);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
    if (enableFallback) {
      console.warn("[AI] Primary failed, trying fallback...", pErr.message);
      try {
        if (primaryProvider === 'gemini') {
          return await tryGroq();
        } else {
          return await tryGemini();
        }
      } catch (fallbackError: unknown) {
        const fErr = fallbackError as Error;
        return { 
          text: "", 
          provider: primaryProvider, 
          error: `All providers failed.\nPrimary (${primaryProvider}): ${pErr.message}\nFallback: ${fErr.message}` 
        };
      }
    }
    
    return { 
      text: "", 
      provider: primaryProvider, 
      error: pErr.message 
    };
  }
}
