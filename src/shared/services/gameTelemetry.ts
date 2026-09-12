import type { GameId } from "@/features/games/types";
import type { PhaseNumber } from "@/shared/types/doman";

// Interfaz de instrumentación de juegos — deliberadamente SIN servicio
// externo. Por defecto no hace nada (salvo un log en desarrollo); un
// sink real (IndexedDB local, un endpoint propio, lo que se decida) se
// conecta después con setGameTelemetrySink sin tocar los juegos que ya
// emiten eventos. Ver docs/RELEO-JUEGOS-V2.md §12.
//
// A propósito NO incluye nada identificable del dispositivo o del
// niño: solo forma de la partida (duración, aciertos, nivel).

export type GameTelemetryEvent =
  | { type: "game_started"; gameId: GameId; phase: PhaseNumber; worldId?: string }
  | { type: "round_result"; gameId: GameId; phase: PhaseNumber; wordId: string; correct: boolean }
  | {
      type: "game_finished";
      gameId: GameId;
      phase: PhaseNumber;
      durationMs: number;
      correct: number;
      total: number;
      levelReached?: number;
    }
  | { type: "game_abandoned"; gameId: GameId; phase: PhaseNumber; elapsedMs: number };

type TelemetrySink = (event: GameTelemetryEvent) => void;

let sink: TelemetrySink | null = null;

/** Conectar (o desconectar con `null`) el destino real de los eventos. */
export function setGameTelemetrySink(fn: TelemetrySink | null): void {
  sink = fn;
}

export function recordGameEvent(event: GameTelemetryEvent): void {
  try {
    sink?.(event);
  } catch {
    // Un sink roto nunca debe interrumpir el juego.
  }
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[gameTelemetry]", event);
  }
}
