import { describe, it, expect } from "vitest";
import { moodForLevel, ArcadeSky, ARCADE_Z } from "../components/arcade-sky";

describe("moodForLevel", () => {
  it("mapea los 3 niveles reales a día → atardecer → noche", () => {
    expect(moodForLevel(0)).toBe("dia");
    expect(moodForLevel(1)).toBe("atardecer");
    expect(moodForLevel(2)).toBe("noche");
  });

  it("cualquier nivel por encima del máximo se queda de noche", () => {
    expect(moodForLevel(5)).toBe("noche");
  });

  it("un nivel negativo (no debería pasar) cae a día en vez de romper", () => {
    expect(moodForLevel(-1)).toBe("dia");
  });
});

// ─── Regresión: el paisaje del mundo no puede quedar delante del
// gameplay, ni siquiera cuando su carga (async) resuelve tarde ────────

class FakeGraphics {
  zIndex = 0;
  clear() { return this; }
  rect() { return this; }
  circle() { return this; }
  ellipse() { return this; }
  fill() { return this; }
}
class FakeContainer {
  children: unknown[] = [];
  zIndex = 0;
  x = 0;
  y = 0;
  alpha = 1;
  sortableChildren = false;
  addChild<T>(child: T): T {
    this.children.push(child);
    return child;
  }
  destroy() {}
}
class FakeSprite extends FakeContainer {
  width = 0;
  height = 0;
  tint = 0xffffff;
  constructor(public texture: unknown) {
    super();
  }
}

describe("ArcadeSky — orden de dibujo (ARCADE_Z)", () => {
  it("el sprite del paisaje conserva su zIndex aunque loadLandscape() resuelva después de que el gameplay ya agregó sus propias capas al stage", async () => {
    let resolveTexture!: (t: unknown) => void;
    const texturePromise = new Promise((res) => {
      resolveTexture = res;
    });
    const PIXI = {
      Graphics: FakeGraphics,
      Container: FakeContainer,
      Sprite: FakeSprite,
      Assets: { load: () => texturePromise },
    } as unknown as ConstructorParameters<typeof ArcadeSky>[0];

    const stage = new FakeContainer() as unknown as ConstructorParameters<typeof ArcadeSky>[1];
    const sky = new ArcadeSky(PIXI, stage, { W: 640, H: 420, groundY: 330 });

    // Dispara la carga del paisaje pero todavía no resuelve — igual que
    // el `void skyRef.current.loadLandscape(...)` de LeoVuela.tsx, que
    // no bloquea el resto del init.
    const loadPromise = sky.loadLandscape("/fake-landscape.png");

    // Mientras tanto, el gameplay agrega sus capas sincrónicamente al
    // stage (mismo orden real que LeoVuela.tsx) — esto es exactamente lo
    // que antes hacía que el paisaje terminara arriba de todo.
    const stageAsContainer = stage as unknown as FakeContainer;
    const wordClouds = new FakeContainer();
    wordClouds.zIndex = ARCADE_Z.wordClouds;
    stageAsContainer.addChild(wordClouds);
    const leo = new FakeContainer();
    leo.zIndex = ARCADE_Z.leo;
    stageAsContainer.addChild(leo);

    // Recién ahora "termina de cargar" la imagen del paisaje.
    resolveTexture({});
    await loadPromise;

    expect(stageAsContainer.sortableChildren).toBe(true);
    const landscapeSprite = stageAsContainer.children.find((c) => c instanceof FakeSprite) as FakeSprite;
    expect(landscapeSprite).toBeDefined();
    expect(landscapeSprite.zIndex).toBe(ARCADE_Z.landscape);
    // Aunque el sprite se agregó al final (después de las capas de
    // gameplay), su zIndex lo sigue ubicando detrás de ellas.
    expect(landscapeSprite.zIndex).toBeLessThan(wordClouds.zIndex);
    expect(landscapeSprite.zIndex).toBeLessThan(leo.zIndex);
  });
});

describe("ARCADE_Z — invariantes de la jerarquía", () => {
  it("el paisaje del mundo siempre queda detrás de todas las capas de gameplay", () => {
    expect(ARCADE_Z.landscape).toBeLessThan(ARCADE_Z.wordClouds);
    expect(ARCADE_Z.landscape).toBeLessThan(ARCADE_Z.obstacles);
    expect(ARCADE_Z.landscape).toBeLessThan(ARCADE_Z.trail);
    expect(ARCADE_Z.landscape).toBeLessThan(ARCADE_Z.leo);
    expect(ARCADE_Z.landscape).toBeLessThan(ARCADE_Z.bookIcon);
    expect(ARCADE_Z.landscape).toBeLessThan(ARCADE_Z.fx);
  });

  it("el piso procedural queda detrás del paisaje, y el paisaje detrás del cielo no aplica (cielo es la base de todo)", () => {
    expect(ARCADE_Z.sky).toBeLessThan(ARCADE_Z.ground);
    expect(ARCADE_Z.ground).toBeLessThan(ARCADE_Z.landscape);
  });
});
