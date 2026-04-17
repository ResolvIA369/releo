"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { sofiaReads, sofiaCelebrates } from "@/shared/services/sofiaVoice";
import { GameShell } from "./GameShell";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { TimeBar } from "@/shared/components/TimeBar";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { QuickCelebration } from "@/shared/components/QuickCelebration";
import { SENTENCE_EXAMPLES } from "@/shared/constants";
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

interface Sentence {
  text: string;
  words: string[];
}

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
    sentences.push({ text: phrase, words: phrase.split(" ") });
  }

  // Strategy 2: "article + word" (e.g. "el bebé", "la mamá")
  for (const word of shuffle(texts)) {
    if (sentences.length >= count) break;
    const art = ARTICLES[Math.floor(Math.random() * ARTICLES.length)];
    const phrase = `${art} ${word}`;
    sentences.push({ text: phrase, words: phrase.split(" ") });
  }

  // Strategy 3: "word + verb + word" (e.g. "mamá come pan")
  const shuffled2 = shuffle(texts);
  for (let i = 0; i + 1 < shuffled2.length && sentences.length < count; i += 2) {
    const verb = SIMPLE_VERBS[Math.floor(Math.random() * SIMPLE_VERBS.length)];
    const phrase = `${shuffled2[i]} ${verb} ${shuffled2[i + 1]}`;
    sentences.push({ text: phrase, words: phrase.split(" ") });
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

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Pick sentences: prefer SENTENCE_EXAMPLES that use words from props,
  // then fill remaining rounds from generated sentences
  const sentences = useMemo(() => {
    const wordTexts = new Set(words.map((w) => w.text.toLowerCase()));

    // Filter SENTENCE_EXAMPLES to those whose words overlap with the prop words
    const relevant = SENTENCE_EXAMPLES.filter((s) =>
      s.fullText.split(" ").some((w) => wordTexts.has(w.toLowerCase()))
    ).map((s) => ({
      text: s.fullText,
      words: s.fullText.split(" "),
    }));

    const picked = shuffle(relevant).slice(0, TOTAL_ROUNDS);

    // Fill remaining rounds from the words prop
    if (picked.length < TOTAL_ROUNDS) {
      const generated = buildSentencesFromWords(words, TOTAL_ROUNDS - picked.length);
      picked.push(...generated);
    }

    // If still not enough (very few words passed), use any SENTENCE_EXAMPLES as last resort
    if (picked.length < TOTAL_ROUNDS) {
      const fallback = shuffle(
        SENTENCE_EXAMPLES.map((s) => ({ text: s.fullText, words: s.fullText.split(" ") }))
      );
      for (const fb of fallback) {
        if (picked.length >= TOTAL_ROUNDS) break;
        if (!picked.some((p) => p.text === fb.text)) picked.push(fb);
      }
    }

    return picked.slice(0, TOTAL_ROUNDS);
  }, [words]);

  const currentSentence = sentences[roundIdx];
  const shuffledWords = useMemo(
    () => (currentSentence ? shuffle(currentSentence.words) : []),
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

      const word = shuffledWords[tappedIndex];
      const nextIdx = placed.length;
      const expected = currentSentence.words[nextIdx];

      if (word === expected) {
        const newPlaced = [...placed, word];
        setPlaced(newPlaced);

        // Check if sentence complete
        if (newPlaced.length === currentSentence.words.length) {
          recordAttempt(true);
          setShowCelebration(true);
          setFeedbackType("correct");
          setIsAdvancing(true);
          rewardCorrect();

          (async () => {
            await sofiaCelebrates(`¡Muy bien!`);
            await sofiaReads(currentSentence.text);
            advanceRound();
          })();
        }
      } else {
        // Wrong word
        setFeedbackType("wrong");
        setTimeout(() => setFeedbackType(null), 600);
      }
    },
    [placed, currentSentence, feedbackType, isAdvancing, shuffledWords, recordAttempt, advanceRound]
  );

  const handleTimeUp = useCallback(() => {
    if (!currentSentence || isAdvancing) return;
    recordAttempt(false);
    setIsAdvancing(true);

    (async () => {
      await sofiaReads(currentSentence.text);
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
          {currentSentence?.words.map((_, i) => (
            <div
              key={i}
              style={{
                minWidth: 60,
                height: 40,
                borderRadius: radii.md,
                border: `2px dashed ${i < placed.length ? colors.success : colors.border.light}`,
                backgroundColor: i < placed.length ? `${colors.success}15` : colors.bg.card,
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
              {placed[i] ?? ""}
            </div>
          ))}
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
