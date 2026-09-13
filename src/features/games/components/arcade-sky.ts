import type { Container, Graphics, Sprite } from "pixi.js";
import { drawBird, spawnRoll } from "./arcade-obstacles";

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
  // Tint/alpha para la capa de paisaje opcional (ver loadLandscape) —
  // un solo PNG por mundo, "iluminado" distinto por mood en vez de
  // pedir 3 versiones del mismo asset.
  landscapeTint: number;
  landscapeAlpha: number;
}

const PALETTES: Record<SkyMood, SkyPalette> = {
  dia: { bg: 0xdbeafe, cloudColor: 0xffffff, cloudAlpha: 0.6, groundColor: "#a8d5b0", groundEdgeColor: "#8bc49a", sunMoonColor: 0xfff176, showStars: false, landscapeTint: 0xffffff, landscapeAlpha: 1 },
  atardecer: { bg: 0xfcd9b8, cloudColor: 0xfff0e0, cloudAlpha: 0.6, groundColor: "#c9a15a", groundEdgeColor: "#b0863f", sunMoonColor: 0xffb74d, showStars: false, landscapeTint: 0xffd9a8, landscapeAlpha: 1 },
  noche: { bg: 0x24305c, cloudColor: 0x4b5688, cloudAlpha: 0.55, groundColor: "#33425a", groundEdgeColor: "#283549", sunMoonColor: 0xf5f5f0, showStars: true, landscapeTint: 0x7783b8, landscapeAlpha: 0.92 },
};

const STAR_POSITIONS: Array<[number, number]> = [
  [60, 40], [140, 80], [220, 30], [300, 70], [380, 45], [460, 90], [520, 35], [590, 65],
];

type PixiModule = typeof import("pixi.js");

interface ParallaxCloud {
  g: Graphics;
  speed: number;
  baseY: number;
  phase: number; // desfasa el bob vertical entre nubes
}

interface AmbientBird {
  node: Container;
  wing: Graphics;
  vx: number;
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
  // Variedad puramente ambiental (sin significado pedagogico, no choca
  // ni afecta energia): rompe la monotonia de tramos largos sin nubes-
  // objetivo nuevas. Ver docs/RELEO-JUEGOS-V2.md §15.
  private ambientBirds: AmbientBird[] = [];
  private gustFrames = 0;
  private time = 0;
  // Capa de paisaje por mundo (opcional) — ver loadLandscape() y
  // docs/RELEO-JUEGOS-V2.md §16. null mientras no hay asset o no cargó.
  private landscapeSprite: Sprite | null = null;
  private destroyed = false;

