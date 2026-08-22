// Escenario: bosque de día. Ocupa el canvas entero y va SIEMPRE al fondo.
//
// Devuelve elementos SVG sueltos (sin la etiqueta <svg> raíz): el compositor
// arma el documento. Es una función pura: mismos parámetros, mismo string.

import { CANVAS, COLOR, plano } from "../tokens";

export function bosqueDia(): string {
  const { width: W, height: H } = CANVAS;
  const horizonte = H * 0.62;

  // Colinas del fondo: dos arcos anchos, sin contorno, para que no compitan
  // con la silueta de los personajes.
  const colina = (cx: number, cy: number, rx: number, ry: number, color: string) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${plano(color)}/>`;

  // Árbol de fondo simple: tronco + copa. Sin contorno y en verde oscuro para
  // que quede detrás sin robar atención.
  const arbolFondo = (x: number, y: number, s: number) =>
    `<rect x="${x - 10 * s}" y="${y - 90 * s}" width="${20 * s}" height="${90 * s}" rx="${8 * s}" ${plano(COLOR.tronco)}/>` +
    // Copa en el verde claro: en pastoOscuro desaparecía contra las colinas.
    `<circle cx="${x}" cy="${y - 110 * s}" r="${58 * s}" ${plano(COLOR.pasto)}/>`;

  return [
    // cielo
    `<rect x="0" y="0" width="${W}" height="${horizonte}" ${plano(COLOR.cielo)}/>`,
    // sol
    `<circle cx="${W - 170}" cy="130" r="62" ${plano(COLOR.amarillo)}/>`,
    // colinas
    colina(240, horizonte + 30, 420, 130, COLOR.pastoOscuro),
    colina(950, horizonte + 40, 480, 150, COLOR.pastoOscuro),
    // árboles de fondo
    arbolFondo(150, horizonte + 10, 1),
    arbolFondo(1050, horizonte + 6, 0.9),
    arbolFondo(430, horizonte - 4, 0.75),
    // suelo
    `<rect x="0" y="${horizonte}" width="${W}" height="${H - horizonte}" ${plano(COLOR.pasto)}/>`,
    // línea de horizonte: única línea del escenario, para asentar la escena
    `<line x1="0" y1="${horizonte}" x2="${W}" y2="${horizonte}" fill="none" stroke="${COLOR.pastoOscuro}" stroke-width="6" stroke-linecap="round"/>`,
  ].join("");
}
