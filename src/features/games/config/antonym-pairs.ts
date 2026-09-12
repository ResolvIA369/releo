// Pares de opuestos reales entre las palabras de Fase 2 ("Parejas de
// Palabras" — ver src/shared/constants/words.ts, categorías `opuestos`
// y `tamaños_y_formas`). No es vocabulario nuevo: solo hace explícita
// una relación que ya existe en el currículum, para que los juegos
// puedan usarla a propósito como distractor — leer "alto" vs "bajo"
// exige más precisión que leer "alto" vs una palabra sin relación.
export const ANTONYM_PAIRS: Record<string, string> = {
  grande: "pequeño", pequeño: "grande",
  largo: "corto", corto: "largo",
  alto: "bajo", bajo: "alto",
  gordo: "flaco", flaco: "gordo",
  redondo: "cuadrado", cuadrado: "redondo",
  arriba: "abajo", abajo: "arriba",
  dentro: "fuera", fuera: "dentro",
  cerca: "lejos", lejos: "cerca",
  rápido: "lento", lento: "rápido",
  caliente: "frío", frío: "caliente",
};

export function getAntonym(word: string): string | undefined {
  return ANTONYM_PAIRS[word];
}
