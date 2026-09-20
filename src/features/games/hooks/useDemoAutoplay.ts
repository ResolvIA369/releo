import { useEffect, useRef } from "react";

/**
 * Multiplicador global de los tiempos del modo demo. 1 = ritmo normal
 * (default). Menor a 1 acelera (para iterar rápido), mayor a 1 ralentiza
 * (para que la lectura se note más en video). Se setea una sola vez desde
 * /demo (ver src/app/demo/page.tsx, lee ?demoSpeed= de la URL) — no es
 * estado de React porque lo necesitan hooks en componentes de juego que no
 * tienen forma limpia de recibir props hasta el fondo del árbol.
 */
let demoSpeedMul = 1;
export function setDemoSpeedMul(mul: number) {
  demoSpeedMul = Number.isFinite(mul) && mul > 0 ? mul : 1;
}
export function getDemoSpeedMul() {
  return demoSpeedMul;
}

/**
 * +-30% de variación aleatoria y el multiplicador de velocidad, para que no
 * todas las esperas duren igual. Exportada para los juegos de movimiento
 * (LeoRunner, WordRain, WordTrain, BitsReading, WordFishing) que arman su
 * propio `useEffect`/`setTimeout` en vez de usar `useDemoAutoplay` — ahí
 * necesitan el mismo jitter sin pasar por el hook genérico.
 */
export function demoJitter(ms: number): number {
  const factor = 0.7 + Math.random() * 0.6; // 0.7x .. 1.3x
  return Math.round(ms * factor * demoSpeedMul);
}
const jitter = demoJitter;

/**
 * Ritmo de la duda VISIBLE (lectura antes de dudar + el tramo de duda en
 * si). CONECTADO a demoSpeedMul/`?demoSpeed=` — sep-2026: el selector de
 * /demo dice "1.5x — lento (video)" y "2x — bien lento (video)"; si esos
 * valores no estiraban la duda, el control decia una cosa y hacia otra.
 * El selector es el control unico de ritmo del demo; `demoHesitationPaceMul`
 * (via `?demoHesitatePace=`) queda como ajuste fino ENCIMA del selector,
 * para casos puntuales por URL.
 *
 * El piso (1.5s de duda, ~2s total) es un MINIMO, no se achica nunca: un
 * demoSpeed < 1 ("0.5x — rapido, probar") no puede volver a esconder la
 * duda, por eso la parte que viene del selector se clampea a >=1 antes de
 * multiplicar. >1 (1.5x, 2x) si estira proporcionalmente, como el resto
 * del autoplay.
 *
 * Un jitter simetrico (como demoJitter) no sirve aca porque puede caer
 * por debajo del piso pedido; estas dos funciones usan piso + variacion
 * encima, nunca por debajo del piso.
 */
let demoHesitationPaceMul = 1;
export function setDemoHesitationPaceMul(mul: number) {
  demoHesitationPaceMul = Number.isFinite(mul) && mul > 0 ? mul : 1;
}
export function getDemoHesitationPaceMul() {
  return demoHesitationPaceMul;
}

function hesitationMul(): number {
  return Math.max(1, demoSpeedMul) * demoHesitationPaceMul;
}

// Piso + rango de demoReadingPause/demoHesitationDwell — una sola fuente
// para el sorteo Y para el peor caso determinista (demoDecisionWindowMs),
// asi no se desincronizan si algun dia se retocan estos numeros.
const READING_PAUSE_FLOOR_MS = 1700;
const READING_PAUSE_RANGE_MS = 600;
const HESITATION_DWELL_FLOOR_MS = 1500;
const HESITATION_DWELL_RANGE_MS = 700;
// 2 viajes (ver TRAVEL_MS en useDemoCursor) + el delay de "toque" antes
// del click — no escala con el ritmo, es la mecanica del cursor, que no
// se toca (ver CLAUDE.md de esta sesion).
const CURSOR_FIXED_OVERHEAD_MS = 2 * 220 + 120;

// Pausa de "lectura" entre que la palabra aparece y arranca la duda.
// Piso 1700ms: sumado al camino directo del cursor (~340ms de viaje +
// toque, ver useDemoCursor), el total nunca baja de ~2000ms aunque esa
// tanda no tenga duda visible.
export function demoReadingPause(): number {
  return Math.round((READING_PAUSE_FLOOR_MS + Math.random() * READING_PAUSE_RANGE_MS) * hesitationMul());
}

// Cuanto se queda el cursor sobre la palabra incorrecta durante la duda.
// Piso 1500ms — el minimo pedido para que se note en video.
export function demoHesitationDwell(): number {
  return Math.round((HESITATION_DWELL_FLOOR_MS + Math.random() * HESITATION_DWELL_RANGE_MS) * hesitationMul());
}

/**
 * Peor caso DETERMINISTA (sin aleatoriedad) de cuanto puede tardar una
 * eleccion completa con el cursor (usePreGameIntro/WordRain y los que se
 * sumen despues): lectura + duda + los dos viajes + el toque, todos en su
 * maximo. Sep-2026: a "2x — bien lento (video)" el demo perdia la palabra
 * en la mitad de las rondas porque la caida no crecia junto con la duda —
 * la duda se comia la ventana. Los juegos con ventana de tiempo (Lluvia,
 * Pesca, Burbujas, Tren, Leo Vuela, Salta la Palabra) tienen que estirar
 * su propia ventana (caida, nado, cuenta regresiva, cruce de carril) EN
 * MODO DEMO a por lo menos esto — nunca en juego real.
 */
