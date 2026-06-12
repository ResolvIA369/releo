import type { Container, Graphics, Text } from "pixi.js";
import type { LeoVuelaLevel } from "../config/leo-vuela";

// Obstaculos de Leo Vuela: pajaros que cruzan, relampagos que caen y
// rafagas de lluvia que empujan hacia abajo. Solo agregan dificultad
// de pilotaje (empujones) — la lectura es lo unico que da puntos, asi
// que aca no se toca energia ni score.

type PixiModule = typeof import("pixi.js");

interface Bird {
  node: Text;
  vx: number;
  baseY: number;
  hit: boolean;
}

interface Bolt {
  node: Text;
  vy: number;
  hit: boolean;
}

interface Drop {
  node: Text;
  vy: number;
}

interface FloorCloud {
  node: Graphics;
  vx: number;
  hit: boolean;
}

export interface ObstacleFrame {
  // Empuje vertical para Leo (px/frame): positivo = hacia abajo
  // (pajaros, rayos), negativo = hacia arriba (nubes rasantes)
  knock: number;
  gravityMul: number; // 1 normal; >1 mientras llueve
}

// Tirada de spawn por frame (60fps): ratePerMin eventos por minuto.
// Pura e inyectable para poder testearla.
export function spawnRoll(ratePerMin: number, dt: number, rng: () => number = Math.random): boolean {
  if (ratePerMin <= 0) return false;
  return rng() < (ratePerMin * dt) / 3600;
}

const BIRD_KNOCK = 2.4;
const BOLT_KNOCK = 3.2;
const FLOOR_CLOUD_KNOCK = -2.8; // hacia arriba: no se puede volar rasante
const RAIN_GRAVITY_MUL = 1.6;
const RAIN_DURATION_FRAMES = 4 * 60;
const HIT_RADIUS_X = 42;
const HIT_RADIUS_Y = 38;

export class LeoVuelaObstacles {
  private birds: Bird[] = [];
  private bolts: Bolt[] = [];
  private drops: Drop[] = [];
  private floorClouds: FloorCloud[] = [];
  private rainFrames = 0;

  constructor(
    private PIXI: PixiModule,
    private layer: Container,
    private bounds: { W: number; H: number; groundY: number },
  ) {}

  private makeText(text: string, size: number): Text {
    return new this.PIXI.Text({ text, style: { fontSize: size } });
  }

  // Un paso de simulacion. Devuelve el efecto sobre Leo este frame.
  update(dt: number, level: LeoVuelaLevel, leo: { x: number; y: number }): ObstacleFrame {
    const { W, groundY } = this.bounds;
    let knock = 0;

    // ── Pajaros: cruzan de derecha a izquierda, mas rapidos que las nubes ──
    if (spawnRoll(level.birdsPerMin, dt)) {
      const node = this.makeText("🐦", 34);
      node.anchor.set(0.5);
      node.scale.x = -1; // mirando hacia donde vuela
      node.x = W + 30;
      node.y = 90 + Math.random() * (groundY - 180);
      this.layer.addChild(node);
      this.birds.push({ node, vx: 2.6 + Math.random() * 1.2, baseY: node.y, hit: false });
    }
    this.birds = this.birds.filter((b) => {
      b.node.x -= b.vx * dt;
      b.node.y = b.baseY + Math.sin(b.node.x * 0.04) * 10;
      if (!b.hit && Math.abs(b.node.x - leo.x) < HIT_RADIUS_X && Math.abs(b.node.y - leo.y) < HIT_RADIUS_Y) {
        b.hit = true;
        b.node.alpha = 0.5;
        knock = Math.max(knock, BIRD_KNOCK);
      }
      if (b.node.x < -40) {
        b.node.destroy();
        return false;
      }
      return true;
    });

    // ── Relampagos: caen rapido en vertical ──
    if (spawnRoll(level.boltsPerMin, dt)) {
      const node = this.makeText("⚡", 38);
      node.anchor.set(0.5);
      node.x = 60 + Math.random() * (W - 120);
      node.y = -20;
      this.layer.addChild(node);
      this.bolts.push({ node, vy: 6 + Math.random() * 2, hit: false });
    }
    this.bolts = this.bolts.filter((bolt) => {
      bolt.node.y += bolt.vy * dt;
      if (!bolt.hit && Math.abs(bolt.node.x - leo.x) < HIT_RADIUS_X && Math.abs(bolt.node.y - leo.y) < HIT_RADIUS_Y) {
        bolt.hit = true;
        bolt.node.alpha = 0.5;
        knock = Math.max(knock, BOLT_KNOCK);
      }
      if (bolt.node.y > groundY + 10) {
        bolt.node.destroy();
        return false;
      }
      return true;
    });

    // ── Nubes grises rasantes: cruzan el "piso" y empujan hacia arriba ──
    if (spawnRoll(level.floorCloudsPerMin, dt)) {
      const node = new this.PIXI.Graphics();
      const s = 0.8 + Math.random() * 0.5;
      node.ellipse(0, 0, 42 * s, 16 * s).fill({ color: 0x9e9e9e, alpha: 0.9 });
      node.ellipse(-18 * s, -8 * s, 22 * s, 12 * s).fill({ color: 0xb0b0b0, alpha: 0.9 });
      node.ellipse(16 * s, -7 * s, 26 * s, 13 * s).fill({ color: 0xa8a8a8, alpha: 0.9 });
      node.x = W + 60;
      node.y = groundY - 18 - Math.random() * 26;
      this.layer.addChild(node);
      this.floorClouds.push({ node, vx: 2.0 + Math.random() * 1.0, hit: false });
    }
    this.floorClouds = this.floorClouds.filter((fc) => {
      fc.node.x -= fc.vx * dt;
      if (!fc.hit && Math.abs(fc.node.x - leo.x) < HIT_RADIUS_X + 10 && Math.abs(fc.node.y - leo.y) < HIT_RADIUS_Y) {
        fc.hit = true;
        fc.node.alpha = 0.55;
        knock = knock === 0 ? FLOOR_CLOUD_KNOCK : knock;
      }
      if (fc.node.x < -80) {
        fc.node.destroy();
        return false;
      }
      return true;
    });

    // ── Lluvia: rafaga que empuja a Leo hacia abajo un rato ──
    if (this.rainFrames <= 0 && spawnRoll(level.rainPerMin, dt)) {
      this.rainFrames = RAIN_DURATION_FRAMES;
    }
    if (this.rainFrames > 0) {
      this.rainFrames -= dt;
      // Gotas decorativas mientras dura la rafaga
      if (Math.random() < 0.35 * dt) {
        const node = this.makeText("💧", 16);
        node.anchor.set(0.5);
        node.alpha = 0.7;
        node.x = Math.random() * W;
        node.y = -10;
        this.layer.addChild(node);
        this.drops.push({ node, vy: 5 + Math.random() * 2 });
      }
    }
    this.drops = this.drops.filter((d) => {
      d.node.y += d.vy * dt;
      if (d.node.y > groundY) {
        d.node.destroy();
        return false;
      }
      return true;
    });

    return { knock, gravityMul: this.rainFrames > 0 ? RAIN_GRAVITY_MUL : 1 };
  }

  reset(): void {
    for (const b of this.birds) b.node.destroy();
    for (const b of this.bolts) b.node.destroy();
    for (const d of this.drops) d.node.destroy();
    for (const fc of this.floorClouds) fc.node.destroy();
    this.birds = [];
    this.bolts = [];
    this.drops = [];
    this.floorClouds = [];
    this.rainFrames = 0;
  }
}
