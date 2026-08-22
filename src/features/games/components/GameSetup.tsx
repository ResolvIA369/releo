"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import { WORLDS } from "@/features/progression/config/worlds";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { staggerContainer, staggerItem } from "@/shared/styles/animations";

const WORDS_BY_PHASE: DomanWord[][] = [PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS];

interface WordBlock {
  label: string;
  words: DomanWord[];
  category: string;
}

function buildBlocks(phaseWords: DomanWord[]): WordBlock[] {
  // Split 50 words into 3 blocks: 16 + 17 + 17
  // For phase 5 (20 words): single block of 20
  const total = phaseWords.length;
  if (total <= 20) {
    return [{
      label: "1",
      words: phaseWords,
      category: phaseWords[0]?.categoryDisplay ?? "",
    }];
  }

  const firstSize = Math.floor(total / 3);       // 16 for 50
  const secondSize = Math.ceil((total - firstSize) / 2); // 17
  const thirdSize = total - firstSize - secondSize;      // 17

  const chunks = [
    phaseWords.slice(0, firstSize),
    phaseWords.slice(firstSize, firstSize + secondSize),
    phaseWords.slice(firstSize + secondSize),
  ];

  return chunks.map((chunk, i) => ({
    label: `${i + 1}`,
    words: chunk,
    category: chunk[0]?.categoryDisplay ?? "",
  }));
}

interface GameSetupProps {
  gameIcon: string;
  gameName: string;
  gameColor: string;
  wordsPerBlock: number;
  initialWorldIdx?: number | null;
  onSelect: (
    words: DomanWord[],
    phase: PhaseNumber,
    worldId: string,
    worldIdx: number,
    blockIdx: number,
  ) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  gameIcon,
  gameName,
  gameColor,
  wordsPerBlock,
  initialWorldIdx = null,
  onSelect,
}) => {
  const [selectedWorldIdx, setSelectedWorldIdx] = useState<number | null>(initialWorldIdx);

  const world = selectedWorldIdx !== null ? WORLDS[selectedWorldIdx] : null;
  const phaseWords = selectedWorldIdx !== null ? WORDS_BY_PHASE[selectedWorldIdx] : [];
  const blocks = useMemo(() => buildBlocks(phaseWords), [phaseWords]);

  // ─── World selection ────────────────────────────────────────

  if (selectedWorldIdx === null) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: spacing.lg, maxWidth: 480, margin: "0 auto",
      }}>
        <SofiaAvatar size={48} speaking={false} />

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: gameColor, margin: 0 }}>
            {gameIcon} {gameName}
          </h2>
          <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: spacing.xs }}>
            Elige un mundo
          </p>
        </div>

        <motion.div
          variants={staggerContainer} initial="initial" animate="animate"
          style={{ display: "flex", flexDirection: "column", gap: spacing.md, width: "100%" }}
        >
          {WORLDS.map((w, idx) => (
            <motion.button
              key={w.id}
              variants={staggerItem}
              whileHover={{ y: -4, boxShadow: shadows.glow(w.color) }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedWorldIdx(idx)}
              style={{
                display: "flex", alignItems: "center", gap: spacing.lg,
                padding: spacing.md,
                backgroundColor: colors.bg.card,
                border: `2px solid ${colors.border.light}`,
                borderRadius: radii.xl,
                cursor: "pointer", textAlign: "left",
                boxShadow: shadows.sm,
                overflow: "hidden",
              }}
            >
              {/* next/image y no <img>: el archivo original es de 1200x654 y
                  acá se muestra a 80x80. Sin esto el navegador se baja ~300 KB
                  por cada mundo (1,4 MB para los cinco) para pintar cinco
                  miniaturas. Next sirve la versión chica en WebP. */}
              <Image
                src={w.image}
                alt={w.name}
                width={80}
                height={80}
                sizes="80px"
                style={{
                  width: 80, height: 80, borderRadius: radii.lg, flexShrink: 0,
                  objectFit: "cover",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: fontSizes.md, fontFamily: fonts.display, fontWeight: "bold", color: w.color }}>
                  {w.name}
                </div>
                <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>
                  Fase {w.phase} · {w.totalWords} palabras
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    );
  }

  // ─── Block selection within world ───────────────────────────

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: spacing.lg, maxWidth: 500, margin: "0 auto",
    }}>
      <SofiaAvatar size={48} speaking={false} />

      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: world!.color, margin: 0 }}>
          {world!.icon} {world!.name}
        </h2>
        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: spacing.xs }}>
          Elegí las palabras para practicar
        </p>
      </div>

      <motion.div
        variants={staggerContainer} initial="initial" animate="animate"
        style={{
          display: "grid",
          gridTemplateColumns: wordsPerBlock <= 10 ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(200px, 1fr))",
          gap: spacing.sm, width: "100%",
        }}
      >
        {blocks.map((block, idx) => (
          <motion.button
            key={idx}
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(block.words, world!.phase as PhaseNumber, world!.id, selectedWorldIdx!, idx)}
            style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: radii.lg, backgroundColor: colors.bg.card,
              border: `2px solid ${colors.border.light}`,
              boxShadow: shadows.sm, cursor: "pointer",
              textAlign: "left", minHeight: 56,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: fontSizes.sm, fontWeight: "bold", fontFamily: fonts.display, color: world!.color }}>
                {block.category}
              </span>
              <span style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>
                {block.words.length} palabras
              </span>
            </div>
            <div style={{ fontSize: fontSizes.xs, color: colors.text.muted, lineHeight: 1.5 }}>
              {block.words.map((w) => `${w.text} ${EMOJI_MAP[w.text] ?? ""}`).join("  ")}
            </div>
          </motion.button>
        ))}
      </motion.div>

      <button
        onClick={() => setSelectedWorldIdx(null)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.sm, color: colors.text.muted }}
      >
        ← Cambiar mundo
      </button>
    </div>
  );
};
