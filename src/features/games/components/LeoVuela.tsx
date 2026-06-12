"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Application, Container, Sprite } from "pixi.js";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useGameKeys } from "../hooks/useGameKeys";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { domanCanvasText } from "../config/doman-canvas";
import { physicsForPhase, stepFlight, buildCloudRound } from "../config/leo-vuela";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#9f7aea";
const WORDS_PER_GAME = 20;

// Unico punto de cambio del sprite: Leo volando hacia la derecha,
// hacia las nubes que entran (procesado por scripts/prepare-leo-sprites.py)
const LEO_SPRITE_URL = "/images/games/leo-vuela-sprite.png";

// Logical canvas size — CSS scales it to the container width
const W = 640;
const H = 420;
const GROUND_Y = H - 58;
const LEO_X = W * 0.26;
const LEO_TOP_Y = 130; // techo para leo.y (los pies; la cabeza queda ~34px del borde)
const LEO_CENTER_OFFSET = 48; // el centro de Leo respecto de sus pies (anchor 0.5,1)
const CLOUD_BANDS = [105, 200, 295]; // alturas posibles de las nubes
const CATCH_X = 60; // rango horizontal de atrape
const CATCH_Y = 48; // rango vertical de atrape (centro de Leo vs nube)
const FADE_RATE = 0.04; // alpha/frame con que se desvanece la tanda anterior

type Phase = "loading" | "running" | "finished";

interface FlyingCloud {
  box: Container;
  word: DomanWord;
  caught: boolean;
}

interface RoundData {
  clouds: FlyingCloud[];
  target: DomanWord | null;
  speed: number;
  active: boolean;
  resolved: boolean;
}

