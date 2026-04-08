"use client";

import { useCallback, useRef, useEffect } from "react";
import { speak, stopSpeaking, preload, clearBuffer, type Emotion } from "@/shared/services/voiceService";
import type { DomanWord } from "@/shared/types/doman";

// ─── Seño Sofía — Persona de la tutora ─────────────────────────────

export const SOFIA_PERSONA = {
  name: "Seño Sofía",
  avatar: "👩‍🏫",
} as const;

const GREETINGS = [
  "¡Hola, {name}! ¡Qué bueno verte! ¿Listo para aprender?",
  "¡{name}! ¡Llegaste! Hoy tengo palabras muy divertidas para ti.",
  "¡Hola! Soy la Seño Sofía. ¡Vamos a aprender juntos, {name}!",
  "¡Qué bueno verte! ¿Listo para nuestra clase?",
  "¡Bienvenido a la clase! Vamos a pasarla increíble.",
];

const PRAISES = [
  "¡Increíble! ¡Lo hiciste genial!",
  "¡Eres un genio de las palabras!",
  "¡Bravo, {name}! ¡Tu esfuerzo es increíble!",
  "¡Maravilloso! ¡Aprendes muy rápido!",
  "¡Fantástico! ¡La Seño Sofía está muy orgullosa!",
  "¡Wow! ¡Eso estuvo perfecto!",
  "¡Muy bien, {name}! ¡Sigue así!",
  "¡Lo lograste! ¡Sabía que podías!",
];

const ENCOURAGEMENTS = [
  "¡Tú puedes! ¡Inténtalo otra vez!",
  "¡Casi lo tienes, {name}! ¡Un poquito más!",
  "¡No te rindas! ¡Vas muy bien!",
  "¡Cada intento te hace más fuerte!",
  "¡Ánimo! ¡Los errores nos ayudan a crecer!",
  "¡La Seño Sofía confía en ti, {name}! ¡Tú eres capaz!",
];

const ON_MISTAKE = [
  "¡No pasa nada! Vamos a intentarlo juntos.",
  "¡Uy, casi! La Seño Sofía te ayuda.",
  "¡Tranquilo, {name}! Equivocarse es parte de aprender.",
  "¡Mira bien! Yo sé que tú puedes.",
];

const FAREWELLS = [
  "¡Fue una gran clase, {name}! ¡Nos vemos mañana!",
  "¡Gran clase! Descansa y mañana seguimos.",
  "¡Lo hiciste increíble hoy! ¡Hasta pronto, {name}!",
  "¡Eres increíble, {name}! ¡Te espero en la próxima clase!",
];

const WORD_INTROS = [
  "Mira esta palabra:",
  "La siguiente palabra es:",
  "¡Observa bien!",
  "¡Presta atención!",
  "¡Aquí viene!",
];

// ─── Utility: pick random without repeating the last one ───────────

function createPicker(pool: string[]) {
  let lastIndex = -1;
  return () => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * pool.length);
    } while (idx === lastIndex && pool.length > 1);
    lastIndex = idx;
    return pool[idx];
  };
}

// ─── Hook ──────────────────────────────────────────────────────────

interface UseTutorOptions {
  childName?: string;
  enabled?: boolean;
}

export function useTutor({ childName, enabled = true }: UseTutorOptions = {}) {
  const pickGreeting = useRef(createPicker(GREETINGS)).current;
  const pickPraise = useRef(createPicker(PRAISES)).current;
  const pickEncouragement = useRef(createPicker(ENCOURAGEMENTS)).current;
  const pickOnMistake = useRef(createPicker(ON_MISTAKE)).current;
  const pickFarewell = useRef(createPicker(FAREWELLS)).current;
  const pickWordIntro = useRef(createPicker(WORD_INTROS)).current;

  // Pre-load all tutor phrases on mount for instant playback
  useEffect(() => {
    if (!enabled) return;

    const allPhrases = [
      ...GREETINGS.map((text) => ({ text, emotion: "excited" as Emotion })),
      ...PRAISES.map((text) => ({ text, emotion: "celebratory" as Emotion })),
      ...ENCOURAGEMENTS.map((text) => ({ text, emotion: "encouraging" as Emotion })),
      ...ON_MISTAKE.map((text) => ({ text, emotion: "encouraging" as Emotion })),
      ...FAREWELLS.map((text) => ({ text, emotion: "neutral" as Emotion })),
    ];
    preload(allPhrases);

    return () => clearBuffer();
  }, [enabled]);

  const say = useCallback(
    (text: string, emotion: Emotion = "neutral") => {
      if (!enabled) return Promise.resolve();
      let personalized = text;
      if (childName) {
        personalized = personalized
          .replace(/\{name\}/g, childName)
          .replace("campeón", childName)
          .replace("pequeño lector", childName)
          .replace("amiguito", childName)
          .replace("estrellita", childName);
      } else {
        // Remove {name} placeholders cleanly (no dangling commas)
        personalized = personalized
          .replace(/,?\s*\{name\}/g, "")
          .replace(/\{name\},?\s*/g, "");
      }
      return speak({ text: personalized, emotion });
    },
    [enabled, childName]
  );

  const greet = useCallback(
    () => say(pickGreeting(), "excited"),
    [say, pickGreeting]
  );

  const praise = useCallback(
    () => say(pickPraise(), "celebratory"),
    [say, pickPraise]
  );

  const encourage = useCallback(
    () => say(pickEncouragement(), "encouraging"),
    [say, pickEncouragement]
  );

  const onMistake = useCallback(
    () => say(pickOnMistake(), "encouraging"),
    [say, pickOnMistake]
  );

  const farewell = useCallback(
    () => say(pickFarewell(), "neutral"),
    [say, pickFarewell]
  );

  const repeatWord = useCallback(
    (word: DomanWord) => say(word.text, "neutral"),
    [say]
  );

  const introduceWord = useCallback(
    (word: DomanWord) => {
      const intro = pickWordIntro();
      return say(`${intro} ${word.text}`, "neutral");
    },
    [say, pickWordIntro]
  );

  const stop = useCallback(() => {
    stopSpeaking();
  }, []);

  return {
    persona: SOFIA_PERSONA,
    greet,
    praise,
    encourage,
    onMistake,
    farewell,
    repeatWord,
    introduceWord,
    stop,
  };
}
