// ─── Auto-fit text size for word display cards ───────────────────
// Used in FlashCard, DomanWordDisplay, and other word-display components.
//
// Strategy: scale down the base font size based on word length so long
// words like "amarillo", "sorprendido", "cuadrado" never get cut off
// at the edges of their container.

export function fitWordFontSize(word: string, baseSize: number): number {
  const len = word.length;
  if (len <= 5)  return baseSize;            // ojo, casa, verde
  if (len <= 7)  return Math.round(baseSize * 0.85); // ventana, redondo
  if (len <= 9)  return Math.round(baseSize * 0.70); // amarillo, cuadrado, caliente, pequeño
  if (len <= 11) return Math.round(baseSize * 0.58); // sorprendido, pegamento
  return Math.round(baseSize * 0.5);          // anything longer
}
