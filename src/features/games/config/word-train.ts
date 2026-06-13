import type { PhaseNumber } from "@/shared/types/doman";
import type { ArcadeTuningBase } from "./arcade-tuning";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Tuning arcade de Tren de Palabras. Mecanica central intacta (tocar el
// vagon correcto antes de que el tren cruce); alrededor: flujo continuo
// con energia, niveles por tiempo y velocidad creciente. Sin obstaculos
// (no hay avatar que esquive — ver docs/action-games-plan.md).
export interface WordTrainLevel {
  speedMul: number; // multiplica la velocidad del tren
  wagons: number; // vagones por tren (target + distractores)
}

export interface WordTrainTuning extends ArcadeTuningBase {
  crossSeconds: number; // segundos base que tarda un tren en cruzar (Nivel 1)
  levels: WordTrainLevel[];
}

const TRAIN_LEVELS: WordTrainLevel[] = [
  { speedMul: 1.0, wagons: 3 },
  { speedMul: 1.25, wagons: 4 },
  { speedMul: 1.55, wagons: 4 },
];

const TRAIN_BASE = {
  energyStart: 60, energyMax: 100,
  energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 8,
  energyLossPerObstacle: 0, obstacleInvulnSec: 0, // sin obstaculos
  levelDurationSec: 126,
  levels: TRAIN_LEVELS,
  levelCoinBonus: [0, 10, 25],
  musicTracks: ARCADE_MUSIC_TRACKS,
  musicVolumeDb: -22, musicDuckDb: -34,
  crossSeconds: 10,
};

export const WORD_TRAIN_TUNING: Record<PhaseNumber, WordTrainTuning> = {
  1: { ...TRAIN_BASE, energyDrainPerSec: 1.0 },
  2: { ...TRAIN_BASE, energyDrainPerSec: 1.2 },
  3: { ...TRAIN_BASE, energyDrainPerSec: 1.4 },
  4: { ...TRAIN_BASE, energyDrainPerSec: 1.6 },
  5: { ...TRAIN_BASE, energyDrainPerSec: 1.8 },
};

export function wordTrainTuningForPhase(phase: PhaseNumber): WordTrainTuning {
  return WORD_TRAIN_TUNING[phase] ?? WORD_TRAIN_TUNING[1];
}
