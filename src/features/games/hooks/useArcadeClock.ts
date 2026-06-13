"use client";

import { useEffect, useRef } from "react";

// Driver de tiempo para los juegos arcade DOM (sin ticker de Pixi).
// Mientras `active` sea true corre un requestAnimationFrame y llama a
// `onTick(dt)` cada frame, con `dt` en "frames a 60fps" — la misma
// convencion que el ticker de Pixi, asi useArcadeEnergy/useArcadeLevel
// funcionan igual que en los juegos Leo. dt se clampa para que un tab
// en segundo plano no produzca un salto gigante al volver.
export function useArcadeClock(active: boolean, onTick: (dt: number) => void) {
  const cbRef = useRef(onTick);
  cbRef.current = onTick;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / (1000 / 60), 4); // cap ~4 frames
      last = now;
      cbRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
