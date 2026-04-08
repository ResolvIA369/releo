"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressLineProps {
  progress: number; // 0-1
  color?: string;
}

export const ProgressLine: React.FC<ProgressLineProps> = ({
  progress,
  color = "#48bb78",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: "rgba(0,0,0,0.05)",
        zIndex: 10,
      }}
    >
      <motion.div
        animate={{ width: `${Math.min(progress * 100, 100)}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          height: "100%",
          backgroundColor: color,
        }}
      />
    </div>
  );
};
