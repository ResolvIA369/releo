#!/usr/bin/env python3
"""
Regenera las 8 afirmacion-inicio-01..08.mp3 (afirmación de sesión, ver
SofiaAffirmationGate.tsx) con la voz correcta: Jessica (ElevenLabs), no
edge-tts. Se generaron mal la primera vez (18-sep-2026, motor viejo —
48kbps/24kHz — antes de confirmar que la voz canónica había cambiado a
ElevenLabs el 22-ago). Esto corrige ese error.

Van con Jessica y no con candB (la voz de las 220 palabras) porque son
guía de sesión — la Seño Sofía hablándole al chico — no una palabra que
tiene que leer. Ver CLAUDE.md, sección "Voz de Sofía".

Backup del MP3 anterior (voz vieja) antes de sobrescribir.

Uso:
    python3 scripts/regenerate-afirmaciones-inicio.py
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
# Misma etiqueta que regenerate-all-elevenlabs.py asigna al prefijo "afirmacion-"
TAG_EMOCION = "[warmly]"
ESTILO = 0.65
ESTABILIDAD = 0.40

TEXTOS = {
    "afirmacion-inicio-01": "¿Listo? Repetí conmigo: yo puedo, yo creo en mí, yo soy inteligente.",
    "afirmacion-inicio-02": "¿Listo? Repetí conmigo: me esfuerzo, lo intento, y lo consigo.",
    "afirmacion-inicio-03": "¿Listo? Repetí conmigo: me quiero tal como soy.",
    "afirmacion-inicio-04": "¿Listo? Repetí conmigo: vine al mundo a hacer cosas hermosas.",
    "afirmacion-inicio-05": "¿Listo? Repetí conmigo: si me equivoco, lo intento de nuevo.",
    "afirmacion-inicio-06": "¿Listo? Repetí conmigo: cada día aprendo algo nuevo.",
    "afirmacion-inicio-07": "¿Listo? Repetí conmigo: soy valiente y no me rindo.",
    "afirmacion-inicio-08": "¿Listo? Repetí conmigo: leer me hace grande.",
}


def leer_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


def generar(key: str, texto: str, salida: str) -> int:
    cuerpo = json.dumps({
        "text": f"{TAG_EMOCION} {texto}",
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
    with open(salida, "wb") as f:
        f.write(datos)
    return len(datos)


def main():
    key = leer_key()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    backup_dir = os.path.join(BACKUP_ROOT, f"{ts}-pre-jessica-afirmaciones-inicio")

    total_chars = 0
    hechos = fallados = 0
    print(f"Regenerando {len(TEXTOS)} afirmaciones con Jessica/eleven_v3. Backup en: {backup_dir}\n")

    for nombre, texto in TEXTOS.items():
        fn = f"{nombre}.mp3"
        src = os.path.join(AUDIO_DIR, fn)
        if os.path.isfile(src):
            os.makedirs(backup_dir, exist_ok=True)
            shutil.copy2(src, os.path.join(backup_dir, fn))

        final = f"{TAG_EMOCION} {texto}"
        total_chars += len(final)
        salida = os.path.join(AUDIO_DIR, fn)
        try:
            size = generar(key, texto, salida)
            hechos += 1
            print(f"  ✓ {fn}  ({size} bytes)")
        except urllib.error.HTTPError as e:
            fallados += 1
            print(f"  ✗ {fn}  HTTP {e.code}: {e.reason}")
        except Exception as e:  # noqa: BLE001
            fallados += 1
            print(f"  ✗ {fn}  {e}")

    print(f"\n{hechos} regeneradas, {fallados} fallidas")
    print(f"Caracteres enviados a la API (con etiqueta de emoción incluida): {total_chars}")


if __name__ == "__main__":
    main()
