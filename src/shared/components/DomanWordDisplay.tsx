"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wordFlash } from "@/shared/styles/animations";
import { colors, fonts, fontSizes } from "@/shared/styles/design-tokens";

interface DomanWordDisplayProps {
  word: string;
  fontColor?: "red" | "black";
  size?: "md" | "lg" | "xl";
  showEmoji?: boolean;
  emoji?: string;
  wordKey?: string;
}

const SIZE_MAP = { md: fontSizes["4xl"], lg: fontSizes.domanWord, xl: fontSizes.domanWordLarge };

export const DomanWordDisplay: React.FC<DomanWordDisplayProps> = ({
  word, fontColor = "red", size = "lg", showEmoji, emoji, wordKey,
}) => {
  const textColor = fontColor === "red" ? colors.doman.wordRed : colors.doman.wordBlack;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={wordKey ?? word}
        variants={wordFlash} initial="initial" animate="animate" exit="exit"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        <span style={{ fontSize: SIZE_MAP[size], fontWeight: "bold", color: textColor, fontFamily: fonts.display, textAlign: "center", lineHeight: 1.1 }}>
          {word}
        </span>
        {showEmoji && emoji && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, delay: 0.15 }}
            style={{ fontSize: fontSizes["4xl"] }}
          >
            {emoji}
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
