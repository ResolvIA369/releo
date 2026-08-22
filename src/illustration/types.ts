// Vocabulario cerrado del sistema de ilustración.
//
// Todo lo que una escena puede pedir está acá. Si un JSON de cuento nombra una
// pose, una expresión, un prop o un escenario que no figura en estos tipos, la
// validación tiene que fallar — nunca renderizar algo roto.

export const POSES = [
  "de-pie", "caminando", "sentado", "corriendo", "acostado", "saltando",
] as const;
export type Pose = (typeof POSES)[number];

export const EXPRESIONES = [
  "neutral", "feliz", "triste", "sorprendido", "asustado", "enojado", "dormido",
] as const;
export type Expression = (typeof EXPRESIONES)[number];

export type Direccion = "izq" | "der";

/** Instancia de un personaje dentro de una escena. */
export interface CharacterProps {
  /** Único por página. Prefija todos los ids internos para no colisionar. */
  id: string;
  pose: Pose;
  expression: Expression;
  direction: Direccion;
  /** Origen = punto medio de los PIES, para apoyarlo en el piso sin cuentas. */
  x: number;
  y: number;
  /** 1 = tamaño base. */
  scale: number;
}

export const ESCENARIOS = ["bosque-dia"] as const;
export type Escenario = (typeof ESCENARIOS)[number];

export const PROPS = ["arbol", "roca"] as const;
export type PropKind = (typeof PROPS)[number];

export interface PropProps {
  kind: PropKind;
  x: number;
  y: number;
  scale: number;
  flip: boolean;
}

/** Referencia a un personaje del catálogo (por ahora, uno). */
export const PERSONAJES = ["zorro"] as const;
export type PersonajeRef = (typeof PERSONAJES)[number];

export interface SceneCharacter extends Omit<CharacterProps, "id"> {
  ref: PersonajeRef;
  /** Opcional: si no viene, el compositor genera uno estable por índice. */
  id?: string;
}

export interface Scene {
  background: Escenario;
  props: PropProps[];
  characters: SceneCharacter[];
}

export interface StoryPage {
  n: number;
  /** El texto va en HTML, FUERA del SVG. Acá sólo viaja el dato. */
  text: string;
  scene: Scene;
  /** Descripción de la escena para quien no ve la ilustración. */
  desc?: string;
}

export interface Story {
  slug: string;
  title: string;
  ageRange: [number, number];
  characters: PersonajeRef[];
  pages: StoryPage[];
}
