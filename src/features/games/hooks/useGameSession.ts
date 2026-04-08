"use client";

import { useState, useCallback, useRef } from "react";
import type {
  DomanWord,
  PhaseNumber,
  SessionResult,
} from "@/shared/types/doman";
import { DEFAULT_SESSION_CONFIG } from "@/shared/constants";
import { createPersistenceManager } from "@/features/persistence/services/db";
import type { PersistedSession } from "@/features/persistence/types";

type SessionStatus = "idle" | "active" | "finished";

interface UseGameSessionOptions {
  phase: PhaseNumber;
  words: DomanWord[];
  affirmation?: string;
}

export function useGameSession({
  phase,
  words,
  affirmation = "",
}: UseGameSessionOptions) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [recognized, setRecognized] = useState<string[]>([]);
  const [savedResult, setSavedResult] = useState<PersistedSession | null>(null);
  const startedAtRef = useRef<string>("");
  const managerRef = useRef(createPersistenceManager());

  const start = useCallback(() => {
    startedAtRef.current = new Date().toISOString();
    setRecognized([]);
    setSavedResult(null);
    setStatus("active");
  }, []);

  const markRecognized = useCallback(
    (wordId: string) => {
      if (status !== "active") return;
      setRecognized((prev) =>
        prev.includes(wordId) ? prev : [...prev, wordId]
      );
    },
    [status]
  );

  const endSession = useCallback(async () => {
    if (status !== "active") return null;

    const result: SessionResult = {
      sessionId: crypto.randomUUID(),
      phase,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      wordsShown: words.map((w) => w.id),
      wordsRecognized: recognized,
      affirmationShown: affirmation,
    };

    setStatus("finished");

    const persisted = await managerRef.current.saveSession(result);
    setSavedResult(persisted);
    return persisted;
  }, [status, phase, words, recognized, affirmation]);

  return {
    status,
    recognized,
    savedResult,
    wordsPerSession: DEFAULT_SESSION_CONFIG.wordsPerSession,
    start,
    markRecognized,
    endSession,
  };
}
