// ─── Sofia Voice Service ────────────────────────────────────────────
//
// Priority: pre-recorded MP3 audio → Web Speech API fallback
// MP3 files live in /audio/sofia/
// If MP3 not found or fails, falls back to browser TTS seamlessly

// ─── Audio player (MP3) ───────────────────────────────────────────

const _audioCache = new Map<string, HTMLAudioElement>();
let _currentAudio: HTMLAudioElement | null = null;

function playMP3(filename: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    const url = `/audio/sofia/${filename}.mp3`;

    // Check cache
    let audio = _audioCache.get(filename);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "auto";
    }

    // Stop any current audio AND browser TTS
    if (_currentAudio) {
      _currentAudio.pause();
      _currentAudio.currentTime = 0;
    }
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
    _currentAudio = audio;

    audio.onended = () => {
      _currentAudio = null;
      _audioCache.set(filename, audio!);
      resolve(true);
    };
    audio.onerror = () => {
      _currentAudio = null;
      resolve(false); // Fallback to TTS
    };

    audio.play().catch(() => resolve(false));
  });
}

// ─── Web Speech API (fallback) ────────────────────────────────────

const FEMALE_VOICE_PRIORITY = [
  "Google español", "Google español de Estados Unidos",
  "Paulina", "Mónica", "Angelica", "Francisca",
  "Microsoft Sabina Online", "Microsoft Sabina",
  "Microsoft Helena Online", "Microsoft Helena",
  "Microsoft Dalia Online", "Dalia", "Sabina", "Helena",
];
const MALE_NAMES = ["Jorge", "Diego", "Andrés", "Carlos", "Pablo", "Juan", "Enrique"];

let _selectedVoice: SpeechSynthesisVoice | null = null;
let _voiceReady = false;

function selectBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  const spanish = voices.filter((v) => v.lang.startsWith("es"));
  for (const name of FEMALE_VOICE_PRIORITY) {
    const match = spanish.find((v) => v.name.includes(name));
    if (match) return match;
  }
  const nonMale = spanish.find((v) => !MALE_NAMES.some((m) => v.name.includes(m)));
  if (nonMale) return nonMale;
  return spanish[0] ?? null;
}

if (typeof window !== "undefined" && typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = () => {
    _selectedVoice = selectBestVoice();
    _voiceReady = _selectedVoice !== null;
  };
  _selectedVoice = selectBestVoice();
  _voiceReady = _selectedVoice !== null;
}

export type SpeechEmotion = "normal" | "excited" | "gentle" | "encouraging";

const EMOTION_CONFIG: Record<SpeechEmotion, { rate: number; pitch: number }> = {
  normal:      { rate: 0.85, pitch: 1.05 },
  excited:     { rate: 0.95, pitch: 1.18 },
  gentle:      { rate: 0.75, pitch: 1.00 },
  encouraging: { rate: 0.88, pitch: 1.12 },
};

function speakOneTTS(text: string, rate: number, pitch: number): Promise<void> {
  if (typeof speechSynthesis === "undefined") return Promise.resolve();
  // Stop any MP3 playing
  if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; _currentAudio = null; }
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      const voice = _selectedVoice ?? selectBestVoice();
      if (voice) u.voice = voice;
      u.lang = "es-MX";
      u.rate = rate;
      u.pitch = pitch;
      u.volume = 1.0;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    }, 40);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function speakWithTTS(text: string, emotion: SpeechEmotion = "normal"): Promise<void> {
  if (typeof window === "undefined") return;
  const { rate, pitch } = EMOTION_CONFIG[emotion];

  if (text.split(/\s+/).length <= 5) {
    await wait(50);
    await speakOneTTS(text, rate, pitch);
    return;
  }

  const segments = text
    .split(/([,;:!?.])\s*/)
    .reduce<string[]>((acc, part, i, arr) => {
      if (i % 2 === 0) {
        const punct = arr[i + 1] || "";
        if (part.trim()) acc.push(part.trim() + punct);
      }
      return acc;
    }, []);

  await wait(50);
  for (let i = 0; i < segments.length; i++) {
    await speakOneTTS(segments[i], rate, pitch);
    if (i < segments.length - 1) {
      const seg = segments[i];
      const pause = seg.endsWith("!") || seg.endsWith("?") ? 400
        : seg.endsWith(".") ? 350
        : seg.endsWith(",") || seg.endsWith(";") ? 200 : 150;
      await wait(pause);
    }
  }
}

// ─── Unified speak: MP3 first, TTS fallback ──────────────────────

async function speak(mp3Name: string | null, text: string, emotion: SpeechEmotion): Promise<void> {
  if (mp3Name && mp3Name.length > 0) {
    const played = await playMP3(mp3Name);
    if (played) return;
  }
  await speakWithTTS(text, emotion);
}

// ─── State tracking ──────────────────────────────────────────────

let _speaking = false;

function track(p: Promise<void>): Promise<void> {
  _speaking = true;
  return p.finally(() => { _speaking = false; });
}

// ─── Public API ──────────────────────────────────────────────────

/** Name a single word — tries MP3 first */
export function sofiaNameWord(word: string): Promise<void> {
  const mp3 = `palabra-${word.toLowerCase()}`;
  return track(speak(mp3, word, "gentle"));
}

/** Sofia greets */
export function sofiaGreets(text: string): Promise<void> {
  return track(speak(null, text, "excited"));
}

/** Sofia teaches/explains */
export function sofiaTeaches(text: string): Promise<void> {
  return track(speak(null, text, "gentle"));
}

/** Sofia celebrates */
export function sofiaCelebrates(text: string): Promise<void> {
  return track(speak(null, text, "excited"));
}

/** Sofia encourages after a mistake */
export function sofiaEncourages(text: string): Promise<void> {
  return track(speak(null, text, "encouraging"));
}

/** Sofia reads a story */
export function sofiaReads(text: string): Promise<void> {
  return track(speak(null, text, "gentle"));
}

/** Generic speak */
export function speakSofia(text: string): Promise<void> {
  return track(speak(null, text, "normal"));
}

/**
 * Play a specific pre-recorded MP3 by filename (without extension).
 * Falls back to TTS with the given text if MP3 not found.
 */
export function sofiaPlayAudio(mp3Name: string | null, fallbackText: string, emotion: SpeechEmotion = "normal"): Promise<void> {
  return track(speak(mp3Name, fallbackText, emotion));
}

// Legacy aliases
export const speakWord = sofiaNameWord;
export const speakRules = sofiaTeaches;
export const speakSentence = sofiaReads;
export const speakReview = (word: string) => track(speak(null, word, "normal"));

export function stopVoice(): void {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
  if (typeof window !== "undefined" && typeof speechSynthesis !== "undefined") {
    speechSynthesis.cancel();
  }
  _speaking = false;
}

export function isSpeaking(): boolean {
  return _speaking;
}

export function isVoiceReady(): boolean {
  return _voiceReady || _audioCache.size > 0;
}
