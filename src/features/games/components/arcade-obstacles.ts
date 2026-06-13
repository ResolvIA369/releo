import type { Container, Graphics, Text } from "pixi.js";

// Base compartida de obstaculos de los juegos arcade. Los obstaculos
// SOLO agregan dificultad de pilotaje/esquive: la energia la descuenta
// cada juego (con invulnerabilidad), y la lectura sigue siendo lo
// unico que da puntos.

type PixiModule = typeof import("pixi.js");

// Tirada de spawn por frame (60fps): ratePerMin eventos por minuto.
// Pura e inyectable para poder testearla.
export function spawnRoll(ratePerMin: number, dt: number, rng: () => number = Math.random): boolean {
  if (ratePerMin <= 0) return false;
  return rng() < (ratePerMin * dt) / 3600;
}

// ─── Dibujos compartidos ───────────────────────────────────────────

// Silueta clara de pajaro en vuelo (mirando a la izquierda) con ala
// animable desde afuera
export function drawBird(PIXI: PixiModule): { node: Container; wing: Graphics } {
  const C = 0x455a64;
  const node = new PIXI.Container();
  const body = new PIXI.Graphics();
  body.ellipse(0, 0, 16, 9).fill(C); // cuerpo
  body.circle(-14, -5, 6.5).fill(C); // cabeza
  body.poly([-19, -6, -28, -3, -19, -1]).fill(0xff9800); // pico
  body.poly([13, -3, 26, -10, 24, 3]).fill(C); // cola
  body.circle(-15.5, -6.5, 1.5).fill(0xffffff); // ojo
  node.addChild(body);
  const wing = new PIXI.Graphics();
  wing.poly([0, 0, 13, -16, 9, 1]).fill(0x37474f);
  wing.position.set(1, -4); // pivote en la base del ala
  node.addChild(wing);
  return { node, wing };
}

// Tronco caido (visto de lado o cruzando el camino)
export function drawLog(PIXI: PixiModule): Graphics {
  const g = new PIXI.Graphics();
  g.roundRect(-30, -11, 60, 22, 10).fill(0x8d6e63).stroke({ width: 2, color: 0x6d4c41 });
  g.ellipse(-30, 0, 7, 11).fill(0xa1887f); // corte del tronco
  g.circle(-30, 0, 3.5).fill(0x8d6e63); // anillo
  g.rect(-12, -11, 4, 22).fill({ color: 0x6d4c41, alpha: 0.45 }); // veta
  g.rect(8, -11, 4, 22).fill({ color: 0x6d4c41, alpha: 0.45 });
  return g;
}

// Puercoespin caminando (mirando a la izquierda): cuerpo con puas
export function drawPorcupine(PIXI: PixiModule): Container {
  const node = new PIXI.Container();
  const g = new PIXI.Graphics();
  // puas (abanico sobre el lomo)
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + (0.7 * i) / 6);
    const x = Math.cos(a) * 16;
    const y = -Math.sin(a) * 16;
    g.poly([x * 0.4, y * 0.4 - 4, x * 1.5, y * 1.5 - 4, x * 0.7 + 3, y * 0.7 - 4]).fill(0x4e342e);
  }
  g.ellipse(0, -4, 15, 10).fill(0x6d4c41); // cuerpo
  g.circle(-13, -3, 5).fill(0x8d6e63); // cabeza
  g.circle(-16, -4, 1.2).fill(0x000000); // ojo
  g.poly([-17, -1, -21, 0, -17, 1]).fill(0x3e2723); // nariz
  g.rect(-8, 4, 3, 4).fill(0x4e342e); // patas
  g.rect(4, 4, 3, 4).fill(0x4e342e);
  node.addChild(g);
  return node;
}

// ─── Salta la Palabra: obstaculos que cruzan por el piso ───────────

export interface GroundRates {
  logsPerMin: number;
  porcupinesPerMin: number;
  birdsPerMin: number; // pajaros que bajan en picada hacia el piso
  rainPerMin: number; // rafagas visuales de lluvia
}

