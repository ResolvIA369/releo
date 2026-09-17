import { describe, it, expect } from "vitest";
import { LEO_RUNNER_Z } from "../components/LeoRunner";

// Auditoría de grabación sep-2026 (docs/RELEO-AUDITORIA-GRABACION.md,
// categoría B3): LeoRunner usa PixiJS con capas propias (road, dashes,
// signs, obstacles, leo) que hoy se agregan siempre en el mismo orden
// sincrónico, pero sin ninguna garantía estructural — a diferencia de
// Leo Vuela, que ya tuvo este bug real (el paisaje del mundo terminaba
// arriba del gameplay cuando su carga async resolvía tarde) y lo
// corrigió con zIndex + sortableChildren=true (ver arcade-sky.ts).
// Este test fija el mismo invariante acá.
describe("LEO_RUNNER_Z — invariantes de la jerarquía", () => {
  it("orden visual: pista < carriles < carteles < obstáculos < leo", () => {
    expect(LEO_RUNNER_Z.road).toBeLessThan(LEO_RUNNER_Z.dashes);
    expect(LEO_RUNNER_Z.dashes).toBeLessThan(LEO_RUNNER_Z.signs);
    expect(LEO_RUNNER_Z.signs).toBeLessThan(LEO_RUNNER_Z.obstacles);
    expect(LEO_RUNNER_Z.obstacles).toBeLessThan(LEO_RUNNER_Z.leo);
  });

  it("peor caso de orden de inserción: aunque Leo se agregue al stage ANTES que las demás capas, sortableChildren+zIndex lo deja arriba de todas al ordenar", () => {
    // Simula exactamente lo que sortableChildren=true hace en Pixi cada
    // frame: ordenar los hijos del stage por zIndex, sin importar en
    // qué orden se llamó addChild(). Acá forzamos el peor caso posible
    // (leo insertado primero, road al final) y verificamos que el
    // resultado ordenado sigue siendo el correcto.
    const insertionOrder = [
      { name: "leo", zIndex: LEO_RUNNER_Z.leo },
      { name: "obstacles", zIndex: LEO_RUNNER_Z.obstacles },
      { name: "signs", zIndex: LEO_RUNNER_Z.signs },
      { name: "dashes", zIndex: LEO_RUNNER_Z.dashes },
      { name: "road", zIndex: LEO_RUNNER_Z.road },
    ];
    const drawOrder = [...insertionOrder].sort((a, b) => a.zIndex - b.zIndex).map((c) => c.name);
    expect(drawOrder).toEqual(["road", "dashes", "signs", "obstacles", "leo"]);
  });
});
