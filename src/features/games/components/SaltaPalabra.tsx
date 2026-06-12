"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Application, Container, Sprite } from "pixi.js";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { domanCanvasText } from "../config/doman-canvas";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#38b2ac";
const WORDS_PER_GAME = 20;

// Logical canvas size — CSS scales it to the container width
const W = 640;
const H = 420;
const GROUND_Y = H - 58;
const LEO_X = W * 0.5;
const FLY_Y = 150; // words float at jump height
const JUMP_H = 175; // jump apex offset
const JUMP_FRAMES = 40; // ~650ms at 60fps
const ANTICIPATION = 0.14; // first slice of the jump is a crouch
// Frames until the apex, counting the crouch (demo uses it to time jumps)
const APEX_FRAMES = JUMP_FRAMES * (ANTICIPATION + (1 - ANTICIPATION) * 0.5);
const CATCH_X = 72; // horizontal catch range at the apex
const WORD_GAP = 270; // spacing between floating words
const BASE_SPEED = 2.1; // px per frame at 60fps

type Phase = "loading" | "announcing" | "running" | "feedback" | "finished";

interface FloatingWord {
  box: Container;
  word: DomanWord;
  caught: boolean;
}

interface RoundData {
  words: FloatingWord[];
  target: DomanWord | null;
  speed: number;
  active: boolean;
  resolved: boolean;
}

