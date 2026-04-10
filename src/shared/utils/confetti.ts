// ─── Confetti helpers (canvas-confetti) ──────────────────────────
//
// Lightweight wrappers around canvas-confetti so games can fire
// celebration bursts with one call. The library is loaded lazily
// on first use so it never runs in SSR / on the server.

const KID_COLORS = [
  "#f6ad55", // orange
  "#fbbf24", // yellow
  "#48bb78", // green
  "#4299e1", // blue
  "#9f7aea", // purple
  "#f56565", // red
  "#ed64a6", // pink
];

// Use the confetti function type from the namespace declaration
type ConfettiFn = typeof import("canvas-confetti");

let _confettiPromise: Promise<ConfettiFn> | null = null;

function loadConfetti(): Promise<ConfettiFn> | null {
  if (typeof window === "undefined") return null;
  if (!_confettiPromise) {
    _confettiPromise = import("canvas-confetti").then((m) => (m as unknown as { default: ConfettiFn }).default);
  }
  return _confettiPromise;
}

/** Small burst at a specific screen position (x, y as 0..1). */
export function burstAt(x = 0.5, y = 0.6) {
  const p = loadConfetti();
  if (!p) return;
  p.then((confetti) => {
    confetti({
      particleCount: 60,
      spread: 70,
      startVelocity: 35,
      origin: { x, y },
      colors: KID_COLORS,
      scalar: 0.9,
      ticks: 120,
      disableForReducedMotion: true,
    });
  });
}

/** Larger celebration burst (game complete). */
export function bigCelebration() {
  const p = loadConfetti();
  if (!p) return;
  p.then((confetti) => {
    const duration = 1200;
    const end = Date.now() + duration;

    const fire = () => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors: KID_COLORS,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors: KID_COLORS,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(fire);
    };
    fire();
  });
}

/** Stop and clear any running confetti. */
export function stopConfetti() {
  const p = loadConfetti();
  if (!p) return;
  p.then((confetti) => confetti.reset());
}
