import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { createPersistenceManager } from "@/features/persistence/services/db";
import { useAppStore } from "../store/useAppStore";

const DEFAULT_PROGRESS = {
  currentWorldId: "world_1",
  worldsUnlocked: ["world_1"],
  wordsMastered: [] as string[],
  completedSessions: [] as number[],
  gamesCompleted: {},
  streakDays: 0,
  longestStreak: 0,
  lastPlayedDate: "",
  totalPlayTime: 0,
};

describe("useAppStore", () => {
  beforeEach(async () => {
    // Clear IndexedDB data between tests
    await createPersistenceManager().clear();

    // Reset store between tests
    useAppStore.setState({
      profile: null,
      profileStatus: "loading",
      progress: { ...DEFAULT_PROGRESS },
      progressLoading: true,
    });
  });

  it("starts with loading state", () => {
    const state = useAppStore.getState();
    expect(state.profileStatus).toBe("loading");
    expect(state.progressLoading).toBe(true);
    expect(state.profile).toBeNull();
  });

  it("saves and loads a profile", async () => {
    const { saveProfile, loadProfile } = useAppStore.getState();

    await saveProfile("Sofía");

    let state = useAppStore.getState();
    expect(state.profile?.childName).toBe("Sofía");
    expect(state.profileStatus).toBe("ready");

    // Reset and reload
    useAppStore.setState({ profile: null, profileStatus: "loading" });
    await loadProfile();

    state = useAppStore.getState();
    expect(state.profile?.childName).toBe("Sofía");
    expect(state.profileStatus).toBe("ready");
  });

  it("loads progress from empty DB", async () => {
    await useAppStore.getState().loadProgress();

    const state = useAppStore.getState();
    expect(state.progressLoading).toBe(false);
    expect(state.progress.currentWorldId).toBe("world_1");
    expect(state.progress.completedSessions).toEqual([]);
  });

  it("completes a session and updates progress", async () => {
    await useAppStore.getState().loadProgress();
    await useAppStore.getState().completeSession(1);

    const state = useAppStore.getState();
    expect(state.progress.completedSessions).toContain(1);
    expect(state.progress.wordsMastered.length).toBeGreaterThan(0);
    expect(state.progress.streakDays).toBe(1);
    expect(state.progress.lastPlayedDate).toBeTruthy();
  });

  it("does not duplicate completed sessions", async () => {
    await useAppStore.getState().loadProgress();
    await useAppStore.getState().completeSession(1);
    await useAppStore.getState().completeSession(1);

    const state = useAppStore.getState();
    const count = state.progress.completedSessions.filter((id) => id === 1).length;
    expect(count).toBe(1);
  });

  it("isSessionCompleted returns correct value", async () => {
    await useAppStore.getState().loadProgress();

    expect(useAppStore.getState().isSessionCompleted(1)).toBe(false);
    await useAppStore.getState().completeSession(1);
    expect(useAppStore.getState().isSessionCompleted(1)).toBe(true);
    expect(useAppStore.getState().isSessionCompleted(2)).toBe(false);
  });

  it("persists progress across reload", async () => {
    await useAppStore.getState().loadProgress();
    await useAppStore.getState().completeSession(3);

    // Simulate reload
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
      progressLoading: true,
    });

    await useAppStore.getState().loadProgress();

    const state = useAppStore.getState();
    expect(state.progress.completedSessions).toContain(3);
    expect(state.progress.wordsMastered.length).toBeGreaterThan(0);
  });
});
