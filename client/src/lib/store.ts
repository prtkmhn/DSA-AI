import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Unit } from './types';
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
  progress: UserProgress;
  flashcardData: Record<string, FlashcardState>;
  aiSettings: AISettings;
  trackedProblems: TrackedProblem[];
  units: Unit[];
  
  // Actions
  completeUnit: (unitId: string) => void;
  updateFlashcard: (cardId: string, quality: number) => void;
  unlockUnit: (unitId: string) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  addUnit: (unit: Unit) => void;
  
  // Problem Creator Actions
  addTrackedProblem: (topic: string) => string;
  updateProblemStatus: (id: string, status: TrackedProblem['status'], unitId?: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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

      unlockUnit: (unitId) => set((state) => ({
        progress: {
          ...state.progress,
          unlockedUnits: [...new Set([...state.progress.unlockedUnits, unitId])]
        }
      })),

      completeUnit: (unitId) => set((state) => ({
        progress: {
          ...state.progress,
          completedUnits: [...new Set([...state.progress.completedUnits, unitId])]
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
    }),
    {
      name: 'pattern-master-storage',
    }
  )
);
