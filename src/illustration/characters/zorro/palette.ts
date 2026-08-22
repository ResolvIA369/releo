// Paleta del zorro. Vive acá y NO se parametriza a propósito.
//
// Si el color entrara por props, en tres semanas habría zorros verdes y el
// personaje dejaría de ser el mismo entre páginas — que es justo el problema
// que este sistema existe para resolver.

import { COLOR } from "../../tokens";

export const ZORRO = {
  pelaje: COLOR.naranja,
  pelajeOscuro: COLOR.naranjaOscuro,
  panza: COLOR.crema,
  puntas: COLOR.crema, // punta de cola, hocico, pecho
  ojo: COLOR.linea,
  nariz: COLOR.linea,
  lengua: COLOR.rosa,
} as const;
