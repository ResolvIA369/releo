"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useArcadeEnergy } from "../hooks/useArcadeEnergy";
import { useArcadeLevel } from "../hooks/useArcadeLevel";
import { useArcadeClock } from "../hooks/useArcadeClock";
import { usePreGameIntro } from "../hooks/usePreGameIntro";
import { GameShell } from "./GameShell";
import { ArcadeHud } from "./ArcadeHud";
import { ArcadeIntro } from "./ArcadeIntro";
import { ArcadeMusic } from "./arcade-music";
import { FloatingBubbles } from "./GameAmbience";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, pickPraiseReaction, stopVoice } from "@/shared/services/sofiaVoice";
import { bubblesTuningForPhase } from "../config/bubbles";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";
import { demoChooseWithHesitation, demoJitter } from "../hooks/useDemoAutoplay";

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
  // B4 (QA sep-2026): usePause() leia un Context creado DENTRO de
  // GameShell, que este componente renderiza como hijo — el Provider
  // quedaba abajo del punto donde se leia el hook, asi que paused era
  // siempre false. GameShell ahora avisa por callback.
  const [paused, setPaused] = useState(false);

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
  // Cuenta tandas de la vuelta actual del mazo — al completar
  // words.length tandas termina el juego (ver LeoVuela.tsx: antes esto
  // solo terminaba si se quedaba sin energia, y jugando bien nunca pasa).
  const waveCountRef = useRef(0);
  const gameEndRef = useRef<() => void>(() => {});
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
    waveCountRef.current += 1;
    if (waveCountRef.current > wordsRef.current.length) {
      gameEndRef.current();
      return;
    }
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    const t = bagRef.current!.next();
    targetRef.current = t;
    const others = shuffle(wordsRef.current.filter((w) => w.id !== t.id)).slice(0, lvl.count - 1);
    const all = shuffle([t, ...others]);
    bubblesRef.current = all.map((w, i) => ({
      // y arranca en 18% (no 12%): con el area inmersiva el ArcadeHud
      // overlay ocupa esa franja superior — antes el HUD estaba FUERA de
      // este contenedor (fila propia arriba) asi que 12% no chocaba con
      // nada; ahora sí.
      word: w, x: 12 + Math.random() * 66, y: 18 + Math.random() * 56,
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
  gameEndRef.current = finishGame;

  const resolveWave = useCallback((delayMs: number) => {
    resolvedRef.current = true;
    setTimeout(() => { if (!cancelledRef.current) spawnWave(); }, delayMs);
  }, [spawnWave]);
  const resolveRef = useRef(resolveWave);
  resolveRef.current = resolveWave;

  const { skip: skipIntro } = usePreGameIntro({
    active: gamePhase === "intro",
    gameId: "daily-bits",
    isDemo,
    rulesMp3: "intro-burbujas",
    rulesText: INTRO_TEXT,
    onDone: () => { if (!cancelledRef.current) setGamePhase("running"); },
  });

  useEffect(() => {
    if (gamePhase === "running" && targetRef.current === null) {
      spawnWave();
      // B6: en demo/grabacion el toque simulado no cuenta como gesto
      // real para el browser (ver arcade-music.ts) — arranca directo.
      if (isDemo) void musicRef.current?.ensureStarted(levelRef.current);
    }
  }, [gamePhase, spawnWave, isDemo]);

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
      // Piso de 16% (no 5%): misma razon que el spawn — despeja el
      // ArcadeHud overlay, que ahora vive DENTRO de este contenedor.
      if (b.x < 5 || b.x > 85) b.dx *= -1;
      if (b.y < 16 || b.y > 80) b.dy *= -1;
      b.x = Math.max(5, Math.min(85, b.x));
      b.y = Math.max(16, Math.min(80, b.y));
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
      // La felicitacion suena COMPLETA: la tanda siguiente espera a que
      // termine (en vez de un delay fijo que la cortaba al anunciar la
      // proxima palabra). Ocasional, no en cada acierto (ver
      // pickPraiseReaction) — si esta vez no toca, la tanda siguiente
      // arranca directo, sin esperar nada.
      resolvedRef.current = true;
      const praise = pickPraiseReaction();
      if (praise) {
        stopVoice();
        musicRef.current?.duck(true);
        sofiaPlayAudio(praise.id, praise.text, "excited").finally(() => {
          if (!cancelledRef.current) spawnWave();
          else musicRef.current?.duck(false);
        });
      } else if (!cancelledRef.current) {
        spawnWave();
      }
    } else {
      // Error mudo: solo flash + energia abajo; las burbujas siguen
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
    }
  }, [energy, tuning, recordAttempt, rewardCorrect, speakDucked, spawnWave, flashFeedback, poppedId, levelRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo: cada tanda, duda entre burbujas y revienta la correcta
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !target) return;
    let done = false;
    const t = setTimeout(() => {
      if (done || resolvedRef.current) return;
      done = true;
      const allBubbles = Array.from(document.querySelectorAll("[data-word-id]")) as HTMLElement[];
      const correctEl = allBubbles.find((el) => el.dataset.wordId === target.id) ?? null;
      const wrongEls = allBubbles.filter((el) => el.dataset.wordId && el.dataset.wordId !== target.id);
      demoChooseWithHesitation(correctEl, wrongEls);
    }, demoJitter(3000));
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, target]);

  const handleReplay = useCallback(() => {
    reset();
    energy.reset();
    level.reset();
    bagRef.current = createWordBag(words);
    waveCountRef.current = 0;
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
    <GameShell title="Burbujas Magicas" icon="🫧" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})} contentAlign="top" immersive onPauseChange={setPaused}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.xs, width: "100%" }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} onSkip={skipIntro} />}

        <div style={{
          position: "relative", width: "100%", maxWidth: "96vw", height: "calc(100dvh - 16px)",
          borderRadius: radii.xl, overflow: "hidden",
          background: "linear-gradient(180deg, #e8daef 0%, #d2b4de 40%, #bb8fce 100%)",
          border: `2px solid ${colors.border.light}`,
          containerType: "size",
        }}>
          <ArcadeHud
            overlay
            color={GAME_COLOR}
            targetPrefix="Reventá:"
            level={levelUi}
            correct={state.correctAttempts}
            targetWord={target}
            waveKey={waveIdx}
            energy={energy.energyUi}
            energyMax={tuning.energyMax}
          />
          <FloatingBubbles />
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
