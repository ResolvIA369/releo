import type { PhaseNumber } from "@/shared/types/doman";
import type { ArcadeTuningBase } from "./arcade-tuning";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Tuning arcade de Burbujas Magicas. Mecanica central intacta (reventar
// la burbuja correcta); alrededor: flujo continuo con energia y niveles
// por tiempo que aceleran la deriva y agregan burbujas. Las burbujas
// flotan en loop (no se "escapan"): la energia marca el ritmo. Sin
// obstaculos.
export interface BubblesLevel {
  speedMul: number; // multiplica la deriva de las burbujas
  count: number; // burbujas en pantalla (target + distractores)
}

export interface BubblesTuning extends ArcadeTuningBase {
  levels: BubblesLevel[];
}

const BUBBLES_LEVELS: BubblesLevel[] = [
  { speedMul: 1.0, count: 5 },
  { speedMul: 1.4, count: 6 },
  { speedMul: 1.8, count: 7 },
];

const BUBBLES_BASE = {
  energyStart: 60, energyMax: 100,
  energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 0, // no hay escape
  energyLossPerObstacle: 0, obstacleInvulnSec: 0,
  levelDurationSec: 126,
  levels: BUBBLES_LEVELS,
  levelCoinBonus: [0, 10, 25],
  musicTracks: ARCADE_MUSIC_TRACKS,
  musicVolumeDb: -22, musicDuckDb: -34,
};

export const BUBBLES_TUNING: Record<PhaseNumber, BubblesTuning> = {
  1: { ...BUBBLES_BASE, energyDrainPerSec: 1.0 },
  2: { ...BUBBLES_BASE, energyDrainPerSec: 1.2 },
  3: { ...BUBBLES_BASE, energyDrainPerSec: 1.4 },
  4: { ...BUBBLES_BASE, energyDrainPerSec: 1.6 },
  5: { ...BUBBLES_BASE, energyDrainPerSec: 1.8 },
};

export function bubblesTuningForPhase(phase: PhaseNumber): BubblesTuning {
  return BUBBLES_TUNING[phase] ?? BUBBLES_TUNING[1];
}
