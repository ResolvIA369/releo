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
  //
  // B5 (QA sep-2026, "la musica no suena nunca"): esto antes esperaba
  // Promise.all de los 3 loops completos (~2.5-3MB, ~230s cada uno,
  // ~8MB en total) ANTES de reproducir el primer sonido. En localhost
  // eso es instantaneo y no se nota; contra la red real (probado en
  // produccion, 2.5MB tardaron ~8s a velocidad de conexion normal) el
  // primer sonido podia demorar mas que toda una sesion corta de
  // juego — y como `starting` bloquea llamadas repetidas, ningun toque
  // posterior lo destrababa antes. Ahora solo el loop del nivel de
  // arranque bloquea el primer sonido; los demas se cargan en segundo
  // plano para cuando `setLevel` los necesite.
  //
  // B6 (QA sep-2026, "en modo demo/grabacion sigue sin haber musica"):
  // `ctx.resume()` sin gesto de verdad (el autoplay de demo dispara
  // `.click()` desde JS, que el browser NO cuenta como gesto real) se
  // queda colgado para siempre — nunca resuelve, nunca rechaza. Antes
  // esto estaba con `await` bloqueando TODO lo de abajo, incluida la
  // llamada a `recAudio()` en `playTrack` de la que depende el pipeline
  // de grabacion (arma el audio del video a partir de esos eventos, no
  // de captura en vivo — ver recorder.ts). Construir el grafo (fetch,
  // decode, connect, start) no requiere que el contexto este "running":
  // solo la salida audible real lo requiere. Separar el resume del
  // resto deja el log de grabacion funcionando SIEMPRE, y el sonido
  // real se escucha apenas el browser efectivamente destrabe el
  // contexto (gesto real u otro mecanismo del browser).
  async ensureStarted(level: number): Promise<void> {
    if (this.started || this.starting || this.disposed) return;
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    this.starting = true;
    try {
      const ctx = new AudioContext();
      void ctx.resume();
      if (this.disposed) {
        ctx.close();
        return;
      }
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = dbToGain(this.baseDb);
      this.master.connect(ctx.destination);

      this.buffers = this.tracks.map(() => null);
      const idx = Math.min(level, this.tracks.length - 1);
      this.buffers[idx] = await this.loadTrack(ctx, idx);
      if (this.disposed) return;

      this.level = level;
      this.current = this.playTrack(level, 1);
      this.started = true;

      this.tracks.forEach((_track, i) => {
        if (i === idx) return;
        void this.loadTrack(ctx, i).then((buf) => {
          if (!this.disposed) this.buffers[i] = buf;
        });
      });
    } catch {
      // Audio bloqueado o sin soporte: el juego sigue sin musica
    } finally {
      this.starting = false;
    }
  }

  private async loadTrack(ctx: AudioContext, idx: number): Promise<AudioBuffer | null> {
    try {
      const res = await fetch(this.tracks[idx]);
      if (!res.ok) return null;
      return await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      return null;
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
