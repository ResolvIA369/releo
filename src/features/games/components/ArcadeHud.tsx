"use client";

import React from "react";
import { motion } from "framer-motion";
import type { DomanWord } from "@/shared/types/doman";
import { colors, spacing, radii, fontSizes, fonts } from "@/shared/styles/design-tokens";
import { domanCanvasText } from "../config/doman-canvas";
import { IMMERSIVE_HEADER_H } from "./GameShell";

const MAX_W = "min(640px, calc(100vw - 32px))";

// ─── HUD compartido de los juegos arcade: badge de nivel + aciertos +
// pill fija del objetivo (prefijo por juego) + barra de energia ──────

interface ArcadeHudProps {
  color: string; // color del juego (registry)
  targetPrefix: string; // "Volá a:", "Tocá:", "Saltá a:"
  level: number; // 0-based
  correct: number;
  targetWord: DomanWord | null;
  waveKey: number; // re-anima la pill cuando cambia la tanda
  energy: number;
  energyMax: number;
  // Variante para juegos con canvas grande (QA sep-2026, Leo Vuela): en vez
  // de ocupar fila propia arriba del canvas, se dibuja ENCIMA de el como
  // overlay. Requiere que el padre tenga position:relative (y, para que el
  // tamano de fuente escale con el tamano real del canvas en vez de quedar
  // fijo en px, containerType:"size" — por eso las medidas de acá usan
  // unidades cqh/cqw, no px). Default false preserva el layout en flujo
  // normal que usan los otros juegos arcade (BitsReading, WordFishing,
  // WordRain, WordTrain, SaltaPalabra, LeoRunner) sin ningun cambio.
  overlay?: boolean;
}

