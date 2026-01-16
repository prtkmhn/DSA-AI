import { MobileLayout } from "@/components/layout/MobileLayout";
import { FlashcardReview } from "@/components/features/FlashcardReview";
import { useStore } from "@/lib/store";
import { UNITS } from "@/lib/data";
import { useMemo, useState } from "react";
import { CheckCircle2, Layers } from "lucide-react";
import { Link } from "wouter";

export default function ReviewPage() {
  const { flashcardData } = useStore();
  const [sessionComplete, setSessionComplete] = useState(false);

  // Flatten all cards from all units
  const allCards = useMemo(() => UNITS.flatMap(u => u.flashcards), []);

  // Filter cards due for review
  const dueCards = useMemo(() => {
    const now = Date.now();
    return allCards.filter(card => {
      const state = flashcardData[card.id];
      // If no state, it's new (due). If state exists, check nextReview.
      return !state || state.nextReview <= now;
    });
  }, [allCards, flashcardData]);

  if (sessionComplete) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="text-green-500" size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h1>
          <p className="text-gray-500 mb-8">You've reviewed all your due cards for today. Great job keeping your streak alive.</p>
          <Link href="/">
            <button className="bg-brand-primary text-white font-bold py-3 px-8 rounded-xl shadow-brand btn-press">
              Back to Home
            </button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
       <div className="h-[calc(100vh-80px)] flex flex-col">
        <header className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-brand-secondary" />
            Review Session
          </h1>
          <p className="text-sm text-gray-500">
            {dueCards.length} cards due today
          </p>
        </header>

        <div className="flex-1">
          {dueCards.length > 0 ? (
            <FlashcardReview 
              cards={dueCards} 
              onComplete={() => setSessionComplete(true)} 
            />
          ) : (
             <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 font-medium">No cards due right now.</p>
              <p className="text-sm text-gray-400 mt-2">Check back later or start a new lesson!</p>
            </div>
          )}
        </div>
       </div>
    </MobileLayout>
  );
}
