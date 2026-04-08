"use client";

import { useEffect } from "react";
import type { Affirmation, AffirmationMoment } from "@/shared/types/doman";

// ─── Moment-based styling (ported from doman-app AffirmationLayer) ──

const MOMENT_CONFIG: Record<AffirmationMoment, { icon: string; bg: string }> = {
  correct_answer: { icon: "⭐", bg: "bg-success" },
  after_attempt:  { icon: "💪", bg: "bg-primary" },
  session_end:    { icon: "🌟", bg: "bg-secondary" },
  session_start:  { icon: "👋", bg: "bg-info" },
  achievement:    { icon: "🏆", bg: "bg-warning" },
};

// ─── Props ──────────────────────────────────────────────────────────

interface AffirmationOverlayProps {
  affirmation: Affirmation;
  onDone: () => void;
  durationMs?: number;
}

export function AffirmationOverlay({
  affirmation,
  onDone,
  durationMs = 2500,
}: AffirmationOverlayProps) {
  const config = MOMENT_CONFIG[affirmation.moment] ?? MOMENT_CONFIG.correct_answer;

  useEffect(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Web Audio not available — silent fallback
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [onDone, durationMs]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-spacing-6"
      role="alert"
      aria-live="assertive"
    >
      <button
        onClick={onDone}
        className={`flex items-center gap-spacing-4 rounded-2xl ${config.bg} px-spacing-8 py-spacing-4 shadow-2xl animate-in slide-in-from-top duration-300 cursor-pointer border-none`}
        style={{ maxWidth: "90vw", minHeight: 48 }}
      >
        <span className="text-4xl">{config.icon}</span>
        <span className="font-display text-xl font-bold text-on-primary leading-tight">
          {affirmation.text}
        </span>
      </button>
    </div>
  );
}
