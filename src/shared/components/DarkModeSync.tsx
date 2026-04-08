"use client";

import { useEffect } from "react";
import { useAppStore } from "@/shared/store/useAppStore";

/**
 * Syncs the dark mode state from the store to the <html> element's data-theme attribute.
 * Must be mounted inside a client boundary (e.g. AppProvider).
 */
export function DarkModeSync() {
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [darkMode]);

  return null;
}
