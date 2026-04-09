"use client";

import React, { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameSessionState } from "../types";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { fadeInUp } from "@/shared/styles/animations";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { LeoCompanion, useLeo } from "@/shared/components/LeoCompanion";
import { RewardsProvider } from "@/shared/components/RewardsLayer";

// Pause context so child games can react to pause state
const PauseContext = createContext({ paused: false, pause: () => {}, resume: () => {} });
export const usePause = () => useContext(PauseContext);

// Leo context so games can trigger Leo's reactions
type LeoActions = ReturnType<typeof useLeo>;
const LeoContext = createContext<LeoActions>({ mood: "idle", cheer: () => {}, celebrate: () => {}, encourage: () => {}, clap: () => {}, think: () => {} });
export const useLeoContext = () => useContext(LeoContext);

interface GameShellProps {
  title: string;
  icon: string;
  color: string;
  session: GameSessionState;
  onBack: () => void;
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({ title, icon, color, session, onBack, children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [paused, setPaused] = useState(false);
  const leo = useLeo();

  const handlePause = useCallback(() => {
    setPaused(true);
    setShowMenu(true);
  }, []);

  const handleResume = useCallback(() => {
    setPaused(false);
    setShowMenu(false);
  }, []);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => { setPaused(false); setShowMenu(false); }, []);

  return (
    <PauseContext.Provider value={{ paused, pause, resume }}>
    <LeoContext.Provider value={leo}>
    <RewardsProvider>
      <div style={{ minHeight: "100vh", height: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `${spacing.sm}px ${spacing.lg}px`,
            backgroundColor: colors.bg.card, borderBottom: `2px solid ${colors.border.light}`, boxShadow: shadows.sm,
          }}
        >
          {/* Pause button */}
          <button onClick={handlePause} style={iconBtnStyle} aria-label="Pausar">
            ⏸
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSizes.md, fontWeight: "bold", color, fontFamily: fonts.display }}>
            <span>{icon}</span><span>{title}</span>
          </div>

          <div style={{ display: "flex", gap: spacing.md, fontSize: fontSizes.sm, color: colors.text.muted }}>
            <span>✅ {session.correctAttempts}/{session.totalAttempts}</span>
          </div>
        </motion.div>

        {/* Content — fills remaining space, scrollable when content overflows */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}>
          <div style={{
            minHeight: "100%",
            padding: spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}>
            <div style={{ width: "100%", maxWidth: 1000 }}>
              {children}
            </div>
          </div>
        </motion.div>

        {/* Pause / Menu overlay */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100,
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  backgroundColor: colors.bg.card,
                  borderRadius: radii.xl,
                  padding: spacing.xl,
                  maxWidth: 320,
                  width: "90%",
                  boxShadow: shadows.lg,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: spacing.md,
                  textAlign: "center",
                }}
              >
                <SofiaAvatar size={48} speaking={false} />
                <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
                  Pausado
                </h2>

                {session.totalAttempts > 0 && (
                  <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0 }}>
                    {session.correctAttempts}/{session.totalAttempts} correctas
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, width: "100%", marginTop: spacing.sm }}>
                  <button
                    onClick={handleResume}
                    style={{
                      padding: `${spacing.md}px`, borderRadius: radii.lg,
                      backgroundColor: color, color: "#fff",
                      border: "none", fontSize: fontSizes.md, fontWeight: "bold",
                      fontFamily: fonts.display, cursor: "pointer", minHeight: 48,
                    }}
                  >
                    Continuar
                  </button>
                  <button
                    onClick={onBack}
                    style={{
                      padding: `${spacing.md}px`, borderRadius: radii.lg,
                      backgroundColor: colors.bg.secondary, color: colors.text.muted,
                      border: `1px solid ${colors.border.light}`, fontSize: fontSizes.md,
                      fontFamily: fonts.body, cursor: "pointer", minHeight: 48,
                    }}
                  >
                    Volver al menu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leo the Lion companion */}
        {!showMenu && <LeoCompanion mood={leo.mood} size="md" position="right" />}
      </div>
    </RewardsProvider>
    </LeoContext.Provider>
    </PauseContext.Provider>
  );
};

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(0,0,0,0.1)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", fontSize: 18, color: "#666",
};
