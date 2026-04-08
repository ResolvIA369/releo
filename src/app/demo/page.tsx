"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DomanDemoPlayer } from "@/features/session/components/DomanDemoPlayer";
import {
  CURRICULUM,
  getSession,
  getWorldSessions,
  TOTAL_SESSIONS,
} from "@/features/session/config/curriculum";
import { WORLDS } from "@/features/progression/config/worlds";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { staggerContainer, staggerItem, fadeInUp } from "@/shared/styles/animations";
import { AnimatedButton } from "@/shared/components/AnimatedButton";

// ─── Demo content (reads URL params, launches player) ────────────────

function DemoContent() {
  const params = useSearchParams();
  const router = useRouter();

  const sessionParam = params.get("session");
  const worldParam = params.get("world");
  const allParam = params.get("all");

  // Determine which sessions to play
  const sessions = useMemo(() => {
    if (sessionParam) {
      const s = getSession(parseInt(sessionParam, 10));
      return s ? [s] : null;
    }
    if (worldParam) {
      const worldId = `world_${worldParam}`;
      const ws = getWorldSessions(worldId);
      return ws.length > 0 ? ws : null;
    }
    if (allParam === "true") {
      return CURRICULUM;
    }
    return null; // Show selector
  }, [sessionParam, worldParam, allParam]);

  if (sessions) {
    return (
      <DomanDemoPlayer
        sessions={sessions}
        onComplete={() => router.push("/demo")}
        autoFullscreen
      />
    );
  }

  return <DemoSelector />;
}

// ─── Selector screen ─────────────────────────────────────────────────

function DemoSelector() {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState(1);

  const startSession = (session: number) => {
    router.push(`/demo?session=${session}`);
  };

  const startWorld = (worldNum: number) => {
    router.push(`/demo?world=${worldNum}`);
  };

  const startAll = () => {
    router.push(`/demo?all=true`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: colors.bg.primary,
      fontFamily: fonts.body,
      padding: spacing.xl,
      display: "flex",
      justifyContent: "center",
    }}>
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        style={{
          maxWidth: 540,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: spacing.xl,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: fontSizes["3xl"],
            fontFamily: fonts.display,
            color: colors.text.primary,
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}>
            <span>🎬</span> Grabar Sesiones Doman
          </h1>
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, marginTop: spacing.sm }}>
            {TOTAL_SESSIONS} sesiones disponibles — 5 mundos
          </p>
        </div>

        {/* Single session */}
        <Section title="Sesión individual">
          <div style={{ display: "flex", gap: spacing.md, alignItems: "center" }}>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(parseInt(e.target.value, 10))}
              style={{
                flex: 1,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.lg,
                border: `2px solid ${colors.border.light}`,
                fontSize: fontSizes.md,
                fontFamily: fonts.body,
                backgroundColor: colors.bg.card,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {CURRICULUM.map((s) => {
                const world = WORLDS.find((w) => w.id === s.worldId);
                return (
                  <option key={s.id} value={s.id}>
                    Sesión {s.id} — {world?.icon} {s.words.map((w) => w.text).join(", ")}
                  </option>
                );
              })}
            </select>
            <AnimatedButton
              size="sm"
              color={CURRICULUM[selectedSession - 1]?.worldColor}
              onClick={() => startSession(selectedSession)}
            >
              Iniciar
            </AnimatedButton>
          </div>
        </Section>

        {/* By world */}
        <Section title="Por mundo">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}
          >
            {WORLDS.map((world, i) => {
              const worldSessions = getWorldSessions(world.id);
              return (
                <motion.button
                  key={world.id}
                  variants={staggerItem}
                  whileHover={{ y: -2, boxShadow: shadows.glow(world.color) }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startWorld(i + 1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.md,
                    padding: `${spacing.sm}px ${spacing.lg}px`,
                    backgroundColor: colors.bg.card,
                    border: `2px solid ${colors.border.light}`,
                    borderRadius: radii.lg,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{world.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{
                      fontSize: fontSizes.md,
                      fontWeight: "bold",
                      fontFamily: fonts.display,
                      color: world.color,
                    }}>
                      {world.name}
                    </div>
                    <div style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>
                      {worldSessions.length} sesiones — Fase {world.phase}
                    </div>
                  </div>
                  <span style={{ fontSize: fontSizes.sm, color: colors.text.placeholder }}>
                    ▶
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </Section>

        {/* Full curriculum */}
        <Section title="Todo el currículum">
          <AnimatedButton
            size="lg"
            onClick={startAll}
            style={{ width: "100%" }}
          >
            Grabar las {TOTAL_SESSIONS} sesiones
          </AnimatedButton>
          <p style={{ fontSize: fontSizes.xs, color: colors.text.placeholder, textAlign: "center", marginTop: spacing.xs }}>
            Duración aproximada: {Math.round(TOTAL_SESSIONS * 1.5)} minutos
          </p>
        </Section>

        {/* Info */}
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.bg.secondary,
          borderRadius: radii.lg,
          fontSize: fontSizes.sm,
          color: colors.text.muted,
          lineHeight: 1.6,
        }}>
          <strong>Tips para grabar:</strong>
          <ul style={{ margin: `${spacing.xs}px 0 0`, paddingLeft: 20 }}>
            <li>La pantalla entra en fullscreen automáticamente</li>
            <li>Inicia tu grabador de pantalla antes de hacer clic</li>
            <li>Cada sesión tiene 4 bloques: presentación, repetición, frase y despedida</li>
            <li>Seño Sofía habla entre bloques (activa tu audio)</li>
          </ul>
        </div>

        {/* Back to dashboard */}
        <div style={{ textAlign: "center" }}>
          <AnimatedButton variant="secondary" onClick={() => router.push("/dashboard")}>
            Volver al Dashboard
          </AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Section helper ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: colors.bg.card,
      borderRadius: radii.xl,
      padding: spacing.lg,
      boxShadow: shadows.sm,
    }}>
      <h2 style={{
        fontSize: fontSizes.lg,
        fontFamily: fonts.display,
        color: colors.text.primary,
        margin: `0 0 ${spacing.md}px`,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Export with Suspense (useSearchParams needs it) ──────────────────

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: colors.text.muted,
        }}>
          Cargando...
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
