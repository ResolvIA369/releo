"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../types";
import type { PhaseNumber } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { GameShell, usePause } from "./GameShell";
import { GameIntro } from "./GameIntro";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";

// ═══════════════════════════════════════════════════════════════════════
// 5 stories per world, using cumulative words:
// World 1 (50 words), World 2 (100), World 3 (150), World 4 (200), World 5 (220)
// ═══════════════════════════════════════════════════════════════════════

interface MiniStory {
  title: string;
  emoji: string;
  words: string[];
}

// ─── World 1: Isla de las Palabras (50 words from Phase 1) ──────

const WORLD_1_STORIES: MiniStory[] = [
  {
    title: "En la casa",
    emoji: "🏠",
    words: ["mamá", "come", "pan", "con", "leche", "en", "la", "mesa", "papá", "abre", "la", "puerta", "y", "el", "bebé", "duerme", "en", "su", "cama"],
  },
  {
    title: "La familia",
    emoji: "👨‍👩‍👧‍👦",
    words: ["abuela", "y", "abuelo", "viene", "a", "la", "casa", "hermano", "juega", "con", "primo", "hermana", "canta", "tío", "y", "tía", "come", "en", "la", "cocina"],
  },
  {
    title: "Los animales",
    emoji: "🐶",
    words: ["el", "perro", "corre", "por", "el", "parque", "el", "gato", "sube", "a", "la", "silla", "el", "caballo", "come", "la", "vaca", "bebe", "agua", "y", "el", "pájaro", "canta"],
  },
  {
    title: "Mi cuerpo",
    emoji: "🧒",
    words: ["con", "el", "ojo", "yo", "lee", "con", "la", "mano", "toca", "con", "el", "pie", "salta", "la", "nariz", "la", "boca", "la", "oreja", "el", "pelo", "el", "dedo", "el", "brazo", "la", "pierna"],
  },
  {
    title: "Frutas y comida",
    emoji: "🍎",
    words: ["mamá", "tiene", "manzana", "banana", "uva", "pera", "y", "naranja", "yo", "come", "pan", "arroz", "y", "huevo", "bebe", "agua", "y", "leche", "en", "la", "mesa"],
  },
];

// ─── World 2: Bahía de los Pares (100 words: Phase 1 + 2) ──────

const WORLD_2_STORIES: MiniStory[] = [
  {
    title: "El día soleado",
    emoji: "☀️",
    words: ["el", "sol", "grande", "y", "amarillo", "sube", "arriba", "la", "nube", "blanco", "la", "flor", "rojo", "y", "azul", "en", "el", "jardín", "verde"],
  },
  {
    title: "Opuestos",
    emoji: "↔️",
    words: ["el", "perro", "grande", "corre", "rápido", "el", "gato", "pequeño", "camina", "lento", "arriba", "y", "abajo", "dentro", "y", "fuera", "cerca", "y", "lejos"],
  },
  {
    title: "Las emociones",
    emoji: "😊",
    words: ["hoy", "yo", "feliz", "y", "contento", "ayer", "triste", "nunca", "enojado", "siempre", "valiente", "y", "amable", "con", "mi", "amigo", "tranquilo"],
  },
  {
    title: "La naturaleza",
    emoji: "🌳",
    words: ["el", "árbol", "alto", "y", "verde", "la", "flor", "rosa", "y", "violeta", "el", "río", "largo", "llega", "al", "mar", "azul", "y", "grande", "la", "montaña", "lejos"],
  },
  {
    title: "Caliente y frío",
    emoji: "🌡️",
    words: ["la", "sopa", "caliente", "en", "la", "cocina", "el", "agua", "frío", "la", "luna", "sale", "de", "noche", "la", "estrella", "brilla", "arriba", "la", "lluvia", "viene"],
  },
];

// ─── World 3: Valle de las Frases (150 words: Phase 1+2+3) ─────

