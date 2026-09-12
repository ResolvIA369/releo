"use client";

import { useEffect, useState } from "react";

// Nivel de calidad visual para los efectos DECORATIVOS de los juegos
// arcade (parallax, trail de partículas, número de nubes de fondo).
// Nunca afecta la mecánica de lectura ni la legibilidad de la palabra
// — solo cuánto espectáculo alrededor. Reutilizable por cualquier
// juego Pixi (ver docs/RELEO-JUEGOS-V2.md §11).
//
// Heurística estática y barata (se calcula una sola vez al montar):
// `prefers-reduced-motion` o pocos núcleos de CPU → "low". El resto,
// "high". No hay watchdog de FPS en vivo todavía — es la mejora
// obvia si algún dispositivo real resulta ser un caso intermedio.
export type QualityTier = "high" | "low";

export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "low";
  } catch { /* matchMedia no disponible */ }
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : undefined;
  if (typeof cores === "number" && cores > 0 && cores <= 4) return "low";
  return "high";
}

export function useQualityTier(): QualityTier {
  const [tier, setTier] = useState<QualityTier>("high");
  useEffect(() => setTier(detectQualityTier()), []);
  return tier;
}
