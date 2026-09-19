#!/usr/bin/env python3
"""
Regenera SOLO las palabras que César marcó como mal pronunciadas en
/dev/audio-review (exportado como JSON: [{id, texto, mundo}, ...]).

USO (cuando haya luz verde para gastar créditos de ElevenLabs — no antes):
    python3 scripts/regenerate-marked-words.py ruta/al/export.json

Qué hace:
  1. Lee el JSON exportado.
  2. Por cada palabra, hace un backup del MP3 actual en
     public/audio/sofia/_backups/<timestamp>/ antes de tocarlo.
  3. Regenera el MP3 con la MISMA voz, modelo y parámetros que el resto
     del audio de la app (scripts/regenerate-all-elevenlabs.py):
     ElevenLabs, voz Jessica (cgSgspJ2msm6clMCkdW9), modelo eleven_v3,
     output 192kbps/44.1kHz, con la etiqueta de emoción "[gently]" que
     ese script asigna a todo lo que empieza con "palabra-" (clara y sin
     adornos — es una palabra Doman, no una frase con carácter).
  4. Si la palabra está en ACCENT_FIXES, sintetiza esa variante en vez
     del texto original (ver nota sobre acentuación abajo).

Sobre por qué NO se construyó de entrada un mecanismo de SSML/fonemas
(pedido original, C2):
  Las 47 palabras marcadas por César ya estaban generadas con esta MISMA
  voz y modelo — no es un desajuste de motor (verificado: las 47 son
  192kbps/44.1kHz, formato Jessica, cero mezcladas con voz vieja). O sea
  que eleven_v3 con una sola pasada mal-acentuó "primo", "banana", etc.
  con su propio criterio de texto plano.

  eleven_v3 sí entiende etiquetas de estilo entre corchetes ([gently],
  [warmly]...) — ESO no es SSML, es una convención propia del modelo que
  ya se usa acá. No hay evidencia de que la API REST simple (la que usa
  este script y regenerate-all-elevenlabs.py) acepte fonemas IPA o
  marcado SSML real; ElevenLabs lo expone en otros productos (Studio,
  cierto tier de voice design) pero no en este endpoint sencillo de
  /v1/text-to-speech.

  Por eso el primer intento acá es simple: volver a pedir la MISMA
  palabra, sin cambios — eleven_v3 no es determinista (stability=0.35
  para "palabra-" deja margen), así que una segunda toma puede salir
  bien sola. ACCENT_FIXES es el plan B, no el A: se completa a mano
  SÓLO si después de escuchar la regeneración simple la palabra sigue
  mal. La variante forzada ahí es escribir la palabra con una tilde no
  ortográfica en la sílaba a marcar (el texto nunca se muestra en
  pantalla, sólo genera audio, así que "escribirla mal" no tiene costo).

  Ejemplo (hipotético — hay que escuchar el resultado real primero):
      "banana"  -> si sigue acentuando "banAna" en vez de "banána":
                   ACCENT_FIXES["banana"] = "banána"

NO CORRAS ESTO TODAVÍA. Espera confirmación de que la ELEVENLABS_API_KEY
a usar es la correcta y de que hay créditos/plan para 47 regeneraciones
(gasto real, a diferencia de --dry-run de regenerate-all-elevenlabs.py).
"""

import json
import os
import shutil
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio", "sofia")
BACKUP_ROOT = os.path.join(AUDIO_DIR, "_backups")

API = "https://api.elevenlabs.io/v1"
VOZ_JESSICA = "cgSgspJ2msm6clMCkdW9"
MODELO = "eleven_v3"
TAG_EMOCION = "[gently]"
ESTILO = 0.35
ESTABILIDAD = 0.55

# Completar acá según lo que se escuche en cada intento (ver docstring).
ACCENT_FIXES: dict[str, str] = {
    # "banana": "banána",
}


def leer_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


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


def regenerate_one(key: str, texto: str) -> int:
    fn = mp3_filename(texto)
    out = os.path.join(AUDIO_DIR, fn)
    synth_text = ACCENT_FIXES.get(texto.lower(), texto)
    cuerpo = json.dumps({
        "text": f"{TAG_EMOCION} {synth_text}",
        "model_id": MODELO,
        "voice_settings": {
            "stability": ESTABILIDAD,
            "similarity_boost": 0.75,
            "style": ESTILO,
            "use_speaker_boost": True,
        },
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{VOZ_JESSICA}?output_format=mp3_44100_192",
        data=cuerpo,
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        datos = r.read()
    if len(datos) < 800:
        raise RuntimeError(f"respuesta sospechosamente corta ({len(datos)} bytes)")
    with open(out, "wb") as f:
        f.write(datos)
    return len(datos)


def main(json_path: str) -> None:
    words = load_marked_words(json_path)
    if not words:
        print("El JSON no tiene palabras marcadas. Nada para hacer.")
        return

    key = leer_key()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    backup_dir = os.path.join(BACKUP_ROOT, timestamp)

    print(f"{len(words)} palabra(s) a regenerar con Jessica/eleven_v3. Backup en: {backup_dir}\n")

    for item in words:
        texto = item["texto"]
        fn = mp3_filename(texto)
        backed_up = backup_existing(fn, backup_dir)
        override = ACCENT_FIXES.get(texto.lower())
        override_note = f" (usando variante forzada: '{override}')" if override else ""
        try:
            size = regenerate_one(key, texto)
            estado = f"✓ regenerada ({size} bytes)"
        except urllib.error.HTTPError as e:
            estado = f"✗ ERROR HTTP {e.code}: {e.reason}"
        except Exception as e:  # noqa: BLE001 — reporte simple por palabra
            estado = f"✗ ERROR: {e}"
        backup_note = f"backup: {backed_up}" if backed_up else "sin backup (no existía)"
        print(f"  {estado} — {fn}{override_note} — {backup_note}")

    print("\nListo. Escuchá los MP3 regenerados antes de dar por bueno el cambio.")
    print("Si alguna sigue mal, completá ACCENT_FIXES para esa palabra y volvé a")
    print("correr el script con un JSON de un solo ítem.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 scripts/regenerate-marked-words.py ruta/al/export.json")
        sys.exit(1)
    main(sys.argv[1])
