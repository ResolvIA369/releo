"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { PHASE1_WORDS, PHASE2_WORDS, PHASE3_WORDS, PHASE4_WORDS, PHASE5_WORDS } from "@/shared/constants";
import type { DomanWord } from "@/shared/types/doman";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";
import { AnimatedButton } from "@/shared/components/AnimatedButton";

const PHASES = [
  { name: "Fase 1: Palabras Sencillas", words: PHASE1_WORDS, color: "#e53e3e" },
  { name: "Fase 2: Parejas de Palabras", words: PHASE2_WORDS, color: "#2d3748" },
  { name: "Fase 3: Oraciones", words: PHASE3_WORDS, color: "#2d3748" },
  { name: "Fase 4: Frases", words: PHASE4_WORDS, color: "#2d3748" },
  { name: "Fase 5: Cuentos", words: PHASE5_WORDS, color: "#2d3748" },
];

export default function CardsPage() {
  const [selectedPhase, setSelectedPhase] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const phase = PHASES[selectedPhase];

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Tarjetas Doman - ${phase.name}</title>
        <style>
          @page { size: landscape; margin: 1cm; }
          body { margin: 0; font-family: Arial, sans-serif; }
          .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .card {
            border: 3px solid ${phase.color};
            border-radius: 16px;
            padding: 40px 20px;
            text-align: center;
            page-break-inside: avoid;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-text {
            font-size: ${phase.color === "#e53e3e" ? "72px" : "56px"};
            font-weight: bold;
            color: ${phase.color};
            font-family: "Arial Rounded MT Bold", Arial, sans-serif;
          }
          .phase-title {
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
            color: #333;
            page-break-after: avoid;
          }
          .instructions {
            text-align: center;
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="phase-title">${phase.name} — Tarjetas Doman</div>
        <div class="instructions">Recortar por las líneas. Mostrar cada tarjeta durante 1-2 segundos diciendo la palabra en voz alta.</div>
        <div class="card-grid">
          ${phase.words.map((w: DomanWord) => `<div class="card"><span class="card-text">${w.text}</span></div>`).join("")}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg.primary, fontFamily: fonts.body, padding: spacing.lg }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 style={{ fontSize: fontSizes["2xl"], fontFamily: fonts.display, color: colors.text.primary, margin: `0 0 ${spacing.md}px`, textAlign: "center" }}>
          🖨️ Tarjetas para Imprimir
        </h1>
        <p style={{ fontSize: fontSizes.sm, color: colors.text.muted, textAlign: "center", margin: `0 0 ${spacing.lg}px` }}>
          Imprime las tarjetas del método Doman para practicar sin pantalla
        </p>

        {/* Phase selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center", marginBottom: spacing.lg }}>
          {PHASES.map((p, i) => (
            <button key={i} onClick={() => setSelectedPhase(i)}
              style={{
                padding: `${spacing.xs}px ${spacing.md}px`,
                borderRadius: radii.pill,
                backgroundColor: selectedPhase === i ? colors.brand.primary : colors.bg.secondary,
                color: selectedPhase === i ? "#fff" : colors.text.muted,
                border: "none", cursor: "pointer", fontSize: fontSizes.sm, fontWeight: "bold",
              }}>
              Fase {i + 1}
            </button>
          ))}
        </div>

        {/* Print button */}
        <div style={{ textAlign: "center", marginBottom: spacing.lg }}>
          <AnimatedButton color={phase.color} onClick={handlePrint}>
            🖨️ Imprimir {phase.words.length} tarjetas
          </AnimatedButton>
        </div>

        {/* Preview */}
        <div ref={printRef} style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: spacing.md,
        }}>
          {phase.words.slice(0, 20).map((w) => (
            <motion.div key={w.id}
              whileHover={{ scale: 1.03 }}
              style={{
                border: `3px solid ${phase.color}`,
                borderRadius: radii.xl,
                padding: `${spacing.xl}px ${spacing.md}px`,
                textAlign: "center",
                backgroundColor: "#fff",
                boxShadow: shadows.sm,
              }}>
              <span style={{
                fontSize: phase.color === "#e53e3e" ? 48 : 36,
                fontWeight: "bold",
                color: phase.color,
                fontFamily: "Arial Rounded MT Bold, Arial, sans-serif",
              }}>
                {w.text}
              </span>
            </motion.div>
          ))}
        </div>

        {phase.words.length > 20 && (
          <p style={{ textAlign: "center", fontSize: fontSizes.sm, color: colors.text.placeholder, marginTop: spacing.md }}>
            Mostrando 20 de {phase.words.length}. Todas se incluyen al imprimir.
          </p>
        )}
      </div>
    </div>
  );
}
