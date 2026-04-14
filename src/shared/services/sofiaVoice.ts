// ─── Sofia Voice Service ────────────────────────────────────────────
//
// Priority: pre-recorded MP3 audio → Web Speech API fallback
// MP3 files live in /audio/sofia/
//
// Concurrency model — STRICTLY single-track:
//   Only one playback session can be active at a time. Each call to
//   speak() (or playMP3 / TTS) bumps a token; any in-flight callback
//   for an older token is ignored. Starting a new session also fully
//   stops the previous audio + cancels any TTS utterance.
//
// This is what eliminates the "two voices on top of each other" bug
// where an MP3 (Elena) and a TTS fallback (system man voice) would
// previously fire in parallel.

let _currentToken = 0;
// Single shared audio element. Reusing one element (instead of
// creating a new <audio> on every call) means stopping the previous
// playback is immediate — no stale element can leak out a few
// milliseconds of audio after the new clip has already started.
let _sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_sharedAudio) {
    _sharedAudio = new Audio();
    _sharedAudio.preload = "auto";
  }
  return _sharedAudio;
}

/** Forcefully stop everything currently playing. Resolves any in-flight
 *  promises immediately so awaiters never hang. */
function stopAll() {
  _currentToken++; // invalidate every in-flight callback
  const a = _sharedAudio;
  if (a) {
    try { a.onended = null; a.onerror = null; } catch {}
    try { a.volume = 0; } catch {} // silence immediately, even if pause() lags
    try { a.pause(); } catch {}
    try { a.currentTime = 0; } catch {}
    try { a.removeAttribute("src"); a.load(); } catch {}
  }
  if (typeof window !== "undefined" && typeof speechSynthesis !== "undefined") {
    try { speechSynthesis.cancel(); } catch {}
  }
}

function playMP3(filename: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  // New session — invalidate older callbacks and stop any playback
  stopAll();
  const myToken = ++_currentToken;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      // Stale callback (a newer playback session is now active)
      if (myToken !== _currentToken) return;
      settled = true;
      resolve(ok);
    };

    // Hard timeout — if nothing happens within 8s, give up
    const timer = setTimeout(() => finish(false), 8000);
    const wrap = (ok: boolean) => { clearTimeout(timer); finish(ok); };

    const url = `/audio/sofia/${filename}.mp3`;
    const audio = getSharedAudio();
    if (!audio) { wrap(false); return; }

    audio.volume = 1;
    audio.src = url;
    audio.onended = () => {
      if (myToken !== _currentToken) return;
      // Wait 300ms after the browser reports "ended" so the audio
      // pipeline fully flushes to the speakers. Without this, the
      // caller's next action (e.g. starting a new audio) can cut
      // the tail of the current clip.
      setTimeout(() => wrap(true), 300);
    };
    audio.onerror = () => { if (myToken === _currentToken) wrap(false); };

    try {
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => { if (myToken === _currentToken) wrap(false); });
      }
    } catch {
      wrap(false);
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

// ─── Speech emotion type (kept for the public API) ───────────────
// The actual playback is always an MP3, no TTS path remains.

export type SpeechEmotion = "normal" | "excited" | "gentle" | "encouraging";

// speakOneTTS used to call speechSynthesis.speak(), but the system
// Spanish voice is male on most platforms which collided with Sofia.
// We removed this code path entirely — see speak() below.

// speakWithTTS removed: every call to speak() now plays an MP3 or
// stays silent. There is no longer any fallback that could trigger
// the browser's default Spanish (male) voice.

// ─── Unified speak: MP3 only, no TTS fallback ────────────────────
//
// IMPORTANT: We deliberately do NOT fall back to the browser
// SpeechSynthesis API. The default Spanish voice on most systems is
// male, which contradicts Sofia's character and produced "the man
// speaking on top of Elena" reports. If a phrase has no MP3 we
// stay silent — better silent than wrong voice.

async function speak(mp3Name: string | null, text: string, _emotion: SpeechEmotion): Promise<void> {
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
  // No MP3 available — stay silent (intentionally no TTS fallback)
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
  stopAll();
  _speaking = false;
}

export function isSpeaking(): boolean {
  return _speaking;
}

export function isVoiceReady(): boolean {
  // Always ready: MP3 playback only depends on the network.
  return true;
}
