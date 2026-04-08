// Reader avatar evolution levels (Pokemon-style for reading)

export interface ReaderLevel {
  level: number;
  name: string;
  emoji: string;
  title: string;
  minXP: number;
  color: string;
}

export const READER_LEVELS: ReaderLevel[] = [
  { level: 1, name: "Semillita", emoji: "🌱", title: "Semillita Lectora", minXP: 0, color: "#a0d468" },
  { level: 2, name: "Brote", emoji: "🌿", title: "Brote de Letras", minXP: 50, color: "#48bb78" },
  { level: 3, name: "Arbolito", emoji: "🌳", title: "Arbolito Sabio", minXP: 150, color: "#38a169" },
  { level: 4, name: "Estrellita", emoji: "⭐", title: "Estrellita Lectora", minXP: 350, color: "#ecc94b" },
  { level: 5, name: "Cometa", emoji: "☄️", title: "Cometa de Historias", minXP: 600, color: "#ed8936" },
  { level: 6, name: "Sol", emoji: "🌟", title: "Sol de Sabiduría", minXP: 1000, color: "#f6ad55" },
  { level: 7, name: "Dragón Lector", emoji: "🐉", title: "Dragón Lector", minXP: 1500, color: "#e53e3e" },
  { level: 8, name: "Fénix", emoji: "🦅", title: "Fénix de las Palabras", minXP: 2500, color: "#9f7aea" },
  { level: 9, name: "Mago", emoji: "🧙", title: "Mago de la Lectura", minXP: 4000, color: "#667eea" },
  { level: 10, name: "Leyenda", emoji: "👑", title: "Leyenda de las Letras", minXP: 6000, color: "#f093fb" },
];

export function getReaderLevel(xp: number): ReaderLevel {
  let current = READER_LEVELS[0];
  for (const level of READER_LEVELS) {
    if (xp >= level.minXP) current = level;
    else break;
  }
  return current;
}

export function getNextLevel(xp: number): ReaderLevel | null {
  for (const level of READER_LEVELS) {
    if (xp < level.minXP) return level;
  }
  return null;
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getReaderLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return { current: xp - level.minXP, needed: 1, percent: 100 };
  const current = xp - level.minXP;
  const needed = next.minXP - level.minXP;
  return { current, needed, percent: Math.round((current / needed) * 100) };
}

// XP rewards
export const XP_REWARDS = {
  wordLearned: 2,
  gameCompleted: 10,
  perfectGame: 25,   // 90%+ correct
  storyCompleted: 15,
  dailyStreak: 5,
  sessionCompleted: 20,
};
