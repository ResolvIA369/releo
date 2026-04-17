"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { TimeBar } from "@/shared/components/TimeBar";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { fitWordFontSize } from "@/shared/utils/fitText";
import { tapBounce, staggerContainer, staggerItem } from "@/shared/styles/animations";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { sofiaCelebrates, sofiaEncourages, sofiaNameWord } from "@/shared/services/sofiaVoice";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#3182ce";
const OPTIONS_COUNT = 4;
const SECONDS_PER_WORD = 7;

type Phase = "intro" | "playing" | "feedback" | "finished";

export const WordImageMatch: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-image-match", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  const totalWords = Math.min(words.length, 10);
  const currentWord = currentIndex < totalWords ? words[currentIndex] : null;
  const finished = currentIndex >= totalWords;


  // Demo: auto-select correct answer
  useDemoAutoplay(isDemo, gamePhase === "playing" && !feedbackType && !!currentWord, () => {
    const btn = document.querySelector(`[data-word-id="${currentWord?.id}"]`) as HTMLElement;
    if (btn) btn.click();
  }, 1500);

  // Game end
  useEffect(() => {
    if (!finished || gamePhase === "finished") return;
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sofia names the target word as soon as it appears so the child
  // knows which image to look for. Runs once per word while playing.
  useEffect(() => {
    if (gamePhase !== "playing" || !currentWord) return;
    sofiaNameWord(currentWord.text);
  }, [gamePhase, currentWord]);

  // Options
  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = words.filter((w) => w.id !== currentWord.id);
    const distractors = shuffle(others).slice(0, OPTIONS_COUNT - 1);
    return shuffle([currentWord, ...distractors]);
  }, [currentWord, words]);

  // Time up
  const handleTimeUp = useCallback(() => {
    if (gamePhase !== "playing" || !currentWord) return;
    recordAttempt(false);
    setFeedbackType("wrong");
    setGamePhase("feedback");

    sofiaEncourages(`¡Se acabo el tiempo! Era "${currentWord.text}"`).then(() => {
      setTimeout(() => {
        setFeedbackType(null);
        setSelectedId(null);
        setCurrentIndex((i) => i + 1);
        setTimerKey((k) => k + 1);
        setGamePhase("playing");
      }, 500);
    });
  }, [gamePhase, currentWord, recordAttempt]);

  // Handle tap
  const handleSelect = useCallback(
    async (word: DomanWord, e: React.MouseEvent) => {
      if (gamePhase !== "playing" || feedbackType || !currentWord) return;

      setSelectedId(word.id);
      const correct = word.id === currentWord.id;
      recordAttempt(correct, correct ? currentWord.id : undefined);
      setFeedbackType(correct ? "correct" : "wrong");
      setGamePhase("feedback");

      if (correct) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setBurstPos({ x: cx, y: cy });
        rewardCorrect(cx, cy);
        // Only say the word AFTER correct answer
        await sofiaCelebrates(`¡${currentWord.text}!`);
        await new Promise((r) => setTimeout(r, 400));
        setFeedbackType(null);
        setSelectedId(null);
        setBurstPos(null);
        setCurrentIndex((i) => i + 1);
        setTimerKey((k) => k + 1);
        setGamePhase("playing");
      } else {
        await sofiaEncourages("¡Intenta otra vez!");
        await new Promise((r) => setTimeout(r, 300));
        setFeedbackType(null);
        setSelectedId(null);
        // Let child try again, don't advance
        setGamePhase("playing");
      }
    },
    [currentWord, gamePhase, feedbackType, recordAttempt]
  );

  const handleReplay = useCallback(() => {
    reset();
    setCurrentIndex(0);
    setTimerKey(0);
    setGamePhase("intro");
  }, [reset]);

  // ═══ RENDER ════════════════════════════════════════════════

  if (gamePhase === "intro") {
    return (
      <GameShell title="Empareja Palabra-Imagen" icon="🖼️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro
          gameName="Empareja Palabra-Imagen"
          gameIcon="🖼️"
          rulesText="Voy a mostrarte una palabra. ¡Toca la imagen que le corresponde antes de que se acabe el tiempo!"
          color={GAME_COLOR}
          isDemo={isDemo} onReady={() => setGamePhase("playing")}
        />
      </GameShell>
    );
  }

  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Empareja Palabra-Imagen" icon="🖼️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Empareja Palabra-Imagen" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  if (!currentWord) return null;

  return (
    <GameShell title="Empareja Palabra-Imagen" icon="🖼️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", gap: spacing.md, paddingTop: spacing.md, maxWidth: "min(620px, calc(100vw - 32px))", margin: "0 auto" }}>
        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}>
          {/* Counter */}
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
            {currentIndex + 1} / {totalWords}
          </span>

          {/* Word to match — NO audio, just visual */}
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: `${spacing.md}px ${spacing.xl}px`,
              backgroundColor: `${GAME_COLOR}10`,
              border: `3px solid ${GAME_COLOR}`,
              borderRadius: radii.xl,
            }}
          >
            <span style={{ fontSize: fitWordFontSize(currentWord.text, fontSizes["3xl"]), fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR, whiteSpace: "nowrap" }}>
              {currentWord.text}
            </span>
          </motion.div>

          {/* Emoji options grid */}
          <motion.div
            variants={staggerContainer} initial="initial" animate="animate"
            key={`opts-${currentWord.id}`}
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: spacing.md, width: "100%" }}
          >
            {options.map((word) => {
              const isSelected = selectedId === word.id;
              const isCorrect = word.id === currentWord.id;

              let borderColor: string = colors.border.light;
              let bg: string = colors.bg.card;
              if (feedbackType && isSelected) {
                borderColor = feedbackType === "correct" ? colors.success : colors.error;
                bg = feedbackType === "correct" ? "#c6f6d5" : "#fed7d7";
              }
              if (feedbackType === "wrong" && isCorrect && selectedId !== null) {
                borderColor = colors.success;
              }

              return (
                <motion.button
                  key={word.id}
                  variants={staggerItem}
                  {...(feedbackType ? {} : tapBounce)}
                  data-word-id={word.id} onClick={(e) => handleSelect(word, e)}
                  disabled={!!feedbackType}
                  style={{
                    padding: spacing.lg, borderRadius: radii.xl,
                    border: `3px solid ${borderColor}`, backgroundColor: bg,
                    fontSize: 56, cursor: feedbackType ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isSelected && feedbackType === "correct" ? shadows.glow(colors.success) : shadows.sm,
                    minHeight: 90,
                  }}
                >
                  <span>{EMOJI_MAP[word.text] ?? "❓"}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Time bar on the right */}
        <div style={{ display: "flex", alignItems: "stretch", paddingTop: 40, paddingBottom: 20 }}>
          <TimeBar
            key={timerKey}
            seconds={SECONDS_PER_WORD}
            onTimeUp={handleTimeUp}
            color={GAME_COLOR}
            paused={paused || gamePhase === "feedback"}
            resetKey={timerKey}
          />
        </div>
      </div>

      {burstPos && (
        <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
          <VictoryBurst active x={burstPos.x} y={burstPos.y} count={10} />
        </div>
      )}
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
