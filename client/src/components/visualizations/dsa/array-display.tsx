"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ArrayDisplayProps {
  data: (number | string)[];
  highlighted?: number[];
  pointers?: Record<string, number>;
  message?: string;
}

export function ArrayDisplay({
  data,
  highlighted = [],
  pointers = {},
  message,
}: ArrayDisplayProps) {
  // Create a map of index to pointer names
  const indexToPointers: Record<number, string[]> = {};
  for (const [name, index] of Object.entries(pointers)) {
    if (!indexToPointers[index]) {
      indexToPointers[index] = [];
    }
    indexToPointers[index].push(name);
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-sm text-gray-600 text-center">{message}</div>
      )}

      <div className="flex justify-center items-end gap-1 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {data.map((value, index) => (
            <motion.div
              key={`${index}-${value}`}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                backgroundColor: highlighted.includes(index)
                  ? "#4f46e5"
                  : "#f3f4f6",
              }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative flex flex-col items-center"
            >
              {/* Pointer labels above */}
              {indexToPointers[index] && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  {indexToPointers[index].map((name) => (
                    <span
                      key={name}
                      className="text-xs font-mono text-brand-primary font-bold"
                    >
                      {name}
                    </span>
                  ))}
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-brand-primary" />
                </div>
              )}

              {/* Array cell */}
              <div
                className={cn(
                  "w-14 h-14 flex items-center justify-center rounded-lg border-2 transition-colors",
                  highlighted.includes(index)
                    ? "border-brand-primary text-white"
                    : "border-gray-200 text-gray-700"
                )}
              >
                <span className="text-lg font-mono font-bold">{value}</span>
              </div>

              {/* Index label below */}
              <span className="text-xs text-gray-400 mt-1 font-mono">
                {index}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Legend for pointers */}
      {Object.keys(pointers).length > 0 && (
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          {Object.entries(pointers).map(([name, index]) => (
            <span key={name} className="font-mono">
              {name} = {index}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
