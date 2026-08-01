"use client";

import { useState } from "react";
import { useAppStore } from "@/shared/store/useAppStore";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const save = useAppStore((s) => s.saveProfile);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Escribe el nombre del niño");
      return;
    }

    setSaving(true);
    setError("");
    await save(trimmed);
    onComplete();
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg.primary,
        fontFamily: fonts.body,
        padding: spacing.md,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 400,
          flexDirection: "column",
          gap: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: colors.bg.card,
          border: `1px solid ${colors.border.light}`,
          padding: spacing.xl,
          boxShadow: shadows.lg,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.xs }}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes["3xl"],
              fontWeight: "bold",
              color: colors.brand.primary,
              margin: 0,
            }}
          >
            ¡Hola!
          </h1>
          <p style={{ textAlign: "center", color: colors.text.muted, margin: 0 }}>
            ¿Cómo se llama el pequeño lector?
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
          <label htmlFor="child-name" style={{ fontSize: fontSizes.sm, fontWeight: "bold", color: colors.text.primary }}>
            Nombre
          </label>
          <input
            id="child-name"
            type="text"
            autoFocus
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sofía"
            style={{
              borderRadius: radii.md,
              border: `2px solid ${colors.border.light}`,
              backgroundColor: colors.bg.card,
              color: colors.text.primary,
              padding: `${spacing.sm}px ${spacing.md}px`,
              fontSize: fontSizes.lg,
              fontFamily: fonts.body,
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = colors.border.focus)}
            onBlur={(e) => (e.currentTarget.style.borderColor = colors.border.light)}
          />
          {error && <p style={{ fontSize: fontSizes.sm, color: colors.error, margin: 0 }}>{error}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            borderRadius: radii.md,
            border: "none",
            backgroundColor: colors.brand.primary,
            color: colors.text.inverse,
            padding: `${spacing.md}px ${spacing.lg}px`,
            fontSize: fontSizes.lg,
            fontFamily: fonts.display,
            fontWeight: "bold",
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.5 : 1,
            boxShadow: shadows.button,
          }}
        >
          {saving ? "Guardando..." : "¡Empezar a aprender!"}
        </button>
      </form>
    </div>
  );
}
