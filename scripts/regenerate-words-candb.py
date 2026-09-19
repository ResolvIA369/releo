#!/usr/bin/env python3
"""
Regenera palabra-*.mp3 (las 220 palabras que el chico lee) con candB
(ElevenLabs, Voice Library), la voz elegida el 19-sep-2026 para esa
función específica. Reemplaza a scripts/regenerate-marked-words.py, que
apuntaba a Jessica — ya no corresponde: desde esta fecha las palabras
sueltas y el resto del audio (frases, reglas, afirmaciones) usan voces
distintas a propósito. Ver CLAUDE.md, sección "Voz de Sofía".

USO:
    # Lista explícita de palabras (para la muestra inicial, o para re-tomar
    # una puntual después de escucharla):
    python3 scripts/regenerate-words-candb.py --palabras primo,banana,piyama

    # Todas las 220 palabras reales de la app (deriva la lista de
    # src/shared/constants/words.ts vía node, no del disco — así NO
    # incluye los 7 archivos huérfanos que quedaron de un currículum
    # viejo: autos, café, calcetín, chaqueta, falda, morado, pijama):
    python3 scripts/regenerate-words-candb.py --todas

    # Todas MENOS las que ya se hicieron en una tanda anterior:
    python3 scripts/regenerate-words-candb.py --todas --excluir primo,banana,...

    # Desde un JSON exportado de /dev/audio-review ([{id,texto,mundo},...]):
    python3 scripts/regenerate-words-candb.py --json ruta/al/export.json

Qué hace:
  1. Por cada palabra, backup del MP3 actual en
     public/audio/sofia/_backups/<timestamp>-candB/ antes de sobrescribir
     (además del backup completo de las 220 hecho antes de la primera
     corrida — este es redundante a propósito, mejor backup de más).
  2. Regenera con candB, eleven_v3, 192kbps/44.1kHz, la misma etiqueta de
     emoción "[gently]" que usa hoy el corpus para "palabra-*"
     (regenerate-all-elevenlabs.py, prefijo "palabra-").
  3. Si la palabra está en respelling-palabras.json, sintetiza esa variante
     fonética en vez del texto real (decisión del 19-sep-2026, ver CLAUDE.md
     "Voz de Sofía > Respelling fonético") — el respelling NUNCA se muestra
     en pantalla, sólo se usa para generar el MP3.
  4. Imprime caracteres totales enviados a la API.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio", "sofia")
BACKUP_ROOT = os.path.join(AUDIO_DIR, "_backups")
WORDS_TS = os.path.join(ROOT, "src", "shared", "constants", "words.ts")

API = "https://api.elevenlabs.io/v1"
VOZ_CANDB = "JddqVF50ZSIR7SRbJE6u"  # candB — confirmado contra muestras-voz/muestras-candidatas-latam.py
MODELO = "eleven_v3"
TAG_EMOCION = "[gently]"
ESTILO = 0.35
ESTABILIDAD = 0.55

RESPELLING_JSON = os.path.join(ROOT, "scripts", "respelling-palabras.json")


def cargar_respelling() -> dict[str, str]:
    """
    Fuente única del respelling fonético — la misma que consume el test
    src/shared/__tests__/audio-respelling-integrity.test.ts para garantizar
    que esto nunca se filtre a la UI. No duplicar esta tabla a mano acá.
    """
    if not os.path.exists(RESPELLING_JSON):
        return {}
    with open(RESPELLING_JSON, encoding="utf-8") as f:
        d = json.load(f)
    d.pop("_comentario", None)
    return d


RESPELLING = cargar_respelling()

# Extrae los objetos { text: "...", category: ... } de words.ts vía node,
# en vez de mantener una copia estática que se puede desincronizar del
# currículum real. Devuelve la lista de las 220 palabras reales, en orden.
_NODE_EXTRACT = r"""
const fs = require('fs');
const src = fs.readFileSync(process.argv[1], 'utf-8');
const re = /\{ text: "([^"]+)", category:/g;
const words = [];
let m;
while ((m = re.exec(src))) words.push(m[1]);
console.log(JSON.stringify(words));
"""


def cargar_220_reales() -> list[str]:
    out = subprocess.run(
        ["node", "-e", _NODE_EXTRACT, WORDS_TS],
        capture_output=True, text=True, check=True,
    )
    words = json.loads(out.stdout)
    if len(words) != 220:
        sys.exit(f"❌ Se esperaban 220 palabras, se extrajeron {len(words)}. Revisá el regex contra words.ts.")
    return words


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


def backup_existing(fn: str, backup_dir: str) -> str | None:
    src = os.path.join(AUDIO_DIR, fn)
    if not os.path.isfile(src):
        return None
    os.makedirs(backup_dir, exist_ok=True)
    dst = os.path.join(backup_dir, fn)
    shutil.copy2(src, dst)
    return dst


def generar(key: str, texto: str, salida: str) -> int:
    synth_text = RESPELLING.get(texto.lower(), texto)
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
        f"{API}/text-to-speech/{VOZ_CANDB}?output_format=mp3_44100_192",
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


def resolver_lista(args) -> list[str]:
    if args.json:
        with open(args.json, encoding="utf-8") as f:
            data = json.load(f)
        return [item["texto"] for item in data]
    if args.todas:
        todas = cargar_220_reales()
        if args.excluir:
            excluidas = {w.strip().lower() for w in args.excluir.split(",")}
            todas = [w for w in todas if w.lower() not in excluidas]
        return todas
    if args.palabras:
        return [w.strip() for w in args.palabras.split(",") if w.strip()]
    sys.exit("Usá --palabras, --todas o --json. Ver --help.")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--palabras", help="lista separada por comas, ej: primo,banana,piyama")
    p.add_argument("--todas", action="store_true", help="las 220 palabras reales de la app")
    p.add_argument("--excluir", help="con --todas: lista separada por comas a saltear")
    p.add_argument("--json", help="ruta a un export de /dev/audio-review ([{id,texto,mundo},...])")
    args = p.parse_args()

    palabras = resolver_lista(args)
    if not palabras:
        print("Nada para regenerar.")
        return

    key = leer_key()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    backup_dir = os.path.join(BACKUP_ROOT, f"{ts}-candB")

    print(f"voice_id a usar: {VOZ_CANDB}  (candB — confirmar contra muestras-voz/muestras-candidatas-latam.py antes de correr)")
    print(f"{len(palabras)} palabra(s) a regenerar con candB/eleven_v3. Backup en: {backup_dir}\n")

    total_chars = 0
    hechos = fallados = 0
    for texto in palabras:
        fn = mp3_filename(texto)
        backed_up = backup_existing(fn, backup_dir)
        override = RESPELLING.get(texto.lower())
        override_note = f" (variante forzada: '{override}')" if override else ""
        final = f"{TAG_EMOCION} {RESPELLING.get(texto.lower(), texto)}"
        total_chars += len(final)
        salida = os.path.join(AUDIO_DIR, fn)
        try:
            size = generar(key, texto, salida)
            hechos += 1
            estado = f"✓ regenerada ({size} bytes)"
        except urllib.error.HTTPError as e:
            fallados += 1
            estado = f"✗ ERROR HTTP {e.code}: {e.reason}"
        except Exception as e:  # noqa: BLE001
            fallados += 1
            estado = f"✗ ERROR: {e}"
        backup_note = f"backup: {backed_up}" if backed_up else "sin backup (no existía)"
        print(f"  {estado} — {fn}{override_note} — {backup_note}")

    print(f"\n{hechos} regeneradas, {fallados} fallidas")
    print(f"Caracteres enviados a la API (con etiqueta de emoción incluida): {total_chars}")


if __name__ == "__main__":
    main()
