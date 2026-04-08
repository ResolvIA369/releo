"use client";

import React from "react";
import { motion } from "framer-motion";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";

interface ContextSentenceDisplayProps {
  sentence: string;
  learnedWords: string[];
  activeWord?: string | null;
  worldColor?: string;
}

export const ContextSentenceDisplay: React.FC<ContextSentenceDisplayProps> = ({
  sentence,
  learnedWords,
  activeWord,
  worldColor = "#48bb78",
}) => {
  const tokens = sentence.split(/\s+/);
  const learnedSet = new Set(learnedWords.map((w) => w.toLowerCase()));
  const emojis = learnedWords.map((w) => EMOJI_MAP[w] ?? "").filter(Boolean);

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
        gap: 24,
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        padding: "0 32px",
      }}
    >
      {/* Sentence with highlights */}
      <p
        style={{
          fontSize: 30,
          fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
          lineHeight: 1.6,
          textAlign: "center",
          margin: 0,
          maxWidth: 600,
        }}
      >
        {tokens.map((token, i) => {
          const clean = token.toLowerCase().replace(/[.,!?]/g, "");
          const isLearned = learnedSet.has(clean);
          const isActive = activeWord?.toLowerCase() === clean;

          return (
            <React.Fragment key={i}>
              <motion.span
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  color: isLearned ? worldColor : "#999",
                  fontWeight: isLearned ? "bold" : "normal",
                  transition: "color 0.3s",
                }}
              >
                {token}
              </motion.span>
              {i < tokens.length - 1 ? " " : ""}
            </React.Fragment>
          );
        })}
      </p>

      {/* Emojis row */}
      {emojis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          style={{ display: "flex", gap: 16, fontSize: 40 }}
        >
          {emojis.map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.15, type: "spring", damping: 8 }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
