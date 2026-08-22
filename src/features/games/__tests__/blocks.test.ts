import { describe, it, expect } from "vitest";
import { buildBlocks, cantidadDeBloques, PALABRAS_POR_BLOQUE } from "@/features/games/config/blocks";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";

const FASES = [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS];

describe("bloques de juego", () => {
  it("cada bloque es un número entero de clases de cinco palabras", () => {
    for (const fase of FASES)
      for (const b of buildBlocks(fase))
        expect(b.words.length % 5, `bloque de ${b.words.length}`).toBe(0);
  });

  it("los bloques cubren todas las palabras, sin repetir ni perder", () => {
    for (const fase of FASES) {
      const juntas = buildBlocks(fase).flatMap((b) => b.words);
      expect(juntas.length).toBe(fase.length);
      expect(new Set(juntas.map((w) => w.text)).size).toBe(new Set(fase.map((w) => w.text)).size);
    }
  });

  it("los mundos de 50 dan dos bloques de 25 = cinco clases cada uno", () => {
    const b = buildBlocks(PHASE1_WORDS);
    expect(b).toHaveLength(2);
    expect(b[0].words).toHaveLength(PALABRAS_POR_BLOQUE);
    expect(b[0].clases).toEqual([1, 2, 3, 4, 5]);
    expect(b[1].clases).toEqual([6, 7, 8, 9, 10]);
  });

  it("el mundo 5, de 20 palabras, va en un bloque de cuatro clases", () => {
    const b = buildBlocks(PHASE5_WORDS);
    expect(b).toHaveLength(1);
    expect(b[0].clases).toEqual([1, 2, 3, 4]);
  });

  it("cantidadDeBloques coincide con lo que devuelve buildBlocks", () => {
    for (const fase of FASES)
      expect(cantidadDeBloques(fase.length)).toBe(buildBlocks(fase).length);
  });
});
