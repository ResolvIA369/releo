#!/usr/bin/env python3
"""
Regenera SOLO las palabras que César marcó como mal pronunciadas en
/dev/audio-review (exportado como JSON: [{id, texto, mundo}, ...]).

USO (cuando haya un JSON exportado — no antes):
    python3 scripts/regenerate-marked-words.py ruta/al/export.json

Qué hace:
  1. Lee el JSON exportado.
  2. Por cada palabra, hace un backup del MP3 actual en
     public/audio/sofia/_backups/<timestamp>/ antes de tocarlo.
  3. Regenera el MP3 con la misma voz y los mismos parámetros que usa
     TODO el resto del audio de la app (scripts/regenerate-all-audio.py):
     es-AR-ElenaNeural, rate=-5%, pitch=+2Hz. Si esto cambiara acá y no
     allá, las 220 palabras dejarían de sonar parejas entre sí.
  4. Si la palabra está en ACCENT_FIXES, sintetiza esa variante en vez
     del texto original (ver nota sobre acentuación abajo).

Sobre "SSML para corregir acentuación" (pedido original, C2):
  edge-tts (esta librería) escapa el texto de entrada antes de mandarlo
  — ver `Communicate.__init__` en edge_tts/communicate.py, línea ~350,
  `escape(remove_incompatible_characters(text))`. Eso significa que NO
  se puede inyectar SSML real (<phoneme>, <emphasis>, etc.): cualquier
  tag que se mande llega escapado y la voz lo lee como texto literal
  ("menor que phoneme mayor que...").

  El único mecanismo que de verdad cambia dónde cae el acento con esta
  voz es escribir la palabra con una tilde ortográfica en la sílaba que
  se quiere forzar, aunque esa tilde no sea gramaticalmente correcta.
  Como el texto acá NUNCA se muestra en pantalla — solo se usa para
  generar el audio — no hay ningún costo en "escribir mal" la palabra
  con ese único fin. Ese es el mecanismo real detrás de ACCENT_FIXES.

  Ejemplo (hipotético, no verificado — hay que escuchar el resultado):
      "banana"  -> si la voz acentúa "banAna" y debería ser "banána":
                   ACCENT_FIXES["banana"] = "banána"

  Cómo se completa este diccionario: después de escuchar el primer
  intento de regeneración de una palabra, si sigue mal, agregar acá la
  variante con tilde forzada y volver a correr el script sólo para esa
  palabra (podés pasar un JSON con un único ítem).

NO CORRAS ESTO TODAVÍA. Es preparación para la Parte C — espera el
JSON real exportado desde /dev/audio-review con las palabras que César
escuchó y marcó.
"""

import asyncio
import json
import os
import shutil
import sys
from datetime import datetime, timezone

import edge_tts

VOICE = "es-AR-ElenaNeural"
RATE = "-5%"
PITCH = "+2Hz"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio", "sofia")
BACKUP_ROOT = os.path.join(AUDIO_DIR, "_backups")

# Completar acá según lo que se escuche en cada intento (ver docstring).
ACCENT_FIXES: dict[str, str] = {
    # "banana": "banána",
}


def mp3_filename(texto: str) -> str:
    return f"palabra-{texto.lower()}.mp3"


def load_marked_words(json_path: str) -> list[dict]:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Se esperaba una lista de {id, texto, mundo}")
    return data


def backup_existing(fn: str, backup_dir: str) -> str | None:
    src = os.path.join(AUDIO_DIR, fn)
    if not os.path.isfile(src):
        return None
    os.makedirs(backup_dir, exist_ok=True)
    dst = os.path.join(backup_dir, fn)
    shutil.copy2(src, dst)
    return dst


async def regenerate_one(texto: str) -> None:
    fn = mp3_filename(texto)
    out = os.path.join(AUDIO_DIR, fn)
    synth_text = ACCENT_FIXES.get(texto.lower(), texto)
    comm = edge_tts.Communicate(synth_text, VOICE, rate=RATE, pitch=PITCH)
    await comm.save(out)


async def main(json_path: str) -> None:
    words = load_marked_words(json_path)
    if not words:
        print("El JSON no tiene palabras marcadas. Nada para hacer.")
        return

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    backup_dir = os.path.join(BACKUP_ROOT, timestamp)

    print(f"{len(words)} palabra(s) a regenerar. Backup en: {backup_dir}\n")

    for item in words:
        texto = item["texto"]
        fn = mp3_filename(texto)
        backed_up = backup_existing(fn, backup_dir)
        override = ACCENT_FIXES.get(texto.lower())
        override_note = f" (usando variante forzada: '{override}')" if override else ""
        try:
            await regenerate_one(texto)
            estado = "✓ regenerada"
        except Exception as e:  # noqa: BLE001 — reporte simple por palabra
            estado = f"✗ ERROR: {e}"
        backup_note = f"backup: {backed_up}" if backed_up else "sin backup (no existía)"
        print(f"  {estado} — {fn}{override_note} — {backup_note}")

    print("\nListo. Revisá escuchando los MP3 regenerados antes de dar por bueno el cambio.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 scripts/regenerate-marked-words.py ruta/al/export.json")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
