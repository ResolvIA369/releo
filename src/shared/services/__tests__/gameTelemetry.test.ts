import { describe, it, expect, vi, afterEach } from "vitest";
import { recordGameEvent, setGameTelemetrySink } from "../gameTelemetry";

afterEach(() => {
  setGameTelemetrySink(null);
  vi.restoreAllMocks();
});

describe("gameTelemetry", () => {
  it("sin sink conectado no rompe nada", () => {
    expect(() =>
      recordGameEvent({ type: "game_started", gameId: "leo-vuela", phase: 1 })
    ).not.toThrow();
  });

  it("reenvía el evento al sink conectado", () => {
    const received: unknown[] = [];
    setGameTelemetrySink((e) => received.push(e));

    recordGameEvent({
      type: "game_finished",
      gameId: "leo-vuela",
      phase: 1,
      durationMs: 12000,
      correct: 8,
      total: 10,
      levelReached: 1,
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ type: "game_finished", correct: 8, total: 10 });
  });

  it("un sink que tira excepción no interrumpe al llamador", () => {
    setGameTelemetrySink(() => {
      throw new Error("sink roto");
    });
    expect(() =>
      recordGameEvent({ type: "game_abandoned", gameId: "leo-vuela", phase: 1, elapsedMs: 500 })
    ).not.toThrow();
  });

  it("desconectar el sink con null vuelve al comportamiento por defecto", () => {
    const received: unknown[] = [];
    setGameTelemetrySink((e) => received.push(e));
    setGameTelemetrySink(null);

    recordGameEvent({ type: "game_started", gameId: "leo-vuela", phase: 1 });
    expect(received).toHaveLength(0);
  });
});
