"use client";

import { useEffect } from "react";

export function WakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock request failed (e.g. low battery)
      }
    }

    requestWakeLock();

    // Re-acquire when tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLock?.release();
    };
  }, []);

  return null;
}
