"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressLineProps {
  progress: number; // 0-1
  color?: string;
  /** Show a thicker bar with phase label (for demo/recording mode) */
  label?: string;
}

export const ProgressLine: React.FC<ProgressLineProps> = ({
  progress,
  color = "#48bb78",
  label,
}) => {
  const thick = !!label;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: thick ? 28 : 4,
        backgroundColor: "rgba(0,0,0,0.08)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
      }}
    >
      <motion.div
        animate={{ width: `${Math.min(progress * 100, 100)}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          height: "100%",
          backgroundColor: color,
          borderRadius: thick ? "0 6px 6px 0" : 0,
          minWidth: thick ? 2 : 0,
        }}
      />
      {thick && label && (
        <span style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 11,
          fontWeight: "bold",
          color: progress > 0.5 ? "#fff" : "#555",
          fontFamily: "Arial, sans-serif",
          whiteSpace: "nowrap",
          textShadow: progress > 0.5 ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
          pointerEvents: "none",
        }}>
          {label} — {Math.round(progress * 100)}%
        </span>
      )}
    </div>
  );
};
