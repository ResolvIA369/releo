import { PhaseConfig, SessionConfig } from "../types/doman";

export const PHASES: PhaseConfig[] = [
  {
    phase: 1,
    name: "Palabras Sencillas",
    levelName: "Explorador de Palabras",
    description:
      "Reconocimiento visual de palabras significativas y diferenciación entre vocablos similares",
    durationWeeks: 4,
    wordsPerCategory: 10,
    categories: ["familia", "colores", "animales", "comida", "casa", "cuerpo"],
    fontSizePx: 48,
    fontSizeCm: 12.5,
    fontColor: "red",
  },
  {
    phase: 2,
    name: "Parejas de Palabras",
    levelName: "Constructor de Ideas",
    description:
      "Comprensión de combinaciones simples y desarrollo de conceptos descriptivos",
    durationWeeks: 4,
    wordsPerCategory: 10,
    categories: ["colores", "tamaños_y_formas", "opuestos", "emociones", "naturaleza"],
    fontSizePx: 40,
    fontSizeCm: 10,
    fontColor: "black",
  },
  {
    phase: 3,
    name: "Oraciones Sencillas",
    levelName: "Creador de Historias",
    description:
      "Construcción de oraciones simples con estructura sujeto + verbo + complemento",
    durationWeeks: 4,
    wordsPerCategory: 10,
    categories: ["verbos_cotidianos", "verbos_de_accion", "ropa", "escuela", "lugares"],
    fontSizePx: 32,
    fontSizeCm: 7.5,
    fontColor: "black",
  },
  {
    phase: 4,
    name: "Frases Completas",
    levelName: "Maestro de Frases",
    description:
      "Dominio de estructuras gramaticales completas con artículos y conectores",
    durationWeeks: 4,
    wordsPerCategory: 10,
    categories: ["articulos_y_conectores", "preposiciones", "pronombres", "tiempo", "numeros"],
    fontSizePx: 24,
    fontSizeCm: 5,
    fontColor: "black",
  },
  {
    phase: 5,
    name: "Cuentos Cortos",
    levelName: "Lector de Aventuras",
    description:
      "Lectura fluida de textos narrativos y comprensión de historias completas",
    durationWeeks: 0,
    wordsPerCategory: 10,
    categories: ["verbos_avanzados", "adverbios"],
    fontSizePx: 20,
    fontSizeCm: 3.5,
    fontColor: "black",
  },
];

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxDurationSeconds: 300,
  maxSessionsPerDay: 3,
  minGapMinutes: 30,
  wordsPerSession: 5,
  secondsPerWord: 10,
};
