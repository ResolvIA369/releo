import { describe, it, expect } from "vitest";
import { BUBBLES_TUNING, bubblesTuningForPhase } from "../config/bubbles";
import type { PhaseNumber } from "@/shared/types/doman";

describe("BUBBLES_TUNING (modelo arcade)", () => {
  it("energia, niveles y premios bien formados en toda fase", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = BUBBLES_TUNING[phase];
      expect(t.energyDrainPerSec).toBeGreaterThan(0);
      expect(t.energyGainCorrect).toBeGreaterThan(0);
      expect(t.wordsPerLevel).toBe(10);
      expect(t.levels).toHaveLength(3);
      expect(t.levelCoinBonus).toHaveLength(3);
      expect(t.musicTracks).toHaveLength(3);
    }
  });

  it("los niveles aceleran la deriva y agregan burbujas", () => {
    const { levels } = BUBBLES_TUNING[1];
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].speedMul).toBeGreaterThan(levels[i - 1].speedMul);
      expect(levels[i].count).toBeGreaterThanOrEqual(levels[i - 1].count);
    }
  });

  it("sin escape (flotan en loop) ni obstaculos", () => {
    expect(BUBBLES_TUNING[1].energyLossEscape).toBe(0);
    expect(BUBBLES_TUNING[1].energyLossPerObstacle).toBe(0);
  });

  it("bubblesTuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(bubblesTuningForPhase(99 as PhaseNumber)).toBe(BUBBLES_TUNING[1]);
  });
});
