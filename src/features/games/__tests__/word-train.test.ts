import { describe, it, expect } from "vitest";
import { WORD_TRAIN_TUNING, wordTrainTuningForPhase } from "../config/word-train";
import type { PhaseNumber } from "@/shared/types/doman";

describe("WORD_TRAIN_TUNING (modelo arcade)", () => {
  it("energia, niveles y premios bien formados en toda fase", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = WORD_TRAIN_TUNING[phase];
      expect(t.energyDrainPerSec).toBeGreaterThan(0);
      expect(t.energyGainCorrect).toBeGreaterThan(0);
      expect(t.energyLossWrong).toBeGreaterThan(0);
      expect(t.wordsPerLevel).toBe(10);
      expect(t.levels).toHaveLength(3);
      expect(t.levelCoinBonus).toHaveLength(3);
      expect(t.musicTracks).toHaveLength(3);
      expect(t.crossSeconds).toBeGreaterThan(0);
    }
  });

  it("los niveles aceleran el tren y el target siempre cabe en los vagones", () => {
    const { levels } = WORD_TRAIN_TUNING[1];
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].speedMul).toBeGreaterThan(levels[i - 1].speedMul);
    }
    for (const lvl of levels) expect(lvl.wagons).toBeGreaterThanOrEqual(2);
  });

  it("sin obstaculos (no hay avatar que esquive)", () => {
    expect(WORD_TRAIN_TUNING[1].energyLossPerObstacle).toBe(0);
  });

  it("wordTrainTuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(wordTrainTuningForPhase(99 as PhaseNumber)).toBe(WORD_TRAIN_TUNING[1]);
  });
});
