import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import type { ArcadeTuningBase } from "./arcade-tuning";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Piedras por mundo/fase. Mundo 1 deja una sola piedra (2 carteles para
// elegir); en mundos superiores no hay piedras y el nene tiene que leer
// los 3 carteles. Ajustable por fase sin tocar el juego.
export const LEO_ROCKS_BY_PHASE: Record<PhaseNumber, number> = {
  1: 1,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

const LANE_COUNT = 3;

// Siempre tiene que quedar al menos el cartel del target + 1 alternativa,
// si no el carril correcto vuelve a ser obvio.
export function rocksForPhase(phase: PhaseNumber): number {
  const rocks = LEO_ROCKS_BY_PHASE[phase] ?? 0;
  return Math.min(Math.max(rocks, 0), LANE_COUNT - 2);
}

export interface LeoLane {
  word: DomanWord | null; // null = carril bloqueado por piedra
}

function defaultShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Arma los 3 carriles de una ronda: el target, los distractores que
// entren segun la cantidad de piedras, y las piedras como carriles vacios.
export function buildLanes(
  target: DomanWord,
  distractorPool: DomanWord[],
  rocks: number,
  shuffleFn: <T>(arr: T[]) => T[] = defaultShuffle,
): LeoLane[] {
  const rockCount = Math.min(Math.max(rocks, 0), LANE_COUNT - 2);
  const distractors = shuffleFn(distractorPool.filter((w) => w.id !== target.id))
    .slice(0, LANE_COUNT - 1 - rockCount);
  const lanes: LeoLane[] = [
    { word: target },
    ...distractors.map((word) => ({ word })),
    ...Array.from({ length: LANE_COUNT - 1 - distractors.length }, () => ({ word: null })),
  ];
  return shuffleFn(lanes);
}

// ─── Tuning arcade de Leo Corre (energia/niveles/premios/musica) ───
// La mecanica central (elegir carril, piedras por mundo) no cambia;
// esto define la estructura alrededor: flujo continuo con energia,
// niveles por tiempo y obstaculos de camino.
export interface LeoRunnerLevel {
  speedMul: number; // multiplica la velocidad del camino y los carteles
  // Obstaculos del camino (por minuto): bajan por un carril y restan
  // energia al tocarlos (con invulnerabilidad). La lluvia es visual.
  logsPerMin: number;
  birdsPerMin: number;
  rainPerMin: number;
}

export interface LeoRunnerTuning extends ArcadeTuningBase {
  levels: LeoRunnerLevel[];
}

const RUNNER_LEVELS: LeoRunnerLevel[] = [
  // Nivel 1: foco en leer, sin obstaculos extra (solo las piedras)
  { speedMul: 1.0, logsPerMin: 0, birdsPerMin: 0, rainPerMin: 0 },
  { speedMul: 1.25, logsPerMin: 4, birdsPerMin: 2, rainPerMin: 0.6 },
  { speedMul: 1.55, logsPerMin: 8, birdsPerMin: 4, rainPerMin: 1.2 },
];

const RUNNER_BASE = {
  energyStart: 60, energyMax: 100,
  energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 8,
  energyLossPerObstacle: 6, obstacleInvulnSec: 1.5,
  levelDurationSec: 126,
  levels: RUNNER_LEVELS,
  levelCoinBonus: [0, 10, 25],
  musicTracks: ARCADE_MUSIC_TRACKS,
  musicVolumeDb: -22, musicDuckDb: -34,
};

export const LEO_RUNNER_TUNING: Record<PhaseNumber, LeoRunnerTuning> = {
  1: { ...RUNNER_BASE, energyDrainPerSec: 1.0 },
  2: { ...RUNNER_BASE, energyDrainPerSec: 1.2 },
  3: { ...RUNNER_BASE, energyDrainPerSec: 1.4 },
  4: { ...RUNNER_BASE, energyDrainPerSec: 1.6 },
  5: { ...RUNNER_BASE, energyDrainPerSec: 1.8 },
};

export function runnerTuningForPhase(phase: PhaseNumber): LeoRunnerTuning {
  return LEO_RUNNER_TUNING[phase] ?? LEO_RUNNER_TUNING[1];
}
