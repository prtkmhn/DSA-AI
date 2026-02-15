import { useState, useCallback } from "react";
import { ListType, ListNode, LinkedList } from "./linked-list-types";

let nodeIdCounter = 0;

export interface ListOperation {
  type: "insert-front" | "insert-back" | "delete-front" | "delete-back" | "reverse" | "clear";
  value?: number | string;
  timestamp: number;
}

export interface AnimationState {
  highlightedNodes: string[];
  message: string;
}

const createNode = (value: number | string): ListNode => ({
  id: `node-${nodeIdCounter++}`,
  value: value.toString(),
  next: null,
  prev: null,
});

export function useLinkedList(type: ListType = "SLL") {
  const [list, setList] = useState<LinkedList>({
    type,
    head: null,
    tail: null,
    nodes: new Map(),
  });
  const [operations, setOperations] = useState<ListOperation[]>([]);
  const [animationState, setAnimationState] = useState<AnimationState>({
    highlightedNodes: [],
    message: "",
  });
  const [isAnimating, setIsAnimating] = useState(false);

  const addOperation = (operation: Omit<ListOperation, "timestamp">) => {
    setOperations((prev) => [...prev, { ...operation, timestamp: Date.now() }]);
  };

  const setHighlight = (nodeIds: string[], message: string) => {
    setAnimationState({ highlightedNodes: nodeIds, message });
  };

  const insertFront = useCallback(async (value: number | string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    addOperation({ type: "insert-front", value });

    const newNode = createNode(value);
    const nodes = new Map(list.nodes);
    nodes.set(newNode.id, newNode);

    if (!list.head) {
      setHighlight([newNode.id], "Creating first node");
      await new Promise((r) => setTimeout(r, 400));

      if (type === "CSLL" || type === "CDLL") {
        newNode.next = newNode.id;
        if (type === "CDLL") newNode.prev = newNode.id;
      }

      setList({ ...list, head: newNode.id, tail: newNode.id, nodes });
    } else {
      setHighlight([newNode.id], "Creating new node");
      await new Promise((r) => setTimeout(r, 400));

      const oldHead = nodes.get(list.head)!;
      newNode.next = list.head;

      if (type === "DLL" || type === "CDLL") {
        oldHead.prev = newNode.id;
      }

      if (type === "CSLL" || type === "CDLL") {
        const tail = nodes.get(list.tail!)!;
        tail.next = newNode.id;
        if (type === "CDLL") newNode.prev = list.tail;
      }

      setHighlight([newNode.id, list.head], "Linking nodes");
      await new Promise((r) => setTimeout(r, 400));

      setList({ ...list, head: newNode.id, nodes });
    }

    setHighlight([], "");
    setIsAnimating(false);
  }, [list, type, isAnimating]);

  const insertBack = useCallback(async (value: number | string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    addOperation({ type: "insert-back", value });

    const newNode = createNode(value);
    const nodes = new Map(list.nodes);
    nodes.set(newNode.id, newNode);

    if (!list.tail) {
      setHighlight([newNode.id], "Creating first node");
      await new Promise((r) => setTimeout(r, 400));

      if (type === "CSLL" || type === "CDLL") {
        newNode.next = newNode.id;
        if (type === "CDLL") newNode.prev = newNode.id;
      }

      setList({ ...list, head: newNode.id, tail: newNode.id, nodes });
    } else {
      setHighlight([newNode.id], "Creating new node");
      await new Promise((r) => setTimeout(r, 400));

      const oldTail = nodes.get(list.tail)!;
      oldTail.next = newNode.id;

      if (type === "DLL" || type === "CDLL") {
        newNode.prev = list.tail;
      }

      if (type === "CSLL" || type === "CDLL") {
        newNode.next = list.head;
      }

      setHighlight([list.tail, newNode.id], "Linking nodes");
      await new Promise((r) => setTimeout(r, 400));

      setList({ ...list, tail: newNode.id, nodes });
    }

    setHighlight([], "");
    setIsAnimating(false);
  }, [list, type, isAnimating]);

  const deleteFront = useCallback(async () => {
    if (isAnimating || !list.head) return;
    setIsAnimating(true);
    addOperation({ type: "delete-front" });

    const nodes = new Map(list.nodes);
    const oldHead = nodes.get(list.head)!;

    setHighlight([list.head], "Removing front node");
    await new Promise((r) => setTimeout(r, 400));

    if (list.head === list.tail) {
      setList({ ...list, head: null, tail: null, nodes: new Map() });
    } else {
      const newHead = oldHead.next!;
      const newHeadNode = nodes.get(newHead)!;

      if (type === "DLL" || type === "CDLL") {
        newHeadNode.prev = type === "CDLL" ? list.tail : null;
      }

      if (type === "CSLL" || type === "CDLL") {
        const tail = nodes.get(list.tail!)!;
        tail.next = newHead;
      }

      nodes.delete(list.head);
      setList({ ...list, head: newHead, nodes });
    }

    setHighlight([], "");
    setIsAnimating(false);
  }, [list, type, isAnimating]);

  const deleteBack = useCallback(async () => {
    if (isAnimating || !list.tail) return;
    setIsAnimating(true);
    addOperation({ type: "delete-back" });

    const nodes = new Map(list.nodes);

    setHighlight([list.tail], "Removing back node");
    await new Promise((r) => setTimeout(r, 400));

    if (list.head === list.tail) {
      setList({ ...list, head: null, tail: null, nodes: new Map() });
    } else {
      let newTail: string | null = list.head;
      let current: string | null = list.head;

      while (current !== null) {
        const currentNode = nodes.get(current);
        if (!currentNode) break;
        if (currentNode.next === list.tail) {
          newTail = current;
          break;
        }
        current = currentNode.next;
      }

      if (newTail) {
        const newTailNode = nodes.get(newTail);
        if (newTailNode) {
          newTailNode.next = type === "CSLL" || type === "CDLL" ? list.head : null;

          if (type === "CDLL" && list.head) {
            const headNode = nodes.get(list.head);
            if (headNode) {
              headNode.prev = newTail;
            }
          }

          nodes.delete(list.tail);
          setList({ ...list, tail: newTail, nodes });
        }
      }
    }

    setHighlight([], "");
    setIsAnimating(false);
  }, [list, type, isAnimating]);

  const clear = useCallback(() => {
    setList({
      type,
      head: null,
      tail: null,
      nodes: new Map(),
    });
    setOperations([]);
    setAnimationState({ highlightedNodes: [], message: "" });
    setIsAnimating(false);
    nodeIdCounter = 0;
  }, [type]);

  const initialize = useCallback((values: (number | string)[]) => {
    clear();
    if (values.length === 0) return;

    const nodes = new Map<string, ListNode>();
    let head: string | null = null;
    let tail: string | null = null;
    let prevId: string | null = null;

    for (const value of values) {
      const node = createNode(value);
      nodes.set(node.id, node);

      if (!head) {
        head = node.id;
      }

      if (prevId) {
        const prevNode = nodes.get(prevId)!;
        prevNode.next = node.id;
        if (type === "DLL" || type === "CDLL") {
          node.prev = prevId;
        }
      }

      tail = node.id;
      prevId = node.id;
    }

    // Handle circular connections
    if ((type === "CSLL" || type === "CDLL") && head && tail) {
      const tailNode = nodes.get(tail)!;
      tailNode.next = head;
      if (type === "CDLL") {
        const headNode = nodes.get(head)!;
        headNode.prev = tail;
      }
    }

    setList({ type, head, tail, nodes });
  }, [type, clear]);

  return {
    list,
    operations,
    animationState,
    isAnimating,
    insertFront,
    insertBack,
    deleteFront,
    deleteBack,
    clear,
    initialize,
  };
}
