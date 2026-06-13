import { describe, it, expect } from "vitest";
import { WORD_FISHING_TUNING, wordFishingTuningForPhase } from "../config/word-fishing";
import type { PhaseNumber } from "@/shared/types/doman";

describe("WORD_FISHING_TUNING (modelo arcade)", () => {
  it("energia, niveles y premios bien formados en toda fase", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = WORD_FISHING_TUNING[phase];
      expect(t.energyDrainPerSec).toBeGreaterThan(0);
      expect(t.energyGainCorrect).toBeGreaterThan(0);
      expect(t.wordsPerLevel).toBe(10);
      expect(t.levels).toHaveLength(3);
      expect(t.levelCoinBonus).toHaveLength(3);
      expect(t.musicTracks).toHaveLength(3);
    }
  });

  it("los niveles aceleran los peces", () => {
    const { levels } = WORD_FISHING_TUNING[1];
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].speedMul).toBeGreaterThan(levels[i - 1].speedMul);
    }
  });

  it("sin escape (los peces nadan en loop) ni obstaculos", () => {
    expect(WORD_FISHING_TUNING[1].energyLossEscape).toBe(0);
    expect(WORD_FISHING_TUNING[1].energyLossPerObstacle).toBe(0);
  });

  it("wordFishingTuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(wordFishingTuningForPhase(99 as PhaseNumber)).toBe(WORD_FISHING_TUNING[1]);
  });
});
