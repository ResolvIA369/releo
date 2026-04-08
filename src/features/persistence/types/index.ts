import type { SessionResult, PhaseNumber } from "@/shared/types/doman";
import type { PlayerProgress } from "@/features/progression/types";

export type { PlayerProgress };

export interface PlayerProfile {
  id: string;
  childName: string;
  createdAt: string;
}

export interface PersistedSession extends SessionResult {
  savedAt: string;
}

export interface ReviewCard {
  wordId: string;
  nextReviewDate: string;
  interval: number;
  correctCount: number;
  lastAttemptDate: string;
}

export interface PersistenceManager {
  saveProfile(childName: string): Promise<PlayerProfile>;
  getProfile(): Promise<PlayerProfile | null>;
  deleteProfile(): Promise<void>;

  saveSession(result: SessionResult): Promise<PersistedSession>;
  getSessions(): Promise<PersistedSession[]>;
  getSessionsByPhase(phase: PhaseNumber): Promise<PersistedSession[]>;

  saveProgress(progress: PlayerProgress): Promise<void>;
  getProgress(): Promise<PlayerProgress>;

  saveReviewCard(card: ReviewCard): Promise<void>;
  getReviewCards(): Promise<ReviewCard[]>;
  getDueCards(today: string): Promise<ReviewCard[]>;

  clear(): Promise<void>;
}
