import { describe, it, expect } from "vitest";
import { WORD_RAIN_TUNING, wordRainTuningForPhase } from "../config/word-rain";
import type { PhaseNumber } from "@/shared/types/doman";

describe("WORD_RAIN_TUNING (modelo arcade)", () => {
  it("energia, niveles y premios bien formados en toda fase", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = WORD_RAIN_TUNING[phase];
      expect(t.energyDrainPerSec).toBeGreaterThan(0);
      expect(t.energyGainCorrect).toBeGreaterThan(0);
      expect(t.levelDurationSec).toBe(126);
      expect(t.levels).toHaveLength(3);
      expect(t.levelCoinBonus).toHaveLength(3);
      expect(t.musicTracks).toHaveLength(3);
    }
  });

  it("los niveles aceleran la caida (menos segundos)", () => {
    const { levels } = WORD_RAIN_TUNING[1];
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].fallSeconds).toBeLessThan(levels[i - 1].fallSeconds);
    }
  });

  it("sin obstaculos", () => {
    expect(WORD_RAIN_TUNING[1].energyLossPerObstacle).toBe(0);
  });

  it("wordRainTuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(wordRainTuningForPhase(99 as PhaseNumber)).toBe(WORD_RAIN_TUNING[1]);
  });
});
