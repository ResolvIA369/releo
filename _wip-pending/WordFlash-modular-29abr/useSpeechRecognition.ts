"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

/** Browser-side check for showing the voice-verification toggle. */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/**
 * Web Speech wrapper. Exposes `available` so the UI can show an explicit
 * "tap to confirm" hint when the API is missing or the user denied
 * permission, instead of silently waiting for input that will never come.
 */
export function useSpeechRecognition() {
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [available, setAvailable] = useState<boolean>(true);

  useEffect(() => {
    setAvailable(getSpeechRecognition() !== null);
  }, []);

  const start = useCallback(() => {
    setTranscript("");
    const SR = getSpeechRecognition();
    if (!SR) {
      setAvailable(false);
      setListening(true);
      return;
    }
    const rec = new SR();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const r = e.results;
      setTranscript(r[r.length - 1][0].transcript.trim().toLowerCase());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setAvailable(false);
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setAvailable(false);
      setListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* may already be stopped */ }
    setListening(false);
  }, []);

  return { transcript, listening, available, start, stop };
}
