export type ListType = "SLL" | "DLL" | "CSLL" | "CDLL";

export interface ListNode {
  id: string;
  value: string;
  next: string | null;
  prev: string | null;
}

export interface LinkedList {
  type: ListType;
  head: string | null;
  tail: string | null;
  nodes: Map<string, ListNode>;
}
