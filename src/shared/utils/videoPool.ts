// ─── Video pool for game completion ──────────────────────────────
// Picks a DIFFERENT video each time (never the same twice in a row).

const CELEBRATION_VIDEOS = [
  "/videos/leo-celebration-1.mp4",
  "/videos/leo-celebration-2.mp4",
  "/videos/leo-celebration-3.mp4",
  "/videos/sofia-celebration-1.mp4",
  "/videos/sofia-celebration-2.mp4",
  "/videos/sofia-leo-celebration-1.mp4",
];

const MOTIVATION_VIDEOS = [
  "/videos/leo-motivation.mp4",
];

let _lastCelebration = "";

export function pickCelebrationVideo(): string {
  const available = CELEBRATION_VIDEOS.filter((v) => v !== _lastCelebration);
  const pick = available[Math.floor(Math.random() * available.length)];
  _lastCelebration = pick;
  return pick;
}

export function pickMotivationVideo(): string {
  return MOTIVATION_VIDEOS[Math.floor(Math.random() * MOTIVATION_VIDEOS.length)];
}

export function pickEndVideo(stars: number): string {
  return stars >= 2 ? pickCelebrationVideo() : pickMotivationVideo();
}
