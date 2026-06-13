import type { PhaseNumber } from "@/shared/types/doman";
import type { ArcadeTuningBase } from "./arcade-tuning";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Tuning arcade de Pesca de Palabras. Mecanica central intacta (tocar
// el pez correcto); alrededor: flujo continuo con energia y niveles
// por tiempo que aceleran a los peces. Los peces nadan en loop (no se
// "escapan"): la energia que drena marca el ritmo. Sin obstaculos.
export interface WordFishingLevel {
  speedMul: number; // multiplica la velocidad de los peces
}

export interface WordFishingTuning extends ArcadeTuningBase {
  levels: WordFishingLevel[];
}

const FISHING_LEVELS: WordFishingLevel[] = [
  { speedMul: 1.0 },
  { speedMul: 1.3 },
  { speedMul: 1.65 },
];

const FISHING_BASE = {
  energyStart: 60, energyMax: 100,
  energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 0, // no hay escape
  energyLossPerObstacle: 0, obstacleInvulnSec: 0,
  levelDurationSec: 126,
  levels: FISHING_LEVELS,
  levelCoinBonus: [0, 10, 25],
  musicTracks: ARCADE_MUSIC_TRACKS,
  musicVolumeDb: -22, musicDuckDb: -34,
};

export const WORD_FISHING_TUNING: Record<PhaseNumber, WordFishingTuning> = {
  1: { ...FISHING_BASE, energyDrainPerSec: 1.0 },
  2: { ...FISHING_BASE, energyDrainPerSec: 1.2 },
  3: { ...FISHING_BASE, energyDrainPerSec: 1.4 },
  4: { ...FISHING_BASE, energyDrainPerSec: 1.6 },
  5: { ...FISHING_BASE, energyDrainPerSec: 1.8 },
};

export function wordFishingTuningForPhase(phase: PhaseNumber): WordFishingTuning {
  return WORD_FISHING_TUNING[phase] ?? WORD_FISHING_TUNING[1];
}
