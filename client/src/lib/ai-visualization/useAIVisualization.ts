/**
 * useAIVisualization Hook
 *
 * Integrates AI API calls with the visualization system.
 * Uses the existing DSA-AI AI configuration from the store.
 */

import { useState, useCallback, useRef } from 'react';
import { useVisualizationStore } from '../visualizationStore';
import { useStore } from '../store';
import { AI_CONFIG } from '../config';
import {
  executeToolCalls,
  AIToolCall,
  AIResponse,
  ToolExecutionResult
} from './toolExecutor';
import {
  TOOL_SELECTOR_SYSTEM_PROMPT,
  createToolSelectorUserPrompt,
  MAIN_AI_SYSTEM_PROMPT,
  createMainAIUserPrompt
} from './prompts';
import { getToolByName, TOOL_REGISTRY } from './toolRegistry';

/**
 * State of the AI visualization process
 */
interface AIVisualizationState {
  isSelectingTools: boolean;
  isGeneratingContent: boolean;
  isExecutingTools: boolean;
  selectedTools: string[];
  toolExecutionResults: ToolExecutionResult[];
  error: string | null;
}

/**
 * Result of the complete AI visualization flow
 */
export interface AIVisualizationResult {
  content: string;
  cardData: {
    title: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  };
  visualizationIds: string[];
}

/**
 * Hook for AI-powered visualizations
 */
