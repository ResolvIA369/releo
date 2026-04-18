"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps, GameSessionState } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { sofiaNameWord, sofiaCelebrates, sofiaEncourages, stopVoice } from "@/shared/services/sofiaVoice";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#38a169";
const WORDS_PER_GAME = 20;

type Difficulty = 1 | 2 | 3;
type Phase = "difficulty" | "announcing" | "moving" | "feedback" | "finished";

function TrainGame({ words, phase = 1, difficulty, onComplete, onBack, isDemo = false }: GameProps & { difficulty: Difficulty }) {
  const wagonsPerTrack = 3;
  const totalTracks = difficulty;
  const totalOptions = wagonsPerTrack * totalTracks;
  const trainSpeed = difficulty === 1 ? 10 : difficulty === 2 ? 8 : 6;

  const { state, recordAttempt, finish, reset } = useGameState("word-train", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("announcing");
  const [roundIdx, setRoundIdx] = useState(0);
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);

  // Demo: auto-tap correct wagon
  useDemoAutoplay(isDemo, gamePhase === "moving" && !!targetWord, () => {
    const btn = document.querySelector(`[data-word-id="${targetWord?.id}"]`) as HTMLElement;
    if (btn) btn.click();
  }, 2000);
  const [tracks, setTracks] = useState<DomanWord[][]>([]);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [trainX, setTrainX] = useState(-100);

  const animRef = useRef<number>(undefined);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const resolvedRef = useRef(false);

  const gameWords = useMemo(() => shuffle(words).slice(0, WORDS_PER_GAME), [words]);
  const totalRounds = gameWords.length;

  // ─── Setup round ───────────────────────────────────────────────

  const setupRound = useCallback((idx: number) => {
    if (idx >= totalRounds) {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
      return;
    }
    const target = gameWords[idx];
    const others = shuffle(words.filter((w) => w.id !== target.id));
    const distractors = others.slice(0, totalOptions - 1);
    const allWagons = shuffle([target, ...distractors]);

    const newTracks: DomanWord[][] = [];
    for (let t = 0; t < totalTracks; t++) {
      newTracks.push(allWagons.slice(t * wagonsPerTrack, (t + 1) * wagonsPerTrack));
    }

    setTracks(newTracks);
    setTargetWord(target);
    setTappedId(null);
    setFeedbackType(null);
    setBurstPos(null);
    setTrainX(-100);
    resolvedRef.current = false;
    setGamePhase("announcing");
  }, [totalRounds, gameWords, words, totalOptions, totalTracks, wagonsPerTrack, finish, onComplete, state]);

  // Init first round
  useEffect(() => { setupRound(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Announce ──────────────────────────────────────────────────

  useEffect(() => {
    if (gamePhase !== "announcing" || !targetWord) return;
    let cancelled = false;
    sofiaNameWord(targetWord.text).then(() => {
      if (!cancelled) setTimeout(() => { if (!cancelled) setGamePhase("moving"); }, 500);
    });
    return () => { cancelled = true; };
  }, [gamePhase, targetWord]);

  // ─── Train animation (pauses when game is paused) ─────────────

  useEffect(() => {
    if (gamePhase !== "moving" || paused) return;

    if (pausedAtRef.current > 0) {
      // Resuming — adjust start time by how long we were paused
      startTimeRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    } else {
      startTimeRef.current = performance.now();
    }

    function tick(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / trainSpeed, 1);
      setTrainX(-100 + progress * 200);

      if (progress >= 1 && !resolvedRef.current) {
        resolvedRef.current = true;
        recordAttempt(false);
        setFeedbackType("wrong");
        setGamePhase("feedback");

        const hint = getHint();
        sofiaEncourages(hint).then(() => {
          setTimeout(() => {
            setFeedbackType(null);
            const next = roundIdx + 1;
            setRoundIdx(next);
            setupRound(next);
          }, 600);
        });
        return;
      }

      if (!resolvedRef.current) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (gamePhase === "moving" && paused) pausedAtRef.current = performance.now();
    };
  }, [gamePhase, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop voice on pause
  useEffect(() => { if (paused) stopVoice(); }, [paused]);

  // ─── Get hint ─────────────────────────────────────────────────

  const getHint = useCallback((): string => {
    if (!targetWord) return "";
    const posLabel = (i: number) => i === 0 ? "primer" : i === 1 ? "segundo" : "tercer";
    const trackLabel = (t: number) => {
      if (totalTracks === 1) return "el tren";
      if (totalTracks === 2) return t === 0 ? "el tren de arriba" : "el tren de abajo";
      return t === 0 ? "el tren de arriba" : t === 1 ? "el tren del medio" : "el tren de abajo";
    };

    for (let t = 0; t < tracks.length; t++) {
      const idx = tracks[t].findIndex((w) => w.id === targetWord.id);
      if (idx !== -1) {
        return `Estaba en ${trackLabel(t)}, en el ${posLabel(idx)} vagón`;
      }
    }
    return "";
  }, [targetWord, tracks, totalTracks]);

  // ─── Handle tap ───────────────────────────────────────────────

  const handleTap = useCallback(
    async (word: DomanWord, e: React.MouseEvent) => {
      if (gamePhase !== "moving" || resolvedRef.current) return;

      resolvedRef.current = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);

      setTappedId(word.id);
      const correct = word.id === targetWord?.id;
      recordAttempt(correct, correct ? word.id : undefined);
      setGamePhase("feedback");

      if (correct) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setBurstPos({ x: cx, y: cy });
        rewardCorrect(cx, cy);
        setFeedbackType("correct");
        await sofiaNameWord(word.text);
      } else {
        setFeedbackType("wrong");
        const hint = getHint();
        await sofiaEncourages(hint);
      }

      await new Promise((r) => setTimeout(r, 600));
      setFeedbackType(null);
      setBurstPos(null);
      const next = roundIdx + 1;
      setRoundIdx(next);
      setupRound(next);
    },
    [gamePhase, targetWord, recordAttempt, setupRound, roundIdx, getHint]
  );

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setupRound(0);
  }, [reset, setupRound]);

  // ─── Render wagon ─────────────────────────────────────────────

  const renderWagon = (word: DomanWord) => {
    const isTapped = tappedId === word.id;
    const isCorrect = isTapped && feedbackType === "correct";
    const isWrong = isTapped && feedbackType === "wrong";
    const isTarget = word.id === targetWord?.id && feedbackType === "wrong" && tappedId !== null;

    let bg: string = colors.bg.card;
    let border: string = "#8d6e63";
    let textColor: string = colors.text.primary;

    if (isCorrect) { bg = "#c6f6d5"; border = colors.success; textColor = colors.success; }
    else if (isWrong) { bg = "#fed7d7"; border = colors.error; textColor = colors.error; }
    else if (isTarget) { bg = "#c6f6d5"; border = colors.success; textColor = colors.success; }

    return (
      <motion.button
        key={word.id}
        data-word-id={word.id}
        onClick={(e) => handleTap(word, e)}
        disabled={gamePhase !== "moving"}
        whileTap={gamePhase === "moving" ? { scale: 0.9 } : {}}
        style={{
          width: 96, height: 62,
          borderRadius: radii.md,
          backgroundColor: bg, border: `3px solid ${border}`,
          boxShadow: isCorrect ? shadows.glow(colors.success) : shadows.sm,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: gamePhase === "moving" ? "pointer" : "default",
          fontSize: fontSizes.md, fontWeight: "bold",
          fontFamily: fonts.display, color: textColor, flexShrink: 0,
        }}
      >
        {word.text}
      </motion.button>
    );
  };

  // ─── Render a track ───────────────────────────────────────────

  const TRACK_COLORS = [GAME_COLOR, "#e53e3e", "#667eea"];
  const TRACK_BORDERS = ["#2d8a56", "#c53030", "#4c63d2"];

  const renderTrack = (trackIdx: number) => {
    const trackWords = tracks[trackIdx] ?? [];
    const locoColor = TRACK_COLORS[trackIdx];
    const locoBorder = TRACK_BORDERS[trackIdx];
    // Even tracks go left→right, odd tracks go right→left
    const goesRight = trackIdx % 2 === 0;
    const trackLabel = totalTracks === 1 ? "" :
      trackIdx === 0 ? "Vía 1" : trackIdx === 1 ? "Vía 2" : "Vía 3";

    return (
      <div key={trackIdx} style={{ position: "relative", height: 82, marginBottom: trackIdx < totalTracks - 1 ? spacing.lg : 0 }}>
        {/* Rails */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 4, backgroundColor: "#8d6e63" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 4, backgroundColor: "#8d6e63" }} />
        {/* Sleepers */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 14, height: 52, backgroundImage: "repeating-linear-gradient(90deg, #5d4037 0px, #5d4037 4px, transparent 4px, transparent 20px)", opacity: 0.25 }} />
        {/* Label */}
        {trackLabel && <div style={{ position: "absolute", top: -16, left: 8, fontSize: 11, color: "#6b8a6b", fontWeight: "bold" }}>{trackLabel}</div>}

        {/* Train container */}
        <div style={{
          position: "absolute", top: 6,
          display: "flex", gap: 6, alignItems: "center",
          ...(goesRight
            ? { left: `${trainX}%` }
            : { right: `${trainX}%` }
          ),
        }}>
          {goesRight ? (
            <>
              {/* Wagons trail behind (left), locomotive leads (right) */}
              {[...trackWords].reverse().map(renderWagon)}
              <div style={{
                width: 50, height: 62, borderRadius: radii.md,
                backgroundColor: locoColor, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 28, boxShadow: shadows.md, flexShrink: 0,
                border: `3px solid ${locoBorder}`,
              }}>
                🚂
              </div>
            </>
          ) : (
            <>
              {/* Locomotive leads (left, facing left), wagons trail (right) */}
              <div style={{
                width: 50, height: 62, borderRadius: radii.md,
                backgroundColor: locoColor, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 28, boxShadow: shadows.md, flexShrink: 0,
                border: `3px solid ${locoBorder}`,
                transform: "scaleX(-1)",
              }}>
                🚂
              </div>
              {trackWords.map(renderWagon)}
            </>
          )}
        </div>
      </div>
    );
  };

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    return (
      <GameCompleteScreen title="Tren de Palabras" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
      {/* Round + target */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "min(660px, calc(100vw - 32px))" }}>
        <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
          {roundIdx + 1} / {totalRounds}
        </span>
        {targetWord && (
          <motion.div
            key={roundIdx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: `${spacing.xs}px ${spacing.lg}px`,
              backgroundColor: `${GAME_COLOR}15`, border: `2px solid ${GAME_COLOR}`,
              borderRadius: radii.pill, fontSize: fontSizes.xl,
              fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR,
            }}
          >
            {targetWord.text}
          </motion.div>
        )}
        <span style={{ width: 40 }} />
      </div>

      {/* Tracks area */}
      <div style={{
        width: "100%", maxWidth: "min(660px, calc(100vw - 32px))",
        overflow: "hidden", borderRadius: radii.xl,
        backgroundColor: "#e8f5e9", border: `2px solid ${colors.border.light}`,
        padding: `${spacing.xl}px 0 ${spacing.lg}px`,
        position: "relative",
      }}>
        {Array.from({ length: totalTracks }, (_, i) => renderTrack(i))}

        {burstPos && (
          <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
            <VictoryBurst active x={burstPos.x} y={burstPos.y} count={12} />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: "min(660px, calc(100vw - 32px))", display: "flex", alignItems: "center", gap: spacing.sm }}>
        <span style={{ fontSize: 14 }}>🚂</span>
        <div style={{ flex: 1, height: 6, backgroundColor: colors.bg.secondary, borderRadius: radii.pill, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, (trainX + 100) / 2))}%`,
            backgroundColor: trainX > 60 ? colors.error : trainX > 20 ? colors.warning : GAME_COLOR,
            borderRadius: radii.pill, transition: "background-color 0.3s",
          }} />
        </div>
        <span style={{ fontSize: 14 }}>💨</span>
      </div>

      <FeedbackFlash type={feedbackType} />
    </div>
  );
}

// ═══ MAIN COMPONENT — Difficulty selector → Game ════════════════

const emptySession: GameSessionState = {
  gameId: "word-train", score: 0, totalAttempts: 0,
  correctAttempts: 0, startedAt: Date.now(), wordsCompleted: [],
};

export const WordTrain: React.FC<GameProps> = (props) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(props.isDemo ? 1 : null);

  if (difficulty === null) {
    return (
      <GameShell title="Tren de Palabras" icon="🚂" color={GAME_COLOR} session={emptySession} onBack={props.onBack ?? (() => {})}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: spacing.xl, minHeight: 400,
        }}>
          <SofiaAvatar size={48} speaking={false} />

          <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: GAME_COLOR, margin: 0 }}>
            Elige la dificultad
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, width: "100%", maxWidth: 300 }}>
            {([
              { level: 1 as Difficulty, label: "Facil", desc: "1 via, mas tiempo", emoji: "🟢" },
              { level: 2 as Difficulty, label: "Medio", desc: "2 vias, velocidad normal", emoji: "🟡" },
              { level: 3 as Difficulty, label: "Dificil", desc: "3 vias, mas rapido", emoji: "🔴" },
            ]).map(({ level, label, desc, emoji }) => (
              <motion.button
                key={level}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDifficulty(level)}
                style={{
                  display: "flex", alignItems: "center", gap: spacing.md,
                  padding: `${spacing.md}px ${spacing.lg}px`,
                  borderRadius: radii.xl, backgroundColor: colors.bg.card,
                  border: `2px solid ${colors.border.light}`,
                  boxShadow: shadows.sm, cursor: "pointer",
                  textAlign: "left", minHeight: 64,
                }}
              >
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: fontSizes.lg, fontWeight: "bold", fontFamily: fonts.display, color: colors.text.primary }}>
                    {label}
                  </div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>{desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Tren de Palabras" icon="🚂" color={GAME_COLOR} session={emptySession} onBack={props.onBack ?? (() => {})}>
      <TrainGame {...props} difficulty={difficulty} />
    </GameShell>
  );
};
