import { describe, it, expect } from "vitest";
import {
  ALL_WORDS,
  PHASE1_WORDS,
  PHASE2_WORDS,
  PHASE3_WORDS,
  PHASE4_WORDS,
  PHASE5_WORDS,
  PHASES,
  DEFAULT_SESSION_CONFIG,
  AFFIRMATIONS,
  WORD_PAIR_EXAMPLES,
  SENTENCE_EXAMPLES,
  PHRASE_EXAMPLES,
  STORY_EXAMPLES,
} from "../constants";
import type {
  PhaseNumber,
  WordCategory,
  AffirmationCategory,
  AffirmationMoment,
} from "../types/doman";

// ═══════════════════════════════════════════════════════════════════════
// Suite 1: Integridad de datos de palabras
// ═══════════════════════════════════════════════════════════════════════

describe("Words data integrity", () => {
  it("ALL_WORDS has exactly 220 words", () => {
    expect(ALL_WORDS).toHaveLength(220);
  });

  it("each phase has the correct number of words", () => {
    expect(PHASE1_WORDS).toHaveLength(50);
    expect(PHASE2_WORDS).toHaveLength(50);
    expect(PHASE3_WORDS).toHaveLength(50);
    expect(PHASE4_WORDS).toHaveLength(50);
    expect(PHASE5_WORDS).toHaveLength(20);
  });

  it("ALL_WORDS equals the concatenation of all phase arrays", () => {
    const combined = [
      ...PHASE1_WORDS,
      ...PHASE2_WORDS,
      ...PHASE3_WORDS,
      ...PHASE4_WORDS,
      ...PHASE5_WORDS,
    ];
    expect(ALL_WORDS).toEqual(combined);
  });

  it("all word IDs are unique", () => {
    const ids = ALL_WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("word IDs follow the format p{phase}-{number}", () => {
    for (const word of ALL_WORDS) {
      expect(word.id).toMatch(/^p[1-5]-\d{2}$/);
      expect(word.id.startsWith(`p${word.phase}-`)).toBe(true);
    }
  });

  it("Phase 1 words have fontColor red, phases 2-5 have black", () => {
    for (const word of PHASE1_WORDS) {
      expect(word.fontColor).toBe("red");
    }
    for (const word of [...PHASE2_WORDS, ...PHASE3_WORDS, ...PHASE4_WORDS, ...PHASE5_WORDS]) {
      expect(word.fontColor).toBe("black");
    }
  });

  it("each category has at least 5 words", () => {
    const categoryCounts = new Map<string, number>();
    for (const word of ALL_WORDS) {
      categoryCounts.set(word.category, (categoryCounts.get(word.category) || 0) + 1);
    }
    for (const [category, count] of categoryCounts) {
      expect(count, `category "${category}" should have at least 5 words`).toBeGreaterThanOrEqual(5);
    }
  });

  it("all 22 categories have words assigned", () => {
    const categories = new Set(ALL_WORDS.map((w) => w.category));
    expect(categories.size).toBe(22);
  });

  it("every word has non-empty text", () => {
    for (const word of ALL_WORDS) {
      expect(word.text.length).toBeGreaterThan(0);
    }
  });

  it("every word has a non-empty affirmation", () => {
    for (const word of ALL_WORDS) {
      expect(word.affirmation.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Suite 2: Phase configuration
// ═══════════════════════════════════════════════════════════════════════

describe("Phase configuration", () => {
  it("PHASES has exactly 5 entries", () => {
    expect(PHASES).toHaveLength(5);
  });

  it("phases are numbered 1 through 5", () => {
    expect(PHASES.map((p) => p.phase)).toEqual([1, 2, 3, 4, 5]);
  });

  it("each phase categories match the words that exist", () => {
    const phaseWords = [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS];
    for (let i = 0; i < PHASES.length; i++) {
      const expectedCategories = new Set(phaseWords[i].map((w) => w.category));
      const phaseCategories = new Set(PHASES[i].categories);
      expect(phaseCategories).toEqual(expectedCategories);
    }
  });

  it("font sizes decrease with each phase", () => {
    for (let i = 1; i < PHASES.length; i++) {
      expect(PHASES[i].fontSizeCm).toBeLessThan(PHASES[i - 1].fontSizeCm);
      expect(PHASES[i].fontSizePx).toBeLessThan(PHASES[i - 1].fontSizePx);
    }
  });

  it("Phase 1 uses red fontColor, rest use black", () => {
    expect(PHASES[0].fontColor).toBe("red");
    for (let i = 1; i < PHASES.length; i++) {
      expect(PHASES[i].fontColor).toBe("black");
    }
  });

  it("wordsPerCategory is 10 in all phases", () => {
    for (const phase of PHASES) {
      expect(phase.wordsPerCategory).toBe(10);
    }
  });

  it("specific font sizes match Doman method values", () => {
    expect(PHASES[0].fontSizeCm).toBe(12.5);
    expect(PHASES[1].fontSizeCm).toBe(10);
    expect(PHASES[2].fontSizeCm).toBe(7.5);
    expect(PHASES[3].fontSizeCm).toBe(5);
    expect(PHASES[4].fontSizeCm).toBe(3.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Suite 3: Affirmations
// ═══════════════════════════════════════════════════════════════════════

describe("Affirmations", () => {
  it("AFFIRMATIONS has exactly 34 entries", () => {
    expect(AFFIRMATIONS).toHaveLength(34);
  });

  it("all 4 categories are represented", () => {
    const categories = new Set(AFFIRMATIONS.map((a) => a.category));
    const expected: AffirmationCategory[] = [
      "autoconocimiento",
      "confianza",
      "relaciones",
      "lectura",
    ];
    for (const cat of expected) {
      expect(categories.has(cat), `missing category: ${cat}`).toBe(true);
    }
  });

  it("all 5 moments have at least 1 affirmation", () => {
    const moments = new Set(AFFIRMATIONS.map((a) => a.moment));
    const expected: AffirmationMoment[] = [
      "session_start",
      "correct_answer",
      "after_attempt",
      "session_end",
      "achievement",
    ];
    for (const moment of expected) {
      expect(moments.has(moment), `missing moment: ${moment}`).toBe(true);
    }
  });

  it("no affirmation has empty text", () => {
    for (const a of AFFIRMATIONS) {
      expect(a.text.length).toBeGreaterThan(0);
    }
  });

  it("all affirmation IDs are unique", () => {
    const ids = AFFIRMATIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Suite 4: Session config
// ═══════════════════════════════════════════════════════════════════════

describe("Session config", () => {
  it("DEFAULT_SESSION_CONFIG has correct values", () => {
    expect(DEFAULT_SESSION_CONFIG.maxDurationSeconds).toBe(300);
    expect(DEFAULT_SESSION_CONFIG.maxSessionsPerDay).toBe(3);
    expect(DEFAULT_SESSION_CONFIG.minGapMinutes).toBe(30);
    expect(DEFAULT_SESSION_CONFIG.wordsPerSession).toBe(5);
    expect(DEFAULT_SESSION_CONFIG.secondsPerWord).toBe(10);
  });

  it("wordsPerSession is less than or equal to words in any phase", () => {
    const phaseSizes = [
      PHASE1_WORDS.length,
      PHASE2_WORDS.length,
      PHASE3_WORDS.length,
      PHASE4_WORDS.length,
      PHASE5_WORDS.length,
    ];
    for (const size of phaseSizes) {
      expect(DEFAULT_SESSION_CONFIG.wordsPerSession).toBeLessThanOrEqual(size);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Suite 5: Cross-reference coherence
// ═══════════════════════════════════════════════════════════════════════

describe("Cross-reference coherence", () => {
  const allWordTexts = new Set(ALL_WORDS.map((w) => w.text));
  const allCategories = new Set(ALL_WORDS.map((w) => w.category));

  it("all categories in PHASES exist in ALL_WORDS", () => {
    for (const phase of PHASES) {
      for (const category of phase.categories) {
        expect(
          allCategories.has(category),
          `category "${category}" from phase ${phase.phase} not found in words`
        ).toBe(true);
      }
    }
  });

  it("WORD_PAIR_EXAMPLES reference existing words", () => {
    for (const pair of WORD_PAIR_EXAMPLES) {
      expect(pair.words).toHaveLength(2);
      expect(pair.displayText.length).toBeGreaterThan(0);
    }
  });

  it("SENTENCE_EXAMPLES all have phase 3", () => {
    for (const sentence of SENTENCE_EXAMPLES) {
      expect(sentence.phase).toBe(3);
      expect(sentence.fullText.length).toBeGreaterThan(0);
    }
  });

  it("PHRASE_EXAMPLES all have phase 4", () => {
    for (const phrase of PHRASE_EXAMPLES) {
      expect(phrase.phase).toBe(4);
      expect(phrase.fullText.length).toBeGreaterThan(0);
    }
  });

  it("STORY_EXAMPLES have valid difficulty levels", () => {
    const validDifficulties = new Set(["easy", "medium", "hard"]);
    for (const story of STORY_EXAMPLES) {
      expect(validDifficulties.has(story.difficulty)).toBe(true);
      expect(story.pages.length).toBeGreaterThan(0);
      expect(story.wordCount).toBeGreaterThan(0);
    }
  });

  it("STORY_EXAMPLES have unique IDs", () => {
    const ids = STORY_EXAMPLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
