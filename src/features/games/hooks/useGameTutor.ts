"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTutor } from "@/features/tutor/hooks/useTutor";
import type { DomanWord } from "@/shared/types/doman";

interface UseGameTutorOptions {
  childName?: string;
  enabled?: boolean;
}

/**
 * Connects Seño Sofía to the game lifecycle.
 *
 * Usage in a game component:
 *   const sofia = useGameTutor({ childName });
 *   // On game start:   sofia.onGameStart(words)
 *   // On correct:      sofia.onCorrectAnswer()
 *   // On mistake:      sofia.onWrongAnswer()
 *   // On game end:     sofia.onGameEnd()
 *   // On word shown:   sofia.onWordShown(word)
 */
export function useGameTutor({ childName, enabled = true }: UseGameTutorOptions = {}) {
  const tutor = useTutor({ childName, enabled });
  const correctCount = useRef(0);
  const hasGreeted = useRef(false);

  const onGameStart = useCallback(
    (words: DomanWord[]) => {
      if (!enabled || hasGreeted.current) return;
      hasGreeted.current = true;
      correctCount.current = 0;
      tutor.greet();
    },
    [enabled, tutor]
  );

  const onCorrectAnswer = useCallback(() => {
    if (!enabled) return;
    correctCount.current++;
    // Praise every 2 correct answers to avoid being too chatty
    if (correctCount.current % 2 === 0) {
      tutor.praise();
    }
  }, [enabled, tutor]);

  const onWrongAnswer = useCallback(() => {
    if (!enabled) return;
    tutor.onMistake();
  }, [enabled, tutor]);

  const onWordShown = useCallback(
    (word: DomanWord) => {
      if (!enabled) return;
      tutor.introduceWord(word);
    },
    [enabled, tutor]
  );

  const onGameEnd = useCallback(() => {
    if (!enabled) return;
    tutor.farewell();
  }, [enabled, tutor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => tutor.stop();
  }, [tutor]);

  return {
    persona: tutor.persona,
    onGameStart,
    onCorrectAnswer,
    onWrongAnswer,
    onWordShown,
    onGameEnd,
    repeatWord: tutor.repeatWord,
    stop: tutor.stop,
  };
}
