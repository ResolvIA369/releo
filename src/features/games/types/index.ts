import type { DomanWord, PhaseNumber } from "@/shared/types/doman";

export type GameId =
  | "word-flash"
  | "word-image-match"
  | "memory-cards"
  | "word-train"
  | "phrase-builder"
  | "word-rain"
  | "story-reader"
  | "category-sort"
  | "word-fishing"
  | "daily-bits";

export interface GameMeta {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  minPhase: PhaseNumber;
  color: string;
}

export interface GameSessionState {
  gameId: GameId;
  score: number;
  totalAttempts: number;
  correctAttempts: number;
  startedAt: number;
  wordsCompleted: string[];
}

export interface GameProps {
  words: DomanWord[];
  phase: PhaseNumber;
  worldId?: string;
  isDemo?: boolean;
  onComplete?: (state: GameSessionState) => void;
  onBack?: () => void;
  celebrationMs?: number;
}

export type DemoActionType =
  | "wait"
  | "tap"
  | "tap_correct"
  | "tap_index"
  | "flip"
  | "celebrate";

export interface DemoAction {
  type: DemoActionType;
  delay: number;
  target?: string | number;
}

export interface GameDemoScript {
  gameId: GameId;
  actions: DemoAction[];
}
