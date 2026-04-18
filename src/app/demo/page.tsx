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
          words={words.slice(0, 20)}
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

        {/* Flash de Palabras */}
        <Section title="⚡ Flash de Palabras">
          <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(parseInt(e.target.value, 10))}
              style={{
                flex: 1, minWidth: 180,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.lg,
                border: `2px solid ${colors.border.light}`,
                fontSize: fontSizes.sm,
                fontFamily: fonts.body,
                backgroundColor: "#fff", color: "#2d3748",
              }}
            >
              {CURRICULUM.map((s) => {
                const world = WORLDS.find((w) => w.id === s.worldId);
                return (
                  <option key={s.id} value={s.id}>
                    {s.id}. {world?.icon} {s.words.map((w) => w.text).join(", ")}
                  </option>
                );
              })}
            </select>
            <AnimatedButton size="sm" color="#e53e3e" onClick={() => startSession(selectedSession)}>
              ▶ Ver
            </AnimatedButton>
          </div>

          {/* Range */}
          <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", flexWrap: "wrap", marginTop: spacing.sm }}>
            <select value={rangeFrom} onChange={(e) => setRangeFrom(parseInt(e.target.value, 10))}
              style={{ flex: 1, minWidth: 80, padding: `${spacing.xs}px ${spacing.sm}px`, borderRadius: radii.lg, border: `2px solid ${colors.border.light}`, fontSize: fontSizes.sm, backgroundColor: "#fff", color: "#2d3748" }}>
              {Array.from({ length: TOTAL_SESSIONS }, (_, i) => (
                <option key={i + 1} value={i + 1}>Desde {i + 1}</option>
              ))}
            </select>
            <select value={rangeTo} onChange={(e) => setRangeTo(parseInt(e.target.value, 10))}
              style={{ flex: 1, minWidth: 80, padding: `${spacing.xs}px ${spacing.sm}px`, borderRadius: radii.lg, border: `2px solid ${colors.border.light}`, fontSize: fontSizes.sm, backgroundColor: "#fff", color: "#2d3748" }}>
              {Array.from({ length: TOTAL_SESSIONS }, (_, i) => (
                <option key={i + 1} value={i + 1}>Hasta {i + 1}</option>
              ))}
            </select>
            <AnimatedButton size="sm" onClick={startRange}>
              ▶ Rango
            </AnimatedButton>
          </div>
        </Section>

        {/* Juegos */}
        <Section title="🎮 Juegos">
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {GAME_REGISTRY.filter((g) => g.id !== "word-flash").map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startGame(game.id, 1)}
                style={{
                  display: "flex", alignItems: "center", gap: spacing.md,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  backgroundColor: colors.bg.card,
                  border: `2px solid ${colors.border.light}`,
                  borderRadius: radii.lg,
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 28 }}>{game.icon}</span>
                <span style={{ flex: 1, fontSize: fontSizes.sm, fontWeight: "bold", color: game.color, fontFamily: fonts.display }}>
                  {game.name}
                </span>
                <span style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>▶</span>
              </motion.button>
            ))}
          </div>
        </Section>

        {/* Back to dashboard */}
        <div style={{ textAlign: "center", paddingBottom: spacing.xl }}>
          <AnimatedButton variant="secondary" onClick={() => router.push("/dashboard")}>
            ← Volver
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
