// Fondo temático por mundo — una capa opcional que ArcadeSky (ver
// components/arcade-sky.ts) superpone al cielo procedural existente
// (día/atardecer/noche + parallax de nubes). Si un worldId no tiene
// entrada acá, o el PNG todavía no existe en /public, el juego sigue
// usando solo el cielo procedural: ese es el fallback, no hace falta
// programar uno aparte (ver ArcadeSky.loadLandscape).
//
// Especificación del asset (docs/RELEO-JUEGOS-V2.md §16 — Isla de las
// Palabras):
// - PNG RGBA, 1280×840 (32:21 — el doble de la resolución lógica del
//   canvas de Leo Vuela, 640×420, mismo aspect ratio a 2x para que
//   escale 1:1 sobre el canvas sin recortar ni distorsionar).
// - Sin fondo pintado, sin texto, sin Leo, sin sol/luna, sin nubes
//   parecidas a las nubes-palabra, sin elementos animados incorporados.
// - El contenido útil vive en la banda inferior (y≈330–420 en
//   coordenadas lógicas 640×420); el resto del lienzo queda
//   transparente para no invadir la zona de lectura (y≈60–330).
//
// world_1 y world_2 tienen asset; world_3/4 quedan sin entrada a
// propósito — no inventar rutas hasta tener el PNG real de cada uno.
export const WORLD_BACKGROUNDS: Partial<Record<string, string>> = {
  world_1: "/images/games/backgrounds/isla-de-las-palabras.png",
  world_2: "/images/games/backgrounds/bahia-de-los-pares.png",
};

export function getWorldBackgroundUrl(worldId: string | undefined): string | null {
  if (!worldId) return null;
  return WORLD_BACKGROUNDS[worldId] ?? null;
}
