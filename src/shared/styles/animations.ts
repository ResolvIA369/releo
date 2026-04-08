import { Variants, type HTMLMotionProps } from "framer-motion";
import { timing } from "./design-tokens";

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: timing.normal } },
  exit: { opacity: 0, transition: { duration: timing.fast } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: timing.normal } },
  exit: { opacity: 0, y: -12, transition: { duration: timing.fast } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -24 },
  animate: { opacity: 1, y: 0, transition: { duration: timing.normal } },
  exit: { opacity: 0, y: 24, transition: { duration: timing.fast } },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: timing.spring },
  exit: { opacity: 0, x: 40, transition: { duration: timing.fast } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: timing.spring },
  exit: { opacity: 0, x: -40, transition: { duration: timing.fast } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1, transition: timing.springBouncy },
  exit: { opacity: 0, scale: 0.8, transition: { duration: timing.fast } },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", damping: 8, mass: 0.5 } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

export const wordFlash: Variants = {
  initial: { opacity: 0, scale: 0.5, rotate: -3 },
  animate: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", damping: 10, mass: 0.5 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

export const correctPulse: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.15, 1], transition: { duration: 0.4, ease: "easeInOut" } },
};

export const wrongShake: Variants = {
  initial: { x: 0 },
  animate: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.5 } },
};

export const starPop: Variants = {
  initial: { scale: 0, rotate: -30 },
  animate: { scale: 1, rotate: 0, transition: { type: "spring", damping: 8 } },
};

export const tapBounce: HTMLMotionProps<"button"> = {
  whileTap: { scale: 0.92 },
  whileHover: { scale: 1.04 },
  transition: { type: "spring", damping: 15, mass: 0.5 },
};

export const tapShrink: HTMLMotionProps<"button"> = {
  whileTap: { scale: 0.95 },
  transition: { duration: 0.1 },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: timing.spring },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
