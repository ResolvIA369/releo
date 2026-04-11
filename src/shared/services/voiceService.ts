// ─── Voice Service ──────────────────────────────────────────────────
//
// Layered TTS architecture:
//   1. Web Speech API (default, free, offline)
//   2. ElevenLabs (optional upgrade, set NEXT_PUBLIC_ELEVENLABS_API_KEY)
//
// Audio buffering: preload() pre-generates audio for a list of texts.
// When speak() is called, it plays from cache instantly if available,
// otherwise falls back to on-demand generation.

export type Emotion = "excited" | "encouraging" | "neutral" | "celebratory";

export interface SpeakOptions {
  text: string;
  emotion?: Emotion;
  rate?: number;
  lang?: string;
}

export interface VoiceProvider {
  speak(options: SpeakOptions): Promise<void>;
  stop(): void;
  readonly isAvailable: boolean;
}

// ─── Tutor personality (system prompt for phrase generation) ────────

export const TUTOR_PERSONALITY = `Eres una tutora infantil extremadamente alegre, creativa y motivadora.
Nunca repites la misma frase de felicitación dos veces.
Usas un lenguaje sencillo y lleno de energía.
Hablas en español latinoamericano neutro.
Tus frases son cortas (máximo 10 palabras).
Siempre incluyes el nombre del niño cuando lo conoces.`;

// ─── Audio Buffer ──────────────────────────────────────────────────

type BufferKey = string;

function makeKey(text: string, emotion: Emotion): BufferKey {
  return `${emotion}::${text}`;
}

const audioBuffer = new Map<BufferKey, SpeechSynthesisUtterance>();
const elevenLabsBuffer = new Map<BufferKey, string>(); // objectURL cache

export function preloadCount(): number {
  return audioBuffer.size + elevenLabsBuffer.size;
}

// ─── Emotion → speech rate/pitch mapping (Web Speech API) ──────────

const EMOTION_CONFIG: Record<Emotion, { rate: number; pitch: number }> = {
  excited:      { rate: 1.15, pitch: 1.3 },
  encouraging:  { rate: 0.95, pitch: 1.1 },
  celebratory:  { rate: 1.1,  pitch: 1.4 },
  neutral:      { rate: 1.0,  pitch: 1.0 },
};

// ─── Provider: Web Speech API ──────────────────────────────────────

function createUtterance(
  text: string,
  emotion: Emotion,
  rate?: number,
  lang = "es-MX"
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const config = EMOTION_CONFIG[emotion];
  utterance.rate = rate ?? config.rate;
  utterance.pitch = config.pitch;

  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const spanishVoice = voices.find((v) => v.lang.startsWith("es"));
  if (spanishVoice) utterance.voice = spanishVoice;

  return utterance;
}

function createWebSpeechProvider(): VoiceProvider {
  // DISABLED on purpose. The browser's default Spanish voice is male
  // on most platforms which contradicts Sofia's character. Returns a
  // no-op provider so any accidental call falls through silently and
  // sofiaVoice.ts (MP3-only) handles all real playback.
  return {
    get isAvailable() { return false; },
    async speak() { /* no-op */ },
    stop() { /* no-op */ },
  };
}

// ─── Provider: ElevenLabs ──────────────────────────────────────────

const ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // "Sarah" — warm, friendly

const EMOTION_STABILITY: Record<Emotion, { stability: number; similarity: number }> = {
  excited:      { stability: 0.3, similarity: 0.8 },
  encouraging:  { stability: 0.5, similarity: 0.75 },
  celebratory:  { stability: 0.25, similarity: 0.85 },
  neutral:      { stability: 0.7, similarity: 0.75 },
};

async function fetchElevenLabsAudio(
  apiKey: string,
  text: string,
  emotion: Emotion
): Promise<string | null> {
  const settings = EMOTION_STABILITY[emotion];
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity,
        },
      }),
    }
  );

  if (!res.ok) return null;

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function playObjectURL(url: string): { audio: HTMLAudioElement; done: Promise<void> } {
  const audio = new Audio(url);
  const done = new Promise<void>((resolve) => {
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play();
  });
  return { audio, done };
}

