"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DomanWord } from "@/shared/types/doman";
import type { GameProps } from "../types";
import { useGameSession } from "../hooks/useGameSession";
import { DEFAULT_SESSION_CONFIG } from "@/shared/constants";
import { EMOJI_MAP } from "@/shared/constants/emoji-map";
import { getSession } from "@/features/session/config/curriculum";
import {
  sofiaNameWord, stopVoice, sofiaPlayAudio,
} from "@/shared/services/sofiaVoice";
import { FlipCard } from "@/shared/components/FlipCard";
import { QuickCelebration } from "@/shared/components/QuickCelebration";
import { AudioWaves, ProgressLine } from "@/shared/components/doman-visuals";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { fitWordFontSize } from "@/shared/utils/fitText";
import { useRewards } from "@/shared/components/RewardsLayer";
import { TimeBar } from "@/shared/components/TimeBar";
import { AnimatedButton } from "@/shared/components/AnimatedButton";
import { useAppStore } from "@/shared/store/useAppStore";
import { SofiaAvatar } from "@/shared/components/SofiaAvatar";
import { CelebrationGif } from "@/shared/components/CelebrationGif";
import { DEFAULT_SESSION_SCRIPT, fillScript } from "@/features/session/config/session-scripts";

// ═══════════════════════════════════════════════════════════════════════
// WordFlash — Definitive Doman Session
//
// ROUND 1: Presentation (3 passes) — Sofia names instantly
// ROUND 2: Repetition (3 passes) — 3s silence + mic + Sofia confirms
// ROUND 3: Story — Words appear BIG when Sofia reads them
// + Review of previous session's words (session 2+)
// + Farewell with affirmation
// ═══════════════════════════════════════════════════════════════════════

const SC = DEFAULT_SESSION_SCRIPT;

function pn(text: string, name: string, word?: string): string {
  return fillScript(text, {
    name,
    word,
    words_list: undefined,
  });
}

// ─── Web Speech API types ────────────────────────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
}

// ─── Mic hook ────────────────────────────────────────────────────────

function useSpeechRecognition() {
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  const start = useCallback(() => {
    setTranscript("");
    const SR = getSpeechRecognition();
    if (!SR) { setListening(true); return; }
    const rec = new SR();
    rec.lang = "es-ES"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const results = e.results;
      setTranscript(results[results.length - 1][0].transcript.trim().toLowerCase());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(true); }
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* recognition may already be stopped */ }
    setListening(false);
  }, []);
  return { transcript, listening, start, stop };
}

// ─── States ──────────────────────────────────────────────────────────

type Phase =
  | "ready" | "paused"
  | "greeting"
  | "presentation" | "pres_sofia"
  | "repeat_intro" | "repeat" | "repeat_video" | "repeat_sofia" | "celebration"
  | "story_intro" | "story"
  | "review_intro" | "review"
  | "farewell" | "affirmation" | "complete";

const REPEAT_TIMER_SECONDS = 7;

