"use client";

import React from "react";
import { motion } from "framer-motion";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";

interface FarewellDisplayProps {
  words: string[];
  sofiaMessage: string;
  affirmation: string;
  stars?: number;
}

export const FarewellDisplay: React.FC<FarewellDisplayProps> = ({
  words,
  sofiaMessage,
  affirmation,
  stars = 3,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        padding: "0 32px",
      }}
    >
      {/* Sofia's farewell */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
          <SofiaAvatar size={160} speaking={false} mood="clapping" />
        </div>
        <div style={{ fontSize: 20, color: "#2d3748", fontFamily: "Arial Rounded MT Bold, Arial, sans-serif" }}>
          {sofiaMessage}
        </div>
        <div style={{ fontSize: 16, color: "#718096", marginTop: 4 }}>
          Hoy aprendimos:
        </div>
      </motion.div>

      {/* Words with emojis */}
      <motion.div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        {words.map((word, i) => (
          <motion.div
            key={word}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.2 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 24,
              fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
              color: "#2d3748",
            }}
          >
            <span>{word}</span>
            <span style={{ fontSize: 28 }}>{EMOJI_MAP[word] ?? ""}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Stars */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 + words.length * 0.2 + 0.3, type: "spring", damping: 8 }}
        style={{ display: "flex", gap: 8, fontSize: 40 }}
      >
        {Array.from({ length: 3 }, (_, i) => (
          <motion.span
            key={i}
            initial={{ rotateZ: -30, scale: 0 }}
            animate={{ rotateZ: 0, scale: 1 }}
            transition={{ delay: 0.5 + words.length * 0.2 + 0.4 + i * 0.15, type: "spring", damping: 8 }}
            style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}
          >
            ⭐
          </motion.span>
        ))}
      </motion.div>

      {/* Affirmation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + words.length * 0.2 + 1 }}
        style={{
          fontSize: 18,
          color: "#667eea",
          fontStyle: "italic",
          fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
          margin: 0,
          textAlign: "center",
        }}
      >
        "{affirmation}"
      </motion.p>
    </motion.div>
  );
};
