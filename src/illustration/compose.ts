// Compositor: arma el documento SVG final a partir de una escena.
//
// Orden de dibujo, siempre: escenario → props → personajes. Los personajes van
// SIEMPRE al frente.

import { CANVAS } from "./tokens";
import { bosqueDia } from "./backgrounds/bosque-dia";
import { dibujarProp } from "./props";
import { zorro } from "./characters/zorro";
import type { Escenario, PersonajeRef, Scene, CharacterProps } from "./types";

const FONDOS: Record<Escenario, () => string> = {
  "bosque-dia": bosqueDia,
};

const PERSONAJES_FN: Record<PersonajeRef, (p: CharacterProps) => string> = {
  zorro,
};

export interface OpcionesComposicion {
  /** Va en <title>: nombre corto de la escena. */
  titulo?: string;
  /** Va en <desc>: describe la escena para un chico que no ve. */
  descripcion?: string;
}

export function composeScene(scene: Scene, op: OpcionesComposicion = {}): string {
  const fondo = FONDOS[scene.background];
  if (!fondo) throw new Error(`Escenario desconocido: ${scene.background}`);

  const capas: string[] = [fondo()];

  for (const p of scene.props) capas.push(dibujarProp(p));

  scene.characters.forEach((c, i) => {
    const dibujar = PERSONAJES_FN[c.ref];
    if (!dibujar) throw new Error(`Personaje desconocido: ${c.ref}`);
    // Cada instancia necesita un id único: es lo que después prefija los ids
    // internos y evita que dos personajes en la misma página se pisen.
    const id = c.id ?? `${c.ref}-${i}`;
    capas.push(dibujar({ ...c, id }));
  });

  const titulo = op.titulo ?? "Ilustración del cuento";
  const desc = op.descripcion ?? "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CANVAS.viewBox}" ` +
    `width="100%" role="img" aria-labelledby="t d">` +
    `<title id="t">${escapar(titulo)}</title>` +
    `<desc id="d">${escapar(desc)}</desc>` +
    capas.join("") +
    `</svg>`
  );
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
