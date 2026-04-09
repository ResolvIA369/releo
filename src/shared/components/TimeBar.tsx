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

  // Leo rides the top of the bar — anchored to where the colored
  // fill ends. He bobs slightly when urgent (panicked).
  const leoBottom = `calc(${pct}% - 22px)`;

  return (
    <div style={{
      width: 24,
      height: "100%",
      minHeight: 200,
      borderRadius: radii.pill,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      position: "relative",
    }}>
      {/* Track */}
      <div style={{
        position: "absolute",
        left: 5, right: 5,
        top: 0, bottom: 0,
        backgroundColor: `${color}15`,
        borderRadius: radii.pill,
        overflow: "hidden",
      }}>
        <motion.div
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.15, ease: "linear" }}
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
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

      {/* Leo riding the bar */}
      <motion.img
        src="/images/Leo/motivando.png"
        alt="Leo"
        animate={isUrgent ? { rotate: [-8, 8, -8], y: [0, -3, 0] } : { y: [0, -2, 0] }}
        transition={isUrgent
          ? { repeat: Infinity, duration: 0.4 }
          : { repeat: Infinity, duration: 1.6 }}
        style={{
          position: "absolute",
          left: "50%",
          bottom: leoBottom,
          width: 44,
          height: 44,
          marginLeft: -22,
          objectFit: "contain",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
          pointerEvents: "none",
          zIndex: 2,
          transition: "bottom 0.15s linear",
        }}
      />
    </div>
  );
}