export const SaltaPalabra: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("salta-palabra", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("loading");
  const [roundIdx, setRoundIdx] = useState(0);
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const leoRef = useRef<Container | null>(null);
  const leoSpriteRef = useRef<Sprite | null>(null);
  const wordsLayerRef = useRef<Container | null>(null);

  const jumpTRef = useRef(1); // 0→1 jump progress; 1 = on the ground
  const crashTRef = useRef(1); // 0→1 stumble progress
  const squashTRef = useRef(1); // 0→1 squash-and-stretch on a correct catch
  const baseScaleRef = useRef(0); // Leo sprite's natural scale
  const elapsedRef = useRef(0);
  const gamePhaseRef = useRef<Phase>("loading");
  const isDemoRef = useRef(isDemo);
  const roundRef = useRef<RoundData>({ words: [], target: null, speed: BASE_SPEED, active: false, resolved: false });
  const onCatchRef = useRef<(fw: FloatingWord) => void>(() => {});
  const onEscapeRef = useRef<() => void>(() => {});
  const cancelledRef = useRef(false);

  gamePhaseRef.current = gamePhase;
  isDemoRef.current = isDemo;

  const gameWords = useMemo(() => shuffle(words).slice(0, WORDS_PER_GAME), [words]);
  const totalRounds = gameWords.length;

  // ─── Pixi init (same lifecycle pattern as LeoRunner) ─────────────

  useEffect(() => {
    // `disposed` is local to each effect run: under StrictMode the
    // effect runs twice and a shared ref would let the first run's
    // async init keep going after the second run reset it.
    let disposed = false;
    let app: Application | null = null;
    cancelledRef.current = false;

    (async () => {
      const PIXI = await import("pixi.js");
      if (disposed || !hostRef.current) return;

      app = new PIXI.Application();
      await app.init({ width: W, height: H, background: "#e3f2fd", antialias: true });
      if (disposed || !hostRef.current) {
        app.destroy(true, { children: true });
        return;
      }
      appRef.current = app;
      app.canvas.style.width = "100%";
      app.canvas.style.height = "auto";
      app.canvas.style.display = "block";
      app.canvas.style.borderRadius = "16px";
      hostRef.current.appendChild(app.canvas);

      // Sky decorations + grass floor
      const scenery = new PIXI.Graphics();
      scenery.circle(72, 64, 30).fill({ color: 0xfff176, alpha: 0.9 }); // sun
      for (const [cx, cy, s] of [[210, 60, 1], [430, 92, 0.8], [560, 48, 0.65]] as const) {
        scenery.ellipse(cx, cy, 46 * s, 16 * s).fill({ color: 0xffffff, alpha: 0.85 });
        scenery.ellipse(cx + 24 * s, cy - 10 * s, 30 * s, 13 * s).fill({ color: 0xffffff, alpha: 0.85 });
      }
      scenery.rect(0, GROUND_Y, W, H - GROUND_Y).fill("#a8d5b0");
      scenery.rect(0, GROUND_Y, W, 6).fill("#8bc49a");
      app.stage.addChild(scenery);

      // Floating words layer
      const wordsLayer = new PIXI.Container();
      app.stage.addChild(wordsLayer);
      wordsLayerRef.current = wordsLayer;

      // Leo — clean lion sprite (extracted for leo-runner), emoji fallback
      const leo = new PIXI.Container();
      try {
        const tex = await PIXI.Assets.load("/images/games/leo-runner-sprite.png");
        // After appRef is set the cleanup owns destruction — just bail
        if (disposed) return;
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5, 1);
        baseScaleRef.current = 96 / sprite.height;
        sprite.scale.set(baseScaleRef.current);
        leo.addChild(sprite);
        leoSpriteRef.current = sprite;
      } catch {
        const fallback = new PIXI.Text({ text: "🦁", style: { fontSize: 64 } });
        fallback.anchor.set(0.5, 1);
        leo.addChild(fallback);
      }
      const shadow = new PIXI.Graphics();
      shadow.ellipse(0, 0, 34, 9).fill({ color: 0x000000, alpha: 0.15 });
      leo.addChildAt(shadow, 0);
      leo.x = LEO_X;
      leo.y = GROUND_Y + 4;
      app.stage.addChild(leo);
      leoRef.current = leo;

      // ─── Game loop — reads refs only, so no stale closures ──────
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;
        elapsedRef.current += dt;
        const round = roundRef.current;

        // Floating words: drift left + gentle bob (parked while Sofia talks)
        round.words.forEach((fw, i) => {
          if (fw.caught) return;
          if (round.active) fw.box.x -= round.speed * dt;
          fw.box.y = FLY_Y + Math.sin(elapsedRef.current * 0.07 + i * 2) * 7;
        });

        // Leo: idle bob on the ground, parabola while jumping
        const leoC = leoRef.current;
        if (leoC) {
          let offsetY = Math.sin(elapsedRef.current * 0.18) * 2;
          if (jumpTRef.current < 1) {
            jumpTRef.current = Math.min(1, jumpTRef.current + dt / JUMP_FRAMES);
            const t = jumpTRef.current;
            if (t < ANTICIPATION) {
              // Anticipation: brief crouch before springing up
              offsetY += Math.sin((t / ANTICIPATION) * Math.PI) * 8;
            } else {
              const p = (t - ANTICIPATION) / (1 - ANTICIPATION);
              offsetY -= Math.sin(p * Math.PI) * JUMP_H;
            }
          }
          if (crashTRef.current < 1) {
            crashTRef.current = Math.min(1, crashTRef.current + dt / 30);
            leoC.x = LEO_X + Math.sin(crashTRef.current * Math.PI * 6) * 5;
            if (leoSpriteRef.current) {
              leoSpriteRef.current.tint = crashTRef.current < 1 ? 0xffb0b0 : 0xffffff;
            }
          } else {
            leoC.x = LEO_X;
            if (leoSpriteRef.current && leoSpriteRef.current.tint !== 0xffffff) {
              leoSpriteRef.current.tint = 0xffffff;
            }
          }
          leoC.y = GROUND_Y + 4 + offsetY;

          // Squash-and-stretch: crouch squash + correct-catch celebration
          if (leoSpriteRef.current && baseScaleRef.current > 0) {
            let sx = 1, sy = 1;
            const jt = jumpTRef.current;
            if (jt < ANTICIPATION) {
              const k = Math.sin((jt / ANTICIPATION) * Math.PI);
              sx = 1 + 0.15 * k;
              sy = 1 - 0.15 * k;
            }
            if (squashTRef.current < 1) {
              squashTRef.current = Math.min(1, squashTRef.current + dt / 26);
              const q = squashTRef.current;
              if (q < 0.35) {
                const k = Math.sin((q / 0.35) * Math.PI);
                sx *= 1 + 0.22 * k;
                sy *= 1 - 0.22 * k;
              } else {
                const k = Math.sin(((q - 0.35) / 0.65) * Math.PI);
                sx *= 1 - 0.12 * k;
                sy *= 1 + 0.16 * k;
              }
            }
            leoSpriteRef.current.scale.set(baseScaleRef.current * sx, baseScaleRef.current * sy);
          }

          // Near the apex: catch any word overhead (apex measured on the
          // post-anticipation slice of the jump)
          const jt = jumpTRef.current;
          const p = jt < 1 && jt >= ANTICIPATION ? (jt - ANTICIPATION) / (1 - ANTICIPATION) : 0;
          const nearApex = jt < 1 && Math.sin(p * Math.PI) > 0.6;
          if (nearApex && round.active && !round.resolved) {
            for (const fw of round.words) {
              if (!fw.caught && Math.abs(fw.box.x - LEO_X) < CATCH_X) {
                fw.caught = true;
                fw.box.visible = false;
                onCatchRef.current(fw);
                break;
              }
            }
          }
        }

        // Target escaped off the left edge → miss
        if (round.active && !round.resolved) {
          const targetFw = round.words.find((fw) => fw.word.id === round.target?.id);
          if (targetFw && !targetFw.caught && targetFw.box.x < -100) {
            round.resolved = true;
            round.active = false;
            onEscapeRef.current();
          }
        }

        // Demo mode: jump when the target is about to be overhead
        if (isDemoRef.current && round.active && !round.resolved && jumpTRef.current >= 1) {
          const targetFw = round.words.find((fw) => fw.word.id === round.target?.id && !fw.caught);
          if (targetFw) {
            const lead = round.speed * APEX_FRAMES; // px traveled until apex
            const dist = targetFw.box.x - LEO_X;
            if (dist > 0 && dist <= lead + 10) jumpTRef.current = 0;
          }
        }
      });

      setGamePhase("announcing");
    })();

    return () => {
      disposed = true;
      cancelledRef.current = true;
      stopVoice();
      // Only destroy once appRef was set (init finished); before that
      // the async init path destroys the app itself when it sees
      // `disposed`, and destroying mid-init throws.
      if (app && appRef.current === app) {
        try { app.destroy(true, { children: true }); } catch { /* already gone */ }
        appRef.current = null;
        leoRef.current = null;
        leoSpriteRef.current = null;
        wordsLayerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause: freeze the ticker and silence Sofia
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    if (paused) {
      app.ticker.stop();
      stopVoice();
    } else {
      app.ticker.start();
    }
  }, [paused]);

  // ─── Round setup ───────────────────────────────────────────────

  const setupRound = useCallback(async (idx: number) => {
    const app = appRef.current;
    const wordsLayer = wordsLayerRef.current;
    if (!app || !wordsLayer || cancelledRef.current) return;

    if (idx >= totalRounds) {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
      return;
    }

    const PIXI = await import("pixi.js");
    if (cancelledRef.current) return;

    wordsLayer.removeChildren().forEach((c) => c.destroy({ children: true }));

    const target = gameWords[idx];
    const distractors = shuffle(words.filter((w) => w.id !== target.id)).slice(0, 2);
    const roundWords = shuffle([target, ...distractors]);

    const floating: FloatingWord[] = roundWords.map((word, i) => {
      const box = new PIXI.Container();

      const doman = domanCanvasText(word);
      const label = new PIXI.Text({
        text: word.text,
        style: {
          fontFamily: "Arial, sans-serif",
          fontSize: doman.fontSize,
          fontWeight: "bold",
          fill: doman.fill,
        },
      });
      label.anchor.set(0.5);
      const pillW = Math.max(130, label.width + 44);

      const pill = new PIXI.Graphics();
      pill
        .roundRect(-pillW / 2, -26, pillW, 52, 26)
        .fill("#ffffff")
        .stroke({ width: 4, color: 0x38b2ac });
      // Little balloon wings so the words read as "floating"
      pill.ellipse(-pillW / 2 - 8, 0, 10, 16).fill({ color: 0xb2ebe8, alpha: 0.9 });
      pill.ellipse(pillW / 2 + 8, 0, 10, 16).fill({ color: 0xb2ebe8, alpha: 0.9 });

      box.addChild(pill);
      box.addChild(label);
      box.x = W + 80 + i * WORD_GAP;
      box.y = FLY_Y;
      wordsLayer.addChild(box);
      return { box, word, caught: false };
    });

    roundRef.current = {
      words: floating,
      target,
      speed: BASE_SPEED * (1 + idx * 0.04),
      active: false,
      resolved: false,
    };

    setTargetWord(target);
    setFeedbackType(null);
    setGamePhase("announcing");

    await sofiaNameWord(target.text);
    if (cancelledRef.current) return;
    roundRef.current.active = true;
    setGamePhase("running");
  }, [totalRounds, gameWords, words, finish, onComplete, state]);

  // First round once Pixi is up
  useEffect(() => {
    if (gamePhase === "announcing" && roundIdx === 0 && roundRef.current.words.length === 0) {
      setupRound(0);
    }
  }, [gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextRound = useCallback(async (delayMs: number) => {
    await new Promise((r) => setTimeout(r, delayMs));
    if (cancelledRef.current) return;
    setFeedbackType(null);
    setRoundIdx((prev) => {
      const next = prev + 1;
      setupRound(next);
      return next;
    });
  }, [setupRound]);

  // ─── Catch / escape (called from the Pixi ticker) ────────────────

  const handleCatch = useCallback(async (fw: FloatingWord) => {
    const round = roundRef.current;
    const target = round.target;
    if (!target) return;
    const correct = fw.word.id === target.id;

    if (correct) {
      round.resolved = true;
      round.active = false;
      recordAttempt(true, target.id);
      setGamePhase("feedback");
      setFeedbackType("correct");
      const canvas = appRef.current?.canvas;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / W;
        rewardCorrect(rect.left + LEO_X * scale, rect.top + FLY_Y * scale);
      }
      squashTRef.current = 0; // celebration squash-and-stretch
      await sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited");
      if (cancelledRef.current) return;
      nextRound(500);
    } else {
      // Soft stumble: the round keeps going, the target can still come
      recordAttempt(false);
      round.active = false; // park the words while Sofia talks
      crashTRef.current = 0;
      setGamePhase("feedback");
      setFeedbackType("wrong");
      await sofiaPlayAudio("reaccion-esa-no", "¡Esa no!", "encouraging");
      if (cancelledRef.current) return;
      await sofiaNameWord(target.text);
      if (cancelledRef.current) return;
      setFeedbackType(null);
      // The target may already be gone (it was behind the caught one)
      const targetFw = round.words.find((f) => f.word.id === target.id);
      if (targetFw && !targetFw.caught && targetFw.box.x > -100) {
        round.active = true;
        setGamePhase("running");
      } else if (!round.resolved) {
        round.resolved = true;
        nextRound(300);
      }
    }
  }, [recordAttempt, rewardCorrect, nextRound]);

  const handleEscape = useCallback(async () => {
    const round = roundRef.current;
    if (!round.target) return;
    recordAttempt(false);
    setGamePhase("feedback");
    setFeedbackType("wrong");
    await sofiaPlayAudio("reaccion-se-escapo", "¡Se escapó!", "gentle");
    if (cancelledRef.current) return;
    nextRound(400);
  }, [recordAttempt, nextRound]);

  onCatchRef.current = handleCatch;
  onEscapeRef.current = handleEscape;

  // ─── Tap anywhere on the canvas → Leo jumps ─────────────────────

  const handleJump = useCallback(() => {
    if (gamePhaseRef.current !== "running" || paused) return;
    if (jumpTRef.current >= 1) {
      jumpTRef.current = 0;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(15);
    }
  }, [paused]);

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setupRound(0);
  }, [reset, setupRound]);

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    return (
      <GameShell title="Salta la Palabra" icon="🦘" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Salta la Palabra" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Salta la Palabra" icon="🦘" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {/* Round counter + target word */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "min(640px, calc(100vw - 32px))" }}>
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
            {Math.min(roundIdx + 1, totalRounds)} / {totalRounds}
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
              ¡Saltá a <span style={{ color: domanCanvasText(targetWord).fill }}>{targetWord.text}</span>!
            </motion.div>
          )}
          <span style={{ width: 40 }} />
        </div>

        {/* Pixi canvas + full-surface jump tap zone */}
        <div style={{ position: "relative", width: "100%", maxWidth: "min(640px, calc(100vw - 32px))", borderRadius: radii.xl, overflow: "hidden", border: `2px solid ${colors.border.light}` }}>
          {/* React must never render children inside hostRef — Pixi
              appends its canvas there manually */}
          <div ref={hostRef} style={{ width: "100%", aspectRatio: `${W} / ${H}` }} />
          {gamePhase === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fontSizes.md, color: colors.text.muted, fontFamily: fonts.display }}>
              Cargando a Leo... 🦁
            </div>
          )}
          <button
            data-jump
            data-word-id={targetWord?.id ?? ""}
            aria-label="Saltar"
            onClick={handleJump}
            style={{
              position: "absolute", inset: 0,
              background: "transparent", border: "none", padding: 0,
              cursor: gamePhase === "running" ? "pointer" : "default",
            }}
          />
        </div>

        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, textAlign: "center" }}>
          {gamePhase === "announcing" ? "Escucha a Sofía..." : "Toca para que Leo salte y atrape la palabra"}
        </p>

        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