  constructor(
    private PIXI: PixiModule,
    private stage: Container,
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
      this.farClouds.push({ g, speed: 0.08 + Math.random() * 0.05, baseY: g.y, phase: Math.random() * 10 });
    }
    for (let i = 0; i < 3; i++) {
      const g = new this.PIXI.Graphics();
      g.x = (W / 3) * i + Math.random() * 70 + 40;
      g.y = 90 + Math.random() * 80;
      this.nearLayer.addChild(g);
      this.nearClouds.push({ g, speed: 0.2 + Math.random() * 0.1, baseY: g.y, phase: Math.random() * 10 });
    }
  }

  // Bandada decorativa muy de fondo: nunca colisiona (vive en farLayer,
  // fuera del layer de obstaculos) y es discreta a proposito — silueta
  // chica y semitransparente — para no confundirse con los pajaros que
  // SI empujan a Leo.
  private maybeSpawnAmbientBird(dt: number): void {
    if (this.ambientBirds.length >= 2 || !spawnRoll(2.5, dt)) return;
    const { node, wing } = drawBird(this.PIXI);
    node.scale.set(0.5);
    node.alpha = 0.4;
    node.x = this.bounds.W + 30;
    node.y = 26 + Math.random() * 46;
    this.farLayer.addChild(node);
    this.ambientBirds.push({ node, wing, vx: 0.9 + Math.random() * 0.4 });
  }

  // Rafaga de viento: acelera brevemente el parallax. Puramente visual
  // (no toca energia ni pilotaje) — un "algo paso" cada tanto.
  private maybeTriggerGust(dt: number): void {
    if (this.gustFrames <= 0 && spawnRoll(2, dt)) this.gustFrames = 90; // ~1.5s a 60fps
    if (this.gustFrames > 0) this.gustFrames -= dt;
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

    if (this.landscapeSprite) {
      this.landscapeSprite.tint = p.landscapeTint;
      this.landscapeSprite.alpha = p.landscapeAlpha;
    }
  }

  /**
   * Capa de paisaje opcional (isla, bahía, valle, montaña — un PNG por
   * mundo, ver world-backgrounds.ts). Un solo asset sirve para los 3
   * moods: se "ilumina" distinto con tint/alpha en vez de pedir 3
   * versiones de la imagen. Se agrega DESPUÉS del groundGfx (encima del
   * piso liso, que sigue existiendo como base) y ANTES que las capas de
   * juego (nubes-palabra, obstáculos, Leo), que LeoVuela agrega al
   * stage recién después de construir ArcadeSky — así el paisaje queda
   * siempre detrás de todo lo jugable sin tener que ordenar z-index a mano.
   *
   * Si el PNG todavía no existe (mundo sin asset producido aún) o falla
   * la carga, no pasa nada: el cielo procedural sigue exactamente igual.
   */
  async loadLandscape(url: string): Promise<void> {
    try {
      const texture = await this.PIXI.Assets.load(url);
      if (this.destroyed) return;
      const sprite = new this.PIXI.Sprite(texture);
      // El asset se produce a 2x (1280x840) con el mismo aspect ratio
      // que el canvas lógico (640x420) para que este escalado sea 1:1,
      // sin recortar ni distorsionar la composición.
      sprite.x = 0;
      sprite.y = 0;
      sprite.width = this.bounds.W;
      sprite.height = this.bounds.H;
      this.stage.addChild(sprite);
      this.landscapeSprite = sprite;
      if (this.mood) {
        const p = PALETTES[this.mood];
        sprite.tint = p.landscapeTint;
        sprite.alpha = p.landscapeAlpha;
      }
    } catch {
      // Sin asset todavía, o 404/red — cielo procedural sin cambios.
    }
  }

  /**
   * Drift parallax — dos capas a velocidad distinta, se reciclan al
   * salir — mas un bob vertical sutil (vida constante y gratis) y dos
   * eventos ambientales de baja frecuencia (rafaga de viento, bandada
   * de fondo) para romper tramos largos sin variacion. Nada de esto
   * da ni quita pistas sobre la palabra objetivo.
   */
  update(dt: number): void {
    const { W } = this.bounds;
    this.time += dt;
    this.maybeTriggerGust(dt);
    const gustMul = this.gustFrames > 0 ? 2.2 : 1;

    for (const c of this.farClouds) {
      c.g.x -= c.speed * gustMul * dt;
      c.g.y = c.baseY + Math.sin((this.time + c.phase) * 0.02) * 3;
      if (c.g.x < -80) c.g.x = W + 80;
    }
    for (const c of this.nearClouds) {
      c.g.x -= c.speed * gustMul * dt;
      c.g.y = c.baseY + Math.sin((this.time + c.phase) * 0.025) * 4;
      if (c.g.x < -80) c.g.x = W + 80;
    }

    this.maybeSpawnAmbientBird(dt);
    this.ambientBirds = this.ambientBirds.filter((b) => {
      b.node.x -= b.vx * gustMul * dt;
      b.wing.rotation = Math.sin(b.node.x * 0.15) * 0.7;
      if (b.node.x < -60) {
        b.node.destroy({ children: true });
        return false;
      }
      return true;
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.skyGfx.destroy();
    this.starsGfx.destroy();
    this.groundGfx.destroy();
    this.farLayer.destroy({ children: true });
    this.nearLayer.destroy({ children: true });
    this.landscapeSprite?.destroy();
    this.landscapeSprite = null;
    for (const b of this.ambientBirds) b.node.destroy({ children: true });
    this.ambientBirds = [];
  }
}
