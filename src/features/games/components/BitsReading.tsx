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
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { bubblesTuningForPhase } from "../config/bubbles";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#f093fb";
const BUBBLE_COLORS = ["#f093fb", "#667eea", "#48bb78", "#ed8936", "#e53e3e", "#0bc5ea", "#38b2ac"];

const INTRO_TEXT =
  "¡Soy la Seño Sofía! Las palabras flotan en burbujas. " +
  "Escuchá cuál reventar, y tocá la burbuja correcta. " +
  "¡Vos podés! ¡A reventar!";

interface Bubble {
  word: DomanWord;
  x: number;
  y: number;
  size: number;
  color: string;
  dx: number;
  dy: number;
}

type Phase = "intro" | "running" | "finished";

export const BitsReading: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("daily-bits", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const tuning = bubblesTuningForPhase(phase);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [target, setTarget] = useState<DomanWord | null>(null);
  const [waveIdx, setWaveIdx] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [poppedId, setPoppedId] = useState<string | null>(null);

  const bubblesRef = useRef<Bubble[]>([]);
  const [, forceRender] = useState(0);

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

  // ─── Wave: nuevas burbujas ──────────────────────────────────────
  const spawnWave = useCallback(() => {
    if (cancelledRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    const t = bagRef.current!.next();
    targetRef.current = t;
    const others = shuffle(wordsRef.current.filter((w) => w.id !== t.id)).slice(0, lvl.count - 1);
    const all = shuffle([t, ...others]);
    bubblesRef.current = all.map((w, i) => ({
      word: w, x: 12 + Math.random() * 66, y: 12 + Math.random() * 58,
      size: 72 + Math.random() * 18, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.35,
    }));
    setTarget(t);
    setPoppedId(null);
    resolvedRef.current = false;
    setWaveIdx((w) => w + 1);
    forceRender((n) => n + 1);
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

  useSofiaIntro(gamePhase === "intro", "intro-burbujas", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  useEffect(() => {
    if (gamePhase === "running" && targetRef.current === null) spawnWave();
  }, [gamePhase, spawnWave]);

  // Clock: deriva de burbujas + drenaje de energia + nivel
  useArcadeClock(gamePhase === "running" && !paused, (dt) => {
    level.tick(dt);
    if (energy.drainTick(dt)) { finishRef.current(); return; }

    const speedMul = (tuning.levels[levelRef.current] ?? tuning.levels[0]).speedMul;
    let moved = false;
    for (const b of bubblesRef.current) {
      if (poppedId === b.word.id) continue;
      b.x += b.dx * speedMul * dt;
      b.y += b.dy * speedMul * dt;
      if (b.x < 5 || b.x > 85) b.dx *= -1;
      if (b.y < 5 || b.y > 75) b.dy *= -1;
      b.x = Math.max(5, Math.min(85, b.x));
      b.y = Math.max(5, Math.min(75, b.y));
      moved = true;
    }
    if (moved) forceRender((n) => n + 1);
  });

  useEffect(() => {
    if (paused) { stopVoice(); musicRef.current?.pause(); }
    else if (gamePhaseRef.current === "running") musicRef.current?.resume();
  }, [paused]);

  // ─── Pop ────────────────────────────────────────────────────────
  const handlePop = useCallback((bubble: Bubble, e?: React.MouseEvent) => {
    if (gamePhaseRef.current !== "running" || resolvedRef.current) return;
    void musicRef.current?.ensureStarted(levelRef.current);
    const correct = bubble.word.id === targetRef.current?.id;
    recordAttempt(correct, correct ? bubble.word.id : undefined);

    if (correct) {
      setPoppedId(bubble.word.id);
      energy.adjust(tuning.energyGainCorrect);
      if (level.registerCorrect()) musicRef.current?.setLevel(levelRef.current);
      flashFeedback("correct");
      if (e) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        rewardCorrect(rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else {
        rewardCorrect();
      }
      speakDucked(() => sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited"));
      resolveRef.current(500);
    } else {
      // Error mudo: solo flash + energia abajo; las burbujas siguen
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
    }
  }, [energy, tuning, recordAttempt, rewardCorrect, speakDucked, flashFeedback, poppedId, levelRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo: cada tanda, revienta la burbuja correcta
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
      <GameShell title="Burbujas Magicas" icon="🫧" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Burbujas Magicas"
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
    <GameShell title="Burbujas Magicas" icon="🫧" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} />}
        <ArcadeHud
          color={GAME_COLOR}
          targetPrefix="Reventá:"
          level={levelUi}
          correct={state.correctAttempts}
          targetWord={target}
          waveKey={waveIdx}
          energy={energy.energyUi}
          energyMax={tuning.energyMax}
        />

        <div style={{
          position: "relative", width: "100%", maxWidth: "min(600px, calc(100vw - 32px))", height: "min(420px, 55vh)",
          borderRadius: radii.xl, overflow: "hidden",
          background: "linear-gradient(180deg, #e8daef 0%, #d2b4de 40%, #bb8fce 100%)",
          border: `2px solid ${colors.border.light}`,
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div key={i} animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.5, delay: i * 0.3 }}
              style={{ position: "absolute", top: `${10 + i * 18}%`, left: `${5 + i * 20}%`, fontSize: 14, pointerEvents: "none" }}>✨</motion.div>
          ))}

          <AnimatePresence>
            {bubblesRef.current.map((bubble) => {
              if (poppedId === bubble.word.id) {
                return (
                  <motion.div key={`pop-${bubble.word.id}`}
                    initial={{ scale: 1, opacity: 1 }} animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ position: "absolute", left: `${bubble.x}%`, top: `${bubble.y}%`, transform: "translate(-50%,-50%)", fontSize: 40 }}>
                    💥
                  </motion.div>
                );
              }
              return (
                <motion.button key={bubble.word.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.85 }}
                  data-word-id={bubble.word.id} onClick={(e) => handlePop(bubble, e)}
                  style={{
                    position: "absolute", left: `${bubble.x}%`, top: `${bubble.y}%`,
                    transform: "translate(-50%,-50%)",
                    width: bubble.size, height: bubble.size, borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), ${bubble.color}88, ${bubble.color})`,
                    border: "2px solid rgba(255,255,255,0.4)",
                    boxShadow: `0 4px 20px ${bubble.color}40, inset 0 -4px 10px rgba(0,0,0,0.1)`,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}>
                  <span style={{ fontSize: bubble.size * 0.22, fontWeight: "bold", fontFamily: fonts.display, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                    {bubble.word.text}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
