import { describe, it, expect } from "vitest";
import { getConsequenceEmoji } from "../config/word-consequence";

describe("getConsequenceEmoji", () => {
  it("reusa el emoji ya mapeado para una palabra conocida", () => {
    expect(getConsequenceEmoji("perro")).toBe("🐶");
    expect(getConsequenceEmoji("estrella")).toBe("⭐");
  });

  it("cae a una estrella genérica para una palabra sin emoji propio", () => {
    expect(getConsequenceEmoji("palabra-inventada-inexistente")).toBe("⭐");
  });

  it("nunca devuelve el signo de pregunta de EMOJI_MAP (se leería como un error)", () => {
    expect(getConsequenceEmoji("otra-palabra-que-no-existe")).not.toBe("❓");
  });

  it("descarta entradas que en realidad son texto/fecha, no un ícono (hoy/mañana/ayer)", () => {
    for (const word of ["hoy", "mañana", "ayer"]) {
      const result = getConsequenceEmoji(word);
      expect(result).toBe("⭐");
    }
  });

  it("acepta combinaciones de emoji puro de más de un glifo", () => {
    // "cocina" mapea a 🔥🍳 en emoji-map.ts — sin letras/números, es válido
    expect(getConsequenceEmoji("cocina")).toBe("🔥🍳");
  });
});
