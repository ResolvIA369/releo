"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, fonts, fontSizes, spacing, radii, shadows } from "@/shared/styles/design-tokens";

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  // ─── Register SW + listen for updates ──────────────────────────

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        registration = reg;

        // If there's already a waiting worker (e.g. from a previous
        // page load), surface the update banner immediately.
        if (reg.waiting) {
          setWaitingSW(reg.waiting);
        }

        // When a new SW finishes installing and moves to "waiting",
        // show the update banner.
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available, waiting for user approval
              setWaitingSW(newWorker);
            }
          });
        });
      })
      .catch(() => {
        // SW registration failed — app still works
      });

    // When the new SW activates (after user taps "Actualizar"),
    // reload so the fresh code takes effect.
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  // ─── Install prompt (Android/Chrome) ───────────────────────────

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as unknown as { prompt: () => void }).prompt();
    setShowInstall(false);
  };

  const handleDismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  const handleUpdate = useCallback(() => {
    if (!waitingSW) return;
    // Tell the waiting SW to activate
    waitingSW.postMessage({ type: "SKIP_WAITING" });
    // The "controllerchange" listener will reload the page
  }, [waitingSW]);

  // ─── Render ────────────────────────────────────────────────────

  // Update banner takes priority over install banner
  const showUpdateBanner = !!waitingSW;

  return (
    <AnimatePresence>
      {/* ── Update available banner ── */}
      {showUpdateBanner && (
        <motion.div
          key="update"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 9999,
            padding: spacing.md,
            backgroundColor: "#1a202c",
            color: "#fff",
            borderRadius: radii.xl,
            boxShadow: shadows.lg,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
          }}
        >
          <div>
            <strong>🎉 Nueva versión disponible</strong>
            <div style={{ fontSize: fontSizes.xs, opacity: 0.8, marginTop: 2 }}>
              Tocá para actualizar REleo
            </div>
          </div>
          <button
            onClick={handleUpdate}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              backgroundColor: "#48bb78",
              color: "#fff",
              border: "none",
              borderRadius: radii.lg,
              fontSize: fontSizes.sm,
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Actualizar
          </button>
        </motion.div>
      )}

      {/* ── Install banner (only if no update pending) ── */}
      {showInstall && !showUpdateBanner && (
        <motion.div
          key="install"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            padding: spacing.md,
            backgroundColor: colors.bg.card,
            borderTop: `1px solid ${colors.border.light}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.md,
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
          }}
        >
          <span>Instalá REleo para usarla sin internet</span>
          <button
            onClick={handleInstall}
            style={{
              padding: `${spacing.xs}px ${spacing.md}px`,
              backgroundColor: colors.brand.primary,
              color: "#fff",
              border: "none",
              borderRadius: radii.lg,
              fontSize: fontSizes.sm,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Instalar
          </button>
          <button
            onClick={handleDismissInstall}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: fontSizes.md,
              color: colors.text.muted,
              padding: spacing.xs,
            }}
          >
            Ahora no
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
