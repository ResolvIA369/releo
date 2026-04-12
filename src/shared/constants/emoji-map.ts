// Dynamic date label for hoy/mañana/ayer (real date in Spanish).
// Computed once at module load; stale after midnight but that's
// fine for a kids' app session.
function spanishDate(offset: number): string {
  try {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `📅 ${d.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`;
  } catch {
    return "📅";
  }
}

export const EMOJI_MAP: Record<string, string> = {
  // ─── Phase 1: Palabras Sencillas ─────────────────────────────────
  // Familia
  mamá: "👩", papá: "👨", bebé: "👶", abuela: "👵", abuelo: "👴",
  hermano: "👦", hermana: "👧", tío: "👨", tía: "👩", primo: "👦",
  // Cuerpo
  mano: "🙋", pie: "🦶", ojo: "👁️", nariz: "👃", boca: "👄",
  oreja: "👂", pelo: "💇", dedo: "☝️", brazo: "💪", pierna: "🦵",
  // Casa
  casa: "🏠", mesa: "🍽️", silla: "🪑", cama: "🛏️", puerta: "🚪",
  ventana: "🪟", cocina: "🧑‍🍳", baño: "🚿", piso: "🟫", techo: "🛖",
  // Animales
  perro: "🐶", gato: "🐱", caballo: "🐴", vaca: "🐮", pájaro: "🐦",
  pez: "🐟", pato: "🦆", conejo: "🐰", ratón: "🐭", oso: "🐻", pollo: "🐔",
  // Comida
  agua: "💧", leche: "🥛", pan: "🍞", arroz: "🍚", huevo: "🥚",
  manzana: "🍎", banana: "🍌", uva: "🍇", pera: "🍐", naranja: "🍊",
  sopa: "🍲", jugo: "🧃", queso: "🧀",

  // ─── Phase 2: Parejas de Palabras ────────────────────────────────
  // Colores
  rojo: "🔴", azul: "🔵", verde: "🟢", amarillo: "🟡", blanco: "🤍",
  negro: "⚫", rosa: "🩷", violeta: "🟣", marrón: "🟤",
  // Tamaños y Formas
  grande: "🐘", pequeño: "🐜", largo: "🦒", corto: "✂️", alto: "🦒",
  bajo: "🐢", gordo: "🎈", flaco: "🪡", redondo: "⚽", cuadrado: "🟧",
  // Opuestos
  arriba: "⬆️", abajo: "⬇️", dentro: "📦", fuera: "🌤️", cerca: "🤏",
  lejos: "🔭", rápido: "🐆", lento: "🐌", caliente: "🔥", frío: "🧊",
  // Emociones
  feliz: "😄", triste: "😢", enojado: "😠", asustado: "😨",
  cansado: "😴", contento: "😊", tranquilo: "😌", sorprendido: "😲",
  valiente: "🦸", amable: "🤗",
  // Naturaleza
  sol: "☀️", luna: "🌙", estrella: "⭐", nube: "☁️", lluvia: "🌧️",
  árbol: "🌳", flor: "🌺", río: "🏞️", mar: "🌊", montaña: "⛰️",

  // ─── Phase 3: Oraciones Sencillas ────────────────────────────────
  // Verbos Cotidianos
  come: "🍽️", bebe: "🥤", duerme: "😴", juega: "🎮", corre: "🏃",
  salta: "🤾", lee: "📖", escribe: "✍️", canta: "🎤", baila: "💃",
  // Verbos de Acción
  abre: "🔓", cierra: "🔒", sube: "🧗", baja: "🪜", toca: "👆",
  lava: "🧼", limpia: "🧹", pinta: "🎨", dibuja: "✏️",
  // Ropa
  camisa: "👔", pantalón: "👖", zapato: "👞", gorra: "🧢", pollera: "🥻",
  media: "🧦", vestido: "👗", abrigo: "🧥", bufanda: "🧣", piyama: "😴",
  // Escuela
  libro: "📖", lápiz: "✏️", papel: "📄", tijeras: "✂️", pegamento: "🪥",
  mochila: "🎒", maestra: "👩‍🏫", amigo: "👦👦", clase: "📚", recreo: "🛝",
  // Lugares
  parque: "🎡", tienda: "🛍️", escuela: "🏫", hospital: "🏥", iglesia: "⛪",
  playa: "🏖️", campo: "🌿🌾", ciudad: "🏙️", calle: "🚶🚗", jardín: "🌻🌺",

  // ─── Phase 4: Frases Completas ───────────────────────────────────
  // Artículos y Conectores
  // el/la/los/las → personas (masc/fem, sing/plur)
  // un/una/unos/unas → objetos contables (1 vs 2)
  el: "👨", la: "👩", los: "👬", las: "👭", un: "☝️",
  una: "☝️", unos: "🚗🌳", unas: "🌺🏠", y: "🔗", con: "🤝",
  // Preposiciones
  // en: dentro de, de: posesión, por: a través de, para: dar a alguien,
  // sobre: encima de, entre: en medio, hasta: meta, desde: punto de origen,
  // sin: ausencia/negación, hacia: dirección
  en: "📦", de: "🤲", por: "🛤️", para: "🎁", sobre: "🔝",
  entre: "🫂", hasta: "🏁", desde: "🚦", sin: "🚫", hacia: "➡️",
  // Pronombres — mi/tu/su = posesión (cerca/intermedio/lejos)
  yo: "🙋", tú: "🫵", él: "👦", ella: "👧", nosotros: "👨‍👩‍👧‍👦",
  mi: "🤲", tu: "👉", su: "👤",
  // Demostrativos: este (cerca) vs ese (lejos)
  este: "👇", ese: "👉",
  // Tiempo — fechas reales en español (calculadas al cargar el módulo)
  hoy: spanishDate(0), mañana: spanishDate(1), ayer: spanishDate(-1),
  ahora: "⏰", después: "⏩",
  antes: "⏪", siempre: "♾️", nunca: "🚫", pronto: "⏳", tarde: "🌇",
  // Números — cantidad: 1-5 con puntos, 6-10 = mano(5) + puntos extra
  uno: "🔴", dos: "🔴🔴", tres: "🔴🔴🔴", cuatro: "🔴🔴🔴🔴", cinco: "🖐️",
  seis: "🖐️🔴", siete: "🖐️🔴🔴", ocho: "🖐️🔴🔴🔴",
  nueve: "🖐️🔴🔴🔴🔴", diez: "🖐️🖐️",

  // ─── Phase 5: Cuentos Cortos ─────────────────────────────────────
  // Verbos Avanzados
  quiere: "💖", puede: "💪", sabe: "🧠", tiene: "🎁", hace: "🔨",
  dice: "💬", viene: "🚶", sale: "🚪", llega: "🏠", busca: "🔍",
  // Adverbios — aquí/allí distancia, solo = persona sola, junto = pareja
  muy: "💯", más: "➕", menos: "➖", bien: "👍", mal: "👎",
  aquí: "👇", allí: "👉", también: "➕", solo: "🧍", junto: "🤝",
};

export function getEmoji(word: string): string {
  return EMOJI_MAP[word] ?? "❓";
}
