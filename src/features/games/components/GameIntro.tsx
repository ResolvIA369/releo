"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { sofiaPlayAudio, sofiaNameWord, stopVoice } from "@/shared/services/sofiaVoice";
import { AudioWaves } from "@/shared/components/doman-visuals";
import { fonts, fontSizes, spacing, radii, shadows } from "@/shared/styles/design-tokens";
import {
  pickPregameAffirmation,
  hasSeenRules,
  markRulesSeen,
} from "@/features/tutor/services/pregameAffirmations";
import type { GameId } from "../types";

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
  "Burbujas Magicas": "reglas-burbujas",
  "Bits de Lectura": "reglas-bits",
};

interface GameIntroProps {
  gameName: string;
  gameIcon: string;
  rulesText: string;
  gameId: GameId;
  color?: string;
  isDemo?: boolean;
  onReady: () => void;
}

export const GameIntro: React.FC<GameIntroProps> = ({
  gameName,
  rulesText,
  gameId,
  color = "#667eea",
  isDemo = false,
  onReady,
}) => {
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const startNow = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    cancelledRef.current = true;
    stopVoice();
    onReady();
  }, [onReady]);

  useEffect(() => {
    cancelledRef.current = false;

    async function playRules() {
      const mp3 = RULES_AUDIO[gameName] ?? null;
      if (mp3) {
        await sofiaPlayAudio(mp3, rulesText, "gentle");
      } else {
        const words = rulesText.split(/\s+/);
        for (const w of words) {
          if (cancelledRef.current) return;
          await sofiaNameWord(w.replace(/[¡!¿?.,:;]/g, "").toLowerCase());
          await new Promise((r) => setTimeout(r, 150));
        }
      }
    }

    async function run() {
      setIsSpeaking(true);

      // Afirmación primero, siempre. Las reglas solo si nunca se
      // escucharon en este juego y no estamos en modo demo — en demo
      // nunca suenan las reglas, solo la afirmación.
      const { mp3: affMp3, text: affText } = pickPregameAffirmation();
      await sofiaPlayAudio(affMp3, affText, "encouraging");
      if (cancelledRef.current) return;

      if (!isDemo && !hasSeenRules(gameId)) {
        markRulesSeen(gameId);
        await playRules();
        if (cancelledRef.current) return;
      }

      setIsSpeaking(false);
      // In demo mode, auto-start once Sofia finishes speaking
      if (isDemo && !cancelledRef.current) {
        setTimeout(() => startNow(), 500);
      }
    }

    run();

    // In demo mode, force-start even if audio stalls
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;
    if (isDemo) {
      safetyTimer = setTimeout(() => startNow(), 10000);
    }

    return () => {
      cancelledRef.current = true;
      stopVoice();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "min(400px, 60vh)",
        gap: spacing.lg,
        padding: spacing.md,
      }}
    >
      {/* Game title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: fontSizes["2xl"],
          fontFamily: fonts.display,
          color,
          margin: 0,
          textAlign: "center",
        }}
      >
        {gameName}
      </motion.h2>

      {/* Sofia speaks the rules — no text bubble, just her avatar */}
      <SofiaAvatar size={200} speaking={isSpeaking} mood="motivating" />
      <AudioWaves active={isSpeaking} color={color} />

      {/* Empezar button — sigue tocable mientras Sofía habla: un toque
          salta la afirmación y/o las reglas y arranca el juego. */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: isSpeaking ? 0.6 : 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => startNow()}
        style={{
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
        {isSpeaking ? "🔊 Escuchá a Sofía... (tocá para saltar)" : "▶ Empezar"}
      </motion.button>
    </div>
  );
};
