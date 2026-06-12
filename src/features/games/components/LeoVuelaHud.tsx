"use client";

import React from "react";
import { motion } from "framer-motion";
import type { DomanWord } from "@/shared/types/doman";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { domanCanvasText } from "../config/doman-canvas";

const GAME_COLOR = "#9f7aea";
const MAX_W = "min(640px, calc(100vw - 32px))";

// ─── HUD: badge de nivel + aciertos + pill fija del objetivo + energia ──

interface LeoVuelaHudProps {
  level: number; // 0-based
  correct: number;
  targetWord: DomanWord | null;
  waveKey: number; // re-anima la pill cuando cambia la tanda
  energy: number;
  energyMax: number;
}

export const LeoVuelaHud: React.FC<LeoVuelaHudProps> = ({ level, correct, targetWord, waveKey, energy, energyMax }) => (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: MAX_W }}>
      <span style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSizes.sm, color: colors.text.placeholder }}>
        <motion.span
          key={level}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          style={{
            padding: `2px ${spacing.sm}px`, borderRadius: radii.pill,
            backgroundColor: `${GAME_COLOR}20`, color: GAME_COLOR,
            fontWeight: "bold", fontFamily: fonts.display,
          }}
        >
          Nivel {level + 1}
        </motion.span>
        ✓ {correct}
      </span>
      {targetWord && (
        <div
          style={{
            padding: `${spacing.xs}px ${spacing.lg}px`,
            backgroundColor: `${GAME_COLOR}15`, border: `2px solid ${GAME_COLOR}`,
            borderRadius: radii.pill, fontSize: fontSizes.xl,
            fontWeight: "bold", fontFamily: fonts.display, color: GAME_COLOR,
          }}
        >
          Volá a: <motion.span
            key={targetWord.id + waveKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: domanCanvasText(targetWord).fill }}
          >{targetWord.text}</motion.span>
        </div>
      )}
      <span style={{ width: 40 }} />
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, width: "100%", maxWidth: MAX_W }}>
      <span style={{ fontSize: fontSizes.md }} aria-hidden>⚡</span>
      <div
        role="progressbar"
        aria-label="Energía"
        aria-valuenow={energy}
        aria-valuemin={0}
        aria-valuemax={energyMax}
        style={{ flex: 1, height: 14, borderRadius: radii.pill, backgroundColor: "#e9e5f5", overflow: "hidden", border: `1px solid ${colors.border.light}` }}
      >
        <div
          style={{
            width: `${(energy / energyMax) * 100}%`,
            height: "100%",
            borderRadius: radii.pill,
            backgroundColor: energy > 50 ? "#48bb78" : energy > 25 ? "#f6ad55" : "#f56565",
            transition: "width 0.25s ease, background-color 0.3s ease",
          }}
        />
      </div>
    </div>
  </>
);

// ─── Botones ◀ ▶ para esquivar (mobile) — el resto del canvas aletea ──

interface MoveButtonsProps {
  active: boolean;
  onDir: (dir: -1 | 0 | 1) => void;
}

export const MoveButtons: React.FC<MoveButtonsProps> = ({ active, onDir }) => {
  const btnStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    bottom: 10,
    [side]: 10,
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: `2px solid ${GAME_COLOR}80`,
    backgroundColor: "rgba(255,255,255,0.55)",
    color: GAME_COLOR,
    fontSize: 22,
    cursor: active ? "pointer" : "default",
    touchAction: "none",
    userSelect: "none",
    zIndex: 6, // encima del boton de aleteo y de la mascota LeoCompanion (zIndex 5)
  });

  const bind = (dir: -1 | 1) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDir(dir);
    },
    onPointerUp: (e: React.PointerEvent) => { e.stopPropagation(); onDir(0); },
    onPointerLeave: () => onDir(0),
    onPointerCancel: () => onDir(0),
    // Que el click no burbujee hasta el boton de aleteo
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  });

  return (
    <>
      <button aria-label="Mover atrás" style={btnStyle("left")} {...bind(-1)}>◀</button>
      <button aria-label="Mover adelante" style={btnStyle("right")} {...bind(1)}>▶</button>
    </>
  );
};