const WORLD_3_STORIES: MiniStory[] = [
  {
    title: "Un día de escuela",
    emoji: "🏫",
    words: ["yo", "llega", "a", "la", "escuela", "con", "mi", "mochila", "la", "maestra", "abre", "un", "libro", "grande", "yo", "escribe", "con", "lápiz", "en", "el", "papel", "mi", "amigo", "dibuja"],
  },
  {
    title: "Hora de vestirse",
    emoji: "👔",
    words: ["mamá", "lava", "la", "camisa", "azul", "y", "el", "pantalón", "negro", "yo", "limpia", "el", "zapato", "hermana", "pinta", "su", "pollera", "rosa", "papá", "tiene", "su", "abrigo", "y", "gorra"],
  },
  {
    title: "En el recreo",
    emoji: "⚽",
    words: ["en", "el", "recreo", "yo", "corre", "y", "salta", "mi", "amigo", "baila", "y", "canta", "después", "yo", "lee", "un", "libro", "en", "la", "clase", "la", "maestra", "dice", "muy", "bien"],
  },
  {
    title: "Los lugares",
    emoji: "🗺️",
    words: ["yo", "sale", "de", "la", "casa", "y", "corre", "al", "parque", "cerca", "la", "tienda", "la", "iglesia", "y", "el", "hospital", "lejos", "la", "playa", "la", "ciudad", "y", "el", "campo"],
  },
  {
    title: "Mamá cocina",
    emoji: "🍳",
    words: ["mamá", "abre", "la", "puerta", "de", "la", "cocina", "ella", "lava", "y", "limpia", "después", "cocina", "arroz", "caliente", "con", "huevo", "papá", "bebe", "leche", "yo", "come", "feliz"],
  },
];

// ─── World 4: Montaña de la Lectura (200 words: Phase 1+2+3+4) ─

const WORLD_4_STORIES: MiniStory[] = [
  {
    title: "Mi día",
    emoji: "📅",
    words: ["hoy", "yo", "sale", "de", "mi", "casa", "por", "la", "calle", "ahora", "llega", "a", "la", "escuela", "después", "juega", "en", "el", "parque", "con", "mi", "amigo", "mañana", "también"],
  },
  {
    title: "Yo y tú",
    emoji: "🫂",
    words: ["yo", "tiene", "un", "perro", "grande", "tú", "tiene", "un", "gato", "pequeño", "él", "corre", "rápido", "ella", "salta", "alto", "nosotros", "juega", "junto", "siempre", "feliz"],
  },
  {
    title: "Contar hasta diez",
    emoji: "🔢",
    words: ["uno", "dos", "tres", "cuatro", "cinco", "dedo", "en", "mi", "mano", "seis", "siete", "ocho", "nueve", "diez", "yo", "sabe", "muy", "bien", "antes", "y", "después"],
  },
  {
    title: "El tiempo",
    emoji: "⏰",
    words: ["ayer", "yo", "juega", "en", "el", "parque", "hoy", "yo", "lee", "un", "libro", "mañana", "yo", "sale", "a", "la", "playa", "siempre", "feliz", "nunca", "triste", "pronto"],
  },
  {
    title: "Las preposiciones",
    emoji: "📍",
    words: ["el", "gato", "duerme", "sobre", "la", "cama", "el", "perro", "duerme", "bajo", "la", "mesa", "yo", "camina", "hacia", "la", "escuela", "sin", "mi", "mochila", "entre", "mi", "amigo", "y", "yo"],
  },
];

// ─── World 5: El Libro Mágico (220 words: all phases) ──────────

const WORLD_5_STORIES: MiniStory[] = [
  {
    title: "Yo puedo leer",
    emoji: "📖",
    words: ["yo", "quiere", "leer", "y", "sabe", "que", "puede", "tiene", "un", "libro", "grande", "hace", "bien", "dice", "mamá", "muy", "feliz", "aquí", "en", "mi", "casa"],
  },
  {
    title: "La aventura",
    emoji: "🗺️",
    words: ["yo", "sale", "de", "la", "ciudad", "y", "busca", "el", "mar", "azul", "llega", "a", "la", "montaña", "alto", "viene", "la", "lluvia", "también", "el", "sol", "después"],
  },
  {
    title: "Mi familia hace todo",
    emoji: "💪",
    words: ["mamá", "hace", "la", "comida", "papá", "dice", "muy", "bien", "hermano", "viene", "y", "busca", "su", "mochila", "hermana", "sale", "a", "la", "escuela", "junto", "con", "mi", "amigo"],
  },
  {
    title: "Más y menos",
    emoji: "⚖️",
    words: ["el", "perro", "come", "más", "que", "el", "gato", "el", "gato", "duerme", "más", "solo", "aquí", "y", "allí", "bien", "y", "mal", "muy", "junto", "menos", "lejos"],
  },
  {
    title: "Todo lo que sé",
    emoji: "🌟",
    words: ["yo", "sabe", "leer", "puede", "escribe", "tiene", "un", "lápiz", "hace", "bien", "dice", "mamá", "yo", "busca", "más", "libro", "aquí", "y", "allí", "también", "feliz", "siempre"],
  },
];

