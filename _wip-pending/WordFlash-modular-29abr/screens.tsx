"use client";

import React from "react";
import { motion } from "framer-motion";
import type { DomanWord } from "@/shared/types/doman";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { WORD_IMAGE_MAP } from "@/shared/constants/word-images";
import { colors, fonts, fontSizes, radii, spacing } from "@/shared/styles/design-tokens";

const screenStyle: React.CSSProperties = {
  minHeight: "100dvh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  backgroundColor: "#FFFFFF", fontFamily: fonts.body, padding: spacing.xl,
};

interface ReadyScreenProps {
  wordsCount: number;
  onStart: () => void;
  onBack?: () => void;
}

export const ReadyScreen: React.FC<ReadyScreenProps> = ({ wordsCount, onStart, onBack }) => (
  <div style={screenStyle}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}
    >
      <span style={{ fontSize: 64 }}>⚡</span>
      <h1 style={{ fontSize: fontSizes["3xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
        Flash de Palabras
      </h1>
      <p style={{ fontSize: fontSizes.md, color: colors.text.muted, margin: 0 }}>
        {wordsCount} palabras — 3 rondas
      </p>
      <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md }}>
        {onBack && <AnimatedButton variant="secondary" onClick={onBack}>Volver</AnimatedButton>}
        <AnimatedButton onClick={onStart}>Empezar</AnimatedButton>
      </div>
    </motion.div>
  </div>
);

interface PausedScreenProps {
  onResume: () => void;
  onBack?: () => void;
}

export const PausedScreen: React.FC<PausedScreenProps> = ({ onResume, onBack }) => (
  <div style={screenStyle}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}
    >
      <span style={{ fontSize: 64 }}>⏸️</span>
      <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, margin: 0, color: "#2d3748" }}>
        Pausado
      </h2>
      <div style={{ display: "flex", gap: spacing.md }}>
        {onBack && <AnimatedButton variant="secondary" onClick={onBack}>Salir</AnimatedButton>}
        <AnimatedButton onClick={onResume}>Continuar</AnimatedButton>
      </div>
    </motion.div>
  </div>
);

interface CompleteScreenProps {
  score: number;
  totalAttempts: number;
  sessionWords: DomanWord[];
  onReplay: () => void;
  onBack?: () => void;
}

export const CompleteScreen: React.FC<CompleteScreenProps> = ({ score, totalAttempts, sessionWords, onReplay, onBack }) => {
  const pct = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;

  return (
    <div style={screenStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg, maxWidth: 400 }}
      >
        <div style={{ display: "flex", gap: spacing.sm, fontSize: 48 }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.2, type: "spring", damping: 8 }}
              style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}
            >
              ⭐
            </motion.span>
          ))}
        </div>
        <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, margin: 0 }}>
          ¡Sesión completa!
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
          {sessionWords.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.2, type: "spring", damping: 10 }}
              style={{
                display: "flex", alignItems: "center", gap: spacing.xs,
                padding: `${spacing.sm}px ${spacing.md}px`,
                backgroundColor: colors.bg.secondary, borderRadius: radii.lg,
                fontSize: fontSizes.lg, fontFamily: fonts.display,
              }}
            >
              <span>{w.text}</span>
              {WORD_IMAGE_MAP[w.text] ? (
                <img src={WORD_IMAGE_MAP[w.text]} alt={w.text} style={{ height: 24, width: 24, objectFit: "cover", borderRadius: 4 }} />
              ) : (
                <span>{EMOJI_MAP[w.text] ?? ""}</span>
              )}
            </motion.div>
          ))}
        </div>
        <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md }}>
          {onBack && <AnimatedButton variant="secondary" onClick={onBack}>Volver</AnimatedButton>}
          <AnimatedButton onClick={onReplay}>Jugar de nuevo</AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
};
