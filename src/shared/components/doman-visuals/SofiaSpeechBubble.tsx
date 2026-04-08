"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { fonts, spacing, radii } from "@/shared/styles/design-tokens";

interface SofiaSpeechBubbleProps {
  text: string;
  visible: boolean;
  worldColor?: string;
}

export const SofiaSpeechBubble: React.FC<SofiaSpeechBubbleProps> = ({
  text,
  visible,
  worldColor = "#667eea",
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: spacing.md,
            maxWidth: 460,
            width: "100%",
          }}
        >
          {/* Sofia full body on the left — large on desktop */}
          <SofiaAvatar size={280} speaking={true} mood="motivating" />

          {/* Speech bubble */}
          <div style={{
            flex: 1,
            padding: `${spacing.md}px ${spacing.lg}px`,
            borderRadius: radii.xl,
            backgroundColor: `${worldColor}12`,
            border: `2px solid ${worldColor}30`,
            position: "relative",
          }}>
            <p style={{
              fontSize: 18,
              color: "#2d3748",
              fontFamily: fonts.display,
              lineHeight: 1.4,
              margin: 0,
            }}>
              {text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
