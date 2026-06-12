import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useGameKeys } from "../hooks/useGameKeys";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function pressKey(key: string, opts: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key, cancelable: true, ...opts });
  window.dispatchEvent(event);
  return event;
}

describe("useGameKeys", () => {
  it("ejecuta la accion de la tecla mapeada", () => {
    const jump = vi.fn();
    renderHook(() => useGameKeys(true, { " ": jump, ArrowUp: jump }));
    pressKey(" ");
    pressKey("ArrowUp");
    expect(jump).toHaveBeenCalledTimes(2);
  });

  it("hace preventDefault en las teclas mapeadas para no scrollear", () => {
    renderHook(() => useGameKeys(true, { ArrowDown: () => {} }));
    const event = pressKey("ArrowDown");
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignora teclas no mapeadas", () => {
    const move = vi.fn();
    renderHook(() => useGameKeys(true, { ArrowUp: move }));
    const event = pressKey("Enter");
    expect(move).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("no dispara nada cuando esta deshabilitado", () => {
    const move = vi.fn();
    renderHook(() => useGameKeys(false, { ArrowUp: move }));
    pressKey("ArrowUp");
    expect(move).not.toHaveBeenCalled();
  });

  it("ignora el auto-repeat al mantener la tecla", () => {
    const jump = vi.fn();
    renderHook(() => useGameKeys(true, { " ": jump }));
    pressKey(" ");
    pressKey(" ", { repeat: true });
    expect(jump).toHaveBeenCalledTimes(1);
  });

  it("limpia el listener al desmontar", () => {
    const move = vi.fn();
    const { unmount } = renderHook(() => useGameKeys(true, { ArrowUp: move }));
    unmount();
    pressKey("ArrowUp");
    expect(move).not.toHaveBeenCalled();
  });

  it("usa los bindings mas recientes sin re-suscribirse", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ fn }: { fn: () => void }) => useGameKeys(true, { ArrowUp: fn }),
      { initialProps: { fn: first } },
    );
    rerender({ fn: second });
    pressKey("ArrowUp");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