export const ArcadeHud: React.FC<ArcadeHudProps> = ({ color, targetPrefix, level, correct, targetWord, waveKey, energy, energyMax, overlay = false }) => {
  if (overlay) {
    return (
      <div
        style={{
          // top en px fijo (no cqh): tiene que despejar la barra flotante
          // de GameShell (pausa/titulo/cofre). IMMERSIVE_HEADER_H (60) es
          // el alto REAL del header — importado de GameShell, no remedido
          // acá — mas spacing.sm (8) de aire minimo. Antes esto era 52 fijo
          // ("sin margen extra"), que es el borde del BOTON de pausa, no el
          // borde real del header (8px mas abajo): en mobile (390x844,
          // 360x740 — canvas chico, arranca casi pegado al viewport) el HUD
          // quedaba tocando el header (QA sep-2026). Cualquier px de mas
          // acá le resta directamente a la banda libre de nubes de abajo,
          // que en canvases chicos ya es escasa — no agrandar sin motivo.
          //
          // Una sola fila (nivel + objetivo + energia) en vez de dos: la
          // nube mas alta (CLOUD_BANDS[0] en LeoVuela.tsx) empieza recien
          // al ~13.5% de la altura logica del canvas — con este offset esa
          // banda seguro-de-nubes solo alcanza para UNA fila compacta en el
          // rango de canvas de esta tarea (desktop, 1280-1920px de
          // viewport). Con dos filas (version anterior) la fila de energia
          // quedaba pisando la banda de nubes en 1280x900 — se verifico con
          // captura real, no era hipotetico.
          position: "absolute", top: IMMERSIVE_HEADER_H + spacing.sm, left: 0, right: 0, zIndex: 15,
          display: "flex", alignItems: "center", gap: "1cqw",
          padding: "0 2cqw", pointerEvents: "none",
        }}
      >
        <span
          style={{
            display: "flex", alignItems: "center", gap: "0.8cqw",
            fontSize: "2.2cqh", color: colors.text.placeholder, whiteSpace: "nowrap",
            backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(3px)",
            border: `2px solid ${color}b3`, boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            borderRadius: 999, padding: "0.4cqh 1.2cqw",
          }}
        >
          <motion.span
            key={level}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            style={{ fontWeight: "bold", fontFamily: fonts.display, color }}
          >
            N{level + 1}
          </motion.span>
          ✓{correct}
        </span>

        {/* El cartel del objetivo es el elemento pedagogico central: banda
            segura fija en el tercio superior del canvas (ver CLOUD_BANDS
            en LeoVuela.tsx — la nube mas alta empieza recien al ~13.5% de
            la altura logica del canvas) mas fondo solido-ish, para que
            nunca quede tapado ni se confunda con una nube-palabra. Ademas,
            al ser DOM por encima del <canvas> (zIndex 15 vs el canvas sin
            zIndex), ninguna nube puede taparlo aunque coincidieran en
            posicion — solo importa la banda para que no se vean "pegados". */}
        {targetWord && (
          <div
            style={{
              flex: 1, textAlign: "center", minWidth: 0,
              padding: "0.5cqh 2cqw",
              backgroundColor: `${color}f2`, border: `2px solid ${color}`,
              boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
              borderRadius: 999, fontSize: "3cqh", lineHeight: 1.15,
              fontWeight: "bold", fontFamily: fonts.display, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {targetPrefix} <motion.span
              key={targetWord.id + waveKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >{targetWord.text}</motion.span>
          </div>
        )}

        {/* Barra de energia: compacta, sin icono propio, integrada a la
            misma fila para no sumar una segunda banda de altura. */}
        <div
          role="progressbar"
          aria-label="Energía"
          aria-valuenow={energy}
          aria-valuemin={0}
          aria-valuemax={energyMax}
          style={{
            width: "10cqw", flexShrink: 0, height: "1.8cqh", minHeight: 8, borderRadius: 999,
            backgroundColor: "rgba(238,234,243,0.85)", overflow: "hidden",
            border: `1px solid ${colors.border.light}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              width: `${(energy / energyMax) * 100}%`,
              height: "100%",
              borderRadius: 999,
              backgroundColor: energy > 50 ? "#48bb78" : energy > 25 ? "#f6ad55" : "#f56565",
              transition: "width 0.25s ease, background-color 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  }

  return (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: MAX_W }}>
      <span style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSizes.sm, color: colors.text.placeholder }}>
        <motion.span
          key={level}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          style={{
            padding: `2px ${spacing.sm}px`, borderRadius: radii.pill,
            backgroundColor: `${color}20`, color,
            fontWeight: "bold", fontFamily: fonts.display,
          }}
        >
          Nivel {level + 1}
        </motion.span>
        ✓ {correct}
      </span>
      {targetWord && (
        <div
          style={{
            padding: `${spacing.xs}px ${spacing.lg}px`,
            backgroundColor: `${color}15`, border: `2px solid ${color}`,
            borderRadius: radii.pill, fontSize: fontSizes.xl,
            fontWeight: "bold", fontFamily: fonts.display, color,
          }}
        >
          {targetPrefix} <motion.span
            key={targetWord.id + waveKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: domanCanvasText(targetWord).fill }}
          >{targetWord.text}</motion.span>
        </div>
      )}
      <span style={{ width: 40 }} />
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, width: "100%", maxWidth: MAX_W }}>
      <span style={{ fontSize: fontSizes.md }} aria-hidden>⚡</span>
      <div
        role="progressbar"
        aria-label="Energía"
        aria-valuenow={energy}
        aria-valuemin={0}
        aria-valuemax={energyMax}
        style={{ flex: 1, height: 14, borderRadius: radii.pill, backgroundColor: "#eeeaf3", overflow: "hidden", border: `1px solid ${colors.border.light}` }}
      >
        <div
          style={{
            width: `${(energy / energyMax) * 100}%`,
            height: "100%",
            borderRadius: radii.pill,
            backgroundColor: energy > 50 ? "#48bb78" : energy > 25 ? "#f6ad55" : "#f56565",
            transition: "width 0.25s ease, background-color 0.3s ease",
          }}
        />
      </div>
    </div>
  </>
  );
};

// ─── Botones ◀ ▶ para esquivar (mobile) — el resto del canvas es accion ──

interface MoveButtonsProps {
  color: string;
  active: boolean;
  onDir: (dir: -1 | 0 | 1) => void;
}

export const MoveButtons: React.FC<MoveButtonsProps> = ({ color, active, onDir }) => {
  // El fondo detras de estos botones cambia por mundo (cielo liso, agua,
  // follaje, flores...) y no todos tienen el mismo contraste contra un
  // circulo blanco traslucido. En vez de resolverlo por mundo, subimos la
  // opacidad del relleno, sumamos blur (mismo patron que ArcadeIntro /
  // MissionNarrative / GameShell) para que lo que se ve detras deje de
  // leerse "textura" en vez de color solido, y una sombra — que separa el
  // boton de cualquier fondo sin depender de su tono — para que el icono
  // mantenga contraste sin importar que haya debajo.
  const btnStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    bottom: 10,
    [side]: 10,
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: `2px solid ${color}b3`,
    backgroundColor: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(3px)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    color,
    fontSize: 22,
    cursor: active ? "pointer" : "default",
    touchAction: "none",
    userSelect: "none",
    zIndex: 6, // encima del boton de accion y de la mascota LeoCompanion (zIndex 5)
  });

  const bind = (dir: -1 | 1) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDir(dir);
    },
    onPointerUp: (e: React.PointerEvent) => { e.stopPropagation(); onDir(0); },
    onPointerLeave: () => onDir(0),
    onPointerCancel: () => onDir(0),
    // Que el click no burbujee hasta el boton de accion del canvas
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  });

  return (
    <>
      <button aria-label="Mover atrás" style={btnStyle("left")} {...bind(-1)}>◀</button>
      <button aria-label="Mover adelante" style={btnStyle("right")} {...bind(1)}>▶</button>
    </>
  );
};