export function useAIVisualization() {
  const vizStore = useVisualizationStore();
  const { aiSettings } = useStore();

  const [state, setState] = useState<AIVisualizationState>({
    isSelectingTools: false,
    isGeneratingContent: false,
    isExecutingTools: false,
    selectedTools: [],
    toolExecutionResults: [],
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Step 1: Select tools using fast AI (Gemini Flash)
   */
  const selectTools = useCallback(async (userQuestion: string): Promise<string[]> => {
    setState(prev => ({ ...prev, isSelectingTools: true, error: null }));

    try {
      const response = await callGeminiAPI({
        apiKey: aiSettings.geminiKey,
        model: AI_CONFIG.geminiModels[0],
        systemPrompt: TOOL_SELECTOR_SYSTEM_PROMPT,
        userPrompt: createToolSelectorUserPrompt(userQuestion),
        temperature: 0.3,
        maxTokens: 500
      });

      const parsed = parseToolSelectionResponse(response.text, userQuestion);
      const tools = parsed.tools.map(t => t.tool);

      setState(prev => ({
        ...prev,
        isSelectingTools: false,
        selectedTools: tools
      }));

      return tools;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSelectingTools: false,
        error: `Tool selection failed: ${(error as Error).message}`
      }));
      throw error;
    }
  }, [aiSettings.geminiKey]);

  /**
   * Step 2: Generate content and tool calls using main AI (Gemini Pro)
   */
  const generateContent = useCallback(async (
    userQuestion: string,
    selectedTools: string[],
    conversationHistory?: string[]
  ): Promise<AIResponse> => {
    setState(prev => ({ ...prev, isGeneratingContent: true, error: null }));

    try {
      // Build tool schemas for the selected tools
      const toolSchemas = selectedTools.map(toolName => {
        const tool = getToolByName(toolName);
        return tool ? {
          name: toolName,
          description: tool.description,
          parameters: tool.parameters
        } : null;
      }).filter(Boolean);

      const systemPrompt = `${MAIN_AI_SYSTEM_PROMPT}\n\n## Available Tools for This Request\n${JSON.stringify(toolSchemas, null, 2)}`;

      const response = await callGeminiAPI({
        apiKey: aiSettings.geminiKey,
        model: AI_CONFIG.chatbotModel,
        systemPrompt,
        userPrompt: createMainAIUserPrompt(userQuestion, selectedTools, conversationHistory),
        temperature: 0.7,
        maxTokens: 4000,
        enableGrounding: shouldUseGrounding(userQuestion)
      });

      const parsedResponse = parseAIResponse(response.text);

      if (response.grounding?.sources?.length) {
        const sourceLines = dedupeSources(response.grounding.sources)
          .slice(0, 6)
          .map((source, index) => `${index + 1}. [${source.title || source.uri}](${source.uri})`);

        if (sourceLines.length > 0) {
          parsedResponse.content = `${parsedResponse.content}\n\n### Sources\n${sourceLines.join('\n')}`;
        }
      }
      setState(prev => ({ ...prev, isGeneratingContent: false }));

      return parsedResponse;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingContent: false,
        error: `Content generation failed: ${(error as Error).message}`
      }));
      throw error;
    }
  }, [aiSettings.geminiKey]);

  /**
   * Step 3: Execute tool calls
   */
  const executeTools = useCallback(async (toolCalls: AIToolCall[]): Promise<ToolExecutionResult[]> => {
    setState(prev => ({ ...prev, isExecutingTools: true, error: null }));

    try {
      const storeState = useVisualizationStore.getState();
      const results = executeToolCalls(toolCalls, storeState);

      setState(prev => ({
        ...prev,
        isExecutingTools: false,
        toolExecutionResults: results
      }));

      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExecutingTools: false,
        error: `Tool execution failed: ${(error as Error).message}`
      }));
      throw error;
    }
  }, []);

  /**
   * Complete flow: Select tools → Generate content → Execute tools
   */
  const createVisualization = useCallback(async (
    userQuestion: string,
    options?: {
      skipToolSelection?: boolean;
      preselectedTools?: string[];
      conversationHistory?: string[];
    }
  ): Promise<AIVisualizationResult> => {
    abortControllerRef.current = new AbortController();

    try {
      vizStore.setLastQuestion(userQuestion);
      const groundedContext = await resolveGroundedProblemContext({
        apiKey: aiSettings.geminiKey,
        userQuestion
      });
      const enrichedQuestion = groundedContext
        ? `${userQuestion}\n\nGrounded Problem Context:\n${groundedContext}`
        : userQuestion;

      // Step 1: Select tools (or use preselected)
      let selectedTools: string[];
      if (options?.skipToolSelection && options.preselectedTools) {
        selectedTools = options.preselectedTools;
        setState(prev => ({ ...prev, selectedTools }));
      } else {
        selectedTools = await selectTools(enrichedQuestion);
      }

      // Step 2: Generate content with tool calls
      const aiResponse = await generateContent(
        enrichedQuestion,
        selectedTools,
        options?.conversationHistory
      );

      // Step 3: Execute tool calls
      const results = await executeTools(aiResponse.toolCalls);

      // Collect visualization IDs
      const visualizationIds = results
        .filter(r => r.success && r.visualizationId)
        .map(r => r.visualizationId!);

      vizStore.setExplanation(aiResponse.content);

      return {
        content: aiResponse.content,
        cardData: {
          title: aiResponse.cardData?.title || 'Algorithm Explanation',
          tags: aiResponse.cardData?.tags || ['algorithm'],
          difficulty: aiResponse.cardData?.difficulty || 'medium'
        },
        visualizationIds
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Visualization creation was cancelled');
      }
      throw error;
    }
  }, [vizStore, selectTools, generateContent, executeTools, aiSettings.geminiKey]);

  /**
   * Cancel ongoing operations
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({
      ...prev,
      isSelectingTools: false,
      isGeneratingContent: false,
      isExecutingTools: false
    }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isSelectingTools: false,
      isGeneratingContent: false,
      isExecutingTools: false,
      selectedTools: [],
      toolExecutionResults: [],
      error: null
    });
  }, []);

  const isLoading = state.isSelectingTools || state.isGeneratingContent || state.isExecutingTools;

  return {
    state,
    isLoading,
    selectTools,
    generateContent,
    executeTools,
    createVisualization,
    cancel,
    reset
  };
}

// ============================================================================
// AI API Caller
// ============================================================================

interface GeminiAPIParams {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  enableGrounding?: boolean;
}

interface GeminiAPIResult {
  text: string;
  grounding?: {
    webSearchQueries: string[];
    sources: Array<{ title: string; uri: string }>;
  };
}

async function callGeminiAPI(params: GeminiAPIParams): Promise<GeminiAPIResult> {
  if (!params.apiKey) {
    throw new Error('Gemini API key not configured. Please add it in Settings.');
  }

  console.log(`[AI] Calling model: ${params.model}`);

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(params.apiKey);
  const model = genAI.getGenerativeModel({ model: params.model });

  try {
    const payload: any = {
      contents: [
        { role: 'user', parts: [{ text: params.systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
        { role: 'user', parts: [{ text: params.userPrompt }] }
      ],
      generationConfig: {
        temperature: params.temperature,
        maxOutputTokens: params.maxTokens
      }
    };

    if (params.enableGrounding) {
      payload.tools = [{ googleSearch: {} }];
    }

    let result;
    try {
      result = await model.generateContent(payload);
    } catch (error) {
      const msg = (error as Error).message.toLowerCase();
      const groundingUnsupported =
        msg.includes('google_search_retrieval not supported') ||
        msg.includes('google_search tool not supported') ||
        msg.includes('please use google_search tool instead');

      if (params.enableGrounding && groundingUnsupported) {
        delete payload.tools;
        result = await model.generateContent(payload);
      } else {
        throw error;
      }
    }

    const text = result.response.text();
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    const sources = (groundingMetadata?.groundingChunks || [])
      .map((chunk) => ({
        title: chunk.web?.title || '',
        uri: chunk.web?.uri || ''
      }))
      .filter((source) => source.uri);

    console.log(`[AI] Response length: ${text.length} chars`);
    return {
      text,
      grounding: groundingMetadata ? {
        webSearchQueries: groundingMetadata.webSearchQueries || [],
        sources
      } : undefined
    };
  } catch (error) {
    console.error(`[AI] API error for model ${params.model}:`, error);
    throw error;
  }
}

// ============================================================================
// Response Parsers
// ============================================================================

interface ToolSelectionParsed {
  tools: Array<{ tool: string; reason: string; priority: number }>;
}

/**
 * Strip markdown code fences (```json ... ```) that AI models often wrap around JSON.
 */
