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
import { GAME_REGISTRY } from "@/features/games/config/game-registry";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";
import { RewardsProvider } from "@/shared/components/RewardsLayer";
import { WordImageMatch } from "@/features/games/components/WordImageMatch";
import { MemoryCards } from "@/features/games/components/MemoryCards";
import { WordRain } from "@/features/games/components/WordRain";
import { WordTrain } from "@/features/games/components/WordTrain";
import { BuildSentence } from "@/features/games/components/BuildSentence";
import { StoryReader } from "@/features/games/components/StoryReader";
import { CategoryGame } from "@/features/games/components/CategoryGame";
import { WordFishing } from "@/features/games/components/WordFishing";
import { BitsReading } from "@/features/games/components/BitsReading";
import type { GameId } from "@/features/games/types";
import type { FC } from "react";
import type { GameProps } from "@/features/games/types";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { staggerContainer, staggerItem, fadeInUp } from "@/shared/styles/animations";
import { AnimatedButton } from "@/shared/components/AnimatedButton";

const GAME_COMPONENTS: Partial<Record<GameId, FC<GameProps>>> = {
  "word-image-match": WordImageMatch,
  "memory-cards": MemoryCards,
  "word-rain": WordRain,
  "word-train": WordTrain,
  "phrase-builder": BuildSentence,
  "story-reader": StoryReader,
  "category-sort": CategoryGame,
  "word-fishing": WordFishing,
  "daily-bits": BitsReading,
};
const PHASE_WORDS = [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS];

// ─── Demo content (reads URL params, launches player) ────────────────

