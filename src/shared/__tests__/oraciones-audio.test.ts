import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SENTENCE_EXAMPLES, PHRASE_EXAMPLES } from "@/shared/constants";
import { ORACIONES_AUDIO } from "@/shared/constants/oraciones-audio";

// Construye la Frase termina cada ronda con sofiaReads(frase) y no hay TTS de
// respaldo: una frase sin MP3 queda muda (en la app y en los videos). Si se
// agrega una frase a words.ts, correr scripts/regenerate-oraciones.py.
describe("audio de las frases de Construye la Frase", () => {
  const frases = [...SENTENCE_EXAMPLES, ...PHRASE_EXAMPLES].map((s) => s.fullText);

  it("cada frase curada tiene su MP3 en el mapa", () => {
    const sinMapa = frases.filter((f) => !ORACIONES_AUDIO[f]);
    expect(sinMapa).toEqual([]);
  });

  it("cada MP3 del mapa existe en public/audio/sofia", () => {
    const faltan = Object.values(ORACIONES_AUDIO).filter(
      (n) => !existsSync(join(process.cwd(), "public", "audio", "sofia", `${n}.mp3`)),
    );
    expect(faltan).toEqual([]);
  });
});
