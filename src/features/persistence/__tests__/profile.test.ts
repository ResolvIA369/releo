import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { createPersistenceManager } from "../services/db";

describe("PersistenceManager — profiles", () => {
  let manager: ReturnType<typeof createPersistenceManager>;

  beforeEach(async () => {
    manager = createPersistenceManager();
    await manager.clear();
  });

  it("returns null when no profile exists", async () => {
    const profile = await manager.getProfile();
    expect(profile).toBeNull();
  });

  it("saves and retrieves a profile", async () => {
    const saved = await manager.saveProfile("Sofía");

    expect(saved.childName).toBe("Sofía");
    expect(saved.id).toBe("active");
    expect(saved.createdAt).toBeTruthy();

    const retrieved = await manager.getProfile();
    expect(retrieved).toEqual(saved);
  });

  it("trims whitespace from child name", async () => {
    const saved = await manager.saveProfile("  Mateo  ");
    expect(saved.childName).toBe("Mateo");
  });

  it("overwrites existing profile on re-save", async () => {
    await manager.saveProfile("Sofía");
    await manager.saveProfile("Mateo");

    const profile = await manager.getProfile();
    expect(profile!.childName).toBe("Mateo");
  });

  it("deleteProfile removes the active profile", async () => {
    await manager.saveProfile("Sofía");
    await manager.deleteProfile();

    const profile = await manager.getProfile();
    expect(profile).toBeNull();
  });

  it("clear() removes both profiles and sessions", async () => {
    await manager.saveProfile("Sofía");
    await manager.saveSession({
      sessionId: "test-1",
      phase: 1,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      wordsShown: ["p1-01"],
      wordsRecognized: ["p1-01"],
      affirmationShown: "Soy valiente",
    });

    await manager.clear();

    expect(await manager.getProfile()).toBeNull();
    expect(await manager.getSessions()).toHaveLength(0);
  });
});
