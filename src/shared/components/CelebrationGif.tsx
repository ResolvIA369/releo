"use client";

import { motion } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";

interface CelebrationGifProps {
  /** Size in px */
  size?: number;
  /** Ignored — kept for backwards compatibility */
  index?: number;
}

export function CelebrationGif({ size = 180 }: CelebrationGifProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", damping: 8 }}
    >
      <SofiaAvatar size={size} mood="clapping" speaking={false} fullBody />
    </motion.div>
  );
}
