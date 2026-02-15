import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ArrayVisualizerProps {
  data: any[];
  highlighted: number[];
  pointers: Record<string, number>;
  action?: string;
}

export function ArrayVisualizer({ data, highlighted, pointers, action }: ArrayVisualizerProps) {
  if (!Array.isArray(data)) {
    return <div className="text-gray-500 text-center">Invalid array data</div>;
  }

  const getPointerLabels = (index: number): string[] => {
    const labels: string[] = [];
    if (pointers) {
      Object.entries(pointers).forEach(([label, idx]) => {
        if (idx === index) {
          labels.push(label);
        }
      });
    }
    return labels;
  };

  const isHighlighted = (index: number) => {
    if (!highlighted) return false;
    return highlighted.includes(index);
  };

  return (
    <div className="flex flex-col items-center gap-4" data-testid="array-visualizer">
      <div className="flex flex-wrap justify-center gap-2">
        {data.map((value, index) => {
          const pointerLabels = getPointerLabels(index);
          const isHighlightedCell = isHighlighted(index);

          return (
            <div key={index} className="flex flex-col items-center">
              {pointerLabels.length > 0 && (
                <div className="flex gap-1 mb-1">
                  {pointerLabels.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] font-mono text-brand-primary font-bold px-1 bg-brand-primary/10 rounded"
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
                  opacity: 1,
                  backgroundColor: isHighlightedCell ? "rgb(99 102 241)" : "rgb(241 245 249)"
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center font-mono text-sm font-medium border-2 transition-colors",
                  isHighlightedCell
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/30"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                )}
                data-testid={`array-cell-${index}`}
              >
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </motion.div>
              <span className="text-[10px] text-gray-400 mt-1 font-mono">{index}</span>
            </div>
          );
        })}
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
