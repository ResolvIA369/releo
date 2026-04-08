"use client";

import { useCallback, useRef, useState } from "react";
import type { PhaseNumber } from "@/shared/types/doman";
import type { GameId, GameSessionState } from "../types";
import { createPersistenceManager } from "@/features/persistence/services/db";

interface UseGameStateOptions {
  phase?: PhaseNumber;
}

export function useGameState(gameId: GameId, options: UseGameStateOptions = {}) {
  const [state, setState] = useState<GameSessionState>({
    gameId,
    score: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    startedAt: Date.now(),
    wordsCompleted: [],
  });

  const managerRef = useRef(createPersistenceManager());
  const startedAtRef = useRef(new Date().toISOString());

  const recordAttempt = useCallback(
    (correct: boolean, wordId?: string) => {
      setState((prev) => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        correctAttempts: prev.correctAttempts + (correct ? 1 : 0),
        score: prev.score + (correct ? 10 : 0),
        wordsCompleted: wordId
          ? [...new Set([...prev.wordsCompleted, wordId])]
          : prev.wordsCompleted,
      }));
    },
    []
  );

  const finish = useCallback(async () => {
    await managerRef.current.saveSession({
      sessionId: crypto.randomUUID(),
      phase: options.phase ?? 1,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      wordsShown: state.wordsCompleted,
      wordsRecognized: state.wordsCompleted.slice(0, state.correctAttempts),
      affirmationShown: "",
    });
  }, [state, options.phase]);

  const reset = useCallback(() => {
    startedAtRef.current = new Date().toISOString();
    setState({
      gameId,
      score: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      startedAt: Date.now(),
      wordsCompleted: [],
    });
  }, [gameId]);

  return { state, recordAttempt, finish, reset };
}
