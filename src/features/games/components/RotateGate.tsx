"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { colors, fonts, fontSizes, spacing, radii } from "@/shared/styles/design-tokens";
import { canLockOrientation, isStandaloneDisplay, lockLandscape } from "@/shared/utils/pwa";

// Leo Vuela y Salta la Palabra tienen escena horizontal (640x420). En un
// celular en vertical el lienzo se ajusta al ancho y queda en ~370x243:
// 29% de la pantalla, palabras de ~15px y el HUD a ~8px (QA sep-2026,
// "en el celular quedo ultrapequeno"). Decision de Cesar: pedir girar el
// telefono en vez de redisenar los juegos en vertical. Tablets en vertical
// (>= 600px de ancho) no se bloquean: ahi el lienzo ya queda grande.
const PORTRAIT_PHONE_QUERY = "(orientation: portrait) and (max-width: 599px)";

export function useNeedsRotate(enabled: boolean): boolean {
  const [needs, setNeeds] = useState(false);
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(PORTRAIT_PHONE_QUERY);
    const update = () => setNeeds(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [enabled]);
  return enabled && needs;
}

// Android Chrome en una pestaña comun permite acostar la pantalla solo si
// antes entra en pantalla completa, y cada vez que entra muestra el aviso
// "Para salir de la pantalla completa, arrastra desde arriba". Por eso:
// - instalada (PWA): el lock va directo, sin pantalla completa ni aviso;
// - navegador: el boton dice que va a pantalla completa y solo la pide al
//   tocarlo. Nunca se pide sola al girar.
// iOS no tiene lock para una pagina: ahi el boton no se muestra y queda el
// pedido de girar a mano.
export const RotateGate: React.FC<{ color: string }> = ({ color }) => {
  const [canForce, setCanForce] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const inApp = isStandaloneDisplay();
    setInstalled(inApp);
    setCanForce(canLockOrientation() && (inApp || !!document.fullscreenEnabled));
  }, []);

  const forceLandscape = useCallback(() => {
    void lockLandscape({ userGesture: true });
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-gate-title"
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        backgroundColor: colors.bg.primary,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: spacing.lg, padding: spacing.xl, textAlign: "center",
        fontFamily: fonts.display,
      }}
    >
      <style>{`
        @keyframes releo-rotate-phone {
          0%, 20% { transform: rotate(0deg); }
          55%, 85% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
        .releo-rotate-phone { animation: releo-rotate-phone 2.6s cubic-bezier(0.65, 0, 0.35, 1) infinite; transform-origin: 50% 50%; }
        @media (prefers-reduced-motion: reduce) {
          .releo-rotate-phone { animation: none; transform: rotate(-90deg); }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
        <Image src="/images/Leo/motivando.png" alt="" width={220} height={120} style={{ display: "block" }} />
        <svg className="releo-rotate-phone" width="52" height="81" viewBox="0 0 72 112" aria-hidden="true">
          <rect x="4" y="4" width="64" height="104" rx="12" fill="#ffffff" stroke={color} strokeWidth="5" />
          <rect x="12" y="16" width="48" height="76" rx="4" fill={color} opacity="0.18" />
          <rect x="28" y="98" width="16" height="4" rx="2" fill={color} />
        </svg>
      </div>

      <h2 id="rotate-gate-title" style={{ margin: 0, fontSize: fontSizes["3xl"], lineHeight: 1.2, color }}>
        Girá el teléfono
      </h2>
      <p style={{ margin: 0, fontSize: fontSizes.lg, lineHeight: 1.4, color: colors.text.primary, maxWidth: 300 }}>
        Este juego se juega acostado, así Leo y las palabras se ven grandes.
      </p>

      {canForce && (
        <button
          onClick={forceLandscape}
          style={{
            minHeight: 52, padding: `${spacing.md}px ${spacing.xl}px`,
            borderRadius: radii.lg, border: "none",
            backgroundColor: color, color: "#fff",
            fontSize: fontSizes.lg, fontWeight: "bold", fontFamily: fonts.display,
            cursor: "pointer",
          }}
        >
          {installed ? "Girar la pantalla" : "Jugar en pantalla completa"}
        </button>
      )}

      <p style={{ margin: 0, fontSize: fontSizes.sm, lineHeight: 1.5, color: colors.text.muted, maxWidth: 300, fontFamily: fonts.body }}>
        Si la pantalla no gira, activá la rotación automática del teléfono.
      </p>
    </div>
  );
};
