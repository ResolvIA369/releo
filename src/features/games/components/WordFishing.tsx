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
import { ArcadeIntro } from "./ArcadeIntro";
import { ArcadeMusic } from "./arcade-music";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { wordFishingTuningForPhase } from "../config/word-fishing";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";

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

const INTRO_TEXT =
  "¡Soy la Seño Sofía! Los peces nadan con palabras. " +
  "Escuchá cuál pescar, y tocá el pez correcto. " +
  "¡Vos podés! ¡A pescar!";

interface Fish {
  word: DomanWord;
  emoji: string;
  row: number;
  speed: number; // segundos base de un loop
}

type Phase = "intro" | "running" | "finished";

export const WordFishing: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-fishing", { phase });
  const { paused } = usePause();
  const { rewardCorrect } = useRewards();

  const tuning = wordFishingTuningForPhase(phase);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [target, setTarget] = useState<DomanWord | null>(null);
  const [fishes, setFishes] = useState<Fish[]>([]);
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
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const energy = useArcadeEnergy(tuning);
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { levelRef, levelUi } = level;
  const speedMul = (tuning.levels[levelUi] ?? tuning.levels[0]).speedMul;

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

  // ─── Wave: nuevos peces ─────────────────────────────────────────
  const spawnWave = useCallback(() => {
    if (cancelledRef.current) return;
    const t = bagRef.current!.next();
    targetRef.current = t;
    const others = shuffle(wordsRef.current.filter((w) => w.id !== t.id)).slice(0, 3);
    const all = shuffle([t, ...others]);
    setFishes(all.map((w, i) => ({ word: w, emoji: FISH_EMOJIS[i % FISH_EMOJIS.length], row: i, speed: 6 + Math.random() * 3 })));
    setTarget(t);
    setCaughtId(null);
    setBurstPos(null);
    resolvedRef.current = false;
    setWaveIdx((w) => w + 1);
    speakDucked(() => sofiaNameWord(t.text));
  }, [speakDucked]);

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

  useSofiaIntro(gamePhase === "intro", "intro-pesca", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  useEffect(() => {
    if (gamePhase === "running" && targetRef.current === null) spawnWave();
  }, [gamePhase, spawnWave]);

  useArcadeClock(gamePhase === "running" && !paused, (dt) => {
    level.tick(dt);
    if (energy.drainTick(dt)) finishRef.current();
  });

  useEffect(() => {
    if (paused) { stopVoice(); musicRef.current?.pause(); }
    else if (gamePhaseRef.current === "running") musicRef.current?.resume();
  }, [paused]);

  // ─── Tap ────────────────────────────────────────────────────────
  const handleTap = useCallback((fish: Fish, e: React.MouseEvent) => {
    if (gamePhaseRef.current !== "running" || resolvedRef.current) return;
    void musicRef.current?.ensureStarted(levelRef.current);
    const correct = fish.word.id === targetRef.current?.id;
    recordAttempt(correct, correct ? fish.word.id : undefined);

    if (correct) {
      setCaughtId(fish.word.id);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setBurstPos({ x: cx, y: cy });
      rewardCorrect(cx, cy);
      energy.adjust(tuning.energyGainCorrect);
      if (level.registerCorrect()) musicRef.current?.setLevel(levelRef.current);
      flashFeedback("correct");
      // La felicitacion suena COMPLETA: la tanda siguiente espera a que
      // termine (en vez de un delay fijo que la cortaba al anunciar la
      // proxima palabra).
      resolvedRef.current = true;
      stopVoice();
      musicRef.current?.duck(true);
      sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited").finally(() => {
        if (!cancelledRef.current) spawnWave();
        else musicRef.current?.duck(false);
      });
    } else {
      // Error mudo: solo flash + energia abajo; los peces siguen
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
    }
  }, [energy, tuning, recordAttempt, rewardCorrect, speakDucked, spawnWave, flashFeedback, levelRef]);

  // Demo: cada tanda, toca el pez correcto
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !target) return;
    let done = false;
    const t = setTimeout(() => {
      if (done || resolvedRef.current) return;
      const btn = document.querySelector(`[data-word-id="${target.id}"]`) as HTMLElement;
      if (btn) { done = true; btn.click(); }
    }, 1600);
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, target]);

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
    const reward = rewardForLevel(levelUi, tuning);
    return (
      <GameShell title="Pesca de Palabras" icon="🎣" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Pesca de Palabras"
          correct={state.correctAttempts}
          total={state.totalAttempts}
          color={GAME_COLOR}
          bonusCoins={reward.bonusCoins}
          starsOverride={reward.stars}
          subtitle={`Llegaste al Nivel ${levelUi + 1}`}
          onReplay={handleReplay}
          onBack={onBack ?? (() => {})}
        />
      </GameShell>
    );
  }

  return (
    <GameShell title="Pesca de Palabras" icon="🎣" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} />}
        <ArcadeHud
          color={GAME_COLOR}
          targetPrefix="Pescá:"
          level={levelUi}
          correct={state.correctAttempts}
          targetWord={target}
          waveKey={waveIdx}
          energy={energy.energyUi}
          energyMax={tuning.energyMax}
        />

        {/* Ocean */}
        <div style={{
          position: "relative", width: "100%", maxWidth: "min(620px, calc(100vw - 32px))", height: "min(420px, 56vh)",
          borderRadius: radii.xl, overflow: "hidden",
          background: "linear-gradient(180deg, #b3e5fc 0%, #4fc3f7 25%, #0288d1 60%, #01579b 100%)",
          border: `2px solid ${colors.border.light}`,
        }}>
          <motion.div animate={{ x: [-30, 30, -30] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            style={{ position: "absolute", top: "12%", left: -20, right: -20, height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3 }} />

          {/* Fish */}
          {fishes.map((fish, i) => {
            if (caughtId === fish.word.id) return null;
            const yPos = 24 + i * 18;
            const goesRight = i % 2 === 0;
            return (
              <motion.button
                key={`${fish.word.id}-${waveIdx}`}
                animate={paused ? {} : { x: goesRight ? [-140, 560, -140] : [560, -140, 560] }}
                transition={{ repeat: Infinity, duration: fish.speed / speedMul, ease: "linear" }}
                data-word-id={fish.word.id} onClick={(e) => handleTap(fish, e)}
                style={{
                  position: "absolute", top: `${yPos}%`, left: 0,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  backgroundColor: "rgba(255,255,255,0.95)", borderRadius: radii.xl,
                  border: "3px solid rgba(255,255,255,0.7)", boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                  fontSize: fontSizes.lg, fontWeight: "bold", fontFamily: fonts.display, color: "#1a365d",
                  cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                }}
              >
                <span style={{ display: "inline-block", transform: goesRight ? "none" : "scaleX(-1)" }}>{fish.emoji}</span>
                <span>{fish.word.text}</span>
              </motion.button>
            );
          })}

          {/* Bubbles */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i}
              animate={{ y: [-10, -180], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8 }}
              style={{ position: "absolute", bottom: 30, left: `${15 + i * 25}%`, width: 6 + i * 2, height: 6 + i * 2, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)" }} />
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
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
