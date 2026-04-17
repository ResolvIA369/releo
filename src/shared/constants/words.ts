import {
  DomanWord,
  PhaseNumber,
  PhaseName,
  WordCategory,
  FontColor,
  WordPairExample,
  SentenceExample,
  DomanStory,
} from "../types/doman";

// ─── Affirmation pool (cycled across words) ────────────────────────────

const AFFIRMATION_POOL = [
  "Yo soy importante",
  "Yo amo quien soy",
  "Soy valioso",
  "Me quiero tal y como soy",
  "Yo soy único y especial",
  "No hay nadie como yo en el mundo",
  "Estoy orgulloso de ser yo",
  "Merezco amor y respeto",
  "Soy suficiente tal como soy",
  "Yo creo en mí",
  "Yo soy inteligente",
  "Soy capaz de aprender cosas nuevas",
  "Puedo hacerlo si lo intento",
  "Cada día aprendo algo nuevo",
  "Soy valiente",
  "Confío en mis habilidades",
  "Lo intento y lo logro",
  "Soy bueno resolviendo problemas",
  "Hay muchas personas que se preocupan por mí",
  "Soy querido por mi familia",
  "Mis amigos me aprecian",
  "Siempre puedo pedir ayuda",
  "Soy un buen amigo",
  "Trato a los demás con respeto",
  "Comparto con alegría",
  "Me encanta aprender a leer",
  "Cada palabra que leo me hace más fuerte",
  "Leer me abre puertas a nuevos mundos",
  "Disfruto practicar todos los días",
  "Cada intento me acerca más a mi meta",
  "Me siento orgulloso de mi progreso",
  "Aprender es divertido",
  "Soy un gran lector",
  "Los errores me ayudan a mejorar",
];

// ─── Helper to build words ─────────────────────────────────────────────

interface WordDef {
  text: string;
  category: WordCategory;
  categoryDisplay: string;
  phase: PhaseNumber;
  phaseName: PhaseName;
  fontColor: FontColor;
  fontSizeCm: number;
}

let _affIdx = 0;
function nextAffirmation(): string {
  const a = AFFIRMATION_POOL[_affIdx % AFFIRMATION_POOL.length];
  _affIdx++;
  return a;
}

