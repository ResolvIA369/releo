import json, glob, os, subprocess, statistics, sys
sys.argv = ["x", "x"]
AQUI = os.path.dirname(os.path.abspath(__file__))
# Reusa pcm() y ncc_max() de comparar-audio.py (todo lo anterior a su main).
exec(open(os.path.join(AQUI, "comparar-audio.py")).read().split("carpeta = sys.argv[1]")[0])
cache = {}
def base_de(rel):
    if subprocess.run(["git","-C",REPO,"cat-file","-e",f"2e21c29:{rel}"],capture_output=True).returncode == 0: return "2e21c29"
    return subprocess.run(["git","-C",REPO,"log","--diff-filter=A","--format=%h","--",rel],capture_output=True,text=True).stdout.split()[-1]
def durs(rel):
    if rel not in cache:
        old = len(pcm(None, stdin=subprocess.run(["git","-C",REPO,"show",f"{base_de(rel)}:{rel}"],capture_output=True).stdout)) / SR
        new = len(pcm(os.path.join(REPO, rel))) / SR
        cache[rel] = (old, new)
    return cache[rel]
pisa, deltas = [], []
for c in sorted(glob.glob("/mnt/e/editor-pro-max/out/releo-tanda/sesion-*")):
    ev = json.load(open(c + "/audio-events.json"))["events"]
    for i, e in enumerate(ev):
        if "/palabra-" not in e["src"]: continue
        old, new = durs("public" + e["src"])
        deltas.append(new - old)
        nxt = next((x["t"] for x in ev[i+1:]), None)
        hueco = (nxt - e["t"]) / 1000 if nxt else 99
        if new > hueco - 0.05: pisa.append((os.path.basename(c), e["src"].split("palabra-")[1], round(old,2), round(new,2), round(hueco,2)))
print("palabras-evento:", len(deltas), "| nueva-vieja: media", round(statistics.mean(deltas),2), "s · min", round(min(deltas),2), "· max", round(max(deltas),2))
print("eventos donde la palabra nueva no entra antes del siguiente:", len(pisa))
for p in pisa[:15]: print("  ", p)
