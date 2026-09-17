import "fake-indexeddb/auto";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryGame } from "../components/CategoryGame";
import { PHASE1_WORDS } from "@/shared/constants";
import type { DomanWord } from "@/shared/types/doman";

// Same principle as WordImageMatch: the word is shown as text and the
// child must read it to know which category button to tap. Announcing
// it by voice before the choice turns this into a listening game, not
// a reading one — see docs/RELEO-JUEGOS-V2.md §4.2.
vi.mock("@/shared/services/sofiaVoice", () => ({
  sofiaNameWord: vi.fn().mockResolvedValue(undefined),
  sofiaPlayAudio: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
}));

import { sofiaNameWord } from "@/shared/services/sofiaVoice";

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

// The round order is shuffled internally, so we find the word actually
// on screen by scanning the known word list rather than assuming index 0.
function findCurrentWord(): DomanWord | undefined {
  return PHASE1_WORDS.find((w) => screen.queryByText(w.text));
}

describe("CategoryGame — no se puede ganar solo de oído", () => {
  it("NO anuncia la palabra antes de que el niño elija una categoría", async () => {
    const user = userEvent.setup();
    render(<CategoryGame words={PHASE1_WORDS.slice(0, 5)} phase={1} />);
    await skipIntro(user);

    await waitFor(() => expect(findCurrentWord()).toBeTruthy());
    expect(sofiaNameWord).not.toHaveBeenCalled();
  });

  it("recién dice la palabra DESPUÉS de acertar la categoría", async () => {
    const user = userEvent.setup();
    render(<CategoryGame words={PHASE1_WORDS.slice(0, 5)} phase={1} />);
    await skipIntro(user);

    let current: DomanWord | undefined;
    await waitFor(() => {
      current = findCurrentWord();
      expect(current).toBeTruthy();
    });
    expect(sofiaNameWord).not.toHaveBeenCalled();

    const btn = document.querySelector(
      `[data-category="${current!.categoryDisplay}"]`
    ) as HTMLElement | null;
    expect(btn).toBeTruthy();
    await user.click(btn!);

    await waitFor(() =>
      expect(sofiaNameWord).toHaveBeenCalledWith(current!.text)
    );
  });
});
