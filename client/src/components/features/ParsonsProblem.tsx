import { Reorder, useDragControls } from "framer-motion";
import { useState, useEffect } from "react";
import { ParsonsProblem as ParsonsType } from "@/lib/types";
import { clsx } from "clsx";
import { GripVertical, EyeOff, Eye } from "lucide-react";
import confetti from "canvas-confetti";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-python";

interface ParsonsProblemProps {
  problem: ParsonsType;
  onComplete: () => void;
  // Stage 0: Reorder only (no distractors ideally, or simple ones)
  // Stage 1: Reorder + Distractors
  // Stage 2: Reorder + Distractors + Some fading
  // Stage 3: Write code from scratch (or heavily faded)
  stage?: number; 
}

export function ParsonsProblem({ problem, onComplete, stage = 0 }: ParsonsProblemProps) {
  // Filter out distractors based on stage? For now, we'll just include them if stage > 0
  const useDistractors = stage > 0;
  
  const [items, setItems] = useState(() => {
    let segments = problem.segments;
    if (!useDistractors) {
      segments = segments.filter(s => !s.isDistractor);
    }
    return segments.sort(() => Math.random() - 0.5);
  });
  
  const [isCorrect, setIsCorrect] = useState(false);

  // Faded logic (Stage 2+)
  // For MVP, we'll keep it simple: Stage 0 is simple reorder.
  
  const checkOrder = () => {
    // Correct sequence is the non-distractor IDs in their original order
    const correctSequence = problem.segments
      .filter(s => !s.isDistractor)
      .map(s => s.id);
      
    // Current user sequence (excluding distractors they might have left in? 
    // Usually parsons UI has a "Solution Area" vs "Bank".
    // For this simple UI, we assume they must sort the whole list correctly?
    // Or maybe just the top N items must match?
    // Let's simplified: The user must arrange the CORRECT items in order at the TOP.
    // Distractors can be anywhere else? Or must be at bottom?
    // Simplest for mobile: Just one list. User must put correct items in order. Distractors?
    // If distractors are present, it's hard to validate in a single list without a "bin".
    // Let's implement a toggle/select for distractors?
    // Or better: Just check if the correct items are in relative order?
    // Let's stick to strict equality of the whole list for Stage 0 (no distractors).
    
    const currentSequence = items.map(s => s.id);

    // If distractors are present (Stage > 0), we need to ensure correct items are in order AND distractors are handled?
    // Actually, typical Parsons has a "drop zone".
    // MVP: Single list reorder. If distractors exist, they must be moved to the BOTTOM or removed?
    // Let's just do Stage 0 (No distractors) perfectly first.
    
    if (JSON.stringify(correctSequence) === JSON.stringify(currentSequence)) {
      setIsCorrect(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(onComplete, 1500);
    } else {
      const btn = document.getElementById("check-btn");
      btn?.classList.add("animate-shake");
      setTimeout(() => btn?.classList.remove("animate-shake"), 500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
        {problem.description}
      </div>

      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
        {items.map((item) => (
          <Reorder.Item key={item.id} value={item}>
            <div className={clsx(
              "flex items-center gap-3 p-3 bg-white border-2 rounded-xl shadow-sm active:cursor-grabbing cursor-grab touch-none select-none transition-colors",
              isCorrect ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-brand-secondary/50",
              item.isDistractor && stage > 0 && "border-dashed" // Visual hint for dev/debug
            )}>
              <GripVertical className="text-gray-300" size={20} />
              <div className="flex-1 font-mono text-sm text-gray-800" style={{ paddingLeft: `${item.indent * 1.5}rem` }}>
                 {/* Faded logic would go here: Replace tokens with Inputs */}
                 {item.code}
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <button
        id="check-btn"
        onClick={checkOrder}
        disabled={isCorrect}
        className={clsx(
          "w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all btn-press",
          isCorrect ? "bg-green-500 text-white" : "bg-brand-secondary text-white hover:bg-brand-secondary-dark"
        )}
      >
        {isCorrect ? "Correct!" : "Check Solution"}
      </button>
    </div>
  );
}
