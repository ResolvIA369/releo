import type { PhaseNumber } from "@/shared/types/doman";

// ─── Demo Config ────────────────────────────────────────────────────

export type Playlist = "highlights" | "phase1" | "phase2" | "phase3" | "phase4" | "phase5" | "all";
export type Transition = "fade" | "slide" | "none";
export type DirectorPhase = "SHOWING" | "CELEBRATING";

export interface DemoConfig {
  playlist: Playlist;
  transition: Transition;
  thumbnails: boolean;
}

// ─── Tutor Persona ──────────────────────────────────────────────────

export interface TutorPersona {
  name: string;
  avatar: string;
  greetings: string[];
  encouragements: string[];
  farewells: string[];
  onMistake: string[];
}

// ─── Lesson System ──────────────────────────────────────────────────

export type LessonType =
  | "new_words"
  | "review"
  | "pairs"
  | "sentences"
  | "story_reading"
  | "mixed";

export type StepType =
  | "greeting"
  | "affirmation"
  | "word_flash"
  | "word_pronounce"
  | "word_repeat"
  | "word_identify"
  | "pair_build"
  | "sentence_build"
  | "story_page"
  | "review_flash"
  | "farewell";

export interface LessonStep {
  id: string;
  type: StepType;
  instruction: string;
  data: Record<string, unknown>;
  duration: number;
  requiresResponse: boolean;
  successMessage: string;
  encourageMessage: string;
}

export interface Lesson {
  id: string;
  type: LessonType;
  worldId: string;
  phase: PhaseNumber;
  title: string;
  description: string;
  duration: number;
  steps: LessonStep[];
  wordsToTeach: string[];
  wordsToReview: string[];
}

// ─── Adaptive Engine ────────────────────────────────────────────────

export interface AdaptiveState {
  wordsNeedingReview: string[];
  preferredGameType: string;
  averageResponseTime: number;
  difficultyLevel: 1 | 2 | 3;
  sessionCount: number;
}

export interface ReviewSchedule {
  wordId: string;
  nextReviewDate: string;
  correctCount: number;
  lastAttemptDate: string;
}

// ─── Tutor Session State ────────────────────────────────────────────

export type TutorAvatarState = "idle" | "speaking" | "waiting" | "celebrating";

export interface TutorSessionState {
  isActive: boolean;
  currentLesson: Lesson | null;
  currentStepIndex: number;
  responses: StepResponse[];
  startedAt: string | null;
}

export interface StepResponse {
  stepId: string;
  correct: boolean;
  responseTime: number;
  timestamp: string;
}
