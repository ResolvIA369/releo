import type { DomanWord } from "@/shared/types/doman";

// Sistemas compartidos de los juegos arcade (Leo Vuela / Leo Corre /
// Salta la Palabra): energia, niveles por tiempo, premios por nivel y
// musica. Cada juego define su tuning concreto en su propio config;
// aca viven los tipos base y los helpers puros.

// ─── Energia: acierto sube, error baja, drenaje pasivo, 0 = fin ────
export interface ArcadeEnergyTuning {
  energyStart: number;
  energyMax: number;
  energyGainCorrect: number;
  energyLossWrong: number;
  energyLossEscape: number;
  energyDrainPerSec: number; // drenaje pasivo
  // Obstaculos que tocan a Leo: restan energia con una ventana de
  // invulnerabilidad para que un choque no drene la barra de golpe.
  energyLossPerObstacle: number;
  obstacleInvulnSec: number;
}

// ─── Niveles por palabras acertadas + premios + musica ─────────────
export interface ArcadeTuningBase extends ArcadeEnergyTuning {
  wordsPerLevel: number; // aciertos para subir un nivel (topa en 3)
  levelCoinBonus: number[]; // monedas extra por nivel alcanzado
  // Un loop real por nivel; volumen base BIEN bajo para que la voz se
  // escuche clara, y ducking mas profundo mientras Sofia habla.
  musicTracks: string[];
  musicVolumeDb: number;
  musicDuckDb: number;
}

// Los 3 loops de selva (generados con scripts/generate-music-loops.sh)
export const ARCADE_MUSIC_TRACKS = [
  "/audio/music/leo-vuela-nivel-1.mp3",
  "/audio/music/leo-vuela-nivel-2.mp3",
  "/audio/music/leo-vuela-nivel-3.mp3",
];

export function clampEnergy(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

// Indice de nivel (0-based) segun palabras acertadas; clampea al ultimo
export function levelForCorrectCount(correct: number, wordsPerLevel: number, levelCount: number): number {
  if (wordsPerLevel <= 0 || levelCount <= 0) return 0;
  return Math.min(levelCount - 1, Math.max(0, Math.floor(correct / wordsPerLevel)));
}

// Recompensa al terminar segun el nivel alcanzado: monedas extra y
// mapeo a las estrellas existentes (nivel 1 → ⭐, 2 → ⭐⭐, 3 → ⭐⭐⭐)
export function rewardForLevel(
  levelIdx: number,
  tuning: { levels: unknown[]; levelCoinBonus: number[] },
): { bonusCoins: number; stars: number } {
  const idx = Math.min(Math.max(levelIdx, 0), tuning.levels.length - 1);
  return {
    bonusCoins: tuning.levelCoinBonus[idx] ?? 0,
    stars: Math.min(3, idx + 1),
  };
}

// Proximo objetivo al azar: las palabras pueden repetirse durante la
// partida (flujo continuo); solo se evita la misma dos veces seguidas.
export function pickNextTarget(
  pool: DomanWord[],
  lastId: string | null,
  rng: () => number = Math.random,
): DomanWord {
  const candidates = pool.length > 1 && lastId ? pool.filter((w) => w.id !== lastId) : pool;
  return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
}

export interface WordBag {
  next: () => DomanWord;
}

// Bolsa barajada: reparte distribucion pareja — recorre TODAS las
// palabras del bloque una vez antes de repetir ninguna, y recien ahi
// rebaraja. Evita repetir la ultima al cruzar el limite de barajadas.
export function createWordBag(words: DomanWord[], rng: () => number = Math.random): WordBag {
  let bag: DomanWord[] = [];
  let lastId: string | null = null;
  const refill = () => {
    const a = [...words];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.length > 1 && a[0].id === lastId) {
      [a[0], a[1]] = [a[1], a[0]];
    }
    bag = a;
  };
  return {
    next(): DomanWord {
      if (bag.length === 0) refill();
      const w = bag.shift()!;
      lastId = w.id;
      return w;
    },
  };
}
