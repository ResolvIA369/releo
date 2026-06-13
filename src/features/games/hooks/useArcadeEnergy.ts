"use client";

import { useCallback, useRef, useState } from "react";
import { clampEnergy } from "../config/arcade-tuning";

// Barra de energia de los juegos arcade. Pensado para usarse desde el
// ticker de Pixi: el estado vivo esta en refs (sin closures viejas) y
// la UI de React se sincroniza ~6 veces por segundo o al ajustar.
export function useArcadeEnergy(tuning: { energyStart: number; energyMax: number; energyDrainPerSec: number }) {
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;

  const energyRef = useRef(tuning.energyStart);
  const [energyUi, setEnergyUi] = useState(tuning.energyStart);
  const syncRef = useRef(0);

  // Acierto / error / obstaculo: ajusta y refleja en la UI al instante
  const adjust = useCallback((delta: number) => {
    energyRef.current = clampEnergy(energyRef.current + delta, tuningRef.current.energyMax);
    setEnergyUi(Math.round(energyRef.current));
  }, []);

  // Drenaje pasivo por frame; devuelve true si la energia llego a 0
  const drainTick = useCallback((dt: number): boolean => {
    energyRef.current = clampEnergy(
      energyRef.current - (tuningRef.current.energyDrainPerSec * dt) / 60,
      tuningRef.current.energyMax,
    );
    syncRef.current += dt;
    if (syncRef.current >= 10) {
      syncRef.current = 0;
      setEnergyUi(Math.round(energyRef.current));
    }
    return energyRef.current <= 0;
  }, []);

  const reset = useCallback(() => {
    energyRef.current = tuningRef.current.energyStart;
    syncRef.current = 0;
    setEnergyUi(tuningRef.current.energyStart);
  }, []);

  return { energyRef, energyUi, adjust, drainTick, reset };
}
