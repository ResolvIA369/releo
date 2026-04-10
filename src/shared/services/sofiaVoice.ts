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

    try {
      const playResult = audio.play();
      // Some older browsers (and JSDOM) return undefined instead of a Promise.
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => resolve(false));
      }
    } catch {
      resolve(false);
    }
  });
}

// ─── Phrase → MP3 mapping ────────────────────────────────────────

const PHRASE_TO_MP3: Record<string, string> = {
  // Short reactions
  "¡Muy bien!": "reaccion-muy-bien",
  "¡Intenta otra vez!": "reaccion-intenta-otra-vez",
  "¡Se acabó el tiempo!": "reaccion-se-acabo-tiempo",
  "¡Se escapó!": "reaccion-se-escapo",
  "¡Se escapo!": "reaccion-se-escapo",
  "¡Ese no! Fíjate bien": "reaccion-ese-no",
  "¡Busca bien!": "reaccion-busca-bien",
  "¡Qué linda historia!": "reaccion-que-linda-historia",
  "¡Esa no!": "reaccion-esa-no",
  "¡Sí!": "reaccion-si",
  "¡Eso!": "reaccion-eso",
  "¡Bravo!": "reaccion-bravo",
  "¡Genial!": "reaccion-genial",
  "¡Perfecto!": "reaccion-perfecto",
  "¡Excelente!": "reaccion-excelente",
  "¡Así es!": "reaccion-asi-es",
  "¡Correcto!": "reaccion-correcto",
  "¡Esa es!": "reaccion-esa-es",
  "¡Lo sabías!": "reaccion-lo-sabias",
  "¡Increíble!": "reaccion-increible",
  "¡Wow!": "reaccion-wow",

  // Session flow
  "Te voy a mostrar las palabras. Mira bien y escucha cómo se dicen.": "sesion-presentacion",
  "Ahora te voy a contar una historia con las palabras que aprendiste. ¡Escucha bien!": "sesion-historia-intro",
  "Ahora escucha otra historia que tiene TODAS las palabras que sabes.": "sesion-historia-review",
  "¿Te acuerdas de esta?": "sesion-review-acuerdas",
  "¡Mira esta!": "sesion-review-mira",
  "¡Y esta!": "sesion-review-y-esta",
  "¡La última!": "sesion-review-ultima",

  // Between presentations
  "Esas son nuestras 5 palabras de hoy. ¡Vamos a verlas otra vez!": "sesion-entre-01",
  "¡Genial! Ahora las veremos de nuevo. ¡Presta atención!": "sesion-entre-02",
  "¡Ya casi las sabes! Una última vez.": "sesion-entre-03",
  "¡Las conoces! Una vez más para que las recuerdes siempre.": "sesion-entre-04",
  "Ahora es tu turno. Cuando veas la palabra, dila en voz alta. ¡Tú puedes!": "sesion-entre-06",

  // Between repeats
  "¡Así se hace! Tu voz suena hermosa. ¡Sigamos!": "sesion-repeat-02",
  "¡Increíble! Ya casi terminamos. ¡Una más!": "sesion-repeat-04",

  // Farewell
  "Repite conmigo:": "sesion-repite-conmigo",

  // Reviews
  "¡Las recuerdas todas! ¡Qué memoria tan buena tienes!": "sesion-review-complete-01",
  "¡Increíble! ¡Las recordaste todas!": "sesion-review-complete-02",

  // Affirmations (session)
  "Yo soy inteligente y puedo aprender cualquier cosa": "afirmacion-sesion-01",
  "Cada día soy más fuerte y más capaz": "afirmacion-sesion-02",
  "Leer me abre puertas a mundos increíbles": "afirmacion-sesion-03",
  "Yo creo en mí y en lo que puedo hacer": "afirmacion-sesion-04",
  "Soy valiente porque aprendo cosas nuevas": "afirmacion-sesion-05",
  "Mi familia está orgullosa de mí": "afirmacion-sesion-06",

  // Affirmations (general)
  "Yo soy importante": "afirmacion-auto-01",
  "Yo amo quien soy": "afirmacion-auto-02",
  "Soy valioso": "afirmacion-auto-03",
  "Me quiero tal y como soy": "afirmacion-auto-04",
  "Yo soy único y especial": "afirmacion-auto-05",
  "No hay nadie como yo en el mundo": "afirmacion-auto-06",
  "Estoy orgulloso de ser yo": "afirmacion-auto-07",
  "Merezco amor y respeto": "afirmacion-auto-08",
  "Soy suficiente tal como soy": "afirmacion-auto-09",
  "Yo creo en mí": "afirmacion-conf-01",
  "Yo soy inteligente": "afirmacion-conf-02",
  "Soy capaz de aprender cosas nuevas": "afirmacion-conf-03",
  "Puedo hacerlo si lo intento": "afirmacion-conf-04",
  "Cada día aprendo algo nuevo": "afirmacion-conf-05",
  "Soy valiente": "afirmacion-conf-06",
  "Confío en mis habilidades": "afirmacion-conf-07",
  "Lo intento y lo logro": "afirmacion-conf-08",
  "Soy bueno resolviendo problemas": "afirmacion-conf-09",
  "Hay muchas personas que se preocupan por mí": "afirmacion-rel-01",
  "Soy querido por mi familia": "afirmacion-rel-02",
  "Mis amigos me aprecian": "afirmacion-rel-03",
  "Siempre puedo pedir ayuda": "afirmacion-rel-04",
  "Soy un buen amigo": "afirmacion-rel-05",
  "Trato a los demás con respeto": "afirmacion-rel-06",
  "Comparto con alegría": "afirmacion-rel-07",
  "Me encanta aprender a leer": "afirmacion-lect-01",
  "Cada palabra que leo me hace más fuerte": "afirmacion-lect-02",
  "Leer me abre puertas a nuevos mundos": "afirmacion-lect-03",
  "Disfruto practicar todos los días": "afirmacion-lect-04",
  "Cada intento me acerca más a mi meta": "afirmacion-lect-05",
  "Me siento orgulloso de mi progreso": "afirmacion-lect-06",
  "Aprender es divertido": "afirmacion-lect-07",
  "Soy un gran lector": "afirmacion-lect-08",
  "Los errores me ayudan a mejorar": "afirmacion-lect-09",

  // Multiplayer rules
  "Sofia dice una palabra y muestra 4 emojis. El jugador que toque el emoji correcto gana un punto.": "reglas-multijugador",
};

/** Find a matching MP3 for a text. Strips {name} placeholders before matching. */
function findMP3ForText(text: string): string | null {
  // Direct match
  const direct = PHRASE_TO_MP3[text];
  if (direct) return direct;

  // Strip name placeholders and try again
  const cleaned = text
    .replace(/,?\s*\{name\}/g, "")
    .replace(/\{name\},?\s*/g, "")
    .replace(/,?\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?=[\s!.,?]|$)/g, "") // strip proper names at end
    .trim();
  return PHRASE_TO_MP3[cleaned] ?? null;
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
  // Try explicit MP3 name first
  if (mp3Name && mp3Name.length > 0) {
    const played = await playMP3(mp3Name);
    if (played) return;
  }
  // Try auto-matching text to MP3
  const autoMp3 = findMP3ForText(text);
  if (autoMp3) {
    const played = await playMP3(autoMp3);
    if (played) return;
  }
  // Fallback to TTS
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
