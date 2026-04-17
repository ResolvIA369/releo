"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedButton } from "./AnimatedButton";
import { CelebrationGif } from "./CelebrationGif";
import { colors, spacing, fonts, fontSizes } from "@/shared/styles/design-tokens";
import { fadeInUp, starPop } from "@/shared/styles/animations";
import { pickEndVideo } from "@/shared/utils/videoPool";
import { useRewards } from "./RewardsLayer";
import { useAppStore } from "@/shared/store/useAppStore";

interface GameCompleteScreenProps {
  title: string;
  correct: number;
  total: number;
  color?: string;
  onReplay: () => void;
  onBack: () => void;
}

function getStars(correct: number, total: number): number {
  if (total === 0 || correct === 0) return 0;
  const r = correct / total;
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : 1;
}

const MESSAGES = ["¡Seguí practicando!", "¡Seguí practicando!", "¡Buen trabajo!", "¡Muy bien!", "¡Perfecto!"];

interface ChestCoin {
  id: number;
  startX: number;
  delay: number;
}

export const GameCompleteScreen: React.FC<GameCompleteScreenProps> = ({
  title, correct, total, color = colors.brand.primary, onReplay, onBack,
}) => {
  const stars = getStars(correct, total);
  const message = MESSAGES[stars];
  const { bigBurst } = useRewards();
  const addCoins = useAppStore((s) => s.addCoins);
  const [chestOpen, setChestOpen] = useState(false);
  const [coins, setCoins] = useState<ChestCoin[]>([]);
  const [storedCount, setStoredCount] = useState(0);
  const firedRef = useRef(false);

  // Only award coins if the player got at least 1 correct.
  // 0/5 = no reward (no coins, no chest, no confetti).
  const totalCoins = correct > 0 ? correct + 5 : 0;

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // No celebration if 0 correct
    if (totalCoins === 0) return;

    // 1. Big celebration burst
    setTimeout(() => bigBurst(), 200);

    // 2. Open chest after the stars animate in
    setTimeout(() => setChestOpen(true), 1400);

    // 3. Drop coins one by one into chest
    const initialDelay = 1700;
    const newCoins: ChestCoin[] = [];
    for (let i = 0; i < totalCoins; i++) {
      newCoins.push({
        id: i,
        startX: (Math.random() - 0.5) * 200,
        delay: initialDelay + i * 110,
      });
    }
    setCoins(newCoins);

    // 4. Increment displayed count as each coin lands
    newCoins.forEach((c, i) => {
      setTimeout(() => {
        setStoredCount(i + 1);
      }, c.delay + 700);
    });

    // 5. Persist coins to store after all have landed
    const persistDelay = initialDelay + totalCoins * 110 + 800;
    setTimeout(() => {
      addCoins(totalCoins);
      setTimeout(() => setChestOpen(false), 600);
    }, persistDelay);
  }, [bigBurst, totalCoins, addCoins]);

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.md, position: "relative", paddingBottom: 180 }}
    >
      {/* Celebration / motivation video */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ borderRadius: 16, overflow: "hidden", maxWidth: "min(360px, 90vw)" }}
      >
        <video
          src={pickEndVideo(stars)}
          autoPlay
          playsInline
          muted={false}
          controls={false}
          onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
          style={{ width: "100%", borderRadius: 16, display: "block" }}
        />
      </motion.div>

      {/* Stars — 0 stars shows a motivational emoji instead */}
      <div style={{ display: "flex", gap: spacing.md }}>
        {stars === 0 ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 8 }}
            style={{ fontSize: 64 }}>💪</motion.span>
        ) : (
          [0, 1, 2].map((i) => (
            <motion.span key={i} variants={starPop} initial="initial" animate="animate"
              transition={{ delay: 0.3 + i * 0.2 }}
              style={{ fontSize: 48, filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}
            >⭐</motion.span>
          ))
        )}
      </div>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        style={{ fontSize: fontSizes["2xl"], color, margin: 0, fontFamily: fonts.display, textAlign: "center" }}
      >{message}</motion.h2>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{ fontSize: fontSizes.lg, color: colors.text.muted, margin: 0, fontFamily: fonts.body }}
      >{correct} de {total} correctas</motion.p>

      {/* Chest with falling coins */}
      <div style={{ position: "relative", width: 200, height: 140, marginTop: spacing.md }}>
        {/* Falling coins */}
        <AnimatePresence>
          {coins.map((c) => (
            <motion.div
              key={c.id}
              initial={{
                top: -260,
                left: `calc(50% + ${c.startX}px - 22px)`,
                opacity: 0,
                rotate: 0,
                scale: 0.8,
              }}
              animate={{
                top: chestOpen ? [-260, 60] : -260,
                opacity: [0, 1, 1, 0],
                rotate: [0, 360, 720],
                scale: [0.8, 1.1, 0.7],
              }}
              transition={{
                delay: c.delay / 1000,
                duration: 0.85,
                ease: "easeIn",
                times: [0, 0.6, 0.85, 1],
              }}
              style={{
                position: "absolute",
                width: 44,
                height: 44,
                fontSize: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: "drop-shadow(0 4px 8px rgba(218, 165, 32, 0.5))",
                pointerEvents: "none",
                zIndex: 5,
              }}
            >
              🪙
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Chest */}
        <motion.div
          animate={chestOpen ? { y: [0, -4, 0] } : { scale: [1, 1.05, 1] }}
          transition={{
            duration: chestOpen ? 0.4 : 0.6,
            repeat: chestOpen && coins.length > storedCount ? Infinity : 0,
          }}
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 96, lineHeight: 1, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))" }}>
            {chestOpen ? "🗃️" : "🧰"}
          </span>
          <motion.div
            key={storedCount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 12px",
              borderRadius: 9999,
              backgroundColor: "#FFF8E1",
              border: "2px solid #FFD54F",
              fontSize: fontSizes.lg,
              fontWeight: "bold",
              fontFamily: fonts.display,
              color: "#B7791F",
            }}
          >
            🪙 +{storedCount}
          </motion.div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }}
        style={{ display: "flex", gap: spacing.md, marginTop: spacing.sm }}
      >
        <AnimatedButton color={color} onClick={onReplay}>Jugar de nuevo</AnimatedButton>
        <AnimatedButton variant="secondary" onClick={onBack}>Volver</AnimatedButton>
      </motion.div>
    </motion.div>
  );
};
