"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DomanWord, PhaseNumber } from "@/shared/types/doman";
import { useGameSession } from "../../hooks/useGameSession";
import { DEFAULT_SESSION_CONFIG } from "@/shared/constants";
import { getSession } from "@/features/session/config/curriculum";
import { sofiaNameWord, stopVoice } from "@/shared/services/sofiaVoice";
import { pickCelebrationVideo, pickMotivationVideo } from "@/shared/utils/videoPool";
import { useRewards } from "@/shared/components/RewardsLayer";
import { useAppStore } from "@/shared/store/useAppStore";
import { colors } from "@/shared/styles/design-tokens";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { wordsMatch } from "./wordsMatch";
import { runPhase, REPEAT_TIMER_SECONDS } from "./runPhase";
import type { Phase } from "./types";
import { useUserPrefs } from "@/features/persistence/hooks/useUserPrefs";

interface UseWordFlashSessionOptions {
  words: DomanWord[];
  phase: PhaseNumber;
  isDemo: boolean;
}

export function useWordFlashSession({ words, phase, isDemo }: UseWordFlashSessionOptions) {
  const sessionWords = useMemo(
    () => words.slice(0, DEFAULT_SESSION_CONFIG.wordsPerSession),
    [words],
  );
  const session = useGameSession({ phase, words: sessionWords, affirmation: "" });
  const profile = useAppStore((s) => s.profile);
  const mic = useSpeechRecognition();
  const { prefs } = useUserPrefs();
  const childName = profile?.childName ?? "amiguito";
  const { rewardCorrect } = useRewards();

  const sessionData = useMemo(() => {
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
  const [tick, setTick] = useState(0);
  const [pass, setPass] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRepeatWord, setShowRepeatWord] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dotsCompleted, setDotsCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctInPass, setCorrectInPass] = useState(0);
  const [repeatTimerKey, setRepeatTimerKey] = useState(0);
  const [showRepeatTimer, setShowRepeatTimer] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [highlightedWord] = useState<string | null>(null);
  const [displayWord, setDisplayWord] = useState("");
  const [affirmationText, setAffirmationText] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelledRef = useRef(false);
  const repeatResolvingRef = useRef(false);
  const autoNameNextRef = useRef(false);

  const currentWord = sessionWords[wordIdx];

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      stopVoice();
      mic.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const delay = useCallback(
    (ms: number) => new Promise<void>((r) => { timerRef.current = setTimeout(r, ms); }),
    [],
  );

  const handlePause = useCallback(() => {
    if (ph === "paused") return;
    clearTimeout(timerRef.current);
    clearTimeout(repeatTimerRef.current);
    stopVoice();
    mic.stop();
    setPrevPh(ph);
    setPh("paused");
  }, [ph, mic]);

  const handleResume = useCallback(() => setPh(prevPh), [prevPh]);

  const handleStart = useCallback(() => {
    session.start();
    cancelledRef.current = false;
    setPass(0);
    setWordIdx(0);
    setScore(0);
    setTotalAttempts(0);
    setDotsCompleted(0);
    setShowRepeatWord(false);
    setPh("greeting_video");
  }, [session]);

  const advanceRepeatWord = useCallback(async () => {
    setDotsCompleted(wordIdx + 1);
    await delay(400);

    if (wordIdx < sessionWords.length - 1) {
      setShowRepeatTimer(false);
      setShowRepeatWord(false);
      await delay(300);
      setWordIdx((i) => i + 1);
      setTick((t) => t + 1);
    } else {
      setShowRepeatTimer(false);
      setShowRepeatWord(false);
      const mode = correctInPass > 2 ? "celebration" : "motivation";
      setVideoUrl(mode === "celebration" ? pickCelebrationVideo() : pickMotivationVideo());
      setPh("repeat_video");
    }
    repeatResolvingRef.current = false;
  }, [wordIdx, sessionWords.length, delay, correctInPass]);

  const handleCardTap = useCallback(async () => {
    if (ph !== "repeat" || !showRepeatWord) return;
    if (repeatResolvingRef.current) return;
    repeatResolvingRef.current = true;

    clearTimeout(repeatTimerRef.current);
    setShowRepeatTimer(false);
    stopVoice();

    setTotalAttempts((a) => a + 1);
    setScore((s) => s + 1);
    setCorrectInPass((c) => c + 1);
    if (currentWord) session.markRecognized(currentWord.id);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 600);

    if (typeof window !== "undefined") {
      rewardCorrect(window.innerWidth / 2, window.innerHeight / 2);
    }

    if (currentWord) {
      setIsSpeaking(true);
      await sofiaNameWord(currentWord.text);
      setIsSpeaking(false);
    }

    await advanceRepeatWord();
  }, [ph, showRepeatWord, currentWord, session, rewardCorrect, advanceRepeatWord]);

  const handleRepeatTimeout = useCallback(async () => {
    if (ph !== "repeat" || !showRepeatWord) return;
    if (repeatResolvingRef.current) return;
    repeatResolvingRef.current = true;

    setShowRepeatTimer(false);
    stopVoice();
    setTotalAttempts((a) => a + 1);

    await delay(3000);
    autoNameNextRef.current = true;
    await advanceRepeatWord();
  }, [ph, showRepeatWord, advanceRepeatWord, delay]);

  const scheduleRepeatTimeout = useCallback(() => {
    repeatTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      handleRepeatTimeout();
    }, REPEAT_TIMER_SECONDS * 1000);
  }, [handleRepeatTimeout]);

  // Keyboard support: space/enter taps card, escape pauses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter") {
        if (ph === "repeat" && showRepeatWord) {
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
  }, [ph, showRepeatWord, handleCardTap, handlePause]);

  // Demo mode autoplay.
  useEffect(() => {
    if (!isDemo) return;
    if (ph === "ready") {
      const t = setTimeout(() => handleStart(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, ph]);

  useEffect(() => {
    if (!isDemo) return;
    if (ph === "repeat" && showRepeatWord && !repeatResolvingRef.current) {
      const t = setTimeout(() => {
        if (!repeatResolvingRef.current) handleCardTap();
      }, 3500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, ph, showRepeatWord, handleCardTap]);

  useEffect(() => {
    if (!isDemo) return;
    if (ph === "repeat_video") {
      const t = setTimeout(() => setPh("repeat_sofia"), 9000);
      return () => clearTimeout(t);
    }
    if (ph === "greeting_video") {
      const t = setTimeout(() => setPh("greeting"), 8000);
      return () => clearTimeout(t);
    }
  }, [isDemo, ph]);

  // Main state machine: each phase advances to the next via setPh().
  useEffect(() => {
    if (ph === "ready" || ph === "paused" || ph === "complete") return;
    cancelledRef.current = false;
    let localCancelled = false;

    runPhase({
      ph, pass, wordIdx, currentWord, sessionWords,
      story5, previousWords, sessionData, correctInPass,
      isCancelled: () => localCancelled || cancelledRef.current,
      delay,
      setIsFlipped, setIsSpeaking, setShowRepeatWord, setShowRepeatTimer,
      setRepeatTimerKey, setDotsCompleted, setPass, setWordIdx, setTick,
      setVideoUrl, setCurrentSentence, setDisplayWord, setAffirmationText,
      setCorrectInPass, setPh,
      cancelledRef, repeatResolvingRef, autoNameNextRef, repeatTimerRef,
      scheduleRepeatTimeout,
    });

    return () => {
      localCancelled = true;
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
      clearTimeout(repeatTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ph, tick]);

  // Voice verification: start the mic when a repeat-card is showing and
  // the parent enabled the flag. Stop it whenever we leave that state.
  useEffect(() => {
    const active = ph === "repeat" && showRepeatWord && prefs.voiceVerification && mic.available && !isDemo;
    if (active) {
      mic.start();
      return () => mic.stop();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ph, showRepeatWord, prefs.voiceVerification, mic.available, isDemo]);

  // Auto-confirm when the transcript matches the current word.
  useEffect(() => {
    if (!prefs.voiceVerification || !mic.transcript || !currentWord) return;
    if (ph !== "repeat" || !showRepeatWord) return;
    if (repeatResolvingRef.current) return;
    if (wordsMatch(mic.transcript, currentWord.text)) handleCardTap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mic.transcript, ph, showRepeatWord, currentWord]);

  return {
    sessionWords,
    session,
    childName,
    mic,
    story5,
    previousWords,
    worldColor,
    ph,
    pass,
    wordIdx,
    isFlipped,
    showRepeatWord,
    isSpeaking,
    showCelebration,
    dotsCompleted,
    score,
    totalAttempts,
    repeatTimerKey,
    showRepeatTimer,
    videoUrl,
    currentSentence,
    highlightedWord,
    displayWord,
    affirmationText,
    currentWord,
    setPh,
    handlePause,
    handleResume,
    handleStart,
    handleCardTap,
  };
}

export type WordFlashSession = ReturnType<typeof useWordFlashSession>;
