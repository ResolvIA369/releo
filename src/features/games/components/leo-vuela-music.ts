import type { LeoVuelaMusicPalette } from "../config/leo-vuela";

// Musica tribal/de selva para Leo Vuela (Tone.js, sin assets): tambores
// de mano sintetizados — membrana grave estilo djembe + toms medios a
// distintas alturas — con un patron sincopado (sin backbeat) y un
// sonajero opcional de ruido filtrado. El import de tone es dinamico
// (no entra al bundle principal) y el audio solo arranca tras un gesto
// del usuario (Tone.start lo exige).

type ToneModule = typeof import("tone");

// Patron de 16 semicorcheas, sincopado (feel 3-3-2): el grave marca la
// base y los toms responden a contratiempo. Sin redoblante en 2 y 4.
const LOW_STEPS = [0, 7, 10];
const MID_STEPS = [3, 5, 12, 14];

export class LeoVuelaMusic {
  private tone: ToneModule | null = null;
  private vol: import("tone").Volume | null = null;
  private seq: import("tone").Sequence<number> | null = null;
  private lowDrum: import("tone").MembraneSynth | null = null;
  private midDrum: import("tone").MembraneSynth | null = null;
  private shaker: import("tone").NoiseSynth | null = null;
  private shakerFilter: import("tone").Filter | null = null;
  private started = false;
  private starting = false;
  private disposed = false;

  constructor(
    private baseDb: number, // volumen base (bajo)
    private duckDb: number, // aun mas bajo mientras Sofia habla
    private palette: LeoVuelaMusicPalette,
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

      // Tambor base: membrana grave con caida de tono larga (djembe)
      this.lowDrum = new Tone.MembraneSynth({
        pitchDecay: 0.09,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.5, sustain: 0 },
        volume: -2,
      }).connect(this.vol);

      // Toms medios: membrana mas seca, rota por las alturas de la paleta
      this.midDrum = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 2.5,
        envelope: { attack: 0.001, decay: 0.22, sustain: 0 },
        volume: -6,
      }).connect(this.vol);

      // Sonajero: ruido blanco por un pasa-banda agudo
      if (this.palette.shaker) {
        this.shakerFilter = new Tone.Filter({ frequency: 5200, type: "bandpass", Q: 1.2 }).connect(this.vol);
        this.shaker = new Tone.NoiseSynth({
          envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
          volume: -16,
        }).connect(this.shakerFilter);
      }

      const transport = Tone.getTransport();
      transport.bpm.value = bpm;

      const [lowNote, ...midNotes] = this.palette.drumNotes;
      this.seq = new Tone.Sequence(
        (time, step) => {
          if (LOW_STEPS.includes(step)) {
            this.lowDrum?.triggerAttackRelease(lowNote ?? "C2", "8n", time, step === 0 ? 1 : 0.8);
          }
          const midIdx = MID_STEPS.indexOf(step);
          if (midIdx >= 0 && midNotes.length > 0) {
            const note = midNotes[midIdx % midNotes.length];
            this.midDrum?.triggerAttackRelease(note, "16n", time, 0.75);
          }
          if (this.shaker && step % 2 === 0) {
            // Acento leve cada negra para que "camine"
            this.shaker.triggerAttackRelease("32n", time, step % 4 === 0 ? 0.5 : 0.25);
          }
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
    this.lowDrum?.dispose();
    this.midDrum?.dispose();
    this.shaker?.dispose();
    this.shakerFilter?.dispose();
    this.vol?.dispose();
    this.seq = null;
    this.lowDrum = null;
    this.midDrum = null;
    this.shaker = null;
    this.shakerFilter = null;
    this.vol = null;
    this.started = false;
  }
}
