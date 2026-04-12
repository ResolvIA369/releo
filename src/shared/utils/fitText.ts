// ─── Auto-fit text size for word display cards ───────────────────
// Used in FlashCard, DomanWordDisplay, and other word-display components.
//
// Strategy: scale down the base font size based on word length so words
// never get cut off at the edges of their container. The breakpoints
// are tuned for "Arial Rounded MT Bold" which is ~10% wider than
// standard Arial. Accented characters (mamá, papá, bebé) tend to
// render wider, so we start scaling earlier than plain ASCII would need.

export function fitWordFontSize(word: string, baseSize: number): number {
  const len = word.length;
  if (len <= 3)  return baseSize;                         // ojo, pie, sol
  if (len <= 4)  return Math.round(baseSize * 0.90);      // mamá, papá, bebé, casa
  if (len <= 5)  return Math.round(baseSize * 0.82);      // verde, abajo
  if (len <= 6)  return Math.round(baseSize * 0.74);      // abuela, lápiz
  if (len <= 7)  return Math.round(baseSize * 0.66);      // ventana, redondo
  if (len <= 9)  return Math.round(baseSize * 0.56);      // amarillo, cuadrado, caliente
  if (len <= 11) return Math.round(baseSize * 0.46);      // sorprendido, pegamento
  return Math.round(baseSize * 0.40);                     // anything longer
}
