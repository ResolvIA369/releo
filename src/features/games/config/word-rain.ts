import type { PhaseNumber } from "@/shared/types/doman";
import type { ArcadeTuningBase } from "./arcade-tuning";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Tuning arcade de Lluvia de Palabras. Mecanica central intacta
// (atrapar la palabra que cae antes de que llegue al suelo); alrededor:
// flujo continuo con energia y niveles por tiempo que aceleran la
// caida. Sin obstaculos (no hay avatar que esquive).
export interface WordRainLevel {
  fallSeconds: number; // segundos que tarda una palabra en caer
}

export interface WordRainTuning extends ArcadeTuningBase {
  levels: WordRainLevel[];
}

const RAIN_LEVELS: WordRainLevel[] = [
  { fallSeconds: 8 },
  { fallSeconds: 6.5 },
  { fallSeconds: 5 },
];

const RAIN_BASE = {
  energyStart: 60, energyMax: 100,
  energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 8,
  energyLossPerObstacle: 0, obstacleInvulnSec: 0,
  levelDurationSec: 126,
  levels: RAIN_LEVELS,
  levelCoinBonus: [0, 10, 25],
  musicTracks: ARCADE_MUSIC_TRACKS,
  musicVolumeDb: -22, musicDuckDb: -34,
};

export const WORD_RAIN_TUNING: Record<PhaseNumber, WordRainTuning> = {
  1: { ...RAIN_BASE, energyDrainPerSec: 1.0 },
  2: { ...RAIN_BASE, energyDrainPerSec: 1.2 },
  3: { ...RAIN_BASE, energyDrainPerSec: 1.4 },
  4: { ...RAIN_BASE, energyDrainPerSec: 1.6 },
  5: { ...RAIN_BASE, energyDrainPerSec: 1.8 },
};

export function wordRainTuningForPhase(phase: PhaseNumber): WordRainTuning {
  return WORD_RAIN_TUNING[phase] ?? WORD_RAIN_TUNING[1];
}
