import type { DomanWord } from "@/shared/types";

/**
 * Los bloques de palabras con los que se juega un mundo.
 *
 * ── Por qué son de 25 y no de 16+17+17 ─────────────────────────────────
 *
 * Las clases de flash son de CINCO palabras. Mientras los bloques fueron de
 * 16+17+17, ninguno caía en un múltiplo de cinco: el primero cortaba en la
 * mitad de la clase 4. Eso significa que no existía "el juego que practica lo
 * de estas clases" — el bloque siempre pisaba una clase por la mitad.
 *
 * Con 25, cada bloque es exactamente CINCO CLASES. El mundo queda partido en
 * dos mitades limpias: clases 1-5 → bloque 1, clases 6-10 → bloque 2. Ahora el
 * juego es la práctica de lo que el chico acaba de ver, y en el canal de
 * YouTube una lista puede encadenar cinco clases y su juego sin mentir.
 *
 * El mundo 5 tiene 20 palabras (4 clases) y va en un bloque único.
 *
 * ── Por qué vive acá y no en tres lugares ──────────────────────────────
 *
 * Esta división estaba copiada y pegada en GameSetup, en /demo y en
 * /play/[gameId]. Tres copias de la misma regla es una que se va a olvidar de
 * actualizar. Cualquiera que necesite bloques importa de acá.
 */

/** Palabras por bloque. Múltiplo de 5 para que un bloque sea N clases enteras. */
export const PALABRAS_POR_BLOQUE = 25;

/** Palabras por clase de flash. */
export const PALABRAS_POR_CLASE = 5;

export type WordBlock = {
  /** "1", "2", … tal como se muestra al elegir. */
  label: string;
  words: DomanWord[];
  category: string;
  /** Números de clase que cubre este bloque, dentro del mundo. */
  clases: number[];
};

/**
 * Parte las palabras de un mundo en bloques de 25.
 * Un mundo de 20 o menos va entero en un bloque.
 */
export function buildBlocks(phaseWords: DomanWord[]): WordBlock[] {
  const total = phaseWords.length;
  if (total === 0) return [];

  const clasesDe = (desde: number, cantidad: number) => {
    const primera = Math.floor(desde / PALABRAS_POR_CLASE) + 1;
    const ultima = Math.ceil((desde + cantidad) / PALABRAS_POR_CLASE);
    return Array.from({ length: ultima - primera + 1 }, (_, i) => primera + i);
  };

  if (total <= PALABRAS_POR_BLOQUE) {
    return [{
      label: "1",
      words: phaseWords,
      category: phaseWords[0]?.categoryDisplay ?? "",
      clases: clasesDe(0, total),
    }];
  }

  const bloques: WordBlock[] = [];
  for (let i = 0; i < total; i += PALABRAS_POR_BLOQUE) {
    const chunk = phaseWords.slice(i, i + PALABRAS_POR_BLOQUE);
    bloques.push({
      label: `${bloques.length + 1}`,
      words: chunk,
      category: chunk[0]?.categoryDisplay ?? "",
      clases: clasesDe(i, chunk.length),
    });
  }
  return bloques;
}

/** Cuántos bloques tiene un mundo de N palabras. */
export const cantidadDeBloques = (total: number) =>
  total <= PALABRAS_POR_BLOQUE ? 1 : Math.ceil(total / PALABRAS_POR_BLOQUE);
