"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useArcadeEnergy } from "../hooks/useArcadeEnergy";
import { useArcadeLevel } from "../hooks/useArcadeLevel";
import { useArcadeClock } from "../hooks/useArcadeClock";
import { useSofiaIntro } from "../hooks/useSofiaIntro";
import { GameShell, usePause } from "./GameShell";
import { ArcadeHud } from "./ArcadeHud";
import { ArcadeMusic } from "./arcade-music";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { wordTrainTuningForPhase } from "../config/word-train";
import { rewardForLevel, pickNextTarget } from "../config/arcade-tuning";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#38a169";

const INTRO_TEXT =
  "¡Hola! Soy la Seño Sofía. Mirá los trenes que pasan. " +
  "Escuchá la palabra, y tocá el vagón donde está escrita antes de que se vaya. " +
  "¡Vos podés! ¡Allá va el tren!";

type Phase = "intro" | "running" | "finished";

export const WordTrain: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-train", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const tuning = wordTrainTuningForPhase(phase);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [wagons, setWagons] = useState<DomanWord[]>([]);
  const [waveIdx, setWaveIdx] = useState(0);
  const [trainX, setTrainX] = useState(-110);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);

  const gamePhaseRef = useRef<Phase>("intro");
  gamePhaseRef.current = gamePhase;
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const lastTargetIdRef = useRef<string | null>(null);
  const targetRef = useRef<DomanWord | null>(null);
  const trainXRef = useRef(-110);
  const resolvedRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const energy = useArcadeEnergy(tuning);
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { levelRef } = level;

  // Musica: instancia liviana, el audio recien se crea tras el gesto
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

  // Sofia habla → la musica se agacha hasta que termina
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

  // ─── Wave: un tren nuevo entra desde la izquierda ────────────────

  const spawnWave = useCallback(() => {
    if (cancelledRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    const target = pickNextTarget(wordsRef.current, lastTargetIdRef.current);
    lastTargetIdRef.current = target.id;
    targetRef.current = target;
    const distractors = shuffle(wordsRef.current.filter((w) => w.id !== target.id)).slice(0, lvl.wagons - 1);
    setWagons(shuffle([target, ...distractors]));
    setTargetWord(target);
    setTappedId(null);
    setBurstPos(null);
    trainXRef.current = -110;
    setTrainX(-110);
    resolvedRef.current = false;
    setWaveIdx((w) => w + 1);
    // Sofia nombra en paralelo — el tren ya esta entrando
    speakDucked(() => sofiaNameWord(target.text));
  }, [tuning, levelRef, speakDucked]);

  // Sin energia → fin del juego
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
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setTimeout(() => { if (!cancelledRef.current) spawnWave(); }, delayMs);
  }, [spawnWave]);
  const resolveRef = useRef(resolveWave);
  resolveRef.current = resolveWave;

  // ─── Intro de Sofia — solo al arrancar ───────────────────────────
  useSofiaIntro(gamePhase === "intro", "intro-tren", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  // Primera tanda al pasar a running
  useEffect(() => {
    if (gamePhase === "running" && targetRef.current === null) spawnWave();
  }, [gamePhase, spawnWave]);

  // ─── Clock: mueve el tren + drena energia + sube nivel ───────────
  useArcadeClock(gamePhase === "running" && !paused, (dt) => {
    level.tick(dt);
    if (energy.drainTick(dt)) { finishRef.current(); return; }

    if (resolvedRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    // 220% de recorrido en crossSeconds (a 60fps), acelerado por nivel
    const step = (220 / (tuning.crossSeconds * 60)) * lvl.speedMul * dt;
    trainXRef.current += step;
    setTrainX(trainXRef.current);
    if (trainXRef.current >= 110) {
      // El tren se fue sin que toques: intento fallido (escape)
      recordAttempt(false);
      energy.adjust(-tuning.energyLossEscape);
      flashFeedback("wrong");
      resolveRef.current(200);
    }
  });

  // Pausa: frenar voz y musica
  useEffect(() => {
    if (paused) { stopVoice(); musicRef.current?.pause(); }
    else if (gamePhaseRef.current === "running") musicRef.current?.resume();
  }, [paused]);

  // ─── Tap de un vagon ─────────────────────────────────────────────
  const handleTap = useCallback((word: DomanWord, e: React.MouseEvent) => {
    if (gamePhaseRef.current !== "running" || resolvedRef.current) return;
    void musicRef.current?.ensureStarted(levelRef.current);
    setTappedId(word.id);
    const correct = word.id === targetRef.current?.id;
    recordAttempt(correct, correct ? word.id : undefined);

    if (correct) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setBurstPos({ x: cx, y: cy });
      rewardCorrect(cx, cy);
      energy.adjust(tuning.energyGainCorrect);
      if (level.registerCorrect()) musicRef.current?.setLevel(levelRef.current);
      flashFeedback("correct");
      speakDucked(() => sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited"));
    } else {
      // Error mudo: solo el flash visual + energia abajo
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
    }
    resolveRef.current(correct ? 500 : 350);
  }, [energy, tuning, recordAttempt, rewardCorrect, speakDucked, levelRef]);

  // Demo: cada tanda, toca el vagon correcto cuando el tren entra en
  // la ventana visible (polling porque el target se mueve)
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !targetWord) return;
    let done = false;
    const iv = setInterval(() => {
      if (done || resolvedRef.current) return;
      if (trainXRef.current > -5 && trainXRef.current < 70) {
        const btn = document.querySelector(`[data-word-id="${targetRef.current?.id}"]`) as HTMLElement;
        if (btn) { done = true; btn.click(); }
      }
    }, 250);
    return () => clearInterval(iv);
  }, [isDemo, gamePhase, waveIdx, targetWord]);

  const handleReplay = useCallback(() => {
    reset();
    energy.reset();
    level.reset();
    lastTargetIdRef.current = null;
    targetRef.current = null;
    setGamePhase("running");
    musicRef.current?.setLevel(0);
    musicRef.current?.resume();
    spawnWave();
  }, [reset, energy, level, spawnWave]);

  // ─── Render wagon ─────────────────────────────────────────────
  const renderWagon = (word: DomanWord) => {
    const isTapped = tappedId === word.id;
    const isCorrect = isTapped && feedbackType === "correct";
    const isWrong = isTapped && feedbackType === "wrong";

    let bg: string = colors.bg.card;
    let border = "#8d6e63";
    let textColor: string = colors.text.primary;
    if (isCorrect) { bg = "#c6f6d5"; border = colors.success; textColor = colors.success; }
    else if (isWrong) { bg = "#fed7d7"; border = colors.error; textColor = colors.error; }

    return (
      <motion.button
        key={word.id}
        data-word-id={word.id}
        onClick={(e) => handleTap(word, e)}
        whileTap={{ scale: 0.9 }}
        style={{
          width: 96, height: 62, borderRadius: radii.md,
          backgroundColor: bg, border: `3px solid ${border}`,
          boxShadow: isCorrect ? shadows.glow(colors.success) : shadows.sm,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: fontSizes.md, fontWeight: "bold",
          fontFamily: fonts.display, color: textColor, flexShrink: 0,
        }}
      >
        {word.text}
      </motion.button>
    );
  };

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    const reward = rewardForLevel(level.levelUi, tuning);
    return (
      <GameShell title="Tren de Palabras" icon="🚂" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Tren de Palabras"
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
    <GameShell title="Tren de Palabras" icon="🚂" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        <ArcadeHud
          color={GAME_COLOR}
          targetPrefix="Tocá:"
          level={level.levelUi}
          correct={state.correctAttempts}
          targetWord={targetWord}
          waveKey={waveIdx}
          energy={energy.energyUi}
          energyMax={tuning.energyMax}
        />

        {/* Track area */}
        <div style={{
          width: "100%", maxWidth: "min(660px, calc(100vw - 32px))",
          overflow: "hidden", borderRadius: radii.xl,
          backgroundColor: "#e8f5e9", border: `2px solid ${colors.border.light}`,
          padding: `${spacing.xl}px 0`, position: "relative", minHeight: 120,
        }}>
          {/* Rails */}
          <div style={{ position: "relative", height: 82 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 4, backgroundColor: "#8d6e63" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 4, backgroundColor: "#8d6e63" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 14, height: 52, backgroundImage: "repeating-linear-gradient(90deg, #5d4037 0px, #5d4037 4px, transparent 4px, transparent 20px)", opacity: 0.25 }} />

            {/* Train (wagons trail, locomotive leads on the right) */}
            <div style={{ position: "absolute", top: 6, left: `${trainX}%`, display: "flex", gap: 6, alignItems: "center" }}>
              {[...wagons].reverse().map(renderWagon)}
              <div style={{
                width: 50, height: 62, borderRadius: radii.md,
                backgroundColor: GAME_COLOR, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 28, boxShadow: shadows.md, flexShrink: 0,
                border: "3px solid #2d8a56", transform: "scaleX(-1)",
              }}>
                🚂
              </div>
            </div>
          </div>

          {burstPos && (
            <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
              <VictoryBurst active x={burstPos.x} y={burstPos.y} count={12} />
            </div>
          )}
        </div>

        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, textAlign: "center" }}>
          {gamePhase === "intro" ? "Escucha a Sofía..." : "Toca el vagón con la palabra correcta"}
        </p>

        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
