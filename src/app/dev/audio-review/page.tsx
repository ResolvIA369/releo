"use client";

// /dev/audio-review — Revisión de pronunciación de las 220 palabras grabadas.
// Fuera del flujo del niño a propósito: no hay Link a esta ruta desde
// ninguna pantalla de la app. Uso exclusivo de César, escuchando de verdad
// cada MP3 y marcando lo que suene mal — esta página NO evalúa nada por su
// cuenta ni arma listas de "sospechosas".

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";
import { WORLDS } from "@/features/progression/config/worlds";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

interface ReviewWord {
  id: string;
  text: string;
  mp3: string;
  worldId: string;
  worldName: string;
  worldColor: string;
}

const ALL_PHASE_WORDS = [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS];

const WORDS: ReviewWord[] = ALL_PHASE_WORDS.flatMap((words) =>
  words.map((w) => {
    const world = WORLDS.find((wo) => wo.phase === w.phase)!;
    return {
      id: w.id,
      text: w.text,
      mp3: `/audio/sofia/palabra-${w.text.toLowerCase()}.mp3`,
      worldId: world.id,
      worldName: world.name,
      worldColor: colors.world[world.phase] ?? colors.brand.primary,
    };
  })
);

const TOTAL = WORDS.length; // 220

type Speed = 1 | 1.25 | 1.5 | 2;
const SPEEDS: Speed[] = [1, 1.25, 1.5, 2];

const STORAGE_KEY = "doman-audio-review-progress";

interface StoredProgress {
  index: number;
  bad: string[]; // word ids marcados como mal pronunciados
  speed: Speed;
}

function loadProgress(): StoredProgress {
  if (typeof window === "undefined") return { index: 0, bad: [], speed: 1 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { index: 0, bad: [], speed: 1 };
    const parsed = JSON.parse(raw);
    return {
      index: typeof parsed.index === "number" ? Math.min(Math.max(parsed.index, 0), TOTAL - 1) : 0,
      bad: Array.isArray(parsed.bad) ? parsed.bad : [],
      speed: SPEEDS.includes(parsed.speed) ? parsed.speed : 1,
    };
  } catch {
    return { index: 0, bad: [], speed: 1 };
  }
}

