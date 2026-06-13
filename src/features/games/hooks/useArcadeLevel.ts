"use client";

import { useCallback, useRef, useState } from "react";
import { levelForElapsed } from "../config/arcade-tuning";

// Nivel por tiempo jugado (0-based). `tick(dt)` se llama desde el
// ticker de Pixi y devuelve true en el frame en que se sube de nivel
// (para reaccionar: acelerar musica, etc.).
export function useArcadeLevel(durationSec: number, levelCount: number) {
  const cfgRef = useRef({ durationSec, levelCount });
  cfgRef.current = { durationSec, levelCount };

  const playSecRef = useRef(0); // tiempo jugado acumulado (seg)
  const levelRef = useRef(0);
  const [levelUi, setLevelUi] = useState(0);

  const tick = useCallback((dt: number): boolean => {
    playSecRef.current += dt / 60;
    const lvl = levelForElapsed(playSecRef.current, cfgRef.current.durationSec, cfgRef.current.levelCount);
    if (lvl !== levelRef.current) {
      levelRef.current = lvl;
      setLevelUi(lvl);
      return true;
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    playSecRef.current = 0;
    levelRef.current = 0;
    setLevelUi(0);
  }, []);

  return { playSecRef, levelRef, levelUi, tick, reset };
}
