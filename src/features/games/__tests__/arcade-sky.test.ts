import { describe, it, expect } from "vitest";
import { moodForLevel } from "../components/arcade-sky";

describe("moodForLevel", () => {
  it("mapea los 3 niveles reales a día → atardecer → noche", () => {
    expect(moodForLevel(0)).toBe("dia");
    expect(moodForLevel(1)).toBe("atardecer");
    expect(moodForLevel(2)).toBe("noche");
  });

  it("cualquier nivel por encima del máximo se queda de noche", () => {
    expect(moodForLevel(5)).toBe("noche");
  });

  it("un nivel negativo (no debería pasar) cae a día en vez de romper", () => {
    expect(moodForLevel(-1)).toBe("dia");
  });
});
