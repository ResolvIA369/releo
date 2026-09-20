"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Application, Container, Sprite } from "pixi.js";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useGameKeys } from "../hooks/useGameKeys";
import { useArcadeEnergy } from "../hooks/useArcadeEnergy";
import { useArcadeLevel } from "../hooks/useArcadeLevel";
import { usePreGameIntro } from "../hooks/usePreGameIntro";
import { GameShell, IMMERSIVE_HEADER_H } from "./GameShell";
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
import { demoHesitateMove, demoJitter } from "../hooks/useDemoAutoplay";

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

// Animacion de zancada: 2 poses reales de Leo corriendo (de espaldas,
// mismo angulo y escala que el sprite estatico de arriba — verificado
// sep-2026 antes de integrar: transparencia real, mismo plano de
// camara, mismo tamano de cabeza/torso) cruzadas por alpha, mismo
// tratamiento que leo-vuela-frame-a/b.png (ver LeoVuela.tsx). Ciclo mas
// rapido que el de vuelo porque una zancada corriendo es mas rapida que
// un aleteo.
const LEO_FRAME_A_URL = "/images/games/leo-corre-frame-a.png";
const LEO_FRAME_B_URL = "/images/games/leo-corre-frame-b.png";
const LEO_RUN_CYCLE_MS = 440;
const LEO_RUN_CYCLE_FRAMES = (LEO_RUN_CYCLE_MS / 1000) * 60;

// Orden de dibujo explicito (mismo patron ARCADE_Z de arcade-sky.ts,
// aplicado aca preventivamente — auditoría de grabación sep-2026,
// docs/RELEO-AUDITORIA-GRABACION.md categoría B3). Hoy el orden de
// addChild() ya resulta correcto porque la carga async del sprite de
// Leo siempre termina antes del addChild(leo) sincronico que le sigue,
// pero no hay ninguna garantia estructural de eso — con
// sortableChildren=true, el zIndex manda siempre, sin importar cuando
// se agrego cada capa.
export const LEO_RUNNER_Z = {
  road: 0,
  dashes: 1,
  signs: 2,
  obstacles: 3,
  leo: 4,
} as const;

