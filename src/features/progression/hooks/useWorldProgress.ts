"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPersistenceManager } from "@/features/persistence/services/db";
import type { PlayerProgress } from "@/features/progression/types";
import { CURRICULUM, getWorldSessions } from "@/features/session/config/curriculum";

const DEFAULT: PlayerProgress = {
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

export function useWorldProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const managerRef = useRef(createPersistenceManager());

  // Load on mount
  useEffect(() => {
    managerRef.current.getProgress().then((p) => {
      // Ensure completedSessions exists (migration safety)
      if (!p.completedSessions) p.completedSessions = [];
      setProgress(p);
      setLoading(false);
    });
  }, []);

  // Complete a session
  const completeSession = useCallback(async (sessionId: number) => {
    const session = CURRICULUM.find((s) => s.id === sessionId);
    if (!session) return;

    setProgress((prev) => {
      const completedSessions = [...new Set([...prev.completedSessions, sessionId])];
      const wordsMastered = [...new Set([
        ...prev.wordsMastered,
        ...session.words.map((w) => w.id),
      ])];

      // Update streak
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

      // Persist
      managerRef.current.saveProgress(updated);
      return updated;
    });
  }, []);

  // Get completed session IDs for a world
  const getWorldCompleted = useCallback((worldId: string): number[] => {
    const worldSessions = getWorldSessions(worldId);
    return worldSessions
      .filter((s) => progress.completedSessions.includes(s.id))
      .map((s) => s.id);
  }, [progress.completedSessions]);

  // Get session count for a world
  const getWorldSessionCount = useCallback((worldId: string) => {
    const worldSessions = getWorldSessions(worldId);
    const completed = getWorldCompleted(worldId);
    return { completed: completed.length, total: worldSessions.length };
  }, [getWorldCompleted]);

  return {
    progress,
    loading,
    completeSession,
    getWorldCompleted,
    getWorldSessionCount,
  };
}
