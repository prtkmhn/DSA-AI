import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GenericVisualizerProps {
  data: any;
  highlighted?: any[];
  pointers?: Record<string, any>;
  action?: string;
  type: "tree" | "graph" | "linkedlist" | "generic";
}

export function GenericVisualizer({ data, highlighted = [], pointers = {}, action, type }: GenericVisualizerProps) {
  // Convert data to displayable format
  const renderData = () => {
    if (data === null || data === undefined) {
      return <div className="text-gray-400 italic">null</div>;
    }

    // Handle linked list format: {val: 1, next: {val: 2, next: null}}
    if (type === "linkedlist" && typeof data === "object" && "val" in data) {
      const nodes: { val: any; index: number }[] = [];
      let current = data;
      let index = 0;
      while (current) {
        nodes.push({ val: current.val, index });
        current = current.next;
        index++;
        if (index > 20) break; // Safety limit
      }

      return (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {nodes.map((node, i) => (
            <div key={i} className="flex items-center">
              <motion.div
                animate={{
                  scale: highlighted.includes(node.index) ? 1.1 : 1,
                  backgroundColor: highlighted.includes(node.index) ? "hsl(258 60% 60%)" : "hsl(0 0% 96%)",
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "relative px-4 py-2 rounded-lg border-2 font-mono text-sm",
                  highlighted.includes(node.index) ? "border-purple-500 text-white" : "border-gray-300"
                )}
              >
                {/* Pointer labels */}
                {Object.entries(pointers).map(([name, pos]) =>
                  pos === node.index ? (
                    <div key={name} className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-brand-primary">
                      {name}
                    </div>
                  ) : null
                )}
                {String(node.val)}
              </motion.div>
              {i < nodes.length - 1 && (
                <div className="text-gray-400 px-1">→</div>
              )}
            </div>
          ))}
          <div className="text-gray-400 px-2">null</div>
        </div>
      );
    }

    // Handle tree format: {val: 1, left: {...}, right: {...}} OR array format [1, 2, 3, null, null, 4, 5]
    if (type === "tree") {
      console.log('[GenericVisualizer] Tree data:', data);

      // Convert array format to object format if needed
      let treeRoot = data;
      if (Array.isArray(data) && data.length > 0) {
        // Array format: [1, 2, 3, null, null, 4, 5] - level order representation
        const buildTree = (arr: any[], idx: number): any => {
          if (idx >= arr.length || arr[idx] === null || arr[idx] === undefined) return null;
          return {
            val: arr[idx],
            left: buildTree(arr, 2 * idx + 1),
            right: buildTree(arr, 2 * idx + 2)
          };
        };
        treeRoot = buildTree(data, 0);
        console.log('[GenericVisualizer] Converted array to tree:', treeRoot);
      }

      // Check if we have a valid tree structure
      if (treeRoot && typeof treeRoot === "object" && ("left" in treeRoot || "right" in treeRoot || "val" in treeRoot)) {
        // Simple BFS level-order display
        const levels: any[][] = [];
        const queue: { node: any; level: number; pos: number }[] = [{ node: treeRoot, level: 0, pos: 0 }];

        while (queue.length > 0) {
          const { node, level, pos } = queue.shift()!;
          if (!levels[level]) levels[level] = [];
          levels[level].push({ val: node?.val ?? "null", pos, isNull: !node });

          if (node && level < 4) { // Limit depth
            queue.push({ node: node.left, level: level + 1, pos: pos * 2 });
            queue.push({ node: node.right, level: level + 1, pos: pos * 2 + 1 });
          }
        }

        // Calculate spacing based on tree depth
        const maxLevel = levels.length - 1;

        return (
          <div className="flex flex-col items-center gap-4">
            {levels.map((level, levelIndex) => {
              const spacing = Math.pow(2, maxLevel - levelIndex);
              return (
                <div key={levelIndex} className="flex justify-center" style={{ gap: `${spacing * 8}px` }}>
                  {level.filter(n => !n.isNull).map((node, i) => (
                    <motion.div
                      key={`${levelIndex}-${i}`}
                      animate={{
                        scale: highlighted.includes(node.val) ? 1.1 : 1,
                        backgroundColor: highlighted.includes(node.val) ? "hsl(258 60% 60%)" : "hsl(0 0% 96%)",
                      }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold",
                        highlighted.includes(node.val) ? "border-purple-500 text-white" : "border-gray-300 text-gray-700"
                      )}
                    >
                      {String(node.val)}
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      }
    }

    // Handle graph format: adjacency list or edges
    if (type === "graph") {
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length === 2) {
        // Edge list format: [[0,1], [1,2], [2,0]]
        return (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">Graph Edges:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {data.map((edge: [number, number], i: number) => (
                <div key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-mono">
                  {edge[0]} → {edge[1]}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Adjacency list format: {0: [1,2], 1: [2], 2: [0]}
      if (typeof data === "object" && !Array.isArray(data)) {
        return (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">Adjacency List:</div>
            <div className="space-y-1">
              {Object.entries(data).map(([node, neighbors]) => (
                <div key={node} className="flex items-center gap-2 justify-center">
                  <span className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm",
                    highlighted.includes(Number(node)) ? "border-purple-500 bg-purple-100" : "border-gray-300"
                  )}>
                    {node}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-mono">[{(neighbors as any[]).join(", ")}]</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    // Fallback: JSON display
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-2">{type} data:</div>
        <pre className="text-sm font-mono bg-gray-100 p-3 rounded-lg overflow-auto max-w-full">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center min-h-[100px]">
        {renderData()}
      </div>

      {/* Pointers legend */}
      {Object.keys(pointers).length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {Object.entries(pointers).map(([name, pos]) => (
            <div key={name} className="px-2 py-1 bg-brand-primary/10 rounded text-xs font-mono">
              <span className="text-brand-primary font-bold">{name}</span>: {JSON.stringify(pos)}
            </div>
          ))}
        </div>
      )}

      {action && (
        <div className="text-center text-xs text-gray-500 italic">
          Action: {action}
        </div>
      )}
    </div>
  );
}
