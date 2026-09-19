export type Phase =
  | "ready" | "paused"
  | "greeting_video" | "greeting"
  | "presentation" | "pres_sofia"
  | "repeat_intro" | "repeat" | "repeat_video" | "repeat_sofia" | "celebration"
  | "story_intro" | "story"
  | "review_intro" | "review"
  | "farewell" | "affirmation" | "farewell_video" | "complete";

export const REPEAT_TIMER_SECONDS = 7;

/**
 * Compute step number for the linear progress bar.
 * 0 → greeting, 1-3 → 3 presentation passes, 4-6 → 3 repeat passes,
 * 7 → story, 8 → review, 9 → farewell, 10 → done.
 */
export function getCurrentStep(ph: Phase, pass: number): number {
  if (ph === "greeting_video" || ph === "greeting") return 0;
  if (ph.startsWith("pres")) return 1 + pass;
  if (ph.startsWith("repeat")) return 4 + pass;
  if (ph === "celebration") return 7;
  if (ph === "story_intro" || ph === "story") return 7;
  if (ph === "review_intro" || ph === "review") return 8;
  if (ph === "farewell" || ph === "affirmation" || ph === "farewell_video") return 9;
  if (ph === "complete") return 10;
  return 0;
}

export const TOTAL_STEPS = 10;
