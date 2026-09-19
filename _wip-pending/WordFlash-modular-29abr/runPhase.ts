"use client";

import type { Dispatch, SetStateAction } from "react";
import type { DomanWord } from "@/shared/types/doman";
import { sofiaNameWord, sofiaPlayAudio } from "@/shared/services/sofiaVoice";
import { pickCelebrationVideo, pickMotivationVideo } from "@/shared/utils/videoPool";
import { getSession, type DomanSession } from "@/features/session/config/curriculum";
import { DEFAULT_SESSION_SCRIPT, fillScript } from "@/features/session/config/session-scripts";
import { type Phase, REPEAT_TIMER_SECONDS } from "./types";

const SC = DEFAULT_SESSION_SCRIPT;

export interface RunPhaseContext {
  ph: Phase;
  pass: number;
  wordIdx: number;
  currentWord: DomanWord | undefined;
  sessionWords: DomanWord[];
  story5: string;
  previousWords: string[];
  sessionData: DomanSession | null;
  correctInPass: number;
  isCancelled: () => boolean;
  delay: (ms: number) => Promise<void>;
  setIsFlipped: Dispatch<SetStateAction<boolean>>;
  setIsSpeaking: Dispatch<SetStateAction<boolean>>;
  setShowRepeatWord: Dispatch<SetStateAction<boolean>>;
  setShowRepeatTimer: Dispatch<SetStateAction<boolean>>;
  setRepeatTimerKey: Dispatch<SetStateAction<number>>;
  setDotsCompleted: Dispatch<SetStateAction<number>>;
  setPass: Dispatch<SetStateAction<number>>;
  setWordIdx: Dispatch<SetStateAction<number>>;
  setTick: Dispatch<SetStateAction<number>>;
  setVideoUrl: Dispatch<SetStateAction<string>>;
  setCurrentSentence: Dispatch<SetStateAction<string>>;
  setDisplayWord: Dispatch<SetStateAction<string>>;
  setAffirmationText: Dispatch<SetStateAction<string>>;
  setCorrectInPass: Dispatch<SetStateAction<number>>;
  setPh: Dispatch<SetStateAction<Phase>>;
  cancelledRef: { current: boolean };
  repeatResolvingRef: { current: boolean };
  autoNameNextRef: { current: boolean };
  repeatTimerRef: { current: ReturnType<typeof setTimeout> | undefined };
  scheduleRepeatTimeout: () => void;
}

/**
 * Drives one phase of the WordFlash session. Each branch ends by calling
 * setPh() to transition. Cancellation is checked between every async step
 * so a paused/unmounted run never mutates state from a stale closure.
 */
export async function runPhase(ctx: RunPhaseContext): Promise<void> {
  const c = ctx.isCancelled;

  switch (ctx.ph) {
    case "greeting_video":
      return; // video onEnded advances

    case "greeting":
      await runGreeting(ctx, c);
      return;

    case "presentation":
      await runPresentation(ctx, c);
      return;

    case "pres_sofia":
      await runPresSofia(ctx, c);
      return;

    case "repeat_intro":
      await runRepeatIntro(ctx, c);
      return;

    case "repeat":
      await runRepeat(ctx, c);
      return;

    case "repeat_video":
      ctx.setCorrectInPass(0);
      return;

    case "repeat_sofia":
      await runRepeatSofia(ctx, c);
      return;

    case "celebration":
      await ctx.delay(4000);
      if (c()) return;
      ctx.setPh("story_intro");
      return;

    case "story_intro":
      await runStoryIntro(ctx, c);
      return;

    case "story":
      await runStory(ctx, c);
      return;

    case "review_intro":
      await runReviewIntro(ctx, c);
      return;

    case "review":
      await runReview(ctx, c);
      return;

    case "farewell":
      ctx.setPh("affirmation");
      return;

    case "affirmation":
      await runAffirmation(ctx, c);
      return;

    case "farewell_video":
      return; // video onEnded advances
  }
}

async function runGreeting(ctx: RunPhaseContext, c: () => boolean) {
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio(
    "intro-parte2",
    "Antes de empezar quiero que sepas algo muy importante: sos una persona increíble, sos muy inteligente y sos capaz de aprender todo lo que te propongas. Ahora, prestá mucha atención. Te voy a ir mostrando unas palabras muy especiales para que las vayas conociendo y aprendiendo. Solo tenés que mirarlas y escucharme. ¿Estás listo? ¡Vamos!",
    "excited",
  );
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(600);
  if (c()) return;
  ctx.setPass(0); ctx.setWordIdx(0); ctx.setDotsCompleted(0);
  ctx.setPh("presentation");
}

async function runPresentation(ctx: RunPhaseContext, c: () => boolean) {
  if (!ctx.currentWord) return;
  ctx.setIsFlipped(true);
  await ctx.delay(200);
  if (c()) return;
  ctx.setIsSpeaking(true);
  await sofiaNameWord(ctx.currentWord.text);
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(300);
  if (c()) return;
  ctx.setDotsCompleted(ctx.wordIdx + 1);
  ctx.setIsFlipped(false);

  if (ctx.wordIdx < ctx.sessionWords.length - 1) {
    await ctx.delay(800);
    if (c()) return;
    ctx.setWordIdx((i) => i + 1);
    ctx.setTick((t) => t + 1);
  } else {
    await ctx.delay(600);
    if (c()) return;
    ctx.setPh("pres_sofia");
  }
}

