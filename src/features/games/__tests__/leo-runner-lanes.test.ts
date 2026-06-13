import { describe, it, expect } from "vitest";
import { buildLanes, rocksForPhase, LEO_ROCKS_BY_PHASE, LEO_RUNNER_TUNING, lanesXForCount } from "../config/leo-runner";
import { PHASE1_WORDS } from "@/shared/constants";
import type { PhaseNumber } from "@/shared/types/doman";

const pool = PHASE1_WORDS.slice(0, 10);
const target = pool[0];
const identity = <T,>(arr: T[]): T[] => [...arr];

describe("rocksForPhase", () => {
  it("Mundo 1 deja una sola piedra", () => {
    expect(rocksForPhase(1)).toBe(1);
  });

  it("Mundos 2-5 no tienen piedras", () => {
    for (const phase of [2, 3, 4, 5] as PhaseNumber[]) {
      expect(rocksForPhase(phase)).toBe(0);
    }
  });

  it("nunca deja menos de 2 carriles con palabra aunque se configure de mas", () => {
    const original = LEO_ROCKS_BY_PHASE[1];
    LEO_ROCKS_BY_PHASE[1] = 5;
    expect(rocksForPhase(1)).toBe(1);
    LEO_ROCKS_BY_PHASE[1] = original;
  });
});

describe("buildLanes", () => {
  it("con 1 piedra quedan 2 carriles con palabra (target incluido)", () => {
    const lanes = buildLanes(target, pool, 1, 3, identity);
    expect(lanes).toHaveLength(3);
    expect(lanes.filter((l) => l.word === null)).toHaveLength(1);
    expect(lanes.filter((l) => l.word !== null)).toHaveLength(2);
    expect(lanes.some((l) => l.word?.id === target.id)).toBe(true);
  });

  it("sin piedras los 3 carriles tienen palabra y el target esta presente", () => {
    const lanes = buildLanes(target, pool, 0, 3, identity);
    expect(lanes).toHaveLength(3);
    expect(lanes.every((l) => l.word !== null)).toBe(true);
    expect(lanes.some((l) => l.word?.id === target.id)).toBe(true);
  });

  it("no repite el target como distractor", () => {
    const lanes = buildLanes(target, pool, 0, 3, identity);
    const ids = lanes.map((l) => l.word?.id);
    expect(ids.filter((id) => id === target.id)).toHaveLength(1);
  });

  it("clampa una configuracion de piedras invalida", () => {
    const tooMany = buildLanes(target, pool, 3, 3, identity);
    expect(tooMany.filter((l) => l.word !== null).length).toBeGreaterThanOrEqual(2);
    const negative = buildLanes(target, pool, -1, 3, identity);
    expect(negative.every((l) => l.word !== null)).toBe(true);
  });

  it("rellena con piedras si no alcanzan los distractores", () => {
    const lanes = buildLanes(target, [target], 0, 3, identity);
    expect(lanes.filter((l) => l.word !== null)).toHaveLength(1);
    expect(lanes.some((l) => l.word?.id === target.id)).toBe(true);
  });
});

describe("LEO_RUNNER_TUNING (modelo arcade)", () => {
  it("energia, niveles y premios bien formados en toda fase", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = LEO_RUNNER_TUNING[phase];
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

  it("Nivel 1 sin obstaculos extra (solo piedras); 2 y 3 aceleran y suman", () => {
    const { levels } = LEO_RUNNER_TUNING[1];
    expect(levels[0].logsPerMin).toBe(0);
    expect(levels[0].birdsPerMin).toBe(0);
    expect(levels[0].rainPerMin).toBe(0);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].speedMul).toBeGreaterThan(levels[i - 1].speedMul);
      expect(levels[i].logsPerMin).toBeGreaterThan(levels[i - 1].logsPerMin);
    }
  });
});

describe("carriles por nivel", () => {
  it("Nivel 1 y 2 tienen 3 carriles, Nivel 3 suma un cuarto", () => {
    expect(LEO_RUNNER_TUNING[1].lanesByLevel).toEqual([3, 3, 4]);
  });

  it("buildLanes arma la cantidad pedida con el target presente", () => {
    const lanes4 = buildLanes(target, pool, 0, 4, identity);
    expect(lanes4).toHaveLength(4);
    expect(lanes4.filter((l) => l.word !== null).length).toBe(4);
    expect(lanes4.some((l) => l.word?.id === target.id)).toBe(true);
  });

  it("lanesXForCount reparte parejo y dentro del ancho", () => {
    const xs = lanesXForCount(4, 640);
    expect(xs).toHaveLength(4);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    expect(xs[0]).toBeGreaterThan(0);
    expect(xs[xs.length - 1]).toBeLessThan(640);
  });
});
