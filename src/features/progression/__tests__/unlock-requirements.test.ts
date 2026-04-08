import { describe, it, expect } from "vitest";
import {
  calculateUnlockProgress,
  meetsRequirements,
  getNextMilestone,
} from "../config/unlock-requirements";
import type { PlayerProgress, UnlockRequirement } from "../types";

function makeProgress(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return {
    currentWorldId: "world_1",
    worldsUnlocked: ["world_1"],
    wordsMastered: [],
    completedSessions: [],
    gamesCompleted: {},
    streakDays: 0,
    longestStreak: 0,
    lastPlayedDate: "",
    totalPlayTime: 0,
    ...overrides,
  };
}

const WORLD1_REQ: UnlockRequirement = {
  minWordsMastered: 0,
  minGamesCompleted: 0,
  minStreakDays: 0,
  previousWorldId: null,
};

const WORLD2_REQ: UnlockRequirement = {
  minWordsMastered: 35,
  minGamesCompleted: 3,
  minStreakDays: 5,
  previousWorldId: "world_1",
};

describe("calculateUnlockProgress", () => {
  it("returns 100 for world 1 (no requirements)", () => {
    expect(calculateUnlockProgress(WORLD1_REQ, makeProgress())).toBe(100);
  });

  it("returns 0 for world 2 with no progress", () => {
    expect(calculateUnlockProgress(WORLD2_REQ, makeProgress())).toBe(0);
  });

  it("calculates partial progress correctly", () => {
    const progress = makeProgress({
      wordsMastered: Array.from({ length: 17 }, (_, i) => `p1-${i}`),
      gamesCompleted: {
        g1: { gameId: "word-flash", worldId: "world_1", stars: 3, bestScore: 50, timesPlayed: 1, lastPlayed: "" },
      },
      streakDays: 2,
    });

    const pct = calculateUnlockProgress(WORLD2_REQ, progress);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it("returns 100 when all requirements met", () => {
    const progress = makeProgress({
      wordsMastered: Array.from({ length: 35 }, (_, i) => `p1-${i}`),
      gamesCompleted: {
        g1: { gameId: "word-flash", worldId: "world_1", stars: 3, bestScore: 50, timesPlayed: 1, lastPlayed: "" },
        g2: { gameId: "word-image-match", worldId: "world_1", stars: 2, bestScore: 40, timesPlayed: 1, lastPlayed: "" },
        g3: { gameId: "memory-cards", worldId: "world_1", stars: 2, bestScore: 30, timesPlayed: 1, lastPlayed: "" },
      },
      streakDays: 5,
    });

    expect(calculateUnlockProgress(WORLD2_REQ, progress)).toBe(100);
  });
});

describe("meetsRequirements", () => {
  it("returns true for world 1", () => {
    expect(meetsRequirements(WORLD1_REQ, makeProgress())).toBe(true);
  });

  it("returns false for world 2 with no progress", () => {
    expect(meetsRequirements(WORLD2_REQ, makeProgress())).toBe(false);
  });
});

describe("getNextMilestone", () => {
  it("lists what is needed for world 2", () => {
    const msg = getNextMilestone(WORLD2_REQ, makeProgress());
    expect(msg).toContain("35 palabras");
    expect(msg).toContain("3 juegos");
    expect(msg).toContain("5 días");
  });

  it("returns ready message when requirements met", () => {
    const progress = makeProgress({
      wordsMastered: Array.from({ length: 35 }, (_, i) => `p1-${i}`),
      gamesCompleted: {
        g1: { gameId: "a", worldId: "w", stars: 3, bestScore: 0, timesPlayed: 1, lastPlayed: "" },
        g2: { gameId: "b", worldId: "w", stars: 2, bestScore: 0, timesPlayed: 1, lastPlayed: "" },
        g3: { gameId: "c", worldId: "w", stars: 2, bestScore: 0, timesPlayed: 1, lastPlayed: "" },
      },
      streakDays: 5,
    });
    expect(getNextMilestone(WORLD2_REQ, progress)).toContain("Listo");
  });
});