interface GroundMover {
  node: Container;
  vx: number;
  walker: boolean; // los puercoespines "caminan" (bob de patas)
  hit: boolean;
}

interface SwoopBird {
  node: Container;
  wing: Graphics;
  vx: number;
  targetY: number;
  hit: boolean;
}

const GROUND_HIT_X = 38;
const LEO_ON_GROUND_Y = 26; // Leo cuenta como "en el piso" hasta esta altura
const RAIN_DURATION_FRAMES = 4 * 60;

export class GroundObstacles {
  private movers: GroundMover[] = [];
  private birds: SwoopBird[] = [];
  private drops: Text[] = [];
  private rainFrames = 0;

  constructor(
    private PIXI: PixiModule,
    private layer: Container,
    private bounds: { W: number; groundY: number },
  ) {}

  // leo: { x, y } con y = pies de Leo. Devuelve hit=true en el frame
  // en que un obstaculo lo toca (la energia la maneja el juego).
  update(dt: number, rates: GroundRates, leo: { x: number; y: number }): { hit: boolean } {
    const { W, groundY } = this.bounds;
    let hit = false;
    const leoOnGround = leo.y >= groundY - LEO_ON_GROUND_Y;

    // Troncos y puercoespines: cruzan el piso de derecha a izquierda
    if (spawnRoll(rates.logsPerMin, dt)) {
      const node = drawLog(this.PIXI);
      node.x = W + 50;
      node.y = groundY - 8;
      this.layer.addChild(node);
      this.movers.push({ node, vx: 2.4 + Math.random() * 0.8, walker: false, hit: false });
    }
    if (spawnRoll(rates.porcupinesPerMin, dt)) {
      const node = drawPorcupine(this.PIXI);
      node.x = W + 50;
      node.y = groundY - 6;
      this.layer.addChild(node);
      this.movers.push({ node, vx: 1.5 + Math.random() * 0.7, walker: true, hit: false });
    }
    this.movers = this.movers.filter((m) => {
      m.node.x -= m.vx * dt;
      if (m.walker) m.node.rotation = Math.sin(m.node.x * 0.12) * 0.06; // pasitos
      if (!m.hit && leoOnGround && Math.abs(m.node.x - leo.x) < GROUND_HIT_X) {
        m.hit = true;
        m.node.alpha = 0.55;
        hit = true;
      }
      if (m.node.x < -80) {
        m.node.destroy({ children: true });
        return false;
      }
      return true;
    });

    // Pajaros que bajan en picada hasta la altura de Leo
    if (spawnRoll(rates.birdsPerMin, dt)) {
      const { node, wing } = drawBird(this.PIXI);
      node.x = W + 30;
      node.y = 60 + Math.random() * 50;
      this.layer.addChild(node);
      this.birds.push({ node, wing, vx: 2.6 + Math.random() * 1.0, targetY: groundY - 36, hit: false });
    }
    this.birds = this.birds.filter((b) => {
      b.node.x -= b.vx * dt;
      if (b.node.y < b.targetY) b.node.y += 1.6 * dt; // picada
      b.wing.rotation = Math.sin(b.node.x * 0.18) * 0.8;
      if (!b.hit && Math.abs(b.node.x - leo.x) < GROUND_HIT_X && Math.abs(b.node.y - (leo.y - 40)) < 34) {
        b.hit = true;
        b.node.alpha = 0.5;
        hit = true;
      }
      if (b.node.x < -40) {
        b.node.destroy({ children: true });
        return false;
      }
      return true;
    });

    // Lluvia: rafaga decorativa (dificulta leer el cielo, no toca)
    if (this.rainFrames <= 0 && spawnRoll(rates.rainPerMin, dt)) this.rainFrames = RAIN_DURATION_FRAMES;
    if (this.rainFrames > 0) {
      this.rainFrames -= dt;
      if (Math.random() < 0.35 * dt) {
        const drop = new this.PIXI.Text({ text: "💧", style: { fontSize: 16 } });
        drop.anchor.set(0.5);
        drop.alpha = 0.7;
        drop.x = Math.random() * W;
        drop.y = -10;
        this.layer.addChild(drop);
        this.drops.push(drop);
      }
    }
    this.drops = this.drops.filter((d) => {
      d.y += 6 * dt;
      if (d.y > groundY) {
        d.destroy();
        return false;
      }
      return true;
    });

    return { hit };
  }