const STORIES_BY_WORLD: Record<string, MiniStory[]> = {
  world_1: WORLD_1_STORIES,
  world_2: WORLD_2_STORIES,
  world_3: WORLD_3_STORIES,
  world_4: WORLD_4_STORIES,
  world_5: WORLD_5_STORIES,
};

const GAME_COLOR = "#ed8936";
const AUTO_PLAY_INTERVAL = 2500;

type Phase = "intro" | "reading" | "celebrating" | "finished";

export const StoryReader: React.FC<GameProps> = ({ words, phase = 1, worldId, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("story-reader", { phase });
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [storyIdx, setStoryIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(-1);
  const [readWords, setReadWords] = useState<Set<number>>(new Set());
  const [storiesCompleted, setStoriesCompleted] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Pick stories based on world
  const worldStories = STORIES_BY_WORLD[worldId ?? "world_1"] ?? WORLD_1_STORIES;
  const totalStories = worldStories.length;
  const story = worldStories[storyIdx % totalStories];
  const nextWord = wordIdx + 1;
  const storyDone = readWords.size === story.words.length;

  // ─── Read a word ────────────────────────────────────────────

  const readWordAt = useCallback(async (idx: number) => {
    if (isSpeaking || readWords.has(idx) || idx !== nextWord || paused) return;

    setIsSpeaking(true);
    setWordIdx(idx);
    const newRead = new Set(readWords);
    newRead.add(idx);
    setReadWords(newRead);
    recordAttempt(true, `word-${idx}`);

    await sofiaNameWord(story.words[idx]);
    setIsSpeaking(false);

    if (newRead.size === story.words.length) {
      setAutoPlay(false);
      setGamePhase("celebrating");
      await sofiaPlayAudio("frase-historia-linda", "¡Qué linda historia!", "excited");

      await new Promise((r) => setTimeout(r, 2500));
      const done = storiesCompleted + 1;
      setStoriesCompleted(done);

      if (done >= totalStories) {
        setGamePhase("finished");
        finish().then(() => onComplete?.(state));
      } else {
        setStoryIdx(done);
        setWordIdx(-1);
        setReadWords(new Set());
        setGamePhase("reading");
      }
    }
  }, [isSpeaking, readWords, nextWord, paused, story, recordAttempt, storiesCompleted, totalStories, finish, onComplete, state]);


  // Demo: auto-select correct answer
  useDemoAutoplay(isDemo, gamePhase === "reading" && !isSpeaking && !storyDone, () => {
    if (nextWord < story.words.length) readWordAt(nextWord);
  }, 500);

  // ─── Auto-play ──────────────────────────────────────────────

  useEffect(() => {
    if (!autoPlay || gamePhase !== "reading" || isSpeaking || paused || storyDone) return;

    autoTimerRef.current = setTimeout(() => {
      if (nextWord < story.words.length) readWordAt(nextWord);
    }, AUTO_PLAY_INTERVAL);

    return () => clearTimeout(autoTimerRef.current);
  }, [autoPlay, gamePhase, isSpeaking, paused, storyDone, nextWord, story.words.length, readWordAt]);

  useEffect(() => () => { clearTimeout(autoTimerRef.current); stopVoice(); }, []);

  const handleReplay = useCallback(() => {
    reset();
    setStoryIdx(0);
    setWordIdx(-1);
    setReadWords(new Set());
    setStoriesCompleted(0);
    setAutoPlay(false);
    setGamePhase("intro");
  }, [reset]);

  // ═══ RENDER ════════════════════════════════════════════════

  if (gamePhase === "intro") {
    return (
      <GameShell title="Cuenta Cuentos" icon="📖" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro
          gameName="Cuenta Cuentos"
          gameIcon="📖"
          rulesText="¡Vamos a leer un cuento juntos! Toca cada palabra en orden y Sofía te la lee."
          color={GAME_COLOR}
          isDemo={isDemo} onReady={() => setGamePhase("reading")}
        />
      </GameShell>
    );
  }

  if (gamePhase === "finished") {
    return (
      <GameShell title="Cuenta Cuentos" icon="📖" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Cuenta Cuentos" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  if (gamePhase === "celebrating") {
    return (
      <GameShell title="Cuenta Cuentos" icon="📖" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.lg, minHeight: 400 }}>
          <CelebrationGif size={200} />
          <motion.h2 initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: GAME_COLOR, margin: 0 }}>
            {story.emoji} ¡Cuento completado!
          </motion.h2>
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, margin: 0 }}>
            {storiesCompleted + 1} de {totalStories} cuentos
          </p>
        </div>
      </GameShell>
    );
  }

  // ─── Reading ────────────────────────────────────────────────

  return (
    <GameShell title="Cuenta Cuentos" icon="📖" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "min(620px, calc(100vw - 32px))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
            <span style={{ fontSize: 32 }}>{story.emoji}</span>
            <span style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, color: GAME_COLOR, fontWeight: "bold" }}>
              {story.title}
            </span>
          </div>
          <span style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>
            {storiesCompleted + 1}/{totalStories}
          </span>
        </div>

        {/* Auto-play toggle */}
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: `${spacing.xs}px ${spacing.md}px`,
            borderRadius: 9999,
            backgroundColor: autoPlay ? `${GAME_COLOR}20` : colors.bg.secondary,
            border: `2px solid ${autoPlay ? GAME_COLOR : colors.border.light}`,
            color: autoPlay ? GAME_COLOR : colors.text.muted,
            fontSize: fontSizes.sm, fontWeight: "bold",
            fontFamily: fonts.display, cursor: "pointer",
          }}
        >
          {autoPlay ? "⏸ Pausar auto-lectura" : "▶️ Auto-lectura"}
        </button>

        {/* Story words */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: spacing.sm,
          justifyContent: "center", maxWidth: "min(620px, calc(100vw - 32px))",
          padding: spacing.lg,
          backgroundColor: colors.bg.card,
          borderRadius: radii.xl,
          boxShadow: shadows.md,
          lineHeight: 2.4,
        }}>
          {story.words.map((word, i) => {
            const isRead = readWords.has(i);
            const isNext = i === nextWord;

            return (
              <motion.button
                key={`${storyIdx}-${i}`}
                onClick={() => readWordAt(i)}
                disabled={i !== nextWord || isSpeaking}
                animate={isNext && !autoPlay ? { scale: [1, 1.08, 1] } : {}}
                transition={isNext ? { repeat: Infinity, duration: 1.2 } : {}}
                style={{
                  padding: `${spacing.xs}px ${spacing.sm + 2}px`,
                  borderRadius: radii.md,
                  backgroundColor: isRead ? `${GAME_COLOR}15` : isNext ? "#fff" : "transparent",
                  border: isNext ? `3px solid ${GAME_COLOR}` : isRead ? `2px solid ${GAME_COLOR}40` : "2px solid transparent",
                  color: isRead ? GAME_COLOR : isNext ? "#2d3748" : "#bbb",
                  fontSize: isNext ? fontSizes.xl : fontSizes.lg,
                  fontWeight: isRead || isNext ? "bold" : "normal",
                  fontFamily: fonts.display,
                  cursor: i === nextWord ? "pointer" : "default",
                  boxShadow: isNext && !autoPlay ? shadows.glow(GAME_COLOR) : "none",
                  transition: "all 0.2s",
                }}
              >
                {word}
              </motion.button>
            );
          })}
        </div>

        {/* Hand hint */}
        {!autoPlay && nextWord < story.words.length && !isSpeaking && (
          <motion.div
            animate={{ y: [0, -15, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1.5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <span style={{ fontSize: 40 }}>👆</span>
            <span style={{ fontSize: fontSizes.sm, color: GAME_COLOR, fontFamily: fonts.display, fontWeight: "bold" }}>
              Toca: {story.words[nextWord]} {EMOJI_MAP[story.words[nextWord]] ?? ""}
            </span>
          </motion.div>
        )}

        {/* Auto-play indicator */}
        {autoPlay && nextWord < story.words.length && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ fontSize: fontSizes.sm, color: GAME_COLOR, fontFamily: fonts.display }}
          >
            🔊 Leyendo automáticamente...
          </motion.div>
        )}

        {/* Progress */}
        <div style={{ display: "flex", gap: 4 }}>
          {story.words.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              backgroundColor: readWords.has(i) ? GAME_COLOR : colors.bg.secondary,
              transition: "background-color 0.3s",
            }} />
          ))}
        </div>
      </div>
    </GameShell>
  );
};
