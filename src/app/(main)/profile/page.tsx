"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/shared/store/useAppStore";
import { useProgression } from "@/features/progression/hooks/useProgression";
import { createPersistenceManager } from "@/features/persistence/services/db";
import type { PersistedSession } from "@/features/persistence/types";
import { getReaderLevel, getNextLevel, getXPProgress, READER_LEVELS } from "@/shared/config/reader-levels";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { fadeInUp, staggerContainer, staggerItem } from "@/shared/styles/animations";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { ALL_WORDS } from "@/shared/constants";
import { CURRICULUM } from "@/features/session/config/curriculum";

const TOTAL_WORDS = ALL_WORDS.length;

export default function ProfilePage() {
  const profile = useAppStore((s) => s.profile);
  const status = useAppStore((s) => s.profileStatus);
  const save = useAppStore((s) => s.saveProfile);
  const progress = useAppStore((s) => s.progress);
  const loading = useAppStore((s) => s.progressLoading);
  const xp = useAppStore((s) => s.xp);
  const { worlds, overallProgress } = useProgression(progress);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [sessions, setSessions] = useState<PersistedSession[]>([]);

  const readerLevel = getReaderLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpProgress = getXPProgress(xp);

  useEffect(() => {
    createPersistenceManager().getSessions().then((s) =>
      setSessions(s.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()))
    );
  }, []);

  if (status === "loading" || loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>...</div>;
  }

  const childName = profile?.childName ?? "Amiguito";
  const wordsMastered = progress.wordsMastered.length;
  const completedSessionCount = progress.completedSessions.length;
  const recentSessions = sessions.slice(0, 8);

  const handleSaveName = async () => {
    if (newName.trim().length >= 2) { await save(newName.trim()); setEditing(false); setNewName(""); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso); const now = new Date(); const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
      <motion.div variants={fadeInUp} initial="initial" animate="animate"
        style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.lg }}>

        {/* Avatar + Level card */}
        <div style={{
          textAlign: "center", backgroundColor: colors.bg.card, borderRadius: radii.xl,
          padding: spacing.xl, boxShadow: shadows.md,
          background: `linear-gradient(135deg, ${readerLevel.color}15, ${readerLevel.color}05)`,
          border: `2px solid ${readerLevel.color}30`,
        }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 8 }}
            style={{ fontSize: 80, marginBottom: spacing.sm }}>
            {readerLevel.emoji}
          </motion.div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, alignItems: "center" }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={childName} autoFocus
                style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, fontWeight: "bold", textAlign: "center", padding: `${spacing.sm}px`, border: `2px solid ${readerLevel.color}`, borderRadius: radii.lg, outline: "none", maxWidth: 240 }} />
              <div style={{ display: "flex", gap: spacing.sm }}>
                <AnimatedButton size="sm" color={readerLevel.color} onClick={handleSaveName}>Guardar</AnimatedButton>
                <AnimatedButton size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancelar</AnimatedButton>
              </div>
            </div>
          ) : (
            <div>
              <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
                {childName}
              </h1>
              <div style={{ fontSize: fontSizes.md, fontFamily: fonts.display, color: readerLevel.color, fontWeight: "bold", marginTop: 4 }}>
                {readerLevel.title}
              </div>
              <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder, marginTop: 2 }}>
                Nivel {readerLevel.level} · {xp} XP
              </div>
              <button onClick={() => { setEditing(true); setNewName(childName); }}
                style={{ marginTop: spacing.sm, fontSize: fontSizes.xs, color: readerLevel.color, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Cambiar nombre
              </button>
            </div>
          )}

          {/* XP Progress bar */}
          {nextLevel && (
            <div style={{ marginTop: spacing.md }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: fontSizes.xs, color: colors.text.muted, marginBottom: 4 }}>
                <span>Nivel {readerLevel.level}</span>
                <span>Nivel {nextLevel.level} {nextLevel.emoji}</span>
              </div>
              <div style={{ height: 10, backgroundColor: colors.bg.secondary, borderRadius: radii.pill, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress.percent}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${readerLevel.color}, ${nextLevel.color})`, borderRadius: radii.pill }} />
              </div>
              <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder, textAlign: "right", marginTop: 2 }}>
                {xpProgress.current} / {xpProgress.needed} XP
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: spacing.sm }}>
          {[
            { label: "Palabras", value: wordsMastered, icon: "📖", color: colors.brand.primary },
            { label: "Sesiones", value: completedSessionCount, icon: "🎯", color: colors.info },
            { label: "Racha", value: `${progress.streakDays}d`, icon: "🔥", color: colors.warning },
            { label: "XP Total", value: xp, icon: "⚡", color: readerLevel.color },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.md, textAlign: "center", boxShadow: shadows.sm }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div style={{ fontSize: fontSizes.xl, fontWeight: "bold", color: s.color, fontFamily: fonts.display }}>{s.value}</div>
              <div style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Evolution path */}
        <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.md, boxShadow: shadows.sm }}>
          <h3 style={{ fontSize: fontSizes.md, fontFamily: fonts.display, color: colors.text.primary, margin: `0 0 ${spacing.sm}px` }}>
            Evolución
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.xs, justifyContent: "center" }}>
            {READER_LEVELS.map((lvl) => {
              const unlocked = xp >= lvl.minXP;
              return (
                <div key={lvl.level} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  borderRadius: radii.lg,
                  backgroundColor: unlocked ? `${lvl.color}15` : colors.bg.secondary,
                  border: readerLevel.level === lvl.level ? `2px solid ${lvl.color}` : "2px solid transparent",
                  opacity: unlocked ? 1 : 0.4,
                  minWidth: 55,
                }}>
                  <span style={{ fontSize: 24 }}>{unlocked ? lvl.emoji : "🔒"}</span>
                  <span style={{ fontSize: 9, color: unlocked ? lvl.color : colors.text.muted, fontWeight: "bold" }}>
                    Nv.{lvl.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* World progress */}
        <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.md, boxShadow: shadows.sm }}>
          <h3 style={{ fontSize: fontSizes.md, fontFamily: fonts.display, margin: `0 0 ${spacing.sm}px` }}>Mundos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {worlds.map((w) => (
              <div key={w.config.id} style={{ display: "flex", alignItems: "center", gap: spacing.sm, opacity: w.status === "locked" ? 0.4 : 1 }}>
                <img src={w.config.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fontSizes.sm, fontWeight: "bold", color: w.config.color }}>{w.config.name}</div>
                  <div style={{ height: 4, backgroundColor: colors.bg.secondary, borderRadius: radii.pill, marginTop: 2 }}>
                    <div style={{ height: "100%", width: `${w.percentComplete}%`, backgroundColor: w.config.color, borderRadius: radii.pill }} />
                  </div>
                </div>
                <span style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>{w.wordsProgress.mastered}/{w.wordsProgress.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Share achievement */}
        <div style={{
          backgroundColor: colors.bg.card, borderRadius: radii.xl,
          padding: spacing.md, boxShadow: shadows.sm, textAlign: "center",
        }}>
          <AnimatedButton
            color={readerLevel.color}
            size="md"
            onClick={async () => {
              const text = `\uD83C\uDF89 \u00A1${childName} aprendi\u00F3 ${wordsMastered} palabras con Doman App! Nivel: ${readerLevel.title} ${readerLevel.emoji}`;
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({ text });
                } catch {
                  // User cancelled or share failed — ignore
                }
              } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }
            }}
          >
            Compartir logro
          </AnimatedButton>
          <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder, marginTop: spacing.xs }}>
            Comparte tu progreso por WhatsApp
          </div>
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.md, boxShadow: shadows.sm }}>
            <h3 style={{ fontSize: fontSizes.md, fontFamily: fonts.display, margin: `0 0 ${spacing.sm}px` }}>Historial</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
              {recentSessions.map((s) => {
                const pct = s.wordsShown.length > 0 ? Math.round((s.wordsRecognized.length / s.wordsShown.length) * 100) : 0;
                return (
                  <div key={s.sessionId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${spacing.xs}px ${spacing.sm}px`, backgroundColor: colors.bg.secondary, borderRadius: radii.lg }}>
                    <div>
                      <div style={{ fontSize: fontSizes.sm, fontWeight: "bold" }}>Fase {s.phase} — {s.wordsRecognized.length}/{s.wordsShown.length}</div>
                      <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>{formatDate(s.savedAt)}</div>
                    </div>
                    <span style={{ fontSize: fontSizes.sm, fontWeight: "bold", color: pct >= 80 ? colors.success : colors.text.muted }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
