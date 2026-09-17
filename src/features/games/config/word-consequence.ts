import { EMOJI_MAP } from "@/shared/constants/emoji-map";

// "La palabra provoca algo en el mundo" — reutilizable por cualquier
// juego, no solo Leo Vuela. Reusa EMOJI_MAP (ya cubre las 220 palabras
// del curriculum, usado hoy por Empareja Palabra-Imagen) en vez de
// generar un mapeo palabra→icono nuevo. Nunca se llama antes de un
// acierto: es SIEMPRE una confirmación posterior, jamas una pista.
//
// Fallback elegante: si una palabra no tiene emoji propio (no debería
// pasar con el curriculum actual, pero cubre datos externos o futuras
// palabras) se usa una estrella genérica en vez de "❓", que se leería
// como un error visual en medio de un festejo.
const FALLBACK_CONSEQUENCE = "⭐";

// hoy/mañana/ayer devuelven una fecha real armada en texto (ver
// emoji-map.ts, spanishDate()) — perfecta como pista dentro de la app,
// pero no sirve como "icono" volador de un festejo. Cualquier entrada
// con letras/números ASCII (no un emoji puro) cae al fallback.
function looksLikeEmoji(value: string): boolean {
  return !/[0-9a-zA-Z]/.test(value);
}

export function getConsequenceEmoji(wordText: string): string {
  const emoji = EMOJI_MAP[wordText];
  return emoji && emoji !== "❓" && looksLikeEmoji(emoji) ? emoji : FALLBACK_CONSEQUENCE;
}
