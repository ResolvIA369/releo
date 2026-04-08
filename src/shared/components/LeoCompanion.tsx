"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LeoMood = "idle" | "cheering" | "celebrating" | "encouraging" | "clapping" | "thinking";

const LEO_IMAGES: Record<LeoMood, string> = {
  idle: "/images/Leo/motivando.png",
  cheering: "/images/Leo/motivando.png",
  celebrating: "/images/Leo/felicitando.png",
  encouraging: "/images/Leo/animate.png",
  clapping: "/images/Leo/felicitando.png",
  thinking: "/images/Leo/esfuerzate.png",
};

const LEO_MESSAGES: Record<LeoMood, string[]> = {
  idle: [""],
  cheering: ["¡Vamos!", "¡Tu puedes!", "¡Dale!", "¡Eso!"],
  celebrating: ["¡Siii!", "¡Genial!", "¡Bravo!", "¡Wow!", "¡Excelente!"],
  encouraging: ["¡Animo!", "¡Otra vez!", "¡Tu puedes!", "¡Vamos!"],
  clapping: ["👏👏👏", "¡Increible!"],
  thinking: ["Hmm...", "¡Piensa!", "¡Fijate!"],
};

interface LeoCompanionProps {
  mood?: LeoMood;
  size?: "sm" | "md" | "lg";
  position?: "left" | "right";
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function LeoCompanion({ mood = "idle", size = "md", position = "right" }: LeoCompanionProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mood !== "idle") {
      setMessage(pickRandom(LEO_MESSAGES[mood]));
      const timer = setTimeout(() => setMessage(""), 2500);
      return () => clearTimeout(timer);
    } else {
      setMessage("");
    }
  }, [mood]);

  const sizeMap = { sm: 100, md: 140, lg: 180 };
  const leoSize = sizeMap[size];

  const animations: Record<LeoMood, Record<string, number[]>> = {
    idle: { y: [0, -4, 0] },
    cheering: { y: [0, -15, 0], scale: [1, 1.1, 1] },
    celebrating: { y: [0, -20, 0], rotate: [0, 5, -5, 0], scale: [1, 1.15, 1] },
    encouraging: { x: [0, 5, -5, 0], scale: [1, 1.08, 1] },
    clapping: { scale: [1, 1.12, 1, 1.12, 1] },
    thinking: { rotate: [0, -3, 3, 0] },
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 8,
      [position]: 8,
      zIndex: 40,
      display: "flex",
      flexDirection: "column",
      alignItems: position === "right" ? "flex-end" : "flex-start",
      gap: 4,
      pointerEvents: "none",
    }}>
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            style={{
              padding: "6px 14px",
              borderRadius: 16,
              backgroundColor: "#fff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              fontSize: 15,
              fontWeight: "bold",
              color: "#ed8936",
              fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
              whiteSpace: "nowrap",
              border: "2px solid #fbd38d",
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={animations[mood]}
        transition={{
          duration: mood === "idle" ? 3 : 0.6,
          repeat: mood === "idle" ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <img
          src={LEO_IMAGES[mood]}
          alt="Leo"
          style={{
            height: leoSize,
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
          }}
        />
      </motion.div>
    </div>
  );
}

export function useLeo() {
  const [mood, setMood] = useState<LeoMood>("idle");

  const cheer = () => { setMood("cheering"); setTimeout(() => setMood("idle"), 2500); };
  const celebrate = () => { setMood("celebrating"); setTimeout(() => setMood("idle"), 3000); };
  const encourage = () => { setMood("encouraging"); setTimeout(() => setMood("idle"), 2500); };
  const clap = () => { setMood("clapping"); setTimeout(() => setMood("idle"), 2000); };
  const think = () => { setMood("thinking"); setTimeout(() => setMood("idle"), 2500); };

  return { mood, cheer, celebrate, encourage, clap, think };
}
