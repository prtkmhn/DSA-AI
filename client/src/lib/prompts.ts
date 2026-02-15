// ─── Centralized AI Prompts ───────────────────────────────────────────────────
// Single source of truth for all AI prompt strings used across the app.

// ─── Shared Format Constants ─────────────────────────────────────────────────

export const PARSONS_BLOCK_FORMAT = `"blocks": [
      {"id": "p1", "text": "def solve(nums, target):", "indent": 0, "isBlank": false},
      {"id": "p2", "text": "seen = {}", "indent": 1, "isBlank": false},
      {"id": "p3", "text": "for i, n in enumerate(nums):", "indent": 1, "isBlank": false},
      {"id": "p4", "text": "", "indent": 2, "isBlank": true, "placeholder": "calculate the complement", "answer": "diff = target - n"},
      {"id": "p5", "text": "if diff in seen:", "indent": 2, "isBlank": false},
      {"id": "p6", "text": "", "indent": 3, "isBlank": true, "placeholder": "return both indices", "answer": "return [seen[diff], i]"},
      {"id": "p7", "text": "seen[n] = i", "indent": 2, "isBlank": false}
    ]`;

export const TEST_HARNESS_FORMAT = `"testHarness": "def run_tests():\\n    tests = [([2,7,11,15], 9, [0,1]), ([3,2,4], 6, [1,2])]\\n    results = []\\n    for nums, target, expected in tests:\\n        try:\\n            got = solve(nums, target)\\n            results.append({\\"input\\": f\\"nums={nums}, target={target}\\", \\"expected\\": str(expected), \\"actual\\": str(got), \\"passed\\": got == expected})\\n        except Exception as e:\\n            results.append({\\"input\\": f\\"nums={nums}, target={target}\\", \\"expected\\": str(expected), \\"actual\\": \\"Error\\", \\"passed\\": False, \\"error\\": str(e)})\\n    return results"`;

export const UNIT_JSON_SCHEMA = `{
  "id": "kebab-case-id",
  "title": "Title",
  "description": "Short description",
  "icon": "Zap",
  "lesson": {
    "title": "Lesson Title",
    "slides": [
      {"id": "s1", "type": "concept", "title": "Title", "content": "Content explaining the concept"},
      {"id": "s2", "type": "analogy", "title": "Title", "content": "Real-world analogy"},
      {"id": "s3", "type": "code", "title": "Title", "content": "Code explanation", "codeSnippet": "python code example"}
    ]
  },
  "toyExample": {
    "title": "Toy Problem",
    "description": "Description",
    "starterCode": "def solve(nums, target):\\n    # TODO: implement\\n    pass",
    "solution": "def solve(nums, target):\\n    seen = {}\\n    for i, n in enumerate(nums):\\n        if target - n in seen:\\n            return [seen[target-n], i]\\n        seen[n] = i",
    ${TEST_HARNESS_FORMAT}
  },
  "mainProblem": {
    "title": "Problem Name",
    "difficulty": "Easy",
    "patterns": ["Pattern"],
    "externalLink": "https://leetcode.com/problems/..."
  },
  "parsons": {
    "title": "Build the Solution",
    "description": "Drag blocks and fill in the blanks",
    ${PARSONS_BLOCK_FORMAT},
    "solution_order": ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]
  },
  "flashcards": [
    {"id": "f1", "unitId": "kebab-case-id", "front": "Question?", "back": "Answer"}
  ],
  "testCases": [
    {"input": [[2, 7, 11, 15], 9], "expected": [0, 1]},
    {"input": [[3, 2, 4], 6], "expected": [1, 2]}
  ],
  "visualizationSteps": [
    {
      "stepNumber": 1,
      "visualizationType": "array",
      "data": [2, 7, 11, 15],
      "highlighted": [],
      "pointers": {},
      "variables": {"target": 9},
      "message": "Initial state description"
    },
    {
      "stepNumber": 2,
      "visualizationType": "array",
      "data": [2, 7, 11, 15],
      "highlighted": [0],
      "pointers": {"i": 0},
      "variables": {"target": 9, "current": 2},
      "message": "Processing first element"
    }
  ]
}`;

export const PARSONS_REQUIREMENTS = `CRITICAL REQUIREMENTS:
1. Use the REAL LeetCode problem data (grounding search results) for test cases and correct solution approach
2. parsons.blocks MUST exist (NOT parsons.segments) with "isBlank": true for 2-3 lines. For blank lines: "text": "" with "isBlank": true and "answer": "actual code" containing the correct code for that line
3. PLACEHOLDER MUST BE A HINT, NOT THE ANSWER! Examples:
   - WRONG: "placeholder": "diff = target - n" (this reveals the answer!)
   - RIGHT: "placeholder": "calculate the complement" (this is a hint)
   - WRONG: "placeholder": "return [seen[diff], i]"
   - RIGHT: "placeholder": "return both indices"
4. testHarness MUST:
   - Use REAL test cases from the actual problem (at least 3-5 test cases)
   - Return list of dicts with "input", "expected", "actual", "passed" keys
   - Handle exceptions properly
   - The function name in testHarness must match the function defined in parsons.blocks
5. visualizationSteps MUST have 6-12 steps showing the algorithm step-by-step
6. All code must be valid Python. The parsons.blocks when assembled should form a WORKING solution
7. mainProblem.externalLink should be the REAL LeetCode URL for this problem`;

