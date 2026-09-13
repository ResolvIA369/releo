// Playtest largo de Leo Vuela (demo autoplay) para verificar en vivo:
// - transicion de humor del cielo dia -> atardecer (10 aciertos) -> noche (20 aciertos)
// - el solape de Leo sobre la palabra al atrapar (deuda pre-existente, solo observar)
// - que no haya errores de consola/pagina durante una sesion larga
import { chromium } from "@playwright/test";

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  await page.goto("http://localhost:3000/demo?game=leo-vuela&phase=1", { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  console.log("arrancó, esperando transiciones...");

  const shots = [30, 90, 180, 300, 420, 540, 600, 660];
  let elapsed = 0;
  for (const target of shots) {
    await page.waitForTimeout((target - elapsed) * 1000);
    elapsed = target;
    await page.screenshot({ path: `/tmp/leo-vuela-night-t${target}.png` });
    console.log(`t=${target}s screenshot ok, errores hasta ahora: ${errors.length}`);
  }

  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
};

run().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
