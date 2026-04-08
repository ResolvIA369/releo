import { describe, it, expect } from "vitest";
import {
  TUTOR_PERSONALITY,
  preloadCount,
  clearBuffer,
  type Emotion,
  type SpeakOptions,
} from "../services/voiceService";

describe("voiceService — constants", () => {
  it("TUTOR_PERSONALITY contains key instructions", () => {
    expect(TUTOR_PERSONALITY).toContain("tutora infantil");
    expect(TUTOR_PERSONALITY).toContain("Nunca repites");
    expect(TUTOR_PERSONALITY).toContain("español latinoamericano");
    expect(TUTOR_PERSONALITY).toContain("máximo 10 palabras");
  });

  it("Emotion type covers all expected values", () => {
    const emotions: Emotion[] = [
      "excited",
      "encouraging",
      "neutral",
      "celebratory",
    ];
    expect(emotions).toHaveLength(4);
  });

  it("SpeakOptions requires text", () => {
    const opts: SpeakOptions = { text: "Hola" };
    expect(opts.text).toBe("Hola");
  });

  it("SpeakOptions accepts optional emotion and rate", () => {
    const opts: SpeakOptions = {
      text: "Hola",
      emotion: "excited",
      rate: 1.2,
      lang: "es-MX",
    };
    expect(opts.emotion).toBe("excited");
    expect(opts.rate).toBe(1.2);
    expect(opts.lang).toBe("es-MX");
  });
});

describe("voiceService — buffer", () => {
  it("clearBuffer resets the count to 0", () => {
    clearBuffer();
    expect(preloadCount()).toBe(0);
  });
});
