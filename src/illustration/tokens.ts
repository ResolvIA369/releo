// Tokens visuales del sistema de ilustración de cuentos.
//
// Regla de oro: TODO plano y opaco. Sin gradientes, sombras, blur, texturas ni
// filtros SVG. Lo que hace que un cuento se vea de una pieza no es el detalle
// sino que todas las páginas usen exactamente los mismos colores y el mismo
// grosor de línea.
//
// La paleta es CERRADA: 16 colores. Si algo necesita un color nuevo, primero
// se discute si de verdad hace falta. Una paleta que crece sin control es lo
// que hace que un sistema de ilustración deje de parecer un sistema.

export const CANVAS = {
  width: 1200,
  height: 800,
  viewBox: "0 0 1200 800",
  /** Zona segura: nada crítico fuera de esto. */
  safe: { x0: 60, y0: 60, x1: 1140, y1: 740 },
} as const;

/** 16 colores. Saturados y de alto contraste: son escenas para chicos. */
export const COLOR = {
  // neutros
  linea: "#2B2B33",
  blanco: "#FFFFFF",
  crema: "#FFF6E5",
  // cielo y agua
  cielo: "#8ED6FF",
  cieloNoche: "#2B3A67",
  agua: "#3AA7DE",
  // vegetación y tierra
  pasto: "#5FBF5F",
  pastoOscuro: "#3E9142",
  tronco: "#8A5A2B",
  tierra: "#C89A63",
  // personajes y acentos
  naranja: "#F28C28",
  naranjaOscuro: "#D46A12",
  rojo: "#E4572E",
  amarillo: "#FFC94A",
  violeta: "#8B6BD9",
  rosa: "#F49AC1",
} as const;

export type ColorToken = keyof typeof COLOR;

/**
 * Contorno: UNA sola estrategia en todo el sistema. Acá: todo con contorno del
 * mismo grosor. Mezclar con y sin contorno es lo que más rompe la unidad.
 */
export const TRAZO = {
  color: COLOR.linea,
  grosor: 6,
  /** Los extremos siempre redondeados: nada de puntas agudas sin intención. */
  remate: "round",
  union: "round",
} as const;

/** Radios de esquina. Generosos: formas amables, sin filo. */
export const RADIO = {
  sm: 8,
  md: 16,
  lg: 28,
  xl: 44,
} as const;

/** Atributos de trazo, listos para escupir dentro de un elemento SVG. */
export function trazo(grosor: number = TRAZO.grosor): string {
  return `stroke="${TRAZO.color}" stroke-width="${grosor}" ` +
    `stroke-linecap="${TRAZO.remate}" stroke-linejoin="${TRAZO.union}"`;
}

/** Relleno plano + contorno estándar. */
export function pintar(color: string, grosor: number = TRAZO.grosor): string {
  return `fill="${color}" ${trazo(grosor)}`;
}

/** Sin contorno (para detalles internos que no deben cortar la silueta). */
export function plano(color: string): string {
  return `fill="${color}" stroke="none"`;
}
