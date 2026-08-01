import type { PhaseNumber, WordCategory } from "@/shared/types/doman";
import type { GameId } from "@/features/games/types";

export interface WorldConfig {
  id: string;
  name: string;
  phase: PhaseNumber;
  description: string;
  color: string;
  icon: string;
  image: string;
  categories: WordCategory[];
  availableGames: GameId[];
  totalWords: number;
}

export interface PlayerProgress {
  currentWorldId: string;
  worldsUnlocked: string[];
  wordsMastered: string[];
  completedSessions: number[];
  gamesCompleted: Record<string, GameCompletion>;
  streakDays: number;
  longestStreak: number;
  lastPlayedDate: string;
  totalPlayTime: number;
}

export interface GameCompletion {
  gameId: string;
  worldId: string;
  stars: number;
  bestScore: number;
  timesPlayed: number;
  lastPlayed: string;
}

// Los mundos no se bloquean: están todos abiertos desde el principio.
// "available" = todavía no empezado, pero accesible.
export type WorldStatus = "available" | "current" | "completed";

export interface WorldWithStatus {
  config: WorldConfig;
  status: WorldStatus;
  percentComplete: number;
  wordsProgress: { mastered: number; total: number };
  gamesProgress: { completed: number; total: number };
  starsEarned: number;
}

export interface ProgressionInfo {
  worlds: WorldWithStatus[];
  currentWorld: WorldWithStatus | undefined;
  overallProgress: number;
}
