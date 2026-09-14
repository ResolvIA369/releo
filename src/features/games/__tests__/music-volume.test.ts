import { describe, it, expect } from "vitest";
import type { PhaseNumber } from "@/shared/types/doman";
import { LEO_VUELA_TUNING } from "../config/leo-vuela";
import { LEO_RUNNER_TUNING } from "../config/leo-runner";
import { SALTA_TUNING } from "../config/salta-palabra";
import { WORD_TRAIN_TUNING } from "../config/word-train";
import { WORD_RAIN_TUNING } from "../config/word-rain";
import { WORD_FISHING_TUNING } from "../config/word-fishing";
import { BUBBLES_TUNING } from "../config/bubbles";
import { GAME_MUSIC_VOLUME_DB } from "../hooks/useGameMusic";
import { CATEGORY_GAME_MUSIC_VOLUME_DB } from "../components/CategoryGame";

// Auditoría de grabación sep-2026 (docs/RELEO-AUDITORIA-GRABACION.md,
// categoría B2): varios juegos tenían musicVolumeDb entre -22 y -24dB,
// que decodificando los loops reales mide ~-40/-44dB RMS efectivo — por
// debajo del piso de audibilidad en parlantes típicos. Se subieron todos
// a -10dB (el valor ya validado en Leo Vuela). Este test evita que
// alguno vuelva a bajar de -14dB sin que alguien lo note.
const PHASES: PhaseNumber[] = [1, 2, 3, 4, 5];

const PER_PHASE_TUNINGS: Record<string, Record<PhaseNumber, { musicVolumeDb: number }>> = {
  "leo-vuela": LEO_VUELA_TUNING,
  "leo-runner": LEO_RUNNER_TUNING,
  "salta-palabra": SALTA_TUNING,
  "word-train": WORD_TRAIN_TUNING,
  "word-rain": WORD_RAIN_TUNING,
  "word-fishing": WORD_FISHING_TUNING,
  "daily-bits": BUBBLES_TUNING,
};

describe("volumen de música de fondo — ningún juego por debajo de -14dB", () => {
  for (const [gameId, tuningByPhase] of Object.entries(PER_PHASE_TUNINGS)) {
    it(`${gameId}: musicVolumeDb >= -14 en las 5 fases`, () => {
      for (const phase of PHASES) {
        expect(tuningByPhase[phase].musicVolumeDb).toBeGreaterThanOrEqual(-14);
      }
    });
  }

  it("word-image-match / memory-cards / phrase-builder (useGameMusic compartido): musicVolumeDb >= -14", () => {
    expect(GAME_MUSIC_VOLUME_DB).toBeGreaterThanOrEqual(-14);
  });

  it("category-sort (volumen inline, no vive en un config compartido): musicVolumeDb >= -14", () => {
    expect(CATEGORY_GAME_MUSIC_VOLUME_DB).toBeGreaterThanOrEqual(-14);
  });
});