// Logical canvas size — CSS scales it to the container width.
// W es generoso para que aun con 4 carriles las palabras entren
// completas y grandes (la legibilidad es lo primero). El alto YA NO es
// fijo (B3, QA sep-2026, "el canvas no llega hasta abajo"): un aspect
// 820:420 (~1.95:1) nunca puede llenar tanto un desktop panoramico como
// un mobile en vertical al mismo tiempo — la cuenta real, medida en los
// tres viewports pedidos, da franjas de 128 a 644px sin usar. H_DEFAULT
// es solo el punto de partida (fallback antes de medir, y la base contra
// la que se escala la velocidad — ver dynBaseSpeed en el init de Pixi)
// — el alto real se mide del contenedor ya montado y se guarda en
// dimsRef, para que quede accesible fuera del effect de init (spawnWave,
// handleResolve).
const W = 820;
const H_DEFAULT = 420;
const DEFAULT_LANES_X = lanesXForCount(3, W);
const SIGN_H = 56;
const LANE_GAP = 16; // separacion entre carteles vecinos (px logicos)
const SIGN_PAD = 16; // margen interno del cartel a cada lado del texto
// Alto del sprite de Leo en el mismo espacio logico (ver baseScaleRef en
// el init de Pixi: se escala siempre a 96px fijo, cualquiera sea el
// tamano de la imagen fuente).
const LEO_SPRITE_H = 96;
// Los carteles tienen que resolver ANTES de que su mitad inferior entre
// en la banda que ocupa el sprite de Leo (LEO_Y hacia arriba
// LEO_SPRITE_H) — si no, Leo (zIndex mas alto que los carteles, ver
// LEO_RUNNER_Z) lo tapa visualmente en los ultimos instantes de lectura
// antes de resolver ("se lee solo la ultima letra", QA sep-2026). Antes
// esto era 52 a secas, bastante menor que LEO_SPRITE_H (96): el cartel
// ya estaba resolviendo con su mitad inferior 44px DENTRO del sprite.
const SIGN_RESOLVE_OFFSET = LEO_SPRITE_H + SIGN_H / 2 + 10; // 134, +10 de aire
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
function rebuildDashes(PIXI: typeof import("pixi.js"), layer: Container, seps: number[], H: number): void {
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
  // B4 (QA sep-2026): usePause() del Context vivia en GameShell, que ESTE
  // componente renderiza como hijo — el Provider quedaba abajo del punto
  // donde se leia el hook, asi que paused era siempre false. Ahora
  // GameShell avisa por callback y el estado vive aca.
  const [paused, setPaused] = useState(false);

  const [gamePhase, setGamePhase] = useState<Phase>("loading");
  const [waveIdx, setWaveIdx] = useState(0);
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [laneWords, setLaneWords] = useState<(DomanWord | null)[]>([null, null, null]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const leoRef = useRef<Container | null>(null);
  const leoSpriteRef = useRef<Sprite | null>(null);
  const leoSpriteBRef = useRef<Sprite | null>(null);
  const signsLayerRef = useRef<Container | null>(null);
  const dashLayerRef = useRef<Container | null>(null);
  const obstaclesRef = useRef<LaneObstacles | null>(null);
  const invulnUntilRef = useRef(0); // fin de invulnerabilidad (seg de juego)
  // B3: alto logico real (medido del contenedor, ya no fijo en 420) +
  // valores derivados, compartidos con spawnWave/handleResolve que viven
  // fuera del effect de init de Pixi.
  const dimsRef = useRef({ H: H_DEFAULT, leoY: H_DEFAULT - 72, baseSpeed: BASE_SPEED });
  // Banda logica (0..H) donde un cartel todavia no es seguro mostrar: el
  // cartel de objetivo (ArcadeHud overlay) flota ENCIMA del canvas con un
  // top fijo en px reales (IMMERSIVE_HEADER_H + spacing.sm, para despejar
  // el header) — como el canvas se reescala por CSS a lo que mida el
  // viewport, esos mismos px reales representan una fraccion muy distinta
  // del canvas logico segun el tamano real (chica en desktop ancho, mas de
  // un tercio del alto en mobile portrait compacto, QA sep-2026: "Tocá:
  // banana" tapaba el cartel "pez" recien spawneado a 1920x1080). Se mide
  // el alto real del canvas una vez montado y se convierte esa banda a
  // unidades logicas — no hay forma de fijar un numero logico unico que
  // sirva para todos los viewports, porque el desfasaje viene de mezclar
  // px reales (header) con unidades logicas (canvas).
  const signSafeTopRef = useRef(0);

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

      // B3 (QA sep-2026, "el canvas no llega hasta abajo"): el wrapper ya
      // no fuerza un aspect ratio fijo (ver JSX mas abajo) — ocupa el 100%
      // real disponible, a lo ancho Y a lo alto. Se mide ese rectangulo
      // real ya montado y se elige un alto logico que reproduzca la MISMA
      // proporcion (W fijo en 820, H se despeja) — asi el canvas escala
      // parejo en los dos ejes (canvas.style.width/height en 100% mas
      // abajo) sin estirar ni recortar nada, y el resto del archivo (Leo,
      // carteles, obstaculos) sigue trabajando en unidades logicas que
      // representan honestamente el alto real de cada viewport.
      const rect = hostRef.current.getBoundingClientRect();
      const measuredAspect = rect.width > 0 && rect.height > 0 ? rect.height / rect.width : H_DEFAULT / W;
      const dynH = Math.round(Math.min(2200, Math.max(320, W * measuredAspect)));
      const dynLeoY = dynH - 72;
      // La distancia de spawn a resolucion (~H menos las bandas fijas de
      // arriba/abajo) crece con H — sin escalar la velocidad, un canvas
      // 4x mas alto (mobile vertical) tardaria ~4x mas en cruzar, un
      // cambio de ritmo de juego mayor entre viewports. Se escala
      // proporcional a H/H_DEFAULT para que el tiempo real de cruce (en
      // segundos) se mantenga aproximadamente igual en los tres viewports.
      const dynBaseSpeed = BASE_SPEED * (dynH / H_DEFAULT);
      dimsRef.current = { H: dynH, leoY: dynLeoY, baseSpeed: dynBaseSpeed };

      // El canvas se muestra bastante mas grande que su resolucion logica
      // (820x420) — sin resolution > 1 en pantallas de alta densidad, Pixi
      // renderiza a esa resolucion baja y el navegador estira el bitmap por
      // CSS: ademas de verse borroso, las lineas finas (separadores
      // punteados, bordes de Graphics superpuestos) pueden mostrar un
      // artefacto de escalado — costura o linea oscura — donde dos formas
      // antialiaseadas no coinciden pixel a pixel al ampliarse. Mismo
      // patron que ya tiene LeoVuela.tsx (tope en 2 por costo de GPU).
      // QA sep-2026 (reporte: linea vertical negra en el canvas).
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      await app.init({ width: W, height: dynH, background: "#dcefe2", antialias: true, resolution: dpr });
      if (disposed || !hostRef.current) {
        app.destroy(true, { children: true });
        return;
      }
      appRef.current = app;
      // width Y height en 100% (no "auto"): dynH ya replica la proporcion
      // real del wrapper, asi que llenarlo en los dos ejes no distorsiona
      // nada — y es lo que efectivamente hace que el canvas llegue hasta
      // el borde inferior real en vez de derivar el alto del ancho.
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";
      app.canvas.style.borderRadius = "16px";
      hostRef.current.appendChild(app.canvas);

      // BUG B1, segunda vuelta (QA sep-2026, "el canvas se renderiza vacio"
      // otra vez tras el primer fix): el primer intento acoto la banda
      // escondida a lo sumo a 1/3 del recorrido — matematicamente sano,
      // pero en la practica hizo que los carteles se volvieran visibles
      // MUY temprano (cerca de SIGN_SPAWN_Y) en canvas mobile compactos,
      // es decir, literalmente DEBAJO de la barra flotante del header
      // (pausa/titulo/cofre, 60px reales + 8 de aire): capturas de
      // produccion muestran "larg" y "neg" (largo/negro) cortados contra
      // el boton de pausa y el cofre — el cartel SI se dibuja, pero queda
      // ilegible, superpuesto con controles reales. Confirmado midiendo
      // en vivo contra produccion (390x844): el punto donde se volvia
      // visible caia varios px POR ENCIMA del borde inferior del header.
      //
      // La cuenta real: en un canvas mobile de ~190px reales de alto, el
      // header (68px reales = ~150 unidades logicas) + el cartel de
      // objetivo (pill "Tocá: X", otros ~72 logicas) suman MAS que todo
      // el recorrido disponible entre spawn y resolucion (284 logicas) —
      // no hay forma de esquivar AMBOS y encima dejar una ventana de
      // lectura real. Algo tiene que ceder. El header tiene controles
      // funcionales (pausa) — superponerse ahi se lee como bug. El pill
      // de objetivo, en cambio, ya esta documentado en ArcadeHud.tsx como
      // solape aceptable a proposito ("es DOM con zIndex por encima del
      // canvas... solo importa la banda para que no se vean pegados"), y
      // dcb09e0 ya acepto explicitamente un "solape breve" con el ahi
      // mismo para mobile. Se pide clearance SOLO para el header, no para
      // el pill — eso alcanza para que el cartel jamas aparezca detras de
      // un boton real, y de paso deja una ventana de lectura mucho mas
      // grande en los tres viewports. PERO en el canvas mobile mas chico
      // (390x844, ~190px reales de alto) despejar el header COMPLETO deja
      // solo ~0.7s de ventana visible antes de resolver (22% de la ronda,
      // medido con video) — tecnicamente sin overlap, pero tan poco tiempo
      // que en la practica sigue siendo casi tan invisible como antes del
      // fix (el disparo de Sofia nombrando la palabra es simultaneo al
      // spawn — ver speakDucked mas abajo — así que el momento en que el
      // chico mira la pantalla coincide justo con la parte SIN cartel).
      // Piso adicional: garantizar un minimo de tiempo de lectura en
      // SEGUNDOS (no en fraccion de banda), aunque eso implique ceder un
      // poco del despeje del header en el peor caso — un cartel que asoma
      // ~12px bajo el borde del header durante un instante se lee bastante
      // mejor que un cartel que casi nunca esta.
      const wrapperH = hostRef.current.getBoundingClientRect().height || dynH;
      const unsafeTopPx = IMMERSIVE_HEADER_H + spacing.sm;
      const rawSafeTop = (unsafeTopPx / wrapperH) * dynH;
      const resolveAtY = dynLeoY - SIGN_RESOLVE_OFFSET;
      const MIN_VISIBLE_SECONDS = 1.0;
      const minVisibleLogical = dynBaseSpeed * 60 * MIN_VISIBLE_SECONDS;
      signSafeTopRef.current = Math.min(dynH * 0.45, rawSafeTop, resolveAtY - minVisibleLogical);

      // ARCADE_Z (ver LEO_RUNNER_Z arriba): el zIndex manda, no el orden
      // de addChild().
      app.stage.sortableChildren = true;

      // Road background: 3 lanes separated by scrolling dashed lines
      const road = new PIXI.Graphics();
      road.rect(0, 0, W, dynH).fill("#dcefe2");
      road.rect(0, 0, 14, dynH).fill("#a8d5b0");
      road.rect(W - 14, 0, 14, dynH).fill("#a8d5b0");
      road.zIndex = LEO_RUNNER_Z.road;
      app.stage.addChild(road);

      // Dashed lane separators (entre carriles) — se redibujan si el
      // Nivel 3 agrega un cuarto carril
      const dashLayer = new PIXI.Container();
      dashLayer.zIndex = LEO_RUNNER_Z.dashes;
      rebuildDashes(PIXI, dashLayer, separatorXs(DEFAULT_LANES_X), dynH);
      app.stage.addChild(dashLayer);
      dashLayerRef.current = dashLayer;

      // Signs layer (word signs + rocks come down this layer)
      const signsLayer = new PIXI.Container();
      signsLayer.zIndex = LEO_RUNNER_Z.signs;
      app.stage.addChild(signsLayer);
      signsLayerRef.current = signsLayer;

      // Obstaculos del camino (troncos, pajaros que bajan, lluvia)
      const obstaclesLayer = new PIXI.Container();
      obstaclesLayer.zIndex = LEO_RUNNER_Z.obstacles;
      app.stage.addChild(obstaclesLayer);
      obstaclesRef.current = new LaneObstacles(PIXI, obstaclesLayer, { lanesX: DEFAULT_LANES_X, H: dynH, leoY: dynLeoY });

      // Leo — 2 poses (A/B) cruzadas por alpha; si alguna de las 2 no
      // carga cae al sprite estatico anterior, y si ese tampoco carga
      // al emoji de siempre (mismo patron de 3 niveles que LeoVuela.tsx).
      const leo = new PIXI.Container();
      leo.zIndex = LEO_RUNNER_Z.leo;
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
          sprite.anchor.set(0.5, 1);
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
      }
      const shadow = new PIXI.Graphics();
      shadow.ellipse(0, 0, 34, 9).fill({ color: 0x000000, alpha: 0.15 });
      leo.addChildAt(shadow, 0);
      leo.x = DEFAULT_LANES_X[1];
      leo.y = dynLeoY;
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
          leoC.y = dynLeoY + offsetY;

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

          // Pose B espeja tint/escala de la pose A frame a frame (mismo
          // lienzo y anclaje) y solo se distingue por el alpha: cruce
          // suave A→B→A por coseno, mismo tratamiento que LeoVuela.tsx.
          // Se congela durante el tropezon (crashT<1) para no competir
          // con ese flash.
          if (leoSpriteRef.current && leoSpriteBRef.current) {
            leoSpriteBRef.current.tint = leoSpriteRef.current.tint;
            leoSpriteBRef.current.scale.copyFrom(leoSpriteRef.current.scale);
            if (crashTRef.current >= 1) {
              const cyclePos = (elapsedRef.current % LEO_RUN_CYCLE_FRAMES) / LEO_RUN_CYCLE_FRAMES;
              const alphaA = (Math.cos(cyclePos * Math.PI * 2) + 1) / 2;
              leoSpriteRef.current.alpha = alphaA;
              leoSpriteBRef.current.alpha = 1 - alphaA;
            }
          }
        }

        // Los carteles bajan SIEMPRE (flujo continuo, sin estacionarse).
        // Mientras esten por encima de signSafeTopRef quedan invisibles:
        // esa banda es donde vive el cartel de objetivo (ver comentario en
        // signSafeTopRef arriba) — igual que ya pasaba con SIGN_SPAWN_Y
        // (-70, fuera del canvas), esto solo corre hacia abajo el punto en
        // el que un cartel se vuelve visible, no cambia velocidad ni logica
        // de resolucion.
        if (round.active || round.resolved) {
          for (const { box } of round.signs) {
            box.y += effSpeed * dt;
            box.visible = box.y >= signSafeTopRef.current;
          }
        }

        // Tanda anterior: sigue bajando mientras se desvanece
        if (fadingRef.current.length > 0) {
          fadingRef.current = fadingRef.current.filter((box) => {
            box.y += effSpeed * dt;
            box.alpha -= FADE_RATE * dt;
            if (box.alpha <= 0 || box.y > dynH + 80) {
              box.destroy({ children: true });
              return false;
            }
            return true;
          });
        }

        // Resolver cuando los carteles llegan a Leo
        if (round.active && !round.resolved && round.signs.length > 0) {
          const firstY = round.signs[0].box.y;
          if (firstY >= dynLeoY - SIGN_RESOLVE_OFFSET) {
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
        leoSpriteBRef.current = null;
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
      rebuildDashes(PIXI, dashLayerRef.current, separatorXs(lanesXRef.current), dimsRef.current.H);
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
      speed: dimsRef.current.baseSpeed,
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
  const { skip: skipIntro } = usePreGameIntro({
    active: gamePhase === "intro",
    gameId: "leo-runner",
    isDemo,
    rulesMp3: "reglas-leo-corre",
    rulesText: INTRO_TEXT,
    onDone: () => { if (!cancelledRef.current) setGamePhase("running"); },
  });

  // First wave once Pixi is up
  useEffect(() => {
    if (gamePhase === "running" && roundRef.current.signs.length === 0) {
      spawnWave();
      // B6: en demo/grabacion el juego se toca solo — el toque simulado
      // via .click() desde JS no cuenta como gesto real para el browser
      // (ver arcade-music.ts), asi que esperar a ese "primer toque"
      // nunca destraba nada. En demo arranca directo al empezar.
      if (isDemo) void musicRef.current?.ensureStarted(levelRef.current);
    }
  }, [gamePhase, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

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
        rewardCorrect(rect.left + lanesXRef.current[round.targetLane] * scale, rect.top + dimsRef.current.leoY * scale);
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

  // Demo mode: cada tanda, DUDA MOVIENDO A LEO — se desplaza hacia un
  // carril incorrecto, se frena, y recien ahi corrige hacia el correcto
  // (QA sep-2026: el resaltado CSS anterior no se notaba en video; el
  // movimiento si). handleLaneTap ya es exactamente "mover a Leo a este
  // carril", asi que la "duda" reutiliza la misma accion real dos veces
  // en vez de simular nada aparte. La resolucion se decide por la
  // posicion de Leo cuando el cartel LLEGA (no por el toque en si), asi
  // que corregir a tiempo antes de que el cartel resuelva es lo unico
  // que importa — Leo nunca "falla" la lectura por dudar.
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !targetWord) return;
    const t = setTimeout(() => {
      const targetId = roundRef.current.target?.id;
      if (!targetId) return;
      const targetLane = laneWords.findIndex((w) => w?.id === targetId);
      if (targetLane === -1) return;
      const wrongLanes = laneWords
        .map((_, i) => i)
        .filter((i) => i !== targetLane && laneWords[i] !== null);
      demoHesitateMove(
        wrongLanes.length > 0,
        () => handleLaneTap(wrongLanes[Math.floor(Math.random() * wrongLanes.length)]),
        () => handleLaneTap(targetLane),
      );
    }, demoJitter(1200));
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, targetWord, laneWords, handleLaneTap]);

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
    <GameShell title="Leo Corre" icon="🦁" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})} contentAlign="top" immersive onPauseChange={setPaused}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md,
        paddingTop: spacing.xs, height: "100%", minHeight: 0, boxSizing: "border-box",
      }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} onSkip={skipIntro} />}

        {/* Pixi canvas + invisible lane tap zones. B3 (QA sep-2026, "el
            canvas no llega hasta abajo"): antes el wrapper forzaba el
            aspect ratio logico 820:420 tambien en CSS (aspectRatio +
            min(96vw, calc(100dvh*aspect))) — eso garantiza que nunca
            desborda, pero tambien que casi nunca LLENA: a los tres
            viewports pedidos sobraba entre 128 y 644px de fondo blanco
            abajo. Ahora el wrapper ocupa el 100% real disponible (flex:1
            dentro de una columna ya alta al 100%, ver el effect de init
            mas abajo) y es el ALTO LOGICO de Pixi el que se adapta a ese
            rectangulo real, no al reves. */}
        <div style={{
          position: "relative", flex: 1, minHeight: 0, width: "100%",
          borderRadius: radii.xl, overflow: "hidden", border: `2px solid ${colors.border.light}`,
          containerType: "size",
        }}>
          {/* React must never render children inside hostRef — Pixi
              appends its canvas there manually */}
          <div ref={hostRef} style={{ width: "100%", height: "100%" }} />
          {gamePhase === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fontSizes.md, color: colors.text.muted, fontFamily: fonts.display }}>
              Cargando a Leo... 🦁
            </div>
          )}
          <ArcadeHud
            overlay
            color={GAME_COLOR}
            targetPrefix="Tocá:"
            level={level.levelUi}
            correct={state.correctAttempts}
            targetWord={targetWord}
            waveKey={waveIdx}
            energy={energy.energyUi}
            energyMax={tuning.energyMax}
          />
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


        <FeedbackFlash type={feedbackType} />
      </div>
    </GameShell>
  );
};
