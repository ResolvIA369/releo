"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS } from "@/shared/constants";
import type { DomanWord } from "@/shared/types/doman";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { sofiaNameWord, sofiaPlayAudio } from "@/shared/services/sofiaVoice";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

const ALL_WORDS = [...PHASE1_WORDS, ...PHASE2_WORDS, ...PHASE3_WORDS].filter((w) => w.text.length >= 3 && w.text.length <= 8);
const KEYBOARD_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l","ñ"],
  ["z","x","c","v","b","n","m","á","é","í"],
];
const SPECIAL_ROW = ["ó","ú","⌫"];

type Phase = "ready" | "listening" | "typing" | "correct" | "wrong" | "done";

export default function DictationPage() {
  const words = useMemo(() => shuffle(ALL_WORDS).slice(0, 10), []);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const currentWord = idx < words.length ? words[idx] : null;

  const handleListen = useCallback(async () => {
    if (!currentWord) return;
    setPhase("listening");
    await sofiaNameWord(currentWord.text);
    setPhase("typing");
  }, [currentWord]);

  const handleKey = useCallback((key: string) => {
    if (phase !== "typing" || !currentWord) return;
    if (key === "⌫") {
      setTyped((t) => t.slice(0, -1));
      return;
    }
    const newTyped = typed + key;
    setTyped(newTyped);

    if (newTyped.length === currentWord.text.length) {
      setAttempts((a) => a + 1);
      if (newTyped === currentWord.text) {
        setScore((s) => s + 1);
        setPhase("correct");
        sofiaPlayAudio("celebra-03", "¡Muy bien!", "excited");
        setTimeout(() => {
          setTyped("");
          setIdx((i) => i + 1);
          setPhase(idx + 1 >= words.length ? "done" : "ready");
        }, 1500);
      } else {
        setPhase("wrong");
        sofiaPlayAudio("animo-01", "¡Intenta otra vez!", "encouraging");
        setTimeout(() => { setTyped(""); setPhase("typing"); }, 1500);
      }
    }
  }, [phase, typed, currentWord, idx, words.length]);

  if (phase === "done") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.lg, backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.xl }}>
        <CelebrationGif size={180} />
        <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, margin: 0 }}>¡Dictado completado!</h2>
        <p style={{ fontSize: fontSizes.lg, color: colors.text.muted }}>{score}/{attempts} correctas</p>
        <button onClick={() => window.location.reload()}
          style={{ padding: `${spacing.md}px ${spacing.xl}px`, borderRadius: radii.lg, backgroundColor: colors.brand.primary, color: "#fff", border: "none", fontSize: fontSizes.md, fontWeight: "bold", cursor: "pointer" }}>
          Jugar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 500, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}>
        <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, margin: 0, color: colors.text.primary }}>
          ✍️ Dictado de Palabras
        </h2>
        <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>{idx + 1} / {words.length}</span>

        {/* Listen button */}
        {(phase === "ready" || phase === "typing") && currentWord && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleListen}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.sm,
              padding: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.bg.card,
              border: `3px solid ${colors.brand.primary}`, boxShadow: shadows.md, cursor: "pointer",
              minWidth: 200,
            }}>
            <span style={{ fontSize: 48 }}>🔊</span>
            <span style={{ fontSize: fontSizes.md, fontFamily: fonts.display, color: colors.brand.primary, fontWeight: "bold" }}>
              {phase === "ready" ? "Escuchar palabra" : "Escuchar de nuevo"}
            </span>
          </motion.button>
        )}

        {phase === "listening" && <SofiaAvatar size={160} speaking={true} />}

        {/* Emoji hint */}
        {currentWord && phase === "typing" && (
          <span style={{ fontSize: 48 }}>{EMOJI_MAP[currentWord.text] ?? "❓"}</span>
        )}

        {/* Typed display */}
        {(phase === "typing" || phase === "correct" || phase === "wrong") && currentWord && (
          <div style={{
            display: "flex", gap: spacing.xs, justifyContent: "center",
            padding: spacing.md, minHeight: 60,
          }}>
            {currentWord.text.split("").map((char, i) => (
              <div key={i} style={{
                width: 40, height: 50,
                borderBottom: `3px solid ${phase === "correct" ? colors.success : phase === "wrong" ? colors.error : colors.brand.primary}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: fontSizes["2xl"], fontWeight: "bold",
                fontFamily: fonts.display,
                color: typed[i] === char ? colors.success : typed[i] ? colors.error : colors.text.primary,
              }}>
                {typed[i] ?? ""}
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {phase === "correct" && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: fontSizes.xl, color: colors.success, fontWeight: "bold" }}>
            ✅ ¡Correcto!
          </motion.div>
        )}
        {phase === "wrong" && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: fontSizes.xl, color: colors.error, fontWeight: "bold" }}>
            ❌ Era: {currentWord?.text}
          </motion.div>
        )}

        {/* Keyboard */}
        {phase === "typing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs, width: "100%" }}>
            {[...KEYBOARD_ROWS, SPECIAL_ROW].map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: spacing.xs, justifyContent: "center" }}>
                {row.map((key) => (
                  <motion.button key={key} whileTap={{ scale: 0.9 }}
                    onClick={() => handleKey(key)}
                    style={{
                      width: key === "⌫" ? 60 : 36, height: 44,
                      borderRadius: radii.md, border: `1px solid ${colors.border.light}`,
                      backgroundColor: key === "⌫" ? "#fed7d7" : colors.bg.card,
                      fontSize: fontSizes.md, fontWeight: "bold",
                      cursor: "pointer", boxShadow: shadows.sm,
                      color: key === "⌫" ? colors.error : colors.text.primary,
                    }}>
                    {key}
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