  reset(): void {
    for (const m of this.movers) m.node.destroy({ children: true });
    for (const b of this.birds) b.node.destroy({ children: true });
    for (const d of this.drops) d.destroy();
    this.movers = [];
    this.birds = [];
    this.drops = [];
    this.rainFrames = 0;
  }
}

// ─── Leo Corre: obstaculos que bajan por un carril del camino ──────

export interface LaneRates {
  logsPerMin: number;
  birdsPerMin: number;
  rainPerMin: number;
}

interface LaneMover {
  node: Container;
  lane: number;
  speedMul: number; // relativo a la velocidad del camino
  wing: Graphics | null;
  hit: boolean;
}

const LANE_HIT_Y = 34;

export class LaneObstacles {
  private movers: LaneMover[] = [];
  private drops: Text[] = [];
  private rainFrames = 0;

  constructor(
    private PIXI: PixiModule,
    private layer: Container,
    private opts: { lanesX: number[]; H: number; leoY: number },
  ) {}

  // speed: px/frame del camino este frame. Devuelve hit=true en el
  // frame en que un obstaculo alcanza a Leo en su carril.
  update(dt: number, rates: LaneRates, leoLane: number, speed: number): { hit: boolean } {
    const { lanesX, H, leoY } = this.opts;
    let hit = false;

    if (spawnRoll(rates.logsPerMin, dt)) {
      const node = drawLog(this.PIXI);
      const lane = Math.floor(Math.random() * lanesX.length);
      node.x = lanesX[lane];
      node.y = -30;
      this.layer.addChild(node);
      this.movers.push({ node, lane, speedMul: 1, wing: null, hit: false });
    }
    if (spawnRoll(rates.birdsPerMin, dt)) {
      const { node, wing } = drawBird(this.PIXI);
      node.rotation = Math.PI / 2; // bajando por el camino
      const lane = Math.floor(Math.random() * lanesX.length);
      node.x = lanesX[lane];
      node.y = -30;
      this.layer.addChild(node);
      this.movers.push({ node, lane, speedMul: 1.8, wing, hit: false });
    }
    this.movers = this.movers.filter((m) => {
      m.node.y += speed * m.speedMul * dt;
      if (m.wing) m.wing.rotation = Math.sin(m.node.y * 0.15) * 0.8;
      if (!m.hit && m.lane === leoLane && Math.abs(m.node.y - leoY) < LANE_HIT_Y) {
        m.hit = true;
        m.node.alpha = 0.55;
        hit = true;
      }
      if (m.node.y > H + 50) {
        m.node.destroy({ children: true });
        return false;
      }
      return true;
    });

    // Lluvia decorativa
    if (this.rainFrames <= 0 && spawnRoll(rates.rainPerMin, dt)) this.rainFrames = RAIN_DURATION_FRAMES;
    if (this.rainFrames > 0) {
      this.rainFrames -= dt;
      if (Math.random() < 0.35 * dt) {
        const drop = new this.PIXI.Text({ text: "💧", style: { fontSize: 14 } });
        drop.anchor.set(0.5);
        drop.alpha = 0.6;
        drop.x = Math.random() * (lanesX[lanesX.length - 1] + 100);
        drop.y = -10;
        this.layer.addChild(drop);
        this.drops.push(drop);
      }
    }
    this.drops = this.drops.filter((d) => {
      d.y += 7 * dt;
      if (d.y > H) {
        d.destroy();
        return false;
      }
      return true;
    });

    return { hit };
  }

  reset(): void {
    for (const m of this.movers) m.node.destroy({ children: true });
    for (const d of this.drops) d.destroy();
    this.movers = [];
    this.drops = [];
    this.rainFrames = 0;
  }
}