function createElevenLabsProvider(apiKey: string): VoiceProvider {
  let currentAudio: HTMLAudioElement | null = null;

  return {
    get isAvailable() {
      return true;
    },

    async speak({ text, emotion = "neutral" }) {
      this.stop();

      const key = makeKey(text, emotion);
      // Use pre-fetched audio if available
      let url = elevenLabsBuffer.get(key) ?? null;

      if (!url) {
        url = await fetchElevenLabsAudio(apiKey, text, emotion);
        if (!url) return;
      }

      const { audio, done } = playObjectURL(url);
      currentAudio = audio;
      await done;

      // Don't revoke cached URLs — they may be reused
      if (!elevenLabsBuffer.has(key)) {
        URL.revokeObjectURL(url);
      }
    },

    stop() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    },
  };
}

// ─── Factory: auto-select provider ─────────────────────────────────

let _provider: VoiceProvider | null = null;

function getApiKey(): string | undefined {
  return typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    : undefined;
}

export function getVoiceProvider(): VoiceProvider {
  if (_provider) return _provider;

  const apiKey = getApiKey();
  _provider = apiKey
    ? createElevenLabsProvider(apiKey)
    : createWebSpeechProvider();

  return _provider;
}

// ─── Public API ────────────────────────────────────────────────────
// Routes through sofiaVoice.ts for natural segmented speech.
// Falls back to ElevenLabs provider if API key is set.

import {
  sofiaGreets,
  sofiaCelebrates,
  sofiaTeaches,
  sofiaNameWord,
  speakSofia as sofiaSpeak,
  stopVoice as sofiaStop,
} from "./sofiaVoice";

const EMOTION_TO_SOFIA: Record<Emotion, (text: string) => Promise<void>> = {
  excited: sofiaGreets,
  celebratory: sofiaCelebrates,
  encouraging: sofiaTeaches,
  neutral: sofiaSpeak,
};

export function speak(options: SpeakOptions): Promise<void> {
  // If ElevenLabs is configured, use it directly
  const apiKey = getApiKey();
  if (apiKey) {
    return getVoiceProvider().speak(options);
  }

  // Otherwise use the improved sofiaVoice engine
  const { text, emotion = "neutral" } = options;
  if (text.split(/\s+/).length <= 3) return sofiaNameWord(text);
  const fn = EMOTION_TO_SOFIA[emotion] ?? sofiaSpeak;
  return fn(text);
}

export function stopSpeaking(): void {
  sofiaStop();
  // Also stop ElevenLabs if active
  if (getApiKey()) getVoiceProvider().stop();
}

/**
 * Pre-generate audio for a list of texts so speak() is instant.
 *
 * For Web Speech API: pre-builds SpeechSynthesisUtterance objects.
 * For ElevenLabs: pre-fetches audio blobs and caches objectURLs.
 *
 * Call this when you know which phrases will be needed soon
 * (e.g., when loading a word list for a session).
 */
export async function preload(
  items: { text: string; emotion?: Emotion }[]
): Promise<void> {
  const apiKey = getApiKey();

  if (apiKey) {
    // ElevenLabs: fetch all audio in parallel, cache as objectURLs
    const fetches = items.map(async ({ text, emotion = "neutral" }) => {
      const key = makeKey(text, emotion);
      if (elevenLabsBuffer.has(key)) return;

      const url = await fetchElevenLabsAudio(apiKey, text, emotion);
      if (url) elevenLabsBuffer.set(key, url);
    });
    await Promise.all(fetches);
  }
  // No Web Speech preload — MP3-only playback handled by sofiaVoice.
}

/**
 * Clear all cached audio. Call on session end or cleanup.
 */
export function clearBuffer(): void {
  audioBuffer.clear();
  for (const url of elevenLabsBuffer.values()) {
    URL.revokeObjectURL(url);
  }
  elevenLabsBuffer.clear();
}
