"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/shared/store/useAppStore";
import { useProgression } from "@/features/progression/hooks/useProgression";
import { createPersistenceManager } from "@/features/persistence/services/db";
import type { PersistedSession } from "@/features/persistence/types";
import { getReaderLevel, getXPProgress, READER_LEVELS } from "@/shared/config/reader-levels";
import { CURRICULUM } from "@/features/session/config/curriculum";
import { generateProgressReport } from "@/shared/services/generateReport";
import { ALL_WORDS } from "@/shared/constants";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { fadeInUp } from "@/shared/styles/animations";

export default function ParentsPage() {
  const profile = useAppStore((s) => s.profile);
  const progress = useAppStore((s) => s.progress);
  const xp = useAppStore((s) => s.xp);
  const { worlds, overallProgress } = useProgression(progress);

  const [unlocked, setUnlocked] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sessions, setSessions] = useState<PersistedSession[]>([]);

  // Simple math gate to keep kids out
  const [num1] = useState(() => 5 + Math.floor(Math.random() * 10));
  const [num2] = useState(() => 3 + Math.floor(Math.random() * 10));
  const correctAnswer = num1 + num2;

  useEffect(() => {
    createPersistenceManager().getSessions().then((s) =>
      setSessions(s.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()))
    );
  }, []);

  const readerLevel = getReaderLevel(xp);
  const childName = profile?.childName ?? "Tu hijo";
  const wordsMastered = progress.wordsMastered.length;

  // Stats
  const totalSessions = sessions.length;
  const avgAccuracy = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((acc, s) => {
      const pct = s.wordsShown.length > 0 ? s.wordsRecognized.length / s.wordsShown.length : 0;
      return acc + pct;
    }, 0);
    return Math.round((sum / sessions.length) * 100);
  }, [sessions]);

  const sessionsThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions.filter((s) => new Date(s.savedAt).getTime() > weekAgo).length;
  }, [sessions]);

  // ─── Gate ───────────────────────────────────────────────────

  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.xl }}>
        <motion.div variants={fadeInUp} initial="initial" animate="animate"
          style={{ maxWidth: 360, width: "100%", backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.xl, boxShadow: shadows.md, textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>🔒</span>
          <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, margin: `${spacing.md}px 0 ${spacing.sm}px` }}>
            Panel de Padres
          </h2>
          <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: `0 0 ${spacing.lg}px` }}>
            Resuelve para entrar: ¿Cuanto es {num1} + {num2}?
          </p>
          <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center" }}>
            <input
              type="number" value={answer} onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && parseInt(answer) === correctAnswer) setUnlocked(true); }}
              style={{ width: 80, fontSize: fontSizes.xl, textAlign: "center", padding: spacing.sm, borderRadius: radii.lg, border: `2px solid ${colors.border.light}`, outline: "none", fontFamily: fonts.display }}
            />
            <button
              onClick={() => { if (parseInt(answer) === correctAnswer) setUnlocked(true); }}
              style={{ padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg, backgroundColor: colors.brand.primary, color: "#fff", border: "none", fontSize: fontSizes.md, fontWeight: "bold", cursor: "pointer" }}>
              Entrar
            </button>
          </div>
          {answer && parseInt(answer) !== correctAnswer && (
            <p style={{ fontSize: fontSizes.sm, color: colors.error, marginTop: spacing.sm }}>Respuesta incorrecta</p>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Dashboard ──────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7fafc", fontFamily: fonts.body, padding: spacing.lg }}>
      <motion.div variants={fadeInUp} initial="initial" animate="animate"
        style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.lg }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, margin: 0 }}>Panel de Padres</h1>
            <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0 }}>Progreso de {childName}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 36 }}>{readerLevel.emoji}</span>
            <div style={{ fontSize: fontSizes.xs, color: readerLevel.color, fontWeight: "bold" }}>{readerLevel.title}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
          <button
            onClick={() => generateProgressReport(childName, progress, xp, sessions)}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
              backgroundColor: colors.brand.primary, color: "#fff", border: "none",
              fontSize: fontSizes.sm, fontWeight: "bold", cursor: "pointer",
            }}
          >
            📄 Descargar reporte PDF
          </button>
          <button
            onClick={() => window.open("/cards", "_blank")}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
              backgroundColor: colors.bg.secondary, color: colors.text.muted,
              border: `1px solid ${colors.border.light}`,
              fontSize: fontSizes.sm, cursor: "pointer",
            }}
          >
            🖨️ Imprimir tarjetas
          </button>
          <button
            onClick={() => window.open("/demo", "_blank")}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
              backgroundColor: "#667eea", color: "#fff",
              border: "none",
              fontSize: fontSizes.sm, fontWeight: "bold", cursor: "pointer",
            }}
          >
            🎬 Ver videos demo
          </button>
          <button
            onClick={() => window.open("/onboarding-parents", "_blank")}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
              backgroundColor: colors.bg.secondary, color: colors.text.muted,
              border: `1px solid ${colors.border.light}`,
              fontSize: fontSizes.sm, cursor: "pointer",
            }}
          >
            📖 Método Doman
          </button>
        </div>

        {/* Key metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: spacing.sm }}>
          {[
            { label: "Palabras aprendidas", value: `${wordsMastered}/${ALL_WORDS.length}`, color: colors.brand.primary },
            { label: "Precisión promedio", value: `${avgAccuracy}%`, color: avgAccuracy >= 80 ? colors.success : colors.warning },
            { label: "Sesiones esta semana", value: sessionsThisWeek, color: colors.info },
            { label: "Racha de días", value: progress.streakDays, color: colors.warning },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.md, boxShadow: shadows.sm }}>
              <div style={{ fontSize: fontSizes["2xl"], fontWeight: "bold", color: m.color, fontFamily: fonts.display }}>{m.value}</div>
              <div style={{ fontSize: fontSizes.xs, color: colors.text.muted, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Progress by world */}
        <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.lg, boxShadow: shadows.sm }}>
          <h3 style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, margin: `0 0 ${spacing.md}px` }}>Progreso por Mundo</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {worlds.map((w) => (
              <div key={w.config.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: fontSizes.sm, fontWeight: "bold", color: w.config.color }}>
                    {w.config.icon} {w.config.name}
                  </span>
                  <span style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>
                    {w.wordsProgress.mastered}/{w.wordsProgress.total} palabras · {w.percentComplete}%
                  </span>
                </div>
                <div style={{ height: 8, backgroundColor: colors.bg.secondary, borderRadius: radii.pill }}>
                  <div style={{ height: "100%", width: `${w.percentComplete}%`, backgroundColor: w.config.color, borderRadius: radii.pill, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level evolution */}
        <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.lg, boxShadow: shadows.sm }}>
          <h3 style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, margin: `0 0 ${spacing.md}px` }}>Evolución del Lector</h3>
          <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
            {READER_LEVELS.map((lvl) => (
              <div key={lvl.level} style={{
                display: "flex", alignItems: "center", gap: spacing.xs,
                padding: `${spacing.xs}px ${spacing.sm}px`,
                borderRadius: radii.lg,
                backgroundColor: xp >= lvl.minXP ? `${lvl.color}15` : colors.bg.secondary,
                border: readerLevel.level === lvl.level ? `2px solid ${lvl.color}` : "2px solid transparent",
                opacity: xp >= lvl.minXP ? 1 : 0.4,
              }}>
                <span>{xp >= lvl.minXP ? lvl.emoji : "🔒"}</span>
                <div>
                  <div style={{ fontSize: fontSizes.xs, fontWeight: "bold", color: xp >= lvl.minXP ? lvl.color : colors.text.muted }}>{lvl.name}</div>
                  <div style={{ fontSize: 9, color: colors.text.placeholder }}>{lvl.minXP} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session history */}
        <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.lg, boxShadow: shadows.sm }}>
          <h3 style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, margin: `0 0 ${spacing.md}px` }}>
            Historial de Sesiones ({sessions.length} total)
          </h3>
          {sessions.length === 0 ? (
            <p style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>Aún no hay sesiones registradas</p>
          ) : (
            <div style={{ maxHeight: 300, overflow: "auto", display: "flex", flexDirection: "column", gap: spacing.xs }}>
              {sessions.slice(0, 20).map((s) => {
                const pct = s.wordsShown.length > 0 ? Math.round((s.wordsRecognized.length / s.wordsShown.length) * 100) : 0;
                const stars = pct >= 90 ? "⭐⭐⭐" : pct >= 60 ? "⭐⭐" : "⭐";
                return (
                  <div key={s.sessionId} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: `${spacing.xs}px ${spacing.sm}px`, backgroundColor: colors.bg.secondary, borderRadius: radii.sm,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                      <span style={{ fontSize: fontSizes.xs }}>{stars}</span>
                      <div>
                        <div style={{ fontSize: fontSizes.sm, color: colors.text.primary, fontWeight: "bold" }}>Fase {s.phase} — {s.wordsRecognized.length}/{s.wordsShown.length}</div>
                        <div style={{ fontSize: 10, color: colors.text.muted }}>{new Date(s.savedAt).toLocaleString("es")}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: fontSizes.sm, fontWeight: "bold", color: pct >= 80 ? colors.success : colors.text.muted }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div style={{ backgroundColor: colors.bg.card, borderRadius: radii.xl, padding: spacing.lg, boxShadow: shadows.sm }}>
          <h3 style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, margin: `0 0 ${spacing.md}px` }}>💡 Recomendaciones</h3>
          <ul style={{ fontSize: fontSizes.sm, color: colors.text.muted, lineHeight: 1.8, paddingLeft: spacing.lg, margin: 0 }}>
            {progress.streakDays < 3 && <li>Intenta practicar todos los días para mantener una racha</li>}
            {avgAccuracy < 70 && avgAccuracy > 0 && <li>La precisión está por debajo del 70%. Repasa las palabras de fases anteriores</li>}
            {sessionsThisWeek < 5 && <li>El método Doman recomienda al menos 3 sesiones diarias de pocos minutos</li>}
            {wordsMastered < 20 && <li>Enfócate en las palabras de la Fase 1 antes de avanzar</li>}
            {wordsMastered >= 50 && <li>¡Excelente! {childName} ya domina {wordsMastered} palabras. Puede avanzar al siguiente mundo</li>}
            <li>Las sesiones cortas y frecuentes son más efectivas que sesiones largas esporádicas</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
