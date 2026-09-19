import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setDemoSpeedMul,
  getDemoSpeedMul,
  demoChooseSelectorWithHesitation,
} from "../hooks/useDemoAutoplay";

describe("useDemoAutoplay — velocidad configurable", () => {
  afterEach(() => setDemoSpeedMul(1));

  it("setDemoSpeedMul acepta valores positivos y rechaza el resto", () => {
    setDemoSpeedMul(2);
    expect(getDemoSpeedMul()).toBe(2);
    setDemoSpeedMul(0);
    expect(getDemoSpeedMul()).toBe(1); // 0 es inválido, vuelve al default
    setDemoSpeedMul(-1);
    expect(getDemoSpeedMul()).toBe(1);
    setDemoSpeedMul(0.5);
    expect(getDemoSpeedMul()).toBe(0.5);
  });
});

describe("demoChooseSelectorWithHesitation — nunca clickea la opción incorrecta", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-word-id="correct"></button>
      <button data-word-id="wrong-1"></button>
      <button data-word-id="wrong-2"></button>
    `;
    vi.useFakeTimers();
    // Fuerza la rama "con duda" (Math.random() < 0.3 se salta la duda).
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setDemoSpeedMul(1);
  });

  it("resalta una incorrecta con .demo-hesitate y nunca la clickea", async () => {
    const correctBtn = document.querySelector('[data-word-id="correct"]') as HTMLButtonElement;
    const wrong1 = document.querySelector('[data-word-id="wrong-1"]') as HTMLButtonElement;
    const wrong2 = document.querySelector('[data-word-id="wrong-2"]') as HTMLButtonElement;
    const correctClick = vi.fn();
    const wrong1Click = vi.fn();
    const wrong2Click = vi.fn();
    correctBtn.addEventListener("click", correctClick);
    wrong1.addEventListener("click", wrong1Click);
    wrong2.addEventListener("click", wrong2Click);

    demoChooseSelectorWithHesitation('[data-word-id="correct"]', [
      '[data-word-id="wrong-1"]',
      '[data-word-id="wrong-2"]',
    ]);

    // Alguna de las dos incorrectas queda resaltada de inmediato.
    await vi.advanceTimersByTimeAsync(0);
    const hesitating = wrong1.classList.contains("demo-hesitate") || wrong2.classList.contains("demo-hesitate");
    expect(hesitating).toBe(true);
    expect(correctClick).not.toHaveBeenCalled();

    // Pasa todo el tiempo posible (duda + pausa + jitter con speedMul alto).
    setDemoSpeedMul(1); // ya está en 1, pero lo dejamos explícito
    await vi.advanceTimersByTimeAsync(5000);

    expect(correctClick).toHaveBeenCalledTimes(1);
    expect(wrong1Click).not.toHaveBeenCalled();
    expect(wrong2Click).not.toHaveBeenCalled();
    expect(wrong1.classList.contains("demo-hesitate")).toBe(false);
    expect(wrong2.classList.contains("demo-hesitate")).toBe(false);
  });

  it("si no hay opciones incorrectas visibles, va directo a la correcta", async () => {
    const correctBtn = document.querySelector('[data-word-id="correct"]') as HTMLButtonElement;
    const correctClick = vi.fn();
    correctBtn.addEventListener("click", correctClick);

    demoChooseSelectorWithHesitation('[data-word-id="correct"]', []);
    await vi.advanceTimersByTimeAsync(1000);

    expect(correctClick).toHaveBeenCalledTimes(1);
  });

  it("si el selector correcto no existe en el DOM, no hace nada (no explota)", () => {
    expect(() =>
      demoChooseSelectorWithHesitation('[data-word-id="no-existe"]', ['[data-word-id="wrong-1"]'])
    ).not.toThrow();
  });
});
