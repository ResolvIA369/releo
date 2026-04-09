"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wordFlash } from "@/shared/styles/animations";
import { colors, fonts, fontSizes } from "@/shared/styles/design-tokens";
import { fitWordFontSize } from "@/shared/utils/fitText";

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
  const baseSize = SIZE_MAP[size];
  const finalSize = fitWordFontSize(word, baseSize);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={wordKey ?? word}
        variants={wordFlash} initial="initial" animate="animate" exit="exit"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "0 24px", maxWidth: "100%", overflow: "hidden" }}
      >
        <span style={{ fontSize: finalSize, fontWeight: "bold", color: textColor, fontFamily: fonts.display, textAlign: "center", lineHeight: 1.1, whiteSpace: "nowrap", maxWidth: "100%" }}>
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
