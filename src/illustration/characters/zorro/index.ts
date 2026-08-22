// Ensamblador del zorro: junta cuerpo (pose) + cabeza (expresión).
//
// Nada de esto genera SVG en tiempo de ejecución a pedido de nadie: son
// funciones deterministas del repo. Mismos props, mismo string, siempre.

import { body } from "./parts/body";
import { head } from "./parts/head";
import type { CharacterProps } from "../../types";

export function zorro(props: CharacterProps): string {
  const { id, pose, expression, direction, x, y, scale } = props;

  const cuerpo = body(pose);
  const cabeza = head(expression);

  // El espejado se hace en el grupo, no en cada parte: si cada parte se
  // espejara sola, el orden de dibujo se rompería.
  const espejo = direction === "izq" ? " scale(-1,1)" : "";

  // Orden de capas: cola detrás, después tronco y patas, la cabeza al final.
  // Si la cola se dibujara junto al tronco, el torso la taparía.
  return (
    `<g id="${id}" transform="translate(${x},${y}) scale(${scale})${espejo}">` +
    cuerpo.atras +
    cuerpo.frente +
    `<g transform="translate(${cuerpo.cabeza.x},${cuerpo.cabeza.y})">${cabeza}</g>` +
    `</g>`
  );
}
