// Props: objetos posicionables, autónomos. Se dibujan entre el escenario y los
// personajes. Su origen es la BASE (donde apoyan en el piso), igual que los
// personajes, para poder alinearlos al mismo horizonte sin cuentas.

import { COLOR, RADIO, pintar, plano } from "../tokens";
import type { PropKind, PropProps } from "../types";

function arbol(): string {
  return [
    `<rect x="-18" y="-150" width="36" height="150" rx="${RADIO.sm}" ${pintar(COLOR.tronco)}/>`,
    `<circle cx="0" cy="-186" r="74" ${pintar(COLOR.pastoOscuro)}/>`,
    `<circle cx="-46" cy="-152" r="44" ${pintar(COLOR.pastoOscuro)}/>`,
    `<circle cx="46" cy="-152" r="44" ${pintar(COLOR.pastoOscuro)}/>`,
  ].join("");
}

function roca(): string {
  return [
    `<path d="M -62 0 L -44 -42 L -8 -58 L 34 -46 L 62 0 Z" ${pintar(COLOR.tierra)}/>`,
    // Detalle interno: sin relleno y con trazo fino. Se escribe entero acá en
    // vez de parchear el resultado de pintar(): reemplazar atributos a mano
    // duplicaba stroke y el SVG quedaba inválido.
    `<path d="M -30 -34 L -12 -46 L 6 -38" fill="none" stroke="${COLOR.linea}" stroke-width="4" stroke-linecap="round"/>`,
  ].join("");
}

const DIBUJOS: Record<PropKind, () => string> = {
  arbol,
  roca,
};

/** Devuelve el prop ya ubicado, escalado y espejado si corresponde. */
export function dibujarProp(p: PropProps): string {
  const dibujo = DIBUJOS[p.kind];
  if (!dibujo) return "";
  const espejo = p.flip ? " scale(-1,1)" : "";
  return `<g transform="translate(${p.x},${p.y}) scale(${p.scale})${espejo}">${dibujo()}</g>`;
}
