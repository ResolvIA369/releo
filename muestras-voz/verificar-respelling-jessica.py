#!/usr/bin/env python3
"""
Verificación pedida por César (19-sep-2026) antes de generar las 220 con
respelling: las mismas 6 palabras del experimento de idioma
(hospital, pie, pan, come, sin, y), con el respelling ya validado con
candB, pero generadas con JESSICA en vez de candB.

Si el respelling funciona igual de bien con Jessica, no hace falta la
división de voces por función — Jessica sola alcanza para todo el corpus
(220 palabras + 495 frases/reglas/afirmaciones) y candB queda descartada.

Lee scripts/respelling-palabras.json (fuente única del respelling, la misma
que va a usar el pipeline de producción) — no duplica la tabla a mano.

NO toca public/audio/sofia/. Sale a muestras-voz/ (comparación) + actualiza
public/dev-experimento-idioma.html con una columna nueva.

Uso:
    python3 muestras-voz/verificar-respelling-jessica.py
"""

import json
import os
import sys
import urllib.error
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
RESPELLING_JSON = os.path.join(RAIZ, "scripts", "respelling-palabras.json")
OUT = os.path.join(RAIZ, "public", "experimento-idioma-candb")  # mismo directorio del experimento anterior, para reusar el HTML

API = "https://api.elevenlabs.io/v1"
VOZ_JESSICA = "cgSgspJ2msm6clMCkdW9"
MODELO = "eleven_v3"
TAG_EMOCION = "[gently]"
ESTILO = 0.35
ESTABILIDAD = 0.55

PALABRAS = ["hospital", "pie", "pan", "come", "sin", "y"]


def leer_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


def cargar_respelling() -> dict:
    with open(RESPELLING_JSON, encoding="utf-8") as f:
        d = json.load(f)
    d.pop("_comentario", None)
    return d


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
        f"{API}/text-to-speech/{VOZ_JESSICA}?output_format=mp3_44100_192",
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


def main():
    key = leer_key()
    respelling = cargar_respelling()
    os.makedirs(OUT, exist_ok=True)

    print(f"voice_id a usar: {VOZ_JESSICA}  (Jessica — verificar contra CLAUDE.md, sección 'Voz de Sofía')")
    print(f"Salida en: {OUT}\n")

    total_chars = 0
    for palabra in PALABRAS:
        respelled = respelling[palabra]
        texto = f"{TAG_EMOCION} {respelled}"
        salida = os.path.join(OUT, f"{palabra}-jessica-respelling.mp3")
        total_chars += len(texto)
        try:
            size = generar(key, texto, salida)
            print(f"  {palabra} ('{respelled}') ✓ ({size} bytes)")
        except urllib.error.HTTPError as e:
            print(f"  {palabra} ✗ HTTP {e.code}: {e.reason}")
        except Exception as e:  # noqa: BLE001
            print(f"  {palabra} ✗ {e}")

    print(f"\nCaracteres enviados a la API: {total_chars}")

    html_path = os.path.join(RAIZ, "public", "dev-verificar-jessica.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(construir_html(respelling))
    print(f"\nComparación: public/dev-verificar-jessica.html")


def construir_html(respelling: dict) -> str:
    filas = []
    for p in PALABRAS:
        filas.append(f"""
  <tr>
    <td class="word">{p}</td>
    <td class="respell">"{respelling[p]}"</td>
    <td><audio controls src="/experimento-idioma-candb/{p}-c-respelling.mp3?v=1"></audio></td>
    <td><audio controls src="/experimento-idioma-candb/{p}-jessica-respelling.mp3?v=1"></audio></td>
  </tr>""")

    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Respelling: candB vs Jessica</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1rem; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; }}
  th, td {{ text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }}
  th {{ font-size: 0.8rem; color: #666; }}
  audio {{ width: 200px; height: 32px; }}
  .word {{ font-weight: 600; }}
  .respell {{ color: #666; font-family: monospace; }}
</style>
</head>
<body>
<h1>Mismo respelling, dos voces</h1>
<p>candB = JddqVF50ZSIR7SRbJE6u · Jessica = cgSgspJ2msm6clMCkdW9. Si suenan parecido, no hace falta dividir voces por función.</p>
<table>
  <tr><th>Palabra</th><th>Respelling</th><th>candB</th><th>Jessica</th></tr>
  {''.join(filas)}
</table>
</body>
</html>
"""


if __name__ == "__main__":
    main()
