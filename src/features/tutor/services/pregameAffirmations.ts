// Afirmación que suena ANTES de las reglas de cada juego — distinta de
// SofiaAffirmationGate (una vez por apertura de la app, fuera de cualquier
// juego puntual). Mismas 8 frases núcleo, audio propio
// (afirmacion-pregame-01..08.mp3) porque el texto que las envuelve es
// distinto. Ver CLAUDE.md "Voz de Sofía" y GameIntro/ArcadeIntro.

import type { GameId } from "@/features/games/types";

export const PREGAME_AFFIRMATIONS = [
  { mp3: "afirmacion-pregame-01", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: yo puedo, yo creo en mí, yo soy inteligente. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-02", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: me esfuerzo, lo intento, y lo consigo. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-03", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: me quiero tal como soy. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-04", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: vine al mundo a hacer cosas hermosas. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-05", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: si me equivoco, lo intento de nuevo. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-06", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: cada día aprendo algo nuevo. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-07", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: soy valiente y no me rindo. ¡Ahora sí, a jugar!" },
  { mp3: "afirmacion-pregame-08", text: "Hola, soy la Seño Sofía. Antes de empezar a jugar, repetí conmigo: leer me hace grande. ¡Ahora sí, a jugar!" },
] as const;

const LAST_INDEX_KEY = "doman-last-affirmation-pregame";
const RULES_SEEN_PREFIX = "doman-rules-seen-";

/** Elige una afirmación al azar, nunca la misma que la última vez. */
export function pickPregameAffirmation(): (typeof PREGAME_AFFIRMATIONS)[number] {
  let last = -1;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LAST_INDEX_KEY);
    last = raw ? parseInt(raw, 10) : -1;
  }
  let next = Math.floor(Math.random() * PREGAME_AFFIRMATIONS.length);
  if (PREGAME_AFFIRMATIONS.length > 1) {
    while (next === last) next = Math.floor(Math.random() * PREGAME_AFFIRMATIONS.length);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_INDEX_KEY, String(next));
  }
  return PREGAME_AFFIRMATIONS[next];
}

/** Reglas de un juego puntual: solo la primera vez que el chico lo juega. */
export function hasSeenRules(gameId: GameId): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(`${RULES_SEEN_PREFIX}${gameId}`) === "1";
  } catch {
    return true; // si localStorage falla, mejor no repetir reglas de más
  }
}

export function markRulesSeen(gameId: GameId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${RULES_SEEN_PREFIX}${gameId}`, "1");
  } catch {
    // no-op: perder el flag solo hace que las reglas vuelvan a sonar una vez
  }
}
