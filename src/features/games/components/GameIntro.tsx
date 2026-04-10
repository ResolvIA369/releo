"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SofiaSpeechBubble } from "@/shared/components/doman-visuals/SofiaSpeechBubble";
import { sofiaPlayAudio, sofiaNameWord, stopVoice } from "@/shared/services/sofiaVoice";
import { colors, fonts, fontSizes, spacing, radii, shadows } from "@/shared/styles/design-tokens";

// Map game names to their pre-recorded audio files
const RULES_AUDIO: Record<string, string> = {
  "Empareja Palabra-Imagen": "reglas-empareja",
  "Rompecabezas": "reglas-rompecabezas",
  "Palabra Escondida": "reglas-memoria",
  "Lluvia de Palabras": "reglas-lluvia",
  "Pesca de Palabras": "reglas-pesca",
  "Categorias": "reglas-categorias",
  "Construye la Frase": "reglas-frase",
  "Tren de Palabras": "reglas-tren",
  "Cuenta Cuentos": "reglas-cuentos",
  "Burbujas Magicas": "reglas-burbujas",
  "Bits de Lectura": "reglas-bits",
};

interface GameIntroProps {
  gameName: string;
  gameIcon: string;
  rulesText: string;
  color?: string;
  onReady: () => void;
}

export const GameIntro: React.FC<GameIntroProps> = ({
  gameName,
  rulesText,
  color = colors.brand.primary,
  onReady,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showBubble, setShowBubble] = useState(true);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);

  // Skip the intro and jump straight into the game
  const startNow = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    cancelledRef.current = true;
    stopVoice();
    onReady();
  }, [onReady]);

  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      // Play pre-recorded rules audio, fallback to TTS
      const mp3 = RULES_AUDIO[gameName] ?? null;
      if (mp3) {
        await sofiaPlayAudio(mp3, rulesText, "gentle");
      } else {
        // No MP3 available — use word-by-word reading with Dalia MP3s
        const rulesWords = rulesText.split(/\s+/);
        for (const w of rulesWords) {
          if (cancelledRef.current) return;
          await sofiaNameWord(w.replace(/[¡!¿?.,:;]/g, "").toLowerCase());
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      if (cancelledRef.current) return;

      setShowBubble(false);

      // Countdown 3-2-1
      for (let i = 3; i >= 1; i--) {
        if (cancelledRef.current) return;
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 800));
      }

      if (!cancelledRef.current && !startedRef.current) {
        startedRef.current = true;
        onReady();
      }
    }

    run();

    // Safety net: no matter what happens with audio, after 18s
    // force-start the game so the user is never blocked.
    const safetyTimer = setTimeout(() => {
      if (!startedRef.current) startNow();
    }, 18000);

    return () => {
      cancelledRef.current = true;
      clearTimeout(safetyTimer);
      stopVoice();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={startNow}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        gap: spacing.xl,
        cursor: "pointer",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color, margin: 0 }}
      >
        {gameName}
      </motion.h2>

      <SofiaSpeechBubble text={rulesText} visible={showBubble} worldColor={color} />

      <AnimatePresence mode="wait">
        {countdown !== null && (
          <motion.span
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: 72,
              fontWeight: "bold",
              fontFamily: fonts.display,
              color,
              marginTop: spacing.md,
            }}
          >
            {countdown}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Always-visible "Empezar" button so the user never feels stuck. */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={(e) => {
          e.stopPropagation();
          startNow();
        }}
        style={{
          marginTop: spacing.md,
          padding: `${spacing.md}px ${spacing.xl}px`,
          backgroundColor: color,
          color: "#fff",
          border: "none",
          borderRadius: radii.pill,
          fontSize: fontSizes.lg,
          fontWeight: "bold",
          fontFamily: fonts.display,
          cursor: "pointer",
          boxShadow: shadows.button,
          minHeight: 56,
        }}
      >
        ▶ Empezar
      </motion.button>
    </div>
  );
};
