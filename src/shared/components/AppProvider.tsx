"use client";

import { useEffect } from "react";
import { useAppStore } from "@/shared/store/useAppStore";
import { DarkModeSync } from "@/shared/components/DarkModeSync";

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAppStore.getState().loadProfile();
    useAppStore.getState().loadProgress();
  }, []);

  return (
    <>
      <DarkModeSync />
      {children}
    </>
  );
}
