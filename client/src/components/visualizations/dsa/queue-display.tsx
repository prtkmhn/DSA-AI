"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { QueueNode } from "./queue-types";

interface QueueDisplayProps {
  queue: QueueNode[];
  highlightedIndex: number | null;
}

export function QueueDisplay({ queue, highlightedIndex }: QueueDisplayProps) {
  return (
    <Card className="p-6 relative min-h-[400px] flex items-center bg-white border border-gray-200">
      <div className="w-full">
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <ArrowRight className="h-4 w-4" />
            Front
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              Rear
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="relative h-32 border-2 border-brand-primary/30 rounded-lg overflow-hidden bg-gray-50">
          <div className="absolute inset-0 flex items-center">
            <div className="flex gap-2 px-4 w-full">
              <AnimatePresence mode="popLayout">
                {queue.map((node) => (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      backgroundColor:
                        highlightedIndex === node.index ? "#4f46e5" : "#f3f4f6",
                    }}
                    exit={{ opacity: 0, x: -100, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 w-20 h-20 rounded-md flex items-center justify-center border border-gray-200"
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

        <div className="mt-4 text-sm text-gray-500 text-center">
          Queue Size: {queue.length}
        </div>
      </div>
    </Card>
  );
}
