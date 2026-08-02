// Instrumentación para grabar videos de REleo automáticamente.
//
// Con `?rec=1` en la URL, la app emite por consola un evento cada vez que
// dispara un audio. Un script de Playwright captura esos eventos junto con el
// video, y después ffmpeg reensambla la pista de audio poniendo cada archivo en
// su milisegundo exacto.
//
// POR QUÉ ASÍ Y NO CAPTURANDO EL AUDIO EN VIVO: capturar pantalla+sonido en
// tiempo real (x11grab + PulseAudio) en WSL se desincroniza y dropea frames en
// las animaciones. Como toda la voz de Sofía son 495 MP3 conocidos, es más
// robusto anotar QUÉ suena y CUÁNDO, y armar el audio después. Sincronización
// exacta, sin depender del audio del sistema.
//
// Fuera de modo grabación no hace absolutamente nada: una comparación de
// string por llamada.

/** Tipos de fuente, para poder mezclarlos con volúmenes distintos en post. */
export type RecAudioKind = "voz" | "sfx" | "musica";

export interface RecAudioEvent {
  /** Milisegundos desde que cargó la página (performance.now()). */
  t: number;
  /** Ruta del archivo tal cual la pide el browser, ej "/audio/sofia/hola.mp3". */
  src: string;
  kind: RecAudioKind;
}

let _enabled: boolean | null = null;

/** True si la página se abrió con ?rec=1. Se resuelve una sola vez. */
export function isRecording(): boolean {
  if (_enabled === null) {
    _enabled =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("rec") === "1";
  }
  return _enabled;
}

/**
 * Anota que empezó a sonar un audio. El tiempo es `performance.now()`, o sea
 * milisegundos desde que cargó la página: el grabador correlaciona ese origen
 * con el inicio del video.
 */
export function recAudio(src: string, kind: RecAudioKind = "voz"): void {
  if (!isRecording()) return;
  const event: RecAudioEvent = {
    t: Math.round(performance.now()),
    src,
    kind,
  };
  // Prefijo fijo para que el grabador filtre sin ambigüedad.
  console.log("[REC]" + JSON.stringify(event));
}

/** Hitos del recorrido (arranque, fin de sesión) para poder recortar el video. */
export function recMark(event: string): void {
  if (!isRecording()) return;
  console.log("[REC]" + JSON.stringify({ t: Math.round(performance.now()), mark: event }));
}
