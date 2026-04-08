"use client";

import { useAppStore } from "@/shared/store/useAppStore";
import { radii } from "@/shared/styles/design-tokens";

export function DarkModeToggle() {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Modo claro" : "Modo oscuro"}
      style={{
        width: 36, height: 36, borderRadius: radii.full,
        backgroundColor: darkMode ? "#2d3748" : "#f7fafc",
        border: darkMode ? "1px solid #4a5568" : "1px solid #e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, cursor: "pointer",
      }}
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );
}
