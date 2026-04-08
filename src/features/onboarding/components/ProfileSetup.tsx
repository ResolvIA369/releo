"use client";

import { useState } from "react";
import { useAppStore } from "@/shared/store/useAppStore";

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
    <div className="flex min-h-screen items-center justify-center bg-surface p-spacing-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-spacing-6 rounded-xl bg-background p-spacing-8 shadow-lg"
      >
        <div className="flex flex-col items-center gap-spacing-2">
          <h1 className="font-display text-3xl font-extrabold text-primary">
            ¡Hola!
          </h1>
          <p className="text-center text-text-muted">
            ¿Cómo se llama el pequeño lector?
          </p>
        </div>

        <div className="flex flex-col gap-spacing-2">
          <label htmlFor="child-name" className="text-sm font-medium text-text-base">
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
            className="rounded-lg border border-border bg-background px-spacing-4 py-spacing-3 text-lg text-text-base placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-spacing-6 py-spacing-3 text-lg font-bold text-on-primary transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Guardando..." : "¡Empezar a aprender!"}
        </button>
      </form>
    </div>
  );
}
