"use client";

import { useEffect, useRef } from "react";

// Controles de teclado para los juegos arcade, en paralelo al toque
// (el toque queda igual en mobile). Las teclas mapeadas hacen
// preventDefault para que las flechas y la barra no scrolleen la pagina.
export function useGameKeys(enabled: boolean, bindings: Record<string, () => void>) {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const action = bindingsRef.current[e.key];
      if (!action) return;
      e.preventDefault();
      if (e.repeat) return;
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
