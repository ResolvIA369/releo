#!/usr/bin/env python3
"""
Compara Jessica (voz canónica actual) contra dos candidatas nativas de
español latinoamericano de la Voice Library de ElevenLabs, con material
IDÉNTICO para las tres: las palabras que más fallan con Jessica, cuatro
palabras más de las 47 marcadas por César, una frase larga real del
corpus y una afirmación de sesión real.

SÓLO genera muestras para escuchar y elegir — no toca el corpus de la app
ni la voz canónica. Nada de esto se usa en producción hasta que César
elija.

La key es de solo text_to_speech (no lista ni lee metadata de voces), asi
que los nombres/acentos declarados de las candidatas no se pueden
consultar por API — hay que mirarlos en el sitio de ElevenLabs.

Uso:
    export ELEVENLABS_API_KEY=sk_...        (o dejarla en ~/.elevenlabs-key)
    python3 muestras-voz/muestras-candidatas-latam.py
"""

import asyncio
import importlib.util
import json
import os
import sys
import urllib.error
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
OUT = AQUI  # se guardan junto a este script, en muestras-voz/

API = "https://api.elevenlabs.io/v1"
MODELO = "eleven_v3"

VOCES = {
    "jessica": "cgSgspJ2msm6clMCkdW9",   # voz canónica actual, para comparar contra material identico
    "candA": "0uHpKhb0ymsdvmCtPV8y",     # candidata 1, Voice Library
    "candB": "JddqVF50ZSIR7SRbJE6u",     # candidata 2, Voice Library
}


def leer_key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


KEY = leer_key()


# ─── Emoción y textos: se importan de los scripts de producción para no
# duplicar (y arriesgar que se desincronicen) la tabla de emociones ni el
# texto real del corpus ────────────────────────────────────────────────

def _cargar_modulo(nombre_archivo):
    ruta = os.path.join(RAIZ, "scripts", nombre_archivo)
    spec = importlib.util.spec_from_file_location(nombre_archivo, ruta)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_corpus = _cargar_modulo("regenerate-all-audio.py")
_elevenlabs = _cargar_modulo("regenerate-all-elevenlabs.py")

TEXTO_FRASE_LARGA = _corpus.PHRASES["intro"]
TEXTO_AFIRMACION = _corpus.PHRASES["afirmacion-inicio-01"]
emocion_de = _elevenlabs.emocion_de

# ─── Material de la muestra: identico para las 3 voces ─────────────────
# 1) las 2 palabras que mas fallan con Jessica
# 2) 4 palabras mas de las 47 marcadas por Cesar, elegidas por diversidad
#    fonetica: piyama (prestamo, acento no obvio), hospital (multisilaba
#    larga), tu/tú (par que se distingue solo por tilde), redondo
#    (diptongo + multisilaba)
# 3) una frase larga real del corpus (el intro de sesion)
# 4) una afirmacion de sesion real (afirmacion-inicio-01)
PALABRAS = ["primo", "banana", "piyama", "hospital", "tú", "redondo"]

ITEMS = []
for palabra in PALABRAS:
    tag, estilo, estab = emocion_de(f"palabra-{palabra}")
    ITEMS.append((palabra, palabra, tag, estilo, estab))

tag, estilo, estab = emocion_de("intro")
ITEMS.append(("frase-intro", TEXTO_FRASE_LARGA, tag, estilo, estab))

tag, estilo, estab = emocion_de("afirmacion-inicio-01")
ITEMS.append(("afirmacion", TEXTO_AFIRMACION, tag, estilo, estab))


def generar(voice_id, texto, salida):
    cuerpo = json.dumps({
        "text": texto,
        "model_id": MODELO,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75,
                           "style": 0.5, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{voice_id}?output_format=mp3_44100_192",
        data=cuerpo,
        headers={"xi-api-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        datos = r.read()
    if len(datos) < 800:
        raise RuntimeError(f"respuesta sospechosamente corta ({len(datos)} bytes)")
    with open(salida, "wb") as f:
        f.write(datos)
    return len(datos)


def main():
    total_chars = 0
    hechos = fallados = 0
    print(f"Generando {len(ITEMS)} items x {len(VOCES)} voces = {len(ITEMS) * len(VOCES)} archivos\n")

    for nombre_item, texto, tag, estilo, estab in ITEMS:
        final = f"{tag} {texto}"
        for etiqueta_voz, voice_id in VOCES.items():
            salida = os.path.join(OUT, f"{etiqueta_voz}-{nombre_item}.mp3")
            total_chars += len(final)
            try:
                size = generar(voice_id, final, salida)
                hechos += 1
                print(f"  ✓ {etiqueta_voz}-{nombre_item}.mp3  ({size} bytes, {tag})")
            except urllib.error.HTTPError as e:
                fallados += 1
                print(f"  ✗ {etiqueta_voz}-{nombre_item}.mp3  HTTP {e.code}: {e.reason}")
            except Exception as e:  # noqa: BLE001
                fallados += 1
                print(f"  ✗ {etiqueta_voz}-{nombre_item}.mp3  {e}")

    print(f"\n{hechos} generados, {fallados} fallados")
    print(f"Caracteres totales enviados a la API (con etiqueta de emoción incluida): {total_chars}")
    print("Nota: eleven_v3 no factura 1:1 por caracter en todos los planes — esto es")
    print("el tamaño del texto enviado, no una lectura real de creditos consumidos")
    print("(la key no tiene permiso user_read para consultar el balance de la cuenta).")


if __name__ == "__main__":
    main()
