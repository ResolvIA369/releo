"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useArcadeEnergy } from "../hooks/useArcadeEnergy";
import { useArcadeLevel } from "../hooks/useArcadeLevel";
import { useArcadeClock } from "../hooks/useArcadeClock";
import { useSofiaIntro } from "../hooks/useSofiaIntro";
import { GameShell, usePause } from "./GameShell";
import { ArcadeHud } from "./ArcadeHud";
import { ArcadeIntro } from "./ArcadeIntro";
import { ArcadeMusic } from "./arcade-music";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, fontSizes, fonts, radii, shadows } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { fitWordFontSize } from "@/shared/utils/fitText";
import { wordRainTuningForPhase } from "../config/word-rain";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";

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

const INTRO_TEXT =
  "¡Soy la Seño Sofía! Del cielo caen palabras. " +
  "Escuchá cuál te pido, y tocala antes de que llegue al suelo. " +
  "¡Vos podés! ¡A atrapar!";

interface Drop {
  word: DomanWord;
  lane: number;
  delay: number;
  key: number;
}

type Phase = "intro" | "running" | "finished";

export const WordRain: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-rain", { phase });
  const { paused } = usePause();
  const { rewardCorrect } = useRewards();

  const tuning = wordRainTuningForPhase(phase);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [target, setTarget] = useState<DomanWord | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [fallSeconds, setFallSeconds] = useState(tuning.levels[0].fallSeconds);
  const [waveIdx, setWaveIdx] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [caughtId, setCaughtId] = useState<string | null>(null);

  const gamePhaseRef = useRef<Phase>("intro");
  gamePhaseRef.current = gamePhase;
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const bagRef = useRef<ReturnType<typeof createWordBag> | null>(null);
  if (!bagRef.current) bagRef.current = createWordBag(words);
  const targetRef = useRef<DomanWord | null>(null);
  const resolvedRef = useRef(false);
  const keyCounter = useRef(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const energy = useArcadeEnergy(tuning);
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { levelRef } = level;

  const musicRef = useRef<ArcadeMusic | null>(null);
  if (!musicRef.current) {
    musicRef.current = new ArcadeMusic(tuning.musicVolumeDb, tuning.musicDuckDb, tuning.musicTracks);
  }
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      stopVoice();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      musicRef.current?.dispose();
      musicRef.current = null;
    };
  }, []);

  const speakDucked = useCallback((speak: () => Promise<unknown>) => {
    stopVoice();
    musicRef.current?.duck(true);
    void speak().finally(() => musicRef.current?.duck(false));
  }, []);

  const flashFeedback = useCallback((type: "correct" | "wrong") => {
    setFeedbackType(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      if (!cancelledRef.current) setFeedbackType(null);
    }, 700);
  }, []);

  // ─── Wave: nuevas palabras caen ─────────────────────────────────

  const spawnWave = useCallback(() => {
    if (cancelledRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    const t = bagRef.current!.next();
    targetRef.current = t;
    const distractors = shuffle(wordsRef.current.filter((w) => w.id !== t.id)).slice(0, LANES - 1);
    const all = shuffle([t, ...distractors]);
    const lanes = shuffle(Array.from({ length: LANES }, (_, i) => i));
    setFallSeconds(lvl.fallSeconds);
    setTarget(t);
    setCaughtId(null);
    setBurstPos(null);
    resolvedRef.current = false;
    setDrops(all.map((w, i) => ({ word: w, lane: lanes[i], delay: i * 0.7, key: keyCounter.current++ })));
    setWaveIdx((w) => w + 1);
    speakDucked(() => sofiaNameWord(t.text));
  }, [tuning, levelRef, speakDucked]);

  const finishGame = useCallback(() => {
    if (cancelledRef.current) return;
    stopVoice();
    musicRef.current?.pause();
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finish, onComplete, state]);
  const finishRef = useRef(finishGame);
  finishRef.current = finishGame;

  const resolveWave = useCallback((delayMs: number) => {
    resolvedRef.current = true;
    setTimeout(() => { if (!cancelledRef.current) spawnWave(); }, delayMs);
  }, [spawnWave]);
  const resolveRef = useRef(resolveWave);
  resolveRef.current = resolveWave;

  // Intro de Sofia — solo al arrancar
  useSofiaIntro(gamePhase === "intro", "intro-lluvia", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  useEffect(() => {
    if (gamePhase === "running" && targetRef.current === null) spawnWave();
  }, [gamePhase, spawnWave]);

  // Clock: solo drena energia + sube nivel (la caida la anima framer)
  useArcadeClock(gamePhase === "running" && !paused, (dt) => {
    level.tick(dt);
    if (energy.drainTick(dt)) finishRef.current();
  });

  useEffect(() => {
    if (paused) { stopVoice(); musicRef.current?.pause(); }
    else if (gamePhaseRef.current === "running") musicRef.current?.resume();
  }, [paused]);

  // ─── Tap ────────────────────────────────────────────────────────
  const handleTap = useCallback((drop: Drop, e: React.MouseEvent) => {
    if (gamePhaseRef.current !== "running" || resolvedRef.current) return;
    void musicRef.current?.ensureStarted(levelRef.current);
    const correct = drop.word.id === targetRef.current?.id;
    recordAttempt(correct, correct ? targetRef.current?.id : undefined);

    if (correct) {
      setCaughtId(drop.word.id);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setBurstPos({ x: cx, y: cy });
      rewardCorrect(cx, cy);
      energy.adjust(tuning.energyGainCorrect);
      if (level.registerCorrect()) musicRef.current?.setLevel(levelRef.current);
      flashFeedback("correct");
      speakDucked(() => sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited"));
      resolveRef.current(450);
    } else {
      // Error mudo: solo flash + energia abajo; el target sigue cayendo
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
    }
  }, [energy, tuning, recordAttempt, rewardCorrect, speakDucked, flashFeedback, levelRef]);

  // Una palabra termino de caer
  const onDropLand = useCallback((isTarget: boolean) => {
    if (isTarget && !resolvedRef.current && gamePhaseRef.current === "running") {
      recordAttempt(false);
      energy.adjust(-tuning.energyLossEscape);
      flashFeedback("wrong");
      resolveRef.current(250);
    }
  }, [energy, tuning, recordAttempt, flashFeedback]);

  // Demo: cada tanda, toca la palabra correcta cuando ya esta cayendo
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !target) return;
    let done = false;
    const targetDrop = drops.find((d) => d.word.id === target.id);
    const t = setTimeout(() => {
      if (done || resolvedRef.current) return;
      const btn = document.querySelector(`[data-word-id="${target.id}"]`) as HTMLElement;
      if (btn) { done = true; btn.click(); }
    }, (targetDrop?.delay ?? 0) * 1000 + 1600);
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, target, drops]);

  const handleReplay = useCallback(() => {
    reset();
    energy.reset();
    level.reset();
    bagRef.current = createWordBag(words);
    targetRef.current = null;
    setGamePhase("running");
    musicRef.current?.setLevel(0);
    musicRef.current?.resume();
    spawnWave();
  }, [reset, energy, level, spawnWave]);

  // ═══ RENDER ════════════════════════════════════════════════

  if (gamePhase === "finished") {
    const reward = rewardForLevel(level.levelUi, tuning);
    return (
      <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Lluvia de Palabras"
          correct={state.correctAttempts}
          total={state.totalAttempts}
          color={GAME_COLOR}
          bonusCoins={reward.bonusCoins}
          starsOverride={reward.stars}
          subtitle={`Llegaste al Nivel ${level.levelUi + 1}`}
          onReplay={handleReplay}
          onBack={onBack ?? (() => {})}
        />
      </GameShell>
    );
  }

  return (
    <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} />}
        <ArcadeHud
          color={GAME_COLOR}
          targetPrefix="Atrapá:"
          level={level.levelUi}
          correct={state.correctAttempts}
          targetWord={target}
          waveKey={waveIdx}
          energy={energy.energyUi}
          energyMax={tuning.energyMax}
        />

        {/* Rain area */}
        <div style={{
          position: "relative", width: "100%", maxWidth: "min(600px, calc(100vw - 32px))", height: "min(450px, 60vh)",
          borderRadius: radii.xl,
          background: "linear-gradient(180deg, #ebf8ff 0%, #bee3f8 60%, #90cdf4 100%)",
          border: `2px solid ${colors.border.light}`, overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 8, left: "10%", fontSize: 36, opacity: 0.4 }}>☁️</div>
          <div style={{ position: "absolute", top: 4, right: "15%", fontSize: 28, opacity: 0.3 }}>☁️</div>

          {gamePhase === "running" && (
            <AnimatePresence>
              {drops.map((drop) => {
                const usableWidth = 70;
                const laneWidth = usableWidth / LANES;
                const leftPct = 15 + drop.lane * laneWidth + laneWidth / 2;
                if (caughtId === drop.word.id) return null;

                return (
                  <motion.button
                    key={drop.key}
                    initial={{ y: -80, opacity: 0 }}
                    animate={paused ? {} : { y: 450, opacity: 1 }}
                    transition={{ duration: fallSeconds, delay: drop.delay, ease: "linear" }}
                    onAnimationComplete={() => onDropLand(drop.word.id === targetRef.current?.id)}
                    data-word-id={drop.word.id} onClick={(e) => handleTap(drop, e)}
                    style={{
                      position: "absolute", left: `${leftPct}%`, transform: "translateX(-50%)",
                      padding: `${spacing.md}px ${spacing.lg}px`,
                      backgroundColor: "rgba(255,255,255,0.98)",
                      borderRadius: radii.xl, border: `3px solid ${GAME_COLOR}40`,
                      boxShadow: shadows.md, cursor: "pointer",
                      fontSize: fitWordFontSize(drop.word.text, fontSizes.xl),
                      fontWeight: "bold", fontFamily: fonts.display, color: "#2d3748",
                      whiteSpace: "nowrap", zIndex: 10, minWidth: 80, textAlign: "center",
                      willChange: "transform", backfaceVisibility: "hidden",
                      WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
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
