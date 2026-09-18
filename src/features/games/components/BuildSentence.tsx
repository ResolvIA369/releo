"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { sofiaReads, sofiaCelebrates } from "@/shared/services/sofiaVoice";
import { GameShell, usePause } from "./GameShell";
import { useGameMusic } from "../hooks/useGameMusic";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { TimeBar } from "@/shared/components/TimeBar";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { QuickCelebration } from "@/shared/components/QuickCelebration";
import { SENTENCE_EXAMPLES, PHRASE_EXAMPLES } from "@/shared/constants";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { tapBounce, staggerContainer, staggerItem } from "@/shared/styles/animations";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Sentence generation from words prop ────────────────────────────

interface SentenceToken {
  text: string;
  fixed: boolean; // pre-colocado en la oracion; el chico no lo arrastra
}

interface Sentence {
  text: string;
  tokens: SentenceToken[];
}

// Articulos, conectores y preposiciones que vienen FIJOS en la oracion —
// el chico arrastra solo las palabras de contenido (sustantivos, verbos,
// adjetivos). EXCEPCION Mundo 4 (fase 4): ahi los articulos/preposiciones/
// pronombres SON el contenido que se enseña (ver categoria
// "articulos_y_conectores, preposiciones, pronombres" en worlds.ts) — ahi
// nada viene fijo. Configurable por fase, no hardcodeado al juego entero
// (QA sep-2026: pedido explicito de César).
const FIXED_TOKEN_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "y", "en", "con", "para", "de", "del", "sobre", "entre", "sin",
]);

function tokenize(fullText: string, phase: number): SentenceToken[] {
  return fullText.split(" ").map((text) => ({
    text,
    fixed: phase !== 4 && FIXED_TOKEN_WORDS.has(text.toLowerCase()),
  }));
}

// Tope de palabras ARRASTRABLES (no fijas) por fase — pedido explicito:
// Mundo 1-2 (fase 1-2) maximo 2-3. Mundo 3 (fase 3, donde vive el juego
// hoy) ya esta en ese rango en los datos curados. Mundo 4 sin tope: ahi
// las oraciones largas (hasta 8 palabras) son la dificultad intencional
// del mundo, no un descuido. Hoy el juego solo esta habilitado en
// world_3 (ver worlds.ts) — el tope de fase 1/2 queda listo para cuando
// se habilite ahi, no tiene efecto visible todavia.
const MAX_DRAGGABLE_WORDS_BY_PHASE: Record<number, number | null> = {
  1: 3,
  2: 3,
  3: 4,
  4: null,
  5: 4,
};

const CONNECTORS = ["y", "con", "para"];
const ARTICLES = ["el", "la", "un", "una"];
const SIMPLE_VERBS = ["come", "ve", "lee", "quiere", "tiene", "busca", "toca"];

/** Build simple sentences from the passed-in DomanWord list */
function buildSentencesFromWords(domanWords: DomanWord[], count: number): Sentence[] {
  const texts = domanWords.map((w) => w.text);
  const sentences: Sentence[] = [];

  // Strategy 1: "word y word" pairs
  const shuffled = shuffle(texts);
  for (let i = 0; i + 1 < shuffled.length && sentences.length < count; i += 2) {
    const connector = CONNECTORS[Math.floor(Math.random() * CONNECTORS.length)];
    const phrase = `${shuffled[i]} ${connector} ${shuffled[i + 1]}`;
    sentences.push({ text: phrase, tokens: phrase.split(" ").map((text) => ({ text, fixed: false })) });
  }

  // Strategy 2: "article + word" (e.g. "el bebé", "la mamá")
  for (const word of shuffle(texts)) {
    if (sentences.length >= count) break;
    const art = ARTICLES[Math.floor(Math.random() * ARTICLES.length)];
    const phrase = `${art} ${word}`;
    sentences.push({ text: phrase, tokens: phrase.split(" ").map((text) => ({ text, fixed: false })) });
  }

  // Strategy 3: "word + verb + word" (e.g. "mamá come pan")
  const shuffled2 = shuffle(texts);
  for (let i = 0; i + 1 < shuffled2.length && sentences.length < count; i += 2) {
    const verb = SIMPLE_VERBS[Math.floor(Math.random() * SIMPLE_VERBS.length)];
    const phrase = `${shuffled2[i]} ${verb} ${shuffled2[i + 1]}`;
    sentences.push({ text: phrase, tokens: phrase.split(" ").map((text) => ({ text, fixed: false })) });
  }

  return shuffle(sentences).slice(0, count);
}

const GAME_COLOR = "#d69e2e";
const SECONDS_PER_PHRASE = 20;
const TOTAL_ROUNDS = 5;

type Phase = "intro" | "playing" | "finished";

