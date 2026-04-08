"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DomanSession } from "../config/curriculum";
import {
  CleanWordDisplay,
  AudioWaves,
  SofiaSpeechBubble,
  ContextSentenceDisplay,
  FarewellDisplay,
  ProgressLine,
} from "@/shared/components/doman-visuals";
import { speak, stopSpeaking } from "@/shared/services/voiceService";

// ─── Timings ─────────────────────────────────────────────────────────

const T = {
  // Block A: Presentation
  wordStay: 1500,
  transitionGap: 500,
  sofiaSpeakDelay: 100,

  // Sofia between blocks
  sofiaBubbleDuration: 2500,

  // Block B: Repetition
  silenceDuration: 2000,
  sofiaConfirmDuration: 1000,
  pauseBetweenWords: 500,

  // Block C: Context sentence
  wordHighlightDuration: 600,
  learnedWordPause: 300,
  fullReadPause: 1000,
  fullReadDuration: 4000,

  // Block D: Farewell
  farewellDuration: 6000,

  // Transitions
  countdownStep: 1000,
  betweenSessionsFade: 2000,
};

type DemoPhase =
  | "countdown"
  | "block_a"      // Presentation: show each word + Sofia says it
  | "sofia_middle"  // Sofia speaks between blocks
  | "block_b"      // Repetition: silence then Sofia confirms
  | "sofia_pre_c"  // Sofia introduces context
  | "block_c"      // Context sentence with highlights
  | "block_d"      // Farewell + summary
  | "transition"   // Fade between sessions
  | "complete";    // All done

interface DomanDemoPlayerProps {
  sessions: DomanSession[];
  onComplete?: () => void;
  autoFullscreen?: boolean;
}