export function WordFlash({ words, phase, onComplete, onBack }: GameProps) {
  const sessionWords = useMemo(() => words.slice(0, DEFAULT_SESSION_CONFIG.wordsPerSession), [words]);
  const session = useGameSession({ phase, words: sessionWords, affirmation: "" });
  const profile = useAppStore((s) => s.profile);
  const mic = useSpeechRecognition();
  const childName = profile?.childName ?? "amiguito";
  const { rewardCorrect } = useRewards();

  // Try to get the full session data (for story + previousWords)
  const sessionData = useMemo(() => {
    // Find session by matching first word
    if (sessionWords.length === 0) return null;
    const firstWordId = sessionWords[0].id;
    for (let i = 1; i <= 44; i++) {
      const s = getSession(i);
      if (s && s.words.length > 0 && s.words[0].id === firstWordId) return s;
    }
    return null;
  }, [sessionWords]);

  const story5 = sessionData?.story5 ?? "";
  const previousWords = sessionData?.previousWords ?? [];
  const worldColor = sessionData?.worldColor ?? colors.brand.primary;

  const [ph, setPh] = useState<Phase>("ready");
  const [prevPh, setPrevPh] = useState<Phase>("ready");
  const [tick, setTick] = useState(0); // forces useEffect re-run when phase stays same
  const [pass, setPass] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [timer, setTimer] = useState(3);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dotsCompleted, setDotsCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  // Round 2 (repeat) per-pass tracking
  const [correctInPass, setCorrectInPass] = useState(0);
  const [repeatTimerKey, setRepeatTimerKey] = useState(0);
  const [showRepeatTimer, setShowRepeatTimer] = useState(false);
  const [videoMode, setVideoMode] = useState<"celebration" | "motivation">("motivation");
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Story state
  const [currentSentence, setCurrentSentence] = useState("");
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  // Farewell
  const [displayWord, setDisplayWord] = useState("");
  const [affirmationText, setAffirmationText] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelledRef = useRef(false);
  // Blocks re-entry into handleCardTap / handleRepeatTimeout so
  // Sofia never ends up speaking twice in parallel.
  const repeatResolvingRef = useRef(false);
  // True when the next "repeat" word should be spoken automatically
  // by Sofia (because the previous one timed out).
  const autoNameNextRef = useRef(false);

  const totalSteps = 3 + 3 + 1; // 3 pres passes + 3 repeat passes + 1 story
  const currentStep = ph.startsWith("pres") ? pass : ph.startsWith("repeat") ? 3 + pass : ph === "story" ? 7 : 0;
  const progress = currentStep / totalSteps;

  const baseFontSize = phase === 1 ? 96 : phase === 2 ? 80 : phase === 3 ? 64 : 48;
  const fontColor = sessionWords[wordIdx]?.fontColor === "red" ? "#e53e3e" : "#2d3748";
  const currentWord = sessionWords[wordIdx];

  useEffect(() => { return () => { clearTimeout(timerRef.current); stopVoice(); mic.stop(); }; }, []); // eslint-disable-line

  const delay = useCallback((ms: number) => new Promise<void>((r) => { timerRef.current = setTimeout(r, ms); }), []);

  // ─── Pause ──────────────────────────────────────────────────────

  const handlePause = useCallback(() => {
    if (ph === "paused") return;
    clearTimeout(timerRef.current); stopVoice(); mic.stop();
    setPrevPh(ph); setPh("paused");
  }, [ph, mic]);

  const handleResume = useCallback(() => setPh(prevPh), [prevPh]);

  const handleStart = useCallback(() => {
    session.start();
    cancelledRef.current = false;
    setPass(0); setWordIdx(0); setScore(0); setTotalAttempts(0); setDotsCompleted(0);
    setPh("greeting");
  }, [session]);

  // ─── Round 2: child taps card to confirm they read it ──────────

  const advanceRepeatWord = useCallback(async () => {
    setDotsCompleted(wordIdx + 1);
    await delay(400);

    if (wordIdx < sessionWords.length - 1) {
      setShowRepeatTimer(false);
      setIsFlipped(false);
      await delay(400);
      setWordIdx((i) => i + 1);
      setTick((t) => t + 1);
    } else {
      setShowRepeatTimer(false);
      setIsFlipped(false);
      await delay(400);
      setPh("repeat_video");
    }
    // Allow a new tap / timeout only after the advance fully completes
    repeatResolvingRef.current = false;
  }, [wordIdx, sessionWords.length, delay]);

  const handleCardTap = useCallback(async () => {
    if (ph !== "repeat" || !isFlipped) return;
    // Re-entry guard: ignore taps once we're already resolving this word
    if (repeatResolvingRef.current) return;
    repeatResolvingRef.current = true;

    // Stop the countdown + any audio Sofia might currently be on
    clearTimeout(repeatTimerRef.current);
    setShowRepeatTimer(false);
    stopVoice();

    // Mark as recognized
    setTotalAttempts((a) => a + 1);
    setScore((s) => s + 1);
    setCorrectInPass((c) => c + 1);
    session.markRecognized(currentWord.id);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 600);

    // Confetti + flying coin from screen center
    if (typeof window !== "undefined") {
      rewardCorrect(window.innerWidth / 2, window.innerHeight / 2);
    }

    // Sofia confirms the word
    setIsSpeaking(true);
    await sofiaNameWord(currentWord.text);
    setIsSpeaking(false);

    await advanceRepeatWord();
  }, [ph, isFlipped, currentWord, session, rewardCorrect, advanceRepeatWord]);

  const handleRepeatTimeout = useCallback(async () => {
    if (ph !== "repeat" || !isFlipped) return;
    if (repeatResolvingRef.current) return;
    // Block all interaction (no coin if the child taps now)
    repeatResolvingRef.current = true;

    setShowRepeatTimer(false);
    stopVoice();
    setTotalAttempts((a) => a + 1);

    // Wait 3 seconds in silence (Leo stays at the bottom of the bar)
    // so the child realizes time ran out before moving on.
    await delay(3000);

    // Mark the next "repeat" word so Sofia auto-names it for the
    // child as soon as it appears.
    autoNameNextRef.current = true;

    await advanceRepeatWord();
  }, [ph, isFlipped, advanceRepeatWord, delay]);

  // ─── Keyboard support (desktop) ────────────────────────────────
  // Space / Enter: tap card during repeat phase
  // Escape: pause

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter") {
        if (ph === "repeat" && isFlipped) {
          e.preventDefault();
          handleCardTap();
        }
      } else if (e.key === "Escape") {
        if (ph !== "ready" && ph !== "paused" && ph !== "complete") {
          e.preventDefault();
          handlePause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ph, isFlipped, handleCardTap]); // eslint-disable-line

  // ─── Main state machine ────────────────────────────────────────

  useEffect(() => {
    if (ph === "ready" || ph === "paused" || ph === "complete") return;
    cancelledRef.current = false;

    async function run() {
      const c = () => cancelledRef.current;

      switch (ph) {
        // ═══ GREETING ═════════════════════════════════════════════
        case "greeting": {
          setIsSpeaking(true);
          await sofiaPlayAudio("intro", fillScript(SC.introduction, { name: "" }), "excited");
          setIsSpeaking(false);
          if (c()) return;
          await delay(800);
          if (c()) return;
          setPass(0); setWordIdx(0); setDotsCompleted(0);
          setPh("presentation");
          break;
        }

        // ═══ ROUND 1: PRESENTATION (3 passes) ═══════════════════
        case "presentation": {
          setIsFlipped(true);
          await delay(600);
          if (c()) return;
          setIsSpeaking(true);
          await sofiaNameWord(currentWord.text);
          setIsSpeaking(false);
          if (c()) return;
          await delay(900);
          if (c()) return;
          setDotsCompleted(wordIdx + 1);

          if (wordIdx < sessionWords.length - 1) {
            setIsFlipped(false);
            await delay(400);
            if (c()) return;
            setWordIdx((i) => i + 1);
            setTick((t) => t + 1); // re-trigger same phase
          } else {
            setIsFlipped(false);
            await delay(400);
            if (c()) return;
            setPh("pres_sofia");
          }
          break;
        }

        case "pres_sofia": {
          const phrase = fillScript(SC.round1.betweenTandas[pass], { name: "" });
          const mp3Names = ["round1-between1", "round1-between2", "round1-between3"];
          setIsSpeaking(true);
          await sofiaPlayAudio(mp3Names[pass], phrase, "excited");
          setIsSpeaking(false);
          if (c()) return;
          await delay(800);
          if (c()) return;

          const nextPass = pass + 1;
          if (nextPass < 3) {
            setPass(nextPass); setWordIdx(0); setDotsCompleted(0);
            setPh("presentation");
          } else {
            setPass(0);
            setPh("repeat_intro");
          }
          break;
        }

        // ═══ ROUND 2: REPETITION (3 passes with mic) ════════════
        case "repeat_intro": {
          setIsSpeaking(true);
          await sofiaPlayAudio("round2-intro", fillScript(SC.round2.intro, { name: "" }), "gentle");
          setIsSpeaking(false);
          if (c()) return;
          await delay(1000);
          if (c()) return;
          setWordIdx(0); setDotsCompleted(0);
          setPh("repeat");
          break;
        }

        case "repeat": {
          // Show the word — child taps the card to say they read it
          setIsFlipped(true);
          repeatResolvingRef.current = false;
          await delay(500);
          if (c()) return;

          // If the previous word timed out, Sofia helps the child by
          // naming this new word as it appears.
          if (autoNameNextRef.current) {
            autoNameNextRef.current = false;
            setIsSpeaking(true);
            await sofiaNameWord(currentWord.text);
            setIsSpeaking(false);
            if (c()) return;
            await delay(300);
            if (c()) return;
          }

          // Start the countdown. If the child does not tap in time,
          // advance to the next word automatically.
          setRepeatTimerKey((k) => k + 1);
          setShowRepeatTimer(true);
          clearTimeout(repeatTimerRef.current);
          repeatTimerRef.current = setTimeout(() => {
            if (cancelledRef.current) return;
            handleRepeatTimeout();
          }, REPEAT_TIMER_SECONDS * 1000);
          break;
        }

        case "repeat_video": {
          // Decide which video to show based on this pass's score.
          const mode = correctInPass > 2 ? "celebration" : "motivation";
          setVideoMode(mode);
          // Reset for next pass
          setCorrectInPass(0);
          // The video element renders inside the JSX and calls
          // setPh("repeat_sofia") when it ends.
          break;
        }

        case "repeat_sofia": {
          const phrases = [
            "¡Lo estás haciendo increíble! ¡Tu voz suena hermosa!",
            "¡Casi terminamos! ¡Una más y listo!",
            "¡Lo lograste! ¡Aprendiste 5 palabras nuevas!",
          ];
          const mp3s = ["flash-increible", "flash-casi", "flash-lograste"];
          setIsSpeaking(true);
          await sofiaPlayAudio(mp3s[pass], phrases[pass], "excited");
          setIsSpeaking(false);
          if (c()) return;

          const nextPass = pass + 1;
          if (nextPass < 3) {
            await delay(800);
            if (c()) return;
            setPass(nextPass); setWordIdx(0); setDotsCompleted(0);
            setPh("repeat");
          } else {
            setPh("celebration");
          }
          break;
        }

        case "celebration": {
          await delay(3000); // confetti + stars
          if (c()) return;
          setPh("story_intro");
          break;
        }

        // ═══ ROUND 3: STORY ═════════════════════════════════════
        case "story_intro": {
          setIsSpeaking(true);
          await sofiaPlayAudio("round3-intro", fillScript(SC.round3.intro, { name: "" }), "gentle");
          setIsSpeaking(false);
          if (c()) return;
          await delay(800);
          if (c()) return;
          setPh("story");
          break;
        }

        case "story": {
          if (!story5) { setPh("farewell"); break; }

          // Show the story text while Sofia reads the full story via MP3
          setCurrentSentence(story5);
          setIsSpeaking(true);

          // Try pre-recorded story audio, fallback to TTS sentence by sentence
          const storySessionId = sessionData?.words[0]?.id ?
            (() => { for (let i = 1; i <= 44; i++) { const s = getSession(i); if (s && s.words[0]?.id === sessionData.words[0].id) return i; } return 0; })() : 0;

          // Always use pre-recorded story MP3 (all 44 exist)
          await sofiaPlayAudio(`historia-${storySessionId || 1}`, story5, "gentle");

          setIsSpeaking(false);
          if (c()) return;
          await delay(800);
          if (c()) return;
          setCurrentSentence("");
          setIsSpeaking(true);
          await sofiaPlayAudio("frase-historia-linda", "¡Qué linda historia! ¿Viste todas las palabras que aprendiste?", "excited");
          setIsSpeaking(false);
          if (c()) return;
          await delay(1000);
          if (c()) return;

          // Review previous words if any
          if (previousWords.length > 0) {
            setPh("review_intro");
          } else {
            setPh("farewell");
          }
          break;
        }

        // ═══ REVIEW OF PREVIOUS SESSION ══════════════════════════
        case "review_intro": {
          setIsSpeaking(true);
          await sofiaPlayAudio("review-intro", fillScript(SC.review.intro, { name: "" }), "gentle");
          setIsSpeaking(false);
          if (c()) return;
          await delay(800);
          if (c()) return;
          setWordIdx(0);
          setPh("review");
          break;
        }

        case "review": {
          for (let i = 0; i < previousWords.length; i++) {
            if (c()) return;
            setDisplayWord(previousWords[i]);
            setIsFlipped(true);
            await delay(600);
            if (c()) return;
            setIsSpeaking(true);
            await sofiaNameWord(previousWords[i]);
            setIsSpeaking(false);
            if (c()) return;
            await delay(800);
            if (c()) return;
            setIsFlipped(false);
            await delay(400);
          }
          if (c()) return;
          setDisplayWord("");
          setIsSpeaking(true);
          await sofiaPlayAudio("frase-recordaste", "¡Las recordaste todas! ¡Qué memoria tan buena!", "excited");
          setIsSpeaking(false);
          if (c()) return;
          await delay(1000);
          if (c()) return;
          setPh("farewell");
          break;
        }

        // ═══ FAREWELL ═══════════════════════════════════════════
        case "farewell": {
          setIsSpeaking(true);
          const wordsList = sessionWords.map((w) => w.text).join(", ");
          await sofiaPlayAudio("farewell", fillScript(SC.farewell, { name: childName, words_list: wordsList }), "excited");
          setIsSpeaking(false);
          if (c()) return;
          await delay(500);

          for (const w of sessionWords) {
            if (c()) return;
            setDisplayWord(w.text);
            setIsSpeaking(true);
            await sofiaNameWord(w.text);
            setIsSpeaking(false);
            await delay(600);
          }
          if (c()) return;
          setDisplayWord("");
          setPh("affirmation");
          break;
        }

        case "affirmation": {
          setIsSpeaking(true);
          await sofiaPlayAudio("repeat-conmigo", "Repetí conmigo:", "gentle");
          setIsSpeaking(false);
          if (c()) return;
          await delay(400);

          const aff = "Yo soy inteligente y puedo aprender cualquier cosa";
          setAffirmationText(aff);
          setIsSpeaking(true);
          await sofiaPlayAudio("afirmacion-principal", aff, "gentle");
          setIsSpeaking(false);
          if (c()) return;
          await delay(3000);
          if (c()) return;

          setIsSpeaking(true);
          await sofiaPlayAudio("chau-chau", "¡Nos vemos en la próxima clase! ¡Chau chau!", "excited");
          setIsSpeaking(false);
          if (c()) return;
          await delay(1500);
          await session.endSession();
          // Notify parent that session is complete (triggers progression update)
          onComplete?.({
            gameId: "word-flash", score, totalAttempts, correctAttempts: score,
            startedAt: Date.now(), wordsCompleted: session.recognized,
          });
          setPh("complete");
          break;
        }
      }
    }

    run();
    return () => { cancelledRef.current = true; clearTimeout(timerRef.current); };
  }, [ph, tick]); // eslint-disable-line

  // ─── Render helpers ─────────────────────────────────────────────

  const showTimer = false;
  const showMic = false;
  const isStory = ph === "story";
  const isCardVisible = ph === "presentation" || ph === "repeat" || ph === "review" || ph === "farewell";
  const cardWord = displayWord || currentWord?.text || "";

  // ═══ RENDER ════════════════════════════════════════════════════

  if (ph === "ready") {
    return (
      <div style={screenStyle}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}>
          <span style={{ fontSize: 64 }}>⚡</span>
          <h1 style={{ fontSize: fontSizes["3xl"], fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>Flash de Palabras</h1>
          <p style={{ fontSize: fontSizes.md, color: colors.text.muted, margin: 0 }}>{sessionWords.length} palabras — 3 rondas</p>
          <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md }}>
            {onBack && <AnimatedButton variant="secondary" onClick={onBack}>Volver</AnimatedButton>}
            <AnimatedButton onClick={handleStart}>Empezar</AnimatedButton>
          </div>
        </motion.div>
      </div>
    );
  }

  if (ph === "paused") {
    return (
      <div style={screenStyle}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg }}>
          <span style={{ fontSize: 64 }}>⏸️</span>
          <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, margin: 0 }}>Pausado</h2>
          <div style={{ display: "flex", gap: spacing.md }}>
            {onBack && <AnimatedButton variant="secondary" onClick={onBack}>Salir</AnimatedButton>}
            <AnimatedButton onClick={handleResume}>Continuar</AnimatedButton>
          </div>
        </motion.div>
      </div>
    );
  }

  if (ph === "complete") {
    const pct = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;

    return (
      <div style={screenStyle}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.lg, maxWidth: 400 }}>
          <div style={{ display: "flex", gap: spacing.sm, fontSize: 48 }}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.2, type: "spring", damping: 8 }}
                style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.25)" }}>⭐</motion.span>
            ))}
          </div>
          <h2 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, margin: 0 }}>¡Sesión completa!</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
            {sessionWords.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.2, type: "spring", damping: 10 }}
                style={{ display: "flex", alignItems: "center", gap: spacing.xs, padding: `${spacing.sm}px ${spacing.md}px`, backgroundColor: colors.bg.secondary, borderRadius: radii.lg, fontSize: fontSizes.lg, fontFamily: fonts.display }}>
                <span>{w.text}</span><span>{EMOJI_MAP[w.text] ?? ""}</span>
              </motion.div>
            ))}
          </div>
          <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md }}>
            {onBack && <AnimatedButton variant="secondary" onClick={onBack}>Volver</AnimatedButton>}
            <AnimatedButton onClick={handleStart}>Jugar de nuevo</AnimatedButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Active session ─────────────────────────────────────────────

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#FFFFFF", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${spacing.sm}px ${spacing.md}px`, zIndex: 20 }}>
        <div style={{ display: "flex", gap: spacing.sm }}>
          {onBack && <button onClick={onBack} style={closeBtn}>✕</button>}
          <button onClick={handlePause} style={closeBtn}>⏸</button>
        </div>
        <div style={{
          fontSize: fontSizes.sm,
          color: "#2d3748",
          fontFamily: fonts.display,
          fontWeight: "bold",
          padding: "4px 12px",
          borderRadius: 9999,
          backgroundColor: "#EDF2F7",
          border: "1px solid #CBD5E0",
        }}>
          {ph.startsWith("pres") ? `Ronda 1 · Pasada ${pass + 1}/3` : ph.startsWith("repeat") ? `Ronda 2 · Pasada ${pass + 1}/3` : ph === "story" ? "Ronda 3 · Historia" : ph === "review" ? "Repaso" : ""}
        </div>
        {/* Timer + Mic */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 50 }}>
          {showTimer && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: radii.lg, backgroundColor: timer <= 1 ? "#fed7d7" : colors.bg.secondary }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <span style={{ fontSize: fontSizes.lg, fontWeight: "bold", fontFamily: fonts.display, color: timer <= 1 ? colors.error : colors.text.primary }}>{timer}</span>
            </div>
          )}
          {showMic && (
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: radii.lg, backgroundColor: "rgba(229,62,62,0.1)" }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#e53e3e" }} />
              <span style={{ fontSize: 11, fontWeight: "bold", color: "#e53e3e" }}>REC</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* FlipCard for words */}
      {isCardVisible && (
        <div
          style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 }}
          onClick={ph === "repeat" ? handleCardTap : undefined}
        >
          {/* Repeat-phase countdown bar with Leo riding the top */}
          {ph === "repeat" && showRepeatTimer && (
            <div style={{ height: "min(70vh, 520px)", display: "flex", alignItems: "stretch" }}
              onClick={(e) => e.stopPropagation()}>
              <TimeBar
                seconds={REPEAT_TIMER_SECONDS}
                resetKey={repeatTimerKey}
                onTimeUp={() => { /* handled imperatively via setTimeout */ }}
                color={worldColor}
              />
            </div>
          )}
          <div style={{ width: "min(85vw, 70vh, 720px)", maxWidth: 720, aspectRatio: "4/3", position: "relative", cursor: ph === "repeat" ? "pointer" : "default" }}>
            <FlipCard
              isFlipped={isFlipped}
              front={
                <div style={{ width: "100%", height: "100%", borderRadius: 20, background: `linear-gradient(135deg, ${worldColor}ee, ${worldColor}88)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, overflow: "hidden" }}>
                  <SofiaAvatar size={120} speaking={false} />
                  <div style={{ display: "flex", gap: 8 }}>
                    {sessionWords.map((_, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: i < dotsCompleted ? "#fff" : "rgba(255,255,255,0.3)", transition: "background-color 0.3s" }} />
                    ))}
                  </div>
                </div>
              }
              back={
                <div style={{ width: "100%", height: "100%", borderRadius: 20, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: shadows.lg, position: "relative", padding: "16px 24px", overflow: "hidden" }}>
                  <span style={{ fontSize: fitWordFontSize(cardWord, baseFontSize), fontWeight: "bold", color: fontColor, fontFamily: "Arial Rounded MT Bold, Arial, sans-serif", textAlign: "center", lineHeight: 1.1, wordBreak: "keep-all", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {cardWord}
                  </span>
                  <QuickCelebration active={showCelebration} />
                </div>
              }
            />
          </div>
          {/* Animated hand hint for Round 2 */}
          {ph === "repeat" && isFlipped && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <motion.div
                animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1.5 }}
                style={{ fontSize: 48 }}
              >
                👆
              </motion.div>
              <span style={{ fontSize: fontSizes.md, color: worldColor, fontFamily: fonts.display, fontWeight: "bold" }}>
                ¡Toca la tarjeta!
              </span>
            </motion.div>
          )}
        </div>
      )}

      {/* "¡Qué linda historia!" — Sofia + the 5 learned words after the story
           text fades out but before the next phase. */}
      {isStory && !currentSentence && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: spacing.lg, padding: spacing.lg,
        }}>
          <SofiaAvatar size={220} speaking={isSpeaking} />
          <AudioWaves active={isSpeaking} color={worldColor} />
          <div style={{
            display: "flex", flexWrap: "wrap", gap: spacing.sm,
            justifyContent: "center", maxWidth: 620,
          }}>
            {sessionWords.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, type: "spring", damping: 12 }}
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  backgroundColor: "#fff",
                  border: `2px solid ${worldColor}`,
                  borderRadius: radii.lg,
                  fontSize: fontSizes.lg,
                  fontFamily: fonts.display,
                  fontWeight: "bold",
                  color: "#2d3748",
                  boxShadow: shadows.sm,
                }}
              >
                {w.text} {EMOJI_MAP[w.text] ?? ""}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Story text with word highlights */}
      {isStory && currentSentence && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              minHeight: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "70px 24px 48px",
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                fontSize: 26,
                fontFamily: fonts.display,
                lineHeight: 1.7,
                textAlign: "center",
                margin: 0,
                maxWidth: 560,
                width: "100%",
              }}
            >
              {currentSentence.split(/\s+/).map((token, i) => {
                const clean = token.replace(/[.,!?;:¡¿]/g, "").toLowerCase();
                const isLearned = sessionWords.some((w) => w.text.toLowerCase() === clean);
                const isHighlighted = highlightedWord === clean;

                return (
                  <motion.span
                    key={i}
                    animate={isHighlighted ? { scale: 1.4 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      color: isLearned ? worldColor : "#888",
                      fontWeight: isLearned ? 700 : 400,
                      display: "inline-block",
                      marginRight: 8,
                    }}
                  >
                    {token}
                  </motion.span>
                );
              })}
            </p>
          </div>
        </div>
      )}

      {/* Sofia speaking overlay (greeting, story intro, review intro) */}
      {(ph === "greeting" || ph === "story_intro" || ph === "review_intro" || ph === "repeat_intro") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 32px", borderRadius: 24, backgroundColor: `${worldColor}08`, maxWidth: 420 }}>
            <SofiaAvatar size={300} speaking={isSpeaking} />
            <AudioWaves active={isSpeaking} color={worldColor} />
          </motion.div>
        </div>
      )}

      {/* End-of-pass video (Round 2): celebration if >2 correct, else motivation */}
      {ph === "repeat_video" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md }}>
          <video
            key={videoMode}
            src={`/videos/leo-${videoMode}.mp4`}
            autoPlay
            playsInline
            controls={false}
            onEnded={() => setPh("repeat_sofia")}
            onError={() => setPh("repeat_sofia")}
            style={{
              maxWidth: "min(85vw, 720px)",
              maxHeight: "min(70vh, 540px)",
              borderRadius: 24,
              boxShadow: shadows.lg,
              backgroundColor: "#000",
            }}
          />
          <button
            onClick={() => setPh("repeat_sofia")}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              borderRadius: radii.pill,
              backgroundColor: worldColor,
              color: "#fff",
              border: "none",
              fontSize: fontSizes.md,
              fontWeight: "bold",
              fontFamily: fonts.display,
              cursor: "pointer",
            }}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* GIF celebration between rounds (pres_sofia, repeat_sofia) */}
      {(ph === "pres_sofia" || ph === "repeat_sofia") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <CelebrationGif size={200} />
            <AudioWaves active={isSpeaking} color={worldColor} />
          </motion.div>
        </div>
      )}

      {/* Celebration overlay */}
      {ph === "celebration" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
          <CelebrationGif size={160} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
            {sessionWords.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.2, type: "spring", damping: 10 }}
                style={{ padding: `${spacing.sm}px ${spacing.md}px`, backgroundColor: "#fff", border: `2px solid ${worldColor}`, borderRadius: radii.lg, fontSize: fontSizes.lg, fontFamily: fonts.display, fontWeight: "bold", color: "#2d3748" }}>
                {w.text} {EMOJI_MAP[w.text] ?? ""}
              </motion.div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 40 }}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 + i * 0.2, type: "spring", damping: 8 }}>⭐</motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Affirmation overlay */}
      {ph === "affirmation" && affirmationText && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
          <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: worldColor, textAlign: "center", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
            "{affirmationText}"
          </motion.p>
        </div>
      )}

      {/* Farewell word display */}
      {ph === "farewell" && displayWord && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div key={displayWord} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "0 24px", maxWidth: "100%" }}>
            <span style={{ fontSize: 64 }}>{EMOJI_MAP[displayWord] ?? ""}</span>
            <span style={{ fontSize: fitWordFontSize(displayWord, 72), fontWeight: "bold", fontFamily: "Arial Rounded MT Bold, Arial, sans-serif", color: "#2d3748", whiteSpace: "nowrap", maxWidth: "100%" }}>
              {displayWord}
            </span>
          </motion.div>
        </div>
      )}

      {/* Transcript */}
      {mic.transcript && showMic && (
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 15, fontSize: fontSizes.sm, color: colors.success, fontStyle: "italic" }}>
          "{mic.transcript}"
        </div>
      )}

      <ProgressLine progress={progress} color={worldColor} />
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  backgroundColor: "#FFFFFF", fontFamily: fonts.body, padding: spacing.xl,
};

const closeBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(0,0,0,0.1)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", fontSize: 16, color: "#666",
};
