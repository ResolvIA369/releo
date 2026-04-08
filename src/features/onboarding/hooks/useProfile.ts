"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPersistenceManager } from "@/features/persistence/services/db";
import type { PlayerProfile } from "@/features/persistence/types";

type ProfileStatus = "loading" | "ready" | "missing";

export function useProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const managerRef = useRef(createPersistenceManager());

  useEffect(() => {
    managerRef.current.getProfile()
      .then((p) => {
        setProfile(p);
        setStatus(p ? "ready" : "missing");
      })
      .catch((err) => {
        console.error("[useProfile] IndexedDB error:", err);
        setStatus("missing"); // Redirect to onboarding on DB error
      });
  }, []);

  const save = useCallback(async (childName: string) => {
    const saved = await managerRef.current.saveProfile(childName);
    setProfile(saved);
    setStatus("ready");
    return saved;
  }, []);

  const remove = useCallback(async () => {
    await managerRef.current.deleteProfile();
    setProfile(null);
    setStatus("missing");
  }, []);

  return { profile, status, save, remove };
}