function saveProgress(p: StoredProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function AudioReviewInner() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");

  // Revisión parcial: /dev/audio-review?ids=p1-10,p1-22,... para escuchar
  // sólo una tanda (recién regenerada, o una muestra) sin pasar por las 220.
  // No persiste progreso — son sesiones cortas, de una sola pasada.
  const words = useMemo(() => {
    if (!idsParam) return WORDS;
    const idSet = new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean));
    const filtered = WORDS.filter((w) => idSet.has(w.id));
    return filtered.length > 0 ? filtered : WORDS;
  }, [idsParam]);
  const filtered = Boolean(idsParam) && words.length !== WORDS.length;
  const total = words.length;

  const initial = useMemo(() => (filtered ? { index: 0, bad: [], speed: 1 as Speed } : loadProgress()), [filtered]);
  const [index, setIndex] = useState(initial.index);
  const [bad, setBad] = useState<Set<string>>(new Set(initial.bad));
  const [speed, setSpeed] = useState<Speed>(initial.speed);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Precarga en caliente (warm el cache HTTP) para que el salto de un audio
  // al siguiente no tenga que esperar la descarga — eso es lo que genera el
  // silencio que se quiere evitar.
  const preloadedRef = useRef<Set<number>>(new Set());

  const current = words[index];

  const preloadAhead = useCallback((from: number) => {
    for (let i = from; i < Math.min(from + 4, total); i++) {
      if (preloadedRef.current.has(i)) continue;
      preloadedRef.current.add(i);
      const a = new Audio(words[i].mp3);
      a.preload = "auto";
    }
  }, [words, total]);

  const playIndex = useCallback((i: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = words[i].mp3;
    audio.playbackRate = speed;
    audio.onended = () => advance(i + 1);
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    preloadAhead(i + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, speed, preloadAhead]);

  function advance(nextIndex: number) {
    if (nextIndex >= total) {
      setPlaying(false);
      return;
    }
    setIndex(nextIndex);
  }

  // Pausar si se navega fuera de la página con algo sonando
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // Reproduce cada vez que cambia el índice (salvo en pausa)
  useEffect(() => {
    if (pausedRef.current) return;
    playIndex(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Aplica el cambio de velocidad al audio en curso también
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Persistencia — si cierra la pestaña, retoma donde quedó. Las revisiones
  // parciales (?ids=...) no persisten: son pasadas cortas de una sola vez.
  useEffect(() => {
    if (filtered) return;
    saveProgress({ index, bad: Array.from(bad), speed });
  }, [filtered, index, bad, speed]);

  const markCorrect = useCallback(() => {
    setBad((prev) => {
      if (!prev.has(current.id)) return prev;
      const next = new Set(prev);
      next.delete(current.id);
      return next;
    });
    advance(indexRef.current + 1);
  }, [current]);

  const markBad = useCallback(() => {
    setBad((prev) => new Set(prev).add(current.id));
    advance(indexRef.current + 1);
  }, [current]);

  const repeat = useCallback(() => {
    playIndex(indexRef.current);
  }, [playIndex]);

  const goPrevious = useCallback(() => {
    if (indexRef.current === 0) return;
    setIndex(indexRef.current - 1);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      const audio = audioRef.current;
      if (audio) {
        if (next) audio.pause();
        else audio.play().then(() => setPlaying(true)).catch(() => {});
      }
      return next;
    });
  }, []);

  // Atajos de teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowRight":
        case "c":
        case "C":
          e.preventDefault();
          markCorrect();
          break;
        case "x":
        case "X":
        case "Backspace":
          e.preventDefault();
          markBad();
          break;
        case "r":
        case "R":
          e.preventDefault();
          repeat();
          break;
        case "ArrowLeft":
        case "p":
        case "P":
          e.preventDefault();
          goPrevious();
          break;
        case " ":
          e.preventDefault();
          togglePause();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [markCorrect, markBad, repeat, goPrevious, togglePause]);

  function exportJSON() {
    const marcadas = words.filter((w) => bad.has(w.id)).map((w) => ({
      id: w.id,
      texto: w.text,
      mundo: w.worldName,
    }));
    const blob = new Blob([JSON.stringify(marcadas, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pronunciacion-a-corregir-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Progreso dentro del mundo actual
  const worldWords = words.filter((w) => w.worldId === current.worldId);
  const worldPos = worldWords.findIndex((w) => w.id === current.id) + 1;

  const isMarkedBad = bad.has(current.id);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: colors.bg.primary,
        fontFamily: fonts.body,
        padding: spacing.lg,
        gap: spacing.lg,
      }}
    >
      <audio ref={audioRef} />

      {/* Header: progreso general + por mundo */}
      <div style={{ width: "100%", maxWidth: 720 }}>
        {filtered && (
          <p style={{ fontSize: fontSizes.sm, color: colors.brand.primary, fontFamily: fonts.display, fontWeight: "bold", margin: `0 0 ${spacing.xs}px` }}>
            Revisión parcial — {total} palabra{total === 1 ? "" : "s"} (no las 220){" "}
            <a href="/dev/audio-review" style={{ color: "inherit", textDecoration: "underline", fontWeight: "normal" }}>
              ver las 220 →
            </a>
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: spacing.xs, gap: spacing.sm, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: "clamp(16px, 4vw, 24px)", color: colors.text.primary, margin: 0, whiteSpace: "nowrap" }}>
            Revisión de pronunciación
          </h1>
          <span style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, fontWeight: "bold", color: colors.text.primary, whiteSpace: "nowrap" }}>
            {index + 1} / {total}
          </span>
        </div>

        {/* Franja segmentada por mundo */}
        <div style={{ display: "flex", gap: 2, height: 8, borderRadius: radii.pill, overflow: "hidden" }}>
          {WORLDS.map((w) => {
            const count = words.filter((word) => word.worldId === w.id).length;
            const isActive = w.id === current.worldId;
            return (
              <div
                key={w.id}
                title={w.name}
                style={{
                  flex: count,
                  backgroundColor: colors.world[w.phase] ?? colors.brand.primary,
                  opacity: isActive ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: `${spacing.xs}px 0 0` }}>
          {current.worldName} — {worldPos} / {worldWords.length}
        </p>
      </div>

      {/* Palabra actual */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
          backgroundColor: colors.bg.card,
          borderRadius: radii.xl,
          boxShadow: shadows.lg,
          border: isMarkedBad ? `3px solid ${colors.error}` : `1px solid ${colors.border.light}`,
          padding: spacing["2xl"],
          minHeight: "40vh",
        }}
      >
        <span style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>
          {playing && !paused ? "🔊 sonando…" : paused ? "⏸ en pausa" : ""}
        </span>
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: "clamp(48px, 9vw, 96px)",
            fontWeight: "bold",
            color: colors.doman.wordRed,
            margin: 0,
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {current.text}
        </h2>
        {isMarkedBad && (
          <span style={{ color: colors.error, fontFamily: fonts.display, fontWeight: "bold", fontSize: fontSizes.sm }}>
            marcada como mal pronunciada
          </span>
        )}
      </div>

      {/* Controles */}
      <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: spacing.md }}>
        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center", flexWrap: "wrap" }}>
          <ReviewButton onClick={goPrevious} label="← Anterior (P)" />
          <ReviewButton onClick={repeat} label="↻ Repetir (R)" />
          <ReviewButton onClick={togglePause} label={paused ? "▶ Reanudar (Espacio)" : "⏸ Pausar (Espacio)"} />
        </div>
        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center" }}>
          <ReviewButton onClick={markCorrect} label="✓ Correcta (C / →)" color={colors.success} primary />
          <ReviewButton onClick={markBad} label="✗ Mal pronunciada (X)" color={colors.error} primary />
        </div>

        {/* Velocidad */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.xs }}>
          <div style={{ display: "flex", gap: spacing.xs }}>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  borderRadius: radii.sm,
                  border: `1px solid ${speed === s ? colors.brand.primary : colors.border.light}`,
                  backgroundColor: speed === s ? colors.brand.primary : colors.bg.card,
                  color: speed === s ? colors.text.inverse : colors.text.primary,
                  fontFamily: fonts.display,
                  fontSize: fontSizes.sm,
                  cursor: "pointer",
                }}
              >
                {s}x
              </button>
            ))}
          </div>
          {speed > 1.25 && (
            <p style={{ fontSize: fontSizes.xs, color: colors.warning, margin: 0, textAlign: "center", maxWidth: 420 }}>
              ⚠ Acelerar distorsiona acentuación y vocales — justo lo que estás evaluando. Considerá volver a 1x o 1.25x.
            </p>
          )}
        </div>

        <ReviewButton onClick={exportJSON} label={`⬇ Exportar marcadas (${bad.size}) como JSON`} />
      </div>
    </div>
  );
}

export default function AudioReviewPage() {
  return (
    <Suspense fallback={null}>
      <AudioReviewInner />
    </Suspense>
  );
}

function ReviewButton({
  onClick,
  label,
  color,
  primary,
}: {
  onClick: () => void;
  label: string;
  color?: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: `${spacing.sm}px ${spacing.md}px`,
        borderRadius: radii.md,
        border: primary ? "none" : `1px solid ${colors.border.light}`,
        backgroundColor: primary ? (color ?? colors.brand.primary) : colors.bg.card,
        color: primary ? colors.text.inverse : colors.text.primary,
        fontFamily: fonts.display,
        fontWeight: primary ? "bold" : "normal",
        fontSize: fontSizes.sm,
        whiteSpace: "nowrap",
        cursor: "pointer",
        boxShadow: primary ? shadows.button : shadows.sm,
        minHeight: 40,
      }}
    >
      {label}
    </button>
  );
}
