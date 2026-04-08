"use client";

import React from "react";
import { motion } from "framer-motion";
import { tapBounce } from "@/shared/styles/animations";
import { colors, radii, spacing, fontWeights, fonts, shadows } from "@/shared/styles/design-tokens";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "game" | "ghost";
  color?: string;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  sm: { padding: `${spacing.sm}px ${spacing.md}px`, fontSize: 14 },
  md: { padding: `${spacing.md}px ${spacing.lg}px`, fontSize: 16 },
  lg: { padding: `${spacing.lg}px ${spacing.xl}px`, fontSize: 20 },
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children, onClick, disabled = false, variant = "primary", color, size = "md", style,
}) => {
  const sizeStyles = SIZE_MAP[size];
  const variantStyles: React.CSSProperties =
    variant === "primary"
      ? { background: `linear-gradient(135deg, ${color ?? colors.brand.primary}, ${colors.brand.secondary})`, color: colors.text.inverse, border: "none", boxShadow: shadows.button }
      : variant === "secondary"
        ? { backgroundColor: colors.bg.card, color: color ?? colors.text.secondary, border: `2px solid ${colors.border.light}` }
        : variant === "game"
          ? { backgroundColor: colors.bg.card, color: colors.text.primary, border: `2px solid ${color ?? colors.border.light}`, boxShadow: shadows.sm }
          : { backgroundColor: "transparent", color: colors.text.muted, border: "none" };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      {...(disabled ? {} : tapBounce)}
      style={{
        ...sizeStyles, ...variantStyles,
        borderRadius: radii.lg, fontWeight: fontWeights.bold, fontFamily: fonts.body,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: spacing.sm, minWidth: 44, minHeight: 44,
        transition: "opacity 0.15s ease", ...style,
      }}
    >
      {children}
    </motion.button>
  );
};
