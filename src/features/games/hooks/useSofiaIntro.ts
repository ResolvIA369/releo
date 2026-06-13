"use client";

import { useEffect, useRef } from "react";
import { sofiaPlayAudio } from "@/shared/services/sofiaVoice";

// Intro de Sofia al arrancar un juego arcade: mientras `active` sea
// true reproduce el mp3 (con fallback de texto hablado) y llama a
// onDone al terminar. SOLO para el arranque — no introduce pausas
// durante el juego.
export function useSofiaIntro(active: boolean, mp3Key: string, fallbackText: string, onDone: () => void) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    let alive = true;
    (async () => {
      await sofiaPlayAudio(mp3Key, fallbackText, "encouraging");
      if (alive) onDoneRef.current();
    })();
    return () => { alive = false; };
  }, [active, mp3Key, fallbackText]);
}