export const BuildSentence: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("phrase-builder", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();
  const music = useGameMusic(paused);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Pick sentences: SIEMPRE de la fase actual — una frase de Mundo 4
  // (PHRASE_EXAMPLES, hasta 8 palabras, articulos como contenido) no puede
  // aparecer en otro mundo (QA sep-2026: exactamente ese bug reportado).
  // Antes el filtro sólo exigia coincidencia de vocabulario, sin mirar
  // `phase`, asi que cualquier frase larga de Mundo 4 podia colarse en
  // Mundo 3 con solo compartir UNA palabra comun ("mamá", "y", etc).
  const sentences = useMemo(() => {
    const wordTexts = new Set(words.map((w) => w.text.toLowerCase()));
    const maxDraggable = MAX_DRAGGABLE_WORDS_BY_PHASE[phase] ?? null;

    const allExamples = [...SENTENCE_EXAMPLES, ...PHRASE_EXAMPLES];
    const samePhase = allExamples.filter((s) => s.phase === phase);

    const toSentence = (s: (typeof samePhase)[number]): Sentence => ({
      text: s.fullText,
      tokens: tokenize(s.fullText, s.phase),
    });
    const withinCap = (s: Sentence) =>
      maxDraggable === null || s.tokens.filter((t) => !t.fixed).length <= maxDraggable;

    // Prefer sentences that use words from the current set
    const relevant = samePhase
      .filter((s) => s.fullText.split(" ").some((w) => wordTexts.has(w.toLowerCase())))
      .map(toSentence)
      .filter(withinCap);

    const picked = shuffle(relevant).slice(0, TOTAL_ROUNDS);

    // Fill remaining with any curated sentence DE LA MISMA FASE (nunca
    // cruza a otro mundo, ni siquiera como relleno de ultimo recurso)
    if (picked.length < TOTAL_ROUNDS) {
      const fallback = shuffle(samePhase.map(toSentence)).filter(withinCap);
      for (const fb of fallback) {
        if (picked.length >= TOTAL_ROUNDS) break;
        if (!picked.some((p) => p.text === fb.text)) picked.push(fb);
      }
    }

    return picked.slice(0, TOTAL_ROUNDS);
  }, [words, phase]);

  const currentSentence = sentences[roundIdx];
  // Posiciones (indices dentro de tokens) que el chico realmente arrastra
  // — las fijas quedan pre-colocadas y no entran en esta lista.
  const draggableTokenIndices = useMemo(
    () => (currentSentence ? currentSentence.tokens.map((t, i) => (t.fixed ? -1 : i)).filter((i) => i >= 0) : []),
    [currentSentence]
  );
  const shuffledWords = useMemo(
    () => (currentSentence ? shuffle(draggableTokenIndices.map((i) => currentSentence.tokens[i].text)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSentence, roundIdx]
  );
  const finished = roundIdx >= sentences.length;

  // Game end
  useEffect(() => {
    if (!finished || gamePhase !== "playing") return;
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo: auto-place correct word every 2s for visible pacing
  useDemoAutoplay(isDemo, gamePhase === "playing" && !feedbackType && !isAdvancing, () => {
    if (!currentSentence) return;
    const tokenIdx = draggableTokenIndices[placed.length];
    const expected = tokenIdx !== undefined ? currentSentence.tokens[tokenIdx].text : undefined;
    if (!expected) return;
    const btns = document.querySelectorAll("[data-build-word]");
    for (const b of btns) {
      if ((b as HTMLElement).dataset.buildWord === expected && (b as HTMLElement).offsetParent !== null) {
        (b as HTMLElement).click();
        break;
      }
    }
  }, 2000);

  const advanceRound = useCallback(() => {
    setShowCelebration(false);
    setFeedbackType(null);
    setPlaced([]);
    setIsAdvancing(false);
    setRoundIdx((i) => i + 1);
    setTimerKey((k) => k + 1);
  }, []);

  const handleWordTap = useCallback(
    (tappedIndex: number) => {
      if (feedbackType || !currentSentence || isAdvancing) return;
      music.ensureStarted();

      const word = shuffledWords[tappedIndex];
      const nextIdx = placed.length;
      const tokenIdx = draggableTokenIndices[nextIdx];
      const expected = tokenIdx !== undefined ? currentSentence.tokens[tokenIdx].text : undefined;

      if (word === expected) {
        const newPlaced = [...placed, word];
        setPlaced(newPlaced);

        // Check if sentence complete (todas las posiciones arrastrables
        // llenas — las fijas ya estan pre-colocadas desde el arranque)
        if (newPlaced.length === draggableTokenIndices.length) {
          recordAttempt(true);
          setShowCelebration(true);
          setFeedbackType("correct");
          setIsAdvancing(true);
          rewardCorrect();

          (async () => {
            
            await music.speakDucked(() => sofiaReads(currentSentence.text));
            advanceRound();
          })();
        }
      } else {
        // Wrong word
        setFeedbackType("wrong");
        setTimeout(() => setFeedbackType(null), 600);
      }
    },
    [placed, currentSentence, feedbackType, isAdvancing, shuffledWords, draggableTokenIndices, recordAttempt, advanceRound]
  );

  const handleTimeUp = useCallback(() => {
    if (!currentSentence || isAdvancing) return;
    recordAttempt(false);
    setIsAdvancing(true);

    (async () => {
      await music.speakDucked(() => sofiaReads(currentSentence.text));
      advanceRound();
    })();
  }, [currentSentence, isAdvancing, recordAttempt, advanceRound]);

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setPlaced([]);
    setIsAdvancing(false);
    setGamePhase("intro");
  }, [reset]);

  // ═══ Remaining words by index (handles duplicates) ═════════════════

  const placedIndices = useMemo(() => {
    // For each placed word, find its index in shuffledWords that hasn't been used yet
    const used = new Set<number>();
    for (const word of placed) {
      const idx = shuffledWords.findIndex((w, i) => w === word && !used.has(i));
      if (idx !== -1) used.add(idx);
    }
    return used;
  }, [placed, shuffledWords]);

  // ═══ RENDER ═════════════════════════════════════════════════════════

  if (gamePhase === "intro") {
    return (
      <GameShell title="Construye la Frase" icon="🧱" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro
          gameName="Construye la Frase"
          gameIcon="🧱"
          rulesText="¡Ordena las palabras para formar la oración!"
          color={GAME_COLOR}
          isDemo={isDemo} onReady={() => setGamePhase("playing")}
        />
      </GameShell>
    );
  }

  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Construye la Frase" icon="🧱" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Construye la Frase"
          correct={state.correctAttempts}
          total={state.totalAttempts}
          color={GAME_COLOR}
          onReplay={handleReplay}
          onBack={onBack ?? (() => {})}
        />
      </GameShell>
    );
  }

  return (
    <GameShell title="Construye la Frase" icon="🧱" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", gap: spacing.md, paddingTop: spacing.md, maxWidth: "min(620px, calc(100vw - 32px))", margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}>
        {/* Header: round */}
        <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
          {roundIdx + 1} / {sentences.length}
        </span>

        {/* Sentence slots */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: spacing.sm,
            justifyContent: "center",
            minHeight: 60,
            padding: spacing.md,
            backgroundColor: colors.bg.secondary,
            borderRadius: radii.xl,
            width: "100%",
            maxWidth: "min(560px, calc(100vw - 32px))",
            position: "relative",
          }}
        >
          {currentSentence?.tokens.map((token, i) => {
            // Fijo: pre-colocado desde el arranque de la ronda, con su
            // propio tratamiento visual (solido, sin borde punteado) para
            // que se lea claramente distinto de un hueco por completar.
            if (token.fixed) {
              return (
                <div
                  key={i}
                  style={{
                    minWidth: 60,
                    height: 40,
                    borderRadius: radii.md,
                    border: `2px solid ${colors.border.light}`,
                    backgroundColor: colors.bg.card,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: fontSizes.md,
                    fontWeight: "bold",
                    fontFamily: fonts.display,
                    color: colors.text.placeholder,
                    padding: `0 ${spacing.sm}px`,
                  }}
                >
                  {token.text}
                </div>
              );
            }
            const posInDraggable = draggableTokenIndices.indexOf(i);
            const isFilled = posInDraggable < placed.length;
            return (
              <div
                key={i}
                style={{
                  minWidth: 60,
                  height: 40,
                  borderRadius: radii.md,
                  border: `2px dashed ${isFilled ? colors.success : colors.border.light}`,
                  backgroundColor: isFilled ? `${colors.success}15` : colors.bg.card,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: fontSizes.md,
                  fontWeight: "bold",
                  fontFamily: fonts.display,
                  color: colors.text.primary,
                  padding: `0 ${spacing.sm}px`,
                }}
              >
                {isFilled ? placed[posInDraggable] : ""}
              </div>
            );
          })}
          <QuickCelebration active={showCelebration} />
        </div>

        {/* Available words */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          key={roundIdx}
          style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center", maxWidth: "min(560px, calc(100vw - 32px))" }}
        >
          {shuffledWords.map((word, i) => {
            if (placedIndices.has(i)) return null;
            return (
              <motion.button
                key={`${word}-${i}`}
                variants={staggerItem}
                {...tapBounce}
                data-build-word={word} onClick={() => handleWordTap(i)}
                disabled={!!feedbackType || isAdvancing}
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: radii.lg,
                  backgroundColor: colors.bg.card,
                  border: `2px solid ${colors.border.light}`,
                  boxShadow: shadows.sm,
                  fontSize: fontSizes.lg,
                  fontWeight: "bold",
                  fontFamily: fonts.display,
                  color: GAME_COLOR,
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                {word}
              </motion.button>
            );
          })}
        </motion.div>
        </div>
        {/* Time bar on the right */}
        <div style={{ display: "flex", alignItems: "stretch", paddingTop: 30, paddingBottom: 20 }}>
          <TimeBar key={timerKey} seconds={SECONDS_PER_PHRASE} onTimeUp={handleTimeUp} color={GAME_COLOR} paused={!!feedbackType || isAdvancing} resetKey={timerKey} />
        </div>
      </div>
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
