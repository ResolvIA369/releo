"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_REGISTRY } from "@/features/games/config/game-registry";
import { WordPath } from "@/features/games/components/WordPath";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { DailyProgress } from "@/shared/components/DailyProgress";
import { staggerContainer, staggerItem, fadeInDown } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

type Mode = "menu" | "games" | "words";

export default function DashboardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");

  // ─── Word Path mode ─────────────────────────────────────────
  if (mode === "words") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
        <button
          onClick={() => setMode("menu")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.sm, color: colors.text.muted, marginBottom: spacing.md }}
        >
          ← Volver
        </button>
        <WordPath onBack={() => setMode("menu")} />
      </div>
    );
  }

  // ─── Games list mode ────────────────────────────────────────
  if (mode === "games") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
        <button
          onClick={() => setMode("menu")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.sm, color: colors.text.muted, marginBottom: spacing.md }}
        >
          ← Volver
        </button>

        <motion.div variants={fadeInDown} initial="initial" animate="animate"
          style={{ textAlign: "center", marginBottom: spacing.xl }}>
          <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
            Elige un juego
          </h1>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: spacing.md, maxWidth: 900, margin: "0 auto",
          }}>
          {GAME_REGISTRY.filter((g) => g.id !== "word-flash").map((game) => (
            <motion.div key={game.id} variants={staggerItem}
              style={{
                backgroundColor: colors.bg.card, borderRadius: radii.xl,
                border: `2px solid ${colors.border.light}`, padding: spacing.md,
                display: "flex", flexDirection: "column", gap: spacing.sm,
                boxShadow: shadows.sm, transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              whileHover={{ borderColor: game.color, boxShadow: shadows.glow(game.color), y: -4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                <span style={{ fontSize: fontSizes.xl }}>{game.icon}</span>
                <h2 style={{ fontSize: fontSizes.md, fontFamily: fonts.display, fontWeight: "bold", color: game.color, margin: 0 }}>
                  {game.name}
                </h2>
              </div>
              <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, margin: 0, flex: 1 }}>
                {game.description}
              </p>
              <AnimatedButton color={game.color} size="sm"
                onClick={() => router.push(`/play/${game.id}`)}>
                Jugar
              </AnimatedButton>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // ─── Main menu ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
      <motion.div variants={fadeInDown} initial="initial" animate="animate"
        style={{ textAlign: "center", marginBottom: spacing.xl }}>
        <img src="/images/logo/releo.png" alt="REleo" style={{ height: 80, width: "auto", objectFit: "contain", margin: "0 auto" }} />
        <p style={{ fontSize: fontSizes.md, color: colors.text.muted, marginTop: spacing.sm }}>
          ¿Como quieres practicar hoy?
        </p>
      </motion.div>

      <DailyProgress />

      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        style={{ display: "flex", flexDirection: "column", gap: spacing.lg, maxWidth: 600, margin: "0 auto", width: "100%" }}>

        {/* 1. Flash de Palabras (arriba) */}
        <motion.button variants={staggerItem}
          whileHover={{ y: -4, boxShadow: shadows.glow("#e53e3e") }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/learn")}
          style={{
            display: "flex", alignItems: "center", gap: spacing.lg,
            padding: spacing.xl, backgroundColor: colors.bg.card,
            border: `2px solid ${colors.border.light}`, borderRadius: radii.xl,
            cursor: "pointer", textAlign: "left", boxShadow: shadows.sm,
          }}>
          <div style={{
            width: 64, height: 64, borderRadius: radii.lg, flexShrink: 0,
            background: "linear-gradient(135deg, #e53e3e, #fc8181)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, fontWeight: "bold", color: "#e53e3e" }}>
              Flash de Palabras
            </div>
            <div style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: 2 }}>
              Sesiones Doman con la Seño Sofia
            </div>
          </div>
        </motion.button>

        {/* 2. Por Juego (medio) */}
        <motion.button variants={staggerItem}
          whileHover={{ y: -4, boxShadow: shadows.glow("#38a169") }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode("games")}
          style={{
            display: "flex", alignItems: "center", gap: spacing.lg,
            padding: spacing.xl, backgroundColor: colors.bg.card,
            border: `2px solid ${colors.border.light}`, borderRadius: radii.xl,
            cursor: "pointer", textAlign: "left", boxShadow: shadows.sm,
          }}>
          <div style={{
            width: 64, height: 64, borderRadius: radii.lg, flexShrink: 0,
            background: "linear-gradient(135deg, #38a169, #48bb78)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>🎮</div>
          <div>
            <div style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, fontWeight: "bold", color: "#38a169" }}>
              Por Juego
            </div>
            <div style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: 2 }}>
              Elige un juego y luego las palabras
            </div>
          </div>
        </motion.button>

        {/* 3. Por Palabras (abajo) */}
        <motion.button variants={staggerItem}
          whileHover={{ y: -4, boxShadow: shadows.glow("#667eea") }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode("words")}
          style={{
            display: "flex", alignItems: "center", gap: spacing.lg,
            padding: spacing.xl, backgroundColor: colors.bg.card,
            border: `2px solid ${colors.border.light}`, borderRadius: radii.xl,
            cursor: "pointer", textAlign: "left", boxShadow: shadows.sm,
          }}>
          <div style={{
            width: 64, height: 64, borderRadius: radii.lg, flexShrink: 0,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>📖</div>
          <div>
            <div style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, fontWeight: "bold", color: "#667eea" }}>
              Por Palabras
            </div>
            <div style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: 2 }}>
              Elige palabras y practica con 5 juegos seguidos
            </div>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
