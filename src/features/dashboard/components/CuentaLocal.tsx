"use client";

import { useRef, useState } from "react";
import {
  descargarCopia,
  leerCopia,
  resumirCopia,
  restaurarCopia,
  type ResumenCopia,
} from "@/features/persistence/services/backup";
import { colors, spacing, fonts, fontSizes, radii, shadows } from "@/shared/styles/design-tokens";

type Props = {
  nombreDelPeque: string | null;
  creadoEn: string | null;
  palabras: number;
  sesiones: number;
};

function fechaLinda(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export function CuentaLocal({ nombreDelPeque, creadoEn, palabras, sesiones }: Props) {
  const archivoRef = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [porRestaurar, setPorRestaurar] = useState<{ resumen: ResumenCopia; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const desde = fechaLinda(creadoEn);

  async function guardar() {
    setOcupado(true);
    setAviso(null);
    try {
      await descargarCopia(nombreDelPeque);
      setAviso({ tipo: "ok", texto: "Copia guardada. Mandátela por mail o dejala en Drive." });
    } catch {
      setAviso({ tipo: "error", texto: "No se pudo guardar la copia. Probá de nuevo." });
    } finally {
      setOcupado(false);
    }
  }

  async function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    setAviso(null);
    try {
      const texto = await archivo.text();
      setPorRestaurar({ resumen: resumirCopia(leerCopia(texto)), texto });
    } catch (err) {
      setAviso({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo leer el archivo." });
    }
  }

  async function confirmarRestaurar() {
    if (!porRestaurar) return;
    setOcupado(true);
    try {
      await restaurarCopia(leerCopia(porRestaurar.texto));
      // Recarga en vez de actualizar el estado a mano: media app lee el progreso
      // al montarse y dejarla con lo viejo en pantalla sería peor que esperar.
      location.reload();
    } catch (err) {
      setAviso({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo restaurar." });
      setOcupado(false);
      setPorRestaurar(null);
    }
  }

  return (
    <section
      style={{
        backgroundColor: colors.bg.card,
        borderRadius: radii.xl,
        padding: spacing.lg,
        boxShadow: shadows.sm,
        border: `1px solid ${colors.border.light}`,
        fontFamily: fonts.body,
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
      }}
    >
      <div>
        <h2 style={{ fontSize: fontSizes.lg, fontFamily: fonts.display, color: colors.text.primary, margin: 0 }}>
          La cuenta
        </h2>
        <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, margin: `${spacing.xs}px 0 0` }}>
          REleo no pide mail ni contraseña: todo se guarda en este dispositivo.
        </p>
      </div>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: `${spacing.xs}px ${spacing.md}px`, margin: 0, fontSize: fontSizes.sm }}>
        <dt style={{ color: colors.text.muted }}>Quién juega</dt>
        <dd style={{ margin: 0, color: colors.text.primary, fontWeight: "bold" }}>{nombreDelPeque ?? "—"}</dd>
        {desde && (
          <>
            <dt style={{ color: colors.text.muted }}>Desde</dt>
            <dd style={{ margin: 0, color: colors.text.primary }}>{desde}</dd>
          </>
        )}
        <dt style={{ color: colors.text.muted }}>Aprendido</dt>
        <dd style={{ margin: 0, color: colors.text.primary }}>
          {palabras} {palabras === 1 ? "palabra" : "palabras"} · {sesiones} {sesiones === 1 ? "sesión" : "sesiones"}
        </dd>
        <dt style={{ color: colors.text.muted }}>Guardado en</dt>
        <dd style={{ margin: 0, color: colors.text.primary }}>Este navegador, en este dispositivo</dd>
      </dl>

      <p
        style={{
          fontSize: fontSizes.xs,
          color: "#92400E",
          backgroundColor: "#FFF8E1",
          border: "1px solid #FFD54F",
          borderRadius: radii.lg,
          padding: spacing.sm,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Si borrás los datos del navegador, o querés seguir en otra tablet, el
        progreso no viaja solo. Guardá una copia cada tanto: es un archivo, lo
        podés mandar por mail o dejarlo en Drive.
      </p>

      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
        <button
          onClick={guardar}
          disabled={ocupado}
          style={{
            padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
            backgroundColor: colors.brand.primary, color: "#fff", border: "none",
            fontSize: fontSizes.sm, fontWeight: "bold",
            cursor: ocupado ? "default" : "pointer", opacity: ocupado ? 0.6 : 1,
          }}
        >
          💾 Guardar una copia
        </button>
        <button
          onClick={() => archivoRef.current?.click()}
          disabled={ocupado}
          style={{
            padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
            backgroundColor: colors.bg.secondary, color: colors.text.muted,
            border: `1px solid ${colors.border.light}`,
            fontSize: fontSizes.sm,
            cursor: ocupado ? "default" : "pointer", opacity: ocupado ? 0.6 : 1,
          }}
        >
          ↩️ Restaurar una copia
        </button>
        <input
          ref={archivoRef}
          type="file"
          accept="application/json,.json"
          onChange={elegirArchivo}
          style={{ display: "none" }}
        />
      </div>

      {aviso && (
        <p
          role="status"
          style={{
            margin: 0, fontSize: fontSizes.xs, borderRadius: radii.lg, padding: spacing.sm,
            color: aviso.tipo === "ok" ? "#166534" : "#991B1B",
            backgroundColor: aviso.tipo === "ok" ? "#DCFCE7" : "#FEE2E2",
          }}
        >
          {aviso.texto}
        </p>
      )}

      {porRestaurar && (
        <div
          style={{
            border: `2px solid ${colors.brand.primary}`, borderRadius: radii.lg,
            padding: spacing.md, display: "flex", flexDirection: "column", gap: spacing.sm,
          }}
        >
          <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.text.primary }}>
            La copia es de <strong>{porRestaurar.resumen.nombre ?? "sin nombre"}</strong>,{" "}
            con {porRestaurar.resumen.palabras} palabras y {porRestaurar.resumen.sesiones} sesiones
            {fechaLinda(porRestaurar.resumen.exportadoEn) ? `, del ${fechaLinda(porRestaurar.resumen.exportadoEn)}` : ""}.
          </p>
          <p style={{ margin: 0, fontSize: fontSizes.xs, color: "#991B1B" }}>
            Restaurarla <strong>reemplaza</strong> el progreso que hay ahora en este
            dispositivo. Si el de acá es más nuevo, guardá primero una copia.
          </p>
          <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
            <button
              onClick={confirmarRestaurar}
              disabled={ocupado}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
                backgroundColor: colors.brand.primary, color: "#fff", border: "none",
                fontSize: fontSizes.sm, fontWeight: "bold", cursor: "pointer",
              }}
            >
              Sí, restaurar
            </button>
            <button
              onClick={() => setPorRestaurar(null)}
              disabled={ocupado}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`, borderRadius: radii.lg,
                backgroundColor: "transparent", color: colors.text.muted,
                border: `1px solid ${colors.border.light}`,
                fontSize: fontSizes.sm, cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
