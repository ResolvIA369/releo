"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Reveal — fade + slide-up cuando el bloque entra en viewport.
 * Se usa en toda la landing para dar el efecto "scroll-stop" suave.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
