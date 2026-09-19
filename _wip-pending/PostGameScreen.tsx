"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { GameSessionState } from "../types";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { pickEndVideo } from "@/shared/utils/videoPool";
import { colors, fonts, fontSizes, spacing, radii } from "@/shared/styles/design-tokens";

interface PostGameScreenProps {
  postGame: GameSessionState;
  primaryColor: string;
  hasNextBlock: boolean;
  onNext: () => void;
  onReplay: () => void;
  onChangeBlock: () => void;
  onChangeWorld: () => void;
  onMenu: () => void;
}

/**
 * Simplified post-game screen for young children: stars + coins + ONE big
 * primary action ("Siguiente"). Secondary actions live behind a "Más opciones"
 * disclosure to avoid overload — kids don't need 5 buttons after every game.
 */
export const PostGameScreen: React.FC<PostGameScreenProps> = ({
  postGame,
  primaryColor,
  hasNextBlock,
  onNext,
  onReplay,
  onChangeBlock,
  onChangeWorld,
  onMenu,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const pct = postGame.totalAttempts > 0
    ? Math.round((postGame.correctAttempts / postGame.totalAttempts) * 100)
    : 0;
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  const coins = (postGame.correctAttempts ?? 0) + 5;

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      backgroundColor: "#FFFFFF", fontFamily: fonts.body, padding: spacing.xl,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: spacing.lg, maxWidth: 400, width: "100%",
        }}
      >
        <video
          src={pickEndVideo(stars)}
          autoPlay
          playsInline
          muted
          onCanPlay={(e) => { (e.target as HTMLVideoElement).style.opacity = "1"; }}
          onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
          style={{
            width: "min(280px, 75vw)",
            borderRadius: 16,
            display: "block",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
        />

        <div style={{ display: "flex", gap: spacing.sm, fontSize: 56 }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.2, type: "spring", damping: 8 }}
              style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", damping: 8 }}
          style={{
            display: "flex", alignItems: "center", gap: spacing.sm,
            backgroundColor: "#FFF8E1", borderRadius: radii.pill,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            border: "2px solid #FFD54F",
          }}
        >
          <span style={{ fontSize: 32 }}>🪙</span>
          <span style={{ fontSize: fontSizes["2xl"], fontWeight: "bold", color: "#F59E0B", fontFamily: fonts.display }}>
            +{coins}
          </span>
        </motion.div>

        <div style={{ width: "100%", marginTop: spacing.md }}>
          <AnimatedButton onClick={onNext} color={primaryColor}>
            {hasNextBlock ? "Siguiente grupo →" : "Jugar de nuevo →"}
          </AnimatedButton>
        </div>

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          style={{
            background: "none",
            border: "none",
            color: colors.text.muted,
            fontSize: fontSizes.sm,
            cursor: "pointer",
            padding: spacing.sm,
            minHeight: 44,
          }}
        >
          {moreOpen ? "Ocultar opciones ▴" : "Más opciones ▾"}
        </button>

        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{ display: "flex", flexDirection: "column", gap: spacing.sm, width: "100%", overflow: "hidden" }}
          >
            {hasNextBlock && (
              <AnimatedButton variant="secondary" onClick={onReplay}>
                Jugar este de nuevo
              </AnimatedButton>
            )}
            <AnimatedButton variant="secondary" onClick={onChangeBlock}>
              Cambiar palabras
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={onChangeWorld}>
              Cambiar de mundo
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={onMenu}>
              Volver al menu
            </AnimatedButton>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