function DemoContent() {
  const params = useSearchParams();
  const router = useRouter();

  const sessionParam = params.get("session");
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const worldParam = params.get("world");
  const allParam = params.get("all");
  const gameParam = params.get("game") as GameId | null;
  const phaseParam = params.get("phase");

  // Flash de Palabras sessions
  const sessions = useMemo(() => {
    if (sessionParam) {
      const s = getSession(parseInt(sessionParam, 10));
      return s ? [s] : null;
    }
    if (fromParam && toParam) {
      const from = parseInt(fromParam, 10);
      const to = parseInt(toParam, 10);
      return CURRICULUM.filter((s) => s.id >= from && s.id <= to);
    }
    if (worldParam && !gameParam) {
      const worldId = `world_${worldParam}`;
      const ws = getWorldSessions(worldId);
      return ws.length > 0 ? ws : null;
    }
    if (allParam === "true") {
      return CURRICULUM;
    }
    return null;
  }, [sessionParam, fromParam, toParam, worldParam, allParam, gameParam]);

  // Game demo (non-WordFlash)
  if (gameParam && GAME_COMPONENTS[gameParam]) {
    const GameComp = GAME_COMPONENTS[gameParam]!;
    const phaseIdx = phaseParam ? parseInt(phaseParam, 10) - 1 : 0;
    const words = PHASE_WORDS[Math.min(phaseIdx, 4)] ?? PHASE1_WORDS;
    const worldId = WORLDS[Math.min(phaseIdx, 4)]?.id;

    return (
      <RewardsProvider>
        <GameComp
          words={words.slice(0, 10)}
          phase={(phaseIdx + 1) as 1 | 2 | 3 | 4 | 5}
          worldId={worldId}
          isDemo
          onComplete={() => router.push("/demo")}
          onBack={() => router.push("/demo")}
        />
      </RewardsProvider>
    );
  }

  if (sessions && sessions.length > 0) {
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
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(5);

  const startSession = (session: number) => {
    router.push(`/demo?session=${session}`);
  };

  const startRange = () => {
    router.push(`/demo?from=${rangeFrom}&to=${rangeTo}`);
  };

  const startWorld = (worldNum: number) => {
    router.push(`/demo?world=${worldNum}`);
  };

  const startGame = (gameId: string, phaseNum: number) => {
    router.push(`/demo?game=${gameId}&phase=${phaseNum}`);
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

        {/* Session range */}
        <Section title="Rango de sesiones">
          <div style={{ display: "flex", gap: spacing.md, alignItems: "center" }}>
            <label style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>Desde</label>
            <select value={rangeFrom} onChange={(e) => setRangeFrom(parseInt(e.target.value, 10))}
              style={{ flex: 1, padding: `${spacing.xs}px`, borderRadius: radii.lg, border: `2px solid ${colors.border.light}`, fontSize: fontSizes.md, backgroundColor: "#fff", color: "#2d3748" }}>
              {Array.from({ length: TOTAL_SESSIONS }, (_, i) => (
                <option key={i + 1} value={i + 1}>Sesión {i + 1}</option>
              ))}
            </select>
            <label style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>Hasta</label>
            <select value={rangeTo} onChange={(e) => setRangeTo(parseInt(e.target.value, 10))}
              style={{ flex: 1, padding: `${spacing.xs}px`, borderRadius: radii.lg, border: `2px solid ${colors.border.light}`, fontSize: fontSizes.md, backgroundColor: "#fff", color: "#2d3748" }}>
              {Array.from({ length: TOTAL_SESSIONS }, (_, i) => (
                <option key={i + 1} value={i + 1}>Sesión {i + 1}</option>
              ))}
            </select>
            <AnimatedButton size="sm" onClick={startRange}>
              Grabar
            </AnimatedButton>
          </div>
        </Section>

        {/* Individual games */}
        <Section title="Grabar un juego">
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {GAME_REGISTRY.filter((g) => g.id !== "word-flash").map((game) => (
              <motion.div key={game.id} variants={staggerItem}
                style={{ display: "flex", alignItems: "center", gap: spacing.sm,
                  padding: `${spacing.sm}px ${spacing.md}px`, backgroundColor: colors.bg.card,
                  border: `2px solid ${colors.border.light}`, borderRadius: radii.lg }}>
                <span style={{ fontSize: 24 }}>{game.icon}</span>
                <span style={{ flex: 1, fontSize: fontSizes.sm, fontWeight: "bold", color: game.color, fontFamily: fonts.display }}>
                  {game.name}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button key={p} onClick={() => startGame(game.id, p)}
                      style={{
                        width: 32, height: 32, borderRadius: radii.sm,
                        backgroundColor: p <= (game.minPhase || 1) ? `${game.color}20` : colors.bg.secondary,
                        border: `1px solid ${p <= (game.minPhase || 1) ? game.color : colors.border.light}`,
                        color: game.color, fontWeight: "bold", fontSize: 12,
                        cursor: "pointer",
                      }}>
                      F{p}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
          <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, marginTop: spacing.xs, textAlign: "center" }}>
            Tocá F1-F5 para elegir la fase. El juego se auto-juega correctamente.
          </p>
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

        {/* Download videos */}
        <Section title="📥 Descargar videos">
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {[
              { file: "leo-celebration-1.mp4", label: "Leo celebrando (pasada 1)" },
              { file: "leo-celebration-2.mp4", label: "Leo celebrando (pasada 2)" },
              { file: "leo-celebration-3.mp4", label: "Leo celebrando (pasada 3)" },
              { file: "sofia-esfuerzo.mp4", label: "Sofía felicitando por esfuerzo" },
              { file: "leo-motivation.mp4", label: "Leo motivando" },
            ].map(({ file, label }) => (
              <a
                key={file}
                href={`/videos/${file}`}
                download={file}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  backgroundColor: colors.bg.card,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: radii.lg,
                  textDecoration: "none",
                  color: colors.text.primary,
                  fontSize: fontSizes.sm,
                }}
              >
                <span>🎬 {label}</span>
                <span style={{ fontSize: fontSizes.xs, color: colors.brand.primary, fontWeight: "bold" }}>Descargar</span>
              </a>
            ))}
          </div>
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
