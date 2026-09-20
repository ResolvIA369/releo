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
import { GameShell } from "./GameShell";
import { ArcadeHud } from "./ArcadeHud";
import { ArcadeIntro } from "./ArcadeIntro";
import { ArcadeMusic } from "./arcade-music";
import { SkyBirds } from "./GameAmbience";
import { useRewards } from "@/shared/components/RewardsLayer";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { wordTrainTuningForPhase } from "../config/word-train";
import { rewardForLevel, createWordBag } from "../config/arcade-tuning";
import { demoJitter } from "../hooks/useDemoAutoplay";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#38a169";

const INTRO_TEXT =
  "¡Soy la Seño Sofía! Mirá los trenes que pasan. " +
  "Escuchá la palabra, y tocá el vagón donde está escrita antes de que se vaya. " +
  "¡Vos podés! ¡Allá va el tren!";

type Phase = "intro" | "running" | "finished";

export const WordTrain: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("word-train", { phase });
  const { rewardCorrect } = useRewards();
  // B4 (QA sep-2026): usePause() leia un Context creado DENTRO de
  // GameShell, que este componente renderiza como hijo — el Provider
  // quedaba abajo del punto donde se leia el hook, asi que paused era
  // siempre false. GameShell ahora avisa por callback.
  const [paused, setPaused] = useState(false);

  const tuning = wordTrainTuningForPhase(phase);

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [targetWord, setTargetWord] = useState<DomanWord | null>(null);
  const [wagons, setWagons] = useState<DomanWord[]>([]);
  const [waveIdx, setWaveIdx] = useState(0);
  const [trainX, setTrainX] = useState(-110);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);

  const gamePhaseRef = useRef<Phase>("intro");
  gamePhaseRef.current = gamePhase;
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const bagRef = useRef<ReturnType<typeof createWordBag> | null>(null);
  if (!bagRef.current) bagRef.current = createWordBag(words);
  const targetRef = useRef<DomanWord | null>(null);
  const trainXRef = useRef(-110);
  const resolvedRef = useRef(false);
  // Franja de rieles: referencia para medir, AL MOMENTO DEL TOQUE, si el
  // vagon tocado esta 100% adentro de sus bordes (ver handleTap). Con 4
  // vagones el ensamble entero (458px) es mas ancho que la franja en
  // mobile (~359px a 390 de viewport) — nunca entra completo a la vez, asi
  // que la garantia tiene que ser POR VAGON (su propio rect vs. el de la
  // franja), no "todo el tren adentro al mismo tiempo".
  const bandRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const energy = useArcadeEnergy(tuning);
  const level = useArcadeLevel(tuning.wordsPerLevel, tuning.levels.length);
  const { levelRef } = level;

  // Musica: instancia liviana, el audio recien se crea tras el gesto
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

  // Sofia habla → la musica se agacha hasta que termina
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

  // ─── Wave: un tren nuevo entra desde la izquierda ────────────────

  const spawnWave = useCallback(() => {
    if (cancelledRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    const target = bagRef.current!.next();
    targetRef.current = target;
    const distractors = shuffle(wordsRef.current.filter((w) => w.id !== target.id)).slice(0, lvl.wagons - 1);
    setWagons(shuffle([target, ...distractors]));
    setTargetWord(target);
    setTappedId(null);
    setBurstPos(null);
    trainXRef.current = -110;
    setTrainX(-110);
    resolvedRef.current = false;
    setWaveIdx((w) => w + 1);
    // Sofia nombra en paralelo — el tren ya esta entrando
    speakDucked(() => sofiaNameWord(target.text));
  }, [tuning, levelRef, speakDucked]);

  // Sin energia → fin del juego
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
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setTimeout(() => { if (!cancelledRef.current) spawnWave(); }, delayMs);
  }, [spawnWave]);
  const resolveRef = useRef(resolveWave);
  resolveRef.current = resolveWave;

  // ─── Intro de Sofia — solo al arrancar ───────────────────────────
  useSofiaIntro(gamePhase === "intro", "intro-tren", INTRO_TEXT, () => {
    if (!cancelledRef.current) setGamePhase("running");
  });

  // Primera tanda al pasar a running
  useEffect(() => {
    if (gamePhase === "running" && targetRef.current === null) {
      spawnWave();
      // B6: en demo/grabacion el toque simulado no cuenta como gesto
      // real para el browser (ver arcade-music.ts) — arranca directo.
      if (isDemo) void musicRef.current?.ensureStarted(levelRef.current);
    }
  }, [gamePhase, spawnWave, isDemo]);

  // ─── Clock: mueve el tren + drena energia + sube nivel ───────────
  useArcadeClock(gamePhase === "running" && !paused, (dt) => {
    level.tick(dt);
    if (energy.drainTick(dt)) { finishRef.current(); return; }

    if (resolvedRef.current) return;
    const lvl = tuning.levels[levelRef.current] ?? tuning.levels[0];
    // 220% de recorrido en crossSeconds (a 60fps), acelerado por nivel
    const step = (220 / (tuning.crossSeconds * 60)) * lvl.speedMul * dt;
    trainXRef.current += step;
    setTrainX(trainXRef.current);
    if (trainXRef.current >= 110) {
      // El tren se fue sin que toques: intento fallido (escape)
      recordAttempt(false);
      energy.adjust(-tuning.energyLossEscape);
      flashFeedback("wrong");
      resolveRef.current(200);
    }
  });

  // Pausa: frenar voz y musica
  useEffect(() => {
    if (paused) { stopVoice(); musicRef.current?.pause(); }
    else if (gamePhaseRef.current === "running") musicRef.current?.resume();
  }, [paused]);

  // ─── Tap de un vagon ─────────────────────────────────────────────
  const handleTap = useCallback((word: DomanWord, e: React.MouseEvent) => {
    if (gamePhaseRef.current !== "running" || resolvedRef.current) return;
    // B2, segunda vuelta (QA sep-2026): un vagon quedaba tocable durante
    // TODO su recorrido, incluida la franja donde entra/sale a medio
    // cortar contra el borde de la via ("primo" se leia "rimo"). Con 4
    // vagones el ensamble entero nunca entra completo en la franja en
    // mobile (458px de tren contra ~359px de franja a 390 de viewport), asi
    // que la garantia no puede ser "todo el tren adentro a la vez": es
    // POR VAGON — se mide en vivo, en el momento exacto del toque, si ESE
    // boton en particular esta 100% dentro del borde de la franja. Si esta
    // aunque sea un poco cortado, el toque no cuenta (igual que si no
    // existiera todavia).
    const bandEl = bandRef.current;
    if (bandEl) {
      const bandRect = bandEl.getBoundingClientRect();
      const wagonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const fullyInside = wagonRect.left >= bandRect.left - 0.5 && wagonRect.right <= bandRect.right + 0.5;
      if (!fullyInside) return;
    }
    void musicRef.current?.ensureStarted(levelRef.current);
    setTappedId(word.id);
    const correct = word.id === targetRef.current?.id;
    recordAttempt(correct, correct ? word.id : undefined);

    if (correct) {
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
      // Error mudo: solo el flash visual + energia abajo
      energy.adjust(-tuning.energyLossWrong);
      flashFeedback("wrong");
      resolveRef.current(350);
    }
  }, [energy, tuning, recordAttempt, rewardCorrect, spawnWave, flashFeedback, levelRef]);

  // Demo: toca el vagon correcto cuando esta 100% adentro de la franja
  // (polling porque el target se mueve — la precision del click NO lleva
  // jitter, el tren no espera). Mismo criterio que handleTap: rect real del
  // boton contra rect real de la franja, no una ventana de trainX% asumida.
  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !targetWord) return;
    let done = false;
    const iv = setInterval(() => {
      if (done || resolvedRef.current) return;
      const bandEl = bandRef.current;
      const btn = document.querySelector(`[data-word-id="${targetRef.current?.id}"]`) as HTMLElement | null;
      if (!bandEl || !btn) return;
      const bandRect = bandEl.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      if (btnRect.left >= bandRect.left - 0.5 && btnRect.right <= bandRect.right + 0.5) {
        done = true; btn.click();
      }
    }, 250);
    return () => clearInterval(iv);
  }, [isDemo, gamePhase, waveIdx, targetWord]);

  useEffect(() => {
    if (!isDemo || gamePhase !== "running" || !targetWord) return;
    const t = setTimeout(() => {
      if (resolvedRef.current) return;
      const targetId = targetRef.current?.id;
      const allCars = Array.from(document.querySelectorAll("[data-word-id]")) as HTMLElement[];
      const wrongEls = allCars.filter((el) => el.dataset.wordId && el.dataset.wordId !== targetId);
      if (wrongEls.length === 0) return;
      const wrongEl = wrongEls[Math.floor(Math.random() * wrongEls.length)];
      wrongEl.classList.add("demo-hesitate");
      setTimeout(() => wrongEl.classList.remove("demo-hesitate"), demoJitter(500));
    }, demoJitter(600));
    return () => clearTimeout(t);
  }, [isDemo, gamePhase, waveIdx, targetWord]);

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

  // ─── Render wagon ─────────────────────────────────────────────
  const renderWagon = (word: DomanWord) => {
    const isTapped = tappedId === word.id;
    const isCorrect = isTapped && feedbackType === "correct";
    const isWrong = isTapped && feedbackType === "wrong";

    let bg: string = colors.bg.card;
    let border = "#8d6e63";
    let textColor: string = colors.text.primary;
    if (isCorrect) { bg = "#c6f6d5"; border = colors.success; textColor = colors.success; }
    else if (isWrong) { bg = "#fed7d7"; border = colors.error; textColor = colors.error; }

    return (
      <motion.button
        key={word.id}
        data-word-id={word.id}
        onClick={(e) => handleTap(word, e)}
        whileTap={{ scale: 0.9 }}
        style={{
          width: 96, height: 62, borderRadius: radii.md,
          backgroundColor: bg, border: `3px solid ${border}`,
          boxShadow: isCorrect ? shadows.glow(colors.success) : shadows.sm,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: fontSizes.md, fontWeight: "bold",
          fontFamily: fonts.display, color: textColor, flexShrink: 0,
        }}
      >
        {word.text}
      </motion.button>
    );
  };

  // ═══ RENDER ══════════════════════════════════════════════════

  if (gamePhase === "finished") {
    const reward = rewardForLevel(level.levelUi, tuning);
    return (
      <GameShell title="Tren de Palabras" icon="🚂" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen
          title="Tren de Palabras"
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
    <GameShell title="Tren de Palabras" icon="🚂" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})} contentAlign="top" immersive onPauseChange={setPaused}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.xs, width: "100%" }}>
        {gamePhase === "intro" && <ArcadeIntro color={GAME_COLOR} />}

        {/* Escena: mismo patron que WordFishing/WordRain — alto por
            calc(100dvh - 16px), fondo de cielo+pasto llenando la pantalla
            en vez del panel fijo de 120px de antes (QA sep-2026, B2: quedaba
            chico, con header apilado y canvas reducido tras la conversion a
            immersive de los otros 6 juegos arcade — este se habia revertido
            en su momento y nunca llego a commitearse). La mecanica del tren
            es horizontal por naturaleza (no necesita una via mas alta), asi
            que las vias quedan en una franja fija cerca del piso — el resto
            del alto ganado se usa como fondo escenico (cielo+pajaros
            arriba), igual que el oceano de WordFishing rellena con burbujas
            y algas en vez de estirar los peces.
            Ancho: "96vw" como valor PRINCIPAL, no "100%,maxWidth:96vw" (asi
            estaba en WordFishing/WordRain) — critico visual (sep-2026)
            encontro que con width:100% el escenario queda atrapado en el
            maxWidth:1000 del wrapper de children de GameShell.tsx (franjas
            vacias de ~220px a cada lado en 1440px, "se ve como una tarjeta
            flotando, no un escenario que envuelve"). "96vw" es una unidad
            de viewport: ignora el ancho acotado del ancestro y lo desborda
            a proposito (mismo truco que ya usa el canvas de Leo Corre/Leo
            Vuela, confirmado en vivo: con vw llega a ~1380 de 1440px). No
            se toca GameShell.tsx (comparten wrapper Pesca de Palabras,
            Lluvia, etc. — ese cap mas generico queda fuera del alcance de
            este fix puntual del tren). */}
        <div style={{
          position: "relative", width: "96vw", height: "calc(100dvh - 16px)",
          borderRadius: radii.xl, overflow: "hidden",
          background: "linear-gradient(180deg, #bfe3f0 0%, #d9f0d4 62%, #a8d5b0 63%, #8fc79c 100%)",
          border: `2px solid ${colors.border.light}`,
          containerType: "size",
        }}>
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
          <SkyBirds />

          {/* Rails — franja fija cerca del piso, centrada en el 63% de
              alto donde el fondo pasa de cielo a pasto. Ancho ACOTADO (no
              left:0/right:0) — el trainX% se mueve relativo al ancho de
              ESTE contenedor, y los vagones son de tamano fijo en px (96 +
              gap + locomotora 50, ~350-450px segun nivel): en un contenedor
              full-bleed de 1200-1800px (desktop ancho) el tren quedaba
              reducido a un racimo diminuto pegado a un borde, perdido en el
              medio de la escena — lo opuesto a "inmersivo" (QA sep-2026, al
              verificar B2 con video de la ronda completa). Mismo criterio
              que el canvas de Leo Corre/Leo Vuela: el ancho jugable se
              acota (aca al viejo maxWidth de 660px, donde el tamano de los
              vagones ya estaba calibrado) y se centra — el cielo+pasto de
              fondo sí ocupan todo el ancho real, dando la sensacion
              inmersiva sin romper la proporcion del tren.
              overflow:hidden ACA (no solo en la escena exterior, mucho mas
              ancha) es lo que hace que el recorte de entrada/salida del tren
              coincida con el mismo ancho que usa trainX% (B2, segunda vuelta,
              QA sep-2026: "primo" se leia "rimo" cortado contra el borde
              izquierdo). Antes solo la escena exterior (96vw) recortaba, y
              como la franja de 660px queda centrada con ~270px de aire a
              cada lado en desktop ancho, el tren -que mide su posicion en %
              de ESTOS 660px, no de la escena- se volvia visible/se ocultaba
              cruzando el borde de la escena, bien lejos de donde trainX%
              decia que "entraba" o "salia" — un vagon de palabra (no solo la
              locomotora) podia terminar exactamente partido por ese borde
              ajeno. Con el recorte alineado al mismo ancho de la formula, un
              vagon solo puede aparecer cortado mientras esta fuera del 0%-100%
              (fuera de juego, esperado), nunca en el medio del cruce. */}
          <div ref={bandRef} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "min(660px, 92vw)", top: "58%", height: 82, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 4, backgroundColor: "#8d6e63" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 4, backgroundColor: "#8d6e63" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 14, height: 52, backgroundImage: "repeating-linear-gradient(90deg, #5d4037 0px, #5d4037 4px, transparent 4px, transparent 20px)", opacity: 0.25 }} />

            {/* Train (wagons trail, locomotive leads on the right) */}
            <div style={{ position: "absolute", top: 6, left: `${trainX}%`, display: "flex", gap: 6, alignItems: "center" }}>
              {[...wagons].reverse().map(renderWagon)}
              <div style={{
                width: 50, height: 62, borderRadius: radii.md,
                backgroundColor: GAME_COLOR, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 28, boxShadow: shadows.md, flexShrink: 0,
                border: "3px solid #2d8a56", transform: "scaleX(-1)",
              }}>
                🚂
              </div>
            </div>
          </div>

          {burstPos && (
            <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
              <VictoryBurst active x={burstPos.x} y={burstPos.y} count={12} />
            </div>
          )}
        </div>
      </div>
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
