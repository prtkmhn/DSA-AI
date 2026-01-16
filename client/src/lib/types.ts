export interface Unit {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  lesson: LessonContent;
  toyExample: CodingChallenge;
  mainProblem: MainProblemMetadata;
  parsons: ParsonsProblem;
  flashcards: Flashcard[];
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
