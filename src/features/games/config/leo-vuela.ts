import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import { ARCADE_MUSIC_TRACKS } from "./arcade-tuning";

// Helpers compartidos del arcade: mismos nombres que siempre exporto
// este modulo, ahora viven en arcade-tuning.ts
export { clampEnergy, levelForCorrectCount, rewardForLevel, pickNextTarget } from "./arcade-tuning";

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
// Cada nivel multiplica la dificultad base de la fase: mas velocidad
// y nubes mas juntas. Se alcanza por tiempo jugado (levelDurationSec
// por nivel); pasado el ultimo umbral se queda en el nivel final.
export interface LeoVuelaLevel {
  speedMul: number; // multiplica la velocidad de las nubes
  gapMul: number; // multiplica la separacion entre nubes (menos = mas juntas)
  // Obstaculos (frecuencia por minuto). Solo molestan el pilotaje:
  // empujan a Leo, NUNCA dan ni quitan puntos/energia.
  birdsPerMin: number; // pajaros que cruzan
  boltsPerMin: number; // relampagos que caen
  rainPerMin: number; // rafagas de lluvia que empujan hacia abajo
  floorCloudsPerMin: number; // nubes grises rasantes que empujan hacia arriba
}

export interface LeoVuelaTuning {
  energyStart: number;
  energyMax: number;
  energyGainCorrect: number;
  energyLossWrong: number;
  energyLossEscape: number;
  energyDrainPerSec: number; // drenaje pasivo
  // Los pajaros, ademas de empujar, restan energia; tras un golpe hay
  // una ventana de invulnerabilidad para que una rafaga no drene todo.
  // Rayos, lluvia y nubes rasantes siguen solo empujando.
  energyLossPerBird: number;
  birdHitInvulnSec: number;
  wordsPerLevel: number; // aciertos para subir un nivel (topa en 3)
  levels: LeoVuelaLevel[];
  levelCoinBonus: number[]; // monedas extra por nivel alcanzado al terminar
  horizontalSpeed: number; // velocidad de Leo adelante/atras (px/frame)
  // Musica: un loop real por nivel (generados desde assets/ con ffmpeg,
  // atempo para variar velocidad sin cambiar el tono). El volumen base
  // debe quedar bajo (no debe competir con la voz), y al hablar Sofia
  // se agacha todavia mas (musicDuckDb).
  //
  // musicVolumeDb=-22 (valor original) dejaba la musica en ~-40/-44dB
  // RMS efectivo (medido decodificando los 3 loops reales: fuente ya
  // mastereada en ~-18/-22dB RMS, menos otros 22dB de atenuacion) —
  // por debajo del piso de audibilidad en parlantes tipicos, que es la
  // causa real de "no suena la musica" reportada en QA manual. Subido
  // a -10dB (~-28/-32dB RMS efectivo): se seguiria escuchando de fondo,
  // sin competir con la voz. Sin tocar musicDuckDb — el agachado durante
  // la narracion de Sofia ya funcionaba como se esperaba.
  musicTracks: string[];
  musicVolumeDb: number;
  musicDuckDb: number;
}

const DEFAULT_LEVELS: LeoVuelaLevel[] = [
  // Nivel 1: foco en leer, casi sin obstaculos
  { speedMul: 1.0, gapMul: 1.0, birdsPerMin: 1, boltsPerMin: 0, rainPerMin: 0, floorCloudsPerMin: 0 },
  { speedMul: 1.3, gapMul: 0.85, birdsPerMin: 5, boltsPerMin: 2, rainPerMin: 0.6, floorCloudsPerMin: 0 },
  // Nivel 3: nubes-objetivo mas rapidas + piso denso de nubes grises
  { speedMul: 1.85, gapMul: 0.7, birdsPerMin: 9, boltsPerMin: 4, rainPerMin: 1.2, floorCloudsPerMin: 18 },
];

// Un loop por nivel, de intensidad creciente (mismo tema fuente)
const DEFAULT_MUSIC_TRACKS = ARCADE_MUSIC_TRACKS;

// Mas nivel alcanzado = mejor recompensa al terminar
const DEFAULT_COIN_BONUS = [0, 10, 25];

