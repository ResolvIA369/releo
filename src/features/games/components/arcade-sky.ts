import type { Container, Graphics } from "pixi.js";

// Cielo con parallax y progresión de clima, reutilizable por cualquier
// juego arcade con PixiJS (Leo Vuela lo usa hoy; Leo Corre y Salta la
// Palabra podrían sumarlo después con el mismo bounds {W,H,groundY}).
// Ver docs/RELEO-JUEGOS-V2.md §7 y §10.
//
// El "viaje" del niño en una partida: día claro → atardecer → noche
// estrellada, mapeado 1:1 a los 3 niveles reales del juego (no se
// inventa una progresión mas larga que la que existe de verdad).

export type SkyMood = "dia" | "atardecer" | "noche";

export function moodForLevel(levelIdx: number): SkyMood {
  if (levelIdx <= 0) return "dia";
  if (levelIdx === 1) return "atardecer";
  return "noche";
}

interface SkyPalette {
  bg: number;
  cloudColor: number;
  cloudAlpha: number;
  groundColor: string;
  groundEdgeColor: string;
  sunMoonColor: number;
  showStars: boolean;
}

const PALETTES: Record<SkyMood, SkyPalette> = {
  dia: { bg: 0xdbeafe, cloudColor: 0xffffff, cloudAlpha: 0.6, groundColor: "#a8d5b0", groundEdgeColor: "#8bc49a", sunMoonColor: 0xfff176, showStars: false },
  atardecer: { bg: 0xfcd9b8, cloudColor: 0xfff0e0, cloudAlpha: 0.6, groundColor: "#c9a15a", groundEdgeColor: "#b0863f", sunMoonColor: 0xffb74d, showStars: false },
  noche: { bg: 0x24305c, cloudColor: 0x4b5688, cloudAlpha: 0.55, groundColor: "#33425a", groundEdgeColor: "#283549", sunMoonColor: 0xf5f5f0, showStars: true },
};

const STAR_POSITIONS: Array<[number, number]> = [
  [60, 40], [140, 80], [220, 30], [300, 70], [380, 45], [460, 90], [520, 35], [590, 65],
];

type PixiModule = typeof import("pixi.js");

interface ParallaxCloud {
  g: Graphics;
  speed: number;
}

export class ArcadeSky {
  readonly farLayer: Container;
  readonly nearLayer: Container;
  private skyGfx: Graphics;
  private starsGfx: Graphics;
  private groundGfx: Graphics;
  private mood: SkyMood | null = null;
  private farClouds: ParallaxCloud[] = [];
  private nearClouds: ParallaxCloud[] = [];

  constructor(
    private PIXI: PixiModule,
    stage: Container,
    private bounds: { W: number; H: number; groundY: number },
  ) {
    this.skyGfx = new PIXI.Graphics();
    this.starsGfx = new PIXI.Graphics();
    this.farLayer = new PIXI.Container();
    this.nearLayer = new PIXI.Container();
    this.groundGfx = new PIXI.Graphics();

    stage.addChild(this.skyGfx);
    stage.addChild(this.starsGfx);
    stage.addChild(this.farLayer);
    stage.addChild(this.nearLayer);
    stage.addChild(this.groundGfx);

    this.buildClouds();
    this.setMood("dia");
  }

  private buildClouds(): void {
    const { W } = this.bounds;
    for (let i = 0; i < 3; i++) {
      const g = new this.PIXI.Graphics();
      g.x = (W / 3) * i + Math.random() * 70;
      g.y = 44 + Math.random() * 70;
      this.farLayer.addChild(g);
      this.farClouds.push({ g, speed: 0.08 + Math.random() * 0.05 });
    }
    for (let i = 0; i < 3; i++) {
      const g = new this.PIXI.Graphics();
      g.x = (W / 3) * i + Math.random() * 70 + 40;
      g.y = 90 + Math.random() * 80;
      this.nearLayer.addChild(g);
      this.nearClouds.push({ g, speed: 0.2 + Math.random() * 0.1 });
    }
  }

  private redrawCloud(g: Graphics, scale: number, palette: SkyPalette): void {
    g.clear();
    g.ellipse(0, 0, 44 * scale, 16 * scale).fill({ color: palette.cloudColor, alpha: palette.cloudAlpha });
    g.ellipse(22 * scale, -9 * scale, 28 * scale, 13 * scale).fill({ color: palette.cloudColor, alpha: palette.cloudAlpha });
  }

  setMood(mood: SkyMood): void {
    if (this.mood === mood) return;
    this.mood = mood;
    const p = PALETTES[mood];
    const { W, H, groundY } = this.bounds;

    this.skyGfx.clear();
    this.skyGfx.rect(0, 0, W, H).fill(p.bg);
    this.skyGfx.circle(W - 76, 58, 28).fill({ color: p.sunMoonColor, alpha: 0.9 });

    this.starsGfx.clear();
    if (p.showStars) {
      for (const [x, y] of STAR_POSITIONS) {
        this.starsGfx.circle(x, y, 1.6).fill({ color: 0xffffff, alpha: 0.85 });
      }
    }

    this.groundGfx.clear();
    this.groundGfx.rect(0, groundY, W, H - groundY).fill(p.groundColor);
    this.groundGfx.rect(0, groundY, W, 6).fill(p.groundEdgeColor);

    for (const c of this.farClouds) this.redrawCloud(c.g, 0.7, p);
    for (const c of this.nearClouds) this.redrawCloud(c.g, 1.05, p);
  }

  /** Drift parallax — dos capas a velocidad distinta, se reciclan al salir. */
  update(dt: number): void {
    const { W } = this.bounds;
    for (const c of this.farClouds) {
      c.g.x -= c.speed * dt;
      if (c.g.x < -80) c.g.x = W + 80;
    }
    for (const c of this.nearClouds) {
      c.g.x -= c.speed * dt;
      if (c.g.x < -80) c.g.x = W + 80;
    }
  }

  destroy(): void {
    this.skyGfx.destroy();
    this.starsGfx.destroy();
    this.groundGfx.destroy();
    this.farLayer.destroy({ children: true });
    this.nearLayer.destroy({ children: true });
  }
}
