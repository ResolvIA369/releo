"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WORLDS } from "@/features/progression/config/worlds";
import { useAppStore } from "@/shared/store/useAppStore";
import { getWorldSessions } from "@/features/session/config/curriculum";
import { SessionNodeList } from "@/features/progression/components/SessionNodeList";
import type { DomanSession } from "@/features/session/config/curriculum";
import { staggerContainer, staggerItem, fadeInDown } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

export default function PlayPage() {
  const router = useRouter();
  const progress = useAppStore((s) => s.progress);
  const loading = useAppStore((s) => s.progressLoading);
  const completedSet = new Set(progress.completedSessions);

  const getWorldCompleted = (worldId: string): number[] => {
    return getWorldSessions(worldId).filter((s) => completedSet.has(s.id)).map((s) => s.id);
  };
  const getWorldSessionCount = (worldId: string) => {
    const ws = getWorldSessions(worldId);
    return { completed: getWorldCompleted(worldId).length, total: ws.length };
  };
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  const handleSelectSession = (session: DomanSession) => {
    router.push(`/play/word-flash?session=${session.id}`);
  };

  // Show session node list when a world is selected
  if (selectedWorldId) {
    const completed = getWorldCompleted(selectedWorldId);
    return (
      <SessionNodeList
        worldId={selectedWorldId}
        completedSessions={completed}
        onSelectSession={handleSelectSession}
        onBack={() => setSelectedWorldId(null)}
      />
    );
  }

  // World map
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg.primary }}>
        <span style={{ fontSize: fontSizes.lg, color: colors.text.muted }}>Cargando...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
      <motion.div variants={fadeInDown} initial="initial" animate="animate"
        style={{ textAlign: "center", marginBottom: spacing.xl }}>
        <h1 style={{ fontSize: fontSizes["3xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>Mundos</h1>
        <p style={{ fontSize: fontSizes.md, color: colors.text.muted, marginTop: spacing.sm }}>Elige un mundo para explorar</p>
      </motion.div>

      <motion.div
        variants={staggerContainer} initial="initial" animate="animate"
        style={{ display: "flex", flexDirection: "column", gap: spacing.lg, maxWidth: 720, margin: "0 auto", width: "100%" }}>

        {WORLDS.map((world, worldIdx) => {
          const counts = getWorldSessionCount(world.id);
          const isCompleted = counts.completed === counts.total;

          // World is locked if previous world not completed (except world 1)
          // TODO: restore lock logic after testing
          const isLocked = false;

          const isCurrent = !isLocked && !isCompleted;
          const progressPct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

          return (
            <motion.div
              key={world.id}
              variants={staggerItem}
              whileHover={isLocked ? {} : { y: -4, boxShadow: shadows.glow(world.color) }}
              onClick={() => !isLocked && setSelectedWorldId(world.id)}
              style={{
                display: "flex", alignItems: "center", gap: spacing.lg,
                padding: spacing.lg, backgroundColor: colors.bg.card,
                borderRadius: radii.xl,
                border: `2px solid ${isCurrent ? world.color : colors.border.light}`,
                boxShadow: isCurrent ? shadows.glow(world.color) : shadows.sm,
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? "not-allowed" : "pointer",
                transition: "border-color 0.2s",
              }}>
              {/* World image */}
              {isLocked ? (
                <div style={{
                  width: 80, height: 80, borderRadius: radii.lg, flexShrink: 0,
                  backgroundColor: colors.bg.secondary,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                }}>🔒</div>
              ) : (
                <img src={world.image} alt={world.name} style={{
                  width: 80, height: 80, borderRadius: radii.lg, flexShrink: 0, objectFit: "cover",
                }} />
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                  <h2 style={{
                    fontSize: fontSizes.lg, fontFamily: fonts.display, fontWeight: "bold",
                    color: isLocked ? colors.text.muted : world.color, margin: 0,
                  }}>
                    {world.name}
                  </h2>
                  {isCompleted && <span>✅</span>}
                </div>

                {/* Progress bar */}
                {!isLocked && (
                  <>
                    <div style={{
                      marginTop: spacing.sm, height: 6,
                      backgroundColor: colors.bg.secondary, borderRadius: radii.pill, overflow: "hidden",
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        style={{ height: "100%", backgroundColor: world.color, borderRadius: radii.pill }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.xs, fontSize: fontSizes.xs, color: colors.text.placeholder }}>
                      <span>{counts.completed}/{counts.total} sesiones</span>
                      <span>{world.totalWords} palabras</span>
                    </div>
                  </>
                )}

                {isLocked && (
                  <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, margin: `${spacing.xs}px 0 0` }}>
                    Completa el mundo anterior
                  </p>
                )}
              </div>

              {/* Phase badge */}
              <div style={{
                fontSize: fontSizes.xs, color: colors.text.placeholder,
                backgroundColor: colors.bg.secondary,
                padding: `${spacing.xs}px ${spacing.sm}px`,
                borderRadius: radii.sm, flexShrink: 0,
              }}>
                Fase {world.phase}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
