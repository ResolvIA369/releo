#!/usr/bin/env python3
"""Marca audios sospechosos: duración desproporcionada al texto (TTS que alucinó
o se cortó). No borra nada; escribe sospechosos.jsonl para escuchar a mano."""
import json
import os
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))


def dur(ruta):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
                        "-of", "csv=p=0", ruta], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return -1


sos = []
n = 0
for linea in open(os.path.join(AQUI, "manifest.jsonl"), encoding="utf-8"):
    d = json.loads(linea)
    s = dur(os.path.join(AQUI, d["archivo"]))
    n += 1
    palabras = max(1, len(d["texto"].split()))
    # ~2,5 palabras/s narrado; margen amplio + 1,5 s de colchón por etiquetas/pausas
    maximo = palabras / 1.2 + 2.5
    minimo = palabras / 5.0
    if s < 0 or s > maximo or s < minimo:
        sos.append({"id": d["id"], "archivo": d["archivo"], "texto": d["texto"][:80],
                    "segundos": round(s, 2), "palabras": palabras})
with open(os.path.join(AQUI, "sospechosos.jsonl"), "w", encoding="utf-8") as f:
    for x in sos:
        f.write(json.dumps(x, ensure_ascii=False) + "\n")
print(f"{n} revisados, {len(sos)} sospechosos")
