"use client";

import React from "react";
import { motion } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { AudioWaves } from "@/shared/components/doman-visuals";
import { fonts, fontSizes, spacing } from "@/shared/styles/design-tokens";

// Overlay de intro de los juegos arcade: muestra a la Seño Sofía en
// pantalla mientras dice la consigna (como el GameIntro de los juegos
// de pensar). Se renderiza solo durante la fase "intro"; los juegos
// Pixi mantienen su canvas montado debajo.
interface ArcadeIntroProps {
  color: string;
}

export const ArcadeIntro: React.FC<ArcadeIntroProps> = ({ color }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.lg,
      padding: spacing.lg,
      backgroundColor: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(3px)",
      WebkitBackdropFilter: "blur(3px)",
    }}
  >
    <SofiaAvatar size={200} speaking mood="motivating" />
    <AudioWaves active color={color} />
    <p style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, color, margin: 0, textAlign: "center" }}>
      🔊 Escuchá a la Seño Sofía...
    </p>
  </motion.div>
);
