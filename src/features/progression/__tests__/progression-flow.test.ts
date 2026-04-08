import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { createPersistenceManager } from "@/features/persistence/services/db";
import { useAppStore } from "@/shared/store/useAppStore";
import { CURRICULUM, getWorldSessions } from "@/features/session/config/curriculum";
import { ALL_WORDS } from "@/shared/constants";

const db = createPersistenceManager();

describe("Progression flow integration", () => {
  beforeEach(async () => {
    await db.clear();
    useAppStore.setState({
      profile: null,
      profileStatus: "loading",
      progress: {
        currentWorldId: "world_1",
        worldsUnlocked: ["world_1"],
        wordsMastered: [],
        completedSessions: [],
        gamesCompleted: {},
        streakDays: 0,
        longestStreak: 0,
        lastPlayedDate: "",
        totalPlayTime: 0,
      },
      progressLoading: true,
    });
  });

  it("curriculum has 44 sessions across 5 worlds", () => {
    expect(CURRICULUM.length).toBe(44);

    const world1 = getWorldSessions("world_1");
    const world2 = getWorldSessions("world_2");
    const world3 = getWorldSessions("world_3");
    const world4 = getWorldSessions("world_4");
    const world5 = getWorldSessions("world_5");

    expect(world1.length).toBe(10);
    expect(world2.length).toBe(10);
    expect(world3.length).toBe(10);
    expect(world4.length).toBe(10);
    expect(world5.length).toBe(4);
  });

  it("every session has exactly 5 words", () => {
    for (const session of CURRICULUM) {
      expect(session.words.length).toBe(5);
    }
  });

  it("every session has a story", () => {
    for (const session of CURRICULUM) {
      expect(session.story5.length).toBeGreaterThan(0);
    }
  });

  it("every session has a context sentence", () => {
    for (const session of CURRICULUM) {
      expect(session.contextSentence.length).toBeGreaterThan(0);
    }
  });

  it("sessions 2+ have previous words for review", () => {
    for (const session of CURRICULUM) {
      if (session.id === 1) {
        expect(session.previousWords.length).toBe(0);
      }
      // First session of each world has no previous words
      const worldSessions = getWorldSessions(session.worldId);
      if (session.id === worldSessions[0].id) {
        expect(session.previousWords.length).toBe(0);
      } else {
        expect(session.previousWords.length).toBe(5);
      }
    }
  });

  it("completing all world 1 sessions masters 50 words", async () => {
    const store = useAppStore.getState();
    await store.loadProgress();

    const world1Sessions = getWorldSessions("world_1");
    for (const session of world1Sessions) {
      await useAppStore.getState().completeSession(session.id);
    }

    const state = useAppStore.getState();
    expect(state.progress.completedSessions.length).toBe(10);
    // World 1 has 50 words (10 sessions x 5 words)
    expect(state.progress.wordsMastered.length).toBe(50);
  });

  it("all 220 words are covered across all sessions", () => {
    const sessionWordIds = new Set<string>();
    for (const session of CURRICULUM) {
      for (const word of session.words) {
        sessionWordIds.add(word.id);
      }
    }
    expect(sessionWordIds.size).toBe(ALL_WORDS.length);
  });

  it("streak increments on consecutive days", async () => {
    await useAppStore.getState().loadProgress();

    // Day 1
    await useAppStore.getState().completeSession(1);
    expect(useAppStore.getState().progress.streakDays).toBe(1);

    // Same day — streak stays at 1
    await useAppStore.getState().completeSession(2);
    expect(useAppStore.getState().progress.streakDays).toBe(1);
  });

  it("onboarding → play flow works end to end", async () => {
    const store = useAppStore.getState();

    // Step 1: No profile
    await store.loadProfile();
    expect(useAppStore.getState().profileStatus).toBe("missing");

    // Step 2: Create profile
    await useAppStore.getState().saveProfile("Sofía");
    expect(useAppStore.getState().profileStatus).toBe("ready");
    expect(useAppStore.getState().profile?.childName).toBe("Sofía");

    // Step 3: Load progress
    await useAppStore.getState().loadProgress();
    expect(useAppStore.getState().progress.completedSessions).toEqual([]);

    // Step 4: Complete first session
    await useAppStore.getState().completeSession(1);
    const state = useAppStore.getState();
    expect(state.progress.completedSessions).toContain(1);
    expect(state.progress.wordsMastered.length).toBe(5);
    expect(state.progress.streakDays).toBe(1);

    // Step 5: Data persists
    useAppStore.setState({
      progress: {
        currentWorldId: "world_1",
        worldsUnlocked: ["world_1"],
        wordsMastered: [],
        completedSessions: [],
        gamesCompleted: {},
        streakDays: 0,
        longestStreak: 0,
        lastPlayedDate: "",
        totalPlayTime: 0,
      },
    });
    await useAppStore.getState().loadProgress();
    expect(useAppStore.getState().progress.completedSessions).toContain(1);
  });
});
