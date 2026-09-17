import { describe, it, expect, vi, afterEach } from "vitest";
import { detectQualityTier } from "../hooks/useQualityTier";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("detectQualityTier", () => {
  it("prefers-reduced-motion baja la calidad a low", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    expect(detectQualityTier()).toBe("low");
  });

  it("pocos núcleos de CPU también bajan la calidad", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, media: "", addEventListener: () => {}, removeEventListener: () => {} }));
    vi.stubGlobal("navigator", { hardwareConcurrency: 2 });
    expect(detectQualityTier()).toBe("low");
  });

  it("hardware normal y sin preferencia de movimiento reducido → high", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, media: "", addEventListener: () => {}, removeEventListener: () => {} }));
    vi.stubGlobal("navigator", { hardwareConcurrency: 8 });
    expect(detectQualityTier()).toBe("high");
  });
});
