"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioWavesProps {
  active: boolean;
  color?: string;
}

const BAR_HEIGHTS = [12, 20, 14];
const BAR_DELAYS = [0, 0.15, 0.08];

export const AudioWaves: React.FC<AudioWavesProps> = ({ active, color = "#a0aec0" }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            height: 24,
            padding: "0 4px",
          }}
        >
          {BAR_HEIGHTS.map((maxH, i) => (
            <motion.div
              key={i}
              animate={{
                height: [4, maxH, 6, maxH * 0.8, 4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: BAR_DELAYS[i],
                ease: "easeInOut",
              }}
              style={{
                width: 3,
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
