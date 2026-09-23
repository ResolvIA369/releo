"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { AudioWaves } from "@/shared/components/doman-visuals";
import { fonts, fontSizes, spacing } from "@/shared/styles/design-tokens";

// Cuánto dura el cartel de marca antes de pasar a la Seño Sofía.
const BRAND_MS = 1200;

// Overlay de intro de los juegos arcade: muestra a la Seño Sofía en
// pantalla mientras dice la afirmación y, la primera vez, las reglas
// (como el GameIntro de los juegos de pensar). Se renderiza solo durante
// la fase "intro"; los juegos Pixi mantienen su canvas montado debajo.
// Todo el overlay es tocable para saltar (mismo patrón que
// SofiaAffirmationGate) — un toque corta el audio y arranca el juego.
//
// Arranca con el cartel de marca de REleo (el mismo look que usa el
// frente de la ficha en Flash de Palabras, WordFlash.tsx) y recién
// después aparece Sofía — antes iba directo a Sofía sin ningún cartel
// previo (detectado grabando un video de prueba: César pidió que, como en
// Flash de Palabras, primero salga "el cartel de siempre de REleo" y
// después la Seño Sofía).
interface ArcadeIntroProps {
  color: string;
  onSkip?: () => void;
}

export const ArcadeIntro: React.FC<ArcadeIntroProps> = ({ color, onSkip }) => {
  const [showBrand, setShowBrand] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowBrand(false), BRAND_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      role={onSkip ? "button" : undefined}
      tabIndex={onSkip ? 0 : undefined}
      aria-label={onSkip ? "Saltar" : undefined}
      onClick={onSkip}
      onKeyDown={onSkip ? (e) => { if (e.key === "Enter" || e.key === " ") onSkip(); } : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        cursor: onSkip ? "pointer" : undefined,
      }}
    >
      <AnimatePresence mode="wait">
        {showBrand ? (
          <motion.div
            key="brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${color}ee, ${color}88)`,
            }}
          >
            <img src="/images/logo/releo.png" alt="REleo" style={{ height: 140, width: "auto", objectFit: "contain" }} />
          </motion.div>
        ) : (
          <motion.div
            key="sofia"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
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
            {onSkip && (
              <p style={{ fontSize: fontSizes.sm, fontFamily: fonts.display, color, opacity: 0.6, margin: 0 }}>
                Tocá para saltar →
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
