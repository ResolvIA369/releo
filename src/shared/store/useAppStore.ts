import { create } from "zustand";
import { createPersistenceManager } from "@/features/persistence/services/db";
import { CURRICULUM } from "@/features/session/config/curriculum";
import type { PlayerProgress } from "@/features/progression/types";
import type { PlayerProfile } from "@/features/persistence/types";

const db = createPersistenceManager();

const DEFAULT_PROGRESS: PlayerProgress = {
  currentWorldId: "world_1",
  worldsUnlocked: ["world_1"],
  wordsMastered: [],
  completedSessions: [],
  gamesCompleted: {},
  streakDays: 0,
  longestStreak: 0,
  lastPlayedDate: "",
  totalPlayTime: 0,
};

// localStorage key for coins
const COINS_KEY = "doman-coins";

// localStorage key for dark mode
const DARK_MODE_KEY = "doman-dark-mode";

function loadDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DARK_MODE_KEY) === "true";
}

function persistDarkMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DARK_MODE_KEY, String(enabled));
}

function applyDarkMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function loadCoins(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COINS_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function persistCoins(coins: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COINS_KEY, String(coins));
}

interface AppState {
  // Profile
  profile: PlayerProfile | null;
  profileStatus: "loading" | "ready" | "missing";

  // Progress
  progress: PlayerProgress;
  progressLoading: boolean;

  // XP
  xp: number;

  // Coins (rewards store currency)
  coins: number;

  // Dark mode
  darkMode: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  saveProfile: (name: string) => Promise<void>;
  loadProgress: () => Promise<void>;
  completeSession: (sessionId: number) => Promise<void>;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  toggleDarkMode: () => void;

  // Derived helpers
  isSessionCompleted: (sessionId: number) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  profile: null,
  profileStatus: "loading",
  progress: DEFAULT_PROGRESS,
  progressLoading: true,
  xp: 0,
  coins: loadCoins(),
  darkMode: loadDarkMode(),

  // Load profile from IndexedDB (call once on app mount)
  loadProfile: async () => {
    try {
      const profile = await db.getProfile();
      set({
        profile,
        profileStatus: profile ? "ready" : "missing",
      });
    } catch {
      set({ profileStatus: "missing" });
    }
  },

  // Save profile
  saveProfile: async (name: string) => {
    const profile = await db.saveProfile(name);
    set({ profile, profileStatus: "ready" });
  },

  // Load progress from IndexedDB (call once on app mount)
  loadProgress: async () => {
    try {
      const progress = await db.getProgress();
      if (!progress.completedSessions) progress.completedSessions = [];
      set({ progress, progressLoading: false, xp: progress.totalPlayTime || 0 });
    } catch {
      set({ progressLoading: false });
    }
  },

  // Complete a session and persist
  completeSession: async (sessionId: number) => {
    const session = CURRICULUM.find((s) => s.id === sessionId);
    if (!session) return;

    const prev = get().progress;
    const completedSessions = [...new Set([...prev.completedSessions, sessionId])];
    const wordsMastered = [...new Set([
      ...prev.wordsMastered,
      ...session.words.map((w) => w.id),
    ])];

    const today = new Date().toISOString().split("T")[0];
    let streakDays = prev.streakDays;
    let longestStreak = prev.longestStreak;
    if (prev.lastPlayedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      streakDays = prev.lastPlayedDate === yesterday ? prev.streakDays + 1 : 1;
      longestStreak = Math.max(longestStreak, streakDays);
    }

    const updated: PlayerProgress = {
      ...prev,
      completedSessions,
      wordsMastered,
      streakDays,
      longestStreak,
      lastPlayedDate: today,
    };

    // Add XP for completing a session
    const newXP = get().xp + 20; // 20 XP per session
    // Award 5 coins per completed game
    const newCoins = get().coins + 5;
    persistCoins(newCoins);
    set({ progress: updated, xp: newXP, coins: newCoins });
    await db.saveProgress({ ...updated, totalPlayTime: newXP }); // Store XP in totalPlayTime field
  },

  // Add XP from games
  addXP: (amount: number) => {
    set({ xp: get().xp + amount });
  },

  // Add coins (rewards store currency) — persisted to localStorage
  addCoins: (amount: number) => {
    const newCoins = get().coins + amount;
    persistCoins(newCoins);
    set({ coins: newCoins });
  },

  // Toggle dark mode
  toggleDarkMode: () => {
    const newValue = !get().darkMode;
    persistDarkMode(newValue);
    applyDarkMode(newValue);
    set({ darkMode: newValue });
  },

  // Check if a session is completed
  isSessionCompleted: (sessionId: number) => {
    return get().progress.completedSessions.includes(sessionId);
  },
}));
