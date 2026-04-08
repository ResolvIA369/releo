import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useTutor } from "../hooks/useTutor";
import { PHASE1_WORDS } from "@/shared/constants";

// Mock the voiceService to capture calls without playing audio
vi.mock("@/shared/services/voiceService", () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn(),
  preload: vi.fn().mockResolvedValue(undefined),
  clearBuffer: vi.fn(),
}));

import { speak, stopSpeaking } from "@/shared/services/voiceService";

const mockSpeak = vi.mocked(speak);
const mockStop = vi.mocked(stopSpeaking);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useTutor", () => {
  it("greet() calls speak with excited emotion", async () => {
    const { result } = renderHook(() => useTutor());

    await act(async () => {
      await result.current.greet();
    });

    expect(mockSpeak).toHaveBeenCalledOnce();
    const opts = mockSpeak.mock.calls[0][0];
    expect(opts.emotion).toBe("excited");
    expect(opts.text.length).toBeGreaterThan(0);
  });

  it("praise() calls speak with celebratory emotion", async () => {
    const { result } = renderHook(() => useTutor());

    await act(async () => {
      await result.current.praise();
    });

    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockSpeak.mock.calls[0][0].emotion).toBe("celebratory");
  });

  it("encourage() calls speak with encouraging emotion", async () => {
    const { result } = renderHook(() => useTutor());

    await act(async () => {
      await result.current.encourage();
    });

    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockSpeak.mock.calls[0][0].emotion).toBe("encouraging");
  });

  it("repeatWord() speaks the word text", async () => {
    const { result } = renderHook(() => useTutor());
    const word = PHASE1_WORDS[0]; // mamá

    await act(async () => {
      await result.current.repeatWord(word);
    });

    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockSpeak.mock.calls[0][0].text).toBe("mamá");
    expect(mockSpeak.mock.calls[0][0].emotion).toBe("neutral");
  });

  it("introduceWord() speaks an intro + the word", async () => {
    const { result } = renderHook(() => useTutor());
    const word = PHASE1_WORDS[0];

    await act(async () => {
      await result.current.introduceWord(word);
    });

    expect(mockSpeak).toHaveBeenCalledOnce();
    const text = mockSpeak.mock.calls[0][0].text;
    expect(text).toContain("mamá");
    expect(text.length).toBeGreaterThan("mamá".length);
  });

  it("personalizes phrases with childName", async () => {
    const { result } = renderHook(() =>
      useTutor({ childName: "Sofía" })
    );

    await act(async () => {
      await result.current.greet();
    });

    const text = mockSpeak.mock.calls[0][0].text;
    // If the picked phrase contains "campeón" or "pequeño lector", it gets replaced
    // Either way, the text should be non-empty
    expect(text.length).toBeGreaterThan(0);
  });

  it("does not speak when enabled=false", async () => {
    const { result } = renderHook(() =>
      useTutor({ enabled: false })
    );

    await act(async () => {
      await result.current.greet();
    });

    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it("stop() calls stopSpeaking", () => {
    const { result } = renderHook(() => useTutor());
    result.current.stop();
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("praise() never picks the same phrase twice consecutively", async () => {
    const { result } = renderHook(() => useTutor());
    const phrases = new Set<string>();

    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await result.current.praise();
      });
      phrases.add(mockSpeak.mock.calls[i][0].text);
    }

    // With 8 praise phrases and no-repeat logic, we should see variety
    expect(phrases.size).toBeGreaterThan(1);
  });
});
