// Smoke de los juegos arcade en un mundo dado.
// Uso: node arcade-world-smoke.mjs <gameId> <worldName> <phase>
// Ej.:  node arcade-world-smoke.mjs leo-runner "Bahía de los Pares" 2
import { chromium } from "@playwright/test";

const [gameId, worldName, phase] = process.argv.slice(2);
if (!gameId || !worldName || !phase) {
  console.error("uso: node arcade-world-smoke.mjs <gameId> <worldName> <phase>");
  process.exit(2);
}

let ERRORS;
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const errors = []; ERRORS = errors;
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  // ── Flujo real: /play/<game> en el mundo pedido ──
  await page.goto(`http://localhost:3000/play/${gameId}`, { waitUntil: "networkidle" });
  const nameInput = page.locator('input[placeholder*="Sof"]');
  if (await nameInput.count()) {
    await nameInput.fill("Tomi");
    await page.locator("button", { hasText: "Empezar" }).click();
    await page.waitForTimeout(1200);
    await page.goto(`http://localhost:3000/play/${gameId}`, { waitUntil: "networkidle" });
  }
  await page.waitForTimeout(800);
  await page.locator(`text=${worldName}`).first().click({ timeout: 8000 });
  await page.waitForTimeout(800);
  await page.locator("button", { hasText: /\d+ palabras/ }).first().click({ timeout: 8000 });

  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/arcade-${gameId}-w${phase}-1-game.png` });

  // Interacción genérica: carriles (leo-runner) o salto (salta-palabra)
  for (let i = 0; i < 5; i++) {
    const lane = page.locator(`[data-lane="${i % 3}"]`);
    if (await lane.count()) await lane.click({ force: true });
    else await page.locator("[data-jump]").click({ force: true });
    await page.waitForTimeout(1800);
  }
  await page.screenshot({ path: `/tmp/arcade-${gameId}-w${phase}-2-played.png` });

  // Pausa + reanudar sin crash
  await page.locator('button[aria-label="Pausar"]').click();
  await page.waitForTimeout(600);
  await page.locator("button", { hasText: "Continuar" }).click();
  await page.waitForTimeout(1200);

  // ── Demo autoplay con la fase del mundo ──
  await page.goto(`http://localhost:3000/demo?game=${gameId}&phase=${phase}`, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(22000);
  const coins = await page.locator('img[alt="cofre"] + span').first().textContent().catch(() => "?");
  await page.screenshot({ path: `/tmp/arcade-${gameId}-w${phase}-3-demo.png` });

  console.log(`demo coins after 22s: ${coins}`);
  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length || coins === "0") process.exit(1);
};

run().catch((e) => { console.error("FAILED:", e.message); console.log("errors:", ERRORS); process.exit(1); });
