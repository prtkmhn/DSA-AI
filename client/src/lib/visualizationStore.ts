/**
 * Visualization Store
 *
 * Zustand store for managing visualization state.
 * Used by the Algorithm Visualizer page and AI-powered visualizations.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type VisualizationType =
  | 'array1d'
  | 'array2d'
  | 'graph'
  | 'chart_bar'
  | 'chart_line'
  | 'chart_scatter'
  | 'log'
  | 'markdown'
  | 'algorithm';

export interface Array1DData {
  values: number[];
  selected: Array<{ start: number; end: number }>;
  colors?: Record<number, string>;
}

export interface Array2DData {
  values: number[][];
  selected: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>;
}

export interface GraphNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  color?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
  directed?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  selectedNode: string | null;
  selectedEdge: { source: string; target: string } | null;
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface ChartData {
  data: ChartDataPoint[];
}

export interface LogMessage {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface LogData {
  messages: LogMessage[];
}

export interface MarkdownData {
  content: string;
}

export interface AlgorithmStep {
  type: string;
  description: string;
  array?: number[];
  indices?: number[];
  values?: number[];
  nodeId?: string;
  edgeId?: { source: string; target: string };
  highlighted?: number[];
  // Allow additional properties for flexibility
  [key: string]: unknown;
}

export interface AlgorithmData {
  name: string;
  steps: AlgorithmStep[];
  currentStep: number;
  array?: number[];
  graph?: GraphData;
}

export interface Visualization {
  id: string;
  type: VisualizationType;
  // Using any for data to allow flexible updates across different visualization types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  title?: string;
}

interface VisualizationState {
  // State
  visualizations: Visualization[];
  explanation: string;
  lastQuestion: string;
  lastUpdatedAt: number;

  // Animation state
  isPlaying: boolean;
  playbackSpeed: number;

  // Actions
  addVisualization: (viz: Visualization) => void;
  updateVisualization: (id: string, data: Partial<Visualization['data']>) => void;
  removeVisualization: (id: string) => void;
  getVisualization: (id: string) => Visualization | undefined;
  clearAll: () => void;
  setExplanation: (content: string) => void;
  setLastQuestion: (question: string) => void;

  // Animation actions
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Tool handlers (for AI-generated tool calls)
  handleArray1DCreate: (id: string, values: number[], title?: string) => void;
  handleArray1DSet: (id: string, values: number[]) => void;
  handleArray1DPatch: (id: string, index: number, value: number) => void;
  handleArray1DSelect: (id: string, startIndex: number, endIndex?: number) => void;
  handleArray1DDeselect: (id: string) => void;

  handleArray2DCreate: (id: string, values: number[][], title?: string) => void;
  handleArray2DPatch: (id: string, row: number, col: number, value: number) => void;
  handleArray2DSelect: (id: string, startRow: number, startCol: number, endRow?: number, endCol?: number) => void;

  handleGraphCreate: (id: string, nodes: GraphNode[], edges: GraphEdge[], directed?: boolean, title?: string) => void;
  handleGraphAddNode: (id: string, nodeId: string, label?: string, x?: number, y?: number) => void;
  handleGraphAddEdge: (id: string, source: string, target: string, weight?: number) => void;
  handleGraphSelectNode: (id: string, nodeId: string | null) => void;
  handleGraphSelectEdge: (id: string, source: string, target: string) => void;

  handleChartCreate: (id: string, chartType: 'bar' | 'line' | 'scatter', data: ChartDataPoint[], title?: string) => void;
  handleChartUpdate: (id: string, data: ChartDataPoint[]) => void;

  handleLogCreate: (id: string, title?: string) => void;
  handleLogPrint: (id: string, message: string, type?: LogMessage['type']) => void;

  handleMarkdownCreate: (id: string, content: string, title?: string) => void;

  handleAlgorithmCreate: (id: string, name: string, steps: AlgorithmStep[], title?: string, options?: {
    array?: number[];
    nodes?: GraphNode[];
    edges?: GraphEdge[];
  }) => void;
  handleAlgorithmSetStep: (id: string, step: number) => void;
}

const initialVisualizationState: Pick<
  VisualizationState,
  'visualizations' | 'explanation' | 'lastQuestion' | 'lastUpdatedAt' | 'isPlaying' | 'playbackSpeed'
> = {
  visualizations: [],
  explanation: '',
  lastQuestion: '',
  lastUpdatedAt: 0,
  isPlaying: false,
  playbackSpeed: 1
};

export const useVisualizationStore = create<VisualizationState>()(
  persist(
    (set, get) => ({
  // Initial state
  ...initialVisualizationState,

  // Core actions
  addVisualization: (viz) => {
    set((state) => {
      // Replace if same ID exists
      const existing = state.visualizations.find(v => v.id === viz.id);
      if (existing) {
        return {
          visualizations: state.visualizations.map(v => v.id === viz.id ? viz : v)
        };
      }
      return {
        visualizations: [...state.visualizations, viz]
      };
    });
  },

  updateVisualization: (id, data) => {
    set((state) => ({
      visualizations: state.visualizations.map((v) =>
        v.id === id ? { ...v, data: { ...v.data, ...data } } : v
      )
    }));
  },

  removeVisualization: (id) => {
    set((state) => ({
      visualizations: state.visualizations.filter((v) => v.id !== id)
    }));
  },

  getVisualization: (id) => {
    return get().visualizations.find((v) => v.id === id);
  },

  clearAll: () => {
    set({
      visualizations: [],
      explanation: '',
      lastQuestion: '',
      lastUpdatedAt: Date.now(),
      isPlaying: false
    });
  },

  setExplanation: (content) => {
    set({
      explanation: content,
      lastUpdatedAt: Date.now()
    });
  },

  setLastQuestion: (question) => {
    set({
      lastQuestion: question,
      lastUpdatedAt: Date.now()
    });
  },

  // Animation actions
  setPlaying: (playing) => {
    set({ isPlaying: playing });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: Math.max(0.25, Math.min(4, speed)) });
  },

  // Array1D handlers
  handleArray1DCreate: (id, values, title) => {
    get().addVisualization({
      id,
      type: 'array1d',
      data: { values, selected: [] } as Array1DData,
      title
    });
  },

  handleArray1DSet: (id, values) => {
    get().updateVisualization(id, { values });
  },

  handleArray1DPatch: (id, index, value) => {
    const viz = get().getVisualization(id);
    if (viz && viz.type === 'array1d') {
      const data = viz.data as Array1DData;
      const newValues = [...data.values];
      newValues[index] = value;
      get().updateVisualization(id, { values: newValues });
    }
  },

  handleArray1DSelect: (id, startIndex, endIndex = startIndex) => {
    get().updateVisualization(id, {
      selected: [{ start: startIndex, end: endIndex }]
    });
  },

  handleArray1DDeselect: (id) => {
    get().updateVisualization(id, { selected: [] });
  },

  // Array2D handlers
  handleArray2DCreate: (id, values, title) => {
    get().addVisualization({
      id,
      type: 'array2d',
      data: { values, selected: [] } as Array2DData,
      title
    });
  },

  handleArray2DPatch: (id, row, col, value) => {
    const viz = get().getVisualization(id);
    if (viz && viz.type === 'array2d') {
      const data = viz.data as Array2DData;
      const newValues = data.values.map((r, ri) =>
        ri === row ? r.map((c, ci) => ci === col ? value : c) : r
      );
      get().updateVisualization(id, { values: newValues });
    }
  },

  handleArray2DSelect: (id, startRow, startCol, endRow = startRow, endCol = startCol) => {
    get().updateVisualization(id, {
      selected: [{ startRow, startCol, endRow, endCol }]
    });
  },

  // Graph handlers
  handleGraphCreate: (id, nodes, edges, directed = false, title) => {
    get().addVisualization({
      id,
      type: 'graph',
      data: { nodes, edges, directed, selectedNode: null, selectedEdge: null } as GraphData,
      title
    });
  },

  handleGraphAddNode: (id, nodeId, label, x, y) => {
    const viz = get().getVisualization(id);
    if (viz && viz.type === 'graph') {
      const data = viz.data as GraphData;
      const newNode: GraphNode = { id: nodeId, label: label || nodeId, x, y };
      get().updateVisualization(id, { nodes: [...data.nodes, newNode] });
    }
  },

  handleGraphAddEdge: (id, source, target, weight) => {
    const viz = get().getVisualization(id);
    if (viz && viz.type === 'graph') {
      const data = viz.data as GraphData;
      const newEdge: GraphEdge = { source, target, weight };
      get().updateVisualization(id, { edges: [...data.edges, newEdge] });
    }
  },

  handleGraphSelectNode: (id, nodeId) => {
    get().updateVisualization(id, { selectedNode: nodeId });
  },

  handleGraphSelectEdge: (id, source, target) => {
    get().updateVisualization(id, { selectedEdge: { source, target } });
  },

  // Chart handlers
  handleChartCreate: (id, chartType, data, title) => {
    get().addVisualization({
      id,
      type: `chart_${chartType}` as VisualizationType,
      data: { data } as ChartData,
      title
    });
  },

  handleChartUpdate: (id, data) => {
    get().updateVisualization(id, { data });
  },

  // Log handlers
  handleLogCreate: (id, title) => {
    get().addVisualization({
      id,
      type: 'log',
      data: { messages: [] } as LogData,
      title
    });
  },

  handleLogPrint: (id, message, type = 'info') => {
    const viz = get().getVisualization(id);
    if (viz && viz.type === 'log') {
      const data = viz.data as LogData;
      const newMessage: LogMessage = { message, type, timestamp: Date.now() };
      get().updateVisualization(id, { messages: [...data.messages, newMessage] });
    }
  },

  // Markdown handlers
  handleMarkdownCreate: (id, content, title) => {
    get().addVisualization({
      id,
      type: 'markdown',
      data: { content } as MarkdownData,
      title
    });
  },

  // Algorithm handlers
  handleAlgorithmCreate: (id, name, steps, title, options) => {
    get().addVisualization({
      id,
      type: 'algorithm',
      data: {
        name,
        steps,
        currentStep: 0,
        array: options?.array,
        graph: options?.nodes && options?.edges ? {
          nodes: options.nodes,
          edges: options.edges,
          directed: false,
          selectedNode: null,
          selectedEdge: null
        } : undefined
      } as AlgorithmData,
      title
    });
  },

  handleAlgorithmSetStep: (id, step) => {
    const viz = get().getVisualization(id);
    if (viz && viz.type === 'algorithm') {
      const data = viz.data as AlgorithmData;
      const clampedStep = Math.max(0, Math.min(step, data.steps.length - 1));
      get().updateVisualization(id, { currentStep: clampedStep });
    }
  },
}),
    {
      name: 'visualization-store-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        visualizations: state.visualizations,
        explanation: state.explanation,
        lastQuestion: state.lastQuestion,
        lastUpdatedAt: state.lastUpdatedAt,
        playbackSpeed: state.playbackSpeed
      }),
      migrate: (persistedState, version) => {
        if (version === 0) {
          const legacy = (persistedState ?? {}) as Partial<VisualizationState>;
          return {
            ...initialVisualizationState,
            visualizations: legacy.visualizations ?? [],
            playbackSpeed: legacy.playbackSpeed ?? 1
          };
        }

        return {
          ...initialVisualizationState,
          ...(persistedState as Partial<VisualizationState>)
        };
      }
    }
  )
);
