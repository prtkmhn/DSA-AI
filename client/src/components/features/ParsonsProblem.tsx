import { Reorder, useDragControls } from "framer-motion";
import { useState, useEffect } from "react";
import { ParsonsProblem as ParsonsType } from "@/lib/types";
import { clsx } from "clsx";
import { GripVertical } from "lucide-react";
import confetti from "canvas-confetti";

interface ParsonsProblemProps {
  problem: ParsonsType;
  onComplete: () => void;
}

export function ParsonsProblem({ problem, onComplete }: ParsonsProblemProps) {
  const [items, setItems] = useState(problem.segments.filter(s => !s.isDistractor).sort(() => Math.random() - 0.5));
  const [isCorrect, setIsCorrect] = useState(false);

  const checkOrder = () => {
    const correctSequence = problem.segments.filter(s => !s.isDistractor).map(s => s.id);
    const currentSequence = items.map(s => s.id);

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
              isCorrect ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-brand-secondary/50"
            )}>
              <GripVertical className="text-gray-300" size={20} />
              <code 
                className="font-mono text-sm text-gray-800 flex-1" 
                style={{ marginLeft: `${item.indent * 1.5}rem` }}
              >
                {item.code}
              </code>
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
