import { test, expect, type Page } from "@playwright/test";

// El aviso de Chrome "Para salir de la pantalla completa, arrastra desde
// arriba" sale cada vez que la pagina llama a requestFullscreen. Estos tests
// cuentan esas llamadas al girar el telefono en los dos juegos horizontales.
//
// Playwright no puede instalar la PWA, asi que el modo instalado se simula
// haciendo que matchMedia("(display-mode: fullscreen)") devuelva true, que es
// lo que ve la app cuando corre con display: "fullscreen" del manifest.

const JUEGOS = ["leo-vuela", "salta-palabra"];

async function preparar(page: Page, { pwa }: { pwa: boolean }) {
  await page.addInitScript((pwa: boolean) => {
    const w = window as unknown as { __fullscreen: number; __locks: string[] };
    w.__fullscreen = 0;
    w.__locks = [];
    Element.prototype.requestFullscreen = function () {
      w.__fullscreen++;
      return Promise.resolve();
    };
    Object.defineProperty(Document.prototype, "fullscreenEnabled", { get: () => true, configurable: true });
    const o = screen.orientation as ScreenOrientation & { lock: (x: string) => Promise<void>; unlock: () => void };
    o.lock = (x: string) => { w.__locks.push(x); return Promise.resolve(); };
    o.unlock = () => {};
    if (pwa) {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (q: string) => {
        if (!q.includes("display-mode")) return original(q);
        return {
          matches: q.includes("fullscreen"), media: q, onchange: null,
          addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
          dispatchEvent: () => false,
        } as unknown as MediaQueryList;
      };
    }
  }, pwa);
  // Perfil sembrado: sin perfil, ProfileGuard manda a /onboarding.
  // /onboarding hace su propia navegacion al hidratar: esperar a que quede
  // quieta antes de escribir en IndexedDB.
  await page.goto("/onboarding", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => new Promise<void>((res, rej) => {
    const r = indexedDB.open("doman-app", 3);
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction("profiles", "readwrite");
      tx.objectStore("profiles").put({ id: "active", childName: "Test", createdAt: new Date().toISOString() });
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => rej(tx.error);
    };
    r.onerror = () => rej(r.error);
  }));
}

async function entrarAlJuego(page: Page, juego: string) {
  await page.goto(`/play/${juego}`);
  await page.getByText("Isla de las Palabras").first().click();
  await page.getByText("Familia").first().click();
  await expect(page.getByText("Girá el teléfono")).toBeVisible({ timeout: 15000 });
}

async function girar(page: Page) {
  const v = page.viewportSize()!;
  await page.setViewportSize({ width: v.height, height: v.width });
  await expect(page.getByText("Girá el teléfono")).toBeHidden();
  await page.setViewportSize(v);
  await expect(page.getByText("Girá el teléfono")).toBeVisible();
}

const contador = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __fullscreen: number; __locks: string[] };
    return { fullscreen: w.__fullscreen, locks: [...w.__locks] };
  });

for (const juego of JUEGOS) {
  test(`${juego} instalada (PWA): girar no llama a requestFullscreen y acuesta sola`, async ({ page }) => {
    await preparar(page, { pwa: true });
    await entrarAlJuego(page, juego);
    await girar(page);
    const c = await contador(page);
    expect(c.fullscreen).toBe(0);
    expect(c.locks).toContain("landscape");

    // El boton del cartel tampoco pide pantalla completa en la PWA.
    await page.getByRole("button", { name: "Girar la pantalla" }).click();
    expect((await contador(page)).fullscreen).toBe(0);
  });

  test(`${juego} en navegador: girar no llama a requestFullscreen; solo el toque del boton`, async ({ page }) => {
    await preparar(page, { pwa: false });
    await entrarAlJuego(page, juego);
    await girar(page);
    expect(await contador(page)).toEqual({ fullscreen: 0, locks: [] });

    await page.getByRole("button", { name: "Jugar en pantalla completa" }).click();
    await expect.poll(async () => (await contador(page)).fullscreen).toBe(1);
  });
}
