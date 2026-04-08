import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameSession } from "../hooks/useGameSession";
import { PHASE1_WORDS } from "@/shared/constants";
import { createPersistenceManager } from "@/features/persistence/services/db";

const testWords = PHASE1_WORDS.slice(0, 5);

describe("useGameSession", () => {
  beforeEach(async () => {
    const manager = createPersistenceManager();
    await manager.clear();
  });

  it("starts in idle status", () => {
    const { result } = renderHook(() =>
      useGameSession({ phase: 1, words: testWords })
    );
    expect(result.current.status).toBe("idle");
    expect(result.current.recognized).toEqual([]);
    expect(result.current.savedResult).toBeNull();
  });

  it("transitions to active on start()", () => {
    const { result } = renderHook(() =>
      useGameSession({ phase: 1, words: testWords })
    );
    act(() => result.current.start());
    expect(result.current.status).toBe("active");
  });

  it("tracks recognized words", () => {
    const { result } = renderHook(() =>
      useGameSession({ phase: 1, words: testWords })
    );
    act(() => result.current.start());
    act(() => result.current.markRecognized("p1-01"));
    act(() => result.current.markRecognized("p1-03"));

    expect(result.current.recognized).toEqual(["p1-01", "p1-03"]);
  });

  it("does not duplicate recognized words", () => {
    const { result } = renderHook(() =>
      useGameSession({ phase: 1, words: testWords })
    );
    act(() => result.current.start());
    act(() => result.current.markRecognized("p1-01"));
    act(() => result.current.markRecognized("p1-01"));

    expect(result.current.recognized).toEqual(["p1-01"]);
  });

  it("ignores markRecognized when not active", () => {
    const { result } = renderHook(() =>
      useGameSession({ phase: 1, words: testWords })
    );
    act(() => result.current.markRecognized("p1-01"));
    expect(result.current.recognized).toEqual([]);
  });

  it("endSession() persists to IndexedDB and returns result", async () => {
    const { result } = renderHook(() =>
      useGameSession({
        phase: 1,
        words: testWords,
        affirmation: "Soy valiente",
      })
    );

    act(() => result.current.start());
    act(() => result.current.markRecognized("p1-01"));
    act(() => result.current.markRecognized("p1-02"));

    let persisted: unknown;
    await act(async () => {
      persisted = await result.current.endSession();
    });

    expect(result.current.status).toBe("finished");
    expect(result.current.savedResult).not.toBeNull();
    expect(result.current.savedResult!.phase).toBe(1);
    expect(result.current.savedResult!.wordsRecognized).toEqual([
      "p1-01",
      "p1-02",
    ]);
    expect(result.current.savedResult!.affirmationShown).toBe("Soy valiente");
    expect(result.current.savedResult!.savedAt).toBeTruthy();

    const manager = createPersistenceManager();
    const sessions = await manager.getSessions();
    expect(sessions).toHaveLength(1);
  });

  it("endSession() does nothing when not active", async () => {
    const { result } = renderHook(() =>
      useGameSession({ phase: 1, words: testWords })
    );

    let returned: unknown;
    await act(async () => {
      returned = await result.current.endSession();
    });

    expect(returned).toBeNull();
    expect(result.current.status).toBe("idle");
  });
});
