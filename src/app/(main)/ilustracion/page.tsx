"use client";

// Preview del sistema de ilustración. NO es parte de la app para chicos:
// existe para verificar de un vistazo que el personaje sea reconociblemente
// el mismo en las 42 combinaciones de pose × expresión.

import { composeScene } from "@/illustration/compose";
import { zorro } from "@/illustration/characters/zorro";
import { CANVAS } from "@/illustration/tokens";
import { POSES, EXPRESIONES } from "@/illustration/types";
import { notFound } from "next/navigation";
import { colors, spacing, fonts, fontSizes } from "@/shared/styles/design-tokens";

function Celda({ pose, expression }: { pose: (typeof POSES)[number]; expression: (typeof EXPRESIONES)[number] }) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-160 -320 320 360" width="100%" role="img">` +
    zorro({ id: `z-${pose}-${expression}`, pose, expression, direction: "der", x: 0, y: 0, scale: 1 }) +
    `</svg>`;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border.light}` }}
           dangerouslySetInnerHTML={{ __html: svg }} />
      <div style={{ fontSize: fontSizes.xs, color: colors.text.muted, marginTop: 4 }}>{expression}</div>
    </div>
  );
}

export default function IlustracionPreview() {
  // Herramienta de desarrollo: en producción no existe. Mismo criterio que el
  // MCP server de next.config.ts — útil para trabajar, no algo que deba quedar
  // colgando en releo.resolvia.online para quien adivine la URL.
  if (process.env.NODE_ENV === "production") notFound();

  const escena = composeScene(
    {
      background: "bosque-dia",
      props: [
        { kind: "arbol", x: 220, y: 620, scale: 1.2, flip: false },
        { kind: "roca", x: 980, y: 660, scale: 0.9, flip: false },
        { kind: "arbol", x: 1080, y: 600, scale: 0.8, flip: true },
      ],
      characters: [
        { ref: "zorro", pose: "sentado", expression: "feliz", direction: "der", x: 520, y: 660, scale: 1.1 },
        { ref: "zorro", pose: "de-pie", expression: "sorprendido", direction: "izq", x: 760, y: 650, scale: 0.95 },
        { ref: "zorro", pose: "acostado", expression: "dormido", direction: "der", x: 330, y: 700, scale: 0.85 },
      ],
    },
    { titulo: "Bosque de día", descripcion: "Tres zorros en un bosque: uno sentado, uno parado y uno durmiendo." }
  );

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.body, background: colors.bg.primary, minHeight: "100vh" }}>
      <h1 style={{ fontFamily: fonts.display, fontSize: fontSizes["2xl"] }}>Sistema de ilustración — preview</h1>

      <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, marginTop: spacing.lg }}>
        Escena compuesta · 3 personajes + 3 props
      </h2>
      <div style={{ maxWidth: 900, border: `1px solid ${colors.border.light}`, borderRadius: 16, overflow: "hidden" }}
           dangerouslySetInnerHTML={{ __html: escena }} />
      <p style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>
        {(escena.length / 1024).toFixed(1)} KB · presupuesto: 25 KB por página
      </p>

      <h2 style={{ fontFamily: fonts.display, fontSize: fontSizes.lg, marginTop: spacing.xl }}>
        Grilla {POSES.length} poses × {EXPRESIONES.length} expresiones = {POSES.length * EXPRESIONES.length}
      </h2>
      {POSES.map((pose) => (
        <div key={pose} style={{ marginBottom: spacing.lg }}>
          <div style={{ fontFamily: fonts.display, fontWeight: "bold", marginBottom: spacing.xs }}>{pose}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${EXPRESIONES.length}, 1fr)`, gap: spacing.sm }}>
            {EXPRESIONES.map((e) => <Celda key={e} pose={pose} expression={e} />)}
          </div>
        </div>
      ))}
      <p style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>Canvas {CANVAS.viewBox}</p>
    </div>
  );
}
