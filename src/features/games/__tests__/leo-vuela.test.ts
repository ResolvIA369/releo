import { describe, it, expect } from "vitest";
import {
  LEO_VUELA_PHYSICS,
  LEO_VUELA_TUNING,
  physicsForPhase,
  tuningForPhase,
  clampEnergy,
  levelForElapsed,
  stepFlight,
  buildCloudRound,
  MAX_FALL_SPEED,
} from "../config/leo-vuela";
import { PHASE1_WORDS } from "@/shared/constants";
import type { PhaseNumber } from "@/shared/types/doman";

const pool = PHASE1_WORDS.slice(0, 10);
const target = pool[0];
const BANDS = [105, 200, 295];
const identity = <T,>(arr: T[]): T[] => [...arr];

describe("physicsForPhase", () => {
  it("Mundo 1 tiene las nubes mas lentas y mas separadas (tiempo de leer)", () => {
    const m1 = physicsForPhase(1);
    for (const phase of [2, 3, 4, 5] as PhaseNumber[]) {
      const cfg = physicsForPhase(phase);
      expect(m1.cloudSpeed).toBeLessThan(cfg.cloudSpeed);
      expect(m1.cloudGap).toBeGreaterThan(cfg.cloudGap);
    }
  });

  it("toda fase tiene gravedad e impulso positivos", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const cfg = LEO_VUELA_PHYSICS[phase];
      expect(cfg.gravity).toBeGreaterThan(0);
      expect(cfg.impulse).toBeGreaterThan(0);
    }
  });
});

describe("tuning de energia", () => {
  it("toda fase tiene drenaje, ganancia y perdidas positivas", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = LEO_VUELA_TUNING[phase];
      expect(t.energyDrainPerSec).toBeGreaterThan(0);
      expect(t.energyGainCorrect).toBeGreaterThan(0);
      expect(t.energyLossWrong).toBeGreaterThan(0);
      expect(t.energyLossEscape).toBeGreaterThan(0);
      expect(t.energyStart).toBeLessThanOrEqual(t.energyMax);
    }
  });

  it("tuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(tuningForPhase(99 as PhaseNumber)).toBe(LEO_VUELA_TUNING[1]);
  });
});

describe("levelForElapsed", () => {
  it("mapea minutos 0-3 / 3-6 / 6-9 a niveles 1 / 2 / 3", () => {
    expect(levelForElapsed(0, 180, 3)).toBe(0);
    expect(levelForElapsed(179, 180, 3)).toBe(0);
    expect(levelForElapsed(180, 180, 3)).toBe(1);
    expect(levelForElapsed(359, 180, 3)).toBe(1);
    expect(levelForElapsed(360, 180, 3)).toBe(2);
  });

  it("pasado el ultimo umbral se queda en el nivel final", () => {
    expect(levelForElapsed(9999, 180, 3)).toBe(2);
  });

  it("cada nivel es mas dificil: mas velocidad y nubes mas juntas", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const { levels } = LEO_VUELA_TUNING[phase];
      expect(levels.length).toBe(3);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].speedMul).toBeGreaterThan(levels[i - 1].speedMul);
        expect(levels[i].gapMul).toBeLessThan(levels[i - 1].gapMul);
      }
    }
  });
});

describe("clampEnergy", () => {
  it("clampa entre 0 y el maximo", () => {
    expect(clampEnergy(-5, 100)).toBe(0);
    expect(clampEnergy(120, 100)).toBe(100);
    expect(clampEnergy(50, 100)).toBe(50);
  });
});

describe("stepFlight", () => {
  const cfg = { gravity: 0.13 };
  const bounds = { top: 130, ground: 366 };

  it("la gravedad acelera la caida", () => {
    const s1 = stepFlight(200, 0, 1, cfg, bounds);
    const s2 = stepFlight(s1.y, s1.vy, 1, cfg, bounds);
    expect(s1.y).toBeGreaterThan(200);
    expect(s2.vy).toBeGreaterThan(s1.vy);
  });

  it("un impulso negativo (aletazo) sube", () => {
    const s = stepFlight(200, -3.2, 1, cfg, bounds);
    expect(s.y).toBeLessThan(200);
  });

  it("clampea contra el techo", () => {
    const s = stepFlight(bounds.top + 1, -10, 1, cfg, bounds);
    expect(s.y).toBe(bounds.top);
    expect(s.vy).toBe(0);
  });

  it("clampea contra el piso", () => {
    const s = stepFlight(bounds.ground - 1, 10, 1, cfg, bounds);
    expect(s.y).toBe(bounds.ground);
    expect(s.vy).toBe(0);
  });

  it("la velocidad de caida tiene tope", () => {
    let y = bounds.top, vy = 0;
    for (let i = 0; i < 200 && y < bounds.ground; i++) {
      ({ y, vy } = stepFlight(y, vy, 1, cfg, bounds));
      expect(vy).toBeLessThanOrEqual(MAX_FALL_SPEED);
    }
  });
});

describe("buildCloudRound", () => {
  it("arma 3 nubes con el target incluido", () => {
    const clouds = buildCloudRound(target, pool, BANDS, identity);
    expect(clouds).toHaveLength(3);
    expect(clouds.some((c) => c.word.id === target.id)).toBe(true);
  });

  it("cada nube vuela en una banda de altura distinta", () => {
    const clouds = buildCloudRound(target, pool, BANDS, identity);
    const bands = clouds.map((c) => c.band);
    expect(new Set(bands).size).toBe(3);
    for (const band of bands) expect(BANDS).toContain(band);
  });

  it("no repite el target como distractor", () => {
    const clouds = buildCloudRound(target, pool, BANDS, identity);
    expect(clouds.filter((c) => c.word.id === target.id)).toHaveLength(1);
  });

  it("si no alcanzan los distractores igual sale el target", () => {
    const clouds = buildCloudRound(target, [target], BANDS, identity);
    expect(clouds).toHaveLength(1);
    expect(clouds[0].word.id).toBe(target.id);
  });
});
