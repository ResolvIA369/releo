"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zIndex as z } from "@/shared/styles/design-tokens";

interface VictoryBurstProps {
  active: boolean;
  x?: number;
  y?: number;
  count?: number;
  durationMs?: number;
}

const EMOJIS = ["⭐", "🌟", "✨", "💫", "🎉"];

interface Particle { id: number; emoji: string; angle: number; distance: number; size: number; delay: number; }

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i, emoji: EMOJIS[i % EMOJIS.length],
    angle: (360 / count) * i + (Math.random() * 30 - 15),
    distance: 60 + Math.random() * 80,
    size: 16 + Math.random() * 12, delay: Math.random() * 0.15,
  }));
}

export const VictoryBurst: React.FC<VictoryBurstProps> = ({ active, x = 0, y = 0, count = 8, durationMs = 800 }) => {
  const [particles] = useState(() => generateParticles(count));
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) { setShow(false); return; }
    setShow(true);
    const timer = setTimeout(() => setShow(false), durationMs);
    return () => clearTimeout(timer);
  }, [active, durationMs]);

  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: z.celebration }}>
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: Math.cos(rad) * p.distance, y: Math.sin(rad) * p.distance, scale: [0, 1.2, 0.8], opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
                style={{ position: "absolute", fontSize: p.size, transformOrigin: "center" }}
              >
                {p.emoji}
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
};
