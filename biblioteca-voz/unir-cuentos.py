#!/usr/bin/env python3
"""Une escena-1..N de cada cuento en cuentos/<cuento>/completo.mp3, con 0,8 s
de silencio entre escenas. No gasta créditos; sólo une cuentos con todas sus
escenas presentes según la cola. Saltea los que ya tienen completo.mp3."""
import collections
import glob
import json
import os
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
escenas = collections.defaultdict(dict)
for cola in glob.glob(os.path.join(AQUI, "cola", "7*.jsonl")):
    for linea in open(cola, encoding="utf-8"):
        d = json.loads(linea)
        if d["categoria"] == "cuentos":
            escenas[os.path.dirname(d["archivo"])][d["extra"]["escena"]] = d["archivo"]

hechos = 0
for carpeta, esc in sorted(escenas.items()):
    salida = os.path.join(AQUI, carpeta, "completo.mp3")
    rutas = [os.path.join(AQUI, esc[k]) for k in sorted(esc)]
    if os.path.exists(salida) or not all(os.path.exists(r) for r in rutas):
        continue
    entradas, filtros = [], []
    for i, r in enumerate(rutas):
        entradas += ["-i", r]
        filtros.append(f"[{i}:a]apad=pad_dur=0.8[a{i}]")
    concat = "".join(f"[a{i}]" for i in range(len(rutas)))
    filtro = ";".join(filtros) + f";{concat}concat=n={len(rutas)}:v=0:a=1[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", filtro,
                    "-map", "[out]", "-ac", "1", "-ar", "44100", "-b:a", "192k", salida], check=True)
    hechos += 1
print(f"{hechos} cuentos unidos")
