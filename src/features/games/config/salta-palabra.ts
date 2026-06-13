import type { PhaseNumber } from "@/shared/types/doman";
import type { ArcadeTuningBase } from "./arcade-tuning";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Tuning arcade de Salta la Palabra. La mecanica central (saltar para
// atrapar la palabra correcta) no cambia; esto define la estructura
// alrededor: flujo continuo con energia, niveles por tiempo y
// obstaculos que cruzan por el piso (hay que saltarlos).
export interface SaltaLevel {
  speedMul: number; // multiplica la velocidad de las palabras
  gapMul: number; // multiplica la separacion entre palabras
  // Obstaculos del piso (por minuto): tocarlos resta energia con
  // invulnerabilidad. La lluvia es decorativa.
  logsPerMin: number;
  porcupinesPerMin: number; // caminan por el piso, hay que saltarlos
  birdsPerMin: number; // bajan en picada hasta la altura de Leo
  rainPerMin: number;
}

export interface SaltaTuning extends ArcadeTuningBase {
  levels: SaltaLevel[];
}

const SALTA_LEVELS: SaltaLevel[] = [
  // Nivel 1: foco en leer, piso limpio
  { speedMul: 1.0, gapMul: 1.0, logsPerMin: 0, porcupinesPerMin: 0, birdsPerMin: 0, rainPerMin: 0 },
  { speedMul: 1.25, gapMul: 0.9, logsPerMin: 3, porcupinesPerMin: 2, birdsPerMin: 2, rainPerMin: 0.6 },
  { speedMul: 1.55, gapMul: 0.8, logsPerMin: 6, porcupinesPerMin: 4, birdsPerMin: 4, rainPerMin: 1.2 },
];

const SALTA_BASE = {
  energyStart: 60, energyMax: 100,
  energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 8,
  energyLossPerObstacle: 6, obstacleInvulnSec: 1.5,
  wordsPerLevel: 10,
  levels: SALTA_LEVELS,
  levelCoinBonus: [0, 10, 25],
  musicTracks: ARCADE_MUSIC_TRACKS,
  musicVolumeDb: -22, musicDuckDb: -34,
};

export const SALTA_TUNING: Record<PhaseNumber, SaltaTuning> = {
  1: { ...SALTA_BASE, energyDrainPerSec: 1.0 },
  2: { ...SALTA_BASE, energyDrainPerSec: 1.2 },
  3: { ...SALTA_BASE, energyDrainPerSec: 1.4 },
  4: { ...SALTA_BASE, energyDrainPerSec: 1.6 },
  5: { ...SALTA_BASE, energyDrainPerSec: 1.8 },
};

export function saltaTuningForPhase(phase: PhaseNumber): SaltaTuning {
  return SALTA_TUNING[phase] ?? SALTA_TUNING[1];
}
