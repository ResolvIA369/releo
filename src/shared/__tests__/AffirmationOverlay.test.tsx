import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { AffirmationOverlay } from "../components/AffirmationOverlay";
import type { Affirmation } from "@/shared/types/doman";

const mockAffirmation: Affirmation = {
  id: "conf-02",
  text: "Yo soy inteligente",
  category: "confianza",
  moment: "correct_answer",
  audioUrl: "",
};

const achievementAffirmation: Affirmation = {
  id: "auto-03",
  text: "Soy valioso",
  category: "autoconocimiento",
  moment: "achievement",
  audioUrl: "",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AffirmationOverlay", () => {
  it("renders the affirmation text", () => {
    render(
      <AffirmationOverlay affirmation={mockAffirmation} onDone={() => {}} />
    );
    expect(screen.getByText("Yo soy inteligente")).toBeTruthy();
  });

  it("renders the correct icon for correct_answer moment", () => {
    render(
      <AffirmationOverlay affirmation={mockAffirmation} onDone={() => {}} />
    );
    expect(screen.getByText("⭐")).toBeTruthy();
  });

  it("renders trophy icon for achievement moment", () => {
    render(
      <AffirmationOverlay affirmation={achievementAffirmation} onDone={() => {}} />
    );
    expect(screen.getByText("🏆")).toBeTruthy();
  });

  it("has z-[9999] for highest stacking", () => {
    render(
      <AffirmationOverlay affirmation={mockAffirmation} onDone={() => {}} />
    );
    const overlay = screen.getByRole("alert");
    expect(overlay.className).toContain("z-[9999]");
  });

  it("calls onDone after durationMs", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <AffirmationOverlay
        affirmation={mockAffirmation}
        onDone={onDone}
        durationMs={2000}
      />
    );

    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2000));
    expect(onDone).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("uses default 2500ms duration", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <AffirmationOverlay affirmation={mockAffirmation} onDone={onDone} />
    );

    act(() => vi.advanceTimersByTime(2499));
    expect(onDone).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onDone).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("has role=alert and aria-live for accessibility", () => {
    render(
      <AffirmationOverlay affirmation={mockAffirmation} onDone={() => {}} />
    );
    const overlay = screen.getByRole("alert");
    expect(overlay.getAttribute("aria-live")).toBe("assertive");
  });
});