async function runPresSofia(ctx: RunPhaseContext, c: () => boolean) {
  const phrase = fillScript(SC.round1.betweenTandas[ctx.pass], { name: "" });
  const mp3Names = ["round1-between1", "round1-between2", "round1-between3"];
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio(mp3Names[ctx.pass], phrase, "excited");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(600);
  if (c()) return;

  const nextPass = ctx.pass + 1;
  if (nextPass < 3) {
    ctx.setPass(nextPass); ctx.setWordIdx(0); ctx.setDotsCompleted(0);
    ctx.setPh("presentation");
  } else {
    ctx.setPass(0);
    ctx.setPh("repeat_intro");
  }
}

async function runRepeatIntro(ctx: RunPhaseContext, c: () => boolean) {
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("round2-intro", fillScript(SC.round2.intro, { name: "" }), "gentle");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(800);
  if (c()) return;
  ctx.setWordIdx(0); ctx.setDotsCompleted(0);
  ctx.setPh("repeat");
}

async function runRepeat(ctx: RunPhaseContext, c: () => boolean) {
  if (!ctx.currentWord) return;
  ctx.setShowRepeatWord(true);
  ctx.repeatResolvingRef.current = false;
  await ctx.delay(500);
  if (c()) return;

  if (ctx.autoNameNextRef.current) {
    ctx.autoNameNextRef.current = false;
    ctx.setIsSpeaking(true);
    await sofiaNameWord(ctx.currentWord.text);
    ctx.setIsSpeaking(false);
    if (c()) return;
    await ctx.delay(300);
    if (c()) return;
  }

  ctx.setRepeatTimerKey((k) => k + 1);
  ctx.setShowRepeatTimer(true);
  clearTimeout(ctx.repeatTimerRef.current);
  ctx.scheduleRepeatTimeout();
}

async function runRepeatSofia(ctx: RunPhaseContext, c: () => boolean) {
  const phrases = [
    "¡Lo estás haciendo increíble! ¡Tu voz suena hermosa!",
    "¡Casi terminamos! ¡Una más y listo!",
    "¡Lo lograste! ¡Aprendiste 5 palabras nuevas!",
  ];
  const mp3s = ["flash-increible", "flash-casi", "flash-lograste"];
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio(mp3s[ctx.pass], phrases[ctx.pass], "excited");
  ctx.setIsSpeaking(false);
  if (c()) return;

  const nextPass = ctx.pass + 1;
  if (nextPass < 3) {
    await ctx.delay(800);
    if (c()) return;
    ctx.setPass(nextPass); ctx.setWordIdx(0); ctx.setDotsCompleted(0);
    ctx.setPh("repeat");
  } else {
    ctx.setPh("celebration");
  }
}

async function runStoryIntro(ctx: RunPhaseContext, c: () => boolean) {
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("round3-intro", fillScript(SC.round3.intro, { name: "" }), "gentle");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(600);
  if (c()) return;
  ctx.setPh("story");
}

async function runStory(ctx: RunPhaseContext, c: () => boolean) {
  if (!ctx.story5) {
    ctx.setPh("farewell");
    return;
  }
  ctx.setCurrentSentence(ctx.story5);
  ctx.setIsSpeaking(true);

  let storySessionId = 0;
  if (ctx.sessionData?.words[0]?.id) {
    for (let i = 1; i <= 44; i++) {
      const s = getSession(i);
      if (s && s.words[0]?.id === ctx.sessionData.words[0].id) {
        storySessionId = i;
        break;
      }
    }
  }
  await sofiaPlayAudio(`historia-${storySessionId || 1}`, ctx.story5, "gentle");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(800);
  if (c()) return;
  ctx.setCurrentSentence("");
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("frase-historia-linda", "¡Qué linda historia! ¿Viste todas las palabras que aprendiste?", "excited");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(1000);
  if (c()) return;

  ctx.setPh(ctx.previousWords.length > 0 ? "review_intro" : "farewell");
}

async function runReviewIntro(ctx: RunPhaseContext, c: () => boolean) {
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("review-intro", fillScript(SC.review.intro, { name: "" }), "gentle");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(800);
  if (c()) return;
  ctx.setWordIdx(0);
  ctx.setPh("review");
}

async function runReview(ctx: RunPhaseContext, c: () => boolean) {
  for (let i = 0; i < ctx.previousWords.length; i++) {
    if (c()) return;
    ctx.setDisplayWord(ctx.previousWords[i]);
    ctx.setIsFlipped(true);
    await ctx.delay(600);
    if (c()) return;
    ctx.setIsSpeaking(true);
    await sofiaNameWord(ctx.previousWords[i]);
    ctx.setIsSpeaking(false);
    if (c()) return;
    await ctx.delay(800);
    if (c()) return;
    ctx.setIsFlipped(false);
    await ctx.delay(400);
  }
  if (c()) return;
  ctx.setDisplayWord("");
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("frase-recordaste", "¡Las recordaste todas! ¡Qué memoria tan buena!", "excited");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(1000);
  if (c()) return;
  ctx.setPh("farewell");
}

async function runAffirmation(ctx: RunPhaseContext, c: () => boolean) {
  const aff = "Yo puedo, yo creo en mí, yo soy inteligente";
  ctx.setAffirmationText(aff);
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("repeat-conmigo", "Repetí conmigo:", "gentle");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(300);
  if (c()) return;
  ctx.setIsSpeaking(true);
  await sofiaPlayAudio("afirmacion-principal", aff, "gentle");
  ctx.setIsSpeaking(false);
  if (c()) return;
  await ctx.delay(2000);
  if (c()) return;
  ctx.setAffirmationText("");
  ctx.setPh("farewell_video");
}

// REPEAT_TIMER_SECONDS is re-exported for tests / consumers.
export { REPEAT_TIMER_SECONDS };