export const LeoVuela: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("leo-vuela", { phase });
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
  const cloudsLayerRef = useRef<Container | null>(null);

  const leoYRef = useRef(GROUND_Y + 4); // pies de Leo
  const vyRef = useRef(0);
  const crashTRef = useRef(1); // 0→1 stumble progress
  const squashTRef = useRef(1); // 0→1 squash-and-stretch on a correct catch
  const baseScaleRef = useRef(0); // Leo sprite's natural scale
  const elapsedRef = useRef(0);
  const gamePhaseRef = useRef<Phase>("loading");
  const isDemoRef = useRef(isDemo);
  const roundRef = useRef<RoundData>({ clouds: [], target: null, speed: 0, active: false, resolved: false });
  const fadingRef = useRef<Container[]>([]); // nubes de tandas viejas, desvaneciendose
  const onCatchRef = useRef<(fc: FlyingCloud) => void>(() => {});
  const onEscapeRef = useRef<() => void>(() => {});
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  gamePhaseRef.current = gamePhase;
  isDemoRef.current = isDemo;

  const physics = useMemo(() => physicsForPhase(phase), [phase]);
  const physicsRef = useRef(physics);
  physicsRef.current = physics;

  const gameWords = useMemo(() => shuffle(words).slice(0, WORDS_PER_GAME), [words]);
  const totalRounds = gameWords.length;

  // ─── Pixi init (same lifecycle pattern as SaltaPalabra) ──────────

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
      await app.init({ width: W, height: H, background: "#dbeafe", antialias: true });
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

      // Sky: sun + decorative far clouds + grass floor
      const scenery = new PIXI.Graphics();
      scenery.circle(W - 76, 58, 28).fill({ color: 0xfff176, alpha: 0.9 });
      for (const [cx, cy, s] of [[140, 52, 0.7], [380, 78, 0.55], [540, 130, 0.5]] as const) {
        scenery.ellipse(cx, cy, 46 * s, 16 * s).fill({ color: 0xffffff, alpha: 0.6 });
        scenery.ellipse(cx + 24 * s, cy - 10 * s, 30 * s, 13 * s).fill({ color: 0xffffff, alpha: 0.6 });
      }
      scenery.rect(0, GROUND_Y, W, H - GROUND_Y).fill("#a8d5b0");
      scenery.rect(0, GROUND_Y, W, 6).fill("#8bc49a");
      app.stage.addChild(scenery);

      // Word clouds layer
      const cloudsLayer = new PIXI.Container();
      app.stage.addChild(cloudsLayer);
      cloudsLayerRef.current = cloudsLayer;

      // Leo — sprite if the texture loads, emoji fallback otherwise
      const leo = new PIXI.Container();
      try {
        const tex = await PIXI.Assets.load(LEO_SPRITE_URL);
        // After appRef is set the cleanup owns destruction — just bail
        if (disposed) return;
        const sprite = new PIXI.Sprite(tex);
        // Anclado al centro del cuerpo: la inclinacion al subir/caer
        // rota alrededor de Leo, no de sus pies
        sprite.anchor.set(0.5, 0.5);
        sprite.y = -LEO_CENTER_OFFSET;
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

        // Clouds: drift left + gentle bob — NUNCA se frenan
        round.clouds.forEach((fc, i) => {
          if (fc.caught) return;
          if (round.active) fc.box.x -= round.speed * dt;
          fc.box.pivot.y = Math.sin(elapsedRef.current * 0.06 + i * 2) * 4;
        });

        // Tandas viejas: siguen volando mientras se desvanecen
        if (fadingRef.current.length > 0) {
          fadingRef.current = fadingRef.current.filter((box) => {
            box.x -= round.speed * dt;
            box.alpha -= FADE_RATE * dt;
            if (box.alpha <= 0 || box.x < -150) {
              box.destroy({ children: true });
              return false;
            }
            return true;
          });
        }

        // Leo: gravity pulls down, flaps push up (physics via refs)
        const leoC = leoRef.current;
        if (leoC) {
          const stepped = stepFlight(leoYRef.current, vyRef.current, dt, physicsRef.current, {
            top: LEO_TOP_Y,
            ground: GROUND_Y + 4,
          });
          leoYRef.current = stepped.y;
          vyRef.current = stepped.vy;

          // Idle bob only while resting on the ground
          const onGround = stepped.y >= GROUND_Y + 4;
          leoC.y = stepped.y + (onGround ? Math.sin(elapsedRef.current * 0.18) * 2 : 0);

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

          // Lean into the flight: nose up on flaps, nose down falling
          if (leoSpriteRef.current) {
            leoSpriteRef.current.rotation = onGround ? 0 : Math.max(-0.25, Math.min(0.3, vyRef.current * 0.07));
          }

          // Squash-and-stretch celebration on a correct catch
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

          // Flying through a cloud catches it (both axes, vs Leo's center)
          if (round.active && !round.resolved) {
            const leoCenterY = leoYRef.current - LEO_CENTER_OFFSET;
            for (const fc of round.clouds) {
              if (!fc.caught && Math.abs(fc.box.x - LEO_X) < CATCH_X && Math.abs(fc.box.y - leoCenterY) < CATCH_Y) {
                fc.caught = true;
                fc.box.visible = false;
                onCatchRef.current(fc);
                break;
              }
            }
          }
        }

        // Target escaped off the left edge → miss
        if (round.active && !round.resolved) {
          const targetFc = round.clouds.find((fc) => fc.word.id === round.target?.id);
          if (targetFc && !targetFc.caught && targetFc.box.x < -100) {
            round.resolved = true;
            round.active = false;
            onEscapeRef.current();
          }
        }

        // Demo mode: flap toward the target cloud's altitude when it
        // gets close; otherwise cruise at mid-sky
        if (isDemoRef.current && round.active && !round.resolved) {
          const targetFc = round.clouds.find((fc) => fc.word.id === round.target?.id && !fc.caught);
          if (targetFc) {
            const dist = targetFc.box.x - LEO_X;
            const aimY = dist < 280 ? targetFc.box.y + LEO_CENTER_OFFSET : H * 0.55;
            if (leoYRef.current > aimY + 10 && vyRef.current >= 0) {
              vyRef.current = -physicsRef.current.impulse;
            }
          }
        }
      });

      setGamePhase("running");
    })();

    return () => {
      disposed = true;
      cancelledRef.current = true;
      stopVoice();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      // Only destroy once appRef was set (init finished); before that
      // the async init path destroys the app itself when it sees
      // `disposed`, and destroying mid-init throws.
      if (app && appRef.current === app) {
        try { app.destroy(true, { children: true }); } catch { /* already gone */ }
        appRef.current = null;
        leoRef.current = null;
        leoSpriteRef.current = null;
        cloudsLayerRef.current = null;
        fadingRef.current = [];
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

  // Feedback flash con limpieza propia (el flujo ya no se detiene)
  const flashFeedback = useCallback((type: "correct" | "wrong") => {
    setFeedbackType(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      if (!cancelledRef.current) setFeedbackType(null);
    }, 700);
  }, []);

  // ─── Wave setup — sin pausas: la tanda anterior se desvanece y la
  // nueva entra ya; Sofia dice el objetivo en paralelo ──────────────

  const spawnWave = useCallback(async (idx: number) => {
    const app = appRef.current;
    const cloudsLayer = cloudsLayerRef.current;
    if (!app || !cloudsLayer || cancelledRef.current) return;

    if (idx >= totalRounds) {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
      return;
    }

    const PIXI = await import("pixi.js");
    if (cancelledRef.current) return;

    // Las nubes restantes de la tanda anterior se van desvaneciendo
    for (const fc of roundRef.current.clouds) {
      if (!fc.caught && !fc.box.destroyed) fadingRef.current.push(fc.box);
    }

    const target = gameWords[idx];
    const specs = buildCloudRound(target, words, CLOUD_BANDS, shuffle);

    const flying: FlyingCloud[] = specs.map(({ word, band }, i) => {
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
      const puffW = Math.max(140, label.width + 56);

      // Cloud body: a white pill with puffs on top
      const cloud = new PIXI.Graphics();
      cloud.roundRect(-puffW / 2, -26, puffW, 52, 26).fill("#ffffff").stroke({ width: 3, color: 0xbfdbfe });
      cloud.ellipse(-puffW / 4, -26, puffW / 4.4, 18).fill("#ffffff");
      cloud.ellipse(puffW / 5, -28, puffW / 3.8, 20).fill("#ffffff");

      box.addChild(cloud);
      box.addChild(label);
      box.x = W + 80 + i * physicsRef.current.cloudGap;
      box.y = band;
      cloudsLayer.addChild(box);
      return { box, word, caught: false };
    });

    roundRef.current = {
      clouds: flying,
      target,
      speed: physicsRef.current.cloudSpeed * (1 + idx * 0.04),
      active: true,
      resolved: false,
    };

    setTargetWord(target);

    // Sofia anuncia en paralelo — el juego no se frena
    stopVoice();
    void sofiaNameWord(target.text);
  }, [totalRounds, gameWords, words, finish, onComplete, state]);

  // First wave once Pixi is up
  useEffect(() => {
    if (gamePhase === "running" && roundIdx === 0 && roundRef.current.clouds.length === 0) {
      spawnWave(0);
    }
  }, [gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextWave = useCallback(() => {
    if (cancelledRef.current) return;
    setRoundIdx((prev) => {
      const next = prev + 1;
      spawnWave(next);
      return next;
    });
  }, [spawnWave]);

  // ─── Catch / escape (called from the Pixi ticker) ────────────────

  const handleCatch = useCallback((fc: FlyingCloud) => {
    const round = roundRef.current;
    const target = round.target;
    if (!target) return;
    const correct = fc.word.id === target.id;

    if (correct) {
      round.resolved = true;
      recordAttempt(true, target.id);
      flashFeedback("correct");
      const canvas = appRef.current?.canvas;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / W;
        rewardCorrect(rect.left + LEO_X * scale, rect.top + (leoYRef.current - LEO_CENTER_OFFSET) * scale);
      }
      squashTRef.current = 0; // celebration squash-and-stretch
      stopVoice();
      void sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited");
      nextWave();
    } else {
      // Tropezon suave: tint + Sofia repite el objetivo, todo sigue
      recordAttempt(false);
      crashTRef.current = 0;
      flashFeedback("wrong");
      stopVoice();
      void sofiaNameWord(target.text);
      // Si el objetivo ya no esta (venia detras de la atrapada), pasar
      const targetFc = round.clouds.find((f) => f.word.id === target.id);
      if (!targetFc || targetFc.caught || targetFc.box.x <= -100) {
        round.resolved = true;
        nextWave();
      }
    }
  }, [recordAttempt, rewardCorrect, nextWave, flashFeedback]);

  const handleEscape = useCallback(() => {
    const round = roundRef.current;
    if (!round.target) return;
    recordAttempt(false);
    flashFeedback("wrong");
    stopVoice();
    void sofiaPlayAudio("reaccion-se-escapo", "¡Se escapó!", "gentle");
    nextWave();
  }, [recordAttempt, nextWave, flashFeedback]);

  onCatchRef.current = handleCatch;
  onEscapeRef.current = handleEscape;

  // ─── Tap anywhere / Espacio / ↑ → Leo flaps up ──────────────────

  const handleFlap = useCallback(() => {
    if (gamePhaseRef.current !== "running" || paused) return;
    vyRef.current = -physicsRef.current.impulse;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
  }, [paused]);

  useGameKeys(gamePhase === "running" && !paused, {
    " ": handleFlap,
    ArrowUp: handleFlap,
  });

  const handleReplay = useCallback(() => {
    reset();
    leoYRef.current = GROUND_Y + 4;
    vyRef.current = 0;
    setRoundIdx(0);
    setGamePhase("running");
    spawnWave(0);
  }, [reset, spawnWave]);

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    return (
      <GameShell title="Leo Vuela" icon="🪁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Leo Vuela" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Leo Vuela" icon="🪁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {/* Round counter + fixed target pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "min(640px, calc(100vw - 32px))" }}>
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
            {Math.min(roundIdx + 1, totalRounds)} / {totalRounds}
          </span>
          {targetWord && (
            <div
              style={{
                padding: `${spacing.xs}px ${spacing.lg}px`,
                backgroundColor: `${GAME_COLOR}15`, border: `2px solid ${GAME_COLOR}`,
                borderRadius: radii.pill, fontSize: fontSizes.xl,
                fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR,
              }}
            >
              Volá a: <motion.span
                key={targetWord.id + roundIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: domanCanvasText(targetWord).fill }}
              >{targetWord.text}</motion.span>
            </div>
          )}
          <span style={{ width: 40 }} />
        </div>

        {/* Pixi canvas + full-surface flap tap zone */}
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
            data-fly
            data-word-id={targetWord?.id ?? ""}
            aria-label="Volar"
            onClick={handleFlap}
            style={{
              position: "absolute", inset: 0,
              background: "transparent", border: "none", padding: 0,
              cursor: gamePhase === "running" ? "pointer" : "default",
            }}
          />
        </div>

        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, textAlign: "center" }}>
          Toca para que Leo vuele hasta la nube correcta
        </p>

        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
