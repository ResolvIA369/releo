#!/usr/bin/env python3
"""¿Qué versión de cada palabra suena en un final.mp4 de la tanda de Flash?

Para cada evento palabra-*.mp3 de audio-events.json corta una ventana del
final.mp4 alrededor del momento del evento y calcula la correlación cruzada
normalizada contra (a) la versión de git 651b1a6 (edge-tts, abril) y (b) la
versión actual en public/ (candB). Gana la que correlaciona más.
Uso: comparar-audio.py <carpeta-sesion> [max_palabras]
"""
import json, os, subprocess, sys
import numpy as np

SR = 16000
REPO = "/home/cesar/proyectos/releo/saas-factory"


def pcm(src, ss=None, t=None, stdin=None):
    cmd = ["ffmpeg", "-v", "quiet"]
    if ss is not None:
        cmd += ["-ss", f"{ss:.3f}"]
    if t is not None:
        cmd += ["-t", f"{t:.3f}"]
    cmd += ["-i", src if stdin is None else "pipe:0", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"]
    out = subprocess.run(cmd, input=stdin, capture_output=True).stdout
    return np.frombuffer(out, dtype=np.float32)


def ncc_max(seg, ref):
    if len(ref) == 0 or len(seg) < len(ref):
        return 0.0
    n = 1 << int(np.ceil(np.log2(len(seg) + len(ref))))
    corr = np.fft.irfft(np.fft.rfft(seg, n) * np.conj(np.fft.rfft(ref, n)), n)[: len(seg) - len(ref) + 1]
    c2 = np.concatenate([[0], np.cumsum(seg.astype(np.float64) ** 2)])
    energia = np.sqrt(np.maximum(c2[len(ref):] - c2[: -len(ref)], 1e-12))
    return float(np.max(corr / (energia * np.linalg.norm(ref) + 1e-12)))


carpeta = sys.argv[1]
maximo = int(sys.argv[2]) if len(sys.argv) > 2 else 6
ev = json.load(open(os.path.join(carpeta, "audio-events.json")))
final = os.path.join(carpeta, "final.mp4")
offset = ev.get("offsetMs", 0) / 1000
res = []
for e in [x for x in ev["events"] if "/palabra-" in x["src"]][:maximo]:
    rel = "public" + e["src"]
    actual = pcm(os.path.join(REPO, rel))
    viejo_bytes = subprocess.run(["git", "-C", REPO, "show", f"651b1a6:{rel}"], capture_output=True).stdout
    viejo = pcm(None, stdin=viejo_bytes) if viejo_bytes else np.array([], dtype=np.float32)
    t = e["t"] / 1000 - offset
    seg = pcm(final, ss=max(0, t - 3), t=8)
    res.append({"palabra": e["src"].split("palabra-")[1], "viejo_651b1a6": round(ncc_max(seg, viejo), 3),
                "actual_candB": round(ncc_max(seg, actual), 3)})
print(json.dumps({"sesion": os.path.basename(carpeta), "offset": offset, "palabras": res}, ensure_ascii=False))
