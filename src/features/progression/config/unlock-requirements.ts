import type { PlayerProgress, UnlockRequirement } from "../types";

const WEIGHTS = { words: 0.4, games: 0.35, streak: 0.25 } as const;

export function calculateUnlockProgress(
  requirements: UnlockRequirement,
  progress: PlayerProgress
): number {
  if (
    requirements.minWordsMastered === 0 &&
    requirements.minGamesCompleted === 0 &&
    requirements.minStreakDays === 0
  ) {
    return 100;
  }

  const wordsPct =
    requirements.minWordsMastered > 0
      ? Math.min(progress.wordsMastered.length / requirements.minWordsMastered, 1)
      : 1;

  const gamesWithMinStars = Object.values(progress.gamesCompleted).filter(
    (g) => g.stars >= 2
  ).length;
  const gamesPct =
    requirements.minGamesCompleted > 0
      ? Math.min(gamesWithMinStars / requirements.minGamesCompleted, 1)
      : 1;

  const streakPct =
    requirements.minStreakDays > 0
      ? Math.min(progress.streakDays / requirements.minStreakDays, 1)
      : 1;

  return Math.round(
    (wordsPct * WEIGHTS.words + gamesPct * WEIGHTS.games + streakPct * WEIGHTS.streak) * 100
  );
}

export function meetsRequirements(
  requirements: UnlockRequirement,
  progress: PlayerProgress
): boolean {
  return calculateUnlockProgress(requirements, progress) >= 100;
}

export function getNextMilestone(
  requirements: UnlockRequirement,
  progress: PlayerProgress
): string {
  const wordsNeeded = requirements.minWordsMastered - progress.wordsMastered.length;
  const gamesWithMinStars = Object.values(progress.gamesCompleted).filter(
    (g) => g.stars >= 2
  ).length;
  const gamesNeeded = requirements.minGamesCompleted - gamesWithMinStars;
  const streakNeeded = requirements.minStreakDays - progress.streakDays;

  const parts: string[] = [];
  if (wordsNeeded > 0) parts.push(`${wordsNeeded} palabras más`);
  if (gamesNeeded > 0) parts.push(`${gamesNeeded} juegos con 2⭐`);
  if (streakNeeded > 0) parts.push(`${streakNeeded} días de racha`);

  return parts.length > 0 ? `Necesitas: ${parts.join(", ")}` : "¡Listo para desbloquear!";
}
