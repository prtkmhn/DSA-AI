import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatrixVisualizerProps {
  data: any[][];
  highlighted: [number, number][];
  pointers: Record<string, [number, number]>;
  action?: string;
}

export function MatrixVisualizer({ data, highlighted, pointers, action }: MatrixVisualizerProps) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return <div className="text-gray-500 text-center">Invalid matrix data</div>;
  }

  const isHighlighted = (row: number, col: number) => {
    if (!highlighted) return false;
    return highlighted.some(([r, c]) => r === row && c === col);
  };

  const getPointerLabels = (row: number, col: number): string[] => {
    const labels: string[] = [];
    if (pointers) {
      Object.entries(pointers).forEach(([label, pos]) => {
        if (Array.isArray(pos) && pos[0] === row && pos[1] === col) {
          labels.push(label);
        }
      });
    }
    return labels;
  };

  const getCellColor = (value: any, row: number, col: number) => {
    const isHighlightedCell = isHighlighted(row, col);

    if (isHighlightedCell) {
      return "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/30";
    }

    if (value === "1" || value === 1) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (value === "0" || value === 0) {
      return "bg-gray-100 text-gray-400 border-gray-200";
    }

    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="flex flex-col items-center gap-4" data-testid="matrix-visualizer">
      <div className="inline-flex flex-col gap-1">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((cell, colIndex) => {
              const pointerLabels = getPointerLabels(rowIndex, colIndex);
              const isHighlightedCell = isHighlighted(rowIndex, colIndex);

              return (
                <div key={colIndex} className="relative">
                  {pointerLabels.length > 0 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {pointerLabels.map((label) => (
                        <span
                          key={label}
                          className="text-[8px] font-mono text-brand-primary font-bold px-1 bg-brand-primary/10 rounded whitespace-nowrap"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  <motion.div
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: isHighlightedCell ? 1.1 : 1,
                      opacity: 1
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "w-9 h-9 rounded flex items-center justify-center font-mono text-xs font-medium border-2 transition-colors",
                      getCellColor(cell, rowIndex, colIndex)
                    )}
                    data-testid={`matrix-cell-${rowIndex}-${colIndex}`}
                  >
                    {typeof cell === "object" ? JSON.stringify(cell) : String(cell)}
                  </motion.div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-gray-500">Land (1)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
          <span className="text-gray-500">Water (0)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-brand-primary border border-brand-primary" />
          <span className="text-gray-500">Current</span>
        </div>
      </div>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
        >
          Action: <span className="font-medium text-gray-700">{action}</span>
        </motion.div>
      )}
    </div>
  );
}
