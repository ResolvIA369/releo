import { openDB } from "idb";
import {
  DB_NAME,
  DB_VERSION,
  SESSIONS_STORE,
  PROFILES_STORE,
  PROGRESS_STORE,
  REVIEW_STORE,
} from "./db";

// Copia de seguridad del progreso.
//
// Todo lo que REleo sabe de un peque vive en el navegador: cuatro almacenes de
// IndexedDB más un par de claves de localStorage. No hay servidor ni cuenta, así
// que si se borran los datos del navegador o se cambia de dispositivo, se pierde
// todo y no hay de dónde recuperarlo. Esto es esa vía de recuperación.

const CLAVES_LOCALES = [
  "doman-coins",             // monedas ganadas
  "doman-store-purchases",   // lo comprado en la tienda
  "doman-dark-mode",         // preferencia de tema
] as const;

export const FORMATO_ACTUAL = 1;

export type Copia = {
  app: "releo";
  formato: number;
  exportadoEn: string;
  perfil: unknown[];
  progreso: unknown[];
  sesiones: unknown[];
  repaso: unknown[];
  locales: Record<string, string>;
};

export type ResumenCopia = {
  nombre: string | null;
  palabras: number;
  sesiones: number;
  exportadoEn: string;
};

function db() {
  return openDB(DB_NAME, DB_VERSION);
}

/** Junta todo lo guardado en este navegador en un solo objeto. */
export async function armarCopia(): Promise<Copia> {
  const base = await db();
  const [perfil, progreso, sesiones, repaso] = await Promise.all([
    base.getAll(PROFILES_STORE),
    base.getAll(PROGRESS_STORE),
    base.getAll(SESSIONS_STORE),
    base.getAll(REVIEW_STORE),
  ]);

  const locales: Record<string, string> = {};
  for (const clave of CLAVES_LOCALES) {
    const valor = localStorage.getItem(clave);
    if (valor !== null) locales[clave] = valor;
  }

  return {
    app: "releo",
    formato: FORMATO_ACTUAL,
    exportadoEn: new Date().toISOString(),
    perfil,
    progreso,
    sesiones,
    repaso,
    locales,
  };
}

/** Nombre de archivo legible: releo-sofia-2026-08-22.json */
export function nombreDeArchivo(nombreDelPeque: string | null): string {
  const limpio = (nombreDelPeque ?? "progreso")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const hoy = new Date().toISOString().slice(0, 10);
  return `releo-${limpio || "progreso"}-${hoy}.json`;
}

/** Dispara la descarga del archivo en el navegador. */
export async function descargarCopia(nombreDelPeque: string | null): Promise<void> {
  const copia = await armarCopia();
  const blob = new Blob([JSON.stringify(copia, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreDeArchivo(nombreDelPeque);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Sin esto el blob queda en memoria hasta que se cierre la pestaña.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Revisa que el archivo sea una copia de REleo y no cualquier JSON. */
export function leerCopia(texto: string): Copia {
  let dato: unknown;
  try {
    dato = JSON.parse(texto);
  } catch {
    throw new Error("El archivo no es una copia de REleo (no se pudo leer).");
  }
  const c = dato as Partial<Copia>;
  if (!c || c.app !== "releo") {
    throw new Error("Ese archivo no es una copia de REleo.");
  }
  if (typeof c.formato !== "number" || c.formato > FORMATO_ACTUAL) {
    throw new Error(
      "La copia se hizo con una versión más nueva de REleo. Actualizá la app y probá de nuevo.",
    );
  }
  if (!Array.isArray(c.perfil) || !Array.isArray(c.progreso)) {
    throw new Error("La copia está incompleta o dañada.");
  }
  return c as Copia;
}

/** Qué hay adentro de una copia, para mostrarlo antes de restaurar. */
export function resumirCopia(copia: Copia): ResumenCopia {
  const perfil = copia.perfil[0] as { childName?: string } | undefined;
  const progreso = copia.progreso[0] as { wordsMastered?: unknown[] } | undefined;
  return {
    nombre: perfil?.childName ?? null,
    palabras: progreso?.wordsMastered?.length ?? 0,
    sesiones: copia.sesiones?.length ?? 0,
    exportadoEn: copia.exportadoEn,
  };
}

/**
 * Reemplaza lo que haya en este navegador por el contenido de la copia.
 *
 * Es un reemplazo y no una fusión a propósito: mezclar dos progresos del mismo
 * chico daría rachas y sesiones que nunca ocurrieron. Quien restaura quiere
 * volver a un punto conocido, no sumar dos historias.
 */
export async function restaurarCopia(copia: Copia): Promise<void> {
  const base = await db();

  const tx = base.transaction(
    [PROFILES_STORE, PROGRESS_STORE, SESSIONS_STORE, REVIEW_STORE],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore(PROFILES_STORE).clear(),
    tx.objectStore(PROGRESS_STORE).clear(),
    tx.objectStore(SESSIONS_STORE).clear(),
    tx.objectStore(REVIEW_STORE).clear(),
  ]);
  for (const registro of copia.perfil) await tx.objectStore(PROFILES_STORE).put(registro);
  for (const registro of copia.progreso) await tx.objectStore(PROGRESS_STORE).put(registro);
  for (const registro of copia.sesiones ?? []) await tx.objectStore(SESSIONS_STORE).put(registro);
  for (const registro of copia.repaso ?? []) await tx.objectStore(REVIEW_STORE).put(registro);
  await tx.done;

  for (const clave of CLAVES_LOCALES) {
    const valor = copia.locales?.[clave];
    if (valor === undefined) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  }
}
