import { useState, useCallback } from "react";
import { StackNode } from "./stack-types";

let nodeIdCounter = 0;

export interface StackOperation {
  type: "push" | "pop" | "peek" | "clear";
  value?: number | string;
  timestamp: number;
}

export function useStack(maxSize: number = 8) {
  const [stack, setStack] = useState<StackNode[]>([]);
  const [operations, setOperations] = useState<StackOperation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const push = useCallback(async (value: number | string) => {
    if (stack.length >= maxSize || isAnimating) return;

    setIsAnimating(true);
    setOperations((prev) => [...prev, { type: "push", value, timestamp: Date.now() }]);
    setMessage(`Pushing ${value} onto stack`);

    // Highlight the new position
    setHighlightedIndex(stack.length);

    // Add new node with animation delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    setStack((prev) => [
      ...prev,
      {
        id: `node-${nodeIdCounter++}`,
        value,
        index: prev.length,
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 400));
    setHighlightedIndex(null);
    setMessage("");
    setIsAnimating(false);
  }, [stack.length, maxSize, isAnimating]);

  const pop = useCallback(async () => {
    if (stack.length === 0 || isAnimating) return;

    setIsAnimating(true);
    const topValue = stack[stack.length - 1].value;
    setOperations((prev) => [...prev, { type: "pop", value: topValue, timestamp: Date.now() }]);
    setMessage(`Popping ${topValue} from stack`);

    // Highlight the top element
    setHighlightedIndex(stack.length - 1);

    await new Promise((resolve) => setTimeout(resolve, 400));

    setStack((prev) => prev.slice(0, -1));

    await new Promise((resolve) => setTimeout(resolve, 400));
    setHighlightedIndex(null);
    setMessage("");
    setIsAnimating(false);
  }, [stack, isAnimating]);

  const peek = useCallback(() => {
    if (stack.length === 0) return undefined;
    setHighlightedIndex(stack.length - 1);
    setMessage(`Top element: ${stack[stack.length - 1].value}`);
    setTimeout(() => {
      setHighlightedIndex(null);
      setMessage("");
    }, 1000);
    return stack[stack.length - 1].value;
  }, [stack]);

  const clear = useCallback(() => {
    setStack([]);
    setOperations([]);
    setHighlightedIndex(null);
    setMessage("");
    setIsAnimating(false);
    nodeIdCounter = 0;
  }, []);

  const initialize = useCallback((values: (number | string)[]) => {
    clear();
    const nodes: StackNode[] = values.map((value, index) => ({
      id: `node-${nodeIdCounter++}`,
      value,
      index,
    }));
    setStack(nodes);
  }, [clear]);

  return {
    stack,
    operations,
    isAnimating,
    highlightedIndex,
    message,
    push,
    pop,
    peek,
    clear,
    initialize,
    isFull: stack.length >= maxSize,
    isEmpty: stack.length === 0,
  };
}
