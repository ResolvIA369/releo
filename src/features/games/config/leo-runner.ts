import type { DomanWord, PhaseNumber } from "@/shared/types/doman";

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
