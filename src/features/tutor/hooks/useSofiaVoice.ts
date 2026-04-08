"use client";

import { useCallback } from "react";
import {
  sofiaNameWord,
  sofiaGreets,
  sofiaCelebrates,
  sofiaTeaches,
  sofiaReads,
  sofiaEncourages,
  speakSofia,
  stopVoice,
  isSpeaking as getIsSpeaking,
  isVoiceReady,
} from "@/shared/services/sofiaVoice";

/**
 * React hook that wraps the sofiaVoice service.
 * ALL speech goes through the segmented sofiaVoice.ts engine.
 */
export function useSofiaVoice() {
  const speakWord = useCallback(
    (word: string) => sofiaNameWord(word),
    []
  );

  const speakSofiaCb = useCallback(
    (text: string) => speakSofia(text),
    []
  );

  const speakSentence = useCallback(
    (text: string) => sofiaReads(text),
    []
  );

  const speakCelebration = useCallback(
    (text: string) => sofiaCelebrates(text),
    []
  );

  const speakLongText = useCallback(
    async (text: string, pauseBetween = 300) => {
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (let i = 0; i < sentences.length; i++) {
        await sofiaReads(sentences[i]);
        if (i < sentences.length - 1) {
          await new Promise((r) => setTimeout(r, pauseBetween));
        }
      }
    },
    []
  );

  const speakWithHighlight = useCallback(
    async (sentence: string, _onWord: (word: string) => void) => {
      // Web Speech onboundary is unreliable — just read the sentence
      await sofiaReads(sentence);
    },
    []
  );

  const speak = useCallback(
    (text: string, config: { rate?: number; pitch?: number } = {}) => {
      // Route to appropriate function based on text length
      if (text.split(/\s+/).length <= 3) return sofiaNameWord(text);
      return speakSofia(text);
    },
    []
  );

  const stop = useCallback(() => stopVoice(), []);

  return {
    speak,
    speakWord,
    speakSofia: speakSofiaCb,
    speakSentence,
    speakWithHighlight,
    speakCelebration,
    speakLongText,
    stop,
    ready: isVoiceReady(),
    isSpeaking: getIsSpeaking(),
    voiceName: "Sofia Voice Engine",
  };
}
