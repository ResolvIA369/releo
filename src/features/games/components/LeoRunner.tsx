"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Application, Container, Sprite } from "pixi.js";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useGameKeys } from "../hooks/useGameKeys";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { domanCanvasText } from "../config/doman-canvas";
import { buildLanes, rocksForPhase } from "../config/leo-runner";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#ed8936";
const WORDS_PER_GAME = 20;

// Unico punto de cambio del sprite: Leo de espaldas, corriendo hacia
// adentro de la pantalla (procesado por scripts/prepare-leo-sprites.py)
const LEO_SPRITE_URL = "/images/games/leo-corre-sprite.png";

// Logical canvas size — CSS scales it to the container width
const W = 640;
const H = 420;
const LANES_X = [W * 0.18, W * 0.5, W * 0.82];
const LEO_Y = H - 72;
const SIGN_W = 172;
const SIGN_H = 56;
const SIGN_SPAWN_Y = -70;
// Travel speed in px/frame at 60fps; ramps up slightly per round
const BASE_SPEED = 1.5;

type Phase = "loading" | "announcing" | "running" | "feedback" | "finished";

interface RoundData {
  signs: { box: Container; lane: number }[];
  targetLane: number;
  target: DomanWord | null;
  speed: number;
  active: boolean;
  resolved: boolean;
}

