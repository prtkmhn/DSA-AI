/**
 * Tool Registry for AI Visualization
 *
 * Defines all available visualization tools with their schemas,
 * descriptions, and examples. The AI uses this to understand
 * what tools are available and how to call them.
 */

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  example?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'array' | 'graph' | 'chart' | 'log' | 'algorithm' | 'layout' | 'animation';
  parameters: ToolParameter[];
  whenToUse: string;
}

/**
 * Complete registry of all visualization tools
 */
export const TOOL_REGISTRY: ToolDefinition[] = [
  // Array Tools
  {
    name: 'array1d_create',
    description: 'Creates a 1D array visualization showing values as vertical bars. Perfect for sorting algorithms, searching, and array manipulations.',
    category: 'array',
    parameters: [
      { name: 'id', type: 'string', description: 'Unique identifier for this visualization', required: true, example: 'bubble_sort_array' },
      { name: 'values', type: 'number[]', description: 'Array of numbers to visualize', required: true, example: [64, 34, 25, 12, 22, 11, 90] },
      { name: 'title', type: 'string', description: 'Optional title displayed above the visualization', required: false, example: 'Array to be sorted' }
    ],
    whenToUse: 'Use when you need to show a list of numbers, especially for sorting, searching, or any array operation.'
  },
  {
    name: 'array1d_select',
    description: 'Highlights/selects a range of indices in a 1D array. Use to show which elements are being compared, swapped, or processed.',
    category: 'array',
    parameters: [
      { name: 'id', type: 'string', description: 'ID of the array to select in (must exist)', required: true },
      { name: 'startIndex', type: 'number', description: 'Starting index to highlight (0-based)', required: true, example: 2 },
      { name: 'endIndex', type: 'number', description: 'Ending index to highlight (inclusive, defaults to startIndex)', required: false, example: 4 }
    ],
    whenToUse: 'Use to highlight elements being compared, the current pivot in quicksort, the search range in binary search, or any focused elements.'
  },
  {
    name: 'array1d_patch',
    description: 'Updates a single element value in a 1D array. Use to show swaps or value changes.',
    category: 'array',
    parameters: [
      { name: 'id', type: 'string', description: 'ID of the array to patch', required: true },
      { name: 'index', type: 'number', description: 'Index to update', required: true },
      { name: 'value', type: 'number', description: 'New value at the index', required: true }
    ],
    whenToUse: 'Use when a single value changes, like after a swap in sorting or updating a value in dynamic programming.'
  },
  {
    name: 'array2d_create',
    description: 'Creates a 2D array/matrix visualization. Perfect for DP tables, grids, matrices, and 2D data structures.',
    category: 'array',
    parameters: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true, example: 'dp_table' },
      { name: 'values', type: 'number[][]', description: '2D array (array of arrays)', required: true, example: [[0, 1, 2], [3, 4, 5]] },
      { name: 'title', type: 'string', description: 'Optional title', required: false, example: 'Dynamic Programming Table' }
    ],
    whenToUse: 'Use for dynamic programming tables, adjacency matrices, game boards, or any grid-based data.'
  },
  {
    name: 'array2d_select',
    description: 'Highlights a rectangular region in a 2D array.',
    category: 'array',
    parameters: [
      { name: 'id', type: 'string', description: 'ID of the 2D array', required: true },
      { name: 'startRow', type: 'number', description: 'Starting row index', required: true },
      { name: 'startCol', type: 'number', description: 'Starting column index', required: true },
      { name: 'endRow', type: 'number', description: 'Ending row (defaults to startRow)', required: false },
      { name: 'endCol', type: 'number', description: 'Ending column (defaults to startCol)', required: false }
    ],
    whenToUse: 'Use to highlight specific cells in a DP table, a submatrix, or any rectangular region of interest.'
  },

  // Graph Tools
  {
    name: 'graph_create',
    description: 'Creates a graph visualization with nodes and edges. Supports directed/undirected, weighted/unweighted graphs.',
    category: 'graph',
    parameters: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true, example: 'bfs_graph' },
      { name: 'nodes', type: 'Array<{id: string, label?: string}>', description: 'Array of node objects', required: true },
      { name: 'edges', type: 'Array<{source: string, target: string, weight?: number}>', description: 'Array of edge objects', required: true },
      { name: 'directed', type: 'boolean', description: 'Whether the graph is directed', required: false, default: false },
      { name: 'title', type: 'string', description: 'Optional title', required: false }
    ],
    whenToUse: 'Use for any graph structure: trees, networks, state machines, dependency graphs, etc.'
  },
  {
    name: 'graph_select_node',
    description: 'Highlights a node in the graph. Use to show current node in traversal.',
    category: 'graph',
    parameters: [
      { name: 'id', type: 'string', description: 'Graph ID', required: true },
      { name: 'nodeId', type: 'string', description: 'ID of node to highlight', required: true }
    ],
    whenToUse: 'Use to highlight the currently visited node in BFS/DFS, or any focused node.'
  },
  {
    name: 'graph_select_edge',
    description: 'Highlights an edge in the graph. Use to show traversal path.',
    category: 'graph',
    parameters: [
      { name: 'id', type: 'string', description: 'Graph ID', required: true },
      { name: 'source', type: 'string', description: 'Source node ID', required: true },
      { name: 'target', type: 'string', description: 'Target node ID', required: true }
    ],
    whenToUse: 'Use to highlight the edge being traversed or connections being explored.'
  },

  // Chart Tools
  {
    name: 'chart_create',
    description: 'Creates a chart (bar, line, or scatter) for showing data trends, comparisons, or distributions.',
    category: 'chart',
    parameters: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'type', type: 'string', description: 'Chart type: bar, line, or scatter', required: true, example: 'bar' },
      { name: 'data', type: 'Array<{x: number, y: number, label?: string}>', description: 'Data points for the chart', required: true },
      { name: 'title', type: 'string', description: 'Chart title', required: false }
    ],
    whenToUse: 'Use for comparing algorithm complexities, showing performance metrics, or any numerical comparison.'
  },

  // Log Tools
  {
    name: 'log_create',
    description: 'Creates a log console for showing algorithm steps, debug output, or explanations.',
    category: 'log',
    parameters: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true, example: 'algorithm_log' },
      { name: 'title', type: 'string', description: 'Optional title', required: false, example: 'Algorithm Steps' }
    ],
    whenToUse: 'Use to show step-by-step algorithm execution or textual explanations alongside visualizations.'
  },
  {
    name: 'log_print',
    description: 'Adds a message to a log. Messages can be info, success, warning, or error.',
    category: 'log',
    parameters: [
      { name: 'id', type: 'string', description: 'Log ID', required: true },
      { name: 'message', type: 'string', description: 'Message text', required: true, example: 'Visiting node A' },
      { name: 'type', type: 'string', description: 'Message type: info, success, warning, error', required: false, default: 'info' }
    ],
    whenToUse: 'Use to log algorithm steps, results, or any explanatory text during visualization.'
  },

  // Markdown Tools
  {
    name: 'markdown_create',
    description: 'Creates a markdown display for explanations, pseudocode, formulas, or formatted text.',
    category: 'log',
    parameters: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'content', type: 'string', description: 'Markdown content', required: true },
      { name: 'title', type: 'string', description: 'Optional title', required: false }
    ],
    whenToUse: 'Use for pseudocode, mathematical formulas, detailed explanations, or any formatted text content.'
  },

  // Algorithm Templates
  {
    name: 'algorithm_bubble_sort',
    description: 'Complete bubble sort visualization with pre-built animation steps.',
    category: 'algorithm',
    parameters: [
      { name: 'array', type: 'number[]', description: 'Array to sort', required: true, example: [64, 34, 25, 12, 22, 11, 90] },
      { name: 'autoPlay', type: 'boolean', description: 'Whether to auto-start animation', required: false, default: false }
    ],
    whenToUse: 'Use when explaining bubble sort. Creates both the array visualization and all animation steps automatically.'
  },
  {
    name: 'algorithm_binary_search',
    description: 'Complete binary search visualization with step-by-step search process.',
    category: 'algorithm',
    parameters: [
      { name: 'array', type: 'number[]', description: 'Sorted array to search', required: true, example: [2, 5, 8, 12, 16, 23, 38, 56] },
      { name: 'target', type: 'number', description: 'Value to find', required: true, example: 23 },
      { name: 'autoPlay', type: 'boolean', description: 'Whether to auto-start animation', required: false, default: false }
    ],
    whenToUse: 'Use when explaining binary search. Creates array visualization and shows the divide-and-conquer process.'
  },
  {
    name: 'algorithm_dfs',
    description: 'Complete DFS visualization on a graph.',
    category: 'algorithm',
    parameters: [
      { name: 'nodes', type: 'Array<{id: string, label?: string}>', description: 'Graph nodes', required: true },
      { name: 'edges', type: 'Array<{source: string, target: string}>', description: 'Graph edges', required: true },
      { name: 'startNode', type: 'string', description: 'Starting node ID', required: true },
      { name: 'autoPlay', type: 'boolean', description: 'Whether to auto-start animation', required: false, default: false }
    ],
    whenToUse: 'Use when explaining depth-first search traversal on graphs or trees.'
  },
  {
    name: 'algorithm_bfs',
    description: 'Complete BFS visualization on a graph.',
    category: 'algorithm',
    parameters: [
      { name: 'nodes', type: 'Array<{id: string, label?: string}>', description: 'Graph nodes', required: true },
      { name: 'edges', type: 'Array<{source: string, target: string}>', description: 'Graph edges', required: true },
      { name: 'startNode', type: 'string', description: 'Starting node ID', required: true },
      { name: 'autoPlay', type: 'boolean', description: 'Whether to auto-start animation', required: false, default: false }
    ],
    whenToUse: 'Use when explaining breadth-first search traversal on graphs or trees.'
  },
  {
    name: 'algorithm_dijkstra',
    description: "Complete Dijkstra's shortest path algorithm visualization.",
    category: 'algorithm',
    parameters: [
      { name: 'nodes', type: 'Array<{id: string, label?: string}>', description: 'Graph nodes', required: true },
      { name: 'edges', type: 'Array<{source: string, target: string, weight: number}>', description: 'Weighted graph edges', required: true },
      { name: 'startNode', type: 'string', description: 'Starting node ID', required: true },
      { name: 'endNode', type: 'string', description: 'Optional target node', required: false },
      { name: 'autoPlay', type: 'boolean', description: 'Whether to auto-start animation', required: false, default: false }
    ],
    whenToUse: "Use when explaining Dijkstra's shortest path algorithm on weighted graphs."
  },
  {
    name: 'algorithm_bst_search',
    description: 'Complete BST search visualization with step-by-step left/right traversal decisions.',
    category: 'algorithm',
    parameters: [
      { name: 'tree', type: 'Array<number|null>', description: 'BST in level-order array form, using null for missing children', required: true, example: [4, 2, 7, 1, 3] },
      { name: 'target', type: 'number', description: 'Target value to find in the BST', required: true, example: 2 },
      { name: 'autoPlay', type: 'boolean', description: 'Whether to auto-start animation', required: false, default: false }
    ],
    whenToUse: 'Use for LeetCode 700 or any BST search explanation where left/right choices should be visualized.'
  }
];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return TOOL_REGISTRY.filter(tool => tool.category === category);
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find(tool => tool.name === name);
}

/**
 * Get all tool names as a formatted string (for prompts)
 */
export function getToolNamesFormatted(): string {
  return TOOL_REGISTRY.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
}
