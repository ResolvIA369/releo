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
