"use client";

import { useCallback, useRef, useState } from "react";
import { levelForCorrectCount } from "../config/arcade-tuning";

// Nivel por palabras acertadas (0-based). Sube tras `wordsPerLevel`
// aciertos y topa en `levelCount`. `tick(dt)` ya NO cambia el nivel:
// solo avanza un reloj de juego (playSecRef) que algunos juegos usan
// para la invulnerabilidad de obstaculos. El nivel sube en
// `registerCorrect()`, que devuelve true en el acierto que sube de
// nivel (para reaccionar: acelerar musica, etc.).
export function useArcadeLevel(wordsPerLevel: number, levelCount: number) {
  const cfgRef = useRef({ wordsPerLevel, levelCount });
  cfgRef.current = { wordsPerLevel, levelCount };

  const playSecRef = useRef(0); // reloj de juego acumulado (seg)
  const correctRef = useRef(0); // aciertos acumulados
  const levelRef = useRef(0);
  const [levelUi, setLevelUi] = useState(0);

  const tick = useCallback((dt: number): void => {
    playSecRef.current += dt / 60;
  }, []);

  const registerCorrect = useCallback((): boolean => {
    correctRef.current += 1;
    const lvl = levelForCorrectCount(correctRef.current, cfgRef.current.wordsPerLevel, cfgRef.current.levelCount);
    if (lvl !== levelRef.current) {
      levelRef.current = lvl;
      setLevelUi(lvl);
      return true;
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    playSecRef.current = 0;
    correctRef.current = 0;
    levelRef.current = 0;
    setLevelUi(0);
  }, []);

  return { playSecRef, correctRef, levelRef, levelUi, tick, registerCorrect, reset };
}
