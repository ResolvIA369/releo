import type { DomanWord, PhaseNumber } from "@/shared/types/doman";

// El "feel" de vuelo por mundo/fase, ajustable sin tocar el juego
// (mismo patron que LEO_ROCKS_BY_PHASE). Unidades en px/frame a 60fps,
// como BASE_SPEED de los otros juegos. Mundo 1 va lento y con nubes
// bien separadas para que de tiempo de LEER antes de elegir.
export interface LeoVuelaPhysics {
  gravity: number; // aceleracion de caida (px/frame^2)
  impulse: number; // velocidad vertical que aplica cada aletazo (px/frame)
  cloudSpeed: number; // velocidad horizontal de las nubes (px/frame)
  cloudGap: number; // separacion horizontal entre nubes (px)
}

export const LEO_VUELA_PHYSICS: Record<PhaseNumber, LeoVuelaPhysics> = {
  1: { gravity: 0.13, impulse: 3.2, cloudSpeed: 1.2, cloudGap: 330 },
  2: { gravity: 0.14, impulse: 3.2, cloudSpeed: 1.5, cloudGap: 300 },
  3: { gravity: 0.15, impulse: 3.3, cloudSpeed: 1.7, cloudGap: 280 },
  4: { gravity: 0.16, impulse: 3.4, cloudSpeed: 1.9, cloudGap: 260 },
  5: { gravity: 0.17, impulse: 3.5, cloudSpeed: 2.1, cloudGap: 240 },
};

export function physicsForPhase(phase: PhaseNumber): LeoVuelaPhysics {
  return LEO_VUELA_PHYSICS[phase] ?? LEO_VUELA_PHYSICS[1];
}

// ─── Energia: el ritmo del juego ─────────────────────────────────
// Sube por acierto, baja por error/escape y drena sola de a poco.
// Si llega a 0 el juego termina. Ajustable por fase sin tocar el juego.
export interface LeoVuelaTuning {
  energyStart: number;
  energyMax: number;
  energyGainCorrect: number;
  energyLossWrong: number;
  energyLossEscape: number;
  energyDrainPerSec: number; // drenaje pasivo
}

export const LEO_VUELA_TUNING: Record<PhaseNumber, LeoVuelaTuning> = {
  1: { energyStart: 60, energyMax: 100, energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 8, energyDrainPerSec: 1.0 },
  2: { energyStart: 60, energyMax: 100, energyGainCorrect: 13, energyLossWrong: 10, energyLossEscape: 8, energyDrainPerSec: 1.2 },
  3: { energyStart: 60, energyMax: 100, energyGainCorrect: 12, energyLossWrong: 11, energyLossEscape: 9, energyDrainPerSec: 1.4 },
  4: { energyStart: 60, energyMax: 100, energyGainCorrect: 12, energyLossWrong: 11, energyLossEscape: 9, energyDrainPerSec: 1.6 },
  5: { energyStart: 60, energyMax: 100, energyGainCorrect: 11, energyLossWrong: 12, energyLossEscape: 10, energyDrainPerSec: 1.8 },
};

export function tuningForPhase(phase: PhaseNumber): LeoVuelaTuning {
  return LEO_VUELA_TUNING[phase] ?? LEO_VUELA_TUNING[1];
}

export function clampEnergy(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

// Caida maxima: sin clamp un descuido se vuelve un picado imposible
// de frenar para un nene chico.
export const MAX_FALL_SPEED = 4.5;

// Un paso de fisica del vuelo (puro, para poder testearlo): aplica
// gravedad, integra y clampea entre el techo y el piso.
export function stepFlight(
  y: number,
  vy: number,
  dt: number,
  cfg: Pick<LeoVuelaPhysics, "gravity">,
  bounds: { top: number; ground: number },
): { y: number; vy: number } {
  let nextVy = Math.min(vy + cfg.gravity * dt, MAX_FALL_SPEED);
  let nextY = y + nextVy * dt;
  if (nextY <= bounds.top) {
    nextY = bounds.top;
    nextVy = 0;
  }
  if (nextY >= bounds.ground) {
    nextY = bounds.ground;
    nextVy = 0;
  }
  return { y: nextY, vy: nextVy };
}

export interface CloudSpec {
  word: DomanWord;
  band: number; // altura (y) asignada a la nube
}

function defaultShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Arma la ronda: target + 2 distractores, cada nube en una banda de
// altura distinta para que volar hasta una implique una decision.
export function buildCloudRound(
  target: DomanWord,
  distractorPool: DomanWord[],
  bands: number[],
  shuffleFn: <T>(arr: T[]) => T[] = defaultShuffle,
): CloudSpec[] {
  const distractors = shuffleFn(distractorPool.filter((w) => w.id !== target.id))
    .slice(0, Math.max(0, bands.length - 1));
  const roundWords = shuffleFn([target, ...distractors]);
  const shuffledBands = shuffleFn(bands);
  return roundWords.map((word, i) => ({ word, band: shuffledBands[i] }));
}
