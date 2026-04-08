// ─── Core Domain Types ───────────────────────────────────────────────

export type PhaseNumber = 1 | 2 | 3 | 4 | 5;

export type PhaseName =
  | "Palabras Sencillas"
  | "Parejas de Palabras"
  | "Oraciones Sencillas"
  | "Frases Completas"
  | "Cuentos Cortos";

export type WordCategory =
  // Phase 1
  | "familia"
  | "cuerpo"
  | "casa"
  | "animales"
  | "comida"
  // Phase 2
  | "colores"
  | "tamaños_y_formas"
  | "opuestos"
  | "emociones"
  | "naturaleza"
  // Phase 3
  | "verbos_cotidianos"
  | "verbos_de_accion"
  | "ropa"
  | "escuela"
  | "lugares"
  // Phase 4
  | "articulos_y_conectores"
  | "preposiciones"
  | "pronombres"
  | "tiempo"
  | "numeros"
  // Phase 5
  | "verbos_avanzados"
  | "adverbios";

export type FontColor = "red" | "black";

export interface DomanWord {
  id: string;
  text: string;
  phase: PhaseNumber;
  phaseName: PhaseName;
  category: WordCategory;
  categoryDisplay: string;
  fontColor: FontColor;
  fontSizeCm: number;
  audioUrl: string;
  imageUrl: string;
  affirmation: string;
}

// ─── Phases (5 Doman Stages) ─────────────────────────────────────────

export interface PhaseConfig {
  phase: PhaseNumber;
  name: PhaseName;
  levelName: string;
  description: string;
  durationWeeks: number;
  wordsPerCategory: number;
  categories: WordCategory[];
  fontSizePx: number;
  fontSizeCm: number;
  fontColor: FontColor;
}

// ─── Word Pairs (Phase 2) ────────────────────────────────────────────

export interface WordPairExample {
  displayText: string;
  words: [string, string];
}

// ─── Sentences (Phase 3-4) ───────────────────────────────────────────

export interface SentenceExample {
  fullText: string;
  phase: 3 | 4;
}

// ─── Stories (Phase 5) ───────────────────────────────────────────────

export interface StoryPage {
  text: string;
  audioUrl: string;
  imageUrl: string;
  highlightWords: string[];
}

export interface DomanStory {
  id: string;
  title: string;
  pages: StoryPage[];
  wordCount: number;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Sessions ────────────────────────────────────────────────────────

export interface SessionConfig {
  maxDurationSeconds: number;
  maxSessionsPerDay: number;
  minGapMinutes: number;
  wordsPerSession: number;
  secondsPerWord: number;
}

export interface SessionResult {
  sessionId: string;
  phase: PhaseNumber;
  startedAt: string;
  endedAt: string;
  wordsShown: string[];
  wordsRecognized: string[];
  affirmationShown: string;
}

// ─── Affirmations ────────────────────────────────────────────────────

export type AffirmationCategory =
  | "autoconocimiento"
  | "confianza"
  | "relaciones"
  | "lectura";

export type AffirmationMoment =
  | "session_start"
  | "correct_answer"
  | "after_attempt"
  | "session_end"
  | "achievement";

export interface Affirmation {
  id: string;
  text: string;
  category: AffirmationCategory;
  moment: AffirmationMoment;
  audioUrl: string;
}

// ─── Gamification ────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
}

export interface RewardEvent {
  type: "immediate" | "session" | "progress" | "surprise";
  description: string;
  coinsAwarded: number;
  badgeAwarded?: Badge;
}