export const LEO_VUELA_TUNING: Record<PhaseNumber, LeoVuelaTuning> = {
  1: { energyStart: 60, energyMax: 100, energyGainCorrect: 14, energyLossWrong: 10, energyLossEscape: 8, energyDrainPerSec: 1.0, energyLossPerBird: 6, birdHitInvulnSec: 1.5, wordsPerLevel: 10, levels: DEFAULT_LEVELS, levelCoinBonus: DEFAULT_COIN_BONUS, horizontalSpeed: 3, musicTracks: DEFAULT_MUSIC_TRACKS, musicVolumeDb: -10, musicDuckDb: -34 },
  2: { energyStart: 60, energyMax: 100, energyGainCorrect: 13, energyLossWrong: 10, energyLossEscape: 8, energyDrainPerSec: 1.2, energyLossPerBird: 6, birdHitInvulnSec: 1.5, wordsPerLevel: 10, levels: DEFAULT_LEVELS, levelCoinBonus: DEFAULT_COIN_BONUS, horizontalSpeed: 3, musicTracks: DEFAULT_MUSIC_TRACKS, musicVolumeDb: -10, musicDuckDb: -34 },
  3: { energyStart: 60, energyMax: 100, energyGainCorrect: 12, energyLossWrong: 11, energyLossEscape: 9, energyDrainPerSec: 1.4, energyLossPerBird: 6, birdHitInvulnSec: 1.5, wordsPerLevel: 10, levels: DEFAULT_LEVELS, levelCoinBonus: DEFAULT_COIN_BONUS, horizontalSpeed: 3, musicTracks: DEFAULT_MUSIC_TRACKS, musicVolumeDb: -10, musicDuckDb: -34 },
  4: { energyStart: 60, energyMax: 100, energyGainCorrect: 12, energyLossWrong: 11, energyLossEscape: 9, energyDrainPerSec: 1.6, energyLossPerBird: 6, birdHitInvulnSec: 1.5, wordsPerLevel: 10, levels: DEFAULT_LEVELS, levelCoinBonus: DEFAULT_COIN_BONUS, horizontalSpeed: 3, musicTracks: DEFAULT_MUSIC_TRACKS, musicVolumeDb: -10, musicDuckDb: -34 },
  5: { energyStart: 60, energyMax: 100, energyGainCorrect: 11, energyLossWrong: 12, energyLossEscape: 10, energyDrainPerSec: 1.8, energyLossPerBird: 6, birdHitInvulnSec: 1.5, wordsPerLevel: 10, levels: DEFAULT_LEVELS, levelCoinBonus: DEFAULT_COIN_BONUS, horizontalSpeed: 3, musicTracks: DEFAULT_MUSIC_TRACKS, musicVolumeDb: -10, musicDuckDb: -34 },
};

export function tuningForPhase(phase: PhaseNumber): LeoVuelaTuning {
  return LEO_VUELA_TUNING[phase] ?? LEO_VUELA_TUNING[1];
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

// Arma la ronda: target + distractores, cada nube en una banda de
// altura distinta para que volar hasta una implique una decision.
//
// Los distractores salen al azar del mismo bloque de palabras ya
// aprendidas. Se probo (y se removio tras el QA de sep-2026) priorizar
// el antonimo real como distractor en Fase 2 (ej. "alto" vs "bajo"):
// la meta del juego es reconocimiento visual/global de la palabra, no
// discriminacion semantica, y como el juego no muestra imagenes (la
// unica pista posible ya es el texto) el antonimo no aportaba nada que
// un distractor al azar no diera. Ademas sumaba dos problemas reales:
// pares de longitud dispar delataban la respuesta por el tamano de la
// nube (ej. "caliente"/"frio" — resuelto aparte con
// normalizedCloudPuffWidth para CUALQUIER palabra, no solo esa pareja),
// y al repetirse siempre la misma pareja el chico podia aprender el
// patron de co-ocurrencia en vez de leer cada palabra por separado. Ver
// docs/RELEO-JUEGOS-V2.md para el detalle de la decision.
export function buildCloudRound(
  target: DomanWord,
  distractorPool: DomanWord[],
  bands: number[],
  shuffleFn: <T>(arr: T[]) => T[] = defaultShuffle,
): CloudSpec[] {
  const pool = distractorPool.filter((w) => w.id !== target.id);
  const slots = Math.max(0, bands.length - 1);
  const distractors = shuffleFn(pool).slice(0, slots);

  const roundWords = shuffleFn([target, ...distractors]);
  const shuffledBands = shuffleFn(bands);
  return roundWords.map((word, i) => ({ word, band: shuffledBands[i] }));
}
