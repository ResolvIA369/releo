"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import type { GameId, GameProps, GameSessionState } from "../types";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { RewardsProvider } from "@/shared/components/RewardsLayer";
import { WordFlash } from "./WordFlash";
import { WordImageMatch } from "./WordImageMatch";
import { MemoryCards } from "./MemoryCards";
import { WordTrain } from "./WordTrain";
import { WordRain } from "./WordRain";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { staggerContainer, staggerItem } from "@/shared/styles/animations";

// ─── Doman phases with word groups ────────────────────────────

const PHASES_CONFIG = [
  { phase: 1 as PhaseNumber, name: "Palabras Sencillas", color: "#48bb78", icon: "🏝️", image: "/images/worlds/isla.png", words: PHASE1_WORDS, wordsPerGroup: 5 },
  { phase: 2 as PhaseNumber, name: "Parejas de Palabras", color: "#667eea", icon: "🌊", image: "/images/worlds/bahia.png", words: PHASE2_WORDS, wordsPerGroup: 5 },
  { phase: 3 as PhaseNumber, name: "Oraciones Sencillas", color: "#fbbf24", icon: "🌄", image: "/images/worlds/valle.png", words: PHASE3_WORDS, wordsPerGroup: 5 },
  { phase: 4 as PhaseNumber, name: "Frases y Lectura", color: "#f56565", icon: "🏔️", image: "/images/worlds/montana.png", words: [...PHASE4_WORDS, ...PHASE5_WORDS], wordsPerGroup: 5 },
];

interface WordGroup {
  label: string;
  category: string;
  words: DomanWord[];
}

function buildGroups(phaseWords: DomanWord[], perGroup: number): WordGroup[] {
  const groups: WordGroup[] = [];
  for (let i = 0; i < phaseWords.length; i += perGroup) {
    const chunk = phaseWords.slice(i, i + perGroup);
    if (chunk.length < 3) break;
    groups.push({
      label: `Grupo ${groups.length + 1}`,
      category: chunk[0].categoryDisplay,
      words: chunk,
    });
  }
  return groups;
}

// ─── Game sequence for each word group ────────────────────────
// The child progresses through these games in order with the same words

const GAME_SEQUENCE: { id: GameId; name: string; icon: string; color: string }[] = [
  { id: "word-flash", name: "Aprender", icon: "⚡", color: "#e53e3e" },
  { id: "word-image-match", name: "Reconocer", icon: "🖼️", color: "#3182ce" },
  { id: "memory-cards", name: "Rompecabezas", icon: "🧩", color: "#805ad5" },
  { id: "word-rain", name: "Reflejos", icon: "🌧️", color: "#4299e1" },
  { id: "word-train", name: "Velocidad", icon: "🚂", color: "#38a169" },
];

// ─── Game components map ──────────────────────────────────────

const GAME_COMPONENTS: Partial<Record<GameId, React.FC<GameProps>>> = {
  "word-flash": WordFlash,
  "word-image-match": WordImageMatch,
  "memory-cards": MemoryCards,
  "word-rain": WordRain,
  "word-train": WordTrain,
};

type Step = "phase" | "group" | "sequence" | "playing" | "step-complete";

interface Props {
  onBack: () => void;
}

