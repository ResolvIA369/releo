"use client";

import React, { useState, useCallback, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameSessionState } from "../types";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { fadeInUp } from "@/shared/styles/animations";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { LeoCompanion, useLeo } from "@/shared/components/LeoCompanion";

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
  // Por defecto el contenido se centra verticalmente (bueno para pantallas
  // cortas tipo "resultado"). Los juegos con gameplay inmersivo (canvas
  // grande con aspect-ratio fijo) pueden terminar mucho mas bajos que el
  // viewport en mobile-portrait (el ancho manda, no la altura), y centrar
  // deja franjas vacias arriba/abajo en vez de aprovechar la pantalla.
  // "top" empaqueta el contenido arriba en lugar de centrarlo. Default
  // "center" preserva el comportamiento actual de todos los demas juegos.
  contentAlign?: "center" | "top";
  // Modo "el canvas es el elemento dominante" (QA sep-2026, Leo Vuela):
  // la barra superior deja de empujar el contenido hacia abajo — pasa a
  // flotar como overlay (mismo tratamiento de contraste que los botones
  // ◀ ▶ de ArcadeHud: fondo translucido + blur + sombra, legible sobre
  // cualquier fondo de juego) — y se oculta la mascota LeoCompanion (que
  // en un canvas grande termina pisando el area de juego). Default false
  // preserva el comportamiento exacto de los otros 11 juegos: no cambia
  // nada para ellos a menos que un juego lo pida explicitamente.
  immersive?: boolean;
}

export const GameShell: React.FC<GameShellProps> = ({ title, icon, color, session, onBack, children, contentAlign = "center", immersive = false }) => {
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

  // Scroll to top when a game mounts so the "Empezar" button is visible
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <PauseContext.Provider value={{ paused, pause, resume }}>
    <LeoContext.Provider value={leo}>
      <div style={{ minHeight: "100vh", height: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header — overlay flotante en modo immersive, barra solida normal si no */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
          style={immersive ? {
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `${spacing.sm}px ${spacing.lg}px`,
          } : {
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `${spacing.sm}px ${spacing.lg}px`,
            backgroundColor: colors.bg.card, borderBottom: `2px solid ${colors.border.light}`, boxShadow: shadows.sm,
          }}
        >
          {/* Pause button */}
          <button onClick={handlePause} style={immersive ? overlayIconBtnStyle(color) : iconBtnStyle} aria-label="Pausar">
            ⏸
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSizes.md, fontWeight: "bold", color, fontFamily: fonts.display,
            ...(immersive ? overlayPillStyle(color) : null),
          }}>
            <span>{icon}</span><span>{title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 8px",
              borderRadius: radii.lg,
              backgroundColor: immersive ? "rgba(255,248,225,0.72)" : "#FFF8E1",
              backdropFilter: immersive ? "blur(3px)" : undefined,
              border: "2px solid #FFD54F",
              boxShadow: "0 2px 6px rgba(218,165,32,0.25)",
            }}>
              <img src="/images/cofre.png" alt="cofre" style={{ height: 26, width: 55, flexShrink: 0, objectFit: "contain", display: "block" }} />
              <span style={{ fontSize: fontSizes.sm, fontWeight: "bold", fontFamily: fonts.display, color: "#F59E0B" }}>
                {session.correctAttempts}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content — fills remaining space, scrollable when content overflows.
            En modo immersive la barra de arriba flota encima (position:absolute)
            en vez de empujar esto hacia abajo, asi que esto ocupa el 100% de la
            altura disponible desde arriba. */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" style={{
          flex: 1,
          overflowY: immersive ? "hidden" : "auto",
          WebkitOverflowScrolling: "touch",
        }}>
          <div style={{
            minHeight: "100%",
            height: immersive ? "100%" : undefined,
            padding: immersive ? spacing.xs : spacing.lg,
            paddingTop: immersive ? spacing.xs : contentAlign === "top" ? spacing.sm : spacing.xl,
            paddingBottom: immersive ? spacing.xs : spacing.xl,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: contentAlign === "top" ? "flex-start" : "center",
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

        {/* Leo the Lion companion — oculto en modo immersive: con el canvas
            ocupando casi toda la pantalla no queda margen donde flotar sin
            pisar el area de juego. */}
        {!showMenu && !immersive && <LeoCompanion mood={leo.mood} size="md" position="right" />}
      </div>
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

// Mismo tratamiento de contraste que los botones ◀ ▶ de ArcadeHud
// (MoveButtons): opacidad 0.72 + blur + sombra + borde tenido del color
// del juego — para que el header flotante se lea igual de bien sobre
// cualquier fondo de mundo (cielo, agua, follaje...) sin resolverlo caso
// por caso.
const overlayIconBtnStyle = (color: string): React.CSSProperties => ({
  width: 44, height: 44, borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(3px)",
  border: `2px solid ${color}b3`,
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", fontSize: 18, color: "#666",
});

const overlayPillStyle = (color: string): React.CSSProperties => ({
  padding: "4px 12px",
  borderRadius: 999,
  backgroundColor: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(3px)",
  border: `2px solid ${color}b3`,
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
});
