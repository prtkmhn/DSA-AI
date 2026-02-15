/**
 * Tool Executor
 *
 * Takes structured tool calls from the AI and executes them
 * in the visualization system.
 */

import { useVisualizationStore } from '../visualizationStore';
import { getToolByName, ToolDefinition } from './toolRegistry';

/**
 * Represents a tool call from the AI
 */
export interface AIToolCall {
  tool: string;
  id?: string;
  params: Record<string, unknown>;
  description?: string;
}

/**
 * Represents the complete AI response
 */
export interface AIResponse {
  content: string;
  toolCalls: AIToolCall[];
  cardData?: {
    title: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

/**
 * Result of executing a tool call
 */
export interface ToolExecutionResult {
  success: boolean;
  tool: string;
  id: string;
  error?: string;
  visualizationId?: string;
}

type StoreType = ReturnType<typeof useVisualizationStore.getState>;

function createFallbackId(toolName: string): string {
  return `${toolName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchesToolParameterType(value: unknown, type: string): boolean {
  if (value === undefined || value === null) return true;

  if (type === 'string') return typeof value === 'string';
  if (type === 'number') return typeof value === 'number';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type.endsWith('[]') || type.startsWith('Array<')) return Array.isArray(value);
  if (type.includes('{') || type.includes('Record') || type === 'object') return isPlainObject(value);

  return true;
}

function validateToolCall(
  toolCall: AIToolCall,
  toolDef: ToolDefinition
): { valid: true; normalizedId: string } | { valid: false; normalizedId: string; error: string } {
  const normalizedId = toolCall.id?.trim() || createFallbackId(toolCall.tool);

  if (!isPlainObject(toolCall.params)) {
    return {
      valid: false,
      normalizedId,
      error: `Invalid params for ${toolCall.tool}: expected an object`
    };
  }

  for (const param of toolDef.parameters) {
    const value = toolCall.params[param.name];

    if (param.required && value === undefined) {
      return {
        valid: false,
        normalizedId,
        error: `Missing required parameter "${param.name}" for tool ${toolCall.tool}`
      };
    }

    if (value !== undefined && !matchesToolParameterType(value, param.type)) {
      return {
        valid: false,
        normalizedId,
        error: `Invalid parameter type for "${param.name}" in ${toolCall.tool}; expected ${param.type}`
      };
    }
  }

  return { valid: true, normalizedId };
}

/**
 * Execute a single tool call
 */
export function executeToolCall(
  toolCall: AIToolCall,
  store: StoreType
): ToolExecutionResult {
  const { tool, params } = toolCall;
  let executionId = toolCall.id?.trim() || createFallbackId(tool);

  try {
    // Validate tool exists
    const toolDef = getToolByName(tool);
    if (!toolDef) {
      return {
        success: false,
        tool,
        id: executionId,
        error: `Unknown tool: ${tool}`
      };
    }

    const validation = validateToolCall(toolCall, toolDef);
    if (!validation.valid) {
      return {
        success: false,
        tool,
        id: validation.normalizedId,
        error: validation.error
      };
    }

    const id = validation.normalizedId;
    executionId = id;

    // Execute based on tool type
    switch (tool) {
      // Array 1D Tools
      case 'array1d_create':
        store.handleArray1DCreate(
          id,
          (params.values as number[]) || [],
          params.title as string | undefined
        );
        break;

      case 'array1d_set':
        store.handleArray1DSet(id, params.values as number[]);
        break;

      case 'array1d_patch':
        store.handleArray1DPatch(
          id,
          params.index as number,
          params.value as number
        );
        break;

      case 'array1d_select':
        store.handleArray1DSelect(
          id,
          params.startIndex as number,
          params.endIndex as number | undefined
        );
        break;

      case 'array1d_deselect':
        store.handleArray1DDeselect(id);
        break;

      // Array 2D Tools
      case 'array2d_create':
        store.handleArray2DCreate(
          id,
          (params.values as number[][]) || [],
          params.title as string | undefined
        );
        break;

      case 'array2d_patch':
        store.handleArray2DPatch(
          id,
          params.row as number,
          params.col as number,
          params.value as number
        );
        break;

      case 'array2d_select':
        store.handleArray2DSelect(
          id,
          params.startRow as number,
          params.startCol as number,
          params.endRow as number | undefined,
          params.endCol as number | undefined
        );
        break;

      // Graph Tools
      case 'graph_create':
        store.handleGraphCreate(
          id,
          params.nodes as Array<{ id: string; label?: string; x?: number; y?: number }>,
          params.edges as Array<{ source: string; target: string; weight?: number }>,
          params.directed as boolean | undefined,
          params.title as string | undefined
        );
        break;

      case 'graph_add_node':
        store.handleGraphAddNode(
          id,
          params.nodeId as string,
          params.label as string | undefined,
          params.x as number | undefined,
          params.y as number | undefined
        );
        break;

      case 'graph_add_edge':
        store.handleGraphAddEdge(
          id,
          params.source as string,
          params.target as string,
          params.weight as number | undefined
        );
        break;

      case 'graph_select_node':
        store.handleGraphSelectNode(id, params.nodeId as string);
        break;

      case 'graph_select_edge':
        store.handleGraphSelectEdge(
          id,
          params.source as string,
          params.target as string
        );
        break;

      // Chart Tools
      case 'chart_create':
        store.handleChartCreate(
          id,
          params.type as 'bar' | 'line' | 'scatter',
          params.data as Array<{ x: number | string; y: number; label?: string }>,
          params.title as string | undefined
        );
        break;

      case 'chart_update':
        store.handleChartUpdate(
          id,
          params.data as Array<{ x: number | string; y: number; label?: string }>
        );
        break;

      // Log Tools
      case 'log_create':
        store.handleLogCreate(id, params.title as string | undefined);
        break;

      case 'log_print':
        store.handleLogPrint(
          id,
          params.message as string,
          params.type as 'info' | 'success' | 'warning' | 'error' | undefined
        );
        break;

      // Markdown Tools
      case 'markdown_create':
        store.handleMarkdownCreate(
          id,
          params.content as string,
          params.title as string | undefined
        );
        break;

      // Algorithm Templates
      case 'algorithm_bubble_sort': {
        const array = params.array as number[];
        const steps = generateBubbleSortSteps(array);
        store.handleAlgorithmCreate(id, 'bubble_sort', steps, 'Bubble Sort', { array });
        break;
      }

      case 'algorithm_binary_search': {
        const array = params.array as number[];
        const steps = generateBinarySearchSteps(array, params.target as number);
        store.handleAlgorithmCreate(
          id,
          'binary_search',
          steps,
          `Binary Search (target: ${params.target})`,
          { array }
        );
        break;
      }

      case 'algorithm_dfs': {
        const nodes = params.nodes as Array<{ id: string; label?: string }>;
        const edges = params.edges as Array<{ source: string; target: string }>;
        const steps = generateDFSSteps(nodes, edges, params.startNode as string);
        store.handleAlgorithmCreate(id, 'dfs', steps, `DFS from ${params.startNode}`, { nodes, edges });
        break;
      }

      case 'algorithm_bfs': {
        const nodes = params.nodes as Array<{ id: string; label?: string }>;
        const edges = params.edges as Array<{ source: string; target: string }>;
        const steps = generateBFSSteps(nodes, edges, params.startNode as string);
        store.handleAlgorithmCreate(id, 'bfs', steps, `BFS from ${params.startNode}`, { nodes, edges });
        break;
      }

      case 'algorithm_dijkstra': {
        const nodes = params.nodes as Array<{ id: string; label?: string }>;
        const edges = params.edges as Array<{ source: string; target: string; weight: number }>;
        const steps = generateDijkstraSteps(
          nodes,
          edges,
          params.startNode as string,
          params.endNode as string | undefined
        );
        store.handleAlgorithmCreate(
          id,
          'dijkstra',
          steps,
          `Dijkstra: ${params.startNode} -> ${params.endNode || 'all'}`,
          { nodes, edges }
        );
        break;
      }

      case 'algorithm_bst_search': {
        const tree = params.tree as Array<number | null>;
        const target = params.target as number;
        const bstResult = generateBSTSearchVisualization(tree, target);

        store.handleAlgorithmCreate(
          id,
          'bst_search',
          bstResult.steps,
          `BST Search (target: ${target})`,
          { nodes: bstResult.nodes, edges: bstResult.edges }
        );
        break;
      }

      default:
        return {
          success: false,
          tool,
          id,
          error: `Tool ${tool} not yet implemented`
        };
    }

    return {
      success: true,
      tool,
      id,
      visualizationId: id
    };
  } catch (error) {
    return {
      success: false,
      tool,
      id: executionId,
      error: (error as Error).message
    };
  }
}

/**
 * Execute multiple tool calls in sequence
 */
export function executeToolCalls(
  toolCalls: AIToolCall[],
  store: StoreType
): ToolExecutionResult[] {
  return toolCalls.map(call => executeToolCall(call, store));
}

// ============================================================================
// Algorithm Step Generators
// ============================================================================

interface AlgorithmStep {
  type: string;
  description: string;
  [key: string]: unknown;
}

export function generateBubbleSortSteps(array: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    type: 'init',
    array: [...arr],
    description: `Initial array: [${arr.join(', ')}]`
  });

  for (let i = 0; i < n - 1; i++) {
    steps.push({
      type: 'outer_loop',
      i,
      description: `Pass ${i + 1}: Finding the ${n - i}th largest element`
    });

    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        values: [arr[j], arr[j + 1]],
        array: [...arr],
        description: `Compare ${arr[j]} and ${arr[j + 1]}`
      });

      if (arr[j] > arr[j + 1]) {
        steps.push({
          type: 'swap_start',
          indices: [j, j + 1],
          description: `${arr[j]} > ${arr[j + 1]}, swapping`
        });

        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];

        steps.push({
          type: 'swap_end',
          array: [...arr],
          indices: [j, j + 1],
          description: `After swap: [${arr.join(', ')}]`
        });
      }
    }

    steps.push({
      type: 'sorted',
      index: n - i - 1,
      description: `Element ${arr[n - i - 1]} is now in its correct position`
    });
  }

  steps.push({
    type: 'complete',
    array: [...arr],
    description: `Sorting complete! Final: [${arr.join(', ')}]`
  });

  return steps;
}

export function generateBinarySearchSteps(array: number[], target: number): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let left = 0;
  let right = array.length - 1;

  steps.push({
    type: 'init',
    array: [...array],
    target,
    description: `Searching for ${target} in [${array.join(', ')}]`
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      type: 'check',
      left,
      right,
      mid,
      midValue: array[mid],
      description: `Check middle index ${mid}: array[${mid}] = ${array[mid]}`
    });

    if (array[mid] === target) {
      steps.push({
        type: 'found',
        index: mid,
        value: target,
        description: `Found ${target} at index ${mid}!`
      });
      return steps;
    }

    if (array[mid] < target) {
      steps.push({
        type: 'go_right',
        mid,
        target,
        description: `${array[mid]} < ${target}, search right half`
      });
      left = mid + 1;
    } else {
      steps.push({
        type: 'go_left',
        mid,
        target,
        description: `${array[mid]} > ${target}, search left half`
      });
      right = mid - 1;
    }
  }

  steps.push({
    type: 'not_found',
    target,
    description: `${target} not found in the array`
  });

  return steps;
}

export function generateDFSSteps(
  nodes: Array<{ id: string; label?: string }>,
  edges: Array<{ source: string; target: string }>,
  startNode: string
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const adj = new Map<string, string[]>();
  const visited = new Set<string>();

  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  });

  steps.push({
    type: 'init',
    startNode,
    description: `Starting DFS from node ${startNode}`
  });

  function dfs(nodeId: string, parent?: string) {
    visited.add(nodeId);
    steps.push({
      type: 'visit',
      nodeId,
      parent,
      visited: Array.from(visited),
      description: `Visiting node ${nodeId}${parent ? ` from ${parent}` : ''}`
    });

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        steps.push({
          type: 'edge',
          from: nodeId,
          to: neighbor,
          description: `Traversing edge ${nodeId} -> ${neighbor}`
        });
        dfs(neighbor, nodeId);
      }
    }

    steps.push({
      type: 'backtrack',
      nodeId,
      description: `Backtracking from ${nodeId}`
    });
  }

  dfs(startNode);
  steps.push({ type: 'complete', description: 'DFS traversal complete' });

  return steps;
}

export function generateBFSSteps(
  nodes: Array<{ id: string; label?: string }>,
  edges: Array<{ source: string; target: string }>,
  startNode: string
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const adj = new Map<string, string[]>();
  const visited = new Set<string>();
  const queue: string[] = [];

  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  });

  steps.push({
    type: 'init',
    startNode,
    description: `Starting BFS from node ${startNode}`
  });

  queue.push(startNode);
  visited.add(startNode);
  steps.push({
    type: 'enqueue',
    nodeId: startNode,
    queue: [...queue],
    description: `Enqueue ${startNode}`
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    steps.push({
      type: 'dequeue',
      nodeId,
      queue: [...queue],
      description: `Dequeue ${nodeId}`
    });
    steps.push({
      type: 'visit',
      nodeId,
      visited: Array.from(visited),
      description: `Process node ${nodeId}`
    });

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        steps.push({
          type: 'enqueue',
          nodeId: neighbor,
          queue: [...queue],
          description: `Enqueue unvisited neighbor ${neighbor}`
        });
      }
    }
  }

  steps.push({ type: 'complete', description: 'BFS traversal complete' });

  return steps;
}

export function generateDijkstraSteps(
  nodes: Array<{ id: string; label?: string }>,
  edges: Array<{ source: string; target: string; weight: number }>,
  startNode: string,
  endNode?: string
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  // Initialize
  nodes.forEach(n => {
    distances.set(n.id, n.id === startNode ? 0 : Infinity);
    previous.set(n.id, null);
    unvisited.add(n.id);
  });

  steps.push({
    type: 'init',
    startNode,
    endNode,
    distances: Object.fromEntries(distances),
    description: `Starting Dijkstra from ${startNode}${endNode ? ` to ${endNode}` : ''}`
  });

  // Build adjacency list with weights
  const adj = new Map<string, Array<{ node: string; weight: number }>>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    adj.get(e.source)?.push({ node: e.target, weight: e.weight });
    adj.get(e.target)?.push({ node: e.source, weight: e.weight });
  });

  while (unvisited.size > 0) {
    // Find minimum distance node
    let minNode: string | null = null;
    let minDist = Infinity;
    for (const node of Array.from(unvisited)) {
      const dist = distances.get(node)!;
      if (dist < minDist) {
        minDist = dist;
        minNode = node;
      }
    }

    if (minNode === null || minDist === Infinity) break;

    steps.push({
      type: 'select',
      nodeId: minNode,
      distance: minDist,
      description: `Select node ${minNode} with distance ${minDist}`
    });

    unvisited.delete(minNode);

    if (endNode && minNode === endNode) {
      steps.push({
        type: 'found',
        nodeId: endNode,
        distance: minDist,
        description: `Reached target ${endNode} with distance ${minDist}`
      });
      break;
    }

    // Update neighbors
    const neighbors = adj.get(minNode) || [];
    for (const { node: neighbor, weight } of neighbors) {
      if (unvisited.has(neighbor)) {
        const newDist = distances.get(minNode)! + weight;
        const currentDist = distances.get(neighbor)!;

        steps.push({
          type: 'check_neighbor',
          from: minNode,
          to: neighbor,
          weight,
          newDist,
          currentDist,
          description: `Check ${minNode} -> ${neighbor}: ${distances.get(minNode)} + ${weight} = ${newDist}`
        });

        if (newDist < currentDist) {
          distances.set(neighbor, newDist);
          previous.set(neighbor, minNode);
          steps.push({
            type: 'update',
            nodeId: neighbor,
            newDistance: newDist,
            via: minNode,
            description: `Update ${neighbor}: distance = ${newDist} via ${minNode}`
          });
        }
      }
    }
  }

  steps.push({
    type: 'complete',
    distances: Object.fromEntries(distances),
    description: 'Dijkstra complete'
  });

  return steps;
}

interface BSTSearchVisualization {
  steps: AlgorithmStep[];
  nodes: Array<{ id: string; label?: string }>;
  edges: Array<{ source: string; target: string }>;
}

export function generateBSTSearchVisualization(
  tree: Array<number | null>,
  target: number
): BSTSearchVisualization {
  const nodes: Array<{ id: string; label?: string; x?: number; y?: number }> = [];
  const edges: Array<{ source: string; target: string }> = [];
  const steps: AlgorithmStep[] = [];

  if (!Array.isArray(tree) || tree.length === 0 || tree[0] === null) {
    return {
      nodes: [],
      edges: [],
      steps: [
        {
          type: 'init',
          description: 'The BST is empty, so the target cannot be found.'
        }
      ]
    };
  }

  for (let i = 0; i < tree.length; i++) {
    if (tree[i] === null || tree[i] === undefined) continue;
    const depth = Math.floor(Math.log2(i + 1));
    const levelStart = (2 ** depth) - 1;
    const positionInLevel = i - levelStart;
    const nodesInLevel = 2 ** depth;
    const x = ((positionInLevel + 1) / (nodesInLevel + 1)) * 460 + 20;
    const y = 55 + depth * 75;

    nodes.push({ id: String(i), label: String(tree[i]), x, y });

    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < tree.length && tree[left] !== null && tree[left] !== undefined) {
      edges.push({ source: String(i), target: String(left) });
    }
    if (right < tree.length && tree[right] !== null && tree[right] !== undefined) {
      edges.push({ source: String(i), target: String(right) });
    }
  }

  let currentIndex = 0;
  const visited: string[] = [];

  steps.push({
    type: 'init',
    nodeId: String(currentIndex),
    visited: [],
    target,
    description: `Start at root node ${tree[currentIndex]} and search for ${target}.`
  });

  while (currentIndex < tree.length && tree[currentIndex] !== null && tree[currentIndex] !== undefined) {
    const currentValue = tree[currentIndex] as number;
    visited.push(String(currentIndex));

    steps.push({
      type: 'visit',
      nodeId: String(currentIndex),
      visited: [...visited],
      value: currentValue,
      target,
      description: `Visit node ${currentValue}. Compare ${target} with ${currentValue}.`
    });

    if (currentValue === target) {
      steps.push({
        type: 'found',
        nodeId: String(currentIndex),
        visited: [...visited],
        value: currentValue,
        target,
        description: `Found target ${target} at node ${currentValue}.`
      });

      return { nodes, edges, steps };
    }

    if (target < currentValue) {
      const nextIndex = 2 * currentIndex + 1;
      steps.push({
        type: 'go_left',
        nodeId: String(currentIndex),
        visited: [...visited],
        from: currentValue,
        target,
        description: `${target} < ${currentValue}, move to the left child.`
      });
      currentIndex = nextIndex;
      continue;
    }

    const nextIndex = 2 * currentIndex + 2;
    steps.push({
      type: 'go_right',
      nodeId: String(currentIndex),
      visited: [...visited],
      from: currentValue,
      target,
      description: `${target} > ${currentValue}, move to the right child.`
    });
    currentIndex = nextIndex;
  }

  steps.push({
    type: 'not_found',
    visited: [...visited],
    target,
    description: `Reached a null child. Target ${target} is not in the BST.`
  });

  return { nodes, edges, steps };
}
