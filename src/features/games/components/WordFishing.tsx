"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { GameShell, usePause, useLeoContext } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { TimeBar } from "@/shared/components/TimeBar";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio } from "@/shared/services/sofiaVoice";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#0bc5ea";
const FISH_EMOJIS = ["🐟", "🐠", "🐡", "🦈"];
const SECONDS_PER_ROUND = 10;

type Phase = "intro" | "announcing" | "fishing" | "catching" | "feedback" | "finished";

export const WordFishing: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-fishing", { phase });
  const { paused } = usePause();
  const leo = useLeoContext();
  const { rewardCorrect } = useRewards();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<DomanWord | null>(null);
  const [fishes, setFishes] = useState<{ word: DomanWord; emoji: string; row: number; speed: number }[]>([]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [caughtId, setCaughtId] = useState<string | null>(null);
  const [hookY, setHookY] = useState(0); // 0 = top, 100 = extended down
  const [timerKey, setTimerKey] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const totalRounds = Math.min(words.length, 10);
  const finished = roundIdx >= totalRounds;

  const setupRound = useCallback((idx: number) => {
    if (idx >= totalRounds) {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
      return;
    }
    const t = words[idx];
    setTarget(t);
    setCaughtId(null);
    setHookY(0);
    setConfetti(false);
    setTimerKey((k) => k + 1);

    const others = shuffle(words.filter((w) => w.id !== t.id)).slice(0, 3);
    const all = shuffle([t, ...others]);

    setFishes(all.map((w, i) => ({
      word: w,
      emoji: FISH_EMOJIS[i % FISH_EMOJIS.length],
      row: i,
      speed: 5 + Math.random() * 3,
    })));

    setGamePhase("announcing");
  }, [totalRounds, words, finish, onComplete, state]);

  // Announce
  useEffect(() => {
    if (gamePhase !== "announcing" || !target || paused) return;
    let c = false;
    sofiaNameWord(target.text).then(() => {
      if (!c) setTimeout(() => { if (!c) setGamePhase("fishing"); }, 300);
    });
    return () => { c = true; };
  }, [gamePhase, roundIdx, paused]); // eslint-disable-line react-hooks/exhaustive-deps


  // Demo: auto-select correct answer
  useDemoAutoplay(isDemo, gamePhase === "fishing" && !!target, () => {
    const btn = document.querySelector(`[data-word-id="${target?.id}"]`) as HTMLElement;
    if (btn) btn.click();
  }, 1500);

  // Game end
  useEffect(() => {
    if (!finished || gamePhase === "finished") return;
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time up
  const handleTimeUp = useCallback(() => {
    if (gamePhase !== "fishing") return;
    recordAttempt(false);
    setFeedbackType("wrong");
    setGamePhase("feedback");
    leo.encourage();
    sofiaPlayAudio("animo-16", "¡Se acabó el tiempo!", "encouraging").then(() => {
      setTimeout(() => {
        setFeedbackType(null);
        const next = roundIdx + 1;
        setRoundIdx(next);
        setupRound(next);
      }, 500);
    });
  }, [gamePhase, recordAttempt, roundIdx, setupRound, leo]);

  // Handle tap
  const handleTap = useCallback(
    async (fish: { word: DomanWord; row: number }, e: React.MouseEvent) => {
      if (gamePhase !== "fishing" || feedbackType) return;

      const correct = fish.word.id === target?.id;
      recordAttempt(correct, correct ? fish.word.id : undefined);
      setCaughtId(fish.word.id);

      if (correct) {
        // Animate hook going down to catch the fish
        setGamePhase("catching");
        const fishYPercent = 28 + fish.row * 18;
        setHookY(fishYPercent);

        await new Promise((r) => setTimeout(r, 600));

        // Now reel up with the fish
        setHookY(-20);
        setConfetti(true);
        setFeedbackType("correct");
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setBurstPos({ x: cx, y: cy });
        leo.celebrate();
        rewardCorrect(cx, cy);

        await sofiaPlayAudio("celebra-05", `¡${fish.word.text}!`, "excited");
        await new Promise((r) => setTimeout(r, 800));

        setFeedbackType(null);
        setBurstPos(null);
        setConfetti(false);
        const next = roundIdx + 1;
        setRoundIdx(next);
        setupRound(next);
      } else {
        setFeedbackType("wrong");
        setGamePhase("feedback");
        leo.think();
        await sofiaPlayAudio("animo-01", "¡Intenta otra vez!", "encouraging");
        await new Promise((r) => setTimeout(r, 400));
        setFeedbackType(null);
        setCaughtId(null);
        setGamePhase("fishing");
      }
    },
    [gamePhase, target, feedbackType, recordAttempt, roundIdx, setupRound, leo]
  );

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setGamePhase("intro");
  }, [reset]);

  // ═══ RENDER ════════════════════════════════════════════════

  if (gamePhase === "intro") {
    return (
      <GameShell title="Pesca de Palabras" icon="🎣" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro gameName="Pesca de Palabras" gameIcon="🎣"
          rulesText="¡Los peces nadan con palabras! Yo te digo cual pescar. ¡Toca el pez correcto!"
          color={GAME_COLOR} onReady={() => setupRound(0)} />
      </GameShell>
    );
  }

  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Pesca de Palabras" icon="🎣" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Pesca de Palabras" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Pesca de Palabras" icon="🎣" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", gap: spacing.md, paddingTop: spacing.sm, maxWidth: "min(660px, calc(100vw - 32px))", margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md }}>
          {/* Target + counter */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>{roundIdx + 1}/{totalRounds}</span>
            {target && (
              <motion.div key={roundIdx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: `${spacing.xs}px ${spacing.lg}px`, backgroundColor: `${GAME_COLOR}15`,
                  border: `2px solid ${GAME_COLOR}`, borderRadius: radii.pill,
                  fontSize: fontSizes.xl, fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR,
                }}>
                🎣 {target.text} {EMOJI_MAP[target.text] ?? ""}
              </motion.div>
            )}
            <span style={{ width: 30 }} />
          </div>

          {/* Ocean */}
          <div style={{
            position: "relative", width: "100%", height: "min(400px, 50vh)",
            borderRadius: radii.xl, overflow: "hidden",
            background: "linear-gradient(180deg, #b3e5fc 0%, #4fc3f7 25%, #0288d1 60%, #01579b 100%)",
            border: `2px solid ${colors.border.light}`,
          }}>
            {/* Waves */}
            <motion.div animate={{ x: [-30, 30, -30] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              style={{ position: "absolute", top: "16%", left: -20, right: -20, height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3 }} />

            {/* Animated fishing hook */}
            <motion.div
              animate={{ height: `${Math.max(hookY, 18)}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{
                position: "absolute", top: 0, left: "50%", width: 2,
                backgroundColor: "#555", transform: "translateX(-50%)", zIndex: 20,
              }}
            />
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", fontSize: 28, zIndex: 21 }}>🎣</div>
            {/* Hook end */}
            <motion.div
              animate={{ top: `${Math.max(hookY, 18)}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 16, zIndex: 20 }}
            >
              🪝
            </motion.div>

            {/* Confetti overlay */}
            <AnimatePresence>
              {confetti && (
                <>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 1, y: 150, x: 300 + (Math.random() - 0.5) * 400, scale: 1 }}
                      animate={{ y: -50, opacity: 0, rotate: Math.random() * 360 }}
                      transition={{ duration: 1.2, delay: i * 0.05 }}
                      style={{
                        position: "absolute", width: 8, height: 8, borderRadius: 2,
                        backgroundColor: ["#fbbf24", "#e53e3e", "#48bb78", "#667eea", "#f093fb", "#0bc5ea"][i % 6],
                        zIndex: 30,
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Fish */}
            {fishes.map((fish, i) => {
              const isCaught = caughtId === fish.word.id && feedbackType === "correct";
              if (isCaught) return null;
              if (caughtId === fish.word.id && gamePhase === "catching") {
                // Fish being reeled up
                return (
                  <motion.div key={`caught-${fish.word.id}`}
                    animate={{ top: "-10%", left: "45%", scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      position: "absolute", top: `${28 + fish.row * 18}%`,
                      padding: `${spacing.sm}px ${spacing.md}px`,
                      backgroundColor: "#fff",
                      borderRadius: radii.xl, border: `3px solid ${colors.success}`,
                      fontSize: fontSizes.lg, fontWeight: "bold", fontFamily: fonts.display,
                      color: "#2d3748", zIndex: 25, display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {fish.emoji} {fish.word.text}
                  </motion.div>
                );
              }

              const yPos = 28 + i * 18;
              const goesRight = i % 2 === 0;

              return (
                <motion.button
                  key={`${fish.word.id}-${roundIdx}`}
                  animate={paused ? {} : {
                    x: goesRight ? [-140, 500, -140] : [500, -140, 500],
                  }}
                  transition={{ repeat: Infinity, duration: fish.speed, ease: "linear" }}
                  data-word-id={fish.word.id} onClick={(e) => handleTap(fish, e)}
                  disabled={gamePhase !== "fishing" || !!feedbackType}
                  style={{
                    position: "absolute", top: `${yPos}%`, left: 0,
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: radii.xl,
                    border: `3px solid rgba(255,255,255,0.7)`,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                    fontSize: fontSizes.lg, fontWeight: "bold",
                    fontFamily: fonts.display, color: "#1a365d",
                    cursor: gamePhase === "fishing" ? "pointer" : "default",
                    zIndex: 10, display: "flex", alignItems: "center", gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-block", transform: goesRight ? "none" : "scaleX(-1)" }}>
                    {fish.emoji}
                  </span>
                  <span>{fish.word.text}</span>
                </motion.button>
              );
            })}

            {/* Bubbles */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div key={i}
                animate={{ y: [-10, -180], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8 }}
                style={{
                  position: "absolute", bottom: 30, left: `${15 + i * 25}%`,
                  width: 6 + i * 2, height: 6 + i * 2, borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.3)",
                }} />
            ))}

            {/* Seaweed */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
              {["🪸", "🌿", "🪸", "🌿", "🪸"].map((s, i) => (
                <motion.span key={i} animate={{ rotate: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut" }}
                  style={{ fontSize: 20, display: "block" }}>{s}</motion.span>
              ))}
            </div>

            {burstPos && (
              <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
                <VictoryBurst active x={burstPos.x} y={burstPos.y} count={15} />
              </div>
            )}
          </div>
        </div>

        {/* Time bar */}
        <div style={{ display: "flex", alignItems: "stretch", paddingTop: 40, paddingBottom: 20 }}>
          <TimeBar
            key={timerKey}
            seconds={SECONDS_PER_ROUND}
            onTimeUp={handleTimeUp}
            color={GAME_COLOR}
            paused={paused || gamePhase !== "fishing"}
            resetKey={timerKey}
          />
        </div>
      </div>
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
