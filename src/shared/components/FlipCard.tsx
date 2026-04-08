"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  duration?: number;
  onFlipComplete?: () => void;
  style?: React.CSSProperties;
}

/**
 * 3D flip card component.
 * - `front` = back of card (colored, logo)
 * - `back` = front of card (the word — shown when flipped)
 */
export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  isFlipped,
  duration = 0.6,
  onFlipComplete,
  style,
}) => {
  const [hasFlipped, setHasFlipped] = useState(false);

  useEffect(() => {
    if (!isFlipped) {
      setHasFlipped(false);
      return;
    }
    const timer = setTimeout(() => {
      setHasFlipped(true);
      onFlipComplete?.();
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [isFlipped, duration, onFlipComplete]);

  return (
    <div
      style={{
        perspective: 1200,
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front face (card back — colored side) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {front}
        </div>

        {/* Back face (the word — shown when flipped) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};
