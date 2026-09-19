#!/usr/bin/env python3
"""
Regenera palabra-el.mp3, palabra-de.mp3 y palabra-tú.mp3 con el método (d):
la palabra dentro de una frase corta en español, recortada por silencio
(ffmpeg) después — sin dejar nada de la frase en el audio final.

Decisión del 19-sep-2026: estas tres NO usan respelling (ver
scripts/respelling-palabras.json). Se probó forzar la tilde ("él", "dé") o
alargar la vocal ("túu") y se descartó — "él" y "dé" son otras palabras
reales del español (y "él" ya existe como palabra propia del corpus, sin
marcar), y alargar "tú" desdibuja el par tú/tu que el chico tiene que
distinguir. La solución es darle a la palabra real (sin alterar) contexto de
frase para que el modelo la lea en español, y quedarnos sólo con esa
palabra.

Reusa el algoritmo de recorte por silencio de
muestras-voz/experimento-idioma-candb.py (con el bug de umbral ya corregido
el 19-sep — antes cortaba fragmentos casi vacíos en palabras sin pausa
detectable a -30dB).

Uso:
    python3 scripts/regenerate-palabras-frase-recorte.py
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    sys.exit("❌ Falta imageio_ffmpeg. Instalar: pip3 install --user --break-system-packages imageio-ffmpeg")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio", "sofia")
BACKUP_ROOT = os.path.join(AUDIO_DIR, "_backups")

API = "https://api.elevenlabs.io/v1"
VOZ_CANDB = "JddqVF50ZSIR7SRbJE6u"
MODELO = "eleven_v3"
TAG_EMOCION = "[gently]"
ESTILO = 0.35
ESTABILIDAD = 0.55

# palabra real -> (frase natural en español, posición de la palabra en la frase)
# posición: "start" | "end" | "middle" (la palabra tiene habla real antes Y
# después dentro de la misma frase — hace falta un silencio detectable de
# cada lado, si no hay margen suficiente entre palabras esto no sirve)
FRASES = {
    "el": ("El perro corre.", "start"),
    "de": ("De pronto, llovió.", "start"),
    "tú": ("Tú puedes hacerlo.", "start"),
    "tu": ("Tu turno llegó.", "start"),
    "silla": ("Silla o mesa.", "start"),
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
        "text": texto,
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


def duracion(path: str) -> float:
    out = subprocess.run([FFMPEG, "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", out)
    if not m:
        raise RuntimeError(f"no pude leer duración de {path}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def silencios(path: str, noise_db=-22, min_dur=0.04) -> list[tuple[float, float]]:
    out = subprocess.run(
        [FFMPEG, "-i", path, "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)", out)]
    return list(zip(starts, ends))


def recortar(path_in: str, path_out: str, start: float, end: float):
    subprocess.run(
        [FFMPEG, "-y", "-i", path_in, "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-c", "copy", path_out],
        capture_output=True, check=True,
    )


DURACION_MINIMA_ESPERADA = 0.15  # por debajo de esto, un recorte casi seguro se comió parte de la palabra


def aislar_palabra(path_frase: str, path_out: str, posicion: str, dur_total: float):
    """Descarta el silencio pegado al borde (arranque/final del archivo) para
    no confundirlo con la pausa real entre la palabra objetivo y el resto.

    PAD=0.12 (subido de 0.06 el 19-sep-2026): con 0.06, "el" y "tú" quedaron
    con el arranque del audio pegado literalmente al inicio del habla (cero
    margen) — cualquier imprecisión de ffmpeg con -c copy corta la primera
    consonante. Con 0.12 queda colchón real de los dos lados.
    """
    pares = silencios(path_frase)
    PAD = 0.12
    BORDE = 0.10

    if posicion == "end":
        contenido = [(s, e) for s, e in pares if e < dur_total - BORDE]
        start = max(0.0, contenido[-1][1] - PAD) if contenido else 0.0
        cola = [(s, e) for s, e in pares if e >= dur_total - BORDE]
        end = min(dur_total, cola[0][0] + PAD) if cola else dur_total
    elif posicion == "start":
        contenido = [(s, e) for s, e in pares if s > BORDE]
        end = min(dur_total, contenido[0][0] + PAD) if contenido else dur_total
        inicio = [(s, e) for s, e in pares if s <= BORDE]
        start = max(0.0, inicio[0][1] - PAD) if inicio else 0.0
    else:  # middle — la palabra tiene habla real antes y después en la
        # misma frase. Necesita al menos 2 pausas "de contenido" (ni
        # pegadas al arranque ni a la cola del archivo): la primera marca
        # el final de la palabra ANTERIOR (arranca la objetivo ahí), la
        # segunda marca el final de la palabra objetivo (empieza la
        # siguiente ahí).
        contenido = [(s, e) for s, e in pares if s > BORDE and e < dur_total - BORDE]
        if len(contenido) < 2:
            raise RuntimeError(
                f"posición 'middle' necesita 2 pausas detectables entre palabras, "
                f"se encontraron {len(contenido)} — no se puede aislar con confianza"
            )
        start = max(0.0, contenido[0][1] - PAD)
        end = min(dur_total, contenido[1][0] + PAD)

    recortar(path_frase, path_out, start, end)

    duracion_recorte = end - start
    if duracion_recorte < DURACION_MINIMA_ESPERADA:
        print(f"  ⚠️  recorte de sólo {duracion_recorte:.2f}s — sospechoso, probablemente se comió parte de la palabra. Revisar a mano.")

    return start, end


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--palabras", help="lista separada por comas (subconjunto de FRASES); por defecto, todas")
    args = p.parse_args()

    if args.palabras:
        pedidas = {w.strip().lower() for w in args.palabras.split(",") if w.strip()}
        desconocidas = pedidas - set(FRASES.keys())
        if desconocidas:
            sys.exit(f"❌ No tienen frase definida en FRASES: {sorted(desconocidas)}")
        frases_a_correr = {k: v for k, v in FRASES.items() if k in pedidas}
    else:
        frases_a_correr = FRASES

    key = leer_key()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    backup_dir = os.path.join(BACKUP_ROOT, f"{ts}-frase-recorte")

    print(f"voice_id a usar: {VOZ_CANDB}  (candB — confirmar contra muestras-voz/muestras-candidatas-latam.py)")
    print(f"Backup en: {backup_dir}\n")

    total_chars = 0
    for palabra, (frase, posicion) in frases_a_correr.items():
        fn = f"palabra-{palabra.lower()}.mp3"
        destino = os.path.join(AUDIO_DIR, fn)

        if os.path.isfile(destino):
            os.makedirs(backup_dir, exist_ok=True)
            shutil.copy2(destino, os.path.join(backup_dir, fn))

        texto_frase = f"{TAG_EMOCION} {frase}"
        total_chars += len(texto_frase)
        frase_tmp = os.path.join(BACKUP_ROOT, f"{ts}-frase-recorte", f"{palabra}-frase-completa.mp3")
        os.makedirs(os.path.dirname(frase_tmp), exist_ok=True)

        try:
            generar(key, texto_frase, frase_tmp)
            dur = duracion(frase_tmp)
            start, end = aislar_palabra(frase_tmp, destino, posicion, dur)
            print(f"  ✓ {fn} — frase: \"{frase}\" — recorte [{start:.2f}s, {end:.2f}s] de {dur:.2f}s "
                  f"(frase completa guardada en {frase_tmp} por si hay que reajustar el corte)")
        except urllib.error.HTTPError as e:
            print(f"  ✗ {fn} HTTP {e.code}: {e.reason}")
        except Exception as e:  # noqa: BLE001
            print(f"  ✗ {fn} {e}")

    print(f"\nCaracteres enviados a la API ({len(frases_a_correr)} frase(s) completa(s)): {total_chars}")


if __name__ == "__main__":
    main()
