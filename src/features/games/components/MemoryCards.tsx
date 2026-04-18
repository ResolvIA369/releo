"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { useDemoAutoplay } from "../hooks/useDemoAutoplay";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { VictoryBurst } from "@/shared/components/VictoryBurst";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { TimeBar } from "@/shared/components/TimeBar";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { colors, spacing, radii, shadows, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaCelebrates, sofiaEncourages, sofiaPlayAudio } from "@/shared/services/sofiaVoice";

// ═══════════════════════════════════════════════════════════════════════
// Rompecabezas de Palabras
//
// Sofia dice una palabra. La palabra aparece dividida en sílabas
// desordenadas. El niño las toca en orden correcto para armarla.
// Al completar: confeti + Sofia celebra + emoji de la palabra.
// ═══════════════════════════════════════════════════════════════════════

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#805ad5";
const SECONDS_PER_WORD = 12;

// Correct syllable dictionary for all 220 Doman words
const SYLLABLE_MAP: Record<string, string[]> = {
  mamá:["ma","má"],papá:["pa","pá"],bebé:["be","bé"],abuela:["a","bue","la"],abuelo:["a","bue","lo"],
  hermano:["her","ma","no"],hermana:["her","ma","na"],tío:["tí","o"],tía:["tí","a"],primo:["pri","mo"],
  rojo:["ro","jo"],azul:["a","zul"],verde:["ver","de"],amarillo:["a","ma","ri","llo"],blanco:["blan","co"],
  perro:["pe","rro"],gato:["ga","to"],caballo:["ca","ba","llo"],vaca:["va","ca"],pájaro:["pá","ja","ro"],
  manzana:["man","za","na"],banana:["ba","na","na"],uva:["u","va"],pera:["pe","ra"],naranja:["na","ran","ja"],
  ventana:["ven","ta","na"],cocina:["co","ci","na"],baño:["ba","ño"],piso:["pi","so"],techo:["te","cho"],
  mano:["ma","no"],pie:["pie"],ojo:["o","jo"],nariz:["na","riz"],boca:["bo","ca"],
  oreja:["o","re","ja"],pelo:["pe","lo"],dedo:["de","do"],brazo:["bra","zo"],pierna:["pier","na"],
  agua:["a","gua"],leche:["le","che"],pan:["pan"],arroz:["a","rroz"],huevo:["hue","vo"],
  casa:["ca","sa"],mesa:["me","sa"],silla:["si","lla"],cama:["ca","ma"],puerta:["puer","ta"],
  negro:["ne","gro"],rosa:["ro","sa"],violeta:["vio","le","ta"],marrón:["ma","rrón"],
  grande:["gran","de"],pequeño:["pe","que","ño"],largo:["lar","go"],corto:["cor","to"],
  alto:["al","to"],bajo:["ba","jo"],gordo:["gor","do"],flaco:["fla","co"],
  redondo:["re","don","do"],cuadrado:["cua","dra","do"],
  arriba:["a","rri","ba"],abajo:["a","ba","jo"],dentro:["den","tro"],fuera:["fue","ra"],
  cerca:["cer","ca"],lejos:["le","jos"],rápido:["rá","pi","do"],lento:["len","to"],
  caliente:["ca","lien","te"],frío:["frí","o"],
  feliz:["fe","liz"],triste:["tris","te"],enojado:["e","no","ja","do"],asustado:["a","sus","ta","do"],
  cansado:["can","sa","do"],contento:["con","ten","to"],tranquilo:["tran","qui","lo"],
  sorprendido:["sor","pren","di","do"],valiente:["va","lien","te"],amable:["a","ma","ble"],
  sol:["sol"],luna:["lu","na"],estrella:["es","tre","lla"],nube:["nu","be"],lluvia:["llu","via"],
  árbol:["ár","bol"],flor:["flor"],río:["rí","o"],mar:["mar"],montaña:["mon","ta","ña"],
  come:["co","me"],bebe:["be","be"],duerme:["duer","me"],juega:["jue","ga"],corre:["co","rre"],
  salta:["sal","ta"],lee:["lee"],escribe:["es","cri","be"],canta:["can","ta"],baila:["bai","la"],
  abre:["a","bre"],cierra:["cie","rra"],sube:["su","be"],baja:["ba","ja"],toca:["to","ca"],
  lava:["la","va"],limpia:["lim","pia"],pinta:["pin","ta"],dibuja:["di","bu","ja"],
  camisa:["ca","mi","sa"],pantalón:["pan","ta","lón"],zapato:["za","pa","to"],gorra:["go","rra"],
  pollera:["po","lle","ra"],media:["me","dia"],vestido:["ves","ti","do"],abrigo:["a","bri","go"],
  bufanda:["bu","fan","da"],piyama:["pi","ya","ma"],
  libro:["li","bro"],lápiz:["lá","piz"],papel:["pa","pel"],tijeras:["ti","je","ras"],
  pegamento:["pe","ga","men","to"],mochila:["mo","chi","la"],maestra:["maes","tra"],
  amigo:["a","mi","go"],clase:["cla","se"],recreo:["re","cre","o"],
  parque:["par","que"],tienda:["tien","da"],escuela:["es","cue","la"],hospital:["hos","pi","tal"],
  iglesia:["i","gle","sia"],playa:["pla","ya"],campo:["cam","po"],ciudad:["ciu","dad"],
  calle:["ca","lle"],jardín:["jar","dín"],
  el:["el"],la:["la"],los:["los"],las:["las"],un:["un"],una:["u","na"],unos:["u","nos"],unas:["u","nas"],
  y:["y"],con:["con"],en:["en"],de:["de"],por:["por"],para:["pa","ra"],sobre:["so","bre"],
  entre:["en","tre"],hasta:["has","ta"],desde:["des","de"],sin:["sin"],hacia:["ha","cia"],
  yo:["yo"],tú:["tú"],él:["él"],ella:["e","lla"],nosotros:["no","so","tros"],
  mi:["mi"],tu:["tu"],su:["su"],este:["es","te"],ese:["e","se"],
  hoy:["hoy"],mañana:["ma","ña","na"],ayer:["a","yer"],ahora:["a","ho","ra"],
  después:["des","pués"],antes:["an","tes"],siempre:["siem","pre"],nunca:["nun","ca"],
  pronto:["pron","to"],tarde:["tar","de"],
  uno:["u","no"],dos:["dos"],tres:["tres"],cuatro:["cua","tro"],cinco:["cin","co"],
  seis:["seis"],siete:["sie","te"],ocho:["o","cho"],nueve:["nue","ve"],diez:["diez"],
  quiere:["quie","re"],puede:["pue","de"],sabe:["sa","be"],tiene:["tie","ne"],hace:["ha","ce"],
  dice:["di","ce"],viene:["vie","ne"],sale:["sa","le"],llega:["lle","ga"],busca:["bus","ca"],
  muy:["muy"],más:["más"],menos:["me","nos"],bien:["bien"],mal:["mal"],
  aquí:["a","quí"],allí:["a","llí"],también:["tam","bién"],solo:["so","lo"],junto:["jun","to"],
};

