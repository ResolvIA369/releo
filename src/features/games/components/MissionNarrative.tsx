"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sofiaPlayAudio } from "@/shared/services/sofiaVoice";
import { fonts, fontSizes, spacing, radii, shadows } from "@/shared/styles/design-tokens";

// Overlay genérico de narrativa breve (3-8s) antes/después de una
// misión — pensado para reutilizarse en cualquier juego arcade, no solo
// Leo Vuela (ver docs/RELEO-JUEGOS-V2.md §6 y §10). Nunca bloquea: el
// niño puede tocar "Continuar" apenas aparece, y si no toca nada avanza
// solo a los pocos segundos.
//
// El texto se intenta decir en voz (mp3Key real si existe; si no, cae
// en silencio — sofiaVoice nunca usa una voz distinta a la de Sofía).
// Mientras no se generen los audios nuevos, la narrativa se lee en
// pantalla igual: no depende del audio para funcionar.

export interface MissionNarrativeProps {
  variant: "intro" | "outro";
  icon: string; // ej. "📖" el Libro Mágico
  lines: string[]; // 1-2 líneas cortas
  mp3Key?: string | null; // clave de audio pre-grabado, si existe
  scatterEmojis?: string[]; // palabras que se van (intro) o vuelven (outro)
  ctaLabel?: string;
  color?: string;
  autoDismissMs?: number;
  onDone: () => void;
}

const DEFAULT_SPARKLES = ["✨", "✨", "✨"];

export const MissionNarrative: React.FC<MissionNarrativeProps> = ({
  variant,
  icon,
  lines,
  mp3Key = null,
  scatterEmojis,
  ctaLabel = "Continuar",
  color = "#9f7aea",
  autoDismissMs = 6000,
  onDone,
}) => {
  const doneRef = useRef(false);
  const [visible, setVisible] = useState(true);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVisible(false);
    onDone();
  };

  useEffect(() => {
    void sofiaPlayAudio(mp3Key, lines.join(" "), "gentle");
    const timer = setTimeout(finish, autoDismissMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const particles = (scatterEmojis && scatterEmojis.length > 0 ? scatterEmojis : DEFAULT_SPARKLES).slice(0, 5);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        padding: spacing.lg,
        backgroundColor: "rgba(20, 20, 40, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div style={{ position: "relative", width: 180, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          style={{ fontSize: 72, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))" }}
        >
          {icon}
        </motion.span>
        {particles.map((emoji, i) => {
          const angle = (i / particles.length) * Math.PI * 2;
          const dist = 70;
          const outward = variant === "intro";
          return (
            <motion.span
              key={i}
              initial={outward ? { x: 0, y: 0, opacity: 0, scale: 0.5 } : { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.5 }}
              animate={outward ? { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: [0, 1, 0.9], scale: 1 } : { x: 0, y: 0, opacity: [0, 1, 0], scale: 1 }}
              transition={{ duration: 1.1, delay: 0.15 * i, ease: "easeOut" }}
              style={{ position: "absolute", fontSize: 30 }}
            >
              {emoji}
            </motion.span>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs, maxWidth: 340, textAlign: "center" }}>
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.25 }}
            style={{ margin: 0, fontSize: fontSizes.lg, fontFamily: fonts.display, color: "#ffffff" }}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.96 }}
        onClick={finish}
        style={{
          padding: `${spacing.sm}px ${spacing.xl}px`,
          backgroundColor: color,
          color: "#fff",
          border: "none",
          borderRadius: radii.pill,
          fontSize: fontSizes.md,
          fontWeight: "bold",
          fontFamily: fonts.display,
          cursor: "pointer",
          boxShadow: shadows.button,
          minHeight: 48,
        }}
      >
        {ctaLabel}
      </motion.button>
    </motion.div>
  );
};
