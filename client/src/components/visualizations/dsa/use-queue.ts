import { useState, useCallback } from "react";
import { QueueNode } from "./queue-types";

let nodeIdCounter = 0;

export interface QueueOperation {
  type: "enqueue" | "dequeue" | "peek" | "clear";
  value?: number | string;
  timestamp: number;
}

export function useQueue(maxSize: number = 8) {
  const [queue, setQueue] = useState<QueueNode[]>([]);
  const [operations, setOperations] = useState<QueueOperation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const enqueue = useCallback(async (value: number | string) => {
    if (queue.length >= maxSize || isAnimating) return;

    setIsAnimating(true);
    setOperations((prev) => [...prev, { type: "enqueue", value, timestamp: Date.now() }]);
    setMessage(`Enqueueing ${value}`);

    // Highlight the new position
    setHighlightedIndex(queue.length);

    // Add new node with animation delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    setQueue((prev) => [
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
  }, [queue.length, maxSize, isAnimating]);

  const dequeue = useCallback(async () => {
    if (queue.length === 0 || isAnimating) return;

    setIsAnimating(true);
    const frontValue = queue[0].value;
    setOperations((prev) => [...prev, { type: "dequeue", value: frontValue, timestamp: Date.now() }]);
    setMessage(`Dequeueing ${frontValue}`);

    // Highlight the first element
    setHighlightedIndex(0);

    await new Promise((resolve) => setTimeout(resolve, 400));

    setQueue((prev) => {
      const newQueue = prev.slice(1);
      // Update indices
      return newQueue.map((node, i) => ({
        ...node,
        index: i,
      }));
    });

    await new Promise((resolve) => setTimeout(resolve, 400));
    setHighlightedIndex(null);
    setMessage("");
    setIsAnimating(false);
  }, [queue, isAnimating]);

  const peekFront = useCallback(() => {
    if (queue.length === 0) return undefined;
    setHighlightedIndex(0);
    setMessage(`Front element: ${queue[0].value}`);
    setTimeout(() => {
      setHighlightedIndex(null);
      setMessage("");
    }, 1000);
    return queue[0].value;
  }, [queue]);

  const clear = useCallback(() => {
    setQueue([]);
    setOperations([]);
    setHighlightedIndex(null);
    setMessage("");
    setIsAnimating(false);
    nodeIdCounter = 0;
  }, []);

  const initialize = useCallback((values: (number | string)[]) => {
    clear();
    const nodes: QueueNode[] = values.map((value, index) => ({
      id: `node-${nodeIdCounter++}`,
      value,
      index,
    }));
    setQueue(nodes);
  }, [clear]);

  return {
    queue,
    operations,
    isAnimating,
    highlightedIndex,
    message,
    enqueue,
    dequeue,
    peekFront,
    clear,
    initialize,
    isFull: queue.length >= maxSize,
    isEmpty: queue.length === 0,
  };
}
