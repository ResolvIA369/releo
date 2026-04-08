import { openDB, type IDBPDatabase } from "idb";
import type { SessionResult, PhaseNumber } from "@/shared/types/doman";
import type { PlayerProgress } from "@/features/progression/types";
import type {
  PersistenceManager,
  PersistedSession,
  PlayerProfile,
  ReviewCard,
} from "../types";

const DB_NAME = "doman-app";
const DB_VERSION = 3;
const SESSIONS_STORE = "sessions";
const PROFILES_STORE = "profiles";
const PROGRESS_STORE = "progress";
const REVIEW_STORE = "review_cards";
const ACTIVE_PROFILE_KEY = "active";
const PROGRESS_KEY = "current";

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

async function getDb(): Promise<IDBPDatabase> {
  try {
    return await openDbInternal();
  } catch (err) {
    console.warn("[DB] Failed to open, deleting and retrying:", err);
    if (typeof indexedDB !== "undefined") {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
    return openDbInternal();
  }
}

function openDbInternal(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const store = db.createObjectStore(SESSIONS_STORE, { keyPath: "sessionId" });
        store.createIndex("by-phase", "phase");
        store.createIndex("by-date", "savedAt");
      }
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        db.createObjectStore(PROFILES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(REVIEW_STORE)) {
        const store = db.createObjectStore(REVIEW_STORE, { keyPath: "wordId" });
        store.createIndex("by-next-review", "nextReviewDate");
      }
    },
  });
}

export function createPersistenceManager(): PersistenceManager {
  return {
    // ─── Profile ──────────────────────────────────────────────────
    async saveProfile(childName: string): Promise<PlayerProfile> {
      const db = await getDb();
      const profile: PlayerProfile = {
        id: ACTIVE_PROFILE_KEY,
        childName: childName.trim(),
        createdAt: new Date().toISOString(),
      };
      await db.put(PROFILES_STORE, profile);
      return profile;
    },

    async getProfile(): Promise<PlayerProfile | null> {
      const db = await getDb();
      return (await db.get(PROFILES_STORE, ACTIVE_PROFILE_KEY)) ?? null;
    },

    async deleteProfile(): Promise<void> {
      const db = await getDb();
      await db.delete(PROFILES_STORE, ACTIVE_PROFILE_KEY);
    },

    // ─── Sessions ─────────────────────────────────────────────────
    async saveSession(result: SessionResult): Promise<PersistedSession> {
      const db = await getDb();
      const persisted: PersistedSession = { ...result, savedAt: new Date().toISOString() };
      await db.put(SESSIONS_STORE, persisted);
      return persisted;
    },

    async getSessions(): Promise<PersistedSession[]> {
      const db = await getDb();
      return db.getAllFromIndex(SESSIONS_STORE, "by-date");
    },

    async getSessionsByPhase(phase: PhaseNumber): Promise<PersistedSession[]> {
      const db = await getDb();
      return db.getAllFromIndex(SESSIONS_STORE, "by-phase", phase);
    },

    // ─── Progression ──────────────────────────────────────────────
    async saveProgress(progress: PlayerProgress): Promise<void> {
      const db = await getDb();
      await db.put(PROGRESS_STORE, { id: PROGRESS_KEY, ...progress });
    },

    async getProgress(): Promise<PlayerProgress> {
      const db = await getDb();
      const stored = await db.get(PROGRESS_STORE, PROGRESS_KEY);
      if (!stored) return { ...DEFAULT_PROGRESS };
      const { id: _, ...progress } = stored;
      return progress as PlayerProgress;
    },

    // ─── Spaced Repetition ────────────────────────────────────────
    async saveReviewCard(card: ReviewCard): Promise<void> {
      const db = await getDb();
      await db.put(REVIEW_STORE, card);
    },

    async getReviewCards(): Promise<ReviewCard[]> {
      const db = await getDb();
      return db.getAll(REVIEW_STORE);
    },

    async getDueCards(today: string): Promise<ReviewCard[]> {
      const db = await getDb();
      const all = await db.getAllFromIndex(REVIEW_STORE, "by-next-review");
      return all.filter((card) => card.nextReviewDate <= today);
    },

    // ─── Clear all ────────────────────────────────────────────────
    async clear(): Promise<void> {
      const db = await getDb();
      await db.clear(SESSIONS_STORE);
      await db.clear(PROFILES_STORE);
      await db.clear(PROGRESS_STORE);
      await db.clear(REVIEW_STORE);
    },
  };
}