function splitSyllables(word: string): string[] {
  const w = word.toLowerCase();
  const mapped = SYLLABLE_MAP[w];
  if (mapped && mapped.length >= 2) return mapped;
  // Fallback: split in half
  if (w.length <= 2) return [w];
  const mid = Math.ceil(w.length / 2);
  return [w.slice(0, mid), w.slice(mid)];
}

interface PuzzlePiece {
  text: string;
  index: number; // correct position
}

type Phase = "intro" | "announcing" | "playing" | "feedback" | "finished";

export const MemoryCards: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack, isDemo = false }) => {
  const { state, recordAttempt, finish, reset } = useGameState("memory-cards", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [placed, setPlaced] = useState<number[]>([]); // indices placed so far
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [showWord, setShowWord] = useState(false);

  const totalRounds = Math.min(words.length, 10);
  const currentWord = roundIdx < totalRounds ? words[roundIdx] : null;
  const finished = roundIdx >= totalRounds;

  // Build puzzle pieces for current word
  const syllables = useMemo(() => {
    if (!currentWord) return [];
    return splitSyllables(currentWord.text);
  }, [currentWord]);

  const shuffledPieces = useMemo(() => {
    return shuffle(syllables.map((text, index) => ({ text, index })));
  }, [syllables]);

  // ─── Announce word ──────────────────────────────────────────

  useEffect(() => {
    if (gamePhase !== "announcing" || !currentWord || paused) return;
    let cancelled = false;

    (async () => {
      await sofiaNameWord(currentWord.text);
      if (cancelled) return;
      // Show shuffled pieces
      setPieces(shuffledPieces);
      setPlaced([]);
      setShowWord(false);
      setTimerKey((k) => k + 1);
      setTimeout(() => { if (!cancelled) setGamePhase("playing"); }, 300);
    })();

    return () => { cancelled = true; };
  }, [gamePhase, roundIdx, paused]); // eslint-disable-line react-hooks/exhaustive-deps


  // Demo: auto-tap each syllable every 2.5s for a natural look
  useDemoAutoplay(isDemo, gamePhase === "playing" && !feedbackType && placed.length < syllables.length, () => {
    const nextIdx = placed.length;
    const btn = document.querySelector(`[data-piece-idx="${nextIdx}"]`) as HTMLElement;
    if (btn) btn.click();
  }, 2500);

  // ─── Game end ───────────────────────────────────────────────

  useEffect(() => {
    if (!finished || gamePhase === "finished") return;
    setGamePhase("finished");
    finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle piece tap ──────────────────────────────────────

  const handlePieceTap = useCallback(
    async (piece: PuzzlePiece, e: React.MouseEvent) => {
      if (gamePhase !== "playing" || feedbackType) return;

      const nextExpected = placed.length;
      const isCorrect = piece.index === nextExpected;

      if (isCorrect) {
        const newPlaced = [...placed, piece.index];
        setPlaced(newPlaced);

        // Check if word is complete
        if (newPlaced.length === syllables.length) {
          // Word complete!
          recordAttempt(true, currentWord?.id);
          setShowWord(true);
          setFeedbackType("correct");
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          setBurstPos({ x: cx, y: cy });
          rewardCorrect(cx, cy);

          await sofiaNameWord(currentWord?.text ?? "");
          await new Promise((r) => setTimeout(r, 600));

          // Reset visual state BEFORE advancing so the UI never
          // shows stale pieces from the previous word.
          setFeedbackType(null);
          setBurstPos(null);
          setShowWord(false);
          setPlaced([]);
          setPieces([]);
          setRoundIdx((i) => i + 1);
          setGamePhase("announcing");
        }
      } else {
        // Wrong piece
        setFeedbackType("wrong");
        await sofiaEncourages("¡Ese no! Fíjate bien");
        await new Promise((r) => setTimeout(r, 300));
        setFeedbackType(null);
      }
    },
    [gamePhase, feedbackType, placed, syllables, currentWord, recordAttempt]
  );

  // ─── Time up ────────────────────────────────────────────────

  const handleTimeUp = useCallback(() => {
    if (gamePhase !== "playing") return;
    recordAttempt(false);
    setFeedbackType("wrong");
    setShowWord(true);
    setGamePhase("feedback");

    sofiaEncourages(`¡Se acabó el tiempo! Era "${currentWord?.text}"`).then(() => {
      setTimeout(() => {
        setFeedbackType(null);
        setShowWord(false);
        setPlaced([]);
        setPieces([]);
        setRoundIdx((i) => i + 1);
        setGamePhase("announcing");
      }, 800);
    });
  }, [gamePhase, currentWord, recordAttempt]);

  const handleReplay = useCallback(() => {
    reset();
    setRoundIdx(0);
    setPlaced([]);
    setGamePhase("intro");
  }, [reset]);

  // ═══ RENDER ════════════════════════════════════════════════

  if (gamePhase === "intro") {
    return (
      <GameShell title="Rompecabezas" icon="🧩" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro
          gameName="Rompecabezas"
          gameIcon="🧩"
          rulesText="¡Arma la palabra! Yo te digo una palabra y tú tocas las sílabas en orden para armarla."
          color={GAME_COLOR}
          isDemo={isDemo} onReady={() => setGamePhase("announcing")}
        />
      </GameShell>
    );
  }

  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Rompecabezas" icon="🧩" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Rompecabezas" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  if (!currentWord) return null;

  const emoji = EMOJI_MAP[currentWord.text] ?? "❓";
  const assembledText = syllables.slice(0, placed.length).join("");
  const remainingPieces = pieces.filter((p) => !placed.includes(p.index));

  // Piece colors for visual variety
  const PIECE_COLORS = ["#805ad5", "#e53e3e", "#38a169", "#d69e2e", "#3182ce"];

  return (
    <GameShell title="Rompecabezas" icon="🧩" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", gap: spacing.md, paddingTop: spacing.md, maxWidth: "min(620px, calc(100vw - 32px))", margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}>
          {/* Counter */}
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
            {roundIdx + 1} / {totalRounds}
          </span>

          {/* Emoji hint */}
          <motion.div
            key={roundIdx}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 8 }}
            style={{ fontSize: 64 }}
          >
            {emoji}
          </motion.div>

          {/* Assembly area — shows placed pieces */}
          <div style={{
            display: "flex", gap: spacing.xs, justifyContent: "center",
            padding: `${spacing.md}px ${spacing.lg}px`,
            backgroundColor: colors.bg.secondary,
            borderRadius: radii.xl,
            minHeight: 70,
            minWidth: 200,
            alignItems: "center",
            border: `3px dashed ${placed.length > 0 ? GAME_COLOR : colors.border.light}`,
          }}>
            {showWord ? (
              // Show complete word
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                style={{
                  fontSize: fontSizes["3xl"], fontWeight: "bold",
                  fontFamily: fonts.display, color: colors.success,
                }}
              >
                {currentWord.text}
              </motion.span>
            ) : (
              <>
                {/* Placed syllables */}
                {placed.map((idx, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      fontSize: fontSizes["2xl"], fontWeight: "bold",
                      fontFamily: fonts.display,
                      color: PIECE_COLORS[idx % PIECE_COLORS.length],
                    }}
                  >
                    {syllables[idx]}
                  </motion.span>
                ))}
                {/* Empty slots for remaining */}
                {Array.from({ length: syllables.length - placed.length }).map((_, i) => (
                  <span key={`empty-${i}`} style={{
                    display: "inline-block",
                    width: 40, height: 6, borderRadius: 3,
                    backgroundColor: colors.border.light,
                    margin: `0 ${spacing.xs}px`,
                  }} />
                ))}
              </>
            )}
          </div>

          {/* Instruction */}
          <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, fontFamily: fonts.display }}>
            {placed.length === 0 ? "¡Toca la primera sílaba!" :
             placed.length < syllables.length ? `¡Ahora la ${placed.length + 1}ª!` :
             ""}
          </p>

          {/* Puzzle pieces — scattered */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: spacing.md,
            justifyContent: "center", maxWidth: "min(560px, calc(100vw - 32px))",
          }}>
            <AnimatePresence>
              {remainingPieces.map((piece) => {
                const pieceColor = PIECE_COLORS[piece.index % PIECE_COLORS.length];
                return (
                  <motion.button
                    key={`${roundIdx}-${piece.index}`}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 15, opacity: 0 }}
                    transition={{ type: "spring", damping: 10 }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    data-piece-idx={piece.index} onClick={(e) => handlePieceTap(piece, e)}
                    disabled={!!feedbackType}
                    style={{
                      padding: `${spacing.md}px ${spacing.lg}px`,
                      borderRadius: radii.xl,
                      backgroundColor: "#fff",
                      border: `3px solid ${pieceColor}`,
                      boxShadow: `0 4px 12px ${pieceColor}30`,
                      fontSize: fontSizes["2xl"],
                      fontWeight: "bold",
                      fontFamily: fonts.display,
                      color: pieceColor,
                      cursor: feedbackType ? "default" : "pointer",
                      minWidth: 70,
                      minHeight: 56,
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    {piece.text}
                    {/* Puzzle notch decoration */}
                    <div style={{
                      position: "absolute", top: -6, right: -6,
                      width: 16, height: 16, borderRadius: "50%",
                      backgroundColor: pieceColor, opacity: 0.3,
                    }} />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Time bar on the right */}
        <div style={{ display: "flex", alignItems: "stretch", paddingTop: 40, paddingBottom: 20 }}>
          <TimeBar
            key={timerKey}
            seconds={SECONDS_PER_WORD}
            onTimeUp={handleTimeUp}
            color={GAME_COLOR}
            paused={paused || gamePhase !== "playing"}
            resetKey={timerKey}
          />
        </div>
      </div>

      {burstPos && (
        <div style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 999 }}>
          <VictoryBurst active x={burstPos.x} y={burstPos.y} count={12} />
        </div>
      )}
      <FeedbackFlash type={feedbackType} />
    </GameShell>
  );
};
