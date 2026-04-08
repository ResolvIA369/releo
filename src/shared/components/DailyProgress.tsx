"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createPersistenceManager } from "@/features/persistence/services/db";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

const TARGET_SESSIONS = 3;
const RING_SIZE = 96;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(count: number): string {
  if (count >= TARGET_SESSIONS) return colors.success;
  if (count >= 1) return colors.warning;
  return colors.border.medium;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function DailyProgress() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pm = createPersistenceManager();
        const sessions = await pm.getSessions();
        const todaySessions = sessions.filter((s) => isToday(s.startedAt));
        if (!cancelled) setCount(todaySessions.length);
      } catch {
        // IndexedDB may not be available (SSR / test)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const capped = Math.min(count, TARGET_SESSIONS);
  const progress = capped / TARGET_SESSIONS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const ringColor = getColor(count);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.bg.card,
        borderRadius: radii.xl,
        boxShadow: shadows.sm,
        border: `2px solid ${ringColor}30`,
        maxWidth: 400,
        margin: "0 auto",
        marginBottom: spacing.xl,
      }}
    >
      {/* Circular progress ring */}
      <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
        <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.border.light}
            strokeWidth={STROKE_WIDTH}
          />
          {/* Animated progress arc */}
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        {/* Center number */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.span
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 10, mass: 0.5 }}
            style={{
              fontSize: fontSizes["2xl"],
              fontFamily: fonts.display,
              fontWeight: "bold",
              color: ringColor,
            }}
          >
            {capped}
          </motion.span>
        </div>
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            fontSize: fontSizes.md,
            fontFamily: fonts.display,
            fontWeight: "bold",
            color: colors.text.primary,
          }}
        >
          {count} de {TARGET_SESSIONS} sesiones hoy
        </div>
        <div style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: 2 }}>
          {count === 0
            ? "Comienza tu primera sesion del dia"
            : count < TARGET_SESSIONS
              ? `Faltan ${TARGET_SESSIONS - count} para completar el dia`
              : "Meta diaria completada!"}
        </div>
      </div>
    </motion.div>
  );
}
