"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Application, Container, Sprite } from "pixi.js";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useGameKeys } from "../hooks/useGameKeys";
import { useArcadeEnergy } from "../hooks/useArcadeEnergy";
import { useArcadeLevel } from "../hooks/useArcadeLevel";
import { useSofiaIntro } from "../hooks/useSofiaIntro";
import { GameShell, usePause } from "./GameShell";
import { ArcadeHud } from "./ArcadeHud";
import { ArcadeIntro } from "./ArcadeIntro";
import { ArcadeMusic } from "./arcade-music";
import { LaneObstacles } from "./arcade-obstacles";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { domanCanvasText } from "../config/doman-canvas";
import { buildLanes, rocksForPhase, runnerTuningForPhase, lanesXForCount } from "../config/leo-runner";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#ed8936";

// Unico punto de cambio del sprite: Leo de espaldas, corriendo hacia
// adentro de la pantalla (procesado por scripts/prepare-leo-sprites.py)
const LEO_SPRITE_URL = "/images/games/leo-corre-sprite.png";

// Logical canvas size — CSS scales it to the container width.
// W es generoso para que aun con 4 carriles las palabras entren
// completas y grandes (la legibilidad es lo primero).
const W = 820;
const H = 420;
const DEFAULT_LANES_X = lanesXForCount(3, W);
const LEO_Y = H - 72;
const SIGN_H = 56;
const LANE_GAP = 16; // separacion entre carteles vecinos (px logicos)
const SIGN_PAD = 16; // margen interno del cartel a cada lado del texto
// Fraccion del ancho usable para carriles (igual que lanesXForCount)
const ROAD_FRAC = 0.76;
const SIGN_SPAWN_Y = -70;
// Travel speed in px/frame at 60fps; los niveles la multiplican
const BASE_SPEED = 1.5;
const FADE_RATE = 0.04; // alpha/frame de la tanda anterior al irse
const DASH = 26, DASH_GAP = 26, DASH_PERIOD = DASH + DASH_GAP;

// Las lineas punteadas van ENTRE carriles (n-1 separadores), asi
// coinciden con la cantidad real de carriles (3 o 4 en Nivel 3).
function separatorXs(lanesX: number[]): number[] {
  const seps: number[] = [];
  for (let i = 0; i < lanesX.length - 1; i++) seps.push((lanesX[i] + lanesX[i + 1]) / 2);
  return seps;
}

// (Re)dibuja las lineas punteadas en las X dadas, envueltas en vertical
// para la ilusion de scroll. Conserva la posicion de scroll del layer.
function rebuildDashes(PIXI: typeof import("pixi.js"), layer: Container, seps: number[]): void {
  layer.removeChildren().forEach((c) => c.destroy());
  for (const bx of seps) {
    for (let y = -DASH_PERIOD; y < H + DASH_PERIOD; y += DASH_PERIOD) {
      const d = new PIXI.Graphics();
      d.roundRect(-3, 0, 6, DASH, 3).fill("#ffffff");
      d.alpha = 0.9;
      d.x = bx;
      d.y = y;
      layer.addChild(d);
    }
  }
}

// Intro de Sofia al arrancar (mp3 edge-tts es-AR-ElenaNeural; este
// texto es el fallback hablado si el audio no carga)
const INTRO_TEXT =
  "¡Soy la Seño Sofía! Leo va a correr por el camino. " +
  "Escuchá la palabra, y tocá el camino donde está escrita para que Leo corra hacia ella. " +
  "¡Vos podés! ¡A correr!";

