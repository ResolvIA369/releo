"use client";

import { useEffect, useState } from "react";
import { colors, fonts, fontSizes, spacing, radii } from "@/shared/styles/design-tokens";

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(window.location.origin + "/service-worker.js")
        .catch(() => {
          // SW registration failed — app still works, just no offline support
        });
    }

    // Capture install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Only show if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as unknown as { prompt: () => void }).prompt();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998,
      padding: spacing.md,
      backgroundColor: colors.bg.card,
      borderTop: `1px solid ${colors.border.light}`,
      display: "flex", alignItems: "center", justifyContent: "center", gap: spacing.md,
      fontFamily: fonts.body, fontSize: fontSizes.sm,
    }}>
      <span>Instala Doman App para usarla sin internet</span>
      <button
        onClick={handleInstall}
        style={{
          padding: `${spacing.xs}px ${spacing.md}px`,
          backgroundColor: colors.brand.primary, color: "#fff",
          border: "none", borderRadius: radii.lg, fontSize: fontSizes.sm,
          fontWeight: "bold", cursor: "pointer",
        }}
      >
        Instalar
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: fontSizes.md, color: colors.text.muted, padding: spacing.xs,
        }}
      >
        Ahora no
      </button>
    </div>
  );
}
