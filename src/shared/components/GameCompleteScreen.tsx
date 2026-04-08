"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnimatedButton } from "./AnimatedButton";
import { VictoryBurst } from "./VictoryBurst";
import { CelebrationGif } from "./CelebrationGif";
import { colors, spacing, fonts, fontSizes } from "@/shared/styles/design-tokens";
import { fadeInUp, starPop } from "@/shared/styles/animations";

interface GameCompleteScreenProps {
  title: string;
  correct: number;
  total: number;
  color?: string;
  onReplay: () => void;
  onBack: () => void;
}

function getStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const r = correct / total;
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : 1;
}

const MESSAGES = ["¡Sigue practicando!", "¡Buen trabajo!", "¡Muy bien!", "¡Perfecto!"];

export const GameCompleteScreen: React.FC<GameCompleteScreenProps> = ({
  title, correct, total, color = colors.brand.primary, onReplay, onBack,
}) => {
  const stars = getStars(correct, total);
  const message = MESSAGES[stars];

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.md, position: "relative" }}
    >
      {/* Celebration GIF */}
      <div style={{ position: "relative" }}>
        <VictoryBurst active count={12} x={100} y={100} />
        <CelebrationGif size={200} />
      </div>

      {/* Stars */}
      <div style={{ display: "flex", gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} variants={starPop} initial="initial" animate="animate"
            transition={{ delay: 0.3 + i * 0.2 }}
            style={{ fontSize: 48, filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}
          >⭐</motion.span>
        ))}
      </div>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        style={{ fontSize: fontSizes["2xl"], color, margin: 0, fontFamily: fonts.display, textAlign: "center" }}
      >{message}</motion.h2>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{ fontSize: fontSizes.lg, color: colors.text.muted, margin: 0, fontFamily: fonts.body }}
      >{correct} de {total} correctas</motion.p>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
        style={{ display: "flex", gap: spacing.md, marginTop: spacing.sm }}
      >
        <AnimatedButton color={color} onClick={onReplay}>Jugar de nuevo</AnimatedButton>
        <AnimatedButton variant="secondary" onClick={onBack}>Volver</AnimatedButton>
      </motion.div>
    </motion.div>
  );
};
