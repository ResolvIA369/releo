import { describe, it, expect } from "vitest";
import { WORLD_BACKGROUNDS, getWorldBackgroundUrl } from "../config/world-backgrounds";

describe("getWorldBackgroundUrl", () => {
  it("world_1 (Isla de las Palabras) tiene asset asignado", () => {
    expect(getWorldBackgroundUrl("world_1")).toBe(WORLD_BACKGROUNDS.world_1);
    expect(getWorldBackgroundUrl("world_1")).toMatch(/\.png$/);
  });

  it("world_2 (Bahía de los Pares) tiene asset asignado", () => {
    expect(getWorldBackgroundUrl("world_2")).toBe(WORLD_BACKGROUNDS.world_2);
    expect(getWorldBackgroundUrl("world_2")).toBe("/images/games/backgrounds/bahia-de-los-pares.png");
  });

  it("world_3 (Valle de las Frases) tiene asset asignado", () => {
    expect(getWorldBackgroundUrl("world_3")).toBe(WORLD_BACKGROUNDS.world_3);
    expect(getWorldBackgroundUrl("world_3")).toBe("/images/games/backgrounds/valle-de-las-frases.png");
  });

  it("mundos sin asset todavía devuelven null (fallback = cielo procedural)", () => {
    expect(getWorldBackgroundUrl("world_4")).toBeNull();
  });

  it("sin worldId devuelve null en vez de romper", () => {
    expect(getWorldBackgroundUrl(undefined)).toBeNull();
  });
});
