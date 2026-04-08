"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { colors, spacing, radii, fonts, fontSizes } from "@/shared/styles/design-tokens";

interface CountdownTimerProps {
  seconds: number;
  onTimeUp: () => void;
  color?: string;
  size?: "sm" | "md" | "lg";
  showSeconds?: boolean;
}

const SIZE_MAP = {
  sm: { box: 40, font: fontSizes.lg, icon: 18 },
  md: { box: 56, font: fontSizes["2xl"], icon: 24 },
  lg: { box: 72, font: fontSizes["3xl"], icon: 32 },
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  onTimeUp,
  color = colors.brand.primary,
  size = "md",
  showSeconds = true,
}) => {
  const [remaining, setRemaining] = useState(seconds);
  const s = SIZE_MAP[size];
  const isUrgent = remaining <= 3;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onTimeUp]);

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
      transition={isUrgent ? { repeat: Infinity, duration: 0.6 } : {}}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.xs,
        padding: `${spacing.xs}px ${spacing.sm}px`,
        borderRadius: radii.lg,
        backgroundColor: isUrgent ? "#fed7d7" : `${color}15`,
        transition: "background-color 0.3s",
      }}
    >
      <motion.span
        animate={isUrgent ? { rotate: [0, 15, -15, 0] } : {}}
        transition={isUrgent ? { duration: 0.4, repeat: Infinity } : {}}
        style={{ fontSize: s.icon }}
      >
        ⏳
      </motion.span>
      {showSeconds && (
        <span
          style={{
            fontSize: s.font,
            fontWeight: "bold",
            fontFamily: fonts.display,
            color: isUrgent ? colors.error : color,
            minWidth: 24,
            textAlign: "center",
            transition: "color 0.3s",
          }}
        >
          {remaining}
        </span>
      )}
    </motion.div>
  );
};
