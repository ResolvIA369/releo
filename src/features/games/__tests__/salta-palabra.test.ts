import { describe, it, expect } from "vitest";
import { SALTA_TUNING, saltaTuningForPhase } from "../config/salta-palabra";
import type { PhaseNumber } from "@/shared/types/doman";

describe("SALTA_TUNING (modelo arcade)", () => {
  it("energia, niveles y premios bien formados en toda fase", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = SALTA_TUNING[phase];
      expect(t.energyDrainPerSec).toBeGreaterThan(0);
      expect(t.energyGainCorrect).toBeGreaterThan(0);
      expect(t.energyLossPerObstacle).toBeGreaterThan(0);
      expect(t.energyLossPerObstacle).toBeLessThanOrEqual(t.energyLossWrong);
      expect(t.obstacleInvulnSec).toBeGreaterThan(0);
      expect(t.wordsPerLevel).toBe(10);
      expect(t.levels).toHaveLength(3);
      expect(t.levelCoinBonus).toHaveLength(3);
      expect(t.musicTracks).toHaveLength(3);
    }
  });

  it("Nivel 1 con el piso limpio (foco en leer); 2 y 3 aceleran y suman", () => {
    const { levels } = SALTA_TUNING[1];
    expect(levels[0].logsPerMin).toBe(0);
    expect(levels[0].porcupinesPerMin).toBe(0);
    expect(levels[0].birdsPerMin).toBe(0);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].speedMul).toBeGreaterThan(levels[i - 1].speedMul);
      expect(levels[i].gapMul).toBeLessThan(levels[i - 1].gapMul);
      expect(levels[i].porcupinesPerMin).toBeGreaterThan(levels[i - 1].porcupinesPerMin);
    }
  });

  it("hay puercoespines en los niveles altos (hay que saltarlos)", () => {
    const { levels } = SALTA_TUNING[1];
    expect(levels[levels.length - 1].porcupinesPerMin).toBeGreaterThanOrEqual(3);
  });

  it("saltaTuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(saltaTuningForPhase(99 as PhaseNumber)).toBe(SALTA_TUNING[1]);
  });
});
