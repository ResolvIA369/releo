import { defineConfig, devices } from "@playwright/test";

// Tests de navegador real (a diferencia de tests/games, que son por fetch).
// Necesita la app corriendo: PW_BASE_URL (por defecto http://localhost:3000).
// En la WSL de desarrollo el Chromium por defecto no siempre está: se puede
// apuntar a otro con PW_CHROMIUM_PATH.
export default defineConfig({
  testDir: ".",
  timeout: 180000,
  retries: 0,
  use: {
    ...devices["Pixel 7"],
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:3000",
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox"],
    },
  },
  reporter: [["list"]],
});
