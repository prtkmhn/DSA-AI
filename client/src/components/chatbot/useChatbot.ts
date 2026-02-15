import { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "./ChatMessage";
import { useStore } from "@/lib/store";
import { AI_CONFIG } from "@/lib/config";
import { buildTutorSystemPrompt, buildProblemRegenerationPrompt } from "@/lib/prompts";

export interface ChatbotContext {
  problemTitle: string;
  problemDescription: string;
  blocks: Array<{
    id: string;
    text: string;
    indent: number;
    isBlank?: boolean;
    placeholder?: string;
  }>;
  testCases: Array<{ input: any; expected: any }>;
  testHarness: string;
  // Optional: current test error for context
  testError?: string;
  testResults?: Array<{ input: string; expected: string; actual: string; passed: boolean }>;
  // Actual user code for smarter AI tutoring
  assembledCode?: string;
  blankValues?: Record<string, string>;
}

interface UseChatbotOptions {
  context: ChatbotContext;
}

export function useChatbot({ context }: UseChatbotOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { aiSettings } = useStore();

  // Stop current generation
  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  }, [abortController]);

  const buildSystemPrompt = () => {
    // If we have the actual assembled code, show that instead of [BLANK] placeholders
    const blocksCode = context.assembledCode
      ? context.assembledCode
      : context.blocks
          .map((b) => {
            const indent = "    ".repeat(b.indent);
            if (b.isBlank) {
              return `${indent}[BLANK: ${b.placeholder || "fill in"}]`;
            }
            return `${indent}${b.text}`;
          })
          .join("\n");

    // Build blank details so the AI knows which lines are user-editable
    let blankDetails = "";
    if (context.blankValues) {
      const blankBlocks = context.blocks.filter(b => b.isBlank);
      if (blankBlocks.length > 0) {
        blankDetails = "\n\nEDITABLE BLANK LINES:\n" + blankBlocks.map(b => {
          const userTyped = context.blankValues?.[b.id] || "";
          return `- ${b.id} (hint: "${b.placeholder || "fill in"}"): user typed "${userTyped}"`;
        }).join("\n");
      }
    }

    let errorContext = "";
    if (context.testError) {
      errorContext = `\n\nCURRENT ERROR:\n\`\`\`\n${context.testError}\n\`\`\``;
    }
    if (context.testResults && context.testResults.length > 0) {
      const failedTests = context.testResults.filter(r => !r.passed);
      if (failedTests.length > 0) {
        errorContext += `\n\nFAILED TEST CASES:\n${failedTests.map(t =>
          `- Input: ${t.input}\n  Expected: ${t.expected}\n  Got: ${t.actual}`
        ).join("\n")}`;
      }
    }

    return buildTutorSystemPrompt({
      problemTitle: context.problemTitle,
      problemDescription: context.problemDescription,
      blocksCode,
      blankDetails,
      testCases: context.testCases,
      errorContext,
    });
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!aiSettings.geminiKey) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Please configure your Gemini API key in Settings first.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const genAI = new GoogleGenerativeAI(aiSettings.geminiKey);
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.chatbotModel });

        // Build conversation history
        const history = messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: buildSystemPrompt() }] },
            { role: "model", parts: [{ text: "I understand. I'm ready to help with this Faded Parsons problem. How can I assist you?" }] },
            ...history,
          ],
        });

        const result = await chat.sendMessage(content);
        const response = await result.response;
        const text = response.text();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("[Chatbot] Error:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${(error as Error).message}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, aiSettings.geminiKey, context]
  );

  // Send message with optional image attachment
  const sendMessageWithImage = useCallback(
    async (content: string, imageBase64?: string) => {
      if (!aiSettings.geminiKey) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Please configure your Gemini API key in Settings first.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      // Add user message (with image if provided)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        image: imageBase64,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const genAI = new GoogleGenerativeAI(aiSettings.geminiKey);
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.chatbotModel });

        // Build parts with text and optional image
        const parts: any[] = [{ text: `${buildSystemPrompt()}\n\nUser question: ${content}` }];

        if (imageBase64) {
          // Extract base64 data from data URL
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("[Chatbot] Error:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${(error as Error).message}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, aiSettings.geminiKey, context]
  );

  const generateImage = useCallback(
    async (description: string): Promise<string | null> => {
      if (!aiSettings.geminiKey) {
        return null;
      }

      setIsLoading(true);
      try {
        const genAI = new GoogleGenerativeAI(aiSettings.geminiKey);

        // First, use the chatbot model to generate a good image prompt
        const promptModel = genAI.getGenerativeModel({ model: AI_CONFIG.chatbotModel });
        const promptResult = await promptModel.generateContent(
          `Create a detailed image generation prompt to visually explain this coding concept.
The image should be educational, clear, and help visualize the algorithm/data structure.

Problem: ${context.problemTitle}
Description: ${context.problemDescription}
User's request: ${description}

Return ONLY the image prompt, nothing else. Make it specific and descriptive.
Focus on: diagrams, flowcharts, step-by-step visuals, or data structure illustrations.`
        );
        const imagePrompt = promptResult.response.text();
        console.log("[Chatbot] Generated image prompt:", imagePrompt);

        // Generate the image using the image model
        // IMPORTANT: responseModalities must be uppercase ['TEXT', 'IMAGE']
        const imageModel = genAI.getGenerativeModel({ model: AI_CONFIG.imageModel });
        const imageResult = await imageModel.generateContent({
          contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
          // @ts-ignore - generationConfig with responseModalities
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"], // UPPERCASE required!
          },
        });

        const response = imageResult.response;
        console.log("[Chatbot] Image response:", response);

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          // @ts-ignore - inlineData exists on image response parts
          if (part.inlineData) {
            // @ts-ignore
            const base64 = part.inlineData.data;
            // @ts-ignore
            const mimeType = part.inlineData.mimeType || "image/png";
            console.log("[Chatbot] Image generated successfully");
            return `data:${mimeType};base64,${base64}`;
          }
        }

        console.log("[Chatbot] No image in response, parts:", response.candidates?.[0]?.content?.parts);
        return null;
      } catch (error) {
        console.error("[Chatbot] Image generation error:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [aiSettings.geminiKey, context]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Generate a new problem (returns parsed JSON, doesn't add to chat)
  const generateNewProblem = useCallback(
    async (): Promise<any | null> => {
      if (!aiSettings.geminiKey) {
        return null;
      }

      setIsLoading(true);
      try {
        const genAI = new GoogleGenerativeAI(aiSettings.geminiKey);
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.chatbotModel });

        const prompt = buildProblemRegenerationPrompt(context.problemTitle);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("[Chatbot] New problem response:", text);

        // Parse the JSON
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) {
          console.error("[Chatbot] No JSON found in response");
          return null;
        }

        const jsonStr = text.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);

        if (!parsed.title || !parsed.blocks || !Array.isArray(parsed.blocks)) {
          console.error("[Chatbot] Invalid problem format");
          return null;
        }

        return parsed;
      } catch (error) {
        console.error("[Chatbot] Generate problem error:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [aiSettings.geminiKey, context]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    sendMessageWithImage,
    generateImage,
    generateNewProblem,
    clearMessages,
    stopGeneration,
  };
}
