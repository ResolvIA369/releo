import type { Container, Text } from "pixi.js";

// Efecto reutilizable de "la palabra provoca algo en el mundo": tras un
// acierto, el ícono de la palabra (getConsequenceEmoji) vuela desde el
// punto de captura hasta un ancla fija (el Libro Mágico) y desaparece.
// Pensado para cualquier juego Pixi (Leo Vuela hoy; Leo Corre y Salta
// la Palabra podrían sumarlo después sin duplicar esta lógica) — ver
// docs/RELEO-JUEGOS-V2.md §8 y §10.
//
// Nunca se dispara antes de un acierto: quien lo llama decide cuándo.

type PixiModule = typeof import("pixi.js");

interface ActiveFx {
  node: Text;
  t: number; // 0 → 1
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const DURATION_FRAMES = 42; // ~0.7s a 60fps

export class WordConsequenceFx {
  private active: ActiveFx[] = [];

  constructor(
    private PIXI: PixiModule,
    private layer: Container,
  ) {}

  spawn(emoji: string, from: { x: number; y: number }, to: { x: number; y: number }, fontSize = 34): void {
    const node = new this.PIXI.Text({ text: emoji, style: { fontSize } });
    node.anchor.set(0.5);
    node.x = from.x;
    node.y = from.y;
    node.scale.set(0.4);
    this.layer.addChild(node);
    this.active.push({ node, t: 0, from: { ...from }, to: { ...to } });
  }

  /** Un paso de animación. Llamar desde el ticker del juego. */
  update(dt: number): void {
    if (this.active.length === 0) return;
    this.active = this.active.filter((fx) => {
      fx.t = Math.min(1, fx.t + dt / DURATION_FRAMES);
      const q = fx.t;
      // Arco simple: sube y luego cae hacia el ancla, con un pop inicial.
      const ease = 1 - Math.pow(1 - q, 3);
      fx.node.x = fx.from.x + (fx.to.x - fx.from.x) * ease;
      fx.node.y = fx.from.y + (fx.to.y - fx.from.y) * ease - Math.sin(q * Math.PI) * 36;
      const scale = q < 0.25 ? 0.4 + (q / 0.25) * 0.9 : 1.3 - ((q - 0.25) / 0.75) * 1.1;
      fx.node.scale.set(Math.max(0.1, scale));
      fx.node.alpha = q > 0.7 ? 1 - (q - 0.7) / 0.3 : 1;
      if (q >= 1) {
        fx.node.destroy();
        return false;
      }
      return true;
    });
  }

  reset(): void {
    for (const fx of this.active) fx.node.destroy();
    this.active = [];
  }
}
