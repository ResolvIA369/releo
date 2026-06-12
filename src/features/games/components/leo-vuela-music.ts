// Musica de percusion sintetizada para Leo Vuela (Tone.js, sin assets).
// Loop de bombo/redoblante/hi-hat cuyo tempo sube con el nivel. El
// import de tone es dinamico (no entra al bundle principal) y el audio
// solo arranca tras un gesto del usuario (Tone.start lo exige).

type ToneModule = typeof import("tone");

export class LeoVuelaMusic {
  private tone: ToneModule | null = null;
  private vol: import("tone").Volume | null = null;
  private seq: import("tone").Sequence<number> | null = null;
  private kick: import("tone").MembraneSynth | null = null;
  private snare: import("tone").NoiseSynth | null = null;
  private hat: import("tone").NoiseSynth | null = null;
  private started = false;
  private starting = false;
  private disposed = false;

  constructor(
    private baseDb: number, // volumen base (bajo)
    private duckDb: number, // aun mas bajo mientras Sofia habla
  ) {}

  // Llamar SIEMPRE desde un handler de gesto (tap/tecla): ahi el
  // navegador permite crear/destrabar el AudioContext.
  async ensureStarted(bpm: number): Promise<void> {
    if (this.started || this.starting || this.disposed) return;
    this.starting = true;
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (this.disposed) return;
      this.tone = Tone;

      this.vol = new Tone.Volume(this.baseDb).toDestination();
      this.kick = new Tone.MembraneSynth({ volume: -4 }).connect(this.vol);
      this.snare = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
        volume: -8,
      }).connect(this.vol);
      this.hat = new Tone.NoiseSynth({
        envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
        volume: -16,
      }).connect(this.vol);

      const transport = Tone.getTransport();
      transport.bpm.value = bpm;
      // Compas de 16 semicorcheas: bombo en 1 y 3, redoblante en 2 y 4,
      // hi-hat en corcheas
      this.seq = new Tone.Sequence(
        (time, step) => {
          if (step % 8 === 0) this.kick?.triggerAttackRelease("C2", "8n", time);
          if (step % 8 === 4) this.snare?.triggerAttackRelease("16n", time);
          if (step % 2 === 0) this.hat?.triggerAttackRelease("32n", time);
        },
        Array.from({ length: 16 }, (_, i) => i),
        "16n",
      ).start(0);
      transport.start();
      this.started = true;
    } catch {
      // Audio bloqueado o sin soporte: el juego sigue sin musica
    } finally {
      this.starting = false;
    }
  }

  setBpm(bpm: number): void {
    if (this.started && this.tone) this.tone.getTransport().bpm.rampTo(bpm, 1.5);
  }

  // Agacha la musica mientras Sofia habla para no tapar la palabra
  duck(on: boolean): void {
    this.vol?.volume.rampTo(on ? this.duckDb : this.baseDb, 0.15);
  }

  pause(): void {
    if (this.started) this.tone?.getTransport().pause();
  }

  resume(): void {
    if (this.started) this.tone?.getTransport().start();
  }

  dispose(): void {
    this.disposed = true;
    if (this.tone) {
      const transport = this.tone.getTransport();
      transport.stop();
      transport.cancel();
    }
    this.seq?.dispose();
    this.kick?.dispose();
    this.snare?.dispose();
    this.hat?.dispose();
    this.vol?.dispose();
    this.seq = null;
    this.kick = null;
    this.snare = null;
    this.hat = null;
    this.vol = null;
    this.started = false;
  }
}