export const LeoRunner: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("leo-runner", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("loading");
  const [roundIdx, setRoundIdx] = useState(0);
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [laneWords, setLaneWords] = useState<(DomanWord | null)[]>([null, null, null]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const leoRef = useRef<Container | null>(null);
  const leoSpriteRef = useRef<Sprite | null>(null);
  const signsLayerRef = useRef<Container | null>(null);
  const dashLayerRef = useRef<Container | null>(null);

  const leoLaneRef = useRef(1);
  const jumpTRef = useRef(1); // 0→1 jump progress; 1 = on the ground
  const crashTRef = useRef(1); // 0→1 stumble progress
  const squashTRef = useRef(1); // 0→1 squash-and-stretch on a correct pass
  const baseScaleRef = useRef(0); // Leo sprite's natural scale
  const elapsedRef = useRef(0);
  const roundRef = useRef<RoundData>({ signs: [], targetLane: 1, target: null, speed: BASE_SPEED, active: false, resolved: false });
  const resolveRef = useRef<() => void>(() => {});
  const cancelledRef = useRef(false);

  const gameWords = useMemo(() => shuffle(words).slice(0, WORDS_PER_GAME), [words]);
  const totalRounds = gameWords.length;

  // ─── Pixi init (dynamic import keeps pixi.js out of the main bundle) ──

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
      await app.init({ width: W, height: H, background: "#dcefe2", antialias: true });
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

      // Road background: 3 lanes separated by scrolling dashed lines
      const road = new PIXI.Graphics();
      road.rect(0, 0, W, H).fill("#dcefe2");
      // Grass edges
      road.rect(0, 0, 14, H).fill("#a8d5b0");
      road.rect(W - 14, 0, 14, H).fill("#a8d5b0");
      app.stage.addChild(road);

      // Dashed lane separators, wrapped vertically for the scroll illusion
      const dashLayer = new PIXI.Container();
      const DASH = 26, GAP = 26, PERIOD = DASH + GAP;
      for (const bx of [W / 3, (2 * W) / 3]) {
        for (let y = -PERIOD; y < H + PERIOD; y += PERIOD) {
          const d = new PIXI.Graphics();
          d.roundRect(-3, 0, 6, DASH, 3).fill("#ffffff");
          d.alpha = 0.9;
          d.x = bx;
          d.y = y;
          dashLayer.addChild(d);
        }
      }
      app.stage.addChild(dashLayer);
      dashLayerRef.current = dashLayer;

      // Signs layer (word signs + obstacles come down this layer)
      const signsLayer = new PIXI.Container();
      app.stage.addChild(signsLayer);
      signsLayerRef.current = signsLayer;

      // Leo — sprite if the texture loads, emoji fallback otherwise
      const leo = new PIXI.Container();
      try {
        const tex = await PIXI.Assets.load(LEO_SPRITE_URL);
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
      // Shadow under Leo
      const shadow = new PIXI.Graphics();
      shadow.ellipse(0, 0, 34, 9).fill({ color: 0x000000, alpha: 0.15 });
      leo.addChildAt(shadow, 0);
      leo.x = LANES_X[1];
      leo.y = LEO_Y;
      app.stage.addChild(leo);
      leoRef.current = leo;

      // ─── Game loop — reads refs only, so no stale closures ──────
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;
        elapsedRef.current += dt;
        const round = roundRef.current;

        // Scroll the lane dashes to fake forward motion
        if (dashLayerRef.current) {
          dashLayerRef.current.y = (dashLayerRef.current.y + round.speed * dt * 1.4) % PERIOD;
        }

        // Leo: lerp toward his lane + running bob + jump arc
        const leoC = leoRef.current;
        if (leoC) {
          const targetX = LANES_X[leoLaneRef.current];
          leoC.x += (targetX - leoC.x) * Math.min(1, 0.22 * dt);

          let offsetY = Math.sin(elapsedRef.current * 0.25) * 3; // bob
          if (jumpTRef.current < 1) {
            jumpTRef.current = Math.min(1, jumpTRef.current + dt / 16);
            offsetY -= Math.sin(jumpTRef.current * Math.PI) * 44;
          }
          if (crashTRef.current < 1) {
            crashTRef.current = Math.min(1, crashTRef.current + dt / 30);
            leoC.x += Math.sin(crashTRef.current * Math.PI * 6) * 5;
            if (leoSpriteRef.current) {
              leoSpriteRef.current.tint = crashTRef.current < 1 ? 0xffb0b0 : 0xffffff;
            }
          } else if (leoSpriteRef.current && leoSpriteRef.current.tint !== 0xffffff) {
            leoSpriteRef.current.tint = 0xffffff;
          }
          leoC.y = LEO_Y + offsetY;

          // Squash-and-stretch celebration on a correct pass
          if (leoSpriteRef.current && baseScaleRef.current > 0 && squashTRef.current < 1) {
            squashTRef.current = Math.min(1, squashTRef.current + dt / 26);
            const q = squashTRef.current;
            let sx = 1, sy = 1;
            if (q < 0.35) {
              const k = Math.sin((q / 0.35) * Math.PI);
              sx = 1 + 0.22 * k;
              sy = 1 - 0.22 * k;
            } else {
              const k = Math.sin(((q - 0.35) / 0.65) * Math.PI);
              sx = 1 - 0.12 * k;
              sy = 1 + 0.16 * k;
            }
            leoSpriteRef.current.scale.set(baseScaleRef.current * sx, baseScaleRef.current * sy);
          }
        }

        // Move the signs down (parked while Sofia announces the word);
        // resolve when they reach Leo, then let them slide past
        if (round.active || round.resolved) {
          for (const { box } of round.signs) {
            box.y += round.speed * dt;
          }
        }
        if (round.active && !round.resolved && round.signs.length > 0) {
          const firstY = round.signs[0].box.y;
          if (firstY >= LEO_Y - 52) {
            round.resolved = true;
            round.active = false;
            resolveRef.current();
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
        signsLayerRef.current = null;
        dashLayerRef.current = null;
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
    const signsLayer = signsLayerRef.current;
    if (!app || !signsLayer || cancelledRef.current) return;

    if (idx >= totalRounds) {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
      return;
    }

    const PIXI = await import("pixi.js");
    if (cancelledRef.current) return;

    // Clear previous signs
    signsLayer.removeChildren().forEach((c) => c.destroy({ children: true }));

    const target = gameWords[idx];
    // Lane difficulty per world: Mundo 1 keeps one rock (2 readable
    // lanes), higher worlds drop the rocks so all 3 lanes carry words.
    const lanes = buildLanes(target, words, rocksForPhase(phase), shuffle);
    const targetLane = lanes.findIndex((l) => l.word?.id === target.id);

    const signs: RoundData["signs"] = [];
    lanes.forEach(({ word }, lane) => {
      const box = new PIXI.Container();

      if (!word) {
        // Blocked lane: just a rock, no sign to read
        const rock = new PIXI.Graphics();
        rock.ellipse(0, 8, 30, 18).fill("#9e9e9e");
        rock.ellipse(-12, 0, 16, 12).fill("#bdbdbd");
        box.addChild(rock);
      } else {
        const plate = new PIXI.Graphics();
        plate
          .roundRect(-SIGN_W / 2, -SIGN_H / 2, SIGN_W, SIGN_H, 14)
          .fill("#ffffff")
          .stroke({ width: 4, color: 0x8d6e63 });
        box.addChild(plate);

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
        // Shrink long words so they fit on the sign
        if (label.width > SIGN_W - 24) label.scale.set((SIGN_W - 24) / label.width);
        box.addChild(label);
      }

      box.x = LANES_X[lane];
      box.y = SIGN_SPAWN_Y;
      signsLayer.addChild(box);
      signs.push({ box, lane });
    });

    roundRef.current = {
      signs,
      targetLane,
      target,
      speed: BASE_SPEED * (1 + idx * 0.04),
      active: false,
      resolved: false,
    };

    setTargetWord(target);
    setLaneWords(lanes.map((l) => l.word));
    setFeedbackType(null);
    setGamePhase("announcing");

    await sofiaNameWord(target.text);
    if (cancelledRef.current) return;
    roundRef.current.active = true;
    setGamePhase("running");
  }, [totalRounds, gameWords, words, phase, finish, onComplete, state]);

  // First round once Pixi is up
  useEffect(() => {
    if (gamePhase === "announcing" && roundIdx === 0 && roundRef.current.signs.length === 0) {
      setupRound(0);
    }
  }, [gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Resolve (called from the Pixi ticker when signs reach Leo) ──

  const handleResolve = useCallback(async () => {
    const round = roundRef.current;
    const target = round.target;
    if (!target) return;

    const correct = leoLaneRef.current === round.targetLane;
    recordAttempt(correct, correct ? target.id : undefined);
    setGamePhase("feedback");
    setFeedbackType(correct ? "correct" : "wrong");

    if (correct) {
      // Coin flies from Leo's canvas position to the chest in the header
      const canvas = appRef.current?.canvas;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / W;
        rewardCorrect(rect.left + LANES_X[round.targetLane] * scale, rect.top + LEO_Y * scale);
      }
      jumpTRef.current = 0; // victory hop
      squashTRef.current = 0; // celebration squash-and-stretch
      await sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited");
    } else {
      // Error: solo el tint de tropezon + repetir la palabra objetivo
      // como refuerzo (sin audio de "esa no" / "intenta otra vez")
      crashTRef.current = 0; // stumble
      await sofiaNameWord(target.text);
    }

    if (cancelledRef.current) return;
    await new Promise((r) => setTimeout(r, 500));
    if (cancelledRef.current) return;
    setFeedbackType(null);
    const next = roundIdx + 1;
    setRoundIdx(next);
    setupRound(next);
  }, [recordAttempt, rewardCorrect, roundIdx, setupRound]);

  resolveRef.current = handleResolve;

  // ─── Lane taps — Leo jumps to the tapped lane ────────────────────

  const handleLaneTap = useCallback((lane: number) => {
    if (gamePhase !== "running") return;
    if (lane !== leoLaneRef.current) {
      leoLaneRef.current = lane;
      jumpTRef.current = 0;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(15);
    }
  }, [gamePhase]);

  // Keyboard: ↑/↓ (y ←/→ como alias — los carriles son columnas)
  // mueven a Leo un carril; el toque en los carriles queda igual
  const moveLane = useCallback((delta: -1 | 1) => {
    handleLaneTap(Math.min(2, Math.max(0, leoLaneRef.current + delta)));
  }, [handleLaneTap]);

  useGameKeys(gamePhase === "running" && !paused, {
    ArrowUp: () => moveLane(-1),
    ArrowLeft: () => moveLane(-1),
    ArrowDown: () => moveLane(1),
    ArrowRight: () => moveLane(1),
  });

  // Demo mode: tap the correct lane while the signs are still far
  useDemoAutoplay(isDemo, gamePhase === "running", () => {
    const btn = document.querySelector(`[data-word-id="${roundRef.current.target?.id}"]`) as HTMLElement;
    if (btn) btn.click();
  }, 2500);

  const handleReplay = useCallback(() => {
    reset();
    leoLaneRef.current = 1;
    setRoundIdx(0);
    setupRound(0);
  }, [reset, setupRound]);

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    return (
      <GameShell title="Leo Corre" icon="🦁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Leo Corre" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Leo Corre" icon="🦁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
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
              {targetWord.text}
            </motion.div>
          )}
          <span style={{ width: 40 }} />
        </div>

        {/* Pixi canvas + invisible lane tap zones */}
        <div style={{ position: "relative", width: "100%", maxWidth: "min(640px, calc(100vw - 32px))", borderRadius: radii.xl, overflow: "hidden", border: `2px solid ${colors.border.light}` }}>
          {/* React must never render children inside hostRef — Pixi
              appends its canvas there manually */}
          <div ref={hostRef} style={{ width: "100%", aspectRatio: `${W} / ${H}` }} />
          {gamePhase === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fontSizes.md, color: colors.text.muted, fontFamily: fonts.display }}>
              Cargando a Leo... 🦁
            </div>
          )}
          {[0, 1, 2].map((lane) => (
            <button
              key={lane}
              data-lane={lane}
              data-word-id={laneWords[lane]?.id ?? ""}
              aria-label={`Carril ${lane + 1}${laneWords[lane] ? `: ${laneWords[lane]!.text}` : ""}`}
              onClick={() => handleLaneTap(lane)}
              style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${(lane * 100) / 3}%`, width: `${100 / 3}%`,
                background: "transparent", border: "none", padding: 0,
                cursor: gamePhase === "running" ? "pointer" : "default",
              }}
            />
          ))}
        </div>

        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, textAlign: "center" }}>
          {gamePhase === "announcing" ? "Escucha a Sofía..." : "Toca el camino con la palabra correcta"}
        </p>

        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