function stripCodeFences(text: string): string {
  return text.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g, '$1').trim();
}

function parseToolSelectionResponse(response: string, userQuestion: string): ToolSelectionParsed {
  try {
    const cleaned = stripCodeFences(response);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ToolSelectionParsed;
      const validToolNames = new Set(TOOL_REGISTRY.map((tool) => tool.name));
      const tools = (parsed.tools || []).filter((entry) => validToolNames.has(entry.tool));
      if (tools.length > 0) {
        return {
          ...parsed,
          tools
        };
      }
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Failed to parse tool selection:', error, '\nRaw response:', response);
    // Fallback: use algorithm tools instead of text-only tools
    return {
      tools: inferToolsFromQuestion(userQuestion)
    };
  }
}

function parseAIResponse(response: string): AIResponse {
  try {
    const cleaned = stripCodeFences(response);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const normalizedToolCalls = normalizeToolCalls(parsed.toolCalls);
      const content = normalizeContent(parsed.content);

      if (!content) {
        throw new Error('Missing content field');
      }

      const cardData = isRecord(parsed.cardData) ? parsed.cardData : {};
      const difficulty = cardData.difficulty;

      return {
        content,
        toolCalls: normalizedToolCalls,
        cardData: {
          title: typeof cardData.title === 'string' ? cardData.title : 'Algorithm Explanation',
          tags: Array.isArray(cardData.tags) ? cardData.tags.filter((tag): tag is string => typeof tag === 'string') : ['algorithm'],
          difficulty: difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard' ? difficulty : 'medium'
        }
      };
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Failed to parse AI response:', error, '\nRaw response:', response);
    // Return a fallback response
    return {
      content: normalizeContent(response),
      toolCalls: [],
      cardData: {
        title: 'Algorithm Explanation',
        tags: ['algorithm'],
        difficulty: 'medium'
      }
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeToolCalls(rawToolCalls: unknown): AIToolCall[] {
  if (!Array.isArray(rawToolCalls)) return [];

  return rawToolCalls.reduce<AIToolCall[]>((acc, entry, index) => {
      if (!isRecord(entry)) return acc;

      const tool =
        typeof entry.tool === 'string'
          ? entry.tool
          : typeof entry.name === 'string'
          ? entry.name
          : typeof entry.function === 'string'
          ? entry.function
          : '';

      if (!tool || !getToolByName(tool)) return acc;

      const rawParams = entry.params ?? entry.arguments ?? entry.args ?? {};

      const parsedParams = typeof rawParams === 'string'
        ? tryParseJsonObject(rawParams) || {}
        : isRecord(rawParams)
        ? rawParams
        : {};

      const id = typeof entry.id === 'string' && entry.id.trim().length > 0
        ? entry.id
        : `${tool}_${Date.now()}_${index}`;

      const description = typeof entry.description === 'string' ? entry.description : undefined;

      acc.push({
        tool,
        id,
        params: parsedParams,
        description
      });

      return acc;
    }, []);
}

function tryParseJsonObject(value: string): Record<string, unknown> | null {
  const cleaned = stripCodeFences(value).trim();
  if (!cleaned.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(cleaned);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeContent(rawContent: unknown): string {
  if (typeof rawContent !== 'string') return '';

  const cleaned = stripCodeFences(rawContent).trim();
  if (!cleaned) return '';

  const nestedJson = tryParseJsonObject(cleaned);
  if (nestedJson && typeof nestedJson.content === 'string') {
    return normalizeContent(nestedJson.content);
  }

  return cleaned;
}

function inferToolsFromQuestion(userQuestion: string): Array<{ tool: string; reason: string; priority: number }> {
  const lowerQuestion = userQuestion.toLowerCase();

  const isBSTSearch =
    (lowerQuestion.includes('bst') || lowerQuestion.includes('binary search tree')) &&
    (lowerQuestion.includes('search') || lowerQuestion.includes('find'));

  if (isBSTSearch) {
    return [
      { tool: 'algorithm_bst_search', reason: 'Directly visualize BST search path for the target', priority: 1 },
      { tool: 'log_create', reason: 'Show the search decisions step-by-step', priority: 2 }
    ];
  }

  if (lowerQuestion.includes('binary search')) {
    return [
      { tool: 'algorithm_binary_search', reason: 'Visualize divide-and-conquer search steps', priority: 1 },
      { tool: 'log_create', reason: 'Explain each midpoint comparison', priority: 2 }
    ];
  }

  if (lowerQuestion.includes('dfs')) {
    return [
      { tool: 'algorithm_dfs', reason: 'Visualize DFS traversal order', priority: 1 },
      { tool: 'log_create', reason: 'Explain recursive stack behavior', priority: 2 }
    ];
  }

  if (lowerQuestion.includes('bfs')) {
    return [
      { tool: 'algorithm_bfs', reason: 'Visualize BFS queue-driven traversal', priority: 1 },
      { tool: 'log_create', reason: 'Explain layer-by-layer traversal', priority: 2 }
    ];
  }

  if (lowerQuestion.includes('dijkstra') || lowerQuestion.includes('shortest path')) {
    return [
      { tool: 'algorithm_dijkstra', reason: 'Visualize shortest-path relaxation updates', priority: 1 },
      { tool: 'log_create', reason: 'Show distance table updates', priority: 2 }
    ];
  }

  return [
    { tool: 'algorithm_bubble_sort', reason: 'Fallback algorithm visualization', priority: 1 },
    { tool: 'log_create', reason: 'Provide step-by-step explanation', priority: 2 }
  ];
}

function shouldUseGrounding(userQuestion: string): boolean {
  const lowerQuestion = userQuestion.toLowerCase();
  return (
    lowerQuestion.includes('leetcode') ||
    lowerQuestion.includes('problem') ||
    /lc\s*\d+/.test(lowerQuestion) ||
    /\b\d{2,5}\b/.test(lowerQuestion)
  );
}

function dedupeSources(sources: Array<{ title: string; uri: string }>): Array<{ title: string; uri: string }> {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (!source.uri || seen.has(source.uri)) return false;
    seen.add(source.uri);
    return true;
  });
}

interface GroundedProblemContextParams {
  apiKey: string;
  userQuestion: string;
}

async function resolveGroundedProblemContext(
  params: GroundedProblemContextParams
): Promise<string | null> {
  if (!shouldUseGrounding(params.userQuestion)) {
    return null;
  }

  const systemPrompt = `You resolve coding-problem prompts into normalized context.
Return ONLY JSON with this schema:
{
  "title": "string",
  "platform": "string",
  "problemId": "string",
  "summary": "string",
  "keyDataStructures": ["string"],
  "canonicalInputHint": "string",
  "constraintsHint": "string"
}
If unknown, use empty string for scalar fields and [] for arrays.`;

  const userPrompt = `Problem request: "${params.userQuestion}"
Use grounded web lookup and return only the JSON object.`;

  try {
    const response = await callGeminiAPI({
      apiKey: params.apiKey,
      model: AI_CONFIG.geminiModels[0],
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 700,
      enableGrounding: true
    });

    const cleaned = stripCodeFences(response.text);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const title = typeof parsed.title === 'string' ? parsed.title : '';
    const platform = typeof parsed.platform === 'string' ? parsed.platform : '';
    const problemId = typeof parsed.problemId === 'string' ? parsed.problemId : '';
    const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
    const structures = Array.isArray(parsed.keyDataStructures)
      ? parsed.keyDataStructures.filter((item): item is string => typeof item === 'string')
      : [];
    const canonicalInputHint = typeof parsed.canonicalInputHint === 'string' ? parsed.canonicalInputHint : '';
    const constraintsHint = typeof parsed.constraintsHint === 'string' ? parsed.constraintsHint : '';

    const sourceList = dedupeSources(response.grounding?.sources || [])
      .slice(0, 3)
      .map((source) => `${source.title || source.uri}: ${source.uri}`);

    return [
      title ? `Title: ${title}` : '',
      platform ? `Platform: ${platform}` : '',
      problemId ? `Problem ID: ${problemId}` : '',
      summary ? `Summary: ${summary}` : '',
      structures.length ? `Key Data Structures: ${structures.join(', ')}` : '',
      canonicalInputHint ? `Canonical Input Hint: ${canonicalInputHint}` : '',
      constraintsHint ? `Constraints Hint: ${constraintsHint}` : '',
      sourceList.length ? `Grounded Sources:\n${sourceList.join('\n')}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  } catch (error) {
    console.warn('[AI] Grounded problem context lookup failed, continuing without it.', error);
    return null;
  }
}
