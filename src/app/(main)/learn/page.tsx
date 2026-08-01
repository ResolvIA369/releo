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
import { WORD_IMAGE_MAP } from "@/shared/constants/word-images";

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
              const thumb = `/thumbnails/thumbnail-sesion-${String(session.id).padStart(2, "0")}.png`;

              return (
                <motion.button
                  key={session.id}
                  variants={staggerItem}
                  whileHover={{ y: -2, boxShadow: shadows.glow(world.color) }}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    display: "flex", alignItems: "center", gap: spacing.md,
                    padding: `${spacing.md}px ${spacing.lg}px`,
                    backgroundColor: colors.bg.card,
                    border: isCompleted ? `3px solid #22C55E` : `2px solid ${colors.border.light}`,
                    borderRadius: radii.lg,
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: shadows.sm,
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Thumbnail background */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url(${thumb})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      zIndex: 0,
                    }}
                  />
                  {/* Dark overlay so text/status stay legible over the image */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute", inset: 0,
                      backgroundColor: "rgba(0,0,0,0.35)",
                      zIndex: 1,
                    }}
                  />

                  {/* Status icon */}
                  <span style={{ position: "relative", zIndex: 2, fontSize: 24, flexShrink: 0 }}>
                    {isCompleted ? "✅" : "📖"}
                  </span>

                  <div style={{ position: "relative", zIndex: 2, flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: fontSizes.md, fontWeight: "bold",
                      fontFamily: fonts.display,
                      color: "#ffffff",
                      textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                    }}>
                      {session.words.map((w) => w.text).join(", ")}
                    </div>
                    <div style={{ fontSize: fontSizes.xs, color: "rgba(255,255,255,0.92)", marginTop: 2, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                      <span>Sesión {session.id} —</span>
                      {session.words.map((w) =>
                        WORD_IMAGE_MAP[w.text]
                          ? <img key={w.id} src={WORD_IMAGE_MAP[w.text]} alt={w.text} style={{ height: 18, width: 18, objectFit: "cover", borderRadius: 3, verticalAlign: "middle" }} />
                          : <span key={w.id}>{EMOJI_MAP[w.text] ?? ""}</span>
                      )}
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
            const worldSessions = getWorldSessions(world.id);
            const completed = worldSessions.filter((s) => completedSet.has(s.id)).length;

            return (
              <motion.button
                key={world.id}
                variants={staggerItem}
                whileHover={{ y: -3, boxShadow: shadows.glow(world.color) }}
                onClick={() => setSelectedWorld(world.id)}
                style={{
                  display: "flex", alignItems: "center", gap: spacing.lg,
                  padding: spacing.lg,
                  backgroundColor: colors.bg.card,
                  border: `2px solid ${progress.currentWorldId === world.id ? world.color : colors.border.light}`,
                  borderRadius: radii.xl,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: progress.currentWorldId === world.id ? shadows.glow(world.color) : shadows.sm,
                }}
              >
                <img src={world.image} alt={world.name} style={{
                  width: 70, height: 70, borderRadius: radii.lg, flexShrink: 0, objectFit: "cover",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, fontWeight: "bold", color: world.color }}>
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
