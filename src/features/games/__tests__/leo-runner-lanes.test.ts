import { describe, it, expect } from "vitest";
import { buildLanes, rocksForPhase, LEO_ROCKS_BY_PHASE } from "../config/leo-runner";
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
    const lanes = buildLanes(target, pool, 1, identity);
    expect(lanes).toHaveLength(3);
    expect(lanes.filter((l) => l.word === null)).toHaveLength(1);
    expect(lanes.filter((l) => l.word !== null)).toHaveLength(2);
    expect(lanes.some((l) => l.word?.id === target.id)).toBe(true);
  });

  it("sin piedras los 3 carriles tienen palabra y el target esta presente", () => {
    const lanes = buildLanes(target, pool, 0, identity);
    expect(lanes).toHaveLength(3);
    expect(lanes.every((l) => l.word !== null)).toBe(true);
    expect(lanes.some((l) => l.word?.id === target.id)).toBe(true);
  });

  it("no repite el target como distractor", () => {
    const lanes = buildLanes(target, pool, 0, identity);
    const ids = lanes.map((l) => l.word?.id);
    expect(ids.filter((id) => id === target.id)).toHaveLength(1);
  });

  it("clampa una configuracion de piedras invalida", () => {
    const tooMany = buildLanes(target, pool, 3, identity);
    expect(tooMany.filter((l) => l.word !== null).length).toBeGreaterThanOrEqual(2);
    const negative = buildLanes(target, pool, -1, identity);
    expect(negative.every((l) => l.word !== null)).toBe(true);
  });

  it("rellena con piedras si no alcanzan los distractores", () => {
    const lanes = buildLanes(target, [target], 0, identity);
    expect(lanes.filter((l) => l.word !== null)).toHaveLength(1);
    expect(lanes.some((l) => l.word?.id === target.id)).toBe(true);
  });
});
