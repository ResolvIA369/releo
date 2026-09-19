"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

interface KidOnboardingProps {
  childName?: string;
  onComplete: () => void;
}

const STEPS_MS = 4500;

/**
 * 20-second on-rails Sofía intro for the very first visit.
 * Three short steps, each ~5s, with a single "Empezar" CTA at the end.
 * Designed for a 3-7yo: huge tap target, no text density, voice-led.
 */
export const KidOnboarding: React.FC<KidOnboardingProps> = ({ childName, onComplete }) => {
  const [step, setStep] = useState(0);
  const cancelledRef = useRef(false);

  const steps = [
    {
      emoji: "👋",
      line: childName ? `¡Hola, ${childName}!` : "¡Hola!",
      sub: "Soy la Seño Sofía y vamos a leer juntos.",
    },
    {
      emoji: "⭐",
      line: "Cada juego suma estrellas y monedas.",
      sub: "Las monedas se canjean por sorpresas.",
    },
    {
      emoji: "👆",
      line: "Tocá para empezar tu primer juego.",
      sub: "Yo te voy a guiar todo el tiempo.",
    },
  ];

  useEffect(() => {
    cancelledRef.current = false;
    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      if (step < steps.length - 1) setStep(step + 1);
    }, STEPS_MS);
    return () => { cancelledRef.current = true; clearTimeout(t); };
  }, [step, steps.length]);

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0,
        background: "linear-gradient(160deg, #fff8e1 0%, #fff 60%)",
        zIndex: 200,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: spacing.xl, fontFamily: fonts.body,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: spacing.lg, maxWidth: 420, textAlign: "center",
          }}
        >
          <SofiaAvatar size={96} speaking />
          <div style={{ fontSize: 72 }}>{current.emoji}</div>
          <h1 style={{
            fontSize: fontSizes["2xl"], fontFamily: fonts.display,
            color: colors.text.primary, margin: 0, lineHeight: 1.2,
          }}>
            {current.line}
          </h1>
          <p style={{ fontSize: fontSizes.lg, color: colors.text.muted, margin: 0 }}>
            {current.sub}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Step dots */}
      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.xl }}>
        {steps.map((_, i) => (
          <span key={i} style={{
            width: i === step ? 28 : 10, height: 10, borderRadius: 5,
            backgroundColor: i <= step ? colors.brand.primary : colors.bg.secondary,
            transition: "width 0.25s, background-color 0.25s",
          }} />
        ))}
      </div>

      {/* Action: skip while early steps, big primary on last */}
      <div style={{ marginTop: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.sm, alignItems: "center" }}>
        {isLast ? (
          <button
            type="button"
            onClick={onComplete}
            style={{
              padding: `${spacing.lg}px ${spacing["2xl"]}px`,
              minWidth: 220, minHeight: 72,
              borderRadius: radii.pill,
              backgroundColor: colors.brand.primary, color: "#fff",
              border: "none",
              fontSize: fontSizes.xl, fontFamily: fonts.display, fontWeight: "bold",
              boxShadow: shadows.glow(colors.brand.primary),
              cursor: "pointer", touchAction: "manipulation",
            }}
          >
            ¡Empezar!
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: spacing.sm, minHeight: 44,
              fontSize: fontSizes.sm, color: colors.text.muted,
              fontFamily: fonts.body,
            }}
          >
            Saltar
          </button>
        )}
      </div>
    </motion.div>
  );
};
