import { useState, useEffect } from "react";
import { Flashcard } from "@/lib/types";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Check, X } from "lucide-react";
import { clsx } from "clsx";

interface FlashcardReviewProps {
  cards: Flashcard[];
  onComplete: () => void;
}

export function FlashcardReview({ cards, onComplete }: FlashcardReviewProps) {
  const [reviewQueue] = useState(() => [...cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const updateFlashcard = useStore((s) => s.updateFlashcard);

  const currentCard = reviewQueue[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleGrade = (quality: number) => {
    if (!currentCard) return;
    
    updateFlashcard(currentCard.id, quality);
    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentIndex < reviewQueue.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        onComplete();
      }
    }, 200);
  };

  if (!currentCard) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-6">
        {reviewQueue.map((_, i) => (
          <div 
            key={i} 
            className={clsx(
              "h-1.5 rounded-full flex-1 transition-colors max-w-8",
              i < currentIndex ? "bg-brand-primary" : 
              i === currentIndex ? "bg-gray-300" : "bg-gray-100"
            )} 
          />
        ))}
      </div>

      <div className="perspective-1000 w-full max-w-sm aspect-[3/4] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full relative preserve-3d cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div 
              className="absolute inset-0 backface-hidden bg-white border-2 border-gray-100 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Question</h3>
              <p className="text-2xl font-medium text-gray-800 leading-relaxed">{currentCard.front}</p>
              <div className="absolute bottom-8 text-gray-300 text-sm flex items-center gap-2">
                <RotateCw size={14} /> Tap to flip
              </div>
            </div>

            <div 
              className="absolute inset-0 backface-hidden bg-brand-primary text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
              style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden' }}
            >
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-8">Answer</h3>
              <p className="text-xl font-medium leading-relaxed">{currentCard.back}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 w-full max-w-sm h-16">
        <AnimatePresence>
          {isFlipped && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex gap-4 w-full"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleGrade(1); }}
                className="flex-1 py-4 bg-red-100 text-red-600 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-red-200 transition-colors active:scale-95"
                data-testid="button-grade-hard"
              >
                <X size={20} />
                Hard
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleGrade(4); }}
                className="flex-1 py-4 bg-green-100 text-green-600 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-green-200 transition-colors active:scale-95"
                data-testid="button-grade-easy"
              >
                <Check size={20} />
                Easy
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
