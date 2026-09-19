#!/usr/bin/env python3
"""
Genera muestras de voz para elegir la nueva Seño Sofía.

Deja un solo MP3 (comparacion-voces.mp3) con todas las opciones seguidas, cada
una anunciada, para poder compararlas de corrido en vez de abrir 8 archivos.
También deja cada muestra suelta por si se quiere volver a una.

Por qué se prueban voces "en-US-...Multilingual": son las ÚNICAS que Edge marca
como expresivas. Las 23 voces es-* (incluida la Elena actual) están todas
etiquetadas apenas como Friendly/Positive. Las multilingües hablan español; lo
que hay que escuchar es si les queda acento.

Todo esto es gratis: edge-tts no lleva API key ni cobra.
"""

import asyncio
import os
import subprocess
import edge_tts

AQUI = os.path.dirname(os.path.abspath(__file__))
FFMPEG = "/home/cesar/resolvia/editor-pro-max/node_modules/ffmpeg-static/ffmpeg"

# Frase de prueba: saludo (calidez) + una palabra Doman + felicitación.
# Es lo que más se repite en la app, así que es lo que hay que juzgar.
TUTEO = ("¡Hola, mi pequeño genio! Soy la Seño Sofía. "
         "Hoy vamos a descubrir palabras mágicas juntos. "
         "Mira bien... mamá. ¡Muy bien! Eres increíble.")

VOSEO = ("¡Hola, mi pequeño genio! Soy la Seño Sofía. "
         "Hoy vamos a descubrir palabras mágicas juntos. "
         "Mirá bien... mamá. ¡Muy bien! Sos increíble.")

# (id, voz, texto, etiqueta hablada)
OPCIONES = [
    ("1-elena-actual",   "es-AR-ElenaNeural",              TUTEO, "Opción uno. Elena. Es la voz que tenés hoy."),
    ("2-ava",            "en-US-AvaMultilingualNeural",    TUTEO, "Opción dos. Ava. Etiquetada como expresiva y cariñosa."),
    ("3-emma",           "en-US-EmmaMultilingualNeural",   TUTEO, "Opción tres. Emma. Alegre y conversacional."),
    ("4-dalia",          "es-MX-DaliaNeural",              TUTEO, "Opción cuatro. Dalia. Mexicana."),
    ("5-salome",         "es-CO-SalomeNeural",             TUTEO, "Opción cinco. Salomé. Colombiana."),
    ("6-valentina",      "es-UY-ValentinaNeural",          TUTEO, "Opción seis. Valentina. Uruguaya, la más parecida al acento argentino."),
    ("7-ximena",         "es-ES-XimenaNeural",             TUTEO, "Opción siete. Ximena."),
    ("8-ava-voseo",      "en-US-AvaMultilingualNeural",    VOSEO, "Opción ocho. Ava otra vez, pero con voseo argentino, para escuchar la diferencia."),
]

# Voz neutra para anunciar cada opción, distinta de las que se comparan.
VOZ_ETIQUETA = "es-MX-JorgeNeural"


async def decir(texto, voz, salida, rate="+0%", pitch="+0Hz"):
    com = edge_tts.Communicate(texto, voz, rate=rate, pitch=pitch)
    await com.save(salida)


async def main():
    partes = []
    for oid, voz, texto, etiqueta in OPCIONES:
        etq = os.path.join(AQUI, f".etq-{oid}.mp3")
        mue = os.path.join(AQUI, f"{oid}.mp3")

        await decir(etiqueta, VOZ_ETIQUETA, etq)
        # Mismo rate/pitch que usa la app para las frases largas de Sofía.
        await decir(texto, voz, mue, rate="-10%", pitch="+8Hz")

        print(f"  ✓ {oid:<18} {voz}")
        partes += [etq, mue]

    # Un solo archivo para escuchar de corrido.
    lista = os.path.join(AQUI, ".lista.txt")
    with open(lista, "w", encoding="utf-8") as f:
        for p in partes:
            f.write(f"file '{p}'\n")

    final = os.path.join(AQUI, "comparacion-voces.mp3")
    subprocess.run(
        [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lista,
         "-c:a", "libmp3lame", "-b:a", "128k", final],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    for p in partes:
        if os.path.basename(p).startswith(".etq-"):
            os.remove(p)
    os.remove(lista)

    print(f"\n✅ {final}")


asyncio.run(main())
