import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ALL_WORDS } from "../constants";

/**
 * scripts/respelling-palabras.json (fuera de src/, no se importa nunca desde
 * la app) es la fuente única del respelling fonético que usa el pipeline de
 * audio (ver CLAUDE.md, "Voz de Sofía > Respelling fonético"). Estos tests
 * garantizan la separación: el respelling existe SOLO para generar MP3 y
 * nunca puede convertirse en lo que el chico ve en pantalla.
 */
const RESPELLING_PATH = path.resolve(
  __dirname,
  "../../../scripts/respelling-palabras.json",
);

function cargarRespelling(): Record<string, string> {
  const raw = JSON.parse(fs.readFileSync(RESPELLING_PATH, "utf-8"));
  delete raw._comentario;
  return raw;
}

describe("Respelling fonético — no se filtra a la UI", () => {
  const respelling = cargarRespelling();
  const textosEnPantalla = new Set(ALL_WORDS.map((w) => w.text));

  it("scripts/respelling-palabras.json existe y tiene al menos una entrada", () => {
    expect(Object.keys(respelling).length).toBeGreaterThan(0);
  });

  it("toda clave del respelling es una palabra real del currículum (words.ts)", () => {
    for (const palabraReal of Object.keys(respelling)) {
      expect(textosEnPantalla.has(palabraReal)).toBe(true);
    }
  });

  it("ninguna grafía respelled (el valor) aparece como texto mostrado en pantalla", () => {
    for (const [palabraReal, respelled] of Object.entries(respelling)) {
      if (respelled === palabraReal) continue; // sin cambio, no aplica
      expect(textosEnPantalla.has(respelled)).toBe(false);
    }
  });

  it("ALL_WORDS no contiene ninguna entrada con tilde no ortográfica de las usadas en el respelling", () => {
    // Guarda extra: si alguna vez alguien "corrige" words.ts a mano para
    // que coincida con el respelling (ej. cambia pan -> pán pensando que es
    // el texto correcto), este test lo agarra explícitamente por palabra.
    for (const respelled of Object.values(respelling)) {
      const coincidencia = ALL_WORDS.find((w) => w.text === respelled);
      expect(coincidencia).toBeUndefined();
    }
  });
});
