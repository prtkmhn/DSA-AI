import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { Check, CheckCircle2, Loader2, RefreshCw, RotateCw, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ReviewCard, ReviewCodeParsonsCard, ReviewGrade, Unit } from "@/lib/types";
import { generateReviewCardBatch } from "@/lib/reviewAI";
import { fetchReviewSnapshot, saveReviewCardsBatch, saveReviewStates } from "@/lib/reviewSync";
import { toast } from "@/hooks/use-toast";

interface InfiniteReviewSessionProps {
  units: Unit[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weightedRandomByOverdue(cards: ReviewCard[], stateById: ReturnType<typeof useStore.getState>["reviewCardState"]): ReviewCard {
  const now = Date.now();
  const weighted = cards.map((card) => {
    const st = stateById[card.id];
    const overdueDays = Math.max(0, (now - (st?.dueAt || now)) / (1000 * 60 * 60 * 24));
    const lapses = st?.lapses || 0;
    return {
      card,
      weight: 1 + overdueDays + lapses * 0.5,
    };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of weighted) {
    rand -= item.weight;
    if (rand <= 0) return item.card;
  }
  return weighted[0].card;
}

function getNextCard(cards: ReviewCard[], stateById: ReturnType<typeof useStore.getState>["reviewCardState"]): ReviewCard | null {
  const now = Date.now();
  const learningCards = cards.filter((c) => {
    const st = stateById[c.id];
    return st && st.phase === "learn" && st.seenCount < 10;
  });

  if (learningCards.length > 0) {
    const minSeen = Math.min(...learningCards.map((c) => stateById[c.id]?.seenCount ?? 0));
    const bucket = learningCards.filter((c) => (stateById[c.id]?.seenCount ?? 0) === minSeen);
    return bucket[Math.floor(Math.random() * bucket.length)];
  }

  const dueCards = cards.filter((c) => {
    const st = stateById[c.id];
    return st && st.phase === "review" && st.dueAt <= now;
  });

  if (dueCards.length === 0) return null;
  return weightedRandomByOverdue(dueCards, stateById);
}

function CodeParsonsCard({
  card,
  onGrade,
}: {
  card: ReviewCodeParsonsCard;
  onGrade: (grade: ReviewGrade) => void;
}) {
  const [ordered, setOrdered] = useState(() => shuffle(card.blocks));
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setOrdered(shuffle(card.blocks));
    setIsCorrect(false);
  }, [card.id, card.blocks]);

  const checkOrder = () => {
    const current = ordered.map((b) => b.id);
    const correct = card.solutionOrder;
    setIsCorrect(JSON.stringify(current) === JSON.stringify(correct));
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900">{card.prompt}</h3>
        <p className="text-xs text-blue-700 mt-1">
          Reorder the lines only. No typing needed.
        </p>
      </div>

      <Reorder.Group axis="y" values={ordered} onReorder={setOrdered} className="space-y-2">
        {ordered.map((block) => (
          <Reorder.Item key={block.id} value={block}>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm">
              <span style={{ paddingLeft: `${block.indent * 1.25}rem` }}>{block.text}</span>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="flex gap-2">
        <button
          onClick={checkOrder}
          className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold"
        >
          Check Order
        </button>
        <button
          onClick={() => setOrdered(shuffle(card.blocks))}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold flex items-center gap-1"
        >
          <RefreshCw size={14} />
          Shuffle
        </button>
      </div>

      {isCorrect && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <div className="text-green-700 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            Correct order
          </div>
          <p className="text-sm text-green-800">{card.explanation}</p>
          <a className="text-xs text-green-700 underline" href={card.leetcodeUrl} target="_blank" rel="noreferrer">
            Open LeetCode problem
          </a>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => onGrade("again")} className="py-2 rounded-lg bg-red-100 text-red-700 font-semibold text-sm">Again</button>
            <button onClick={() => onGrade("hard")} className="py-2 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm">Hard</button>
            <button onClick={() => onGrade("good")} className="py-2 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm">Good</button>
            <button onClick={() => onGrade("easy")} className="py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold text-sm">Easy</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InfiniteReviewSession({ units }: InfiniteReviewSessionProps) {
  const {
    sessionId,
    reviewCards,
    reviewCardState,
    ensureReviewCardsFromUnits,
    addGeneratedReviewCards,
    hydrateReviewFromServer,
    recordReviewResult,
    aiSettings,
  } = useStore();

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [lastGenerationAt, setLastGenerationAt] = useState(0);
  const pendingStateIdsRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<number | null>(null);
  const cardSyncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    ensureReviewCardsFromUnits(units);
  }, [ensureReviewCardsFromUnits, units]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const snapshot = await fetchReviewSnapshot(sessionId);
        if (cancelled) return;
        hydrateReviewFromServer(snapshot.cards, snapshot.states);

        // First-time bootstrap: persist local seed deck when server is empty.
        if (snapshot.cards.length === 0) {
          const state = useStore.getState();
          await saveReviewCardsBatch(sessionId, state.reviewCards);
          await saveReviewStates(sessionId, state.reviewCardState);
        }
      } catch (_error) {
        // local-first fallback: continue with persisted local store
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      if (cardSyncTimerRef.current) window.clearTimeout(cardSyncTimerRef.current);
    };
  }, [sessionId, hydrateReviewFromServer]);

  // Persist card metadata only when card count changes (low-frequency).
  useEffect(() => {
    if (isHydrating) return;
    if (cardSyncTimerRef.current) window.clearTimeout(cardSyncTimerRef.current);
    cardSyncTimerRef.current = window.setTimeout(async () => {
      try {
        await saveReviewCardsBatch(sessionId, useStore.getState().reviewCards);
      } catch {
        // local-first fallback
      }
    }, 1800);
  }, [isHydrating, sessionId, reviewCards.length]);

  const currentCard = useMemo(
    () => reviewCards.find((c) => c.id === currentId) || null,
    [reviewCards, currentId]
  );

  const learnRemaining = useMemo(
    () => reviewCards.filter((c) => (reviewCardState[c.id]?.phase ?? "learn") === "learn" && (reviewCardState[c.id]?.seenCount ?? 0) < 10).length,
    [reviewCards, reviewCardState]
  );
  const dueCount = useMemo(
    () => reviewCards.filter((c) => (reviewCardState[c.id]?.phase ?? "learn") === "review" && (reviewCardState[c.id]?.dueAt ?? 0) <= Date.now()).length,
    [reviewCards, reviewCardState]
  );

  const pickNext = () => {
    const next = getNextCard(reviewCards, reviewCardState);
    setCurrentId(next?.id || null);
    setIsFlipped(false);
  };

  useEffect(() => {
    if (!currentCard) pickNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewCards, reviewCardState]);

  const maybeGenerateBatch = async () => {
    const now = Date.now();
    if (now - lastGenerationAt < 15000) return;
    if (isGenerating) return;
    if (!aiSettings.geminiKey && !aiSettings.groqKey) return;
    setLastGenerationAt(now);
    setIsGenerating(true);
    try {
      const result = await generateReviewCardBatch(units);
      if (result.error) {
        toast({
          title: "Card generation failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        addGeneratedReviewCards(result.cards);
        await saveReviewCardsBatch(sessionId, result.cards);
        const latest = useStore.getState().reviewCardState;
        const subset = Object.fromEntries(
          result.cards
            .map((card) => [card.id, latest[card.id]])
            .filter(([, state]) => !!state)
        );
        if (Object.keys(subset).length > 0) {
          await saveReviewStates(sessionId, subset);
        }
        toast({
          title: "5 new cards added",
          description: `Provider: ${result.provider}. Includes concept + code parsons cards.`,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (currentCard) return;
    if (learnRemaining === 0 && dueCount === 0) {
      maybeGenerateBatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard, learnRemaining, dueCount]);

  const handleGrade = (grade: ReviewGrade) => {
    if (!currentCard) return;
    recordReviewResult(currentCard.id, grade);
    pendingStateIdsRef.current.add(currentCard.id);
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(async () => {
      const ids = Array.from(pendingStateIdsRef.current);
      pendingStateIdsRef.current.clear();
      if (!ids.length) return;
      const latest = useStore.getState().reviewCardState;
      const payload = Object.fromEntries(ids.map((id) => [id, latest[id]]).filter(([, state]) => !!state));
      if (Object.keys(payload).length === 0) return;
      try {
        await saveReviewStates(sessionId, payload);
      } catch (_error) {
        // keep local state; next review events will retry sync
      }
    }, 1200);
    pickNext();
  };

  if (isHydrating) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm text-gray-600">Syncing your review session...</p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        {isGenerating ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
            <p className="text-sm text-gray-600">Generating 5 new review cards...</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-sm text-gray-700 font-medium">You are done for now.</p>
            <p className="text-xs text-gray-500 mt-1">
              {aiSettings.geminiKey || aiSettings.groqKey
                ? "New cards will auto-generate when needed."
                : "Add an AI key in Settings to auto-generate more cards."}
            </p>
            {(aiSettings.geminiKey || aiSettings.groqKey) && (
              <button
                onClick={maybeGenerateBatch}
                className="mt-4 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold"
                disabled={isGenerating}
              >
                Generate 5 More Cards
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4 text-xs text-gray-500 flex justify-between">
        <span>Learning queue: {learnRemaining}</span>
        <span>Due review: {dueCount}</span>
      </div>

      {currentCard.type === "code_parsons" ? (
        <CodeParsonsCard card={currentCard} onGrade={handleGrade} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="perspective-1000 w-full max-w-sm aspect-[3/4] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full relative preserve-3d cursor-pointer"
                onClick={() => setIsFlipped((v) => !v)}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 backface-hidden bg-white border-2 border-gray-100 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Question</h3>
                  <p className="text-xl font-medium text-gray-800 leading-relaxed">{currentCard.front}</p>
                  <div className="absolute bottom-6 text-gray-300 text-xs flex items-center gap-2">
                    <RotateCw size={12} /> Tap to flip
                  </div>
                </div>

                <div
                  className="absolute inset-0 backface-hidden bg-brand-primary text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                  style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                >
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-6">Answer</h3>
                  <p className="text-lg font-medium leading-relaxed">{currentCard.back}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 w-full max-w-sm h-24">
            <AnimatePresence>
              {isFlipped && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleGrade("again")} className="py-3 bg-red-100 text-red-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-1"><X size={16} />Again</button>
                    <button onClick={() => handleGrade("hard")} className="py-3 bg-orange-100 text-orange-700 rounded-xl font-semibold text-sm">Hard</button>
                    <button onClick={() => handleGrade("good")} className="py-3 bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-sm"><Check size={16} />Good</button>
                    <button onClick={() => handleGrade("easy")} className="py-3 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm">Easy</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
