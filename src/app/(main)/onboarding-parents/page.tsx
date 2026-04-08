"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

const SLIDES = [
  {
    title: "¿Qué es el Método Doman?",
    emoji: "📖",
    text: "El método Glenn Doman enseña a leer a niños desde los 0-6 años mediante la exposición repetida a palabras escritas en tarjetas grandes. El cerebro del niño reconoce patrones visuales de palabras completas, no letras individuales.",
    color: "#667eea",
  },
  {
    title: "¿Cómo funciona?",
    emoji: "🧠",
    text: "Se muestran 5 palabras por sesión, 3 veces al día, durante 5 días. Luego se retira una palabra y se agrega una nueva. Las sesiones son muy cortas (menos de 1 minuto) para mantener la atención del niño.",
    color: "#48bb78",
  },
  {
    title: "5 fases de aprendizaje",
    emoji: "📈",
    text: "Fase 1: Palabras sencillas (mamá, papá). Fase 2: Parejas de palabras (perro grande). Fase 3: Oraciones simples. Fase 4: Frases completas. Fase 5: Lectura de cuentos. Cada fase se construye sobre la anterior.",
    color: "#ed8936",
  },
  {
    title: "¿Qué hace esta app?",
    emoji: "📱",
    text: "Doman App digitaliza el método con la Seño Sofía como tutora virtual. Incluye 10 juegos interactivos, 220 palabras, voz real, historias y un sistema de progresión que motiva al niño a seguir aprendiendo.",
    color: "#e53e3e",
  },
  {
    title: "Consejos para padres",
    emoji: "💡",
    text: "1. Sesiones cortas y frecuentes (3 veces al día, 1-2 minutos cada una). 2. Siempre en un momento de alegría, nunca forzar. 3. Celebrar cada logro. 4. Consistencia es más importante que duración. 5. El niño aprende jugando.",
    color: "#f093fb",
  },
];

export default function ParentOnboarding() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: colors.bg.primary,
      fontFamily: fonts.body, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: spacing.xl,
    }}>
      <motion.div
        key={slide}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        style={{
          maxWidth: 480, width: "100%", display: "flex",
          flexDirection: "column", alignItems: "center", gap: spacing.lg, textAlign: "center",
        }}
      >
        <SofiaAvatar size={140} speaking={false} />

        <span style={{ fontSize: 56 }}>{current.emoji}</span>

        <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: current.color, margin: 0 }}>
          {current.title}
        </h1>

        <p style={{
          fontSize: fontSizes.md, color: colors.text.muted, lineHeight: 1.7,
          margin: 0, maxWidth: 400,
        }}>
          {current.text}
        </p>

        {/* Dots */}
        <div style={{ display: "flex", gap: spacing.sm }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? 24 : 8, height: 8, borderRadius: radii.pill,
              backgroundColor: i === slide ? current.color : colors.bg.secondary,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md }}>
          {slide > 0 && (
            <AnimatedButton variant="secondary" onClick={() => setSlide(slide - 1)}>
              Anterior
            </AnimatedButton>
          )}
          {isLast ? (
            <AnimatedButton color={current.color} onClick={() => router.push("/dashboard")}>
              ¡Empezar!
            </AnimatedButton>
          ) : (
            <AnimatedButton color={current.color} onClick={() => setSlide(slide + 1)}>
              Siguiente
            </AnimatedButton>
          )}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: fontSizes.xs, color: colors.text.placeholder, marginTop: spacing.sm }}
        >
          Saltar introducción
        </button>
      </motion.div>
    </div>
  );
}
