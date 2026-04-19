"use client";

// ─── Doman Demo Player ───────────────────────────────────────────
//
// Thin wrapper that plays one or more sessions using the REAL
// WordFlash game component in demo mode. This guarantees the
// demo looks exactly like a child playing the actual app and
// answering correctly: same card layout, same audio, same
// confetti, same Leo on the timer, same videos at the end of
// each pass, etc.
//
// Demo mode in WordFlash auto-starts each session, auto-taps
// every Round 2 card after ~1.5s, and auto-advances the video
// phase. See WordFlash.tsx isDemo effects.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DomanSession } from "../config/curriculum";
import { WordFlash } from "@/features/games/components/WordFlash";
import { RewardsProvider } from "@/shared/components/RewardsLayer";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface DomanDemoPlayerProps {
  sessions: DomanSession[];
  onComplete?: () => void;
  autoFullscreen?: boolean;
}

export const DomanDemoPlayer: React.FC<DomanDemoPlayerProps> = ({
  sessions,
  onComplete,
  autoFullscreen = true,
}) => {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wordFlashKey, setWordFlashKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const session = sessions[sessionIdx];
  const totalSessions = sessions.length;

  // Elapsed timer — updates every second for the timeline bar
  useEffect(() => {
    if (finished) return;
    const iv = setInterval(() => setElapsed(Date.now() - startRef.current), 1000);
    return () => clearInterval(iv);
  }, [finished]);

  // Fullscreen on mount
  useEffect(() => {
    if (!autoFullscreen) return;
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      document.exitFullscreen?.().catch(() => {});
    };
  }, [autoFullscreen]);

  const handleSessionComplete = useCallback(() => {
    // Small fade-to-black between sessions
    setShowTransition(true);
    setTimeout(() => {
      if (sessionIdx < totalSessions - 1) {
        setSessionIdx((i) => i + 1);
        setWordFlashKey((k) => k + 1);
        setShowTransition(false);
      } else {
        setFinished(true);
        onComplete?.();
      }
    }, 1200);
  }, [sessionIdx, totalSessions, onComplete]);

  if (!session) return null;

  if (finished) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
        }}
      >
        <span style={{ fontSize: 96 }}>🎬</span>
        <h1 style={{ fontSize: 36, margin: 0, color: "#2d3748" }}>
          Demo completa
        </h1>
        <p style={{ fontSize: 18, color: "#718096", margin: 0 }}>
          {totalSessions === 1
            ? "Sesión terminada"
            : `${totalSessions} sesiones reproducidas`}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* Session counter — positioned at bottom to not overlap the round label */}
      {totalSessions > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            padding: "4px 14px",
            borderRadius: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.06)",
            fontSize: 12,
            fontWeight: "bold",
            fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
            color: session.worldColor,
          }}
        >
          Sesión {sessionIdx + 1} / {totalSessions}
        </div>
      )}

      <RewardsProvider>
        <WordFlash
          key={wordFlashKey}
          words={session.words}
          phase={session.phase}
          worldId={session.worldId}
          isDemo
          onComplete={handleSessionComplete}
          onBack={onComplete}
        />
      </RewardsProvider>

      {/* Timeline bar — shows elapsed time for the entire demo recording */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        backgroundColor: "rgba(0,0,0,0.08)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
      }}>
        <motion.div
          animate={{ width: `${Math.min((sessionIdx + (finished ? 1 : 0.5)) / totalSessions * 100, 100)}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: "100%",
            backgroundColor: session?.worldColor ?? "#48bb78",
            borderRadius: "0 6px 6px 0",
          }}
        />
        <span style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
          color: "#555",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {formatTime(elapsed)} — Sesión {sessionIdx + 1}/{totalSessions}
        </span>
      </div>

      <AnimatePresence>
        {showTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              color: "#fff",
              fontSize: 24,
              fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
            }}
          >
            Sesión {sessionIdx + 2} de {totalSessions}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
