import { createPersistenceManager } from "./db";
import type { ReviewCard } from "../types";
import type { DomanWord } from "@/shared/types/doman";

// Simple SM-2 inspired schedule. Intervals double on success, reset on fail.
const INTERVALS_DAYS = [1, 2, 4, 7, 14, 30];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Update the review card for a word after an attempt.
 * Correct: advance the interval and push nextReviewDate forward.
 * Wrong: reset to interval 1 day so the word resurfaces tomorrow.
 *
 * Fire-and-forget — never throws to the caller.
 */
export async function recordWordReview(
  wordId: string,
  correct: boolean,
): Promise<void> {
  try {
    const mgr = createPersistenceManager();
    const cards = await mgr.getReviewCards();
    const existing = cards.find((c) => c.wordId === wordId);
    const today = todayIso();

    let nextInterval: number;
    let correctCount: number;

    if (correct) {
      const idx = existing
        ? Math.min(INTERVALS_DAYS.indexOf(existing.interval) + 1, INTERVALS_DAYS.length - 1)
        : 0;
      nextInterval = INTERVALS_DAYS[Math.max(idx, 0)];
      correctCount = (existing?.correctCount ?? 0) + 1;
    } else {
      nextInterval = INTERVALS_DAYS[0];
      correctCount = 0;
    }

    const card: ReviewCard = {
      wordId,
      nextReviewDate: addDays(today, nextInterval),
      interval: nextInterval,
      correctCount,
      lastAttemptDate: today,
    };
    await mgr.saveReviewCard(card);
  } catch {
    // ignore
  }
}

/**
 * Reorder a word list so that words due for review come first.
 * Words never seen come second, "fresh" words (not yet due) come last.
 */
export async function prioritizeByReview(words: DomanWord[]): Promise<DomanWord[]> {
  try {
    const mgr = createPersistenceManager();
    const cards = await mgr.getReviewCards();
    const today = todayIso();
    const cardByWord = new Map(cards.map((c) => [c.wordId, c]));

    const due: DomanWord[] = [];
    const fresh: DomanWord[] = [];
    const future: DomanWord[] = [];
    for (const w of words) {
      const card = cardByWord.get(w.id);
      if (!card) fresh.push(w);
      else if (card.nextReviewDate <= today) due.push(w);
      else future.push(w);
    }
    return [...due, ...fresh, ...future];
  } catch {
    return words;
  }
}
