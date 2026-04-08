"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { WORLDS } from "@/features/progression/config/worlds";
import { CURRICULUM, getWorldSessions, type DomanSession } from "@/features/session/config/curriculum";
import { useAppStore } from "@/shared/store/useAppStore";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { staggerContainer, staggerItem, fadeInUp } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";

function LearnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const worldParam = params.get("world");

  const progress = useAppStore((s) => s.progress);
  const progressLoading = useAppStore((s) => s.progressLoading);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(worldParam);
  const [selectedSession, setSelectedSession] = useState<DomanSession | null>(null);

  if (progressLoading) {
    return (
      <div style={{ ...centerStyle, color: colors.text.muted }}>Cargando...</div>
    );
  }

  const completedSet = new Set(progress.completedSessions);

  // ─── Session detail modal ─────────────────────────────────────────
  if (selectedSession) {
    const isCompleted = completedSet.has(selectedSession.id);
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.xl }}>
        <motion.div variants={fadeInUp} initial="initial" animate="animate"
          style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.lg }}
        >
          <button onClick={() => setSelectedSession(null)} style={backBtnStyle}>← Volver</button>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
              Sesión {selectedSession.id}
            </h2>
            <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: spacing.xs }}>
              {selectedSession.words.map((w) => w.text).join(" · ")}
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
            {selectedSession.words.map((w) => (
              <div key={w.id} style={{
                display: "flex", alignItems: "center", gap: spacing.xs,
                padding: `${spacing.sm}px ${spacing.md}px`,
                backgroundColor: colors.bg.card, borderRadius: radii.lg,
                border: `1px solid ${colors.border.light}`,
                fontSize: fontSizes.lg, fontFamily: fonts.display,
              }}>
                <span>{EMOJI_MAP[w.text] ?? ""}</span>
                <span style={{ color: w.fontColor === "red" ? colors.doman.wordRed : colors.doman.wordBlack }}>
                  {w.text}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            <AnimatedButton
              color={selectedSession.worldColor}
              onClick={() => router.push(`/play/word-flash?session=${selectedSession.id}`)}
            >
              {isCompleted ? "Repetir sesión" : "Empezar sesión"}
            </AnimatedButton>
            {isCompleted && (
              <AnimatedButton
                variant="secondary"
                onClick={() => router.push(`/play/word-image-match?world=${selectedSession.phase}`)}
              >
                Práctica libre
              </AnimatedButton>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Session nodes for a world ────────────────────────────────────
  if (selectedWorld) {
    const world = WORLDS.find((w) => w.id === selectedWorld);
    const sessions = getWorldSessions(selectedWorld);
    if (!world || sessions.length === 0) {
      setSelectedWorld(null);
      return null;
    }

    // Find next unlocked session
    const nextSessionId = sessions.find((s) => !completedSet.has(s.id))?.id ?? null;

    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.xl }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <button onClick={() => setSelectedWorld(null)} style={backBtnStyle}>← Mundos</button>

          <motion.div variants={fadeInUp} initial="initial" animate="animate"
            style={{ textAlign: "center", marginBottom: spacing.xl }}
          >
            <img src={world.image} alt={world.name} style={{ width: 160, height: 100, objectFit: "cover", borderRadius: radii.xl }} />
            <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: world.color, margin: `${spacing.sm}px 0 0` }}>
              {world.name}
            </h1>
            <p style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>{world.description}</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
          >
            {sessions.map((session) => {
              const isCompleted = completedSet.has(session.id);
              // TODO: restore lock logic after testing
              const isLocked = false;

              return (
                <motion.button
                  key={session.id}
                  variants={staggerItem}
                  whileHover={{ y: -2, boxShadow: shadows.glow(world.color) }}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    display: "flex", alignItems: "center", gap: spacing.md,
                    padding: `${spacing.md}px ${spacing.lg}px`,
                    backgroundColor: colors.bg.card,
                    border: `2px solid ${colors.border.light}`,
                    borderRadius: radii.lg,
                    cursor: "pointer",
                    opacity: 1,
                    textAlign: "left",
                    boxShadow: shadows.sm,
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Status icon */}
                  <span style={{ fontSize: 24, flexShrink: 0 }}>
                    {isCompleted ? "✅" : "📖"}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: fontSizes.md, fontWeight: "bold",
                      fontFamily: fonts.display,
                      color: isLocked ? colors.text.muted : colors.text.primary,
                    }}>
                      {session.words.map((w) => w.text).join(", ")}
                    </div>
                    <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder, marginTop: 2 }}>
                      Sesión {session.id} — {session.words.map((w) => EMOJI_MAP[w.text] ?? "").join(" ")}
                    </div>
                  </div>

                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── World selector ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.xl }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <motion.div variants={fadeInUp} initial="initial" animate="animate"
          style={{ textAlign: "center", marginBottom: spacing.xl }}
        >
          <span style={{ fontSize: 48 }}>📖</span>
          <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: `${spacing.sm}px 0 0` }}>
            Aprender Palabras
          </h1>
          <p style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>
            Elige un mundo para empezar
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
        >
          {WORLDS.map((world) => {
            // TODO: restore unlock logic after testing
            const isUnlocked = true;
            const worldSessions = getWorldSessions(world.id);
            const completed = worldSessions.filter((s) => completedSet.has(s.id)).length;

            return (
              <motion.button
                key={world.id}
                variants={staggerItem}
                whileHover={isUnlocked ? { y: -3, boxShadow: shadows.glow(world.color) } : {}}
                onClick={() => isUnlocked && setSelectedWorld(world.id)}
                disabled={!isUnlocked}
                style={{
                  display: "flex", alignItems: "center", gap: spacing.lg,
                  padding: spacing.lg,
                  backgroundColor: colors.bg.card,
                  border: `2px solid ${progress.currentWorldId === world.id ? world.color : colors.border.light}`,
                  borderRadius: radii.xl,
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  opacity: isUnlocked ? 1 : 0.4,
                  textAlign: "left",
                  boxShadow: progress.currentWorldId === world.id ? shadows.glow(world.color) : shadows.sm,
                }}
              >
                {isUnlocked ? (
                  <img src={world.image} alt={world.name} style={{
                    width: 70, height: 70, borderRadius: radii.lg, flexShrink: 0, objectFit: "cover",
                  }} />
                ) : (
                  <div style={{
                    width: 70, height: 70, borderRadius: radii.lg, flexShrink: 0,
                    backgroundColor: colors.bg.secondary,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                  }}>🔒</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, fontWeight: "bold", color: isUnlocked ? world.color : colors.text.muted }}>
                    {world.name}
                  </div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder, marginTop: 2 }}>
                    {completed}/{worldSessions.length} sesiones · Fase {world.phase}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div style={{ ...centerStyle, color: colors.text.muted }}>Cargando...</div>}>
      <LearnContent />
    </Suspense>
  );
}

const centerStyle: React.CSSProperties = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: fonts.body,
};

const backBtnStyle: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  fontSize: fontSizes.md, color: colors.text.muted, fontFamily: fonts.body,
  padding: `${spacing.sm}px 0`, marginBottom: spacing.md,
};