type Phase = "loading" | "intro" | "running" | "finished";

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
  const [waveIdx, setWaveIdx] = useState(0);
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [laneWords, setLaneWords] = useState<(DomanWord | null)[]>([null, null, null]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const leoRef = useRef<Container | null>(null);
  const leoSpriteRef = useRef<Sprite | null>(null);
  const signsLayerRef = useRef<Container | null>(null);
  const dashLayerRef = useRef<Container | null>(null);
  const obstaclesRef = useRef<LaneObstacles | null>(null);
  const invulnUntilRef = useRef(0); // fin de invulnerabilidad (seg de juego)

  const leoLaneRef = useRef(1);
  const lanesXRef = useRef<number[]>(DEFAULT_LANES_X);
  const dashLaneCountRef = useRef(3); // para redibujar separadores al cambiar de carriles
  const jumpTRef = useRef(1); // 0→1 jump progress; 1 = on the ground
  const crashTRef = useRef(1); // 0→1 stumble progress
  const squashTRef = useRef(1); // 0→1 squash-and-stretch on a correct pass
  const baseScaleRef = useRef(0); // Leo sprite's natural scale
  const elapsedRef = useRef(0);
  const gamePhaseRef = useRef<Phase>("loading");
  const roundRef = useRef<RoundData>({ signs: [], targetLane: 1, target: null, speed: BASE_SPEED, active: false, resolved: false });
  const fadingRef = useRef<Container[]>([]); // carteles viejos desvaneciendose
  const resolveRef = useRef<() => void>(() => {});
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  gamePhaseRef.current = gamePhase;

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const bagRef = useRef<ReturnType<typeof createWordBag> | null>(null);
  if (!bagRef.current) bagRef.current = createWordBag(words);

  const tuning = useMemo(() => runnerTuningForPhase(phase), [phase]);
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;

  const onEnergyOutRef = useRef<() => void>(() => {});
  const energy = useArcadeEnergy(tuning);
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { levelRef } = level;

  // Musica de selva: los 3 loops compartidos; el audio recien se crea
  // tras el primer gesto (ensureStarted)
  const musicRef = useRef<ArcadeMusic | null>(null);
  if (!musicRef.current) {
    musicRef.current = new ArcadeMusic(tuning.musicVolumeDb, tuning.musicDuckDb, tuning.musicTracks);
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
      road.rect(0, 0, 14, H).fill("#a8d5b0");
      road.rect(W - 14, 0, 14, H).fill("#a8d5b0");
      app.stage.addChild(road);

      // Dashed lane separators (entre carriles) — se redibujan si el
      // Nivel 3 agrega un cuarto carril
      const dashLayer = new PIXI.Container();
      rebuildDashes(PIXI, dashLayer, separatorXs(DEFAULT_LANES_X));
      app.stage.addChild(dashLayer);
      dashLayerRef.current = dashLayer;

      // Signs layer (word signs + rocks come down this layer)
      const signsLayer = new PIXI.Container();
      app.stage.addChild(signsLayer);
      signsLayerRef.current = signsLayer;

      // Obstaculos del camino (troncos, pajaros que bajan, lluvia)
      const obstaclesLayer = new PIXI.Container();
      app.stage.addChild(obstaclesLayer);
      obstaclesRef.current = new LaneObstacles(PIXI, obstaclesLayer, { lanesX: DEFAULT_LANES_X, H, leoY: LEO_Y });

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
      const shadow = new PIXI.Graphics();
      shadow.ellipse(0, 0, 34, 9).fill({ color: 0x000000, alpha: 0.15 });
      leo.addChildAt(shadow, 0);
      leo.x = DEFAULT_LANES_X[1];
      leo.y = LEO_Y;
      app.stage.addChild(leo);
      leoRef.current = leo;

      // ─── Game loop — reads refs only, so no stale closures ──────
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;
        elapsedRef.current += dt;
        const round = roundRef.current;
        const tun = tuningRef.current;

        // Nivel por tiempo + drenaje de energia (el flujo nunca para)
        if (round.active && gamePhaseRef.current === "running") {
          level.tick(dt);
          if (energy.drainTick(dt)) {
            round.active = false;
            round.resolved = true;
            onEnergyOutRef.current();
          }
        }
        const levelCfg = tun.levels[levelRef.current] ?? tun.levels[0];
        const effSpeed = round.speed * levelCfg.speedMul;

        // Obstaculos del camino: tocarlos resta energia, con ventana
        // de invulnerabilidad (las piedras de los carteles siguen
        // siendo parte de la decision de lectura, no de esto)
        if (round.active && gamePhaseRef.current === "running" && obstaclesRef.current) {
          const frame = obstaclesRef.current.update(dt, levelCfg, leoLaneRef.current, effSpeed, lanesXRef.current);
          if (frame.hit && level.playSecRef.current >= invulnUntilRef.current) {
            invulnUntilRef.current = level.playSecRef.current + tun.obstacleInvulnSec;
            energy.adjust(-tun.energyLossPerObstacle);
            crashTRef.current = 0; // tropezon visual
          }
        }

        // Scroll the lane dashes to fake forward motion
        if (dashLayerRef.current) {
          dashLayerRef.current.y = (dashLayerRef.current.y + effSpeed * dt * 1.4) % DASH_PERIOD;
        }

        // Leo: lerp toward his lane + running bob + jump arc
        const leoC = leoRef.current;
        if (leoC) {
          const targetX = lanesXRef.current[leoLaneRef.current] ?? lanesXRef.current[0];
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

        // Los carteles bajan SIEMPRE (flujo continuo, sin estacionarse)
        if (round.active || round.resolved) {
          for (const { box } of round.signs) {
            box.y += effSpeed * dt;
          }
        }

        // Tanda anterior: sigue bajando mientras se desvanece
        if (fadingRef.current.length > 0) {
          fadingRef.current = fadingRef.current.filter((box) => {
            box.y += effSpeed * dt;
            box.alpha -= FADE_RATE * dt;
            if (box.alpha <= 0 || box.y > H + 80) {
              box.destroy({ children: true });
              return false;
            }
            return true;
          });
        }

        // Resolver cuando los carteles llegan a Leo
        if (round.active && !round.resolved && round.signs.length > 0) {
          const firstY = round.signs[0].box.y;
          if (firstY >= LEO_Y - 52) {
            round.resolved = true;
            resolveRef.current();
          }
        }
      });

      setGamePhase("intro");
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
        signsLayerRef.current = null;
        dashLayerRef.current = null;
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

  // Feedback flash con limpieza propia (el flujo no se detiene)
  const flashFeedback = useCallback((type: "correct" | "wrong") => {
    setFeedbackType(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      if (!cancelledRef.current) setFeedbackType(null);
    }, 700);
  }, []);

  // ─── Wave setup — continuo: la tanda anterior se desvanece y la
  // nueva entra ya; Sofia anuncia en paralelo, sin frenar nada ──────

  const spawnWave = useCallback(async () => {
    const app = appRef.current;
    const signsLayer = signsLayerRef.current;
    if (!app || !signsLayer || cancelledRef.current) return;

    const PIXI = await import("pixi.js");
    if (cancelledRef.current) return;

    // Carteles restantes de la tanda anterior → a desvanecerse
    for (const { box } of roundRef.current.signs) {
      if (!box.destroyed) fadingRef.current.push(box);
    }

    // Palabras repetibles: objetivo al azar, sin repetir la ultima
    const target = bagRef.current!.next();
    // Piedras por mundo: Mundo 1 deja 1 piedra (2 carteles), 2+ sin piedras
    const laneCount = tuningRef.current.lanesByLevel[levelRef.current] ?? 3;
    lanesXRef.current = lanesXForCount(laneCount, W);
    if (leoLaneRef.current > laneCount - 1) leoLaneRef.current = laneCount - 1;
    // Redibujar los separadores punteados si cambio la cantidad de carriles
    if (laneCount !== dashLaneCountRef.current && dashLayerRef.current) {
      dashLaneCountRef.current = laneCount;
      rebuildDashes(PIXI, dashLayerRef.current, separatorXs(lanesXRef.current));
    }
    const lanes = buildLanes(target, wordsRef.current, rocksForPhase(phase), laneCount, shuffle);
    const targetLane = lanes.findIndex((l) => l.word?.id === target.id);

    // El cartel se dimensiona al carril: ancho = separacion entre
    // carriles menos un gap, asi DOS carteles vecinos nunca se
    // superponen (garantia geometrica, sirve para 3 y 4 carriles).
    const laneSpacing = (W * ROAD_FRAC) / lanes.length;
    const plateW = laneSpacing - LANE_GAP;
    const maxTextW = plateW - SIGN_PAD * 2;

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
          .roundRect(-plateW / 2, -SIGN_H / 2, plateW, SIGN_H, 14)
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
        // La palabra entra COMPLETA dentro del cartel (nunca se corta);
        // si no entra a tamano natural se reduce solo lo justo para
        // caber — y como el cartel ya cabe en el carril, tampoco se
        // encima con el vecino. El ancho generoso de W mantiene el
        // texto grande aun con 4 carriles.
        if (label.width > maxTextW) label.scale.set(maxTextW / label.width);
        box.addChild(label);
      }

      box.x = lanesXRef.current[lane];
      box.y = SIGN_SPAWN_Y;
      signsLayer.addChild(box);
      signs.push({ box, lane });
    });

    roundRef.current = {
      signs,
      targetLane,
      target,
      speed: BASE_SPEED,
      active: true,
      resolved: false,
    };

    setTargetWord(target);
    setWaveIdx((w) => w + 1);
    // Setear el data-word-id de los botones de carril
    setLaneWords(lanes.map((l) => l.word));

    // Sofia anuncia en paralelo — el camino no se frena; la musica
    // se agacha mientras habla
    speakDucked(() => sofiaNameWord(target.text));
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intro de Sofia — SOLO al arrancar; la primera tanda recien sale
  // cuando termina. Cero pausas nuevas durante el juego.
  useSofiaIntro(gamePhase === "intro", "reglas-leo-corre", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  // First wave once Pixi is up
  useEffect(() => {
    if (gamePhase === "running" && roundRef.current.signs.length === 0) {
      spawnWave();
    }
  }, [gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sin energia → fin del juego
  const finishGame = useCallback(() => {
    if (cancelledRef.current) return;
    stopVoice();
    musicRef.current?.pause();
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finish, onComplete, state]);
  onEnergyOutRef.current = finishGame;

  // ─── Resolve (called from the Pixi ticker when signs reach Leo) ──

  const handleResolve = useCallback(() => {
    const round = roundRef.current;
    const target = round.target;
    if (!target) return;

    const correct = leoLaneRef.current === round.targetLane;
    recordAttempt(correct, correct ? target.id : undefined);

    if (correct) {
      // Coin flies from Leo's canvas position to the chest in the header
      const canvas = appRef.current?.canvas;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / W;
        rewardCorrect(rect.left + lanesXRef.current[round.targetLane] * scale, rect.top + LEO_Y * scale);
      }
      jumpTRef.current = 0; // victory hop
      squashTRef.current = 0; // celebration squash-and-stretch
      energy.adjust(tuningRef.current.energyGainCorrect);
      if (level.registerCorrect()) musicRef.current?.setLevel(levelRef.current);
      flashFeedback("correct");
      speakDucked(() => sofiaPlayAudio("reaccion-muy-bien", "¡Muy bien!", "excited"));
    } else {
      // Error mudo: solo el tropezon visual + energia abajo. El
      // objetivo sigue visible en la pill del HUD.
      crashTRef.current = 0;
      energy.adjust(-tuningRef.current.energyLossWrong);
      flashFeedback("wrong");
    }

    // Siguiente tanda al toque — flujo continuo
    spawnWave();
  }, [recordAttempt, rewardCorrect, energy, flashFeedback, spawnWave]);

  resolveRef.current = handleResolve;

  // ─── Lane taps — Leo jumps to the tapped lane ────────────────────

  const handleLaneTap = useCallback((lane: number) => {
    if (gamePhase !== "running") return;
    // Primer gesto del usuario: momento valido para destrabar el audio
    void musicRef.current?.ensureStarted(levelRef.current);
    if (lane !== leoLaneRef.current) {
      leoLaneRef.current = lane;
      jumpTRef.current = 0;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(15);
    }
  }, [gamePhase]);

  // Keyboard: ↑/↓ (y ←/→ como alias — los carriles son columnas)
  // mueven a Leo un carril; el toque en los carriles queda igual
  const moveLane = useCallback((delta: -1 | 1) => {
    handleLaneTap(Math.min(lanesXRef.current.length - 1, Math.max(0, leoLaneRef.current + delta)));
  }, [handleLaneTap]);

  useGameKeys(gamePhase === "running" && !paused, {
    ArrowUp: () => moveLane(-1),
    ArrowLeft: () => moveLane(-1),
    ArrowDown: () => moveLane(1),
    ArrowRight: () => moveLane(1),
  });

  // Demo mode: cada tanda, mueve a Leo al carril correcto mientras los
  // carteles estan lejos (keyed en waveIdx para re-armarse en cada
  // tanda del flujo continuo, no solo en la primera)
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !targetWord) return;
    const t = setTimeout(() => {
      const btn = document.querySelector(`[data-word-id="${roundRef.current.target?.id}"]`) as HTMLElement;
      if (btn) btn.click();
    }, 1200);
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, targetWord]);

  const handleReplay = useCallback(() => {
    reset();
    energy.reset();
    level.reset();
    leoLaneRef.current = 1;
    bagRef.current = createWordBag(words);
    invulnUntilRef.current = 0;
    obstaclesRef.current?.reset();
    setGamePhase("running");
    musicRef.current?.setLevel(0);
    musicRef.current?.resume();
    spawnWave();
  }, [reset, energy, level, spawnWave]);

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    const reward = rewardForLevel(level.levelUi, tuning);
    return (
      <GameShell title="Leo Corre" icon="🦁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Leo Corre"
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
    <GameShell title="Leo Corre" icon="🦁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} />}
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

        {/* Pixi canvas + invisible lane tap zones */}
        <div style={{ position: "relative", width: "100%", maxWidth: "min(760px, calc(100vw - 32px))", borderRadius: radii.xl, overflow: "hidden", border: `2px solid ${colors.border.light}` }}>
          {/* React must never render children inside hostRef — Pixi
              appends its canvas there manually */}
          <div ref={hostRef} style={{ width: "100%", aspectRatio: `${W} / ${H}` }} />
          {gamePhase === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fontSizes.md, color: colors.text.muted, fontFamily: fonts.display }}>
              Cargando a Leo... 🦁
            </div>
          )}
          {laneWords.map((_, lane) => (
            <button
              key={lane}
              data-lane={lane}
              data-word-id={laneWords[lane]?.id ?? ""}
              aria-label={`Carril ${lane + 1}${laneWords[lane] ? `: ${laneWords[lane]!.text}` : ""}`}
              onClick={() => handleLaneTap(lane)}
              style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${(lane * 100) / laneWords.length}%`, width: `${100 / laneWords.length}%`,
                background: "transparent", border: "none", padding: 0,
                cursor: gamePhase === "running" ? "pointer" : "default",
              }}
            />
          ))}
        </div>

        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, textAlign: "center" }}>
          {gamePhase === "intro" ? "Escucha a Sofía..." : "Toca el camino con la palabra correcta"}
        </p>

        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
