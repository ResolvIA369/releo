import { describe, it, expect, vi, afterEach } from "vitest";
import { isStandaloneDisplay, lockLandscape } from "../pwa";

function mockMatchMedia(standaloneMatches: boolean, fullscreenMatches = false) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      (query === "(display-mode: standalone)" && standaloneMatches) ||
      (query === "(display-mode: fullscreen)" && fullscreenMatches),
    media: query,
  })) as unknown as typeof window.matchMedia;
}

function setFullscreenElement(el: Element | null) {
  Object.defineProperty(document, "fullscreenElement", { value: el, configurable: true });
}

const nav = window.navigator as Navigator & { standalone?: boolean };

afterEach(() => {
  vi.restoreAllMocks();
  delete nav.standalone;
  setFullscreenElement(null);
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

describe("isStandaloneDisplay con display: fullscreen del manifest", () => {
  it("true cuando la PWA instalada corre en fullscreen", () => {
    mockMatchMedia(false, true);
    expect(isStandaloneDisplay()).toBe(true);
  });

  it("false si el fullscreen lo puso requestFullscreen en una pestaña comun", () => {
    mockMatchMedia(false, true);
    setFullscreenElement(document.documentElement);
    expect(isStandaloneDisplay()).toBe(false);
  });
});

describe("lockLandscape", () => {
  function mockOrientation() {
    const lock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(screen, "orientation", { value: { lock, unlock: vi.fn() }, configurable: true });
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = requestFullscreen;
    return { lock, requestFullscreen };
  }

  it("instalada: acuesta sin pedir pantalla completa", async () => {
    mockMatchMedia(false, true);
    const { lock, requestFullscreen } = mockOrientation();
    expect(await lockLandscape({ userGesture: false })).toBe(true);
    expect(lock).toHaveBeenCalledWith("landscape");
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("navegador sin toque del usuario: no hace nada", async () => {
    mockMatchMedia(false);
    const { lock, requestFullscreen } = mockOrientation();
    expect(await lockLandscape({ userGesture: false })).toBe(false);
    expect(lock).not.toHaveBeenCalled();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("navegador con toque: pide pantalla completa y despues acuesta", async () => {
    mockMatchMedia(false);
    const { lock, requestFullscreen } = mockOrientation();
    expect(await lockLandscape({ userGesture: true })).toBe(true);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(lock).toHaveBeenCalledWith("landscape");
  });
});
