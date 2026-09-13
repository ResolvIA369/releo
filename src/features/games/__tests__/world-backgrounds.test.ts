import { describe, it, expect } from "vitest";
import { WORLD_BACKGROUNDS, getWorldBackgroundUrl } from "../config/world-backgrounds";

describe("getWorldBackgroundUrl", () => {
  it("world_1 (Isla de las Palabras) tiene asset asignado", () => {
    expect(getWorldBackgroundUrl("world_1")).toBe(WORLD_BACKGROUNDS.world_1);
    expect(getWorldBackgroundUrl("world_1")).toMatch(/\.png$/);
  });

  it("mundos sin asset todavía devuelven null (fallback = cielo procedural)", () => {
    expect(getWorldBackgroundUrl("world_2")).toBeNull();
    expect(getWorldBackgroundUrl("world_3")).toBeNull();
    expect(getWorldBackgroundUrl("world_4")).toBeNull();
  });

  it("sin worldId devuelve null en vez de romper", () => {
    expect(getWorldBackgroundUrl(undefined)).toBeNull();
  });
});