export const DomanDemoPlayer: React.FC<DomanDemoPlayerProps> = ({
  sessions,
  onComplete,
  autoFullscreen = true,
}) => {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("countdown");
  const [wordIdx, setWordIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [sofiaText, setSofiaText] = useState("");
  const [sofiaVisible, setSofiaVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const session = sessions[sessionIdx];
  const isMultiSession = sessions.length > 1;

  // Total steps for progress calculation
  const totalSteps = sessions.length * 4; // 4 blocks per session
  const currentStep = sessionIdx * 4 + (
    phase === "block_a" ? 0 :
    phase === "block_b" || phase === "sofia_middle" ? 1 :
    phase === "block_c" || phase === "sofia_pre_c" ? 2 :
    phase === "block_d" ? 3 : 3
  );
  const progress = totalSteps > 0 ? (currentStep + 0.5) / totalSteps : 0;

  const wait = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => {
      timerRef.current = setTimeout(resolve, ms);
    });
  }, []);

  const sayWord = useCallback(async (text: string) => {
    setIsSpeaking(true);
    await speak({ text, emotion: "neutral" });
    setIsSpeaking(false);
  }, []);

  const saySofia = useCallback(async (text: string, emotion: "excited" | "encouraging" | "celebratory" | "neutral" = "encouraging") => {
    setIsSpeaking(true);
    await speak({ text, emotion });
    setIsSpeaking(false);
  }, []);

  // ─── Fullscreen ──────────────────────────────────────────────────

  useEffect(() => {
    if (autoFullscreen && phase === "countdown") {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, [autoFullscreen, phase]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      stopSpeaking();
    };
  }, []);

  // ─── State machine ──────────────────────────────────────────────

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function run() {
      switch (phase) {
        case "countdown": {
          for (let i = 3; i >= 1; i--) {
            if (cancelled) return;
            setCountdown(i);
            await wait(T.countdownStep);
          }
          if (!cancelled) setPhase("block_a");
          break;
        }

        case "block_a": {
          // Show each word with Sofia saying it
          for (let i = 0; i < session.words.length; i++) {
            if (cancelled) return;
            setWordIdx(i);
            await wait(T.sofiaSpeakDelay);
            if (cancelled) return;
            await sayWord(session.words[i].text);
            await wait(T.wordStay);
            if (cancelled) return;
            if (i < session.words.length - 1) {
              await wait(T.transitionGap);
            }
          }
          if (!cancelled) setPhase("sofia_middle");
          break;
        }

        case "sofia_middle": {
          setSofiaText(session.sofiaMiddle);
          setSofiaVisible(true);
          await saySofia(session.sofiaMiddle);
          await wait(T.sofiaBubbleDuration);
          if (cancelled) return;
          setSofiaVisible(false);
          await wait(500);
          if (!cancelled) {
            setWordIdx(0);
            setPhase("block_b");
          }
          break;
        }

        case "block_b": {
          // Repetition: show word, silence, then Sofia confirms
          for (let i = 0; i < session.words.length; i++) {
            if (cancelled) return;
            setWordIdx(i);
            // Silence - let child try
            await wait(T.silenceDuration);
            if (cancelled) return;
            // Sofia confirms
            await sayWord(session.words[i].text);
            await wait(T.sofiaConfirmDuration);
            if (cancelled) return;
            if (i < session.words.length - 1) {
              await wait(T.pauseBetweenWords);
            }
          }
          if (!cancelled) setPhase("sofia_pre_c");
          break;
        }

        case "sofia_pre_c": {
          setSofiaText("Ahora vamos a leer una frase con todas las palabras");
          setSofiaVisible(true);
          await saySofia("Ahora vamos a leer una frase con todas las palabras");
          await wait(T.sofiaBubbleDuration);
          if (cancelled) return;
          setSofiaVisible(false);
          await wait(500);
          if (!cancelled) setPhase("block_c");
          break;
        }

        case "block_c": {
          // Highlight each learned word in the sentence
          const learnedWords = session.words.map((w) => w.text);
          for (const word of learnedWords) {
            if (cancelled) return;
            setActiveHighlight(word);
            await sayWord(word);
            await wait(T.wordHighlightDuration + T.learnedWordPause);
          }
          if (cancelled) return;
          setActiveHighlight(null);
          // Full sentence read
          await wait(T.fullReadPause);
          if (cancelled) return;
          await saySofia(session.contextSentence, "neutral");
          await wait(T.fullReadDuration);
          if (!cancelled) setPhase("block_d");
          break;
        }

        case "block_d": {
          await saySofia(session.sofiaFarewell, "celebratory");
          await wait(T.farewellDuration);
          if (cancelled) return;

          // Next session or complete
          if (sessionIdx < sessions.length - 1) {
            setPhase("transition");
          } else {
            setPhase("complete");
            document.exitFullscreen?.().catch(() => {});
            onComplete?.();
          }
          break;
        }

        case "transition": {
          await wait(T.betweenSessionsFade);
          if (cancelled) return;
          setSessionIdx((prev) => prev + 1);
          setWordIdx(0);
          setPhase("block_a");
          break;
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [phase, session, sessionIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Render ────────────────────────────────────────────────────

  if (!session) return null;

  const worldColor = session.worldColor;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* Countdown */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.span
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: 120,
                fontWeight: "bold",
                color: worldColor,
                fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
              }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block A & B: Word display */}
      <AnimatePresence>
        {(phase === "block_a" || phase === "block_b") && session.words[wordIdx] && (
          <CleanWordDisplay
            word={session.words[wordIdx].text}
            fontColor={session.words[wordIdx].fontColor}
            fontSize={session.phase === 1 ? 96 : session.phase === 2 ? 80 : session.phase === 3 ? 64 : session.phase === 4 ? 48 : 36}
            wordKey={`${phase}-${wordIdx}-${session.words[wordIdx].id}`}
          />
        )}
      </AnimatePresence>

      {/* Sofia speech bubble (between blocks) */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
        }}
      >
        <SofiaSpeechBubble
          text={sofiaText}
          visible={sofiaVisible}
          worldColor={worldColor}
        />
      </div>

      {/* Block C: Context sentence */}
      <AnimatePresence>
        {phase === "block_c" && (
          <ContextSentenceDisplay
            sentence={session.contextSentence}
            learnedWords={session.words.map((w) => w.text)}
            activeWord={activeHighlight}
            worldColor={worldColor}
          />
        )}
      </AnimatePresence>

      {/* Block D: Farewell */}
      <AnimatePresence>
        {phase === "block_d" && (
          <FarewellDisplay
            words={session.words.map((w) => w.text)}
            sofiaMessage={session.sofiaFarewell}
            affirmation={session.affirmation}
            stars={3}
          />
        )}
      </AnimatePresence>

      {/* Transition black fade between sessions */}
      <AnimatePresence>
        {phase === "transition" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#000",
              zIndex: 30,
            }}
          />
        )}
      </AnimatePresence>

      {/* Complete screen */}
      <AnimatePresence>
        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 64 }}>✅</span>
            <p style={{
              fontSize: 28,
              fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
              color: "#2d3748",
            }}>
              Grabación completa
            </p>
            {isMultiSession && (
              <p style={{ fontSize: 16, color: "#718096" }}>
                {sessions.length} sesiones completadas
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress line */}
      {phase !== "countdown" && phase !== "complete" && (
        <ProgressLine progress={progress} color={worldColor} />
      )}
    </div>
  );
};
