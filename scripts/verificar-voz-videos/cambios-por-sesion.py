#!/usr/bin/env python3
"""Para las 44 sesiones de la tanda de Flash (8-ago): qué audios que suenan en
el video cambiaron en public/ desde la versión con la que se armaron (2e21c29),
y confirmación por correlación de que el video tiene esa versión."""
import collections, glob, json, os, subprocess, sys
sys.argv = ["x", "x"]
AQUI = os.path.dirname(os.path.abspath(__file__))
# Reusa pcm() y ncc_max() de comparar-audio.py (todo lo anterior a su main).
exec(open(os.path.join(AQUI, "comparar-audio.py")).read().split("carpeta = sys.argv[1]")[0])

BASE = "2e21c29"
cache = {}


def base_de(rel):
    # 2e21c29 tiene la versión del 8-ago para casi todo; los archivos que
    # todavía no estaban commiteados ahí entraron en el commit que los agregó.
    if subprocess.run(["git", "-C", REPO, "cat-file", "-e", f"{BASE}:{rel}"], capture_output=True).returncode == 0:
        return BASE
    r = subprocess.run(["git", "-C", REPO, "log", "--diff-filter=A", "--format=%h", "--", rel], capture_output=True, text=True)
    return (r.stdout.split() or [None])[-1]


def blob_git(rel):
    b = base_de(rel)
    if not b:
        return None
    r = subprocess.run(["git", "-C", REPO, "rev-parse", f"{b}:{rel}"], capture_output=True, text=True)
    return r.stdout.strip() or None


def blob_actual(rel):
    p = os.path.join(REPO, rel)
    if not os.path.exists(p):
        return None
    return subprocess.run(["git", "hash-object", p], capture_output=True, text=True).stdout.strip()


def cambio(rel):
    if rel not in cache:
        cache[rel] = (blob_git(rel), blob_actual(rel))
    viejo, nuevo = cache[rel]
    return viejo != nuevo, viejo, nuevo


resumen = []
por_audio = collections.defaultdict(list)
for carpeta in sorted(glob.glob("/mnt/e/editor-pro-max/out/releo-tanda/sesion-*")):
    ev = json.load(open(os.path.join(carpeta, "audio-events.json")))
    offset = ev.get("offsetMs", 0) / 1000
    srcs = sorted({e["src"] for e in ev["events"] if e["src"].endswith(".mp3")})
    cambiados = []
    for s in srcs:
        c, v, n = cambio("public" + s)
        if c:
            cambiados.append(s)
            por_audio[s].append(os.path.basename(carpeta))
    # confirmación: primera palabra del video contra la versión BASE
    e = next(x for x in ev["events"] if "/palabra-" in x["src"])
    rel = "public" + e["src"]
    b = subprocess.run(["git", "-C", REPO, "show", f"{base_de(rel)}:{rel}"], capture_output=True).stdout
    ncc = ncc_max(pcm(os.path.join(carpeta, "final.mp4"), ss=max(0, e["t"] / 1000 - offset - 3), t=8), pcm(None, stdin=b))
    resumen.append({"sesion": os.path.basename(carpeta), "audios": len(srcs),
                    "palabras_cambiadas": sum(1 for s in cambiados if "/palabra-" in s),
                    "otros_cambiados": sum(1 for s in cambiados if "/palabra-" not in s),
                    "confirmacion_2e21c29": round(ncc, 3)})
json.dump({"sesiones": resumen, "por_audio": por_audio}, open("cambios.json", "w"), ensure_ascii=False, indent=1)
pal = [s for s in por_audio if "/palabra-" in s]
otros = [s for s in por_audio if "/palabra-" not in s]
print("audios distintos que suenan en los 44 videos y cambiaron:", len(por_audio), "| palabras:", len(pal), "| otros:", len(otros))
print("otros cambiados:", sorted(otros))
print("sesiones con al menos una palabra cambiada:", sum(1 for r in resumen if r["palabras_cambiadas"]))
print("confirmación mín/máx:", min(r["confirmacion_2e21c29"] for r in resumen), max(r["confirmacion_2e21c29"] for r in resumen))
for r in resumen:
    print(r["sesion"], r["audios"], "palabras cambiadas:", r["palabras_cambiadas"], "otros:", r["otros_cambiados"], "conf:", r["confirmacion_2e21c29"])
