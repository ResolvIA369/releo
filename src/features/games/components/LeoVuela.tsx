"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Application, Container, Sprite, Graphics, Text } from "pixi.js";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useGameKeys } from "../hooks/useGameKeys";
import { useArcadeEnergy } from "../hooks/useArcadeEnergy";
import { useArcadeLevel } from "../hooks/useArcadeLevel";
import { useSofiaIntro } from "../hooks/useSofiaIntro";
import { useQualityTier } from "../hooks/useQualityTier";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { recordGameEvent } from "@/shared/services/gameTelemetry";
import { domanCanvasText } from "../config/doman-canvas";
import { physicsForPhase, stepFlight, buildCloudRound, tuningForPhase, rewardForLevel } from "../config/leo-vuela";
import { createWordBag, normalizedCloudPuffWidth } from "../config/arcade-tuning";
import { getConsequenceEmoji } from "../config/word-consequence";
import { LeoVuelaObstacles } from "./leo-vuela-obstacles";
import { ArcadeSky, moodForLevel } from "./arcade-sky";
import { WordConsequenceFx } from "./word-consequence-fx";
import { MissionNarrative } from "./MissionNarrative";
import { ArcadeHud, MoveButtons } from "./ArcadeHud";
import { ArcadeIntro } from "./ArcadeIntro";
import { LeoVuelaMusic } from "./leo-vuela-music";
import { WORLDS } from "@/features/progression/config/worlds";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#9f7aea";

// Animacion de vuelo: 2 poses (A extendido / B recogido) cruzadas por
// alpha — ambas comparten el mismo lienzo y el mismo punto de anclaje
// (ojo), preparadas a partir de "Leo A.png"/"Leo B.png" (QA sep-2026).
// Si alguna de las dos no carga, cae al sprite estatico anterior.
const LEO_FRAME_A_URL = "/images/games/leo-vuela-frame-a.png";
const LEO_FRAME_B_URL = "/images/games/leo-vuela-frame-b.png";
const LEO_SPRITE_URL = "/images/games/leo-vuela-sprite.png";
// Ciclo completo A→B→A. "Suave" a proposito: ida y vuelta por cruce de
// alpha (coseno), no un cambio de textura duro — pedido explicito de
// no parecer flipbook/parpadeo. Ajustado mirando el resultado en vivo.
const LEO_FLIGHT_CYCLE_MS = 900;
const LEO_FLIGHT_CYCLE_FRAMES = (LEO_FLIGHT_CYCLE_MS / 1000) * 60;

// Logical canvas size — CSS scales it to the container width
const W = 640;
const H = 420;
const GROUND_Y = H - 58;
const LEO_BASE_X = W * 0.26;
const LEO_MIN_X = 70; // limites del movimiento adelante/atras
const LEO_MAX_X = W * 0.55;
const LEO_TOP_Y = 130; // techo para leo.y (los pies; la cabeza queda ~34px del borde)
const LEO_CENTER_OFFSET = 48; // el centro de Leo respecto de sus pies (anchor 0.5,1)
const CLOUD_BANDS = [105, 200, 295]; // alturas posibles de las nubes
const CATCH_X = 60; // rango horizontal de atrape
const CATCH_Y = 48; // rango vertical de atrape (centro de Leo vs nube)
const FADE_RATE = 0.04; // alpha/frame con que se desvanece la tanda anterior
const BOOK_X = 34; // ancla fija del Libro Magico (arriba a la izquierda)
const BOOK_Y = 30;
const MAX_TRAIL_DOTS = 40;

// Intro de Sofia al arrancar (mp3 generado con edge-tts es-AR-ElenaNeural;
// este texto es el fallback hablado si el audio no carga)
const INTRO_TEXT =
  "¡Soy la Seño Sofía! Hoy Leo quiere volar entre las nubes. " +
  "Escuchá la palabra, y tocá la pantalla para que Leo vuele hasta la nube correcta. " +
  "¡Vos podés! ¡A volar!";

type Phase = "loading" | "story-intro" | "intro" | "running" | "story-outro" | "finished";

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

