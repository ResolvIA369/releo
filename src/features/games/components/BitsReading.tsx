"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameProps } from "../types";
import type { DomanWord } from "@/shared/types/doman";
import { useGameState } from "../hooks/useGameState";
import { GameShell, usePause } from "./GameShell";
import { useRewards } from "@/shared/components/RewardsLayer";
import { GameIntro } from "./GameIntro";
import { GameCompleteScreen } from "@/shared/components/GameCompleteScreen";
import { FeedbackFlash } from "@/shared/components/FeedbackFlash";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { sofiaNameWord, sofiaPlayAudio } from "@/shared/services/sofiaVoice";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_COLOR = "#f093fb";
const BUBBLE_COLORS = ["#f093fb", "#667eea", "#48bb78", "#ed8936", "#e53e3e", "#0bc5ea"];
const BUBBLES_COUNT = 5;

interface Bubble {
  word: DomanWord;
  x: number;
  y: number;
  size: number;
  color: string;
  dx: number;
  dy: number;
}

type Phase = "intro" | "announcing" | "popping" | "feedback" | "finished";

export const BitsReading: React.FC<GameProps> = ({ words, phase = 1, onComplete, onBack }) => {
  const { state, recordAttempt, finish, reset } = useGameState("daily-bits", { phase });
  const { rewardCorrect } = useRewards();
  const { paused } = usePause();

  const [gamePhase, setGamePhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<DomanWord | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [poppedId, setPoppedId] = useState<string | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const [, forceRender] = useState(0);
  const animRef = useRef<number>(undefined);

  const totalRounds = Math.min(words.length, 10);
  const finished = roundIdx >= totalRounds;

  const setupRound = useCallback((idx: number) => {
    if (idx >= totalRounds) {
      setGamePhase("finished");
      finish().then(() => onComplete?.(state));
      return;
    }
    const t = words[idx];
    setTarget(t);
    setPoppedId(null);
    const others = shuffle(words.filter((w) => w.id !== t.id)).slice(0, BUBBLES_COUNT - 1);
    const all = shuffle([t, ...others]);
    const newBubbles = all.map((w, i) => ({
      word: w, x: 10 + Math.random() * 70, y: 10 + Math.random() * 60,
      size: 72 + Math.random() * 18, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.35,
    }));
    setBubbles(newBubbles);
    bubblesRef.current = newBubbles;
    setGamePhase("announcing");
  }, [totalRounds, words, finish, onComplete, state]);

  // Announce
  useEffect(() => {
    if (gamePhase !== "announcing" || !target || paused) return;
    let c = false;
    sofiaNameWord(target.text).then(() => { if (!c) setTimeout(() => { if (!c) setGamePhase("popping"); }, 300); });
    return () => { c = true; };
  }, [gamePhase, roundIdx, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate bubbles
  useEffect(() => {
    if (gamePhase !== "popping" || paused) return;
    function tick() {
      bubblesRef.current.forEach((b) => {
        if (poppedId === b.word.id) return;
        b.x += b.dx; b.y += b.dy;
        if (b.x < 5 || b.x > 85) b.dx *= -1;
        if (b.y < 5 || b.y > 75) b.dy *= -1;
        b.x = Math.max(5, Math.min(85, b.x));
        b.y = Math.max(5, Math.min(75, b.y));
      });
      forceRender((n) => n + 1);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gamePhase, paused, poppedId]);

  useEffect(() => {
    if (!finished || gamePhase === "finished") return;
    setGamePhase("finished"); finish().then(() => onComplete?.(state));
  }, [finished, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePop = useCallback(async (bubble: Bubble, e?: React.MouseEvent) => {
    if (gamePhase !== "popping" || feedbackType) return;
    const correct = bubble.word.id === target?.id;
    recordAttempt(correct, correct ? bubble.word.id : undefined);
    setGamePhase("feedback");
    if (correct) {
      setPoppedId(bubble.word.id);
      setFeedbackType("correct");
      if (e) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        rewardCorrect(rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else {
        rewardCorrect();
      }
      await sofiaPlayAudio("celebra-03", `¡${bubble.word.text}!`, "excited");
      await new Promise((r) => setTimeout(r, 500));
      setFeedbackType(null);
      const next = roundIdx + 1; setRoundIdx(next); setupRound(next);
    } else {
      setFeedbackType("wrong");
      await sofiaPlayAudio("animo-01", "¡Intenta otra vez!", "encouraging");
      await new Promise((r) => setTimeout(r, 300));
      setFeedbackType(null); setGamePhase("popping");
    }
  }, [gamePhase, feedbackType, target, recordAttempt, roundIdx, setupRound, rewardCorrect]);

  const handleReplay = useCallback(() => { reset(); setRoundIdx(0); setGamePhase("intro"); }, [reset]);

  if (gamePhase === "intro") {
    return (
      <GameShell title="Burbujas Magicas" icon="🫧" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameIntro gameName="Burbujas Magicas" gameIcon="🫧"
          rulesText="¡Palabras flotan en burbujas! Yo te digo cual reventar. ¡Toca la burbuja correcta!"
          color={GAME_COLOR} onReady={() => setupRound(0)} />
      </GameShell>
    );
  }
  if (gamePhase === "finished" || finished) {
    return (
      <GameShell title="Burbujas Magicas" icon="🫧" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
        <GameCompleteScreen title="Burbujas Magicas" correct={state.correctAttempts} total={state.totalAttempts} color={GAME_COLOR} onReplay={handleReplay} onBack={onBack ?? (() => {})} />
      </GameShell>
    );
  }

  return (
    <GameShell title="Burbujas Magicas" icon="🫧" color={GAME_COLOR} session={state} onBack={onBack ?? (() => {})}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: "min(600px, calc(100vw - 32px))" }}>
          <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>{roundIdx + 1}/{totalRounds}</span>
          {target && (
            <motion.div key={roundIdx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: `${spacing.xs}px ${spacing.lg}px`, backgroundColor: `${GAME_COLOR}15`, border: `2px solid ${GAME_COLOR}`, borderRadius: radii.pill, fontSize: fontSizes.xl, fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR }}>
              {target.text} {EMOJI_MAP[target.text] ?? ""}
            </motion.div>
          )}
          <span style={{ width: 30 }} />
        </div>

        <div style={{
          position: "relative", width: "100%", maxWidth: "min(600px, calc(100vw - 32px))", height: "min(420px, 55vh)",
          borderRadius: radii.xl, overflow: "hidden",
          background: "linear-gradient(180deg, #e8daef 0%, #d2b4de 40%, #bb8fce 100%)",
          border: `2px solid ${colors.border.light}`,
        }}>
          {[0,1,2,3,4].map((i) => (
            <motion.div key={i} animate={{ opacity: [0.2,0.6,0.2], scale: [0.8,1.2,0.8] }}
              transition={{ repeat: Infinity, duration: 2+i*0.5, delay: i*0.3 }}
              style={{ position: "absolute", top: `${10+i*18}%`, left: `${5+i*20}%`, fontSize: 14, pointerEvents: "none" }}>✨</motion.div>
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
                  onClick={(e) => handlePop(bubble, e)}
                  disabled={!!feedbackType || gamePhase !== "popping"}
                  style={{
                    position: "absolute", left: `${bubble.x}%`, top: `${bubble.y}%`,
                    transform: "translate(-50%,-50%)",
                    width: bubble.size, height: bubble.size, borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), ${bubble.color}88, ${bubble.color})`,
                    border: "2px solid rgba(255,255,255,0.4)",
                    boxShadow: `0 4px 20px ${bubble.color}40, inset 0 -4px 10px rgba(0,0,0,0.1)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: gamePhase === "popping" ? "pointer" : "default",
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
