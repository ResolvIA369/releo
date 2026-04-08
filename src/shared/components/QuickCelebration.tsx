"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickCelebrationProps {
  active: boolean;
  type?: "check" | "stars" | "confetti";
}

const STAR_POSITIONS = [
  { x: -30, y: -20, delay: 0 },
  { x: 20, y: -35, delay: 0.05 },
  { x: 35, y: 5, delay: 0.1 },
  { x: -25, y: 15, delay: 0.08 },
  { x: 5, y: -40, delay: 0.03 },
];

export const QuickCelebration: React.FC<QuickCelebrationProps> = ({
  active,
  type = "check",
}) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3, type: "spring", damping: 10 }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          {type === "check" && (
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              style={{
                fontSize: 64,
                display: "block",
                filter: "drop-shadow(0 4px 8px rgba(72, 187, 120, 0.4))",
              }}
            >
              ✅
            </motion.span>
          )}

          {/* Small stars that disperse */}
          {(type === "check" || type === "stars") &&
            STAR_POSITIONS.map((pos, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  delay: pos.delay,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  fontSize: 18,
                }}
              >
                ⭐
              </motion.span>
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
