import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MissionNarrative } from "../components/MissionNarrative";

vi.mock("@/shared/services/sofiaVoice", () => ({
  sofiaPlayAudio: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("MissionNarrative", () => {
  it("muestra las líneas y el ícono", () => {
    render(
      <MissionNarrative
        variant="intro"
        icon="📖"
        lines={["¡Se escaparon las palabras!"]}
        onDone={() => {}}
      />
    );
    expect(screen.getByText("¡Se escaparon las palabras!")).toBeTruthy();
    expect(screen.getByText("📖")).toBeTruthy();
  });

  it("el niño puede continuar tocando el botón, sin esperar nada", () => {
    const onDone = vi.fn();
    render(<MissionNarrative variant="intro" icon="📖" lines={["Hola"]} onDone={onDone} />);
    fireEvent.click(screen.getByText("Continuar"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("avanza sola si el niño no toca nada, pasado el tiempo máximo", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <MissionNarrative
        variant="outro"
        icon="📖"
        lines={["Bien"]}
        autoDismissMs={3000}
        onDone={onDone}
      />
    );
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3001);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("nunca llama a onDone dos veces (tap + timeout no duplican)", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <MissionNarrative variant="intro" icon="📖" lines={["Hola"]} autoDismissMs={1000} onDone={onDone} />
    );
    fireEvent.click(screen.getByText("Continuar"));
    vi.advanceTimersByTime(1001);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
