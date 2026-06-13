"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArcadeMusic } from "../components/arcade-music";
import { ARCADE_MUSIC_TRACKS } from "../config/arcade-tuning";

// Musica de fondo para los juegos de pensar (sin niveles): un loop de
// selva bajo que arranca tras el primer gesto, se agacha cuando habla
// Sofia (speakDucked), respeta la pausa de GameShell y se descarta al
// desmontar. Volumen muy bajo para no tapar la voz.
export function useGameMusic(paused: boolean) {
  const ref = useRef<ArcadeMusic | null>(null);
  if (!ref.current) ref.current = new ArcadeMusic(-24, -36, ARCADE_MUSIC_TRACKS);

  useEffect(() => () => { ref.current?.dispose(); ref.current = null; }, []);

  useEffect(() => {
    if (paused) ref.current?.pause();
    else ref.current?.resume();
  }, [paused]);

  // Llamar desde un handler de gesto (tap): destraba el audio
  const ensureStarted = useCallback(() => { void ref.current?.ensureStarted(0); }, []);

  // Agacha la musica mientras corre la promesa de voz
  const speakDucked = useCallback(async (speak: () => Promise<unknown>) => {
    ref.current?.duck(true);
    try { await speak(); } finally { ref.current?.duck(false); }
  }, []);

  return { ensureStarted, speakDucked };
}
