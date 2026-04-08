import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { createPersistenceManager } from "../services/db";
import type { SessionResult } from "@/shared/types/doman";

function makeSession(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    sessionId: crypto.randomUUID(),
    phase: 1,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    wordsShown: ["p1-01", "p1-02", "p1-03"],
    wordsRecognized: ["p1-01", "p1-03"],
    affirmationShown: "Yo soy importante",
    ...overrides,
  };
}

describe("PersistenceManager", () => {
  let manager: ReturnType<typeof createPersistenceManager>;

  beforeEach(async () => {
    manager = createPersistenceManager();
    await manager.clear();
  });

  it("saves and retrieves a session", async () => {
    const session = makeSession();
    const saved = await manager.saveSession(session);

    expect(saved.sessionId).toBe(session.sessionId);
    expect(saved.savedAt).toBeTruthy();

    const all = await manager.getSessions();
    expect(all).toHaveLength(1);
    expect(all[0].sessionId).toBe(session.sessionId);
  });

  it("filters sessions by phase", async () => {
    await manager.saveSession(makeSession({ phase: 1 }));
    await manager.saveSession(makeSession({ phase: 2 }));
    await manager.saveSession(makeSession({ phase: 1 }));

    const phase1 = await manager.getSessionsByPhase(1);
    const phase2 = await manager.getSessionsByPhase(2);

    expect(phase1).toHaveLength(2);
    expect(phase2).toHaveLength(1);
  });

  it("returns default progress when none saved", async () => {
    const progress = await manager.getProgress();

    expect(progress.currentWorldId).toBe("world_1");
    expect(progress.wordsMastered).toHaveLength(0);
    expect(progress.streakDays).toBe(0);
  });

  it("clear() removes all sessions", async () => {
    await manager.saveSession(makeSession());
    await manager.saveSession(makeSession());
    await manager.clear();

    const all = await manager.getSessions();
    expect(all).toHaveLength(0);
  });
});