export const QUICK_ACTION_PROMPTS = {
  hint: "Give me a hint for solving this problem. Don't give away the answer, just point me in the right direction.",
  explain: "Explain the solution step by step. Help me understand the algorithm and why each part of the code works.",
  error: "Look at my CURRENT CODE above and the error. Identify the exact line causing the error. Tell me whether this is: (1) a block ordering issue (blocks dragged into wrong order), (2) an indentation issue, (3) a wrong blank fill-in (and which blank), or (4) a broken block problem (the blocks themselves are wrong and can't produce working code even with correct ordering). Give me a specific fix suggestion without revealing the full solution.",
  regenerate: "Generate a new similar problem for me to practice with different inputs and slightly different requirements. Give me the problem description and test cases.",
  visualize: "Create a visual diagram to help me understand this algorithm better.",
  fix: "The parsons blocks for this problem appear to be broken — they produce errors even when correctly ordered. Please regenerate CORRECT parsons blocks and test harness for the same problem. Return ONLY valid JSON (no markdown, no code blocks) in this exact format:\n{\n  \"title\": \"Problem Title\",\n  \"description\": \"Problem description\",\n  \"blocks\": [{\"id\": \"p1\", \"text\": \"def solve(...):\", \"indent\": 0, \"isBlank\": false}, ...],\n  \"testCases\": [{\"input\": [...], \"expected\": ...}],\n  \"testHarness\": \"def run_tests():\\n    ...\"\n}\n\nRequirements:\n- Keep the same function/problem, just fix the blocks so they assemble into working Python\n- Include 2-3 blank lines with hint placeholders (NOT the actual code!)\n- Blank lines must have \"isBlank\": true, \"text\": \"\", \"placeholder\": \"hint\", \"answer\": \"actual code\"\n- Test harness must return list of dicts with \"input\", \"expected\", \"actual\", \"passed\" keys\n- All code must be valid Python",
} as const;

// ─── Builder Functions ───────────────────────────────────────────────────────

export function buildUnitGenerationPrompt(topic: string): string {
  return `You are creating a DSA Learning Unit for: "${topic}".

IMPORTANT: Use Google Search to find the exact problem description, constraints, and example test cases from LeetCode.
If "${topic}" looks like a LeetCode slug (e.g. "two-sum", "container-with-most-water"), search for it directly on leetcode.com.
If it's a general topic (e.g. "Sliding Window"), pick a classic representative problem for it.
Use the REAL problem description, constraints, and example test cases from the actual LeetCode problem.
Ensure your solution and test cases are CORRECT and verified against the real problem.

Return ONLY valid JSON (no markdown, no code blocks) matching this EXACT structure:
${UNIT_JSON_SCHEMA}

${PARSONS_REQUIREMENTS}`;
}

export function buildLessonHintPrompt(unitTitle: string, slideContent: string): string {
  return `Explain the concept of "${unitTitle}" specifically regarding: ${slideContent}. Keep it brief, encouraging, and use a simple analogy.`;
}

export interface TutorPromptContext {
  problemTitle: string;
  problemDescription: string;
  blocksCode: string;
  blankDetails?: string;
  testCases: Array<{ input: any; expected: any }>;
  errorContext: string;
}

export function buildTutorSystemPrompt(ctx: TutorPromptContext): string {
  return `You are a helpful coding tutor for a Faded Parsons problem learning app.

CURRENT PROBLEM: ${ctx.problemTitle}
${ctx.problemDescription}

USER'S CURRENT CODE:
\`\`\`python
${ctx.blocksCode}
\`\`\`
${ctx.blankDetails || ""}
TEST CASES:
${ctx.testCases.map((tc) => `- Input: ${JSON.stringify(tc.input)} → Expected: ${JSON.stringify(tc.expected)}`).join("\n")}${ctx.errorContext}

YOUR ROLE:
- Help users understand the problem and algorithm
- If there's an error, look at the CURRENT CODE above (which shows exactly what the user has assembled) and identify the exact line causing the issue
- Distinguish between: block ordering issues, indentation issues, wrong blank fill-ins, or broken blocks (error even with correct code)
- Give hints when asked (don't give away the full answer immediately)
- Explain concepts step-by-step
- When showing code, use proper markdown code blocks
- Be encouraging and educational

IMPORTANT: The user is learning - guide them to the answer rather than just giving it.`;
}

export function buildProblemRegenerationPrompt(currentProblemTitle: string): string {
  return `Generate a NEW Faded Parsons problem similar to "${currentProblemTitle}" but with different inputs/requirements.

Return ONLY valid JSON in this exact format (no markdown, no code blocks, no explanation):
{
  "title": "New Problem Title",
  "description": "Problem description explaining what to solve",
  ${PARSONS_BLOCK_FORMAT},
  "testCases": [
    {"input": [[1,2,3], 4], "expected": [0,1]}
  ],
  ${TEST_HARNESS_FORMAT}
}

REQUIREMENTS:
- Create a DIFFERENT but related problem (similar algorithm pattern)
- Include 2-3 blank lines with helpful hint placeholders (NOT the actual code!)
- Placeholder should be hints like "check condition" not actual code
- Test harness function name must match the function in blocks
- All code must be valid Python
- Return ONLY the JSON, nothing else`;
}
