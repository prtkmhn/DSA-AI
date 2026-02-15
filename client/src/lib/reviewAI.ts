import { generateAIContent } from "./ai";
import { ReviewCard, ReviewCodeParsonsCard } from "./types";
import { Unit } from "./types";

interface GenerateReviewCardsResult {
  cards: ReviewCard[];
  provider: 'gemini' | 'groq';
  error?: string;
}

function parseJSON<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g, "$1").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.substring(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function normalizeDifficulty(value: string): "Easy" | "Medium" | "Hard" {
  if (value === "Easy" || value === "Medium" || value === "Hard") return value;
  return "Medium";
}

function validateParsonsCard(card: any): card is ReviewCodeParsonsCard {
  if (!card || card.type !== "code_parsons") return false;
  if (!Array.isArray(card.blocks) || card.blocks.length < 4) return false;
  if (!Array.isArray(card.solutionOrder) || card.solutionOrder.length !== card.blocks.length) return false;
  if (typeof card.prompt !== "string" || typeof card.explanation !== "string") return false;
  if (typeof card.leetcodeUrl !== "string" || !card.leetcodeUrl.includes("leetcode.com/problems/")) return false;
  return true;
}

function validateCards(rawCards: any[]): ReviewCard[] {
  const cards: ReviewCard[] = [];
  for (const raw of rawCards) {
    if (!raw || typeof raw !== "object") continue;
    if (raw.type === "concept") {
      if (!raw.id || !raw.unitId || !raw.front || !raw.back) continue;
      cards.push({
        id: raw.id,
        unitId: raw.unitId,
        type: "concept",
        source: "ai",
        front: raw.front,
        back: raw.back,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
      });
      continue;
    }

    if (raw.type === "code_parsons") {
      const normalized = {
        ...raw,
        source: "ai",
        difficulty: normalizeDifficulty(raw.difficulty),
      };
      if (!validateParsonsCard(normalized)) continue;
      cards.push(normalized as ReviewCodeParsonsCard);
    }
  }
  return cards;
}

export async function generateReviewCardBatch(units: Unit[]): Promise<GenerateReviewCardsResult> {
  const topicSummary = units
    .slice(0, 12)
    .map((u) => `- unitId=${u.id}, title=${u.title}, leetcode=${u.mainProblem?.externalLink || "N/A"}`)
    .join("\n");

  const prompt = `You are generating review cards for an infinite DSA spaced-repetition app.

Create EXACTLY 5 cards as JSON for currently available units.

Units:
${topicSummary}

Return ONLY valid JSON with this exact top-level structure:
{
  "cards": [
    {
      "id": "unique-kebab-id",
      "unitId": "must-match-existing-unit-id",
      "type": "concept",
      "front": "Question",
      "back": "Answer",
      "tags": ["tag1", "tag2"]
    },
    {
      "id": "unique-kebab-id",
      "unitId": "must-match-existing-unit-id",
      "type": "code_parsons",
      "prompt": "Question asking learner to reconstruct the full Python solution",
      "explanation": "Short explanation of why solution works",
      "leetcodeUrl": "https://leetcode.com/problems/...",
      "difficulty": "Easy",
      "functionName": "twoSum",
      "blocks": [
        {"id": "l1", "text": "def twoSum(nums, target):", "indent": 0, "isBlank": false},
        {"id": "l2", "text": "prev = {}", "indent": 1, "isBlank": false}
      ],
      "solutionOrder": ["l1", "l2"]
    }
  ]
}

Critical rules:
1) EXACTLY 5 cards total.
2) At least 2 cards MUST be type "code_parsons".
3) code_parsons cards must be full jumbled Python line blocks only (no blank lines, no typing required).
4) Each code_parsons card must map to a real LeetCode problem URL.
5) unitId must be one of the provided unit ids.
6) Keep concept cards concise and useful for memory retrieval.
7) Return JSON only; no markdown.`;

  const result = await generateAIContent(prompt);
  if (result.error) {
    return { cards: [], provider: result.provider, error: result.error };
  }

  const parsed = parseJSON<{ cards: any[] }>(result.text);
  if (!parsed || !Array.isArray(parsed.cards)) {
    return { cards: [], provider: result.provider, error: "AI did not return valid review card JSON." };
  }

  const validCards = validateCards(parsed.cards);
  const codeParsonsCount = validCards.filter((c) => c.type === "code_parsons").length;
  const allUnitIds = new Set(units.map((u) => u.id));
  const unitIdsValid = validCards.every((c) => allUnitIds.has(c.unitId));

  if (validCards.length !== 5 || codeParsonsCount < 2 || !unitIdsValid) {
    return {
      cards: [],
      provider: result.provider,
      error: "AI batch validation failed (requires 5 cards, >=2 code_parsons, valid unit ids).",
    };
  }

  return { cards: validCards, provider: result.provider };
}