function buildWords(defs: Omit<WordDef, "phase" | "phaseName" | "fontColor" | "fontSizeCm">[],
  phase: PhaseNumber,
  phaseName: PhaseName,
  fontColor: FontColor,
  fontSizeCm: number,
  prefix: string
): DomanWord[] {
  return defs.map((d, i) => ({
    id: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    text: d.text,
    phase,
    phaseName,
    category: d.category,
    categoryDisplay: d.categoryDisplay,
    fontColor,
    fontSizeCm,
    audioUrl: "",
    imageUrl: "",
    affirmation: nextAffirmation(),
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// FASE 1 — Palabras Sencillas (50 palabras, letra ROJA, 12.5cm)
// ═══════════════════════════════════════════════════════════════════════

export const PHASE1_WORDS: DomanWord[] = buildWords(
  [
    // Sesión 1: Familia 1
    { text: "mamá", category: "familia", categoryDisplay: "Familia" },
    { text: "papá", category: "familia", categoryDisplay: "Familia" },
    { text: "bebé", category: "familia", categoryDisplay: "Familia" },
    { text: "abuela", category: "familia", categoryDisplay: "Familia" },
    { text: "abuelo", category: "familia", categoryDisplay: "Familia" },
    // Sesión 2: Familia 2
    { text: "hermano", category: "familia", categoryDisplay: "Familia" },
    { text: "hermana", category: "familia", categoryDisplay: "Familia" },
    { text: "tío", category: "familia", categoryDisplay: "Familia" },
    { text: "tía", category: "familia", categoryDisplay: "Familia" },
    { text: "primo", category: "familia", categoryDisplay: "Familia" },
    // Sesión 3: Colores
    { text: "rojo", category: "colores", categoryDisplay: "Colores" },
    { text: "azul", category: "colores", categoryDisplay: "Colores" },
    { text: "verde", category: "colores", categoryDisplay: "Colores" },
    { text: "amarillo", category: "colores", categoryDisplay: "Colores" },
    { text: "blanco", category: "colores", categoryDisplay: "Colores" },
    // Sesión 4: Animales
    { text: "perro", category: "animales", categoryDisplay: "Animales" },
    { text: "gato", category: "animales", categoryDisplay: "Animales" },
    { text: "caballo", category: "animales", categoryDisplay: "Animales" },
    { text: "vaca", category: "animales", categoryDisplay: "Animales" },
    { text: "pájaro", category: "animales", categoryDisplay: "Animales" },
    // Sesión 5: Frutas
    { text: "manzana", category: "comida", categoryDisplay: "Frutas" },
    { text: "banana", category: "comida", categoryDisplay: "Frutas" },
    { text: "uva", category: "comida", categoryDisplay: "Frutas" },
    { text: "pera", category: "comida", categoryDisplay: "Frutas" },
    { text: "naranja", category: "comida", categoryDisplay: "Frutas" },
    // Sesión 6: Mi Casa
    { text: "ventana", category: "casa", categoryDisplay: "Casa" },
    { text: "cocina", category: "casa", categoryDisplay: "Casa" },
    { text: "baño", category: "casa", categoryDisplay: "Casa" },
    { text: "piso", category: "casa", categoryDisplay: "Casa" },
    { text: "techo", category: "casa", categoryDisplay: "Casa" },
    // Sesión 7: Mi Cara
    { text: "mano", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "pie", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "ojo", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "nariz", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "boca", category: "cuerpo", categoryDisplay: "Cuerpo" },
    // Sesión 8: Mi Cuerpo
    { text: "oreja", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "pelo", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "dedo", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "brazo", category: "cuerpo", categoryDisplay: "Cuerpo" },
    { text: "pierna", category: "cuerpo", categoryDisplay: "Cuerpo" },
    // Sesión 9: Comida
    { text: "agua", category: "comida", categoryDisplay: "Comida" },
    { text: "leche", category: "comida", categoryDisplay: "Comida" },
    { text: "pan", category: "comida", categoryDisplay: "Comida" },
    { text: "arroz", category: "comida", categoryDisplay: "Comida" },
    { text: "huevo", category: "comida", categoryDisplay: "Comida" },
    // Sesión 10: Mi Casa 2
    { text: "casa", category: "casa", categoryDisplay: "Casa" },
    { text: "mesa", category: "casa", categoryDisplay: "Casa" },
    { text: "silla", category: "casa", categoryDisplay: "Casa" },
    { text: "cama", category: "casa", categoryDisplay: "Casa" },
    { text: "puerta", category: "casa", categoryDisplay: "Casa" },
  ],
  1, "Palabras Sencillas", "red", 12.5, "p1"
);

// ═══════════════════════════════════════════════════════════════════════
// FASE 2 — Parejas de Palabras (50 palabras, letra NEGRA, 10cm)
// ═══════════════════════════════════════════════════════════════════════

export const PHASE2_WORDS: DomanWord[] = buildWords(
  [
    // colores (10)
    { text: "rojo", category: "colores", categoryDisplay: "Colores" },
    { text: "azul", category: "colores", categoryDisplay: "Colores" },
    { text: "verde", category: "colores", categoryDisplay: "Colores" },
    { text: "amarillo", category: "colores", categoryDisplay: "Colores" },
    { text: "blanco", category: "colores", categoryDisplay: "Colores" },
    { text: "negro", category: "colores", categoryDisplay: "Colores" },
    { text: "rosa", category: "colores", categoryDisplay: "Colores" },
    { text: "naranja", category: "colores", categoryDisplay: "Colores" },
    { text: "violeta", category: "colores", categoryDisplay: "Colores" },
    { text: "marrón", category: "colores", categoryDisplay: "Colores" },
    // tamaños y formas (10)
    { text: "grande", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "pequeño", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "largo", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "corto", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "alto", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "bajo", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "gordo", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "flaco", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "redondo", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    { text: "cuadrado", category: "tamaños_y_formas", categoryDisplay: "Tamaños y Formas" },
    // opuestos (10)
    { text: "arriba", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "abajo", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "dentro", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "fuera", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "cerca", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "lejos", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "rápido", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "lento", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "caliente", category: "opuestos", categoryDisplay: "Opuestos" },
    { text: "frío", category: "opuestos", categoryDisplay: "Opuestos" },
    // emociones (10)
    { text: "feliz", category: "emociones", categoryDisplay: "Emociones" },
    { text: "triste", category: "emociones", categoryDisplay: "Emociones" },
    { text: "enojado", category: "emociones", categoryDisplay: "Emociones" },
    { text: "asustado", category: "emociones", categoryDisplay: "Emociones" },
    { text: "cansado", category: "emociones", categoryDisplay: "Emociones" },
    { text: "contento", category: "emociones", categoryDisplay: "Emociones" },
    { text: "tranquilo", category: "emociones", categoryDisplay: "Emociones" },
    { text: "sorprendido", category: "emociones", categoryDisplay: "Emociones" },
    { text: "valiente", category: "emociones", categoryDisplay: "Emociones" },
    { text: "amable", category: "emociones", categoryDisplay: "Emociones" },
    // naturaleza (10)
    { text: "sol", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "luna", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "estrella", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "nube", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "lluvia", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "árbol", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "flor", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "río", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "mar", category: "naturaleza", categoryDisplay: "Naturaleza" },
    { text: "montaña", category: "naturaleza", categoryDisplay: "Naturaleza" },
  ],
  2, "Parejas de Palabras", "black", 10, "p2"
);

// ═══════════════════════════════════════════════════════════════════════
// FASE 3 — Oraciones Sencillas (50 palabras, letra negra, 7.5cm)
// ═══════════════════════════════════════════════════════════════════════

export const PHASE3_WORDS: DomanWord[] = buildWords(
  [
    // verbos cotidianos (10)
    { text: "come", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "bebe", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "duerme", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "juega", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "corre", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "salta", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "lee", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "escribe", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "canta", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    { text: "baila", category: "verbos_cotidianos", categoryDisplay: "Verbos Cotidianos" },
    // verbos de acción (10)
    { text: "abre", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "cierra", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "sube", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "baja", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "toca", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "lava", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "cocina", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "limpia", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "pinta", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    { text: "dibuja", category: "verbos_de_accion", categoryDisplay: "Verbos de Acción" },
    // ropa (10)
    { text: "camisa", category: "ropa", categoryDisplay: "Ropa" },
    { text: "pantalón", category: "ropa", categoryDisplay: "Ropa" },
    { text: "zapato", category: "ropa", categoryDisplay: "Ropa" },
    { text: "gorra", category: "ropa", categoryDisplay: "Ropa" },
    { text: "pollera", category: "ropa", categoryDisplay: "Ropa" },
    { text: "media", category: "ropa", categoryDisplay: "Ropa" },
    { text: "vestido", category: "ropa", categoryDisplay: "Ropa" },
    { text: "abrigo", category: "ropa", categoryDisplay: "Ropa" },
    { text: "bufanda", category: "ropa", categoryDisplay: "Ropa" },
    { text: "piyama", category: "ropa", categoryDisplay: "Ropa" },
    // escuela (10)
    { text: "libro", category: "escuela", categoryDisplay: "Escuela" },
    { text: "lápiz", category: "escuela", categoryDisplay: "Escuela" },
    { text: "papel", category: "escuela", categoryDisplay: "Escuela" },
    { text: "tijeras", category: "escuela", categoryDisplay: "Escuela" },
    { text: "pegamento", category: "escuela", categoryDisplay: "Escuela" },
    { text: "mochila", category: "escuela", categoryDisplay: "Escuela" },
    { text: "maestra", category: "escuela", categoryDisplay: "Escuela" },
    { text: "amigo", category: "escuela", categoryDisplay: "Escuela" },
    { text: "clase", category: "escuela", categoryDisplay: "Escuela" },
    { text: "recreo", category: "escuela", categoryDisplay: "Escuela" },
    // lugares (10)
    { text: "parque", category: "lugares", categoryDisplay: "Lugares" },
    { text: "tienda", category: "lugares", categoryDisplay: "Lugares" },
    { text: "escuela", category: "lugares", categoryDisplay: "Lugares" },
    { text: "hospital", category: "lugares", categoryDisplay: "Lugares" },
    { text: "iglesia", category: "lugares", categoryDisplay: "Lugares" },
    { text: "playa", category: "lugares", categoryDisplay: "Lugares" },
    { text: "campo", category: "lugares", categoryDisplay: "Lugares" },
    { text: "ciudad", category: "lugares", categoryDisplay: "Lugares" },
    { text: "calle", category: "lugares", categoryDisplay: "Lugares" },
    { text: "jardín", category: "lugares", categoryDisplay: "Lugares" },
  ],
  3, "Oraciones Sencillas", "black", 7.5, "p3"
);

// ═══════════════════════════════════════════════════════════════════════
// FASE 4 — Frases Completas (50 palabras, letra negra, 5cm)
// ═══════════════════════════════════════════════════════════════════════

export const PHASE4_WORDS: DomanWord[] = buildWords(
  [
    // artículos y conectores (10)
    { text: "el", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "la", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "los", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "las", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "un", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "una", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "unos", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "unas", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "y", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    { text: "con", category: "articulos_y_conectores", categoryDisplay: "Artículos y Conectores" },
    // preposiciones (10)
    { text: "en", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "de", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "por", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "para", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "sobre", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "entre", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "hasta", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "desde", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "sin", category: "preposiciones", categoryDisplay: "Preposiciones" },
    { text: "hacia", category: "preposiciones", categoryDisplay: "Preposiciones" },
    // pronombres (10)
    { text: "yo", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "tú", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "él", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "ella", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "nosotros", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "mi", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "tu", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "su", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "este", category: "pronombres", categoryDisplay: "Pronombres" },
    { text: "ese", category: "pronombres", categoryDisplay: "Pronombres" },
    // tiempo (10)
    { text: "hoy", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "mañana", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "ayer", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "ahora", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "después", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "antes", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "siempre", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "nunca", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "pronto", category: "tiempo", categoryDisplay: "Tiempo" },
    { text: "tarde", category: "tiempo", categoryDisplay: "Tiempo" },
    // números (10)
    { text: "uno", category: "numeros", categoryDisplay: "Números" },
    { text: "dos", category: "numeros", categoryDisplay: "Números" },
    { text: "tres", category: "numeros", categoryDisplay: "Números" },
    { text: "cuatro", category: "numeros", categoryDisplay: "Números" },
    { text: "cinco", category: "numeros", categoryDisplay: "Números" },
    { text: "seis", category: "numeros", categoryDisplay: "Números" },
    { text: "siete", category: "numeros", categoryDisplay: "Números" },
    { text: "ocho", category: "numeros", categoryDisplay: "Números" },
    { text: "nueve", category: "numeros", categoryDisplay: "Números" },
    { text: "diez", category: "numeros", categoryDisplay: "Números" },
  ],
  4, "Frases Completas", "black", 5, "p4"
);

// ═══════════════════════════════════════════════════════════════════════
// FASE 5 — Cuentos Cortos (20 palabras, letra negra, 3.5cm)
// ═══════════════════════════════════════════════════════════════════════

export const PHASE5_WORDS: DomanWord[] = buildWords(
  [
    // verbos avanzados (10)
    { text: "quiere", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "puede", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "sabe", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "tiene", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "hace", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "dice", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "viene", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "sale", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "llega", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    { text: "busca", category: "verbos_avanzados", categoryDisplay: "Verbos Avanzados" },
    // adverbios (10)
    { text: "muy", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "más", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "menos", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "bien", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "mal", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "aquí", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "allí", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "también", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "solo", category: "adverbios", categoryDisplay: "Adverbios" },
    { text: "junto", category: "adverbios", categoryDisplay: "Adverbios" },
  ],
  5, "Cuentos Cortos", "black", 3.5, "p5"
);

// ═══════════════════════════════════════════════════════════════════════
// ALL WORDS — Combined corpus (220 words)
// ═══════════════════════════════════════════════════════════════════════

export const ALL_WORDS: DomanWord[] = [
  ...PHASE1_WORDS,
  ...PHASE2_WORDS,
  ...PHASE3_WORDS,
  ...PHASE4_WORDS,
  ...PHASE5_WORDS,
];

// ═══════════════════════════════════════════════════════════════════════
// PAREJAS EJEMPLO — Fase 2
// ═══════════════════════════════════════════════════════════════════════

export const WORD_PAIR_EXAMPLES: WordPairExample[] = [
  { displayText: "perro grande", words: ["perro", "grande"] },
  { displayText: "gato pequeño", words: ["gato", "pequeño"] },
  { displayText: "manzana roja", words: ["manzana", "roja"] },
  { displayText: "sol amarillo", words: ["sol", "amarillo"] },
  { displayText: "ojo azul", words: ["ojo", "azul"] },
  { displayText: "flor rosa", words: ["flor", "rosa"] },
  { displayText: "nube blanca", words: ["nube", "blanca"] },
  { displayText: "oso marrón", words: ["oso", "marrón"] },
  { displayText: "leche fría", words: ["leche", "fría"] },
  { displayText: "sopa caliente", words: ["sopa", "caliente"] },
  { displayText: "casa grande", words: ["casa", "grande"] },
  { displayText: "pez pequeño", words: ["pez", "pequeño"] },
];

// ═══════════════════════════════════════════════════════════════════════
// ORACIONES EJEMPLO — Fase 3
// ═══════════════════════════════════════════════════════════════════════

export const SENTENCE_EXAMPLES: SentenceExample[] = [
  // ─── Phase 1: Familia + casa + cuerpo + animales + comida ────
  { fullText: "mamá y papá", phase: 1 },
  { fullText: "abuela y abuelo", phase: 1 },
  { fullText: "hermano y hermana", phase: 1 },
  { fullText: "perro y gato", phase: 1 },
  { fullText: "mano y pie", phase: 1 },
  { fullText: "ojo y nariz", phase: 1 },
  { fullText: "pan con leche", phase: 1 },
  { fullText: "agua y huevo", phase: 1 },
  { fullText: "mesa y silla", phase: 1 },
  { fullText: "casa y puerta", phase: 1 },
  { fullText: "manzana y banana", phase: 1 },
  { fullText: "uva y pera", phase: 1 },

  // ─── Phase 2: Colores + tamaños + opuestos + emociones + naturaleza ──
  { fullText: "rojo y azul", phase: 2 },
  { fullText: "grande y pequeño", phase: 2 },
  { fullText: "arriba y abajo", phase: 2 },
  { fullText: "feliz y contento", phase: 2 },
  { fullText: "sol y luna", phase: 2 },
  { fullText: "rápido y lento", phase: 2 },
  { fullText: "caliente y frío", phase: 2 },
  { fullText: "cerca y lejos", phase: 2 },
  { fullText: "dentro y fuera", phase: 2 },
  { fullText: "árbol y flor", phase: 2 },
  { fullText: "estrella y nube", phase: 2 },
  { fullText: "río y mar", phase: 2 },

  // ─── Phase 3: Verbos + ropa + escuela + lugares ──────────────
  { fullText: "mamá come pan", phase: 3 },
  { fullText: "papá lee libro", phase: 3 },
  { fullText: "el perro corre", phase: 3 },
  { fullText: "bebé duerme", phase: 3 },
  { fullText: "gato bebe leche", phase: 3 },
  { fullText: "hermana canta", phase: 3 },
  { fullText: "abuela cocina", phase: 3 },
  { fullText: "hermano dibuja", phase: 3 },
  { fullText: "mamá abre puerta", phase: 3 },
  { fullText: "papá baja", phase: 3 },
  { fullText: "camisa y pantalón", phase: 3 },
  { fullText: "zapato y gorra", phase: 3 },
  { fullText: "libro y lápiz", phase: 3 },
  { fullText: "escuela y parque", phase: 3 },
  { fullText: "mamá lava plato", phase: 3 },
  { fullText: "hermana pinta", phase: 3 },
  { fullText: "niño salta", phase: 3 },
  { fullText: "ella baila", phase: 3 },
  { fullText: "él escribe", phase: 3 },
  { fullText: "mamá limpia casa", phase: 3 },

  // ─── Phase 4: Artículos + preposiciones + pronombres + tiempo + números ──
  { fullText: "el gato y la gata", phase: 4 },
  { fullText: "un perro grande", phase: 4 },
  { fullText: "yo y tú", phase: 4 },
  { fullText: "hoy y mañana", phase: 4 },
  { fullText: "uno dos tres", phase: 4 },
  { fullText: "en la casa", phase: 4 },
  { fullText: "para mi mamá", phase: 4 },
  { fullText: "sobre la mesa", phase: 4 },
  { fullText: "entre tú y yo", phase: 4 },
  { fullText: "sin zapatos", phase: 4 },
  { fullText: "cuatro y cinco", phase: 4 },
  { fullText: "siempre y nunca", phase: 4 },

  // ─── Phase 5: Verbos avanzados + adverbios ───────────────────
  { fullText: "quiere y puede", phase: 5 },
  { fullText: "muy bien", phase: 5 },
  { fullText: "dice y busca", phase: 5 },
  { fullText: "aquí y allí", phase: 5 },
  { fullText: "más y menos", phase: 5 },
  { fullText: "también junto", phase: 5 },
];

// ═══════════════════════════════════════════════════════════════════════
// FRASES EJEMPLO — Fase 4
// ═══════════════════════════════════════════════════════════════════════

export const PHRASE_EXAMPLES: SentenceExample[] = [
  { fullText: "el gato juega con la pelota", phase: 4 },
  { fullText: "la niña come una manzana roja", phase: 4 },
  { fullText: "mi mamá cocina en la cocina", phase: 4 },
  { fullText: "el perro grande corre en el parque", phase: 4 },
  { fullText: "yo leo un libro con mi papá", phase: 4 },
  { fullText: "la abuela y el abuelo están en casa", phase: 4 },
  { fullText: "tres gatos duermen sobre la cama", phase: 4 },
  { fullText: "ella dibuja una flor amarilla", phase: 4 },
];

// ═══════════════════════════════════════════════════════════════════════
// CUENTOS EJEMPLO — Fase 5
// ═══════════════════════════════════════════════════════════════════════

export const STORY_EXAMPLES: DomanStory[] = [
  {
    id: "story-01",
    title: "El perro y la pelota",
    wordCount: 42,
    difficulty: "easy",
    pages: [
      { text: "Mi perro se llama Sol.", audioUrl: "", imageUrl: "", highlightWords: ["perro", "Sol"] },
      { text: "Sol es grande y marrón.", audioUrl: "", imageUrl: "", highlightWords: ["grande", "marrón"] },
      { text: "A Sol le gusta jugar con la pelota roja.", audioUrl: "", imageUrl: "", highlightWords: ["jugar", "pelota", "roja"] },
      { text: "Un día la pelota se fue al río.", audioUrl: "", imageUrl: "", highlightWords: ["pelota", "río"] },
      { text: "Sol corrió muy rápido y la encontró.", audioUrl: "", imageUrl: "", highlightWords: ["rápido", "encontró"] },
      { text: "Sol es un perro muy valiente.", audioUrl: "", imageUrl: "", highlightWords: ["perro", "valiente"] },
    ],
  },
  {
    id: "story-02",
    title: "La estrella de mamá",
    wordCount: 40,
    difficulty: "easy",
    pages: [
      { text: "Yo quiero mucho a mi mamá.", audioUrl: "", imageUrl: "", highlightWords: ["quiero", "mamá"] },
      { text: "Ella me lee un cuento antes de dormir.", audioUrl: "", imageUrl: "", highlightWords: ["lee", "cuento", "dormir"] },
      { text: "Mi cuento favorito es el de la estrella.", audioUrl: "", imageUrl: "", highlightWords: ["cuento", "estrella"] },
      { text: "La estrella brilla en la noche.", audioUrl: "", imageUrl: "", highlightWords: ["estrella", "brilla"] },
      { text: "Mamá dice que yo soy su estrella.", audioUrl: "", imageUrl: "", highlightWords: ["mamá", "dice", "estrella"] },
      { text: "Yo también la quiero mucho.", audioUrl: "", imageUrl: "", highlightWords: ["también", "quiero"] },
    ],
  },
  {
    id: "story-03",
    title: "El jardín de la abuela",
    wordCount: 48,
    difficulty: "medium",
    pages: [
      { text: "Mi abuela tiene un jardín muy bonito.", audioUrl: "", imageUrl: "", highlightWords: ["abuela", "jardín"] },
      { text: "En el jardín hay flores rojas y amarillas.", audioUrl: "", imageUrl: "", highlightWords: ["flores", "rojas", "amarillas"] },
      { text: "También hay un árbol grande con pájaros.", audioUrl: "", imageUrl: "", highlightWords: ["árbol", "grande", "pájaros"] },
      { text: "Yo ayudo a la abuela a regar las flores.", audioUrl: "", imageUrl: "", highlightWords: ["ayudo", "abuela", "flores"] },
      { text: "Después ella me da jugo de naranja.", audioUrl: "", imageUrl: "", highlightWords: ["jugo", "naranja"] },
      { text: "Me gusta ir al jardín de la abuela.", audioUrl: "", imageUrl: "", highlightWords: ["jardín", "abuela"] },
    ],
  },
];
