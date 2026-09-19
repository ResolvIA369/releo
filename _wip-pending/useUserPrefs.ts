"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPersistenceManager } from "../services/db";
import { setHapticEnabled } from "@/shared/utils/haptic";

export interface UserPrefs {
  audioFirst: boolean;
  wordRainCalm: boolean;
  hapticFeedback: boolean;
  voiceVerification: boolean;
  lastWordTrainDifficulty: 1 | 2 | 3 | null;
  lastBlockByGame: Record<string, { worldIdx: number; blockIdx: number }>;
  onboardingCompleted: boolean;
}

const DEFAULT_PREFS: UserPrefs = {
  audioFirst: false,
  wordRainCalm: false,
  hapticFeedback: true,
  voiceVerification: false,
  lastWordTrainDifficulty: null,
  lastBlockByGame: {},
  onboardingCompleted: false,
};

const PREFS_KEY = "user-prefs";

/**
 * Lightweight hook over IndexedDB-backed user preferences.
 * Reads once on mount; writes back on every change.
 */
export function useUserPrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const managerRef = useRef(createPersistenceManager());

  useEffect(() => {
    managerRef.current.getPref<UserPrefs>(PREFS_KEY).then((stored) => {
      const merged = stored ? { ...DEFAULT_PREFS, ...stored } : DEFAULT_PREFS;
      setPrefs(merged);
      setHapticEnabled(merged.hapticFeedback);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      managerRef.current.setPref(PREFS_KEY, next);
      if (key === "hapticFeedback") setHapticEnabled(next.hapticFeedback);
      return next;
    });
  }, []);

  return { prefs, update, loaded };
}
