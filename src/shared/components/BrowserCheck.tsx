"use client";

import { useEffect, useState } from "react";
import { colors, fonts, fontSizes, spacing, radii } from "@/shared/styles/design-tokens";

interface Compatibility {
  speechSynthesis: boolean;
  speechRecognition: boolean;
  indexedDB: boolean;
}

function checkBrowser(): Compatibility {
  if (typeof window === "undefined") {
    return { speechSynthesis: false, speechRecognition: false, indexedDB: false };
  }
  const w = window as unknown as Record<string, unknown>;
  return {
    speechSynthesis: "speechSynthesis" in window,
    speechRecognition: !!(w.SpeechRecognition ?? w.webkitSpeechRecognition),
    indexedDB: "indexedDB" in window,
  };
}

export function BrowserCheck({ children }: { children: React.ReactNode }) {
  const [compat, setCompat] = useState<Compatibility | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setCompat(checkBrowser());
  }, []);

  if (!compat || dismissed) return <>{children}</>;

  const warnings: string[] = [];
  if (!compat.speechSynthesis) warnings.push("Voz de Sofia (Text-to-Speech)");
  if (!compat.speechRecognition) warnings.push("Reconocimiento de voz (micrófono)");
  if (!compat.indexedDB) warnings.push("Almacenamiento local (IndexedDB)");

  if (warnings.length === 0) return <>{children}</>;

  return (
    <>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        padding: `${spacing.sm}px ${spacing.md}px`,
        backgroundColor: "#FFF3CD", borderBottom: "1px solid #FFEAA7",
        display: "flex", alignItems: "center", justifyContent: "center", gap: spacing.sm,
        fontFamily: fonts.body, fontSize: fontSizes.sm, color: "#856404",
      }}>
        <span>⚠️ Tu navegador no soporta: {warnings.join(", ")}. Para la mejor experiencia usa Chrome.</span>
        <button
          onClick={() => setDismissed(true)}
          style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: fontSizes.md, color: "#856404", padding: spacing.xs,
            borderRadius: radii.sm,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ paddingTop: 44 }}>
        {children}
      </div>
    </>
  );
}
