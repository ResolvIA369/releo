// Musica de los juegos arcade: un loop real por nivel (public/audio/music/),
// generados desde el tema fuente con ffmpeg (atempo = velocidad sin
// cambiar el tono). Reproductor Web Audio con crossfade al cambiar de
// nivel. El volumen base es BIEN bajo para que la voz se escuche
// siempre clara, y se agacha mas mientras Sofia habla (ducking). El
// audio recien arranca tras un gesto del usuario (politica del browser).

import { recAudio } from "@/shared/utils/recorder";

const CROSSFADE_SEC = 1.4;
const DUCK_RAMP_SEC = 0.12;

function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

interface ActiveTrack {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class ArcadeMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null; // volumen base + ducking
  private buffers: (AudioBuffer | null)[] = [];
  private current: ActiveTrack | null = null;
  private level = 0;
  private started = false;
  private starting = false;
  private disposed = false;

  constructor(
    private baseDb: number,
    private duckDb: number,
    private tracks: string[],
  ) {}

  // Llamar SIEMPRE desde un handler de gesto (tap/tecla): ahi el
  // navegador permite crear/destrabar el AudioContext.
  async ensureStarted(level: number): Promise<void> {
    if (this.started || this.starting || this.disposed) return;
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    this.starting = true;
    try {
      const ctx = new AudioContext();
      await ctx.resume();
      if (this.disposed) {
        ctx.close();
        return;
      }
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = dbToGain(this.baseDb);
      this.master.connect(ctx.destination);

      this.buffers = await Promise.all(
        this.tracks.map(async (url) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return await ctx.decodeAudioData(await res.arrayBuffer());
          } catch {
            return null;
          }
        }),
      );
      if (this.disposed) return;

      this.level = level;
      this.current = this.playTrack(level, 1);
      this.started = true;
    } catch {
      // Audio bloqueado o sin soporte: el juego sigue sin musica
    } finally {
      this.starting = false;
    }
  }

  private playTrack(level: number, initialGain: number): ActiveTrack | null {
    const ctx = this.ctx;
    const master = this.master;
    const idx = Math.min(level, this.buffers.length - 1);
    const buffer = this.buffers[idx];
    if (!ctx || !master || !buffer) return null;
    // La música va por Web Audio, no por <audio>, así que no la ve el hook de
    // recAudio en sofiaVoice: hay que anotarla acá o el video sale sin fondo.
    recAudio(this.tracks[idx], "musica");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = initialGain;
    source.connect(gain);
    gain.connect(master);
    source.start();
    return { source, gain };
  }

  // Cambio de nivel → crossfade entre el loop actual y el del nivel nuevo
  setLevel(level: number): void {
    if (!this.started || this.disposed || level === this.level) return;
    this.level = level;
    const ctx = this.ctx;
    if (!ctx) return;

    const old = this.current;
    const next = this.playTrack(level, 0);
    const now = ctx.currentTime;
    if (next) {
      next.gain.gain.setValueAtTime(0, now);
      next.gain.gain.linearRampToValueAtTime(1, now + CROSSFADE_SEC);
    }
    if (old) {
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_SEC);
      const oldSource = old.source;
      setTimeout(() => {
        try { oldSource.stop(); oldSource.disconnect(); } catch { /* ya parado */ }
      }, CROSSFADE_SEC * 1000 + 100);
    }
    this.current = next ?? old;
  }

  // Agacha la musica mientras Sofia habla para no tapar la palabra
  duck(on: boolean): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(dbToGain(on ? this.duckDb : this.baseDb), ctx.currentTime, DUCK_RAMP_SEC);
  }

  pause(): void {
    if (this.started && this.ctx?.state === "running") void this.ctx.suspend();
  }

  resume(): void {
    if (this.started && this.ctx?.state === "suspended") void this.ctx.resume();
  }

  dispose(): void {
    this.disposed = true;
    try { this.current?.source.stop(); } catch { /* ya parado */ }
    this.current = null;
    this.buffers = [];
    if (this.ctx && this.ctx.state !== "closed") void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.started = false;
  }
}
