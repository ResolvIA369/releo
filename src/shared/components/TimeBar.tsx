"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { colors, radii } from "@/shared/styles/design-tokens";

interface TimeBarProps {
  seconds: number;
  onTimeUp: () => void;
  color?: string;
  paused?: boolean;
  /** Unique key to reset the timer */
  resetKey?: number;
}

export function TimeBar({
  seconds,
  onTimeUp,
  color = "#4299e1",
  paused = false,
  resetKey = 0,
}: TimeBarProps) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    firedRef.current = false;
  }, [seconds, resetKey]);

  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 0.1) {
          clearInterval(intervalRef.current);
          if (!firedRef.current) {
            firedRef.current = true;
            setTimeout(onTimeUp, 0);
          }
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [paused, onTimeUp, resetKey]);

  const pct = Math.max(0, (remaining / seconds) * 100);
  const isUrgent = pct < 30;
  const barColor = isUrgent ? colors.error : pct < 60 ? colors.warning : color;

  return (
    <div style={{
      width: 14,
      height: "100%",
      minHeight: 200,
      backgroundColor: `${color}15`,
      borderRadius: radii.pill,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      position: "relative",
    }}>
      <motion.div
        animate={{ height: `${pct}%` }}
        transition={{ duration: 0.15, ease: "linear" }}
        style={{
          width: "100%",
          backgroundColor: barColor,
          borderRadius: radii.pill,
          transition: "background-color 0.3s",
        }}
      />
      {isUrgent && (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: radii.pill,
            border: `2px solid ${colors.error}`,
          }}
        />
      )}
    </div>
  );
}
