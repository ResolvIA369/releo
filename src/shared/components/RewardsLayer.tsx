"use client";

// ─── Rewards Layer ───────────────────────────────────────────────
// A floating overlay that animates coins flying around the screen
// (correct-answer drops, end-of-game cascades into a chest).
// Games trigger animations via the RewardsContext.

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { burstAt, bigCelebration } from "@/shared/utils/confetti";

// ─── Types ───────────────────────────────────────────────────────

interface FlyingCoin {
  id: number;
  startX: number;
  startY: number;
}

interface RewardsContextValue {
  /** Drop a single coin at a screen position. Optionally also fire confetti. */
  rewardCorrect: (x?: number, y?: number, withConfetti?: boolean) => void;
  /** Cascade many coins (game complete). */
  cascadeCoins: (count?: number) => void;
  /** Big confetti burst (game complete). */
  bigBurst: () => void;
}

const RewardsContext = createContext<RewardsContextValue>({
  rewardCorrect: () => {},
  cascadeCoins: () => {},
  bigBurst: () => {},
});

export const useRewards = () => useContext(RewardsContext);

// ─── Provider ────────────────────────────────────────────────────

export function RewardsProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState<FlyingCoin[]>([]);
  const idRef = useRef(0);

  const dropCoin = useCallback((x: number, y: number) => {
    const id = ++idRef.current;
    setCoins((cs) => [...cs, { id, startX: x, startY: y }]);
    // Auto-cleanup after animation
    setTimeout(() => {
      setCoins((cs) => cs.filter((c) => c.id !== id));
    }, 1400);
  }, []);

  const rewardCorrect = useCallback(
    (x?: number, y?: number, withConfetti = true) => {
      const cx = x ?? window.innerWidth / 2;
      const cy = y ?? window.innerHeight / 2;
      dropCoin(cx, cy);
      if (withConfetti) {
        burstAt(cx / window.innerWidth, cy / window.innerHeight);
      }
    },
    [dropCoin]
  );

  const cascadeCoins = useCallback(
    (count = 8) => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const x = cw / 2 + (Math.random() - 0.5) * Math.min(cw * 0.6, 400);
          const y = ch * 0.3 + (Math.random() - 0.5) * 80;
          dropCoin(x, y);
        }, i * 130);
      }
    },
    [dropCoin]
  );

  const bigBurst = useCallback(() => {
    bigCelebration();
  }, []);

  return (
    <RewardsContext.Provider value={{ rewardCorrect, cascadeCoins, bigBurst }}>
      {children}
      {/* Flying coins layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9000,
          overflow: "hidden",
        }}
      >
        <AnimatePresence>
          {coins.map((c) => (
            <FlyingCoinView key={c.id} coin={c} />
          ))}
        </AnimatePresence>
      </div>
    </RewardsContext.Provider>
  );
}

// ─── Single flying coin ──────────────────────────────────────────

function FlyingCoinView({ coin }: { coin: FlyingCoin }) {
  // Coin pops up, then falls towards bottom-right (where the
  // global coin counter / chest lives in the header).
  return (
    <motion.div
      initial={{
        left: coin.startX - 24,
        top: coin.startY - 24,
        scale: 0,
        rotate: 0,
        opacity: 0,
      }}
      animate={{
        left: [
          coin.startX - 24,
          coin.startX - 24 + (Math.random() - 0.5) * 40,
          window.innerWidth - 80,
        ],
        top: [
          coin.startY - 24,
          coin.startY - 60 - Math.random() * 20,
          80,
        ],
        scale: [0, 1.2, 1, 0.6],
        rotate: [0, 180, 540, 720],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.2,
        times: [0, 0.15, 0.7, 1],
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 40,
        filter: "drop-shadow(0 4px 8px rgba(218, 165, 32, 0.5))",
        willChange: "transform, opacity",
      }}
    >
      🪙
    </motion.div>
  );
}
