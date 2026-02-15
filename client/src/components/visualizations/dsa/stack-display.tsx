"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { StackNode } from "./stack-types";

interface StackDisplayProps {
  stack: StackNode[];
  highlightedIndex: number | null;
}

export function StackDisplay({ stack, highlightedIndex }: StackDisplayProps) {
  return (
    <div className="relative h-[600px] bg-white rounded-lg p-6 flex items-center justify-center border border-gray-200">
      <div className="relative w-48 h-full border-2 border-brand-primary/30 rounded-lg overflow-hidden">
        <motion.div
          className="absolute right-full mr-4 flex items-center text-brand-primary"
          animate={{
            top: stack.length > 0 ? `${64 * (8 - stack.length)}px` : "calc(100% - 64px)",
          }}
          transition={{ duration: 0.3 }}
        >
          <span className="mr-2 font-mono">top</span>
          <ArrowDown className="h-5 w-5" />
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
          <AnimatePresence mode="popLayout">
            {stack.map((node) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  backgroundColor:
                    highlightedIndex === node.index ? "#4f46e5" : "#f3f4f6",
                }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="h-16 border-t border-brand-primary/20 flex items-center justify-center"
              >
                <span
                  className={`text-lg font-mono ${
                    highlightedIndex === node.index ? "text-white" : "text-gray-700"
                  }`}
                >
                  {node.value}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
