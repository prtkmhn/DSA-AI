// Enhanced Parsons Block for Faded effect
export interface ParsonsBlock {
  id: string;
  text: string;           // Code text (empty string if isBlank)
  indent: number;         // Indentation level (0, 1, 2...)
  isBlank?: boolean;      // True for fill-in-the-blank lines
  placeholder?: string;   // Hint text for blank lines
  answer?: string;        // Correct code for blank lines (used by Show Solution)
  isDistractor?: boolean; // Lines that shouldn't be in solution
}

// Enhanced Parsons Spec (supports both old segments and new blocks format)
export interface FadedParsonsSpec {
  title: string;
  description: string;
  blocks?: ParsonsBlock[];
  segments?: {
    id: string;
    code: string;
    indent: number;
    isDistractor?: boolean;
    fadedTokens?: string[];
  }[];
  solution_order?: string[];
}

// Visualization Step
export interface VisualizationStep {
  stepNumber: number;
  visualizationType: "array" | "matrix" | "stack" | "queue" | "tree" | "graph" | "linkedlist";
  data: any;
  highlighted: number[] | number[][];
  pointers: Record<string, number | number[]>;
  variables: Record<string, any>;
  message: string;
  action?: string;
}

// Test Case for Python verification
export interface TestCase {
  input: any[];
  expected: any;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  lesson: LessonContent;
  toyExample: CodingChallenge;
  mainProblem: MainProblemMetadata;
  parsons: ParsonsProblem | FadedParsonsSpec;
  flashcards: Flashcard[];
  visualizationSteps?: VisualizationStep[];  // NEW
  testCases?: TestCase[];                     // NEW
}

export interface LessonContent {
  title: string;
  slides: {
    id: string;
    type: 'concept' | 'analogy' | 'code';
    title: string;
    content: string; // Markdown supported
    codeSnippet?: string; // Python
  }[];
}

export interface CodingChallenge {
  title: string;
  description: string;
  starterCode: string;
  solution: string; // For verification reference
  testHarness: string; // Python code that runs the function against cases
}

export interface MainProblemMetadata {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  patterns: string[];
  externalLink: string; // LeetCode link
}

export interface ParsonsProblem {
  title: string;
  description: string;
  segments: {
    id: string;
    code: string;
    indent: number; // Correct indentation level (0, 1, 2...)
    isDistractor?: boolean;
    fadedTokens?: string[]; // For fading stages (later)
  }[];
}

export interface Flashcard {
  id: string;
  unitId: string;
  front: string;
  back: string;
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewConceptCard {
  id: string;
  unitId: string;
  type: 'concept';
  source: 'seed' | 'ai';
  front: string;
  back: string;
  tags?: string[];
}

export interface ReviewCodeParsonsCard {
  id: string;
  unitId: string;
  type: 'code_parsons';
  source: 'ai';
  prompt: string;
  explanation: string;
  leetcodeUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  functionName: string;
  blocks: ParsonsBlock[];
  solutionOrder: string[];
}

export type ReviewCard = ReviewConceptCard | ReviewCodeParsonsCard;

export interface ReviewCardState {
  phase: 'learn' | 'review';
  seenCount: number;
  dueAt: number;
  interval: number;
  repetition: number;
  efactor: number;
  lapses: number;
  lastReviewedAt?: number;
}

export interface TestResult {
  passed: boolean;
  results: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    error?: string;
  }[];
  error?: string; // Global error (syntax etc)
}
