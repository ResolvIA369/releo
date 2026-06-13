import { describe, it, expect } from "vitest";
import {
  LEO_VUELA_PHYSICS,
  LEO_VUELA_TUNING,
  physicsForPhase,
  tuningForPhase,
  clampEnergy,
  levelForCorrectCount,
  rewardForLevel,
  pickNextTarget,
  stepFlight,
  buildCloudRound,
  MAX_FALL_SPEED,
} from "../config/leo-vuela";
import { spawnRoll } from "../components/leo-vuela-obstacles";
import fs from "node:fs";
import path from "node:path";
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

  it("los pajaros restan energia y hay ventana de invulnerabilidad", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = LEO_VUELA_TUNING[phase];
      expect(t.energyLossPerBird).toBeGreaterThan(0);
      expect(t.birdHitInvulnSec).toBeGreaterThan(0);
      // Mas suave que un error de lectura: el castigo fuerte es leer mal
      expect(t.energyLossPerBird).toBeLessThanOrEqual(t.energyLossWrong);
    }
  });

  it("tuningForPhase cae a fase 1 ante un valor invalido", () => {
    expect(tuningForPhase(99 as PhaseNumber)).toBe(LEO_VUELA_TUNING[1]);
  });
});

describe("levelForCorrectCount", () => {
  it("sube de nivel cada wordsPerLevel aciertos (10 → nivel 2, 20 → nivel 3)", () => {
    expect(levelForCorrectCount(0, 10, 3)).toBe(0);
    expect(levelForCorrectCount(9, 10, 3)).toBe(0);
    expect(levelForCorrectCount(10, 10, 3)).toBe(1);
    expect(levelForCorrectCount(19, 10, 3)).toBe(1);
    expect(levelForCorrectCount(20, 10, 3)).toBe(2);
  });

  it("topa en el ultimo nivel", () => {
    expect(levelForCorrectCount(9999, 10, 3)).toBe(2);
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

describe("musica", () => {
  it("hay un loop por nivel, servido desde /audio/music/", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = LEO_VUELA_TUNING[phase];
      expect(t.musicTracks.length).toBe(t.levels.length);
      expect(new Set(t.musicTracks).size).toBe(t.musicTracks.length);
      for (const track of t.musicTracks) {
        expect(track.startsWith("/audio/music/")).toBe(true);
        expect(track.endsWith(".mp3")).toBe(true);
      }
    }
  });

  it("los archivos de loop existen en public/", () => {
    for (const track of LEO_VUELA_TUNING[1].musicTracks) {
      expect(fs.existsSync(path.join(process.cwd(), "public", track))).toBe(true);
    }
  });

  it("volumen base bien bajo y ducking aun mas bajo cuando habla Sofia", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const t = LEO_VUELA_TUNING[phase];
      expect(t.musicVolumeDb).toBeLessThanOrEqual(-20);
      expect(t.musicDuckDb).toBeLessThan(t.musicVolumeDb);
    }
  });
});

describe("rewardForLevel", () => {
  const t = LEO_VUELA_TUNING[1];

  it("mapea nivel a estrellas: 1→⭐, 2→⭐⭐, 3→⭐⭐⭐", () => {
    expect(rewardForLevel(0, t).stars).toBe(1);
    expect(rewardForLevel(1, t).stars).toBe(2);
    expect(rewardForLevel(2, t).stars).toBe(3);
  });

  it("mas nivel alcanzado, mas monedas extra", () => {
    const coins = [0, 1, 2].map((lvl) => rewardForLevel(lvl, t).bonusCoins);
    expect(coins[1]).toBeGreaterThan(coins[0]);
    expect(coins[2]).toBeGreaterThan(coins[1]);
  });

  it("clampea niveles fuera de rango", () => {
    expect(rewardForLevel(-1, t)).toEqual(rewardForLevel(0, t));
    expect(rewardForLevel(99, t)).toEqual(rewardForLevel(2, t));
  });
});

describe("obstaculos", () => {
  it("Nivel 1 casi sin obstaculos (foco en leer); 2 y 3 suman", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const { levels } = LEO_VUELA_TUNING[phase];
      expect(levels[0].boltsPerMin).toBe(0);
      expect(levels[0].rainPerMin).toBe(0);
      expect(levels[0].birdsPerMin).toBeLessThanOrEqual(1);
      expect(levels[0].floorCloudsPerMin).toBe(0);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].birdsPerMin).toBeGreaterThan(levels[i - 1].birdsPerMin);
        expect(levels[i].boltsPerMin).toBeGreaterThanOrEqual(levels[i - 1].boltsPerMin);
        expect(levels[i].rainPerMin).toBeGreaterThanOrEqual(levels[i - 1].rainPerMin);
        expect(levels[i].floorCloudsPerMin).toBeGreaterThanOrEqual(levels[i - 1].floorCloudsPerMin);
      }
    }
  });

  it("Nivel 3: nubes-objetivo bien mas rapidas y piso denso de nubes grises", () => {
    for (const phase of [1, 2, 3, 4, 5] as PhaseNumber[]) {
      const { levels } = LEO_VUELA_TUNING[phase];
      const last = levels[levels.length - 1];
      expect(last.speedMul).toBeGreaterThanOrEqual(1.8);
      expect(last.floorCloudsPerMin).toBeGreaterThanOrEqual(12);
    }
  });

  it("spawnRoll: tasa 0 nunca dispara; con rng minimo dispara", () => {
    expect(spawnRoll(0, 1, () => 0)).toBe(false);
    expect(spawnRoll(10, 1, () => 0)).toBe(true);
    expect(spawnRoll(10, 1, () => 0.999)).toBe(false);
  });

  it("spawnRoll respeta la tasa esperada por minuto (aprox)", () => {
    // 6 eventos/min a 60fps → prob 6/3600 por frame
    let calls = 0;
    const rng = () => { calls++; return 0.5; };
    spawnRoll(6, 1, rng);
    expect(calls).toBe(1);
    expect(spawnRoll(6, 1, () => 6 / 3600 - 0.0001)).toBe(true);
    expect(spawnRoll(6, 1, () => 6 / 3600 + 0.0001)).toBe(false);
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

describe("pickNextTarget", () => {
  it("elige del pool y permite repetir palabras a lo largo de la partida", () => {
    const w = pickNextTarget(pool, null, () => 0);
    expect(pool).toContain(w);
  });

  it("no repite la misma palabra dos veces seguidas", () => {
    for (let i = 0; i < 20; i++) {
      const next = pickNextTarget(pool, target.id);
      expect(next.id).not.toBe(target.id);
    }
  });

  it("con una sola palabra en el pool la devuelve aunque sea la ultima", () => {
    const only = pickNextTarget([target], target.id, () => 0.5);
    expect(only.id).toBe(target.id);
  });

  it("rng en el extremo superior no se cae del array", () => {
    const w = pickNextTarget(pool, null, () => 0.999999);
    expect(pool).toContain(w);
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
