"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SofiaSpeechBubble } from "@/shared/components/doman-visuals/SofiaSpeechBubble";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { sofiaPlayAudio, sofiaNameWord, stopVoice } from "@/shared/services/sofiaVoice";
import { colors, fonts, fontSizes, spacing } from "@/shared/styles/design-tokens";

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
  gameIcon,
  rulesText,
  color = colors.brand.primary,
  onReady,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showBubble, setShowBubble] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Play pre-recorded rules audio, fallback to TTS
      const mp3 = RULES_AUDIO[gameName] ?? null;
      if (mp3) {
        await sofiaPlayAudio(mp3, rulesText, "gentle");
      } else {
        // No MP3 available — use word-by-word reading with Dalia MP3s
        const rulesWords = rulesText.split(/\s+/);
        for (const w of rulesWords) {
          if (cancelled) return;
          await sofiaNameWord(w.replace(/[¡!¿?.,:;]/g, "").toLowerCase());
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      if (cancelled) return;

      setShowBubble(false);

      // Countdown 3-2-1
      for (let i = 3; i >= 1; i--) {
        if (cancelled) return;
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 800));
      }

      if (!cancelled) onReady();
    }

    run();
    return () => { cancelled = true; stopVoice(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 400, gap: spacing.xl,
    }}>
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
              fontSize: 72, fontWeight: "bold", fontFamily: fonts.display,
              color, marginTop: spacing.md,
            }}
          >
            {countdown}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
