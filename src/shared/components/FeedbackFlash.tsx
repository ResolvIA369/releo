"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { correctPulse, wrongShake } from "@/shared/styles/animations";
import { colors, radii, spacing, fontSizes, fonts, zIndex } from "@/shared/styles/design-tokens";

interface FeedbackFlashProps {
  type: "correct" | "wrong" | null;
  message?: string;
  onDone?: () => void;
  durationMs?: number;
}

export const FeedbackFlash: React.FC<FeedbackFlashProps> = ({ type, message, onDone, durationMs = 1200 }) => {
  useEffect(() => {
    if (!type) return;
    const timer = setTimeout(() => onDone?.(), durationMs);
    return () => clearTimeout(timer);
  }, [type, durationMs, onDone]);

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 12 }}
          style={{
            position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
            zIndex: zIndex.celebration,
            padding: `${spacing.md}px ${spacing.xl}px`, borderRadius: radii.pill,
            backgroundColor: type === "correct" ? colors.success : colors.brand.primary,
            color: colors.text.inverse, fontSize: fontSizes.lg,
            fontWeight: "bold", fontFamily: fonts.display,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", gap: spacing.sm,
          }}
        >
          <motion.span
            variants={type === "correct" ? correctPulse : wrongShake}
            initial="initial" animate="animate"
            style={{ fontSize: fontSizes.xl }}
          >
            {type === "correct" ? "⭐" : "💪"}
          </motion.span>
          {message ?? (type === "correct" ? "¡Correcto!" : "¡Sigue intentando!")}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
