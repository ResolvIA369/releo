"use client";

import React from "react";
import { motion } from "framer-motion";

export type SofiaMood = "default" | "cards" | "clapping" | "motivating";

interface SofiaAvatarProps {
  size?: number;
  speaking?: boolean;
  /** Show full body image instead of pin badge. Auto-enabled for size >= 120 */
  fullBody?: boolean;
  /** Sofia's pose/mood */
  mood?: SofiaMood;
}

const SOFIA_IMAGES: Record<SofiaMood, string> = {
  default: "/images/sofia/sofia-default.png",
  cards: "/images/sofia/sofia-cards.png",
  clapping: "/images/sofia/sofia-clapping.png",
  motivating: "/images/sofia/sofia-motivating.png",
};

export const SofiaAvatar: React.FC<SofiaAvatarProps> = ({
  size = 64,
  speaking = false,
  fullBody,
  mood = "default",
}) => {
  const showFull = fullBody ?? size >= 120;

  if (showFull) {
    return (
      <motion.div
        animate={speaking ? { scale: [1, 1.03, 1] } : {}}
        transition={speaking ? { repeat: Infinity, duration: 0.8 } : {}}
        style={{ flexShrink: 0, display: "flex", justifyContent: "center" }}
      >
        <img
          src={SOFIA_IMAGES[mood]}
          alt="Seño Sofía"
          style={{
            height: size,
            width: "auto",
            objectFit: "contain",
            filter: speaking ? "drop-shadow(0 0 12px rgba(102,126,234,0.5))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
            transition: "filter 0.3s",
          }}
        />
      </motion.div>
    );
  }

  // Small size: show Sofia face crop instead of logo
  return (
    <motion.div
      animate={speaking ? { scale: [1, 1.05, 1] } : {}}
      transition={speaking ? { repeat: Infinity, duration: 0.8 } : {}}
      style={{ flexShrink: 0 }}
    >
      <img
        src={SOFIA_IMAGES[mood]}
        alt="Seño Sofía"
        style={{
          height: size,
          width: size,
          objectFit: "cover",
          objectPosition: "top center",
          borderRadius: "50%",
          filter: speaking ? "drop-shadow(0 0 8px rgba(102,126,234,0.4))" : "none",
        }}
      />
    </motion.div>
  );
};
