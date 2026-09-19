#!/usr/bin/env python3
"""
Muestras de voz de ElevenLabs para elegir la nueva Seño Sofía.

SÓLO genera muestras para decidir — no regenera la app. Gasta unos 900 de los
10.000 créditos mensuales del plan gratuito.

OJO con la licencia: el plan gratuito de ElevenLabs NO da derechos comerciales
y exige atribución. Estas muestras son para escuchar y elegir, nada más. Para
generar los 495 audios de la app hace falta el plan Starter (USD 6, un mes,
cancelable), que sí incluye licencia comercial.

Las etiquetas habladas ("Opción uno...") se generan con edge-tts, que es
gratis: no tiene sentido quemar créditos de ElevenLabs en eso.

Uso:
    export ELEVENLABS_API_KEY=sk_...        (o dejarla en ~/.elevenlabs-key)
    python3 muestras-elevenlabs.py
    python3 muestras-elevenlabs.py --voces 8      # más opciones, más créditos
"""

import asyncio
import json
import os
import subprocess
import sys
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
FFMPEG = "/home/cesar/resolvia/editor-pro-max/node_modules/ffmpeg-static/ffmpeg"
API = "https://api.elevenlabs.io/v1"

# La misma frase que se usó para comparar las voces de Edge, para que la
# comparación sea justa: saludo + palabra Doman + felicitación.
FRASE = ("¡Hola, mi pequeño genio! Soy la Seño Sofía. "
         "Hoy vamos a descubrir palabras mágicas juntos. "
         "Mirá bien... mamá. ¡Muy bien! Sos increíble.")

N_VOCES = 6
for i, a in enumerate(sys.argv):
    if a == "--voces" and i + 1 < len(sys.argv):
        N_VOCES = int(sys.argv[i + 1])


def leer_key():
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if key:
        return key
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    print("❌ Falta la API key de ElevenLabs.\n")
    print("   Sacala en https://elevenlabs.io → tu avatar → API Keys, y después:")
    print("     echo 'sk_tu_key' > ~/.elevenlabs-key\n")
    sys.exit(1)


KEY = leer_key()


def get(path):
    req = urllib.request.Request(f"{API}{path}", headers={"xi-api-key": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def tts(voice_id, texto, modelo, salida):
    body = json.dumps({
        "text": texto,
        "model_id": modelo,
        # style alto + stability media = más expresividad, que es justo lo que
        # falta en las voces de Edge.
        "voice_settings": {"stability": 0.40, "similarity_boost": 0.75,
                           "style": 0.55, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=body,
        headers={"xi-api-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        open(salida, "wb").write(r.read())


async def etiqueta_edge(texto, salida):
    import edge_tts
    await edge_tts.Communicate(texto, "es-MX-JorgeNeural").save(salida)


def main():
    # ─── Modelo ──────────────────────────────────────────────────────────
    # eleven_v3 es el más expresivo y acepta etiquetas de emoción en el texto.
    # Verificado contra esta cuenta: responde 200.
    # Se prefiere el multilingüe más nuevo; suelen ser los más expresivos.
    modelo = "eleven_v3"
    print(f"Modelo: {modelo}\n")

    # ─── Voces ───────────────────────────────────────────────────────────
    # La key sólo tiene permiso de text_to_speech (sin voices_read), así que no
    # se puede listar el catálogo: se usan los IDs de las voces predefinidas,
    # ya verificadas una por una contra esta cuenta. Las que faltan (Rachel,
    # Aria, Charlotte, Domi, Elli) devuelven 402: piden plan pago.
    elegidas = [
        {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah",   "labels": {"description": "suave y cercana"}},
        {"voice_id": "XrExE9yKIg1WjnnlVkGX", "name": "Matilda", "labels": {"description": "cálida, tono de cuento"}},
        {"voice_id": "pFZP5JQG7iQjIQuC4Bku", "name": "Lily",    "labels": {"description": "joven y dulce"}},
        {"voice_id": "Xb7hH8MSUJpSbSDYk0k2", "name": "Alice",   "labels": {"description": "clara y confiada"}},
        {"voice_id": "FGY2WhTYpPnrIDTdsKH5", "name": "Laura",   "labels": {"description": "animada, juvenil"}},
        {"voice_id": "cgSgspJ2msm6clMCkdW9", "name": "Jessica", "labels": {"description": "expresiva"}},
    ][:N_VOCES]
    voces, fem = elegidas, elegidas

    print(f"Voces verificadas en la cuenta: {len(elegidas)}")
    print(f"Se generan {len(elegidas)} muestras · ~{len(elegidas) * len(FRASE)} créditos "
          f"de los 10.000 mensuales\n")

    partes = []
    for i, v in enumerate(elegidas, 1):
        lab = (v.get("labels") or {})
        desc = ", ".join(x for x in [lab.get("accent"), lab.get("description"), lab.get("age")] if x)
        nombre = v["name"]
        print(f"  {i}. {nombre:<18} {desc}")

        etq = os.path.join(AQUI, f".el-etq-{i}.mp3")
        mue = os.path.join(AQUI, f"el-{i}-{nombre.lower().replace(' ', '-')}.mp3")
        asyncio.run(etiqueta_edge(f"Opción {i}. {nombre}. {desc}", etq))
        try:
            tts(v["voice_id"], FRASE, modelo, mue)
        except Exception as e:
            print(f"     ⚠️  falló: {e}")
            os.remove(etq)
            continue
        partes += [etq, mue]

    if not partes:
        print("\n❌ No se generó ninguna muestra.")
        sys.exit(1)

    lista = os.path.join(AQUI, ".el-lista.txt")
    with open(lista, "w", encoding="utf-8") as f:
        for p in partes:
            f.write(f"file '{p}'\n")

    final = os.path.join(AQUI, "comparacion-elevenlabs.mp3")
    subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lista,
                    "-c:a", "libmp3lame", "-b:a", "128k", final],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for p in partes:
        if os.path.basename(p).startswith(".el-etq-"):
            os.remove(p)
    os.remove(lista)

    # ─── Créditos ────────────────────────────────────────────────────────
    try:
        sub = get("/user/subscription")
        usados = sub.get("character_count")
        tope = sub.get("character_limit")
        if usados is not None:
            print(f"\nCréditos usados: {usados:,} de {tope:,}")
    except Exception:
        pass

    print(f"\n✅ {final}")


main()
