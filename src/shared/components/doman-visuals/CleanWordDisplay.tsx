"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CleanWordDisplayProps {
  word: string;
  fontColor?: "red" | "black";
  fontSize?: number;
  wordKey?: string;
}

export const CleanWordDisplay: React.FC<CleanWordDisplayProps> = ({
  word,
  fontColor = "red",
  fontSize = 96,
  wordKey,
}) => {
  const color = fontColor === "red" ? "#e53e3e" : "#2d3748";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={wordKey ?? word}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: "bold",
            color,
            fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
            textAlign: "center",
            lineHeight: 1.1,
            userSelect: "none",
          }}
        >
          {word}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
