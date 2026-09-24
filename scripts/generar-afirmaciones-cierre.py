#!/usr/bin/env python3
"""
Genera las 8 afirmacion-cierre-01..08.mp3 — afirmación que suena al terminar
un juego, DESPUES del video de festejo y ANTES de la despedida (pedido de
César, 23-sep-2026). Mismas 8 frases núcleo que afirmacion-inicio/pregame,
envueltas en un cierre nuevo que no repite el saludo (eso ya lo dice la
despedida después).

Voz Jessica / eleven_v3, misma configuración que
generar-afirmaciones-pregame.py (ver CLAUDE.md, "Voz de Sofía").

Uso:
    python3 scripts/generar-afirmaciones-cierre.py
"""

import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio", "sofia")

API = "https://api.elevenlabs.io/v1"
VOZ_JESSICA = "cgSgspJ2msm6clMCkdW9"
MODELO = "eleven_v3"
TAG_EMOCION = "[warmly]"
ESTILO = 0.65
ESTABILIDAD = 0.40

NUCLEOS = {
    "afirmacion-cierre-01": "yo puedo, yo creo en mí, yo soy inteligente",
    "afirmacion-cierre-02": "me esfuerzo, lo intento, y lo consigo",
    "afirmacion-cierre-03": "me quiero tal como soy",
    "afirmacion-cierre-04": "vine al mundo a hacer cosas hermosas",
    "afirmacion-cierre-05": "si me equivoco, lo intento de nuevo",
    "afirmacion-cierre-06": "cada día aprendo algo nuevo",
    "afirmacion-cierre-07": "soy valiente y no me rindo",
    "afirmacion-cierre-08": "leer me hace grande",
}

TEXTOS = {
    nombre: f"¡Qué bien jugaste! Repetí conmigo: {nucleo}."
    for nombre, nucleo in NUCLEOS.items()
}


def leer_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("Falta la API key. Guardala en ~/.elevenlabs-key")


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
    os.makedirs(AUDIO_DIR, exist_ok=True)
    hechos = fallados = 0
    print(f"Generando {len(TEXTOS)} afirmaciones de cierre con Jessica/eleven_v3.\n")
    for nombre, texto in TEXTOS.items():
        salida = os.path.join(AUDIO_DIR, f"{nombre}.mp3")
        try:
            size = generar(key, texto, salida)
            hechos += 1
            print(f"  OK {nombre}.mp3  ({size} bytes)")
        except urllib.error.HTTPError as e:
            fallados += 1
            print(f"  FAIL {nombre}.mp3  HTTP {e.code}: {e.reason}")
        except Exception as e:  # noqa: BLE001
            fallados += 1
            print(f"  FAIL {nombre}.mp3  {e}")
    print(f"\n{hechos} generadas, {fallados} fallidas")


if __name__ == "__main__":
    main()
