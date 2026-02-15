/**
 * Visualization Controller
 *
 * Executes MCP visualization commands and renders the appropriate visualizer.
 * This component bridges the AI-generated commands with the actual visualization components.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { MCPCommand, VisualizationType } from '@/lib/pipeline/types';

// =============================================================================
// Types
// =============================================================================

interface VisualizationState {
  // Array state
  array: any[];
  arrayHighlighted: number[];
  arrayPointers: Record<string, number>;

  // HashMap state
  hashmap: Record<string, any>;
  hashmapHighlighted: string[];

  // Stack state
  stack: any[];
  stackHighlighted: number | null;

  // Queue state
  queue: any[];
  queueHighlighted: number | null;

  // Tree state
  tree: any;
  treeHighlighted: number[];

  // Graph state
  graphNodes: { id: string; x: number; y: number; visited?: boolean }[];
  graphEdges: { from: string; to: string; weight?: number }[];
  graphPath: string[];

  // LinkedList state
  linkedList: any[];
  linkedListHighlighted: number[];

  // Matrix state
  matrix: any[][];
  matrixHighlighted: [number, number][];

  // Heap state
  heap: any[];
  heapType: 'min' | 'max';

  // General state
  message: string;
  variables: Record<string, any>;
}

interface VisualizationControllerProps {
  type: VisualizationType;
  commands: MCPCommand[];
  autoPlay?: boolean;
  speed?: number; // 0.5 - 3x
  onComplete?: () => void;
  className?: string;
}

const initialState: VisualizationState = {
  array: [],
  arrayHighlighted: [],
  arrayPointers: {},
  hashmap: {},
  hashmapHighlighted: [],
  stack: [],
  stackHighlighted: null,
  queue: [],
  queueHighlighted: null,
  tree: null,
  treeHighlighted: [],
  graphNodes: [],
  graphEdges: [],
  graphPath: [],
  linkedList: [],
  linkedListHighlighted: [],
  matrix: [],
  matrixHighlighted: [],
  heap: [],
  heapType: 'min',
  message: '',
  variables: {}
};

// =============================================================================
// Command Executor
// =============================================================================

function executeCommand(
  state: VisualizationState,
  command: MCPCommand
): VisualizationState {
  const newState = { ...state };
  const { tool, args } = command;

  switch (tool) {
    // Array commands
    case 'array_init':
      newState.array = args.data || [];
      newState.arrayHighlighted = [];
      newState.arrayPointers = {};
      break;

    case 'array_highlight':
      newState.arrayHighlighted = args.indices || [];
      break;

    case 'array_pointer':
      newState.arrayPointers = {
        ...state.arrayPointers,
        [args.name]: args.index
      };
      break;

    case 'array_swap':
      const arrCopy = [...state.array];
      [arrCopy[args.i], arrCopy[args.j]] = [arrCopy[args.j], arrCopy[args.i]];
      newState.array = arrCopy;
      newState.arrayHighlighted = [args.i, args.j];
      break;

    // HashMap commands
    case 'hashmap_init':
      newState.hashmap = {};
      newState.hashmapHighlighted = [];
      break;

    case 'hashmap_set':
      newState.hashmap = {
        ...state.hashmap,
        [args.key]: args.value
      };
      newState.hashmapHighlighted = [args.key];
      break;

    case 'hashmap_get':
      newState.hashmapHighlighted = [args.key];
      break;

    case 'hashmap_delete':
      const hmCopy = { ...state.hashmap };
      delete hmCopy[args.key];
      newState.hashmap = hmCopy;
      break;

    // Stack commands
    case 'stack_init':
      newState.stack = [];
      newState.stackHighlighted = null;
      break;

    case 'stack_push':
      newState.stack = [...state.stack, args.value];
      newState.stackHighlighted = state.stack.length;
      break;

    case 'stack_pop':
      newState.stack = state.stack.slice(0, -1);
      newState.stackHighlighted = null;
      break;

    case 'stack_peek':
      newState.stackHighlighted = state.stack.length - 1;
      break;

    // Queue commands
    case 'queue_init':
      newState.queue = [];
      newState.queueHighlighted = null;
      break;

    case 'queue_enqueue':
      newState.queue = [...state.queue, args.value];
      newState.queueHighlighted = state.queue.length;
      break;

    case 'queue_dequeue':
      newState.queue = state.queue.slice(1);
      newState.queueHighlighted = 0;
      break;

    // Tree commands
    case 'tree_init':
      newState.tree = args.data;
      newState.treeHighlighted = [];
      break;

    case 'tree_highlight':
      newState.treeHighlighted = args.values || [];
      break;

    case 'tree_insert':
      // For BST insertion - would need full implementation
      newState.treeHighlighted = [args.value];
      break;

    // Graph commands
    case 'graph_init':
      newState.graphNodes = args.nodes || [];
      newState.graphEdges = args.edges || [];
      newState.graphPath = [];
      break;

    case 'graph_add_node':
      newState.graphNodes = [
        ...state.graphNodes,
        { id: args.id, x: args.x, y: args.y }
      ];
      break;

    case 'graph_add_edge':
      newState.graphEdges = [
        ...state.graphEdges,
        { from: args.from, to: args.to, weight: args.weight }
      ];
      break;

    case 'graph_visit_node':
      newState.graphNodes = state.graphNodes.map(n =>
        n.id === args.id ? { ...n, visited: true } : n
      );
      break;

    case 'graph_highlight_path':
      newState.graphPath = args.path || [];
      break;

    // LinkedList commands
    case 'linkedlist_init':
      newState.linkedList = args.values || [];
      newState.linkedListHighlighted = [];
      break;

    case 'linkedlist_highlight':
      newState.linkedListHighlighted = args.indices || [];
      break;

    // Matrix commands
    case 'matrix_init':
      newState.matrix = args.data || [];
      newState.matrixHighlighted = [];
      break;

    case 'matrix_highlight':
      newState.matrixHighlighted = args.cells || [];
      break;

    case 'matrix_set':
      const matCopy = state.matrix.map(row => [...row]);
      if (matCopy[args.row]) {
        matCopy[args.row][args.col] = args.value;
      }
      newState.matrix = matCopy;
      break;

    // Heap commands
    case 'heap_init':
      newState.heap = [];
      newState.heapType = args.type || 'min';
      break;

    case 'heap_insert':
      newState.heap = [...state.heap, args.value];
      break;

    case 'heap_extract':
      newState.heap = state.heap.slice(1);
      break;

    // General commands
    case 'set_message':
      newState.message = args.text || '';
      break;

    case 'set_variables':
      newState.variables = {
        ...state.variables,
        ...args.variables
      };
      break;

    case 'clear':
      return { ...initialState };

    default:
      console.warn('Unknown command:', tool);
  }

  // Always update message from command
  if (command.message) {
    newState.message = command.message;
  }

  return newState;
}

// =============================================================================
// Visualization Components
// =============================================================================

function ArrayVisualization({ state }: { state: VisualizationState }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1">
        {state.array.map((value, index) => {
          const isHighlighted = state.arrayHighlighted.includes(index);
          const pointerNames = Object.entries(state.arrayPointers)
            .filter(([_, idx]) => idx === index)
            .map(([name]) => name);

          return (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isHighlighted ? 1.1 : 1,
                opacity: 1
              }}
              className="relative"
            >
              {pointerNames.length > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-purple-400">
                  {pointerNames.join(', ')}
                </div>
              )}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg font-mono text-lg border-2 transition-all ${
                  isHighlighted
                    ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                {value}
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-zinc-500">
                {index}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function HashMapVisualization({ state }: { state: VisualizationState }) {
  const entries = Object.entries(state.hashmap);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-zinc-400 mb-2">HashMap</div>
      <div className="grid grid-cols-2 gap-2 max-w-md">
        {entries.length === 0 ? (
          <div className="col-span-2 text-zinc-500 text-center py-4">Empty</div>
        ) : (
          entries.map(([key, value]) => {
            const isHighlighted = state.hashmapHighlighted.includes(key);
            return (
              <motion.div
                key={key}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  isHighlighted
                    ? 'bg-purple-500/30 border border-purple-500'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                <span className="font-mono text-purple-400">{key}</span>
                <span className="text-zinc-500">→</span>
                <span className="font-mono text-zinc-300">{value}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StackVisualization({ state }: { state: VisualizationState }) {
  return (
    <div className="flex flex-col-reverse gap-1 items-center">
      <div className="text-xs text-zinc-500 mt-2">Bottom</div>
      {state.stack.length === 0 ? (
        <div className="text-zinc-500 py-4">Empty Stack</div>
      ) : (
        state.stack.map((value, index) => (
          <motion.div
            key={index}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className={`w-20 h-10 flex items-center justify-center rounded-lg font-mono border-2 ${
              state.stackHighlighted === index
                ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            {value}
          </motion.div>
        ))
      )}
      <div className="text-xs text-zinc-500 mb-2">Top ↑</div>
    </div>
  );
}

function QueueVisualization({ state }: { state: VisualizationState }) {
  return (
    <div className="flex gap-1 items-center">
      <div className="text-xs text-zinc-500 mr-2">Front →</div>
      {state.queue.length === 0 ? (
        <div className="text-zinc-500 py-4">Empty Queue</div>
      ) : (
        state.queue.map((value, index) => (
          <motion.div
            key={index}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`w-12 h-12 flex items-center justify-center rounded-lg font-mono border-2 ${
              state.queueHighlighted === index
                ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            {value}
          </motion.div>
        ))
      )}
      <div className="text-xs text-zinc-500 ml-2">← Back</div>
    </div>
  );
}

function LinkedListVisualization({ state }: { state: VisualizationState }) {
  return (
    <div className="flex items-center gap-2">
      {state.linkedList.map((value, index) => (
        <React.Fragment key={index}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1 p-2 rounded-lg border-2 ${
              state.linkedListHighlighted.includes(index)
                ? 'bg-purple-500/30 border-purple-500'
                : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            <span className="font-mono text-zinc-300">{value}</span>
          </motion.div>
          {index < state.linkedList.length - 1 && (
            <span className="text-zinc-500">→</span>
          )}
        </React.Fragment>
      ))}
      {state.linkedList.length > 0 && (
        <span className="text-zinc-500">→ null</span>
      )}
    </div>
  );
}

function MatrixVisualization({ state }: { state: VisualizationState }) {
  const isHighlighted = (row: number, col: number) =>
    state.matrixHighlighted.some(([r, c]) => r === row && c === col);

  return (
    <div className="flex flex-col gap-1">
      {state.matrix.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1">
          {row.map((cell, colIdx) => (
            <motion.div
              key={`${rowIdx}-${colIdx}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-10 h-10 flex items-center justify-center rounded font-mono text-sm border ${
                isHighlighted(rowIdx, colIdx)
                  ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                  : cell === 1 || cell === '1'
                  ? 'bg-emerald-500/30 border-emerald-600 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {cell}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

function VariablesDisplay({ variables }: { variables: Record<string, any> }) {
  const entries = Object.entries(variables);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full text-sm"
        >
          <span className="text-zinc-400">{key}:</span>
          <span className="font-mono text-purple-400">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Controller Component
// =============================================================================

export function VisualizationController({
  type,
  commands,
  autoPlay = false,
  speed = 1,
  onComplete,
  className = ''
}: VisualizationControllerProps) {
  const [state, setState] = useState<VisualizationState>(initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = commands.length;

  // Execute command at current step
  const executeStep = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps) return;

    // Build state from beginning up to current step
    let newState = { ...initialState };
    for (let i = 0; i <= step; i++) {
      newState = executeCommand(newState, commands[i]);
    }
    setState(newState);
    setCurrentStep(step);
  }, [commands, totalSteps]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
      onComplete?.();
      return;
    }

    const delay = (commands[currentStep]?.delay || 500) / speed;
    timeoutRef.current = setTimeout(() => {
      executeStep(currentStep + 1);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, totalSteps, speed, executeStep, commands, onComplete]);

  // Initialize first step
  useEffect(() => {
    if (commands.length > 0 && currentStep === 0) {
      executeStep(0);
    }
  }, [commands, currentStep, executeStep]);

  // Controls
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handlePrev = () => {
    setIsPlaying(false);
    executeStep(Math.max(0, currentStep - 1));
  };
  const handleNext = () => {
    setIsPlaying(false);
    executeStep(Math.min(totalSteps - 1, currentStep + 1));
  };
  const handleReset = () => {
    setIsPlaying(false);
    setState(initialState);
    setCurrentStep(0);
    if (commands.length > 0) {
      executeStep(0);
    }
  };

  // Render appropriate visualization
  const renderVisualization = () => {
    switch (type) {
      case 'array':
        return <ArrayVisualization state={state} />;
      case 'hashmap':
        return (
          <div className="space-y-4">
            {state.array.length > 0 && <ArrayVisualization state={state} />}
            <HashMapVisualization state={state} />
          </div>
        );
      case 'stack':
        return <StackVisualization state={state} />;
      case 'queue':
        return <QueueVisualization state={state} />;
      case 'linkedlist':
        return <LinkedListVisualization state={state} />;
      case 'matrix':
        return <MatrixVisualization state={state} />;
      default:
        return <ArrayVisualization state={state} />;
    }
  };

  return (
    <div className={`bg-zinc-900 rounded-xl p-6 ${className}`}>
      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.message}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="text-center text-zinc-300 mb-6 min-h-[2rem]"
        >
          {state.message}
        </motion.div>
      </AnimatePresence>

      {/* Visualization */}
      <div className="flex justify-center items-center min-h-[200px] py-8">
        {renderVisualization()}
      </div>

      {/* Variables */}
      <VariablesDisplay variables={state.variables} />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handlePrev}
          disabled={currentStep <= 0}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          title="Previous"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentStep >= totalSteps - 1}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          title="Next"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* Progress */}
        <span className="text-sm text-zinc-500 ml-4">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

export default VisualizationController;
