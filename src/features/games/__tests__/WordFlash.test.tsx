import "fake-indexeddb/auto";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { WordFlash } from "../components/WordFlash";
import { PHASE1_WORDS } from "@/shared/constants";

const testWords = PHASE1_WORDS.slice(0, 5);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WordFlash", () => {
  it("renders the ready screen by default", () => {
    render(<WordFlash words={testWords} phase={1} />);
    expect(screen.getByText("Flash de Palabras")).toBeTruthy();
    expect(screen.getByText("Empezar")).toBeTruthy();
  });

  it("shows Empezar button", () => {
    render(<WordFlash words={testWords} phase={1} />);
    expect(screen.getByText("Empezar")).toBeTruthy();
  });

  it("renders back button when onBack is provided", () => {
    render(<WordFlash words={testWords} phase={1} onBack={() => {}} />);
    expect(screen.getByText("Volver")).toBeTruthy();
  });
});
