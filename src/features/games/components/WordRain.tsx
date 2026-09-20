"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";
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
import { RainAndThunder } from "./GameAmbience";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, fontSizes, fonts, radii, shadows } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { fitWordFontSize } from "@/shared/utils/fitText";
import { wordRainTuningForPhase } from "../config/word-rain";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";
import { demoReadingPause, demoDecisionWindowMs, getDemoSpeedMul } from "../hooks/useDemoAutoplay";
import { useDemoCursor } from "../hooks/useDemoCursor";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#4299e1";
const LANES = 3;

const INTRO_TEXT =
  "¡Soy la Seño Sofía! Del cielo caen palabras. " +
  "Escuchá cuál te pido, y tocala antes de que llegue al suelo. " +
  "¡Vos podés! ¡A atrapar!";

interface Drop {
  word: DomanWord;
  lane: number;
  delay: number;
  key: number;
}

type Phase = "intro" | "running" | "finished";

// Freeze real de la pausa (QA sep-2026): `animate={paused ? {} : {...}}` en un
// motion.button NO detiene una caida ya en curso — Framer Motion no vuelve a
// mirar el target de una animacion de un solo tramo (sin repeat) una vez
// arrancada, asi que sacarle la clave del objeto `animate` no la cancela
// (confirmado en vivo: la gota seguia cayendo con el juego "pausado"). La
// pausa real de Tren de Palabras si funciona porque mueve el tren por estado
// de React en cada frame, no por una animacion declarativa de Framer Motion.
// Aca se pasa a `animate()` imperativo (no el prop declarativo del
// componente): devuelve controles con `.pause()`/`.play()` que son la pausa
// NATIVA de la Web Animations API — incluyendo el delay inicial de cada
// gota, que tambien queda congelado (antes ni siquiera eso se pausaba).
function FallingWord({
  drop, paused, fallSeconds, areaHeight, leftPct, onLand, onClick,
}: {
  drop: Drop; paused: boolean; fallSeconds: number; areaHeight: number;
  leftPct: number; onLand: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const y = useMotionValue(-80);
  const opacity = useMotionValue(0);
  const yControls = useRef<ReturnType<typeof animate> | null>(null);
  const opacityControls = useRef<ReturnType<typeof animate> | null>(null);
  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;

  // Efecto de montaje/desmontaje separado del de pausa a proposito: en dev,
  // StrictMode monta -> desmonta simulado -> vuelve a montar. Si el stop()
  // de abajo corriera en el mismo efecto que crea la animacion (guardado
  // detras de "if (!yControls.current)"), el desmontaje simulado la mataba
  // con .stop() (that termina la animacion, no se puede reanudar con
  // .play()) pero el ref seguia apuntando a esos controles muertos — el
  // remontaje de StrictMode nunca volvia a crearla y la gota quedaba
  // clavada en el frame inicial. Poniendo a null ambos refs en el cleanup,
  // un remontaje (real o simulado) siempre crea controles nuevos.
  useEffect(() => {
    opacityControls.current = animate(opacity, 1, { duration: 0.5, delay: drop.delay, ease: "easeOut" });
    yControls.current = animate(y, areaHeight, {
      duration: fallSeconds, delay: drop.delay, ease: "linear",
      onComplete: () => onLandRef.current(),
    });
    return () => {
      yControls.current?.stop();
      opacityControls.current?.stop();
      yControls.current = null;
      opacityControls.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallSeconds/areaHeight/drop fijos por instancia (key=drop.key remonta el componente si cambian)
  }, []);

  useEffect(() => {
    if (!yControls.current) return;
    if (paused) { yControls.current.pause(); opacityControls.current?.pause(); }
    else { yControls.current.play(); opacityControls.current?.play(); }
  }, [paused]);

  return (
    <motion.button
      style={{
        y, opacity,
        position: "absolute", left: `${leftPct}%`, transform: "translateX(-50%)",
        padding: `${spacing.md}px ${spacing.lg}px`,
        backgroundColor: "rgba(255,255,255,0.98)",
        borderRadius: radii.xl, border: `3px solid ${GAME_COLOR}40`,
        boxShadow: shadows.md, cursor: "pointer",
        fontSize: fitWordFontSize(drop.word.text, fontSizes.xl),
        fontWeight: "bold", fontFamily: fonts.display, color: "#2d3748",
        whiteSpace: "nowrap", zIndex: 10, minWidth: 80, textAlign: "center",
        willChange: "transform", backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
      }}
      data-word-id={drop.word.id} onClick={onClick}
    >
      {drop.word.text}
    </motion.button>
  );
}

export const WordRain: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-rain", { phase });
  // B4 (QA sep-2026): usePause() leia un Context creado DENTRO de
  // GameShell, que este componente renderiza como hijo — el Provider
  // quedaba abajo del punto donde se leia el hook, asi que paused era
  // siempre false. GameShell ahora avisa por callback.
  const [paused, setPaused] = useState(false);
  const { rewardCorrect } = useRewards();
  const { Cursor, hesitateAndClick, showIdle } = useDemoCursor(isDemo);

  const tuning = wordRainTuningForPhase(phase);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [target, setTarget] = useState<DomanWord | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [fallSeconds, setFallSeconds] = useState(tuning.levels[0].fallSeconds);
  const [waveIdx, setWaveIdx] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [caughtId, setCaughtId] = useState<string | null>(null);
  // El area inmersiva ocupa el alto disponible en vez de un h:450 fijo —
  // la caida de las gotas (animate y) necesita el alto REAL medido, no un
  // numero hardcodeado (ver mas abajo, "fallDistance").
  const [areaHeight, setAreaHeight] = useState(450);
  const areaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setAreaHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gamePhaseRef = useRef<Phase>("intro");
  gamePhaseRef.current = gamePhase;
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const bagRef = useRef<ReturnType<typeof createWordBag> | null>(null);
  if (!bagRef.current) bagRef.current = createWordBag(words);
  const targetRef = useRef<DomanWord | null>(null);
  const resolvedRef = useRef(false);
  const keyCounter = useRef(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const energy = useArcadeEnergy(tuning);
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { levelRef } = level;

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

  // ─── Wave: nuevas palabras caen ─────────────────────────────────

  const spawnWave = useCallback(() => {
    if (cancelledRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    const t = bagRef.current!.next();
    targetRef.current = t;
    const distractors = shuffle(wordsRef.current.filter((w) => w.id !== t.id)).slice(0, LANES - 1);
    const all = shuffle([t, ...distractors]);
    const lanes = shuffle(Array.from({ length: LANES }, (_, i) => i));
    // En demo, la caida tiene que durar al menos lo que puede tardar el
    // cursor en decidir (lectura + duda), o la palabra se escapa antes de
    // que el demo llegue a tocarla — QA sep-2026: a "2x" se perdia la
    // mitad de las rondas. Nunca se ACORTA la caida real, solo se alarga
    // si hace falta margen (Math.max), y solo en modo demo.
    //
    // El PROPIO ritmo visual de la caida tambien tiene que responder al
    // selector, no solo el piso de seguridad de arriba (QA sep-2026,
    // segunda vuelta: a 1.5x el margen ya alcanzaba para no perder la
    // palabra, pero en los niveles faciles fallSeconds*1 no se tocaba —
    // el video se veia igual de rapido que a 1x, "las palabras pasan un
    // poco rapido todavia"). getDemoSpeedMul() clampeado a >=1 (nunca
    // acelera por debajo del ritmo normal, igual criterio que
    // hesitationMul en useDemoAutoplay.ts).
    const demoSpeedFactor = isDemo ? Math.max(1, getDemoSpeedMul()) : 1;
    const minFallSeconds = isDemo ? demoDecisionWindowMs() / 1000 + 0.5 : 0;
    setFallSeconds(Math.max(lvl.fallSeconds * demoSpeedFactor, minFallSeconds));
    setTarget(t);
    setCaughtId(null);
    setBurstPos(null);
    resolvedRef.current = false;
    setDrops(all.map((w, i) => ({ word: w, lane: lanes[i], delay: i * 0.7, key: keyCounter.current++ })));
    setWaveIdx((w) => w + 1);
    speakDucked(() => sofiaNameWord(t.text));
  }, [tuning, levelRef, speakDucked, isDemo]);

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

  // Intro de Sofia — solo al arrancar
  const { skip: skipIntro } = usePreGameIntro({
    active: gamePhase === "intro",
    gameId: "word-rain",
    isDemo,
    rulesMp3: "intro-lluvia",
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

  // Clock: solo drena energia + sube nivel (la caida la anima framer)
  useArcadeClock(gamePhase === "running" && !paused, (dt) => {
    level.tick(dt);
    if (energy.drainTick(dt)) finishRef.current();
  });

  useEffect(() => {
    if (paused) { stopVoice(); musicRef.current?.pause(); }
    else if (gamePhaseRef.current === "running") musicRef.current?.resume();
  }, [paused]);

  // ─── Tap ────────────────────────────────────────────────────────
  const handleTap = useCallback((drop: Drop, e: React.MouseEvent) => {
    if (gamePhaseRef.current !== "running" || resolvedRef.current) return;
    void musicRef.current?.ensureStarted(levelRef.current);
    const correct = drop.word.id === targetRef.current?.id;
    recordAttempt(correct, correct ? targetRef.current?.id : undefined);

    if (correct) {
      setCaughtId(drop.word.id);
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
      // Error mudo: solo flash + energia abajo; el target sigue cayendo
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
    }
  }, [energy, tuning, recordAttempt, rewardCorrect, speakDucked, spawnWave, flashFeedback, levelRef]);

  // Una palabra termino de caer
  const onDropLand = useCallback((isTarget: boolean) => {
    if (isTarget && !resolvedRef.current && gamePhaseRef.current === "running") {
      recordAttempt(false);
      energy.adjust(-tuning.energyLossEscape);
      flashFeedback("wrong");
      resolveRef.current(250);
    }
  }, [energy, tuning, recordAttempt, flashFeedback]);

  // Demo: cada tanda, duda entre las palabras que ya estan cayendo y toca la
  // correcta. El (targetDrop?.delay ?? 0) * 1000 es fisico (cuando aparece
  // esa gota) y no lleva jitter; el tiempo de lectura despues de eso si
  // (demoReadingPause, no demoJitter — QA sep-2026: el jitter generico
  // podia caer tan bajo que la duda no se llegaba a percibir en video).
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !target) return;
    let done = false;
    // El cursor aparece YA, quieto, apenas se sabe cual es la tanda —
    // antes vivia invisible hasta el mismo instante de decidir, y en el
    // 30% de los casos sin detour (ver useDemoCursor) aparecia recien
    // encima de la correcta: sin este reposo previo no hay nada que
    // mirar durante la pausa de lectura.
    const area = areaRef.current;
    if (area) {
      const r = area.getBoundingClientRect();
      showIdle({ x: r.left + r.width / 2, y: r.top + r.height * 0.85 });
    }
    const targetDrop = drops.find((d) => d.word.id === target.id);
    const t = setTimeout(() => {
      if (done || resolvedRef.current) return;
      done = true;
      const allDrops = Array.from(document.querySelectorAll("[data-word-id]")) as HTMLElement[];
      const correctEl = allDrops.find((el) => el.dataset.wordId === target.id) ?? null;
      const wrongEls = allDrops.filter((el) => el.dataset.wordId && el.dataset.wordId !== target.id);
      hesitateAndClick(correctEl, wrongEls);
    }, (targetDrop?.delay ?? 0) * 1000 + demoReadingPause());
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, target, drops, hesitateAndClick, showIdle]);

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
    const reward = rewardForLevel(level.levelUi, tuning);
    return (
      <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Lluvia de Palabras"
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
    <GameShell title="Lluvia de Palabras" icon="🌧️" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})} contentAlign="top" immersive onPauseChange={setPaused}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.xs, width: "100%" }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} onSkip={skipIntro} />}

        {/* Rain area: la nube cae ocupando el alto disponible (antes h fijo
            min(450px,60vh)) — el area es ahora el elemento dominante, con
            el HUD flotando encima (mismo patron que Leo Vuela). Alto por
            calc(100dvh - ...) y NO flex:1/height:100%: el wrapper de
            GameShell que envuelve a los children ("children" de
            GameShellProps) no tiene flex-grow, asi que un height:100% ahi
            resuelve a auto — exactamente el bug que ya documenta el
            comentario de Leo Vuela sobre containerType:size con alto 0
            (visto en pantalla: el area quedaba invisible, recortada por
            overflow:hidden). El header flota ENCIMA (position:absolute),
            no empuja, por eso 100dvh menos un margen chico alcanza. */}
        <div ref={areaRef} style={{
          position: "relative", width: "100%", maxWidth: "96vw", height: "calc(100dvh - 16px)",
          borderRadius: radii.xl,
          background: "linear-gradient(180deg, #ebf8ff 0%, #bee3f8 60%, #90cdf4 100%)",
          border: `2px solid ${colors.border.light}`, overflow: "hidden",
          containerType: "size",
        }}>
          <ArcadeHud
            overlay
            color={GAME_COLOR}
            targetPrefix="Atrapá:"
            level={level.levelUi}
            correct={state.correctAttempts}
            targetWord={target}
            waveKey={waveIdx}
            energy={energy.energyUi}
            energyMax={tuning.energyMax}
          />
          <RainAndThunder />
          <div style={{ position: "absolute", top: 8, left: "10%", fontSize: 36, opacity: 0.4 }}>☁️</div>
          <div style={{ position: "absolute", top: 4, right: "15%", fontSize: 28, opacity: 0.3 }}>☁️</div>

          {gamePhase === "running" && (
            <AnimatePresence>
              {drops.map((drop) => {
                const usableWidth = 70;
                const laneWidth = usableWidth / LANES;
                const leftPct = 15 + drop.lane * laneWidth + laneWidth / 2;
                if (caughtId === drop.word.id) return null;

                return (
                  <FallingWord
                    key={drop.key}
                    drop={drop}
                    paused={paused}
                    fallSeconds={fallSeconds}
                    areaHeight={areaHeight}
                    leftPct={leftPct}
                    onLand={() => onDropLand(drop.word.id === targetRef.current?.id)}
                    onClick={(e) => handleTap(drop, e)}
                  />
                );
              })}
            </AnimatePresence>
          )}

          {/* Ground */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
            background: "linear-gradient(180deg, #68d391 0%, #38a169 100%)",
          }}>
            <div style={{ position: "absolute", top: 4, left: "20%", fontSize: 16 }}>🌱</div>
            <div style={{ position: "absolute", top: 6, left: "50%", fontSize: 14 }}>🌿</div>
            <div style={{ position: "absolute", top: 4, right: "25%", fontSize: 16 }}>🌱</div>
          </div>

          {burstPos && (
            <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
              <VictoryBurst active x={burstPos.x} y={burstPos.y} count={10} />
            </div>
          )}
        </div>

      </div>
      <FeedbackFlash type={feedbackType} />
      {Cursor}
    </GameShell>
  );
};
