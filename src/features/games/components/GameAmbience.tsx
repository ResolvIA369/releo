"use client";

import React from "react";
import { motion } from "framer-motion";

// Capas de ambiente DECORATIVAS para los juegos de accion: no afectan
// la jugabilidad (pointerEvents none, zIndex bajo, aria-hidden). Le dan
// vida a las grabaciones. Cada una pega con el tema del juego.

const layerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  overflow: "hidden",
  zIndex: 0,
};

// Silueta simple de pajaro (dos curvas) — independiente de fuentes
const Bird: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 40 16" fill="none" aria-hidden>
    <path d="M1 14 Q10 2 20 12 Q30 2 39 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// ─── Tren: pajaros cruzando el cielo ───────────────────────────────
export const SkyBirds: React.FC = () => (
  <div style={layerStyle} aria-hidden>
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ x: "-12%" }}
        animate={{ x: "112%", y: [0, -6, 0] }}
        transition={{
          x: { duration: 11 + i * 3, repeat: Infinity, delay: i * 2.8, ease: "linear" },
          y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ position: "absolute", top: `${8 + i * 9}%`, opacity: 0.45 }}
      >
        <Bird size={26 - i * 3} color="#5a6b7a" />
      </motion.div>
    ))}
  </div>
);

// ─── Lluvia: chaparron + relampagos ────────────────────────────────
export const RainAndThunder: React.FC = () => (
  <div style={layerStyle} aria-hidden>
    {/* gotas */}
    {Array.from({ length: 22 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: "-15%", opacity: 0 }}
        animate={{ y: "115%", opacity: [0, 0.5, 0.5, 0] }}
        transition={{ duration: 0.7 + (i % 5) * 0.12, repeat: Infinity, delay: (i % 7) * 0.18, ease: "linear" }}
        style={{
          position: "absolute",
          left: `${(i * 4.5) % 100}%`,
          width: 2,
          height: 16,
          borderRadius: 2,
          background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(120,170,220,0.7))",
        }}
      />
    ))}
    {/* relampago: flash blanco cada ~7s */}
    <motion.div
      animate={{ opacity: [0, 0, 0, 0.55, 0, 0.3, 0] }}
      transition={{ duration: 7, repeat: Infinity, times: [0, 0.82, 0.85, 0.87, 0.9, 0.92, 0.95], ease: "linear" }}
      style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff" }}
    />
  </div>
);

// ─── Pesca: rayos de luz + peces de fondo ──────────────────────────
export const UnderwaterAmbience: React.FC = () => (
  <div style={layerStyle} aria-hidden>
    {/* rayos de luz diagonales */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={`ray${i}`}
        animate={{ opacity: [0.05, 0.18, 0.05] }}
        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i }}
        style={{
          position: "absolute",
          top: "-20%",
          left: `${15 + i * 30}%`,
          width: 60,
          height: "140%",
          transform: "rotate(18deg)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))",
        }}
      />
    ))}
    {/* peces de fondo, lentos */}
    {[0, 1].map((i) => (
      <motion.div
        key={`bg${i}`}
        initial={{ x: i % 2 ? "110%" : "-12%" }}
        animate={{ x: i % 2 ? "-12%" : "110%" }}
        transition={{ duration: 16 + i * 5, repeat: Infinity, ease: "linear", delay: i * 4 }}
        style={{ position: "absolute", top: `${55 + i * 18}%`, opacity: 0.25 }}
      >
        <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden style={{ transform: i % 2 ? "scaleX(-1)" : "none" }}>
          <ellipse cx="14" cy="10" rx="12" ry="7" fill="#bfe9f5" />
          <path d="M26 10 L34 4 L34 16 Z" fill="#bfe9f5" />
        </svg>
      </motion.div>
    ))}
  </div>
);

// ─── Burbujas: burbujas suaves subiendo de fondo ───────────────────
export const FloatingBubbles: React.FC = () => (
  <div style={layerStyle} aria-hidden>
    {Array.from({ length: 12 }).map((_, i) => {
      const size = 8 + (i % 4) * 7;
      return (
        <motion.div
          key={i}
          initial={{ y: "115%", opacity: 0 }}
          animate={{ y: "-15%", opacity: [0, 0.4, 0.4, 0], x: [0, (i % 2 ? 1 : -1) * 14, 0] }}
          transition={{ duration: 6 + (i % 5) * 1.4, repeat: Infinity, delay: (i % 6) * 1.1, ease: "linear" }}
          style={{
            position: "absolute",
            left: `${(i * 8.3) % 96}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7), rgba(255,255,255,0.12))",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        />
      );
    })}
  </div>
);
