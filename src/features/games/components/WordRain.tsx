"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { GameShell, usePause } from "./GameShell";
import { GameIntro } from "./GameIntro";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, fontSizes, fonts, radii, shadows } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaCelebrates, sofiaEncourages } from "@/shared/services/sofiaVoice";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#4299e1";
const LANES = 3;

// Slow and progressive: 8s → 5s minimum
function getFallDuration(round: number): number {
  return Math.max(5, 8 - round * 0.4);
}

interface Drop {
  word: DomanWord;
  lane: number;
  delay: number; // stagger delay
  key: number;
}

type Phase = "intro" | "announcing" | "dropping" | "feedback" | "finished";

export const WordRain: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-rain", { phase });
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [caughtId, setCaughtId] = useState<string | null>(null);
  const keyCounter = useRef(0);
  const resolvedRef = useRef(false);

  const totalRounds = Math.min(words.length, 10);
  const targetWord = words[roundIdx];
  const finished = roundIdx >= totalRounds;
  const fallDuration = getFallDuration(roundIdx);

  // ─── Announce ────────────────────────────────────────────────

  useEffect(() => {
    if (gamePhase !== "announcing" || !targetWord || finished) return;
    let cancelled = false;
    sofiaNameWord(targetWord.text).then(() => {
      if (!cancelled) setTimeout(() => { if (!cancelled) setGamePhase("dropping"); }, 400);
    });
    return () => { cancelled = true; };
  }, [gamePhase, roundIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Generate drops (staggered) ─────────────────────────────

  useEffect(() => {
    if (gamePhase !== "dropping" || finished || !targetWord) return;

    resolvedRef.current = false;
    setCaughtId(null);

    const others = shuffle(words.filter((w) => w.id !== targetWord.id));
    const distractors = others.slice(0, LANES - 1);
    const all = shuffle([targetWord, ...distractors]);
    const lanes = shuffle(Array.from({ length: LANES }, (_, i) => i));

    setDrops(all.map((w, i) => ({
      word: w,
      lane: lanes[i],
      delay: i * 0.8, // stagger: each word falls 0.8s after the previous
      key: keyCounter.current++,
    })));
  }, [gamePhase, roundIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Game end ───────────────────────────────────────────────

  useEffect(() => {
    if (!finished || gamePhase === "finished") return;
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle tap ─────────────────────────────────────────────

  const handleTap = useCallback(
    async (drop: Drop, e: React.MouseEvent) => {
      if (resolvedRef.current || gamePhase !== "dropping") return;
      resolvedRef.current = true;

      const correct = drop.word.id === targetWord.id;
      recordAttempt(correct, correct ? targetWord.id : undefined);
      setCaughtId(drop.word.id);
      setFeedbackType(correct ? "correct" : "wrong");
      setGamePhase("feedback");

      if (correct) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setBurstPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        await sofiaCelebrates(`¡${targetWord.text}!`);
      } else {
        await sofiaEncourages(`¡Esa no! Busca "${targetWord.text}"`);
      }

      await new Promise((r) => setTimeout(r, 500));
      setFeedbackType(null);
      setBurstPos(null);
      if (correct) {
        setRoundIdx((i) => i + 1);
        setGamePhase("announcing");
      } else {
        resolvedRef.current = false;
        setCaughtId(null);
        setGamePhase("dropping");
      }
    },
    [gamePhase, targetWord, recordAttempt]
  );

  // ─── Handle missed (all drops fell) ─────────────────────────

  const handleMissed = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    recordAttempt(false);
    setFeedbackType("wrong");
    setGamePhase("feedback");

    sofiaEncourages("¡Se escapo!").then(() => {
      setTimeout(() => {
        setFeedbackType(null);
        setRoundIdx((i) => i + 1);
        setGamePhase("announcing");
      }, 500);
    });
  }, [recordAttempt]);

  // Track how many drops finished falling
  const dropsLanded = useRef(0);
  const onDropLand = useCallback((isTarget: boolean) => {
    dropsLanded.current++;
    if (isTarget && !resolvedRef.current) {
      handleMissed();
    }
  }, [handleMissed]);

  // Reset counter when new drops
  useEffect(() => { dropsLanded.current = 0; }, [drops]);

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setGamePhase("intro");
  }, [reset]);

  // ═══ RENDER ════════════════════════════════════════════════

  if (gamePhase === "intro") {
    return (
      <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro
          gameName="Lluvia de Palabras"
          gameIcon="🌧️"
          rulesText="¡Palabras caen del cielo! Yo te digo cual atrapar. ¡Tocala antes de que llegue al suelo!"
          color={GAME_COLOR}
          onReady={() => setGamePhase("announcing")}
        />
      </GameShell>
    );
  }

  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Lluvia de Palabras" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {/* Target + counter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 600 }}>
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>{roundIdx + 1}/{totalRounds}</span>
          {targetWord && (
            <motion.div key={roundIdx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: `${spacing.xs}px ${spacing.lg}px`, backgroundColor: `${GAME_COLOR}15`,
                border: `2px solid ${GAME_COLOR}`, borderRadius: radii.pill,
                fontSize: fontSizes.xl, fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR,
              }}>
              {targetWord.text} {EMOJI_MAP[targetWord.text] ?? ""}
            </motion.div>
          )}
          <span style={{ fontSize: 14 }}>{fallDuration <= 5.5 ? "🔥" : "💨"}</span>
        </div>

        {/* Rain area */}
        <div style={{
          position: "relative", width: "100%", maxWidth: 600, height: 450,
          borderRadius: radii.xl, overflow: "hidden",
          background: "linear-gradient(180deg, #ebf8ff 0%, #bee3f8 60%, #90cdf4 100%)",
          border: `2px solid ${colors.border.light}`,
        }}>
          {/* Cloud decorations */}
          <div style={{ position: "absolute", top: 8, left: "10%", fontSize: 36, opacity: 0.4 }}>☁️</div>
          <div style={{ position: "absolute", top: 4, right: "15%", fontSize: 28, opacity: 0.3 }}>☁️</div>

          {/* Drops */}
          {gamePhase === "dropping" && (
            <AnimatePresence>
              {drops.map((drop) => {
                // Keep words away from edges: 15% to 85% range
                const usableWidth = 70; // percentage of container
                const laneWidth = usableWidth / LANES;
                const leftPct = 15 + drop.lane * laneWidth + laneWidth / 2;
                const isCaught = caughtId === drop.word.id;

                if (isCaught) return null;

                return (
                  <motion.button
                    key={drop.key}
                    initial={{ y: -80, opacity: 0 }}
                    animate={paused ? {} : { y: 450, opacity: 1 }}
                    transition={{ duration: fallDuration, delay: drop.delay, ease: "linear" }}
                    onAnimationComplete={() => onDropLand(drop.word.id === targetWord?.id)}
                    onClick={(e) => handleTap(drop, e)}
                    disabled={!!feedbackType}
                    style={{
                      position: "absolute", left: `${leftPct}%`, transform: "translateX(-50%)",
                      padding: `${spacing.md}px ${spacing.lg}px`,
                      backgroundColor: "rgba(255,255,255,0.95)",
                      borderRadius: radii.xl, border: `3px solid ${GAME_COLOR}40`,
                      boxShadow: shadows.md, cursor: "pointer",
                      fontSize: fontSizes.xl, fontWeight: "bold",
                      fontFamily: fonts.display, color: "#2d3748",
                      whiteSpace: "nowrap", zIndex: 10,
                      minWidth: 80, textAlign: "center",
                    }}
                  >
                    {drop.word.text}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}

          {/* Ground */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
            background: "linear-gradient(180deg, #68d391 0%, #38a169 100%)",
            borderRadius: `0 0 ${radii.xl} ${radii.xl}`,
          }}>
            <div style={{ position: "absolute", top: 4, left: "20%", fontSize: 16 }}>🌱</div>
            <div style={{ position: "absolute", top: 6, left: "50%", fontSize: 14 }}>🌿</div>
            <div style={{ position: "absolute", top: 4, right: "25%", fontSize: 16 }}>🌱</div>
          </div>

          {burstPos && (
            <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
              <VictoryBurst active x={burstPos.x} y={burstPos.y} count={10} />
            </div>
          )}
        </div>
      </div>
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
