import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { createPersistenceManager } from "../services/db";
import type { PlayerProgress } from "@/features/progression/types";

describe("PersistenceManager — progression", () => {
  let manager: ReturnType<typeof createPersistenceManager>;

  beforeEach(async () => {
    manager = createPersistenceManager();
    await manager.clear();
  });

  it("returns default progress when none saved", async () => {
    const progress = await manager.getProgress();
    expect(progress.currentWorldId).toBe("world_1");
    expect(progress.wordsMastered).toEqual([]);
    expect(progress.streakDays).toBe(0);
  });

  it("saves and retrieves progress", async () => {
    const progress: PlayerProgress = {
      currentWorldId: "world_2",
      worldsUnlocked: ["world_1", "world_2"],
      wordsMastered: ["p1-01", "p1-02", "p1-03"],
      completedSessions: [1, 2],
      gamesCompleted: {
        "world_1_word-flash": {
          gameId: "word-flash",
          worldId: "world_1",
          stars: 3,
          bestScore: 50,
          timesPlayed: 2,
          lastPlayed: "2026-03-18",
        },
      },
      streakDays: 5,
      longestStreak: 5,
      lastPlayedDate: "2026-03-18",
      totalPlayTime: 300,
    };

    await manager.saveProgress(progress);
    const retrieved = await manager.getProgress();

    expect(retrieved.currentWorldId).toBe("world_2");
    expect(retrieved.wordsMastered).toEqual(["p1-01", "p1-02", "p1-03"]);
    expect(retrieved.streakDays).toBe(5);
    expect(retrieved.gamesCompleted["world_1_word-flash"].stars).toBe(3);
  });

  it("overwrites previous progress", async () => {
    await manager.saveProgress({
      currentWorldId: "world_1",
      worldsUnlocked: ["world_1"],
      wordsMastered: ["p1-01"],
      completedSessions: [],
      gamesCompleted: {},
      streakDays: 1,
      longestStreak: 1,
      lastPlayedDate: "",
      totalPlayTime: 0,
    });

    await manager.saveProgress({
      currentWorldId: "world_2",
      worldsUnlocked: ["world_1", "world_2"],
      wordsMastered: ["p1-01", "p1-02"],
      completedSessions: [1],
      gamesCompleted: {},
      streakDays: 3,
      longestStreak: 3,
      lastPlayedDate: "",
      totalPlayTime: 100,
    });

    const progress = await manager.getProgress();
    expect(progress.currentWorldId).toBe("world_2");
    expect(progress.wordsMastered).toHaveLength(2);
    expect(progress.streakDays).toBe(3);
  });
});

describe("PersistenceManager — review cards", () => {
  let manager: ReturnType<typeof createPersistenceManager>;

  beforeEach(async () => {
    manager = createPersistenceManager();
    await manager.clear();
  });

  it("saves and retrieves review cards", async () => {
    await manager.saveReviewCard({
      wordId: "p1-01",
      nextReviewDate: "2026-03-19",
      interval: 1,
      correctCount: 1,
      lastAttemptDate: "2026-03-18",
    });

    const cards = await manager.getReviewCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].wordId).toBe("p1-01");
  });

  it("getDueCards returns cards due today or before", async () => {
    await manager.saveReviewCard({
      wordId: "p1-01",
      nextReviewDate: "2026-03-18",
      interval: 1,
      correctCount: 0,
      lastAttemptDate: "2026-03-17",
    });
    await manager.saveReviewCard({
      wordId: "p1-02",
      nextReviewDate: "2026-03-25",
      interval: 7,
      correctCount: 3,
      lastAttemptDate: "2026-03-18",
    });

    const due = await manager.getDueCards("2026-03-18");
    expect(due).toHaveLength(1);
    expect(due[0].wordId).toBe("p1-01");
  });

  it("updates existing card on re-save", async () => {
    await manager.saveReviewCard({
      wordId: "p1-01",
      nextReviewDate: "2026-03-19",
      interval: 1,
      correctCount: 0,
      lastAttemptDate: "2026-03-18",
    });

    await manager.saveReviewCard({
      wordId: "p1-01",
      nextReviewDate: "2026-03-22",
      interval: 4,
      correctCount: 2,
      lastAttemptDate: "2026-03-18",
    });

    const cards = await manager.getReviewCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].interval).toBe(4);
    expect(cards[0].correctCount).toBe(2);
  });
});