export function demoDecisionWindowMs(): number {
  const mul = hesitationMul();
  const worstReadingPause = (READING_PAUSE_FLOOR_MS + READING_PAUSE_RANGE_MS) * mul;
  const worstHesitationDwell = (HESITATION_DWELL_FLOOR_MS + HESITATION_DWELL_RANGE_MS) * mul;
  return worstReadingPause + worstHesitationDwell + CURSOR_FIXED_OVERHEAD_MS;
}

/**
 * Mismo peor caso pero para la duda de PERSONAJE (demoHesitateMove:
 * LeoRunner/LeoVuela/SaltaPalabra) — jitter(150) + jitter(500) en su
 * maximo (1.3x), escalado por demoSpeedMul (estos juegos no usan
 * demoHesitationPaceMul, que es especifico del cursor de WordRain).
 */
export function demoMoveDecisionWindowMs(): number {
  return (150 + 500) * 1.3 * Math.max(1, demoSpeedMul);
}

/**
 * In demo mode, auto-executes an action after a delay whenever the
 * condition is true. Cleans up on unmount or when condition changes.
 *
 * `baseDelayMs` es un piso, no un valor fijo: se le aplica jitter (+-30%)
 * y el multiplicador global de velocidad, así el ritmo entre elecciones
 * varía en vez de sentirse metronómico.
 */
export function useDemoAutoplay(
  isDemo: boolean,
  condition: boolean,
  action: () => void,
  baseDelayMs = 1500,
) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!isDemo || !condition) return;
    const t = setTimeout(() => actionRef.current(), jitter(baseDelayMs));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, condition, baseDelayMs]);
}

/**
 * Elige la respuesta correcta simulando duda: resalta brevemente una opción
 * incorrecta (clase CSS `.demo-hesitate`, ver globals.css) y recién después
 * clickea la correcta. La incorrecta NUNCA se clickea — Leo y Sofía no se
 * equivocan leyendo; si el demo eligiera mal estaría modelando el error
 * justo en lo que el juego enseña.
 *
 * Recibe elementos ya resueltos (no selectores) para que cada juego pueda
 * aplicar su propio filtro de "esta opción realmente está en pantalla"
 * (ej. BuildSentence descarta fichas duplicadas fuera de vista). Los
 * `null`/`undefined` en `wrongEls` se ignoran. Si no queda ninguna opción
 * incorrecta visible (o por variedad de ritmo, ~1 de cada 3 veces), va
 * directo a la correcta sin la pausa de duda.
 */
export function demoChooseWithHesitation(
  correctEl: HTMLElement | null | undefined,
  wrongEls: (HTMLElement | null | undefined)[],
) {
  if (!correctEl) return;

  const click = () => correctEl.click();

  const candidates = wrongEls.filter(
    (el): el is HTMLElement => !!el && el !== correctEl
  );

  if (candidates.length === 0 || Math.random() < 0.3) {
    setTimeout(click, jitter(150));
    return;
  }

  const wrongEl = candidates[Math.floor(Math.random() * candidates.length)];
  wrongEl.classList.add("demo-hesitate");
  setTimeout(() => {
    wrongEl.classList.remove("demo-hesitate");
    setTimeout(click, jitter(250));
  }, jitter(500));
}

/** Atajo: resuelve selectores CSS y llama a demoChooseWithHesitation. */
export function demoChooseSelectorWithHesitation(
  correctSelector: string,
  wrongSelectors: string[],
) {
  demoChooseWithHesitation(
    document.querySelector(correctSelector) as HTMLElement | null,
    wrongSelectors.map((sel) => document.querySelector(sel) as HTMLElement | null)
  );
}

/**
 * Version de demoChooseWithHesitation para juegos con un PERSONAJE que se
 * desplaza (LeoRunner/LeoVuela/SaltaPalabra) en vez de tocar un boton: el
 * resaltado CSS de la version de arriba no se nota en video (QA sep-2026,
 * "hoy se resalta la opcion incorrecta y no se percibe"). Acá, en cambio,
 * se MUEVE al personaje hacia la opcion incorrecta y recien despues se
 * corrige hacia la correcta — el movimiento se ve, el resaltado no.
 *
 * Mismos tiempos y misma frecuencia de duda (70%) que la version por click,
 * para no romper el ritmo ya afinado del resto del demo. `moveToWrong` es
 * responsabilidad de cada juego: tiene que insinuar sin llegar a "tocar" la
 * opcion incorrecta de verdad (en los juegos de choque fisico, sin entrar
 * en su zona de atrape) — Leo nunca falla una lectura.
 */
export function demoHesitateMove(
  hasWrongOption: boolean,
  moveToWrong: () => void,
  moveToCorrect: () => void,
): void {
  if (!hasWrongOption || Math.random() < 0.3) {
    setTimeout(moveToCorrect, jitter(150));
    return;
  }
  setTimeout(() => {
    moveToWrong();
    setTimeout(moveToCorrect, jitter(500));
  }, jitter(150));
}