export const LeoVuela: React.FC<GameProps> = ({ words, phase = 1, worldId, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("leo-vuela", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();
  const qualityTier = useQualityTier();
  const qualityTierRef = useRef(qualityTier);
  qualityTierRef.current = qualityTier;

  const [gamePhase, setGamePhase] = useState<Phase>("loading");
  const [roundIdx, setRoundIdx] = useState(0);
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);

  // Narrativa breve: solo la primera vez que se abre Leo Vuela en este
  // mundo durante la sesión del navegador — no en cada partida (ver
  // docs/RELEO-JUEGOS-V2.md §6). Sin worldId (p.ej. algún acceso
  // directo sin contexto de mundo) no hay narrativa, no hay curriculum
  // real del que tirar.
  // Lectura PURA (sin escribir) — un initializer de useState que escribe
  // se ejecuta dos veces en dev bajo StrictMode y la segunda vez ya ve
  // su propia marca, quedando siempre en false. Marcar "visto" se hace
  // recien cuando el niño realmente cierra la narrativa (mas abajo).
  const [showIntroNarrative] = useState(() => {
    if (typeof window === "undefined" || !worldId) return false;
    try {
      return !window.sessionStorage.getItem(`releo:leo-vuela-intro-seen:${worldId}`);
    } catch {
      return false;
    }
  });
  const markIntroSeen = useCallback(() => {
    if (typeof window === "undefined" || !worldId) return;
    try {
      window.sessionStorage.setItem(`releo:leo-vuela-intro-seen:${worldId}`, "1");
    } catch {
      // Sin sessionStorage (privado, cuota) la narrativa se puede repetir; no es grave.
    }
  }, [worldId]);
  const worldName = useMemo(() => WORLDS.find((w) => w.id === worldId)?.name, [worldId]);
  const caughtEmojisRef = useRef<string[]>([]);

  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const leoRef = useRef<Container | null>(null);
  const leoSpriteRef = useRef<Sprite | null>(null); // pose A (extendido) — sigue siendo la referencia de tilt/tint/squash
  const leoSpriteBRef = useRef<Sprite | null>(null); // pose B (recogido) — espeja las mismas transformaciones, solo cambia el alpha
  const cloudsLayerRef = useRef<Container | null>(null);
  const obstaclesRef = useRef<LeoVuelaObstacles | null>(null);
  const skyRef = useRef<ArcadeSky | null>(null);
  const wordFxRef = useRef<WordConsequenceFx | null>(null);
  const bookIconRef = useRef<Text | null>(null);
  const bookPulseRef = useRef(1); // 1 = en reposo; <1 = animando el pulso
  const trailLayerRef = useRef<Container | null>(null);
  const trailRef = useRef<Graphics[]>([]);

  const leoYRef = useRef(GROUND_Y + 4); // pies de Leo
  const leoXRef = useRef(LEO_BASE_X);
  const moveDirRef = useRef<-1 | 0 | 1>(0); // esquive adelante/atras
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
  const sessionStartRef = useRef(0); // Date.now() al arrancar la primera tanda

  gamePhaseRef.current = gamePhase;
  isDemoRef.current = isDemo;

  const physics = useMemo(() => physicsForPhase(phase), [phase]);
  const physicsRef = useRef(physics);
  physicsRef.current = physics;

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const bagRef = useRef<ReturnType<typeof createWordBag> | null>(null);
  if (!bagRef.current) bagRef.current = createWordBag(words);

  const tuning = useMemo(() => tuningForPhase(phase), [phase]);
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;

  const onEnergyOutRef = useRef<() => void>(() => {});
  const energy = useArcadeEnergy(tuning);
  const { energyRef } = energy;
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { playSecRef, levelRef, levelUi } = level;

  const birdInvulnUntilRef = useRef(0); // fin de la invulnerabilidad (en seg de juego)

  // Musica de percusion: instancia liviana, el audio recien se crea
  // tras el primer gesto (ensureStarted)
  const musicRef = useRef<LeoVuelaMusic | null>(null);
  if (!musicRef.current) {
    musicRef.current = new LeoVuelaMusic(tuning.musicVolumeDb, tuning.musicDuckDb, tuning.musicTracks);
  }
  useEffect(() => () => {
    musicRef.current?.dispose();
    musicRef.current = null;
  }, []);

  // Sofia habla → la musica se agacha hasta que termina
  const speakDucked = useCallback((speak: () => Promise<unknown>) => {
    stopVoice();
    musicRef.current?.duck(true);
    void speak().finally(() => musicRef.current?.duck(false));
  }, []);

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

      // Cielo: parallax de 2 capas + progresion de humor por nivel
      // (dia -> atardecer -> noche), ver components/arcade-sky.ts
      skyRef.current = new ArcadeSky(PIXI, app.stage, { W, H, groundY: GROUND_Y });

      // Word clouds layer
      const cloudsLayer = new PIXI.Container();
      app.stage.addChild(cloudsLayer);
      cloudsLayerRef.current = cloudsLayer;

      // Obstacles layer (delante de las nubes, detras de Leo)
      const obstaclesLayer = new PIXI.Container();
      app.stage.addChild(obstaclesLayer);
      obstaclesRef.current = new LeoVuelaObstacles(PIXI, obstaclesLayer, { W, H, groundY: GROUND_Y });

      // Trail decorativo de Leo (se apaga solo en quality tier bajo)
      const trailLayer = new PIXI.Container();
      app.stage.addChild(trailLayer);
      trailLayerRef.current = trailLayer;

      // Leo — 2 poses (A/B) cruzadas por alpha; si alguna de las 2 no
      // carga cae al sprite estatico anterior, y si ese tampoco carga
      // al emoji de siempre.
      const leo = new PIXI.Container();
      try {
        const [texA, texB] = await Promise.all([
          PIXI.Assets.load(LEO_FRAME_A_URL),
          PIXI.Assets.load(LEO_FRAME_B_URL),
        ]);
        // After appRef is set the cleanup owns destruction — just bail
        if (disposed) return;
        const spriteA = new PIXI.Sprite(texA);
        const spriteB = new PIXI.Sprite(texB);
        for (const sprite of [spriteA, spriteB]) {
          // Anclado al centro del cuerpo: la inclinacion al subir/caer
          // rota alrededor de Leo, no de sus pies. Los 2 frames comparten
          // lienzo y punto de anclaje (ojo), asi que el mismo anchor/scale
          // les queda igual a ambos sin recalcular nada por textura.
          sprite.anchor.set(0.5, 0.5);
          sprite.y = -LEO_CENTER_OFFSET;
        }
        baseScaleRef.current = 96 / spriteA.height;
        spriteA.scale.set(baseScaleRef.current);
        spriteB.scale.set(baseScaleRef.current);
        spriteB.alpha = 0;
        leo.addChild(spriteA);
        leo.addChild(spriteB);
        leoSpriteRef.current = spriteA;
        leoSpriteBRef.current = spriteB;
      } catch {
        try {
          const tex = await PIXI.Assets.load(LEO_SPRITE_URL);
          if (disposed) return;
          const sprite = new PIXI.Sprite(tex);
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
      }
      const shadow = new PIXI.Graphics();
      shadow.ellipse(0, 0, 34, 9).fill({ color: 0x000000, alpha: 0.15 });
      leo.addChildAt(shadow, 0);
      leo.x = LEO_BASE_X;
      leo.y = GROUND_Y + 4;
      app.stage.addChild(leo);
      leoRef.current = leo;

      // Libro Magico: ancla fija de "la palabra vuelve al libro" tras
      // un acierto (word-consequence-fx.ts) — decorativo, nunca compite
      // con la lectura porque solo reacciona DESPUES de un acierto.
      const bookIcon = new PIXI.Text({ text: "📖", style: { fontSize: 30 } });
      bookIcon.anchor.set(0.5);
      bookIcon.x = BOOK_X;
      bookIcon.y = BOOK_Y;
      app.stage.addChild(bookIcon);
      bookIconRef.current = bookIcon;

      const fxLayer = new PIXI.Container();
      app.stage.addChild(fxLayer);
      wordFxRef.current = new WordConsequenceFx(PIXI, fxLayer);

      // ─── Game loop — reads refs only, so no stale closures ──────
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;
        elapsedRef.current += dt;
        const round = roundRef.current;

        // Cielo: el humor sigue al nivel real (mismos 3 niveles de
        // siempre, ver arcade-sky.ts); setMood no hace nada si no cambio
        skyRef.current?.setMood(moodForLevel(levelRef.current));
        skyRef.current?.update(dt);

        // Efecto "la palabra vuelve al libro" (solo avanza si hay alguno activo)
        wordFxRef.current?.update(dt);
        if (bookIconRef.current && bookPulseRef.current < 1) {
          bookPulseRef.current = Math.min(1, bookPulseRef.current + dt / 20);
          const k = Math.sin(bookPulseRef.current * Math.PI);
          bookIconRef.current.scale.set(1 + 0.4 * k);
        }

        // Nivel por tiempo jugado: mas velocidad y nubes mas juntas
        const tun = tuningRef.current;
        if (round.active && gamePhaseRef.current === "running") {
          level.tick(dt);
          // Drenaje pasivo de energia; en 0 se termina
          if (energy.drainTick(dt)) {
            round.active = false;
            round.resolved = true;
            onEnergyOutRef.current();
          }
        }
        const levelCfg = tun.levels[levelRef.current] ?? tun.levels[0];
        const effSpeed = round.speed * levelCfg.speedMul;

        // Clouds: drift left + gentle bob — NUNCA se frenan
        round.clouds.forEach((fc, i) => {
          if (fc.caught) return;
          if (round.active) fc.box.x -= effSpeed * dt;
          fc.box.pivot.y = Math.sin(elapsedRef.current * 0.06 + i * 2) * 4;
        });

        // Tandas viejas: siguen volando mientras se desvanecen
        if (fadingRef.current.length > 0) {
          fadingRef.current = fadingRef.current.filter((box) => {
            box.x -= effSpeed * dt;
            box.alpha -= FADE_RATE * dt;
            if (box.alpha <= 0 || box.x < -150) {
              box.destroy({ children: true });
              return false;
            }
            return true;
          });
        }

        // Obstaculos: empujan a Leo, no tocan puntos ni energia
        let gravityMul = 1;
        if (round.active && gamePhaseRef.current === "running" && obstaclesRef.current) {
          const frame = obstaclesRef.current.update(dt, levelCfg, {
            x: leoXRef.current,
            y: leoYRef.current - LEO_CENTER_OFFSET,
          });
          if (frame.knock !== 0) {
            // Positivo empuja hacia abajo (pajaros/rayos), negativo
            // hacia arriba (nubes rasantes del piso)
            vyRef.current = frame.knock > 0
              ? Math.max(vyRef.current, frame.knock)
              : Math.min(vyRef.current, frame.knock);
            crashTRef.current = 0; // sacudida visual
          }
          // Solo los pajaros restan energia, con ventana de
          // invulnerabilidad para que una rafaga no drene de golpe
          if (frame.birdHit && playSecRef.current >= birdInvulnUntilRef.current) {
            birdInvulnUntilRef.current = playSecRef.current + tun.birdHitInvulnSec;
            energy.adjust(-tun.energyLossPerBird);
          }
          gravityMul = frame.gravityMul;
        }

        // Movimiento horizontal (esquive): teclas o botones ◀ ▶
        if (round.active && gamePhaseRef.current === "running" && moveDirRef.current !== 0) {
          leoXRef.current = Math.min(LEO_MAX_X, Math.max(
            LEO_MIN_X,
            leoXRef.current + moveDirRef.current * tuningRef.current.horizontalSpeed * dt,
          ));
        }

        // Leo: gravity pulls down, flaps push up (physics via refs)
        const leoC = leoRef.current;
        if (leoC) {
          const stepped = stepFlight(leoYRef.current, vyRef.current, dt, {
            gravity: physicsRef.current.gravity * gravityMul,
          }, {
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
            leoC.x = leoXRef.current + Math.sin(crashTRef.current * Math.PI * 6) * 5;
            if (leoSpriteRef.current) {
              leoSpriteRef.current.tint = crashTRef.current < 1 ? 0xffb0b0 : 0xffffff;
            }
          } else {
            leoC.x = leoXRef.current;
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

          // Pose B espeja tint/rotacion/escala de la pose A frame a
          // frame (mismo lienzo y anclaje, asi que no hace falta
          // recalcular nada) y solo se distingue por el alpha: un
          // cruce suave A→B→A por coseno, nunca un corte duro entre
          // texturas. Se congela durante el sacudido de impacto
          // (crashT<1) para no competir con esa reaccion.
          if (leoSpriteRef.current && leoSpriteBRef.current) {
            leoSpriteBRef.current.tint = leoSpriteRef.current.tint;
            leoSpriteBRef.current.rotation = leoSpriteRef.current.rotation;
            leoSpriteBRef.current.scale.copyFrom(leoSpriteRef.current.scale);
            if (crashTRef.current >= 1) {
              const cyclePos = (elapsedRef.current % LEO_FLIGHT_CYCLE_FRAMES) / LEO_FLIGHT_CYCLE_FRAMES;
              const alphaA = (Math.cos(cyclePos * Math.PI * 2) + 1) / 2;
              leoSpriteRef.current.alpha = alphaA;
              leoSpriteBRef.current.alpha = 1 - alphaA;
            }
          }

          // Estela decorativa detras de Leo en pleno vuelo — solo en
          // tier alto (useQualityTier.ts): pura ambientacion, nunca
          // compite con la legibilidad de la nube-objetivo
          if (trailLayerRef.current) {
            if (
              qualityTierRef.current === "high" &&
              round.active &&
              gamePhaseRef.current === "running" &&
              !onGround &&
              Math.floor(elapsedRef.current) % 3 === 0
            ) {
              const dot = new PIXI.Graphics();
              dot.circle(0, 0, 4).fill({ color: 0xffffff, alpha: 0.5 });
              dot.x = leoC.x - 22;
              dot.y = leoC.y;
              trailLayerRef.current.addChild(dot);
              trailRef.current.push(dot);
              if (trailRef.current.length > MAX_TRAIL_DOTS) {
                trailRef.current.shift()?.destroy();
              }
            }
            trailRef.current = trailRef.current.filter((dot) => {
              if (dot.destroyed) return false;
              dot.alpha -= 0.03 * dt;
              dot.x -= effSpeed * 0.4 * dt;
              if (dot.alpha <= 0) {
                dot.destroy();
                return false;
              }
              return true;
            });
          }

          // Flying through a cloud catches it (both axes, vs Leo's center)
          if (round.active && !round.resolved) {
            const leoCenterY = leoYRef.current - LEO_CENTER_OFFSET;
            for (const fc of round.clouds) {
              if (!fc.caught && Math.abs(fc.box.x - leoXRef.current) < CATCH_X && Math.abs(fc.box.y - leoCenterY) < CATCH_Y) {
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
            const dist = targetFc.box.x - leoXRef.current;
            const aimY = dist < 280 ? targetFc.box.y + LEO_CENTER_OFFSET : H * 0.55;
            if (leoYRef.current > aimY + 10 && vyRef.current >= 0) {
              vyRef.current = -physicsRef.current.impulse;
            }
          }
        }
      });

      setGamePhase(showIntroNarrative ? "story-intro" : "intro");
    })();

    return () => {
      disposed = true;
      cancelledRef.current = true;
      stopVoice();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      // Abandono real: se fue con la partida ya arrancada y sin llegar
      // a "finished" (ese caso ya reporto su propio game_finished)
      if (gamePhaseRef.current !== "finished" && sessionStartRef.current > 0) {
        recordGameEvent({
          type: "game_abandoned",
          gameId: "leo-vuela",
          phase,
          elapsedMs: Date.now() - sessionStartRef.current,
        });
      }
      skyRef.current?.destroy();
      wordFxRef.current?.reset();
      skyRef.current = null;
      wordFxRef.current = null;
      bookIconRef.current = null;
      trailLayerRef.current = null;
      trailRef.current = [];
      // Only destroy once appRef was set (init finished); before that
      // the async init path destroys the app itself when it sees
      // `disposed`, and destroying mid-init throws.
      if (app && appRef.current === app) {
        try { app.destroy(true, { children: true }); } catch { /* already gone */ }
        appRef.current = null;
        leoRef.current = null;
        leoSpriteRef.current = null;
        leoSpriteBRef.current = null;
        cloudsLayerRef.current = null;
        obstaclesRef.current = null;
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
      musicRef.current?.pause();
    } else {
      app.ticker.start();
      if (gamePhaseRef.current === "running") musicRef.current?.resume();
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

  const spawnWave = useCallback(async () => {
    const app = appRef.current;
    const cloudsLayer = cloudsLayerRef.current;
    if (!app || !cloudsLayer || cancelledRef.current) return;

    const PIXI = await import("pixi.js");
    if (cancelledRef.current) return;

    // Las nubes restantes de la tanda anterior se van desvaneciendo
    for (const fc of roundRef.current.clouds) {
      if (!fc.caught && !fc.box.destroyed) fadingRef.current.push(fc.box);
    }

    // Las palabras pueden repetirse durante la partida — solo se evita
    // la misma dos veces seguidas
    const target = bagRef.current!.next();
    const specs = buildCloudRound(target, wordsRef.current, CLOUD_BANDS, shuffle);

    // Medimos primero las 3 etiquetas de la ronda: las 3 nubes van a
    // compartir el mismo ancho de pill (normalizedCloudPuffWidth) — si
    // el ancho dependiera de cada palabra, la mas larga delataria la
    // respuesta sin necesidad de leer (hallazgo real de QA con
    // "caliente"/"frio").
    const labels = specs.map(({ word }) => {
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
      return label;
    });
    const puffW = normalizedCloudPuffWidth(labels.map((l) => l.width));

    const flying: FlyingCloud[] = specs.map(({ word, band }, i) => {
      const box = new PIXI.Container();
      const label = labels[i];

      // Cloud body: a white pill with puffs on top
      const cloud = new PIXI.Graphics();
      cloud.roundRect(-puffW / 2, -26, puffW, 52, 26).fill("#ffffff").stroke({ width: 3, color: 0xbfdbfe });
      cloud.ellipse(-puffW / 4, -26, puffW / 4.4, 18).fill("#ffffff");
      cloud.ellipse(puffW / 5, -28, puffW / 3.8, 20).fill("#ffffff");

      box.addChild(cloud);
      box.addChild(label);
      // El nivel actual junta mas las nubes (gapMul) — la velocidad
      // del nivel se aplica en vivo en el ticker (speedMul)
      const levelGapMul = tuningRef.current.levels[levelRef.current]?.gapMul ?? 1;
      box.x = W + 80 + i * physicsRef.current.cloudGap * levelGapMul;
      box.y = band;
      cloudsLayer.addChild(box);
      return { box, word, caught: false };
    });

    roundRef.current = {
      clouds: flying,
      target,
      speed: physicsRef.current.cloudSpeed,
      active: true,
      resolved: false,
    };

    setTargetWord(target);

    // Sofia anuncia en paralelo — el juego no se frena; la musica
    // se agacha mientras habla
    speakDucked(() => sofiaNameWord(target.text));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intro de Sofia — SOLO al arrancar; la primera tanda recien sale
  // cuando termina. Cero pausas nuevas durante el juego.
  useSofiaIntro(gamePhase === "intro", "reglas-leo-vuela", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  // First wave once Pixi is up
  useEffect(() => {
    if (gamePhase === "running" && roundIdx === 0 && roundRef.current.clouds.length === 0) {
      sessionStartRef.current = Date.now();
      recordGameEvent({ type: "game_started", gameId: "leo-vuela", phase, worldId });
      spawnWave();
    }
  }, [gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextWave = useCallback(() => {
    if (cancelledRef.current) return;
    setRoundIdx((prev) => prev + 1); // contador de tandas (anima la pill)
    spawnWave();
  }, [spawnWave]);

  // Sin energia → fin del juego
  const finishGame = useCallback(() => {
    if (cancelledRef.current) return;
    stopVoice();
    musicRef.current?.pause();
    recordGameEvent({
      type: "game_finished",
      gameId: "leo-vuela",
      phase,
      durationMs: Date.now() - sessionStartRef.current,
      correct: state.correctAttempts,
      total: state.totalAttempts,
      levelReached: levelRef.current,
    });
    // Si recuperó al menos una palabra hay algo que "vuelve al libro":
    // un cierre narrativo breve ANTES de avisarle al padre (onComplete)
    // que la partida terminó. Bug real encontrado en QA: antes esto
    // llamaba a onComplete() en el mismo momento que mostraba la
    // narrativa — la pantalla que la usa (demo y /play) desmonta el
    // juego apenas onComplete dispara, así que la narrativa nunca
    // llegaba a verse. Ahora onComplete se pospone hasta que el niño
    // cierra la narrativa (o pasan los ~6s de autodismiss).
    if (state.correctAttempts > 0) {
      setGamePhase("story-outro");
    } else {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
    }
  }, [finish, onComplete, state, phase]);
  onEnergyOutRef.current = finishGame;

  const adjustEnergy = energy.adjust;

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
        rewardCorrect(rect.left + leoXRef.current * scale, rect.top + (leoYRef.current - LEO_CENTER_OFFSET) * scale);
      }
      squashTRef.current = 0; // celebration squash-and-stretch

      // La palabra ya se leyo y se acerto: RECIEN aca puede "hacer algo"
      // en el mundo (vuela hacia el Libro Magico) — nunca antes de elegir
      const emoji = getConsequenceEmoji(target.text);
      wordFxRef.current?.spawn(emoji, { x: fc.box.x, y: fc.box.y }, { x: BOOK_X, y: BOOK_Y });
      bookPulseRef.current = 0;
      caughtEmojisRef.current = [...caughtEmojisRef.current, emoji].slice(-5);
      recordGameEvent({ type: "round_result", gameId: "leo-vuela", phase, wordId: target.id, correct: true });

      adjustEnergy(tuningRef.current.energyGainCorrect);
      if (level.registerCorrect()) musicRef.current?.setLevel(levelRef.current);
      speakDucked(() => sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited"));
      nextWave();
    } else {
      // Tropezon en silencio: solo el tint visual, sin audio — el
      // objetivo sigue visible en la pill de arriba
      recordAttempt(false);
      recordGameEvent({ type: "round_result", gameId: "leo-vuela", phase, wordId: target.id, correct: false });
      adjustEnergy(-tuningRef.current.energyLossWrong);
      crashTRef.current = 0;
      flashFeedback("wrong");
      // Si el objetivo ya no esta (venia detras de la atrapada), pasar
      const targetFc = round.clouds.find((f) => f.word.id === target.id);
      if (!targetFc || targetFc.caught || targetFc.box.x <= -100) {
        round.resolved = true;
        nextWave();
      }
    }
  }, [recordAttempt, rewardCorrect, nextWave, flashFeedback, adjustEnergy, phase]);

  const handleEscape = useCallback(() => {
    const round = roundRef.current;
    if (!round.target) return;
    recordAttempt(false);
    recordGameEvent({ type: "round_result", gameId: "leo-vuela", phase, wordId: round.target.id, correct: false });
    adjustEnergy(-tuningRef.current.energyLossEscape);
    flashFeedback("wrong");
    speakDucked(() => sofiaPlayAudio("reaccion-se-escapo", "¡Se escapó!", "gentle"));
    nextWave();
  }, [recordAttempt, nextWave, flashFeedback, adjustEnergy, phase]);

  onCatchRef.current = handleCatch;
  onEscapeRef.current = handleEscape;

  // ─── Tap anywhere / Espacio / ↑ → Leo flaps up ──────────────────

  const handleFlap = useCallback(() => {
    if (gamePhaseRef.current !== "running" || paused) return;
    // Primer gesto del usuario: momento valido para destrabar el audio
    void musicRef.current?.ensureStarted(levelRef.current);
    vyRef.current = -physicsRef.current.impulse;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
  }, [paused]);

  useGameKeys(gamePhase === "running" && !paused, {
    " ": handleFlap,
    ArrowUp: handleFlap,
  });

  // ←/→ esquivan: keydown/keyup propios para soportar mantener la tecla
  useEffect(() => {
    if (!(gamePhase === "running" && !paused)) {
      moveDirRef.current = 0;
      return;
    }
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); moveDirRef.current = -1; }
      else if (e.key === "ArrowRight") { e.preventDefault(); moveDirRef.current = 1; }
    };
    const onUp = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" && moveDirRef.current === -1) ||
          (e.key === "ArrowRight" && moveDirRef.current === 1)) {
        moveDirRef.current = 0;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      moveDirRef.current = 0;
    };
  }, [gamePhase, paused]);

  const handleMoveDir = useCallback((dir: -1 | 0 | 1) => {
    if (dir !== 0) {
      void musicRef.current?.ensureStarted(levelRef.current);
    }
    moveDirRef.current = gamePhaseRef.current === "running" ? dir : 0;
  }, []);

  const handleReplay = useCallback(() => {
    reset();
    leoYRef.current = GROUND_Y + 4;
    leoXRef.current = LEO_BASE_X;
    moveDirRef.current = 0;
    vyRef.current = 0;
    energy.reset();
    level.reset();
    birdInvulnUntilRef.current = 0;
    obstaclesRef.current?.reset();
    bagRef.current = createWordBag(words);
    caughtEmojisRef.current = [];
    bookPulseRef.current = 1;
    setRoundIdx(0);
    setGamePhase("running");
    musicRef.current?.setLevel(0);
    musicRef.current?.resume();
    sessionStartRef.current = Date.now();
    recordGameEvent({ type: "game_started", gameId: "leo-vuela", phase, worldId });
    spawnWave();
  }, [reset, spawnWave, energy, level, phase, worldId]);

  // Narrativa minima (hipotesis del §6): una rafaga disperso las
  // palabras del Libro Magico y Leo tiene que recuperarlas volando.
  // Datos reales del mundo (worldName), nunca un curriculum inventado.
  const introLines = useMemo(
    () =>
      worldName
        ? ["¡Se escaparon las palabras!", `El viento las dispersó por ${worldName}. ¡Ayudá a Leo a recuperarlas volando!`]
        : ["¡Se escaparon las palabras!", "El viento las dispersó. ¡Ayudá a Leo a recuperarlas volando!"],
    [worldName],
  );
  const outroLines = useMemo(
    () => [
      "¡Las palabras volvieron al Libro Mágico!",
      `Leo recuperó ${state.correctAttempts} ${state.correctAttempts === 1 ? "palabra" : "palabras"}.`,
    ],
    [state.correctAttempts],
  );

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    const reward = rewardForLevel(levelUi, tuning);
    return (
      <GameShell title="Leo Vuela" icon="🪁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Leo Vuela"
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
    <GameShell title="Leo Vuela" icon="🪁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {gamePhase === "story-intro" && (
          <MissionNarrative
            variant="intro"
            icon="📖"
            lines={introLines}
            color={GAME_COLOR}
            onDone={() => {
              markIntroSeen();
              setGamePhase("intro");
            }}
          />
        )}
        {gamePhase === "story-outro" && (
          <MissionNarrative
            variant="outro"
            icon="📖"
            lines={outroLines}
            scatterEmojis={caughtEmojisRef.current}
            color={GAME_COLOR}
            onDone={() => {
              setGamePhase("finished");
              finish().then(() => onComplete?.(state));
            }}
          />
        )}
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} />}
        <ArcadeHud
          color={GAME_COLOR}
          targetPrefix="Volá a:"
          level={levelUi}
          correct={state.correctAttempts}
          targetWord={targetWord}
          waveKey={roundIdx}
          energy={energy.energyUi}
          energyMax={tuning.energyMax}
        />

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
          <MoveButtons color={GAME_COLOR} active={gamePhase === "running"} onDir={handleMoveDir} />
        </div>


        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
