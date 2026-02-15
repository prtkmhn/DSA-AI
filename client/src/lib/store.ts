import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Unit, ReviewCard, ReviewCardState, ReviewGrade } from './types';
import { UNITS as DEFAULT_UNITS } from './data';

interface UserProgress {
  completedUnits: string[];
  unlockedUnits: string[];
  parsonsProgress: Record<string, number>; // unitId -> stage (0-3)
}

interface FlashcardState {
  nextReview: number; // Timestamp
  interval: number; // Days
  repetition: number;
  efactor: number;
}

export interface AISettings {
  geminiKey: string;
  groqKey: string;
  primaryProvider: 'gemini' | 'groq';
  enableFallback: boolean;
}

export interface TrackedProblem {
  id: string;
  topic: string;
  status: 'generating' | 'needs_fix' | 'verified';
  createdAt: number;
  unitId?: string;
}

interface AppState {
  sessionId: string;
  progress: UserProgress;
  flashcardData: Record<string, FlashcardState>;
  aiSettings: AISettings;
  trackedProblems: TrackedProblem[];
  units: Unit[];
  reviewCards: ReviewCard[];
  reviewCardState: Record<string, ReviewCardState>;
  
  // Actions
  completeUnit: (unitId: string) => void;
  updateFlashcard: (cardId: string, quality: number) => void;
  unlockUnit: (unitId: string) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  addUnit: (unit: Unit) => void;
  ensureReviewCardsFromUnits: (units: Unit[]) => void;
  addGeneratedReviewCards: (cards: ReviewCard[]) => void;
  hydrateReviewFromServer: (cards: ReviewCard[], states: Record<string, ReviewCardState>) => void;
  recordReviewResult: (cardId: string, grade: ReviewGrade) => void;
  
  // Unit Updates
  updateUnit: (unitId: string, updates: Partial<Unit>) => void;

  // Problem Creator Actions
  addTrackedProblem: (topic: string) => string;
  updateProblemStatus: (id: string, status: TrackedProblem['status'], unitId?: string) => void;
  removeTrackedProblem: (id: string) => void;
}

function seedCardsFromUnits(units: Unit[]): ReviewCard[] {
  return units.flatMap((unit) =>
    (unit.flashcards || []).map((card) => ({
      id: card.id,
      unitId: card.unitId,
      type: 'concept' as const,
      source: 'seed' as const,
      front: card.front,
      back: card.back,
      tags: [unit.title]
    }))
  );
}

function initialReviewState(): ReviewCardState {
  return {
    phase: 'learn',
    seenCount: 0,
    dueAt: 0,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    lapses: 0,
  };
}

