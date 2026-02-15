// =============================================================================
// DSA Visualizer Components
// Adapted from dsa-visualizer for use in the learning app
// =============================================================================

// Types
export * from "./stack-types";
export * from "./queue-types";
export * from "./linked-list-types";

// Display Components
export { StackDisplay } from "./stack-display";
export { QueueDisplay } from "./queue-display";
export { LinkedListDisplay } from "./linked-list-display";
export { ArrayDisplay } from "./array-display";

// Hooks
export { useStack, type StackOperation } from "./use-stack";
export { useQueue, type QueueOperation } from "./use-queue";
export { useLinkedList, type ListOperation, type AnimationState } from "./use-linked-list";

// Command Executor
export {
  parseCommand,
  parseCommandSequence,
  executeCommand,
  executeSequence,
  type DSACommand,
  type CommandSequence,
  type ExecutionContext,
  type VisualizerType,
} from "./command-executor";

// Main Component
export { DSAVisualizer, type DSAVisualizerProps } from "./DSAVisualizer";
export { default } from "./DSAVisualizer";
