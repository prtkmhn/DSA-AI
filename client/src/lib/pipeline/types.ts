export type VisualizationType =
  | 'array'
  | 'hashmap'
  | 'stack'
  | 'queue'
  | 'tree'
  | 'graph'
  | 'linkedlist'
  | 'matrix'
  | 'heap';

export interface MCPCommand {
  tool: string;
  args: Record<string, any>;
  message?: string;
  delay?: number;
}
