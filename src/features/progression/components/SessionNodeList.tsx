"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { DomanSession } from "@/features/session/config/curriculum";
import { getWorldSessions } from "@/features/session/config/curriculum";
import { WORLDS } from "@/features/progression/config/worlds";
import { staggerContainer, staggerItem } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { AnimatedButton } from "@/shared/components/AnimatedButton";

interface SessionNodeListProps {
  worldId: string;
  completedSessions: number[];
  onSelectSession: (session: DomanSession) => void;
  onBack: () => void;
}

type NodeStatus = "completed" | "current" | "locked";

function getNodeStatus(sessionId: number, completedSessions: number[], allSessionIds: number[]): NodeStatus {
  if (completedSessions.includes(sessionId)) return "completed";
  const idx = allSessionIds.indexOf(sessionId);
  if (idx === 0 && !completedSessions.includes(sessionId)) return "current";
  if (idx > 0 && completedSessions.includes(allSessionIds[idx - 1])) return "current";
  return "locked";
}

// Session names based on the 5-word categories
const SESSION_NAMES: Record<number, string> = {
  1: "Familia 1", 2: "Familia 2", 3: "Mi Cara", 4: "Mi Cuerpo",
  5: "Mi Casa 1", 6: "Mi Casa 2", 7: "Animales 1", 8: "Animales 2",
  9: "Comida 1", 10: "Comida 2",
  11: "Colores 1", 12: "Colores 2", 13: "Formas 1", 14: "Formas 2",
  15: "Opuestos 1", 16: "Opuestos 2", 17: "Emociones 1", 18: "Emociones 2",
  19: "Naturaleza 1", 20: "Naturaleza 2",
  21: "Verbos 1", 22: "Verbos 2", 23: "Ropa 1", 24: "Ropa 2",
  25: "Escuela 1", 26: "Escuela 2", 27: "Lugares 1", 28: "Lugares 2",
  29: "Transporte 1", 30: "Transporte 2",
  31: "Artículos 1", 32: "Artículos 2", 33: "Preposiciones 1", 34: "Preposiciones 2",
  35: "Pronombres 1", 36: "Pronombres 2", 37: "Tiempo 1", 38: "Tiempo 2",
  39: "Números 1", 40: "Números 2",
  41: "Verbos Av. 1", 42: "Verbos Av. 2", 43: "Adverbios 1", 44: "Adverbios 2",
};

