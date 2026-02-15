import { ReviewCard, ReviewCardState } from "./types";

const MAX_REVIEW_CARDS = 200;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function fetchReviewSnapshot(sessionId: string): Promise<{
  cards: ReviewCard[];
  states: Record<string, ReviewCardState>;
}> {
  const [cardsRes, statesRes] = await Promise.all([
    fetch(`/api/review/cards/${sessionId}`, { credentials: "include" }),
    fetch(`/api/review/state/${sessionId}`, { credentials: "include" }),
  ]);

  await throwIfResNotOk(cardsRes);
  await throwIfResNotOk(statesRes);

  const cards = (await cardsRes.json()) as ReviewCard[];
  const states = (await statesRes.json()) as Record<string, ReviewCardState>;
  return { cards, states };
}

export async function saveReviewCardsBatch(sessionId: string, cards: ReviewCard[]) {
  const res = await fetch("/api/review/cards/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      sessionId,
      cards,
      maxCards: MAX_REVIEW_CARDS,
    }),
  });
  await throwIfResNotOk(res);
}

export async function saveReviewStates(sessionId: string, states: Record<string, ReviewCardState>) {
  const res = await fetch("/api/review/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId, states }),
  });
  await throwIfResNotOk(res);
}
