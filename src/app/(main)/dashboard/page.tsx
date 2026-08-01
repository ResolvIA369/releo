"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_REGISTRY } from "@/features/games/config/game-registry";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { DailyProgress } from "@/shared/components/DailyProgress";
import { staggerContainer, staggerItem, fadeInDown } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows, timing } from "@/shared/styles/design-tokens";

type Mode = "menu" | "games";

export default function DashboardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");

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
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, calc(100vw - 64px)), 1fr))",
            gap: spacing.md, maxWidth: "min(900px, calc(100vw - 32px))", margin: "0 auto",
          }}>
          {GAME_REGISTRY.filter((g) => g.id !== "word-flash").map((game) => (
            <motion.div key={game.id} variants={staggerItem}
              style={{
                backgroundColor: colors.bg.card, borderRadius: radii.xl,
                border: `2px solid ${game.color}33`, padding: spacing.md,
                display: "flex", flexDirection: "column", gap: spacing.sm,
                boxShadow: shadows.sm, transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              whileHover={{ borderColor: game.color, boxShadow: shadows.glow(game.color), y: -4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                <span style={{
                  width: 40, height: 40, borderRadius: radii.md, flexShrink: 0,
                  background: `${game.color}1a`, fontSize: fontSizes.lg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{game.icon}</span>
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
  // Orden: "Jugar" primero (destacada). Cada item con su color/gradiente propio.
  const menuItems = [
    {
      key: "jugar",
      icon: "🎮",
      title: "Jugar",
      description: "Elige un juego y luego las palabras",
      color: "#38a169",
      gradient: "linear-gradient(135deg, #38a169, #48bb78)",
      onClick: () => setMode("games"),
      featured: true,
    },
    {
      key: "flash",
      icon: "⚡",
      title: "Flash de Palabras",
      description: "Sesiones Doman con la Seño Sofia",
      color: "#e53e3e",
      gradient: "linear-gradient(135deg, #e53e3e, #fc8181)",
      onClick: () => router.push("/learn"),
      featured: false,
    },
    {
      key: "videos",
      icon: "🎬",
      title: "Aprender con Videos",
      description: "Mirá sesiones y juegos como videos",
      color: "#ed8936",
      gradient: "linear-gradient(135deg, #ed8936, #f6ad55)",
      onClick: () => router.push("/demo"),
      featured: false,
    },
    {
      key: "doman",
      icon: "📚",
      title: "Método Doman",
      description: "Conocé cómo funciona este método de lectura",
      color: "#9f7aea",
      gradient: "linear-gradient(135deg, #9f7aea, #b794f4)",
      onClick: () => router.push("/onboarding-parents"),
      featured: false,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
      <motion.div variants={fadeInDown} initial="initial" animate="animate"
        style={{ textAlign: "center", marginBottom: spacing.xl }}>
        <img src="/images/logo/releo.png" alt="REleo" style={{ height: 80, width: "auto", objectFit: "contain", margin: "0 auto" }} />
        <p style={{ fontSize: fontSizes.md, color: colors.text.muted, marginTop: spacing.sm }}>
          ¿Cómo quieres practicar hoy?
        </p>
      </motion.div>

      <DailyProgress />

      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        style={{ display: "flex", flexDirection: "column", gap: spacing.md, maxWidth: 600, margin: `${spacing.md}px auto 0`, width: "100%" }}>

        {menuItems.map((item) => (
          <motion.button key={item.key}
            variants={{
              initial: { opacity: 0, y: 16 },
              animate: { opacity: 1, y: 0, transition: timing.spring },
              hover: { y: -5, boxShadow: shadows.glow(item.color) },
            }}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={item.onClick}
            style={{
              position: "relative",
              display: "flex", alignItems: "center", gap: spacing.lg,
              padding: spacing.xl, backgroundColor: colors.bg.card,
              border: `2px solid ${item.featured ? item.color : `${item.color}33`}`,
              borderRadius: radii.xl,
              cursor: "pointer", textAlign: "left",
              boxShadow: item.featured ? `0 6px 22px ${item.color}44` : shadows.sm,
            }}>
            {/* Icono con halo de color */}
            <motion.div
              animate={item.featured ? { y: [0, -5, 0] } : undefined}
              transition={item.featured ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
              style={{
                width: 64, height: 64, borderRadius: radii.lg, flexShrink: 0,
                background: item.gradient,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                boxShadow: `0 6px 16px ${item.color}55`,
              }}>{item.icon}</motion.div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: fontSizes.xl, fontFamily: fonts.display, fontWeight: "bold",
                  color: colors.text.primary,
                }}>
                  {item.title}
                </span>
                {item.featured && (
                  <span style={{
                    fontSize: fontSizes.xs, fontWeight: "bold", color: "#ffffff",
                    background: item.gradient, padding: "2px 8px", borderRadius: radii.pill,
                  }}>
                    ★ Empezá acá
                  </span>
                )}
              </div>
              <div style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: 2 }}>
                {item.description}
              </div>
            </div>

            {/* Flecha: sugiere "tocá acá" y se desliza al pasar el mouse */}
            <motion.span
              variants={{ hover: { x: 5 } }}
              style={{ fontSize: 30, fontWeight: "bold", color: item.color, flexShrink: 0, lineHeight: 1 }}>
              ›
            </motion.span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