function qualityFromGrade(grade: ReviewGrade): number {
  if (grade === 'again') return 1;
  if (grade === 'hard') return 2;
  if (grade === 'good') return 4;
  return 5;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      sessionId: crypto.randomUUID(),
      progress: {
        completedUnits: [],
        unlockedUnits: ['two-sum'],
        parsonsProgress: {},
      },
      flashcardData: {},
      aiSettings: {
        geminiKey: '',
        groqKey: '',
        primaryProvider: 'gemini',
        enableFallback: true,
      },
      trackedProblems: [],
      units: DEFAULT_UNITS,
      reviewCards: seedCardsFromUnits(DEFAULT_UNITS),
      reviewCardState: Object.fromEntries(
        seedCardsFromUnits(DEFAULT_UNITS).map((card) => [card.id, initialReviewState()])
      ),

      unlockUnit: (unitId) => set((state) => ({
        progress: {
          ...state.progress,
          unlockedUnits: state.progress.unlockedUnits.includes(unitId) 
            ? state.progress.unlockedUnits 
            : [...state.progress.unlockedUnits, unitId]
        }
      })),

      completeUnit: (unitId) => set((state) => ({
        progress: {
          ...state.progress,
          completedUnits: state.progress.completedUnits.includes(unitId)
            ? state.progress.completedUnits
            : [...state.progress.completedUnits, unitId]
        }
      })),

      updateFlashcard: (cardId, quality) => set((state) => {
        const current = state.flashcardData[cardId] || { nextReview: 0, interval: 0, repetition: 0, efactor: 2.5 };
        
        let { interval, repetition, efactor } = current;

        if (quality >= 3) {
          if (repetition === 0) interval = 1;
          else if (repetition === 1) interval = 6;
          else interval = Math.round(interval * efactor);
          repetition += 1;
        } else {
          repetition = 0;
          interval = 1;
        }

        efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (efactor < 1.3) efactor = 1.3;

        const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

        return {
          flashcardData: {
            ...state.flashcardData,
            [cardId]: { nextReview, interval, repetition, efactor }
          }
        };
      }),

      updateAISettings: (settings) => set((state) => ({
        aiSettings: { ...state.aiSettings, ...settings }
      })),

      addUnit: (unit) => set((state) => ({
        units: [...state.units, unit]
      })),

      ensureReviewCardsFromUnits: (units) => set((state) => {
        const existingById = new Set(state.reviewCards.map((c) => c.id));
        const additions = seedCardsFromUnits(units).filter((card) => !existingById.has(card.id));
        if (additions.length === 0) return {};

        const nextStates = { ...state.reviewCardState };
        additions.forEach((card) => {
          nextStates[card.id] = initialReviewState();
        });

        return {
          reviewCards: [...state.reviewCards, ...additions],
          reviewCardState: nextStates,
        };
      }),

      addGeneratedReviewCards: (cards) => set((state) => {
        const byId = new Set(state.reviewCards.map((c) => c.id));
        const unique = cards.filter((c) => !byId.has(c.id));
        if (unique.length === 0) return {};

        const nextStates = { ...state.reviewCardState };
        unique.forEach((card) => {
          nextStates[card.id] = initialReviewState();
        });

        return {
          reviewCards: [...state.reviewCards, ...unique],
          reviewCardState: nextStates,
        };
      }),

      hydrateReviewFromServer: (cards, states) => set((state) => {
        const byId = new Map<string, ReviewCard>();
        state.reviewCards.forEach((card) => byId.set(card.id, card));
        cards.forEach((card) => byId.set(card.id, card));

        return {
          reviewCards: Array.from(byId.values()),
          reviewCardState: {
            ...state.reviewCardState,
            ...states,
          },
        };
      }),

      recordReviewResult: (cardId, grade) => set((state) => {
        const prev = state.reviewCardState[cardId] || initialReviewState();
        const now = Date.now();

        // Learning phase: require 10 exposures before moving to spaced review.
        if (prev.phase === 'learn') {
          const seenCount = prev.seenCount + 1;
          const hasGraduated = seenCount >= 10;
          return {
            reviewCardState: {
              ...state.reviewCardState,
              [cardId]: {
                ...prev,
                phase: hasGraduated ? 'review' : 'learn',
                seenCount,
                dueAt: hasGraduated ? now + 24 * 60 * 60 * 1000 : now,
                interval: hasGraduated ? 1 : 0,
                repetition: hasGraduated ? 1 : 0,
                lastReviewedAt: now,
              }
            }
          };
        }

        // Review phase: SM-2 style scheduling.
        const quality = qualityFromGrade(grade);
        let { interval, repetition, efactor, lapses } = prev;

        if (quality < 3) {
          repetition = 0;
          interval = 1;
          lapses += 1;
        } else {
          if (repetition === 0) interval = 1;
          else if (repetition === 1) interval = 6;
          else {
            const bonus = quality === 5 ? 1.15 : 1;
            interval = Math.max(1, Math.round(interval * efactor * bonus));
          }
          repetition += 1;
        }

        efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (efactor < 1.3) efactor = 1.3;

        return {
          reviewCardState: {
            ...state.reviewCardState,
            [cardId]: {
              ...prev,
              phase: 'review',
              interval,
              repetition,
              efactor,
              lapses,
              dueAt: now + interval * 24 * 60 * 60 * 1000,
              lastReviewedAt: now,
            }
          }
        };
      }),

      updateUnit: (unitId, updates) => set((state) => ({
        units: state.units.map(u => u.id === unitId ? { ...u, ...updates } : u)
      })),

      addTrackedProblem: (topic) => {
        const id = crypto.randomUUID();
        set((state) => ({
          trackedProblems: [
            {
              id,
              topic,
              status: 'generating',
              createdAt: Date.now()
            },
            ...state.trackedProblems
          ]
        }));
        return id;
      },

      updateProblemStatus: (id, status, unitId) => set((state) => ({
        trackedProblems: state.trackedProblems.map(p =>
          p.id === id ? { ...p, status, unitId: unitId || p.unitId } : p
        )
      })),

      removeTrackedProblem: (id) => set((state) => ({
        trackedProblems: state.trackedProblems.filter(p => p.id !== id)
      })),
    }),
    {
      name: 'pattern-master-storage',
    }
  )
);
