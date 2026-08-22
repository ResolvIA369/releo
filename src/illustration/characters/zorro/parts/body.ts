// Cuerpo del zorro: cola, tronco y patas según la POSE. No sabe nada de caras.
//
// Devuelve el dibujo partido en DOS capas porque la cola tiene que ir DETRÁS
// del torso pero las patas delante. Si se devolviera un solo string, la cola
// quedaba tapada por el torso (era el defecto de la primera versión).
//
// Origen (0,0) = punto medio de los pies.

import { pintar, plano } from "../../../tokens";
import { ZORRO } from "../palette";
import type { Pose } from "../../../types";

export interface Cuerpo {
  /** Va detrás de todo: la cola. */
  atras: string;
  /** Tronco y patas. */
  frente: string;
  /** Dónde apoyar la cabeza (base del cuello). */
  cabeza: { x: number; y: number };
}

/**
 * Cola. El zorro se dibuja DE FRENTE (la cara mira al lector), así que la cola
 * no puede barrer desde el pecho como en una vista de perfil: ahí se lee como
 * un brazo. Asoma baja, a la altura de las patas, curvándose hacia afuera.
 */
function cola(x: number, y: number, rot: number, s = 1): string {
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M 0 0 C 34 -6 62 6 68 34 C 72 56 60 72 44 70 C 58 58 58 40 48 28 C 36 14 18 10 0 14 Z" ${pintar(ZORRO.pelaje)}/>` +
    `<path d="M 44 70 C 58 58 58 40 48 28 C 62 42 66 62 54 72 Z" ${plano(ZORRO.puntas)}/>` +
    `</g>`;
}

function pata(x: number, y: number, alto: number): string {
  return `<rect x="${x - 11}" y="${y}" width="22" height="${alto}" rx="10" ${pintar(ZORRO.pelaje)}/>`;
}

export function body(pose: Pose): Cuerpo {
  switch (pose) {
    case "sentado":
      return {
        atras: cola(26, -40, 12),
        frente: [
          // tronco en pera: más ancho abajo, que es lo que hace leer "sentado"
          `<path d="M -30 -104 q 60 0 60 0 q 22 46 22 74 q 0 30 -52 30 q -52 0 -52 -30 q 0 -28 22 -74 Z" ${pintar(ZORRO.pelaje)}/>`,
          `<ellipse cx="0" cy="-34" rx="30" ry="30" ${plano(ZORRO.panza)}/>`,
          pata(-34, -12, 14),
          pata(34, -12, 14),
        ].join(""),
        cabeza: { x: 0, y: -104 },
      };

    case "acostado":
      return {
        atras: cola(56, -30, 34),
        frente: [
          `<ellipse cx="0" cy="-28" rx="78" ry="30" ${pintar(ZORRO.pelaje)}/>`,
          `<ellipse cx="8" cy="-22" rx="44" ry="16" ${plano(ZORRO.panza)}/>`,
          pata(-42, -12, 14),
          pata(36, -12, 14),
        ].join(""),
        cabeza: { x: -64, y: -36 },
      };

    case "corriendo":
      // Inclinado hacia adelante + patas muy abiertas: es lo que distingue
      // "corriendo" de "caminando" a tamaño chico.
      return {
        atras: cola(30, -52, 24),
        frente: [
          `<g transform="rotate(-14)">` +
          `<ellipse cx="0" cy="-86" rx="50" ry="38" ${pintar(ZORRO.pelaje)}/>` +
          `<ellipse cx="6" cy="-80" rx="28" ry="22" ${plano(ZORRO.panza)}/>` +
          `</g>`,
          `<rect x="-78" y="-40" width="22" height="50" rx="10" transform="rotate(-52 -67 -15)" ${pintar(ZORRO.pelaje)}/>`,
          `<rect x="46" y="-40" width="22" height="50" rx="10" transform="rotate(52 57 -15)" ${pintar(ZORRO.pelaje)}/>`,
        ].join(""),
        cabeza: { x: 18, y: -104 },
      };

    case "saltando":
      // Bien alto y con las cuatro patas recogidas hacia adentro.
      return {
        atras: cola(26, -80, 28),
        frente: [
          `<ellipse cx="0" cy="-118" rx="46" ry="42" ${pintar(ZORRO.pelaje)}/>`,
          `<ellipse cx="0" cy="-112" rx="26" ry="26" ${plano(ZORRO.panza)}/>`,
          `<rect x="-64" y="-96" width="22" height="42" rx="10" transform="rotate(-64 -53 -75)" ${pintar(ZORRO.pelaje)}/>`,
          `<rect x="42" y="-96" width="22" height="42" rx="10" transform="rotate(64 53 -75)" ${pintar(ZORRO.pelaje)}/>`,
          `<rect x="-40" y="-72" width="20" height="34" rx="9" transform="rotate(-28 -30 -55)" ${pintar(ZORRO.pelaje)}/>`,
          `<rect x="20" y="-72" width="20" height="34" rx="9" transform="rotate(28 30 -55)" ${pintar(ZORRO.pelaje)}/>`,
        ].join(""),
        cabeza: { x: 0, y: -120 },
      };

    case "caminando":
      // Una pata adelante y otra atrás, bien separadas: la diferencia con
      // "de-pie" tiene que verse en la silueta, no en un detalle.
      return {
        atras: cola(28, -56, 16),
        frente: [
          `<ellipse cx="0" cy="-92" rx="44" ry="46" ${pintar(ZORRO.pelaje)}/>`,
          `<ellipse cx="0" cy="-86" rx="26" ry="28" ${plano(ZORRO.panza)}/>`,
          `<rect x="-52" y="-50" width="22" height="52" rx="10" transform="rotate(-22 -41 -24)" ${pintar(ZORRO.pelaje)}/>`,
          `<rect x="30" y="-50" width="22" height="52" rx="10" transform="rotate(16 41 -24)" ${pintar(ZORRO.pelaje)}/>`,
        ].join(""),
        cabeza: { x: 0, y: -120 },
      };

    case "de-pie":
    default:
      return {
        atras: cola(28, -56, 12),
        frente: [
          `<ellipse cx="0" cy="-92" rx="44" ry="46" ${pintar(ZORRO.pelaje)}/>`,
          `<ellipse cx="0" cy="-86" rx="26" ry="28" ${plano(ZORRO.panza)}/>`,
          pata(-24, -50, 50),
          pata(24, -50, 50),
        ].join(""),
        cabeza: { x: 0, y: -120 },
      };
  }
}
