#!/usr/bin/env python3
"""
Runner reanudable de la biblioteca de voz de la Seño Sofía (1-oct-2026).

Lee todas las colas `cola/*.jsonl` (una línea = un audio) y genera lo que falte.
- Salta lo que ya existe en disco (reanudable: se corta y se vuelve a correr).
- Escribe cada MP3 apenas llega y agrega su fila a `manifest.jsonl`.
- Reintenta 429/5xx con espera creciente; un fallo no frena la cola.
- Se detiene solo si ElevenLabs dice que no quedan créditos (quota_exceeded).
- Registra los caracteres cobrados (header `character-cost` / `x-character-count`).

Voces, igual que la app (ver CLAUDE.md, "Voz de Sofía"):
  jessica  cgSgspJ2msm6clMCkdW9  — todo lo que es Sofía hablando
  candb    JddqVF50ZSIR7SRbJE6u  — palabras sueltas que el chico lee

Formato de cada línea de cola:
  {"id","categoria","texto","voz":"jessica|candb","tag","estilo","estab","nivel",
   "archivo": "sofia/refuerzo/refuerzo-001.mp3", "extra": {...opcional}}
  `texto_tts` opcional: lo que se manda a la API si difiere del texto (respelling).

Uso:
    python3 biblioteca-voz/producir.py [--hilos 4] [--solo prefijo-de-cola]
"""

import argparse
import concurrent.futures as cf
import datetime as dt
import glob
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
API = "https://api.elevenlabs.io/v1"
MODELO = "eleven_v3"
VOCES = {"jessica": "cgSgspJ2msm6clMCkdW9", "candb": "JddqVF50ZSIR7SRbJE6u"}
MANIFEST = os.path.join(AQUI, "manifest.jsonl")
CONSUMO = os.path.join(AQUI, "consumo.log")

lock = threading.Lock()
sin_creditos = threading.Event()
totales = {"ok": 0, "fail": 0, "chars": 0, "saltados": 0}


def leer_key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("Falta la API key (~/.elevenlabs-key)")


def generar(key, item):
    voz = VOCES[item.get("voz", "jessica")]
    texto = item.get("texto_tts") or item["texto"]
    tag = item.get("tag") or ""
    cuerpo = json.dumps({
        "text": f"{tag} {texto}".strip(),
        "model_id": MODELO,
        "voice_settings": {
            "stability": item.get("estab", 0.45),
            "similarity_boost": 0.75,
            "style": item.get("estilo", 0.55),
            "use_speaker_boost": True,
        },
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{voz}?output_format=mp3_44100_192",
        data=cuerpo,
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        datos = r.read()
        coste = r.headers.get("character-cost") or r.headers.get("x-character-count")
    if len(datos) < 800:
        raise RuntimeError(f"respuesta corta ({len(datos)} bytes)")
    return datos, int(coste) if coste and coste.isdigit() else len(texto)


def procesar(key, item):
    if sin_creditos.is_set():
        return
    destino = os.path.join(AQUI, item["archivo"])
    if os.path.exists(destino) and os.path.getsize(destino) > 800:
        with lock:
            totales["saltados"] += 1
        return
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    espera = 4
    for intento in range(6):
        try:
            datos, coste = generar(key, item)
            tmp = destino + ".part"
            with open(tmp, "wb") as f:
                f.write(datos)
            os.replace(tmp, destino)
            fila = {
                "id": item["id"], "categoria": item["categoria"], "texto": item["texto"],
                "archivo": item["archivo"], "voice_id": VOCES[item.get("voz", "jessica")],
                "voz": item.get("voz", "jessica"), "model": MODELO, "tag": item.get("tag"),
                "nivel": item.get("nivel"), "caracteres": coste,
                "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
                "status": "OK",
            }
            if item.get("extra"):
                fila["extra"] = item["extra"]
            with lock:
                with open(MANIFEST, "a", encoding="utf-8") as f:
                    f.write(json.dumps(fila, ensure_ascii=False) + "\n")
                totales["ok"] += 1
                totales["chars"] += coste
                if totales["ok"] % 25 == 0:
                    linea = f"{dt.datetime.now():%H:%M:%S} ok={totales['ok']} fail={totales['fail']} chars={totales['chars']}"
                    print(linea, flush=True)
                    with open(CONSUMO, "a") as f:
                        f.write(linea + "\n")
            return
        except urllib.error.HTTPError as e:
            cuerpo = e.read().decode(errors="replace")[:300]
            if "quota_exceeded" in cuerpo or "insufficient" in cuerpo.lower():
                print(f"SIN CRÉDITOS: {cuerpo}", flush=True)
                sin_creditos.set()
                return
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(espera)
                espera = min(espera * 2, 60)
                continue
            error = f"HTTP {e.code}: {cuerpo}"
            break
        except Exception as e:  # noqa: BLE001
            error = str(e)
            time.sleep(espera)
            espera = min(espera * 2, 60)
    with lock:
        totales["fail"] += 1
        with open(os.path.join(AQUI, "errores.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps({"id": item["id"], "archivo": item["archivo"], "error": error,
                                "at": dt.datetime.now().isoformat(timespec="seconds")},
                               ensure_ascii=False) + "\n")
    print(f"FAIL {item['id']}: {error}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hilos", type=int, default=4)
    ap.add_argument("--solo", default="")
    a = ap.parse_args()
    key = leer_key()
    items = []
    for cola in sorted(glob.glob(os.path.join(AQUI, "cola", "*.jsonl"))):
        if a.solo and not os.path.basename(cola).startswith(a.solo):
            continue
        for linea in open(cola, encoding="utf-8"):
            if linea.strip():
                items.append(json.loads(linea))
    print(f"{len(items)} ítems en cola", flush=True)
    with cf.ThreadPoolExecutor(a.hilos) as ex:
        list(ex.map(lambda it: procesar(key, it), items))
    print(f"FIN ok={totales['ok']} fail={totales['fail']} saltados={totales['saltados']} "
          f"chars={totales['chars']} sin_creditos={sin_creditos.is_set()}", flush=True)


if __name__ == "__main__":
    main()
