import { describe, it, expect } from "vitest";
import { SALTA_PALABRA_Z } from "../components/SaltaPalabra";

// Auditoría de grabación sep-2026 (docs/RELEO-AUDITORIA-GRABACION.md,
// categoría B3): mismo fix preventivo que LeoRunner (ver
// leo-runner-z.test.ts) — Salta la Palabra usa PixiJS con capas propias
// (scenery, words, obstacles, leo) que ahora dependen de zIndex +
// sortableChildren=true en vez de únicamente del orden de addChild().
describe("SALTA_PALABRA_Z — invariantes de la jerarquía", () => {
  it("orden visual: escenario < palabras < obstáculos < leo", () => {
    expect(SALTA_PALABRA_Z.scenery).toBeLessThan(SALTA_PALABRA_Z.words);
    expect(SALTA_PALABRA_Z.words).toBeLessThan(SALTA_PALABRA_Z.obstacles);
    expect(SALTA_PALABRA_Z.obstacles).toBeLessThan(SALTA_PALABRA_Z.leo);
  });

  it("peor caso de orden de inserción: aunque Leo se agregue al stage ANTES que las demás capas, sortableChildren+zIndex lo deja arriba de todas al ordenar", () => {
    const insertionOrder = [
      { name: "leo", zIndex: SALTA_PALABRA_Z.leo },
      { name: "obstacles", zIndex: SALTA_PALABRA_Z.obstacles },
      { name: "words", zIndex: SALTA_PALABRA_Z.words },
      { name: "scenery", zIndex: SALTA_PALABRA_Z.scenery },
    ];
    const drawOrder = [...insertionOrder].sort((a, b) => a.zIndex - b.zIndex).map((c) => c.name);
    expect(drawOrder).toEqual(["scenery", "words", "obstacles", "leo"]);
  });
});
