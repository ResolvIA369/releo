#!/usr/bin/env python3
"""
Genera los 8 MP3 de "afirmacion-inicio-01..08": la frase que Sofía dice antes
de empezar un juego, en los juegos que hoy no tienen intro propia.

Mismo pipeline y parámetros que regenerate-all-audio.py (la fuente de los 487
MP3 existentes): es-AR-ElenaNeural vía edge-tts, rate=-5%, pitch=+2Hz. No usa
ElevenLabs ni ninguna otra voz.
"""

import asyncio
import os
import edge_tts

VOICE = "es-AR-ElenaNeural"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio", "sofia")

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


async def generate_one(name: str, text: str):
    out = os.path.join(OUT, f"{name}.mp3")
    c = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="+2Hz")
    await c.save(out)
    print(f"  ✓ {name}")


async def main():
    for name, text in TEXTOS.items():
        await generate_one(name, text)


if __name__ == "__main__":
    asyncio.run(main())
