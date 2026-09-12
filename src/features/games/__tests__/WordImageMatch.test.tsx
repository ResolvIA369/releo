import "fake-indexeddb/auto";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WordImageMatch } from "../components/WordImageMatch";
import { PHASE1_WORDS } from "@/shared/constants";

// The whole point of this game is that the child must READ the word
// shown on screen to pick the matching image. If Sofia names the word
// out loud before the child chooses, the game can be won by ear alone
// and reading stops being necessary — see docs/RELEO-JUEGOS-V2.md §4.1.
vi.mock("@/shared/services/sofiaVoice", () => ({
  sofiaNameWord: vi.fn().mockResolvedValue(undefined),
  sofiaEncourages: vi.fn().mockResolvedValue(undefined),
  sofiaCelebrates: vi.fn().mockResolvedValue(undefined),
  sofiaPlayAudio: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
}));

import { sofiaNameWord } from "@/shared/services/sofiaVoice";

const testWords = PHASE1_WORDS.slice(0, 5);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function skipIntro(user: ReturnType<typeof userEvent.setup>) {
  const startBtn = (await screen.findByRole("button", {
    name: /Empezar/i,
  })) as HTMLButtonElement;
  await waitFor(() => expect(startBtn.disabled).toBe(false));
  await user.click(startBtn);
}

describe("WordImageMatch — no se puede ganar solo de oído", () => {
  it("NO anuncia la palabra objetivo antes de que el niño elija una imagen", async () => {
    const user = userEvent.setup();
    render(<WordImageMatch words={testWords} phase={1} />);
    await skipIntro(user);

    // La palabra ya está visible como texto en pantalla...
    await screen.findByText(testWords[0].text);
    // ...pero nadie la dijo en voz alta todavía.
    expect(sofiaNameWord).not.toHaveBeenCalled();
  });

  it("recién nombra la palabra DESPUÉS del acierto, como confirmación", async () => {
    const user = userEvent.setup();
    render(<WordImageMatch words={testWords} phase={1} />);
    await skipIntro(user);

    await screen.findByText(testWords[0].text);
    expect(sofiaNameWord).not.toHaveBeenCalled();

    const correctBtn = document.querySelector(
      `[data-word-id="${testWords[0].id}"]`
    ) as HTMLElement | null;
    expect(correctBtn).toBeTruthy();
    await user.click(correctBtn!);

    await waitFor(() =>
      expect(sofiaNameWord).toHaveBeenCalledWith(testWords[0].text)
    );
  });

  it("un intento incorrecto tampoco revela la palabra por audio", async () => {
    const user = userEvent.setup();
    render(<WordImageMatch words={testWords} phase={1} />);
    await skipIntro(user);

    await screen.findByText(testWords[0].text);

    const wrongBtn = document.querySelector(
      `button[data-word-id]:not([data-word-id="${testWords[0].id}"])`
    ) as HTMLElement | null;
    expect(wrongBtn).toBeTruthy();
    await user.click(wrongBtn!);

    // Sofia alienta ("¡Intentá otra vez!") pero nunca dice la palabra
    // objetivo — eso seguiría siendo un atajo auditivo.
    expect(sofiaNameWord).not.toHaveBeenCalled();
  });
});