export const SessionNodeList: React.FC<SessionNodeListProps> = ({
  worldId,
  completedSessions,
  onSelectSession,
  onBack,
}) => {
  const world = WORLDS.find((w) => w.id === worldId);
  const sessions = getWorldSessions(worldId);
  const sessionIds = sessions.map((s) => s.id);
  const currentRef = useRef<HTMLDivElement>(null);
  const allCompleted = sessions.every((s) => completedSessions.includes(s.id));

  // Scroll to current node on mount
  useEffect(() => {
    setTimeout(() => {
      currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
  }, []);

  if (!world) return null;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: colors.bg.primary,
      fontFamily: fonts.body,
      padding: spacing.lg,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.xl,
        maxWidth: 480,
        margin: "0 auto",
        paddingBottom: spacing.lg,
      }}>
        <AnimatedButton variant="secondary" size="sm" onClick={onBack}>←</AnimatedButton>
        <span style={{ fontSize: 28 }}>{world.icon}</span>
        <div>
          <h1 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: world.color, margin: 0 }}>
            {world.name}
          </h1>
          <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, margin: 0 }}>
            {completedSessions.filter((id) => sessionIds.includes(id)).length}/{sessions.length} sesiones
          </p>
        </div>
      </div>

      {/* Session nodes */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: 480,
          margin: "0 auto",
          position: "relative",
          paddingLeft: 28,
        }}
      >
        {/* Connecting line */}
        <div style={{
          position: "absolute",
          left: 14,
          top: 20,
          bottom: 20,
          width: 2,
          backgroundColor: colors.border.light,
          zIndex: 0,
        }} />

        {sessions.map((session) => {
          const status = getNodeStatus(session.id, completedSessions, sessionIds);
          const isCurrent = status === "current";
          const isCompleted = status === "completed";
          const isLocked = status === "locked";
          const name = SESSION_NAMES[session.id] ?? `Sesión ${session.id}`;

          return (
            <motion.div
              key={session.id}
              ref={isCurrent ? currentRef : undefined}
              variants={staggerItem}
              onClick={() => !isLocked && onSelectSession(session)}
              style={{
                display: "flex",
                gap: spacing.md,
                padding: `${spacing.md}px 0`,
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.45 : 1,
                position: "relative",
              }}
            >
              {/* Node dot */}
              <motion.div
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={isCurrent ? { repeat: Infinity, duration: 1.5 } : {}}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: isCompleted ? colors.success : isCurrent ? world.color : colors.bg.secondary,
                  border: `3px solid ${isCompleted ? colors.success : isCurrent ? world.color : colors.border.light}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: isCompleted || isCurrent ? "#fff" : colors.text.muted,
                  flexShrink: 0,
                  zIndex: 1,
                  marginLeft: -14,
                  boxShadow: isCurrent ? shadows.glow(world.color) : "none",
                }}
              >
                {isCompleted ? "✓" : isLocked ? "🔒" : ""}
              </motion.div>

              {/* Node content */}
              <div style={{
                flex: 1,
                padding: `${spacing.sm}px ${spacing.md}px`,
                backgroundColor: colors.bg.card,
                borderRadius: radii.lg,
                border: `2px solid ${isCurrent ? world.color : colors.border.light}`,
                boxShadow: isCurrent ? shadows.glow(world.color) : shadows.sm,
                transition: "border-color 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: fontSizes.md,
                    fontWeight: "bold",
                    fontFamily: fonts.display,
                    color: isLocked ? colors.text.muted : isCompleted ? colors.success : world.color,
                  }}>
                    {session.id - sessionIds[0] + 1}. {name}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: fontSizes.xs,
                      backgroundColor: world.color,
                      color: "#fff",
                      padding: `2px ${spacing.sm}px`,
                      borderRadius: radii.sm,
                      fontWeight: "bold",
                    }}>
                      SIGUIENTE
                    </span>
                  )}
                </div>

                {/* Word chips */}
                {!isLocked && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: spacing.xs }}>
                    {session.words.map((w) => (
                      <span key={w.id} style={{
                        fontSize: fontSizes.xs,
                        padding: `1px ${spacing.xs}px`,
                        backgroundColor: isCompleted ? `${colors.success}15` : `${world.color}15`,
                        color: isCompleted ? colors.success : world.color,
                        borderRadius: radii.sm,
                      }}>
                        {w.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Practice games node */}
        <motion.div
          variants={staggerItem}
          style={{
            display: "flex",
            gap: spacing.md,
            padding: `${spacing.md}px 0`,
            opacity: allCompleted ? 1 : 0.4,
            cursor: allCompleted ? "pointer" : "not-allowed",
            position: "relative",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            backgroundColor: allCompleted ? "#f093fb" : colors.bg.secondary,
            border: `3px solid ${allCompleted ? "#f093fb" : colors.border.light}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0, zIndex: 1, marginLeft: -14,
          }}>
            🎮
          </div>
          <div style={{
            flex: 1, padding: `${spacing.sm}px ${spacing.md}px`,
            backgroundColor: colors.bg.card, borderRadius: radii.lg,
            border: `2px solid ${allCompleted ? "#f093fb" : colors.border.light}`,
            boxShadow: shadows.sm,
          }}>
            <span style={{
              fontSize: fontSizes.md, fontWeight: "bold", fontFamily: fonts.display,
              color: allCompleted ? "#f093fb" : colors.text.muted,
            }}>
              Juegos de Práctica
            </span>
            <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, margin: `2px 0 0` }}>
              {allCompleted ? "¡Practica las 50 palabras jugando!" : `Completa las ${sessions.length} sesiones para desbloquear`}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
