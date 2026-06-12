import type { GameMeta } from "../types";

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: "leo-runner",
    name: "Leo Corre",
    description: "Toca el camino con la palabra correcta para que Leo salte",
    icon: "🦁",
    minPhase: 1,
    color: "#ed8936",
  },
  {
    id: "salta-palabra",
    name: "Salta la Palabra",
    description: "Toca para que Leo salte y atrape la palabra correcta",
    icon: "🦘",
    minPhase: 1,
    color: "#38b2ac",
  },
  {
    id: "leo-vuela",
    name: "Leo Vuela",
    description: "Toca para que Leo vuele hasta la nube con la palabra correcta",
    icon: "🪁",
    minPhase: 1,
    color: "#9f7aea",
  },
  {
    id: "word-flash",
    name: "Flash de Palabras",
    description: "Aprende 5 palabras nuevas con la Seño Sofía",
    icon: "⚡",
    minPhase: 1,
    color: "#e53e3e",
  },
  {
    id: "word-image-match",
    name: "Empareja Palabra-Imagen",
    description: "Toca la imagen que corresponde a la palabra",
    icon: "🖼️",
    minPhase: 1,
    color: "#3182ce",
  },
  {
    id: "memory-cards",
    name: "Rompecabezas",
    description: "Arma la palabra tocando las sílabas en orden",
    icon: "🧩",
    minPhase: 1,
    color: "#805ad5",
  },
  {
    id: "word-train",
    name: "Tren de Palabras",
    description: "Toca el vagón correcto antes de que pase",
    icon: "🚂",
    minPhase: 1,
    color: "#38a169",
  },
  {
    id: "phrase-builder",
    name: "Construye la Frase",
    description: "Arrastra palabras para formar frases",
    icon: "🧱",
    minPhase: 2,
    color: "#d69e2e",
  },
  {
    id: "word-rain",
    name: "Lluvia de Palabras",
    description: "Atrapa la palabra correcta antes de que caiga",
    icon: "🌧️",
    minPhase: 1,
    color: "#4299e1",
  },
  // Cuenta Cuentos removed — the stories were word lists that
  // didn't form coherent narratives with the limited vocabulary.
  // Cuenta Cuentos removed — the stories were word lists that
  // didn't form coherent narratives with the limited vocabulary.
  {
    id: "category-sort",
    name: "Categorías",
    description: "Clasifica palabras en su categoría correcta",
    icon: "🗂️",
    minPhase: 1,
    color: "#667eea",
  },
  {
    id: "word-fishing",
    name: "Pesca de Palabras",
    description: "Pesca la palabra correcta del mar",
    icon: "🎣",
    minPhase: 1,
    color: "#0bc5ea",
  },
  {
    id: "daily-bits",
    name: "Burbujas Magicas",
    description: "Revienta la burbuja con la palabra correcta",
    icon: "🫧",
    minPhase: 1,
    color: "#f093fb",
  },
];
