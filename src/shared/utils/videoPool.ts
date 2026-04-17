// ─── Video pool for game completion ──────────────────────────────
// All celebration/motivation videos available. The picker selects
// one at random so the child sees variety.

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

export function pickCelebrationVideo(): string {
  return CELEBRATION_VIDEOS[Math.floor(Math.random() * CELEBRATION_VIDEOS.length)];
}

export function pickMotivationVideo(): string {
  return MOTIVATION_VIDEOS[Math.floor(Math.random() * MOTIVATION_VIDEOS.length)];
}

export function pickEndVideo(stars: number): string {
  return stars >= 2 ? pickCelebrationVideo() : pickMotivationVideo();
}