export const WordPath: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>("phase");
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<WordGroup | null>(null);
  const [gameIdx, setGameIdx] = useState(0);
  const [lastResult, setLastResult] = useState<GameSessionState | null>(null);

  const phaseConfig = PHASES_CONFIG[selectedPhaseIdx];
  const groups = useMemo(() => buildGroups(phaseConfig.words, phaseConfig.wordsPerGroup), [phaseConfig]);

  const currentGame = GAME_SEQUENCE[gameIdx];
  const GameComponent = currentGame ? GAME_COMPONENTS[currentGame.id] : null;

  const handleSelectPhase = (idx: number) => {
    setSelectedPhaseIdx(idx);
    setStep("group");
  };

  const handleSelectGroup = (group: WordGroup) => {
    setSelectedGroup(group);
    setGameIdx(0);
    setStep("sequence");
  };

  const handleStartGame = () => setStep("playing");

  const handleGameComplete = (result?: GameSessionState) => {
    setLastResult(result ?? null);
    setStep("step-complete");
  };

  const handleNextGame = () => {
    const next = gameIdx + 1;
    if (next >= GAME_SEQUENCE.length) {
      // Completed all games for this word group
      setStep("group");
      setSelectedGroup(null);
      setGameIdx(0);
    } else {
      setGameIdx(next);
      setStep("sequence");
    }
  };

  // ═══ Step 1: Phase selection ════════════════════════════════

  if (step === "phase") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg, maxWidth: 480, margin: "0 auto" }}>
        <SofiaAvatar size={48} speaking={false} />
        <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
          Elige una fase
        </h2>
        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, margin: 0, textAlign: "center" }}>
          Cada fase tiene grupos de palabras. Practica cada grupo con 5 juegos diferentes.
        </p>

        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          style={{ display: "flex", flexDirection: "column", gap: spacing.md, width: "100%" }}>
          {PHASES_CONFIG.map((p, idx) => {
            const groupCount = buildGroups(p.words, p.wordsPerGroup).length;
            return (
              <motion.button key={p.phase} variants={staggerItem}
                whileHover={{ y: -3, boxShadow: shadows.glow(p.color) }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPhase(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: spacing.lg,
                  padding: spacing.md, backgroundColor: colors.bg.card,
                  border: `2px solid ${colors.border.light}`, borderRadius: radii.xl,
                  cursor: "pointer", textAlign: "left", boxShadow: shadows.sm,
                }}>
                <img src={p.image} alt={p.name} style={{
                  width: 80, height: 80, borderRadius: radii.lg, flexShrink: 0, objectFit: "cover",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fontSizes.md, fontFamily: fonts.display, fontWeight: "bold", color: p.color }}>
                    Fase {p.phase}: {p.name}
                  </div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.text.placeholder }}>
                    {p.words.length} palabras · {groupCount} grupos
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    );
  }

  // ═══ Step 2: Word group selection ═══════════════════════════

  if (step === "group") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg, maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 36 }}>{phaseConfig.icon}</span>
          <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: phaseConfig.color, margin: `${spacing.xs}px 0 0` }}>
            {phaseConfig.name}
          </h2>
          <p style={{ fontSize: fontSizes.sm, color: colors.text.muted }}>
            Elige un grupo de {phaseConfig.wordsPerGroup} palabras
          </p>
        </div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: spacing.sm, width: "100%" }}>
          {groups.map((group, idx) => (
            <motion.button key={idx} variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectGroup(group)}
              style={{
                display: "flex", flexDirection: "column", gap: 4,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.lg, backgroundColor: colors.bg.card,
                border: `2px solid ${colors.border.light}`,
                boxShadow: shadows.sm, cursor: "pointer", textAlign: "left",
              }}>
              <div style={{ fontSize: fontSizes.sm, fontWeight: "bold", fontFamily: fonts.display, color: phaseConfig.color }}>
                {group.category}
              </div>
              <div style={{ fontSize: fontSizes.xs, color: colors.text.muted, lineHeight: 1.5 }}>
                {group.words.map((w) => `${w.text} ${EMOJI_MAP[w.text] ?? ""}`).join("  ")}
              </div>
            </motion.button>
          ))}
        </motion.div>

        <button onClick={() => setStep("phase")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.sm, color: colors.text.muted }}>
          ← Cambiar fase
        </button>
      </div>
    );
  }

  // ═══ Step 3: Game sequence overview ═════════════════════════

  if (step === "sequence" && selectedGroup) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg, maxWidth: 400, margin: "0 auto" }}>
        <SofiaAvatar size={48} speaking={false} />

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
            {selectedGroup.category}
          </h2>
          <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, marginTop: spacing.xs }}>
            {selectedGroup.words.map((w) => w.text).join(", ")}
          </p>
        </div>

        {/* Game sequence progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, width: "100%" }}>
          {GAME_SEQUENCE.map((game, idx) => {
            const isDone = idx < gameIdx;
            const isCurrent = idx === gameIdx;
            return (
              <div key={game.id} style={{
                display: "flex", alignItems: "center", gap: spacing.md,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.lg,
                backgroundColor: isCurrent ? `${game.color}12` : colors.bg.card,
                border: `2px solid ${isCurrent ? game.color : colors.border.light}`,
                opacity: isDone ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 24 }}>
                  {isDone ? "✅" : isCurrent ? game.icon : "🔒"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: fontSizes.md, fontWeight: "bold",
                    fontFamily: fonts.display,
                    color: isCurrent ? game.color : isDone ? colors.text.muted : colors.text.primary,
                  }}>
                    {idx + 1}. {game.name}
                  </div>
                </div>
                {isCurrent && (
                  <span style={{
                    fontSize: fontSizes.xs, fontWeight: "bold", color: "#fff",
                    backgroundColor: game.color, padding: `2px ${spacing.sm}px`,
                    borderRadius: radii.sm,
                  }}>
                    SIGUIENTE
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <AnimatedButton color={currentGame.color} onClick={handleStartGame}>
          {currentGame.icon} {currentGame.name}
        </AnimatedButton>

        <button onClick={() => { setStep("group"); setSelectedGroup(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.sm, color: colors.text.muted }}>
          ← Cambiar palabras
        </button>
      </div>
    );
  }

  // ═══ Step 4: Playing a game ═════════════════════════════════

  if (step === "playing" && selectedGroup && GameComponent) {
    return (
      <RewardsProvider>
        <GameComponent
          words={selectedGroup.words}
          phase={phaseConfig.phase}
          onComplete={handleGameComplete}
          onBack={() => setStep("sequence")}
        />
      </RewardsProvider>
    );
  }

  // ═══ Step 5: Game step complete ═════════════════════════════

  if (step === "step-complete" && selectedGroup) {
    const isLast = gameIdx >= GAME_SEQUENCE.length - 1;
    const pct = lastResult && lastResult.totalAttempts > 0
      ? Math.round((lastResult.correctAttempts / lastResult.totalAttempts) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: spacing.lg, minHeight: "70vh",
        maxWidth: 400, margin: "0 auto",
      }}>
        <CelebrationGif size={180} />

        <div style={{ display: "flex", gap: spacing.sm, fontSize: 40 }}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.15, type: "spring", damping: 8 }}
              style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}>⭐</motion.span>
          ))}
        </div>

        <h2 style={{ fontSize: fontSizes.xl, fontFamily: fonts.display, color: currentGame.color, margin: 0 }}>
          {currentGame.icon} {currentGame.name} completado
        </h2>

        {lastResult && lastResult.totalAttempts > 0 && (
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, margin: 0 }}>
            {lastResult.correctAttempts}/{lastResult.totalAttempts} correctas
          </p>
        )}

        {/* Progress indicator */}
        <div style={{ display: "flex", gap: spacing.xs, alignItems: "center" }}>
          {GAME_SEQUENCE.map((g, idx) => (
            <div key={g.id} style={{
              width: idx <= gameIdx ? 28 : 12, height: 8,
              borderRadius: radii.pill,
              backgroundColor: idx <= gameIdx ? g.color : colors.bg.secondary,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, width: "100%", marginTop: spacing.sm }}>
          {isLast ? (
            <>
              <AnimatedButton color={phaseConfig.color} onClick={() => { setStep("group"); setSelectedGroup(null); setGameIdx(0); }}>
                🎉 Elegir otro grupo
              </AnimatedButton>
              <AnimatedButton variant="secondary" onClick={onBack}>
                Volver al menu
              </AnimatedButton>
            </>
          ) : (
            <>
              <AnimatedButton color={GAME_SEQUENCE[gameIdx + 1].color} onClick={handleNextGame}>
                Siguiente: {GAME_SEQUENCE[gameIdx + 1].icon} {GAME_SEQUENCE[gameIdx + 1].name}
              </AnimatedButton>
              <AnimatedButton variant="secondary" onClick={() => { setStep("group"); setSelectedGroup(null); setGameIdx(0); }}>
                Cambiar palabras
              </AnimatedButton>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};
