import { test, expect } from "@playwright/test";

// /demo es el grabador de videos: se usa en una compu, no en el celular.
test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __fullscreen: number };
    w.__fullscreen = 0;
    Element.prototype.requestFullscreen = function () {
      w.__fullscreen++;
      return Promise.resolve();
    };
  });
});

test("/demo: «Ver» pide pantalla completa una vez, desde el toque, y arranca la sesión", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  // Esperar la hidratación: un click antes de que React enganche el
  // handler se pierde sin error.
  await page.goto("/demo", { waitUntil: "networkidle" });
  await page.getByText("▶ Ver").click();
  await expect(page).toHaveURL(/session=1/);
  // El reproductor monta y no vuelve a pedir pantalla completa por su cuenta.
  await page.waitForTimeout(4000);
  expect(await page.evaluate(() => (window as unknown as { __fullscreen: number }).__fullscreen)).toBe(1);
  await expect(page.getByText("▶ Ver")).toHaveCount(0);
  expect(errores).toEqual([]);
});

for (const juego of ["leo-vuela", "salta-palabra"]) {
  test(`/demo ${juego}: el juego se juega solo sin errores`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(`/demo?game=${juego}&phase=1&block=0&demoSpeed=1`);
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(8000);
    await expect(page.locator("canvas").first()).toBeVisible();
    expect(errores).toEqual([]);
  });
}
