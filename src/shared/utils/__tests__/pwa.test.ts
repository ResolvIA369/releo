import { describe, it, expect, vi, afterEach } from "vitest";
import { isStandaloneDisplay } from "../pwa";

function mockMatchMedia(standaloneMatches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(display-mode: standalone)" && standaloneMatches,
    media: query,
  })) as unknown as typeof window.matchMedia;
}

const nav = window.navigator as Navigator & { standalone?: boolean };

afterEach(() => {
  vi.restoreAllMocks();
  delete nav.standalone;
});

describe("isStandaloneDisplay", () => {
  it("true cuando display-mode es standalone (app instalada)", () => {
    mockMatchMedia(true);
    expect(isStandaloneDisplay()).toBe(true);
  });

  it("false cuando corre en el navegador normal", () => {
    mockMatchMedia(false);
    expect(isStandaloneDisplay()).toBe(false);
  });

  it("true con navigator.standalone de iOS aunque matchMedia diga que no", () => {
    mockMatchMedia(false);
    nav.standalone = true;
    expect(isStandaloneDisplay()).toBe(true);
  });

  it("false cuando navigator.standalone es false en iOS Safari", () => {
    mockMatchMedia(false);
    nav.standalone = false;
    expect(isStandaloneDisplay()).toBe(false);
  });

  it("no explota si matchMedia no existe (navegadores viejos)", () => {
    const original = window.matchMedia;
    // @ts-expect-error — simula un navegador sin matchMedia
    delete window.matchMedia;
    expect(isStandaloneDisplay()).toBe(false);
    window.matchMedia = original;
  });
});
