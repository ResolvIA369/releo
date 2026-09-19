type HapticKind = "tap" | "success" | "error" | "victory";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 15,
  success: 30,
  error: [40, 60, 40],
  victory: [60, 30, 60, 30, 80],
};

let enabled = true;

export function setHapticEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Trigger a vibration pattern. Silently no-ops on devices without the
 * Vibration API or when the user has disabled haptics in preferences.
 */
export function hapticTap(kind: HapticKind = "tap"): void {
  if (!enabled) return;
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[kind]);
  } catch {
    // ignore
  }
}
