"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { demoHesitationDwell } from "./useDemoAutoplay";

interface Pos {
  x: number;
  y: number;
}

function centerOf(el: HTMLElement): Pos {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const TRAVEL_MS = 220;

/**
 * Cursor virtual para la duda en modo demo de los juegos SIN personaje
 * que se desplaza (opciones en botones/tiles: WordRain, WordFishing,
 * WordTrain, BitsReading, CategoryGame, MemoryCards, WordImageMatch,
 * BuildSentence). QA sep-2026: el resaltado CSS solo (`.demo-hesitate`,
 * un pulso de 6%) no se percibe en video sin algo que se MUEVA — acá un
 * puntero visible viaja hasta la opcion incorrecta (que ademas sigue
 * pulsando con la misma clase, doble señal), se frena, y recien ahi
 * corrige hacia la correcta. La incorrecta NUNCA se clickea, solo se le
 * acerca el cursor.
 *
 * OJO con las opciones que se MUEVEN SOLAS (una palabra cayendo, un pez
 * nadando, un vagon pasando): un getBoundingClientRect() de una sola
 * vez queda viejo de inmediato — el cursor se queda "flotando en el
 * aire" donde la opcion SOLIA estar, no donde esta ahora (bug real,
 * visto antes de mostrar nada: el cursor quedaba clavado mientras la
 * palabra seguia cayendo). Por eso durante el tramo de "duda" (no el
 * viaje) se re-lee la posicion en vivo cuadro a cuadro con rAF — el
 * cursor viaja CON la opcion, no a una foto de ella.
 *
 * `showIdle(target)` pone el cursor visible en reposo ANTES de decidir
 * (llamarlo apenas se sabe cual es la palabra objetivo, no cuando arranca
 * la duda) — sin esto el cursor no existia en pantalla durante la pausa
 * de lectura, y `hesitateAndClick` lo hacia aparecer YA ENCIMA de la
 * respuesta correcta: en el 30% de los casos sin detour eso era un
 * teletransporte de distancia cero seguido de un click instantaneo (QA
 * sep-2026, visto mirando capturas reales, no midiendo tiempos — los
 * tiempos ya daban bien, la imagen no).
 */
export function useDemoCursor(isDemo: boolean) {
  const [pos, setPos] = useState<Pos>({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);
  const seqRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const curRef = useRef<Pos>({ x: -100, y: -100 });

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  // Escritura imperativa (sin pasar por React) para el rAF de alta
  // frecuencia — un setState por cuadro haria re-renderizar el juego
  // entero 60 veces por segundo.
  const writeXY = useCallback((p: Pos) => {
    curRef.current = p;
    const el = elRef.current;
    if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }, []);

  const travelTo = useCallback((target: Pos, ms: number, onDone: () => void, mySeq: number) => {
    stopRaf();
    const start = curRef.current;
    const t0 = performance.now();
    const step = (now: number) => {
      if (seqRef.current !== mySeq) return;
      const t = Math.min(1, (now - t0) / ms);
      const eased = 1 - (1 - t) * (1 - t);
      writeXY({ x: lerp(start.x, target.x, eased), y: lerp(start.y, target.y, eased) });
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else onDone();
    };
    rafRef.current = requestAnimationFrame(step);
  }, [writeXY, stopRaf]);

  // Sigue en vivo la posicion real de `el` durante `ms` — para opciones
  // que se siguen moviendo mientras el cursor "duda" sobre ellas.
  const followFor = useCallback((el: HTMLElement, ms: number, onDone: () => void, mySeq: number) => {
    stopRaf();
    const t0 = performance.now();
    const step = (now: number) => {
      if (seqRef.current !== mySeq) return;
      writeXY(centerOf(el));
      if (now - t0 < ms) rafRef.current = requestAnimationFrame(step);
      else onDone();
    };
    rafRef.current = requestAnimationFrame(step);
  }, [writeXY, stopRaf]);

  // Cursor visible en reposo (p.ej. mientras el chico "lee" la palabra
  // objetivo, antes de que arranque cualquier duda) — sin esto el cursor
  // no existia en pantalla hasta el mismo instante en que se resolvia la
  // eleccion, y en el 30% de los casos sin detour (ver mas abajo)
  // aparecia YA ENCIMA de la respuesta correcta y la tocaba de inmediato:
  // se leia como un bot resolviendo, no como un chico pensando (QA
  // sep-2026, detectado mirando capturas reales, no midiendo tiempos).
  const showIdle = useCallback((target: HTMLElement | Pos | null | undefined) => {
    if (!isDemo || !target) return;
    clearTimers();
    stopRaf();
    seqRef.current++;
    const p = target instanceof HTMLElement ? centerOf(target) : target;
    curRef.current = p;
    setPos(p);
    setVisible(true);
  }, [isDemo, clearTimers, stopRaf]);

  const hesitateAndClick = useCallback((
    correctEl: HTMLElement | null | undefined,
    wrongEls: (HTMLElement | null | undefined)[],
  ) => {
    if (!correctEl) return;
    if (!isDemo) { correctEl.click(); return; }

    clearTimers();
    stopRaf();
    const mySeq = ++seqRef.current;
    const alive = () => seqRef.current === mySeq;
    const candidates = wrongEls.filter((el): el is HTMLElement => !!el && el !== correctEl);

    // El cursor arranca desde donde ya estaba (el reposo de showIdle, o
    // el default fuera de pantalla si nunca se llamo) — a proposito NO
    // se lo reubica encima de la correcta antes de decidir: eso es lo
    // que hacia invisible el camino directo (30% de los casos).
    setVisible(true);

    const finish = () => {
      if (!alive()) return;
      setPressed(true);
      after(120, () => {
        if (!alive()) return;
        correctEl.click();
        setPressed(false);
        after(200, () => { if (alive()) setVisible(false); });
      });
    };

    // Un cuadro de margen para que el div ya este montado (ref valido)
    // antes de arrancar el rAF — el estado inicial ya lo pinta en el
    // lugar correcto, esto solo evita escribir sobre un ref todavia null.
    requestAnimationFrame(() => {
      if (!alive()) return;
      if (candidates.length === 0 || Math.random() < 0.3) {
        travelTo(centerOf(correctEl), TRAVEL_MS, finish, mySeq);
        return;
      }
      const wrongEl = candidates[Math.floor(Math.random() * candidates.length)];
      wrongEl.classList.add("demo-hesitate");
      travelTo(centerOf(wrongEl), TRAVEL_MS, () => {
        if (!alive()) return;
        followFor(wrongEl, demoHesitationDwell(), () => {
          wrongEl.classList.remove("demo-hesitate");
          if (!alive()) return;
          travelTo(centerOf(correctEl), TRAVEL_MS, finish, mySeq);
        }, mySeq);
      }, mySeq);
    });
  }, [isDemo, after, clearTimers, stopRaf, travelTo, followFor]);

  useEffect(() => () => { stopRaf(); clearTimers(); }, [stopRaf, clearTimers]);

  const Cursor = isDemo ? (
    <div
      ref={elRef}
      style={{
        position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none",
        fontSize: 34, marginLeft: -6, marginTop: -8,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        opacity: visible ? 1 : 0,
        scale: pressed ? 0.8 : 1,
        transition: "opacity 0.14s ease, scale 0.14s ease",
        willChange: "transform",
      }}
    >
      👆
    </div>
  ) : null;

  return { Cursor, hesitateAndClick, showIdle };
}
