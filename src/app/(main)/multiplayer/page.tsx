"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASE1_WORDS } from "@/shared/constants";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { sofiaNameWord } from "@/shared/services/sofiaVoice";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import {
  colors,
  spacing,
  fonts,
  fontSizes,
  radii,
  shadows,
  timing,
  gradients,
} from "@/shared/styles/design-tokens";

// ─── Helpers ──────────────────────────────────────────────────────────

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Pick 3 random distractor emojis (different from correct one). */
function pickDistractors(correctWord: string): string[] {
  const correctEmoji = EMOJI_MAP[correctWord] ?? "❓";
  const allEmojis = Object.values(EMOJI_MAP);
  const unique = Array.from(new Set(allEmojis)).filter((e) => e !== correctEmoji);
  const shuffled = shuffle(unique);
  return shuffled.slice(0, 3);
}

const TOTAL_ROUNDS = 10;
const PLAYER_COLORS = {
  1: { bg: "#2563eb", light: "#dbeafe", glow: "#3b82f6" },
  2: { bg: "#dc2626", light: "#fee2e2", glow: "#ef4444" },
} as const;

type GamePhase = "setup" | "playing" | "feedback" | "done";

// ─── Component ────────────────────────────────────────────────────────

export default function MultiplayerPage() {
  // Setup state
  const [name1, setName1] = useState("Jugador 1");
  const [name2, setName2] = useState("Jugador 2");

  // Game state
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [round, setRound] = useState(0);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Words for the game
  const gameWords = useMemo(() => {
    const wordsWithEmoji = PHASE1_WORDS.filter(
      (w) => EMOJI_MAP[w.text] && EMOJI_MAP[w.text] !== "❓"
    );
    return shuffle(wordsWithEmoji).slice(0, TOTAL_ROUNDS);
  }, []);

  const currentWord = round < gameWords.length ? gameWords[round] : null;

  // Build 4 emoji options for this round
  const emojiOptions = useMemo(() => {
    if (!currentWord) return [];
    const correct = EMOJI_MAP[currentWord.text] ?? "❓";
    const distractors = pickDistractors(currentWord.text);
    return shuffle([correct, ...distractors]);
  }, [currentWord]);

  // ─── Handlers ───────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    setPhase("playing");
    setRound(0);
    setScore1(0);
    setScore2(0);
    setActivePlayer(1);
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!currentWord || speaking) return;
    setSpeaking(true);
    await sofiaNameWord(currentWord.text);
    setSpeaking(false);
  }, [currentWord, speaking]);

  const handleEmojiTap = useCallback(
    (emoji: string) => {
      if (!currentWord || phase !== "playing") return;
      const correct = EMOJI_MAP[currentWord.text] ?? "❓";
      const isCorrect = emoji === correct;

      if (isCorrect) {
        if (activePlayer === 1) setScore1((s) => s + 1);
        else setScore2((s) => s + 1);
      }

      setFeedbackCorrect(isCorrect);
      setPhase("feedback");

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          setPhase("done");
        } else {
          setRound(nextRound);
          setActivePlayer((p) => (p === 1 ? 2 : 1));
          setPhase("playing");
        }
      }, 1200);
    },
    [currentWord, phase, activePlayer, round]
  );

  const resetGame = useCallback(() => {
    setPhase("setup");
    setRound(0);
    setScore1(0);
    setScore2(0);
    setActivePlayer(1);
  }, []);

  // ─── Render: Setup Screen ──────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing["2xl"],
          padding: spacing.xl,
          background: gradients.brand,
          fontFamily: fonts.display,
        }}
      >
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: fontSizes["4xl"],
            color: colors.text.inverse,
            textAlign: "center",
            margin: 0,
            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          Modo Multijugador
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: fontSizes.lg,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            margin: 0,
            maxWidth: 400,
          }}
        >
          Sofia dice una palabra y muestra 4 emojis. El jugador que toque el
          emoji correcto gana un punto.
        </motion.p>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "flex",
            gap: spacing.xl,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Player 1 input */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.full,
                background: PLAYER_COLORS[1].bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: fontSizes.xl,
                fontWeight: "bold",
                boxShadow: shadows.md,
              }}
            >
              1
            </div>
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              maxLength={15}
              style={{
                fontSize: fontSizes.md,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.md,
                border: `2px solid ${PLAYER_COLORS[1].bg}`,
                textAlign: "center",
                fontFamily: fonts.body,
                outline: "none",
                width: 160,
              }}
            />
          </div>

          {/* VS */}
          <span
            style={{
              fontSize: fontSizes["3xl"],
              fontWeight: "bold",
              color: colors.text.inverse,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            VS
          </span>

          {/* Player 2 input */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.full,
                background: PLAYER_COLORS[2].bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: fontSizes.xl,
                fontWeight: "bold",
                boxShadow: shadows.md,
              }}
            >
              2
            </div>
            <input
              type="text"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              maxLength={15}
              style={{
                fontSize: fontSizes.md,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.md,
                border: `2px solid ${PLAYER_COLORS[2].bg}`,
                textAlign: "center",
                fontFamily: fonts.body,
                outline: "none",
                width: 160,
              }}
            />
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          style={{
            fontSize: fontSizes.xl,
            fontWeight: "bold",
            fontFamily: fonts.display,
            padding: `${spacing.md}px ${spacing["2xl"]}px`,
            borderRadius: radii.pill,
            border: "none",
            background: "#fff",
            color: colors.brand.primary,
            cursor: "pointer",
            boxShadow: shadows.button,
          }}
        >
          Jugar
        </motion.button>
      </div>
    );
  }

  // ─── Render: Done Screen ───────────────────────────────────────────

  if (phase === "done") {
    const winner =
      score1 > score2 ? name1 : score2 > score1 ? name2 : null;
    const winnerColor =
      score1 > score2
        ? PLAYER_COLORS[1].bg
        : score2 > score1
        ? PLAYER_COLORS[2].bg
        : colors.brand.primary;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xl,
          padding: spacing.xl,
          background: gradients.celebration,
          fontFamily: fonts.display,
        }}
      >
        <CelebrationGif size={200} />

        <motion.h1
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={timing.springBouncy}
          style={{
            fontSize: fontSizes["4xl"],
            color: colors.text.inverse,
            textAlign: "center",
            margin: 0,
            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          {winner ? `${winner} gana!` : "Empate!"}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "flex",
            gap: spacing["2xl"],
            alignItems: "center",
          }}
        >
          {/* Player 1 final score */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: fontSizes["5xl"],
                fontWeight: "bold",
                color: PLAYER_COLORS[1].bg,
                textShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {score1}
            </div>
            <div style={{ fontSize: fontSizes.md, color: "rgba(255,255,255,0.9)" }}>
              {name1}
            </div>
          </div>

          <span
            style={{
              fontSize: fontSizes["3xl"],
              color: "rgba(255,255,255,0.6)",
              fontWeight: "bold",
            }}
          >
            -
          </span>

          {/* Player 2 final score */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: fontSizes["5xl"],
                fontWeight: "bold",
                color: PLAYER_COLORS[2].bg,
                textShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {score2}
            </div>
            <div style={{ fontSize: fontSizes.md, color: "rgba(255,255,255,0.9)" }}>
              {name2}
            </div>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontSize: fontSizes.lg,
            fontWeight: "bold",
            fontFamily: fonts.display,
            padding: `${spacing.md}px ${spacing["2xl"]}px`,
            borderRadius: radii.pill,
            border: "none",
            background: "#fff",
            color: winnerColor,
            cursor: "pointer",
            boxShadow: shadows.button,
            marginTop: spacing.md,
          }}
        >
          Jugar de nuevo
        </motion.button>
      </div>
    );
  }

  // ─── Render: Playing / Feedback ────────────────────────────────────

  const activePlayerName = activePlayer === 1 ? name1 : name2;
  const activeColor = PLAYER_COLORS[activePlayer];

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: fonts.display,
        background: colors.bg.primary,
        overflow: "hidden",
      }}
    >
      {/* ── Scoreboard ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 80,
          flexShrink: 0,
        }}
      >
        {/* Player 1 score */}
        <div
          style={{
            flex: 1,
            background:
              activePlayer === 1
                ? PLAYER_COLORS[1].bg
                : PLAYER_COLORS[1].light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            transition: "background 0.3s",
          }}
        >
          <span
            style={{
              fontSize: fontSizes.md,
              fontWeight: "bold",
              color: activePlayer === 1 ? "#fff" : PLAYER_COLORS[1].bg,
            }}
          >
            {name1}
          </span>
          <span
            style={{
              fontSize: fontSizes["2xl"],
              fontWeight: "bold",
              color: activePlayer === 1 ? "#fff" : PLAYER_COLORS[1].bg,
            }}
          >
            {score1}
          </span>
        </div>

        {/* VS badge + round */}
        <div
          style={{
            width: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: colors.bg.card,
            zIndex: 2,
            boxShadow: shadows.md,
          }}
        >
          <motion.span
            key={round}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: fontSizes.xl,
              fontWeight: "bold",
              color: colors.text.primary,
            }}
          >
            VS
          </motion.span>
          <span
            style={{
              fontSize: fontSizes.xs,
              color: colors.text.muted,
            }}
          >
            {round + 1}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Player 2 score */}
        <div
          style={{
            flex: 1,
            background:
              activePlayer === 2
                ? PLAYER_COLORS[2].bg
                : PLAYER_COLORS[2].light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            transition: "background 0.3s",
          }}
        >
          <span
            style={{
              fontSize: fontSizes.md,
              fontWeight: "bold",
              color: activePlayer === 2 ? "#fff" : PLAYER_COLORS[2].bg,
            }}
          >
            {name2}
          </span>
          <span
            style={{
              fontSize: fontSizes["2xl"],
              fontWeight: "bold",
              color: activePlayer === 2 ? "#fff" : PLAYER_COLORS[2].bg,
            }}
          >
            {score2}
          </span>
        </div>
      </div>

      {/* ── Turn Indicator ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`turn-${activePlayer}-${round}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            textAlign: "center",
            padding: `${spacing.sm}px 0`,
            background: `${activeColor.bg}18`,
            borderBottom: `2px solid ${activeColor.bg}`,
          }}
        >
          <span style={{ fontSize: fontSizes.md, color: activeColor.bg, fontWeight: "bold" }}>
            Turno de {activePlayerName}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ── Main Play Area ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xl,
          padding: spacing.lg,
        }}
      >
        {/* Feedback overlay */}
        <AnimatePresence>
          {phase === "feedback" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: feedbackCorrect
                  ? "rgba(72,187,120,0.25)"
                  : "rgba(229,62,62,0.25)",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={timing.springBouncy}
                style={{ fontSize: 120 }}
              >
                {feedbackCorrect ? "🎉" : "😅"}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word display */}
        {currentWord && (
          <motion.div
            key={`word-${round}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <motion.div
              style={{
                fontSize: fontSizes["4xl"],
                fontWeight: "bold",
                color: colors.doman.wordRed,
                fontFamily: fonts.display,
                textTransform: "lowercase",
              }}
            >
              {currentWord.text}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleSpeak}
              disabled={speaking}
              style={{
                fontSize: fontSizes.lg,
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: radii.pill,
                border: "none",
                background: activeColor.bg,
                color: "#fff",
                cursor: speaking ? "default" : "pointer",
                fontFamily: fonts.display,
                fontWeight: "bold",
                boxShadow: shadows.button,
                opacity: speaking ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <span style={{ fontSize: fontSizes.xl }}>🔊</span>
              Escuchar
            </motion.button>
          </motion.div>
        )}

        {/* Emoji grid — 2x2 */}
        <motion.div
          key={`options-${round}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: spacing.md,
            width: "100%",
            maxWidth: 360,
          }}
        >
          {emojiOptions.map((emoji, i) => (
            <motion.button
              key={`${round}-${i}`}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleEmojiTap(emoji)}
              disabled={phase !== "playing"}
              style={{
                fontSize: fontSizes["5xl"],
                padding: spacing.lg,
                borderRadius: radii.xl,
                border: `3px solid ${colors.border.light}`,
                background: colors.bg.card,
                cursor: phase === "playing" ? "pointer" : "default",
                boxShadow: shadows.md,
                transition: "border-color 0.2s, box-shadow 0.2s",
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (phase === "playing") {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = activeColor.bg;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = shadows.glow(activeColor.glow);
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border.light;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = shadows.md;
              }}
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── Split-screen color bars at bottom ─────────────────────── */}
      <div style={{ display: "flex", height: 8, flexShrink: 0 }}>
        <div
          style={{
            flex: 1,
            background: PLAYER_COLORS[1].bg,
            opacity: activePlayer === 1 ? 1 : 0.3,
            transition: "opacity 0.3s",
          }}
        />
        <div
          style={{
            flex: 1,
            background: PLAYER_COLORS[2].bg,
            opacity: activePlayer === 2 ? 1 : 0.3,
            transition: "opacity 0.3s",
          }}
        />
      </div>
    </div>
  );
}
