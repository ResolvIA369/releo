"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArcadeMusic } from "../components/arcade-music";
import { ARCADE_MUSIC_TRACKS } from "../config/arcade-tuning";

// Musica de fondo para los juegos de pensar (sin niveles): un loop de
// selva bajo que arranca tras el primer gesto, se agacha cuando habla
// Sofia (speakDucked), respeta la pausa de GameShell y se descarta al
// desmontar.
//
// -24dB (valor original) quedaba aun mas bajo que los -22dB de los
// juegos arcade — practicamente inaudible (mismo diagnostico que Leo
// Vuela: por debajo del piso de audibilidad en parlantes tipicos).
// -10dB es el valor ya validado ahi. Se mantiene el duck mas profundo
// (-36 en vez de -34) porque estos juegos no tienen musica por nivel,
// asi que no hay razon para tocarlo.
export const GAME_MUSIC_VOLUME_DB = -10;
export const GAME_MUSIC_DUCK_DB = -36;

export function useGameMusic(paused: boolean) {
  const ref = useRef<ArcadeMusic | null>(null);
  if (!ref.current) ref.current = new ArcadeMusic(GAME_MUSIC_VOLUME_DB, GAME_MUSIC_DUCK_DB, ARCADE_MUSIC_TRACKS);

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
