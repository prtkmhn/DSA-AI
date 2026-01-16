import { GoogleGenerativeAI } from "@google/generative-ai";
import { useStore } from "./store";

export interface AIResponse {
  text: string;
  provider: 'gemini' | 'groq';
  error?: string;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192", // Fast, efficient model
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export async function generateAIContent(prompt: string): Promise<AIResponse> {
  const { aiSettings } = useStore.getState();
  const { geminiKey, groqKey, primaryProvider, enableFallback } = aiSettings;

  const tryGemini = async (): Promise<AIResponse> => {
    if (!geminiKey) throw new Error("Gemini API key not found");
    try {
      const text = await callGemini(geminiKey, prompt);
      return { text, provider: 'gemini' };
    } catch (e: any) {
      console.error("Gemini Error:", e);
      throw e;
    }
  };

  const tryGroq = async (): Promise<AIResponse> => {
    if (!groqKey) throw new Error("Groq API key not found");
    try {
      const text = await callGroq(groqKey, prompt);
      return { text, provider: 'groq' };
    } catch (e: any) {
      console.error("Groq Error:", e);
      throw e;
    }
  };

  // Execution Logic
  try {
    if (primaryProvider === 'gemini') {
      return await tryGemini();
    } else {
      return await tryGroq();
    }
  } catch (primaryError) {
    if (enableFallback) {
      console.warn("Primary provider failed, attempting fallback...");
      try {
        if (primaryProvider === 'gemini') {
          return await tryGroq();
        } else {
          return await tryGemini();
        }
      } catch (fallbackError) {
        return { 
          text: "", 
          provider: primaryProvider, 
          error: "All providers failed. Please check your API keys." 
        };
      }
    }
    
    return { 
      text: "", 
      provider: primaryProvider, 
      error: "Primary provider failed and fallback is disabled." 
    };
  }
}
