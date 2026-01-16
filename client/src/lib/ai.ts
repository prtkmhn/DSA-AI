import { GoogleGenerativeAI } from "@google/generative-ai";
import { useStore } from "./store";

export interface AIResponse {
  text: string;
  provider: 'gemini' | 'groq';
  error?: string;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-pro"];
  
  let lastError: Error | null = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`[AI] Success with ${modelName}`);
      return response.text();
    } catch (e: unknown) {
      const error = e as Error & { status?: number };
      console.warn(`[AI] Model ${modelName} failed:`, error.message);
      lastError = error;
      if (error.message?.includes('401') || error.status === 401) {
        throw new Error('Invalid API key');
      }
    }
  }
  
  throw lastError || new Error('All Gemini models failed');
}

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const modelsToTry = ["llama-3.3-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768"];
  
  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
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
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`${response.status}: ${errMsg}`);
      }

      const data = await response.json();
      console.log(`[AI] Success with ${modelName}`);
      return data.choices[0]?.message?.content || "";
    } catch (e: unknown) {
      const error = e as Error;
      console.warn(`[AI] Model ${modelName} failed:`, error.message);
      lastError = error;
      if (error.message?.includes('Invalid API key')) throw error;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function generateAIContent(prompt: string): Promise<AIResponse> {
  const { aiSettings } = useStore.getState();
  const { geminiKey, groqKey, primaryProvider, enableFallback } = aiSettings;

  const tryGemini = async (): Promise<AIResponse> => {
    if (!geminiKey) throw new Error("Gemini API key not configured");
    const text = await callGemini(geminiKey, prompt);
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
