"use client";

import { useEffect, useRef } from "react";
import { sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import {
  pickPregameAffirmation,
  hasSeenRules,
  markRulesSeen,
} from "@/features/tutor/services/pregameAffirmations";
import type { GameId } from "../types";

interface UsePreGameIntroArgs {
  active: boolean;
  gameId: GameId;
  isDemo: boolean;
  rulesMp3: string;
  rulesText: string;
  onDone: () => void;
}

/**
 * Reemplazo de useSofiaIntro para los juegos: antes de las reglas, suena
 * una afirmación (rotando, sin repetir la misma dos veces seguidas). Las
 * reglas solo se dicen la primera vez que el chico juega a ESE juego
 * (persistido en localStorage vía pregameAffirmations); en modo demo nunca
 * suenan. Expone `skip()` para el toque en el overlay — corta lo que esté
 * sonando y pasa directo a onDone.
 */
export function usePreGameIntro({
  active,
  gameId,
  isDemo,
  rulesMp3,
  rulesText,
  onDone,
}: UsePreGameIntroArgs): { skip: () => void } {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const doneRef = useRef(false);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!active) return;
    doneRef.current = false;
    let alive = true;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      stopVoice();
      onDoneRef.current();
    };
    skipRef.current = finish;

    (async () => {
      const { mp3, text } = pickPregameAffirmation();
      await sofiaPlayAudio(mp3, text, "encouraging");
      if (!alive || doneRef.current) return;

      if (isDemo || hasSeenRules(gameId)) {
        finish();
        return;
      }

      markRulesSeen(gameId);
      await sofiaPlayAudio(rulesMp3, rulesText, "gentle");
      if (!alive || doneRef.current) return;
      finish();
    })();

    return () => {
      alive = false;
    };
  }, [active, gameId, isDemo, rulesMp3, rulesText]);

  return { skip: () => skipRef.current() };
}
