// Cabeza del zorro. Recibe la expresión; la pose NO la toca.
//
// Ese es el punto del sistema: 6 poses × 7 expresiones = 42 combinaciones sin
// dibujar 42 zorros. La cabeza sólo sabe de caras; el cuerpo sólo de posturas.
//
// Origen (0,0) = base del cuello, para que el cuerpo la enganche sin cuentas.

import { pintar, plano, trazo } from "../../../tokens";
import { ZORRO } from "../palette";
import type { Expression } from "../../../types";

/** Ojos según la expresión. Los ids no hacen falta: son formas puras. */
function ojos(e: Expression): string {
  const iz = -22, de = 22, y = -74;
  if (e === "dormido") {
    return `<path d="M ${iz - 12} ${y} q 12 10 24 0" fill="none" ${trazo(5)}/>` +
           `<path d="M ${de - 12} ${y} q 12 10 24 0" fill="none" ${trazo(5)}/>`;
  }
  if (e === "feliz") {
    return `<path d="M ${iz - 12} ${y + 4} q 12 -14 24 0" fill="none" ${trazo(5)}/>` +
           `<path d="M ${de - 12} ${y + 4} q 12 -14 24 0" fill="none" ${trazo(5)}/>`;
  }
  const r = e === "sorprendido" || e === "asustado" ? 12 : 9;
  return `<circle cx="${iz}" cy="${y}" r="${r}" ${plano(ZORRO.ojo)}/>` +
         `<circle cx="${de}" cy="${y}" r="${r}" ${plano(ZORRO.ojo)}/>`;
}

/** Cejas: son las que más cambian la lectura emocional. */
function cejas(e: Expression): string {
  const y = -96;
  if (e === "enojado") {
    return `<path d="M -36 ${y - 4} L -12 ${y + 8}" fill="none" ${trazo(6)}/>` +
           `<path d="M 36 ${y - 4} L 12 ${y + 8}" fill="none" ${trazo(6)}/>`;
  }
  if (e === "triste" || e === "asustado") {
    return `<path d="M -36 ${y + 8} L -12 ${y - 2}" fill="none" ${trazo(6)}/>` +
           `<path d="M 36 ${y + 8} L 12 ${y - 2}" fill="none" ${trazo(6)}/>`;
  }
  if (e === "sorprendido") {
    return `<path d="M -36 ${y - 6} q 12 -8 24 0" fill="none" ${trazo(6)}/>` +
           `<path d="M 12 ${y - 6} q 12 -8 24 0" fill="none" ${trazo(6)}/>`;
  }
  return "";
}

function boca(e: Expression): string {
  const y = -34;
  switch (e) {
    case "feliz":
      return `<path d="M -20 ${y} q 20 22 40 0" fill="none" ${trazo(6)}/>`;
    case "triste":
      return `<path d="M -20 ${y + 10} q 20 -18 40 0" fill="none" ${trazo(6)}/>`;
    case "sorprendido":
    case "asustado":
      return `<ellipse cx="0" cy="${y + 6}" rx="12" ry="16" ${pintar(ZORRO.lengua, 5)}/>`;
    case "enojado":
      return `<path d="M -20 ${y + 8} L 20 ${y + 8}" fill="none" ${trazo(6)}/>`;
    case "dormido":
      return `<path d="M -12 ${y + 4} q 12 10 24 0" fill="none" ${trazo(5)}/>`;
    default:
      return `<path d="M -14 ${y} q 14 12 28 0" fill="none" ${trazo(5)}/>`;
  }
}

export function head(expression: Expression): string {
  return [
    // orejas
    `<path d="M -58 -108 L -40 -166 L -8 -120 Z" ${pintar(ZORRO.pelaje)}/>`,
    `<path d="M 58 -108 L 40 -166 L 8 -120 Z" ${pintar(ZORRO.pelaje)}/>`,
    // cráneo
    `<ellipse cx="0" cy="-76" rx="62" ry="56" ${pintar(ZORRO.pelaje)}/>`,
    // hocico
    `<ellipse cx="0" cy="-38" rx="34" ry="26" ${pintar(ZORRO.puntas)}/>`,
    cejas(expression),
    ojos(expression),
    `<ellipse cx="0" cy="-52" rx="9" ry="7" ${plano(ZORRO.nariz)}/>`,
    boca(expression),
    // Cuello corto: antes medía 34 y se montaba sobre el torso, así que el
    // zorro parecía no tener cuello y la panza le tapaba el hocico.
    `<rect x="-19" y="-34" width="38" height="18" rx="9" ${pintar(ZORRO.pelaje)}/>`,
  ].join("");
}
