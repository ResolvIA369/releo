#!/usr/bin/env python3
"""
Genera los MP3 de las 70 frases de "Construye la Frase" (SENTENCE_EXAMPLES +
PHRASE_EXAMPLES de src/shared/constants/words.ts) con la voz de Jessica.

Por qué hace falta: BuildSentence termina cada ronda con sofiaReads(frase), y
sofiaVoice sólo reproduce MP3 (no hay TTS del navegador desde sep-2026). Sin
MP3 la frase quedaba MUDA — en la app y en los videos de YouTube (30-sep-2026).

- La lista sale de words.ts vía Node (nunca una copia a mano).
- Archivos: public/audio/sofia/oracion-<slug>.mp3 (prefijo nuevo: "frase-" ya
  existe y es otra cosa — frases de ánimo).
- Escribe src/shared/constants/oraciones-audio.ts (texto → nombre de MP3), que
  sofiaVoice suma a PHRASE_TO_MP3.
- Voz Jessica, no candB: son frases leídas enteras, no palabras sueltas (ver
  CLAUDE.md, "Voz de Sofía").
- Saltea los MP3 que ya existen (reanudable). --forzar para regenerar.

Uso:
    python3 scripts/regenerate-oraciones.py --dry-run
    python3 scripts/regenerate-oraciones.py
    python3 scripts/regenerate-oraciones.py --solo "mamá come pan,sol y luna"
"""
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio", "sofia")
MAPA_TS = os.path.join(ROOT, "src", "shared", "constants", "oraciones-audio.ts")

API = "https://api.elevenlabs.io/v1"
VOZ_JESSICA = "cgSgspJ2msm6clMCkdW9"
MODELO = "eleven_v3"
# Sin etiqueta de emoción y con estabilidad alta. Con "[gently]" (0.40/0.55)
# 23 de 70 frases salían con pausas de 0,5 a 1,1 s en el medio ("perro… y…
# gato"), medidas con silencedetect; así bajan a < 0,5 s (30-sep-2026).
TAG = ""
ESTILO = 0.30
ESTABILIDAD = 0.70


def leer_key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


def cargar_frases():
    """Las frases reales, leídas de words.ts con tsx (misma fuente que la app)."""
    codigo = (
        'import { SENTENCE_EXAMPLES, PHRASE_EXAMPLES } from "@/shared/constants";'
        "console.log(JSON.stringify([...SENTENCE_EXAMPLES, ...PHRASE_EXAMPLES].map(s => s.fullText)));"
    )
    tmp = os.path.join(ROOT, "_oraciones_tmp.ts")
    open(tmp, "w").write(codigo)
    try:
        out = subprocess.run(["npx", "tsx", "--tsconfig", "tsconfig.json", tmp],
                             cwd=ROOT, capture_output=True, text=True, check=True).stdout
    finally:
        os.remove(tmp)
    frases = json.loads(out.strip().splitlines()[-1])
    return list(dict.fromkeys(frases))  # sin duplicados, en orden


def slug(texto):
    s = unicodedata.normalize("NFD", texto.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def texto_para_tts(frase):
    # Mayúscula inicial y punto final: el modelo la lee como oración entera,
    # con entonación de cierre, en vez de como lista de palabras.
    return f"{TAG} {frase[0].upper()}{frase[1:]}.".strip()


def generar(key, texto, salida, reintentos=3):
    cuerpo = json.dumps({
        "text": texto,
        "model_id": MODELO,
        "voice_settings": {"stability": ESTABILIDAD, "similarity_boost": 0.75,
                           "style": ESTILO, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{VOZ_JESSICA}?output_format=mp3_44100_192",
        data=cuerpo, headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    for intento in range(reintentos):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                datos = r.read()
            if len(datos) < 800:
                raise RuntimeError(f"respuesta sospechosamente corta ({len(datos)} bytes)")
            open(salida, "wb").write(datos)
            return len(datos)
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < reintentos - 1:
                time.sleep(5 * (intento + 1))
                continue
            if e.code in (401, 402):
                sys.exit(f"❌ ElevenLabs {e.code}: sin permiso o sin créditos.")
            raise
        except Exception:
            if intento < reintentos - 1:
                time.sleep(3)
                continue
            raise


def escribir_mapa(frases):
    lineas = [
        "// GENERADO por scripts/regenerate-oraciones.py — no editar a mano.",
        "// Frase de Construye la Frase → MP3 en public/audio/sofia (voz Jessica).",
        "// sofiaVoice.ts lo suma a PHRASE_TO_MP3 para que sofiaReads() la encuentre.",
        "export const ORACIONES_AUDIO: Record<string, string> = {",
    ]
    for f in frases:
        lineas.append(f"  {json.dumps(f, ensure_ascii=False)}: \"oracion-{slug(f)}\",")
    lineas.append("};")
    open(MAPA_TS, "w").write("\n".join(lineas) + "\n")


def main():
    dry = "--dry-run" in sys.argv
    forzar = "--forzar" in sys.argv
    frases = cargar_frases()
    if "--solo" in sys.argv:
        pedidas = set(sys.argv[sys.argv.index("--solo") + 1].split(","))
        objetivo = [f for f in frases if f in pedidas]
    else:
        objetivo = frases

    slugs = [slug(f) for f in frases]
    if len(set(slugs)) != len(slugs):
        sys.exit("❌ Dos frases dan el mismo nombre de archivo.")

    print(f"{len(frases)} frases en words.ts · {len(objetivo)} a procesar")
    if dry:
        for f in objetivo:
            print(f"  oracion-{slug(f)}.mp3  ←  {texto_para_tts(f)}")
        return

    key = leer_key()
    hechas = salteadas = 0
    for f in objetivo:
        salida = os.path.join(AUDIO_DIR, f"oracion-{slug(f)}.mp3")
        if os.path.exists(salida) and not forzar:
            salteadas += 1
            continue
        n = generar(key, texto_para_tts(f), salida)
        print(f"  ✅ oracion-{slug(f)}.mp3  {n // 1024} KB  «{f}»")
        hechas += 1
    escribir_mapa(frases)
    faltan = [f for f in frases if not os.path.exists(os.path.join(AUDIO_DIR, f"oracion-{slug(f)}.mp3"))]
    print(f"\n{hechas} generadas · {salteadas} ya estaban · mapa → {os.path.relpath(MAPA_TS, ROOT)}")
    if faltan:
        print(f"⚠️  {len(faltan)} frases del mapa sin MP3 todavía: {faltan[:5]}")


if __name__ == "__main__":
    main()
