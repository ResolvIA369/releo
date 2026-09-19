"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { AudioWaves } from "@/shared/components/doman-visuals";
import { sofiaPlayAudio, stopVoice } from "@/shared/services/sofiaVoice";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

// Afirmación motivacional de Sofía: suena UNA vez por sesión, al entrar a
// REleo, antes de cualquier pantalla de juego. No compite con las reglas de
// cada juego (useSofiaIntro/GameIntro) ni con Flash de Palabras, que ya tiene
// su propia afirmación al cierre — este gate vive en (main)/layout.tsx, fuera
// de ambos.
const AFFIRMATIONS = [
  { mp3: "afirmacion-inicio-01", text: "¿Listo? Repetí conmigo: yo puedo, yo creo en mí, yo soy inteligente." },
  { mp3: "afirmacion-inicio-02", text: "¿Listo? Repetí conmigo: me esfuerzo, lo intento, y lo consigo." },
  { mp3: "afirmacion-inicio-03", text: "¿Listo? Repetí conmigo: me quiero tal como soy." },
  { mp3: "afirmacion-inicio-04", text: "¿Listo? Repetí conmigo: vine al mundo a hacer cosas hermosas." },
  { mp3: "afirmacion-inicio-05", text: "¿Listo? Repetí conmigo: si me equivoco, lo intento de nuevo." },
  { mp3: "afirmacion-inicio-06", text: "¿Listo? Repetí conmigo: cada día aprendo algo nuevo." },
  { mp3: "afirmacion-inicio-07", text: "¿Listo? Repetí conmigo: soy valiente y no me rindo." },
  { mp3: "afirmacion-inicio-08", text: "¿Listo? Repetí conmigo: leer me hace grande." },
] as const;

// En memoria, no en localStorage: "no vuelve a aparecer en esa sesión" tiene
// que resetear en la próxima apertura de la app, no quedar apagado para
// siempre. Un módulo compartido entre todos los componentes que monten este
// gate (StrictMode remonta en dev) alcanza para no repetirlo dos veces en la
// misma sesión.
let shownThisSession = false;

// Qué afirmación sonó la última vez SÍ se persiste (liviano, solo un índice)
// para no repetir la misma dos sesiones seguidas.
const LAST_INDEX_KEY = "doman-last-affirmation-inicio";

function pickIndex(): number {
  let last = -1;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LAST_INDEX_KEY);
    last = raw ? parseInt(raw, 10) : -1;
  }
  let next = Math.floor(Math.random() * AFFIRMATIONS.length);
  if (AFFIRMATIONS.length > 1) {
    while (next === last) next = Math.floor(Math.random() * AFFIRMATIONS.length);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_INDEX_KEY, String(next));
  }
  return next;
}

export function SofiaAffirmationGate({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(() => !shownThisSession);
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    shownThisSession = true;
    let alive = true;
    const { mp3, text: affText } = AFFIRMATIONS[pickIndex()];
    setText(affText);
    setSpeaking(true);
    sofiaPlayAudio(mp3, affText, "encouraging").then(() => {
      if (!alive) return;
      setSpeaking(false);
      finish();
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    stopVoice();
    setActive(false);
  }

  return (
    <>
      {!active && children}
      <AnimatePresence>
        {active && (
          <motion.div
            role="button"
            tabIndex={0}
            aria-label="Saltar"
            onClick={finish}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") finish(); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.lg,
              padding: spacing.xl,
              backgroundColor: colors.bg.primary,
              cursor: "pointer",
            }}
          >
            <SofiaAvatar size={200} speaking={speaking} mood="motivating" />
            <AudioWaves active={speaking} color={colors.brand.primary} />

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: fontSizes.xl,
                fontFamily: fonts.display,
                fontWeight: "bold",
                color: colors.text.primary,
                textAlign: "center",
                maxWidth: 560,
                margin: 0,
              }}
            >
              {text}
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={(e) => { e.stopPropagation(); finish(); }}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                backgroundColor: "transparent",
                color: colors.text.placeholder,
                border: `1px solid ${colors.border.light}`,
                borderRadius: radii.pill,
                fontSize: fontSizes.sm,
                fontFamily: fonts.display,
                cursor: "pointer",
                boxShadow: shadows.sm,
              }}
            >
              Saltar →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
