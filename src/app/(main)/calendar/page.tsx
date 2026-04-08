"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/shared/store/useAppStore";
import { createPersistenceManager } from "@/features/persistence/services/db";
import type { PersistedSession } from "@/features/persistence/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_NAMES_ES = ["L", "M", "M", "J", "V", "S", "D"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // JS: 0=Sun, we want 0=Mon
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function CalendarPage() {
  const progress = useAppStore((s) => s.progress);
  const loading = useAppStore((s) => s.progressLoading);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [playedDates, setPlayedDates] = useState<Set<string>>(new Set());

  // Load sessions from IndexedDB to get actual dates played
  useEffect(() => {
    createPersistenceManager().getSessions().then((sessions: PersistedSession[]) => {
      const dates = new Set<string>();
      for (const s of sessions) {
        if (s.savedAt) {
          dates.add(toDateKey(new Date(s.savedAt)));
        }
      }
      // Also include lastPlayedDate from progress
      if (progress.lastPlayedDate) {
        dates.add(progress.lastPlayedDate);
      }
      setPlayedDates(dates);
    });
  }, [progress.lastPlayedDate]);

  const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const todayKey = toDateKey(today);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Compute streak dates (consecutive days ending at lastPlayedDate)
  const streakDates = useMemo(() => {
    const set = new Set<string>();
    if (progress.lastPlayedDate && progress.streakDays > 0) {
      const last = new Date(progress.lastPlayedDate + "T12:00:00");
      for (let i = 0; i < progress.streakDays; i++) {
        const d = new Date(last);
        d.setDate(d.getDate() - i);
        set.add(toDateKey(d));
      }
    }
    return set;
  }, [progress.lastPlayedDate, progress.streakDays]);

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        ...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: colors.bg.primary,
      fontFamily: fonts.body, padding: spacing.lg,
    }}>
      <motion.div variants={fadeInUp} initial="initial" animate="animate"
        style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.lg }}>

        {/* Month navigation */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backgroundColor: colors.bg.card, borderRadius: radii.xl,
          padding: `${spacing.md}px ${spacing.lg}px`, boxShadow: shadows.sm,
        }}>
          <button onClick={goPrev} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: fontSizes.xl, color: colors.brand.primary, padding: spacing.xs,
          }}>
            &#8249;
          </button>
          <span style={{
            fontSize: fontSizes.lg, fontFamily: fonts.display, fontWeight: "bold",
            color: colors.text.primary,
          }}>
            {MONTH_NAMES_ES[viewMonth]} {viewYear}
          </span>
          <button onClick={goNext} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: fontSizes.xl, color: colors.brand.primary, padding: spacing.xs,
          }}>
            &#8250;
          </button>
        </div>

        {/* Calendar grid */}
        <div style={{
          backgroundColor: colors.bg.card, borderRadius: radii.xl,
          padding: spacing.md, boxShadow: shadows.md,
        }}>
          {/* Day name headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: spacing.sm }}>
            {DAY_NAMES_ES.map((name, i) => (
              <div key={i} style={{
                textAlign: "center", fontSize: fontSizes.xs, fontWeight: "bold",
                color: colors.text.placeholder, padding: `${spacing.xs}px 0`,
              }}>
                {name}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} style={{ aspectRatio: "1", padding: 4 }} />;
              }

              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateKey === todayKey;
              const practiced = playedDates.has(dateKey);
              const isStreak = streakDates.has(dateKey);

              return (
                <motion.div key={dateKey} variants={staggerItem}
                  style={{
                    aspectRatio: "1",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    borderRadius: radii.sm, position: "relative",
                    backgroundColor: isToday
                      ? `${colors.brand.primary}15`
                      : practiced
                        ? `${colors.success}10`
                        : "transparent",
                    border: isToday ? `2px solid ${colors.brand.primary}` : "2px solid transparent",
                  }}>
                  <span style={{
                    fontSize: fontSizes.sm, fontWeight: isToday ? "bold" : "normal",
                    color: isToday ? colors.brand.primary : practiced ? colors.text.primary : colors.text.muted,
                  }}>
                    {day}
                  </span>
                  {practiced && (
                    <span style={{ fontSize: 10, lineHeight: 1, marginTop: 1 }}>
                      {isStreak ? "\uD83D\uDD25" : "\u2B50"}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Streak info */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.sm,
        }}>
          <div style={{
            backgroundColor: colors.bg.card, borderRadius: radii.xl,
            padding: spacing.md, textAlign: "center", boxShadow: shadows.sm,
          }}>
            <span style={{ fontSize: 28 }}>{"\uD83D\uDD25"}</span>
            <div style={{
              fontSize: fontSizes.xl, fontWeight: "bold",
              fontFamily: fonts.display, color: colors.warning,
            }}>
              {progress.streakDays}
            </div>
            <div style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>
              Racha actual
            </div>
          </div>
          <div style={{
            backgroundColor: colors.bg.card, borderRadius: radii.xl,
            padding: spacing.md, textAlign: "center", boxShadow: shadows.sm,
          }}>
            <span style={{ fontSize: 28 }}>{"\u2B50"}</span>
            <div style={{
              fontSize: fontSizes.xl, fontWeight: "bold",
              fontFamily: fonts.display, color: colors.brand.primary,
            }}>
              {progress.longestStreak}
            </div>
            <div style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>
              Mejor racha
            </div>
          </div>
        </div>

        {/* Summary text */}
        <div style={{
          textAlign: "center", fontSize: fontSizes.sm, color: colors.text.muted,
          padding: `0 ${spacing.md}px`,
        }}>
          Racha actual: {progress.streakDays} d{"\u00ED"}as &middot; Mejor racha: {progress.longestStreak} d{"\u00ED"}as
        </div>
      </motion.div>
    </div>
  );
}
