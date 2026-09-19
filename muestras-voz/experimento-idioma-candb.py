#!/usr/bin/env python3
"""
Prueba la hipótesis de César (19-sep-2026): el problema con candB en palabras
como "hospital" no es timbre de voz, es detección de idioma — una palabra
suelta homógrafa con inglés (o de una sola letra) no le da al modelo contexto
para leerla en español.

Genera 4 variantes de las mismas 6 palabras (hospital, pie, pan, come, sin, y)
con candB, para comparar oído a oído:

  a. control        — igual que hoy en regenerate-words-candb.py
  b. language_code   — fuerza es (ISO 639-1) vía el parámetro que acepta
                        eleven_v3 (confirmado: NO existe para multilingual_v2,
                        SÍ para v3 — ver docs ElevenLabs, sep-2026)
  c. respelling       — la palabra reescrita a mano para sacarla del patrón
                        que dispara la lectura en inglés (ej. hospital→ospital,
                        siguiendo el ejemplo de César)
  d. frase + recorte  — la palabra metida en una frase corta en español, con
                        el resto de la frase recortado después por silencio
                        (ffmpeg silencedetect), para darle contexto de idioma
                        al modelo sin que quede nada de la frase en el audio
                        final

NO toca public/audio/sofia/. Todo sale a muestras-voz/experimento-idioma/.
NO genera las 210 palabras restantes — esto es sólo diagnóstico.

Uso:
    python3 muestras-voz/experimento-idioma-candb.py
"""

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    sys.exit("❌ Falta imageio_ffmpeg. Instalar: pip3 install --user --break-system-packages imageio-ffmpeg")

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
# Sale a public/ (no a muestras-voz/) porque tiene que poder escucharse desde
# el navegador vía el dev server — Next sólo sirve estático lo que está en
# public/. Es diagnóstico, no un asset de producción: no se referencia desde
# ninguna pantalla de la app.
OUT = os.path.join(RAIZ, "public", "experimento-idioma-candb")
os.makedirs(OUT, exist_ok=True)

API = "https://api.elevenlabs.io/v1"
VOZ_CANDB = "JddqVF50ZSIR7SRbJE6u"
MODELO = "eleven_v3"
TAG_EMOCION = "[gently]"   # misma etiqueta que usa hoy regenerate-words-candb.py
ESTILO = 0.35
ESTABILIDAD = 0.55

# variante c: respelling a mano, siguiendo el ejemplo de César (hospital -> ospital)
RESPELLING = {
    "hospital": "ospital",   # la h es muda en español igual, sacarla saca el gatillo de lectura inglesa
    "pie": "pié",            # acento no ortográfico, hack para forzar el diptongo español /pje/
    "pan": "pán",
    "come": "cóme",
    "sin": "sín",
    "y": "i",                # "y" sola dispara "why" (nombre de letra en inglés); "i" es el sonido real
}

# variante d: frase corta natural en español con la palabra al principio o al
# final (para poder recortar por silencio de un solo lado)
FRASES = {
    "hospital": ("Fuimos corriendo al hospital.", "end"),
    "pie":      ("Me dolía mucho el pie.", "end"),
    "pan":      ("En la panadería venden pan.", "end"),
    "come":     ("Mi gato casi no come.", "end"),
    "sin":      ("¿Lo tomás con leche o sin?", "end"),
    "y":        ("¿Y vos qué decís?", "start"),
}

PALABRAS = ["hospital", "pie", "pan", "come", "sin", "y"]


def leer_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


def generar(key: str, texto: str, salida: str, language_code: str | None = None) -> int:
    body = {
        "text": texto,
        "model_id": MODELO,
        "voice_settings": {
            "stability": ESTABILIDAD,
            "similarity_boost": 0.75,
            "style": ESTILO,
            "use_speaker_boost": True,
        },
    }
    if language_code:
        body["language_code"] = language_code
    cuerpo = json.dumps(body).encode()
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
    out = subprocess.run(
        [FFMPEG, "-i", path],
        capture_output=True, text=True,
    ).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", out)
    if not m:
        raise RuntimeError(f"no pude leer duración de {path}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def silencios(path: str, noise_db=-22, min_dur=0.04) -> list[tuple[float, float]]:
    """Devuelve [(silence_start, silence_end), ...] detectados con ffmpeg."""
    out = subprocess.run(
        [FFMPEG, "-i", path, "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)", out)]
    return list(zip(starts, ends))


def recortar(path_in: str, path_out: str, start: float, end: float):
    subprocess.run(
        [FFMPEG, "-y", "-i", path_in, "-ss", f"{start:.3f}", "-to", f"{end:.3f}",
         "-c", "copy", path_out],
        capture_output=True, check=True,
    )


def aislar_palabra(path_frase: str, path_out: str, posicion: str, dur_total: float):
    """
    Aísla la palabra objetivo dentro de la frase completa, usando los
    silencios detectados. Descarta el silencio "de borde" (el que está
    pegado al arranque o al final del archivo — silencio de sobra que deja
    el motor, no una pausa entre palabras) para no confundirlo con la pausa
    real entre la palabra objetivo y el resto de la frase.
    """
    pares = silencios(path_frase)
    PAD = 0.06       # margen chico para no comerse el ataque/cola de la palabra
    BORDE = 0.10      # tolerancia para considerar un silencio "pegado al borde"

    if posicion == "end":
        # gaps con habla real después (no el silencio de cola del archivo)
        contenido = [(s, e) for s, e in pares if e < dur_total - BORDE]
        if contenido:
            _, ultimo_end = contenido[-1]
            start = max(0.0, ultimo_end - PAD)
        else:
            start = 0.0
        # cortar el final justo donde empieza el silencio de cola, no
        # arrastrar todo el silencio de sobra del archivo
        cola = [(s, e) for s, e in pares if e >= dur_total - BORDE]
        end = min(dur_total, cola[0][0] + 0.12) if cola else dur_total
    else:  # start
        # gaps con habla real antes (no el silencio de arranque del archivo)
        contenido = [(s, e) for s, e in pares if s > BORDE]
        if contenido:
            primer_start, _ = contenido[0]
            end = min(dur_total, primer_start + PAD)
        else:
            end = dur_total
        inicio = [(s, e) for s, e in pares if s <= BORDE]
        start = max(0.0, inicio[0][1] - PAD) if inicio else 0.0

    recortar(path_frase, path_out, start, end)
    return start, end


def main():
    key = leer_key()
    print(f"voice_id a usar: {VOZ_CANDB}  (candB — confirmar contra muestras-voz/muestras-candidatas-latam.py)")
    print(f"Salida en: {OUT}\n")

    total_chars = 0
    filas = []  # para el HTML de comparación

    for palabra in PALABRAS:
        print(f"── {palabra} ──")
        fila = {"palabra": palabra}

        # a. control
        texto_a = f"{TAG_EMOCION} {palabra}"
        salida_a = os.path.join(OUT, f"{palabra}-a-control.mp3")
        total_chars += len(texto_a)
        try:
            size = generar(key, texto_a, salida_a)
            print(f"  a. control        ✓ ({size} bytes)")
            fila["a"] = os.path.basename(salida_a)
        except Exception as e:  # noqa: BLE001
            print(f"  a. control        ✗ {e}")

        # b. language_code=es
        texto_b = f"{TAG_EMOCION} {palabra}"
        salida_b = os.path.join(OUT, f"{palabra}-b-language_code.mp3")
        total_chars += len(texto_b)
        try:
            size = generar(key, texto_b, salida_b, language_code="es")
            print(f"  b. language_code=es ✓ ({size} bytes)")
            fila["b"] = os.path.basename(salida_b)
        except urllib.error.HTTPError as e:
            detalle = e.read().decode(errors="replace")
            print(f"  b. language_code=es ✗ HTTP {e.code}: {detalle[:200]}")
        except Exception as e:  # noqa: BLE001
            print(f"  b. language_code=es ✗ {e}")

        # c. respelling fonético
        respelled = RESPELLING[palabra]
        texto_c = f"{TAG_EMOCION} {respelled}"
        salida_c = os.path.join(OUT, f"{palabra}-c-respelling.mp3")
        total_chars += len(texto_c)
        try:
            size = generar(key, texto_c, salida_c)
            print(f"  c. respelling ('{respelled}') ✓ ({size} bytes)")
            fila["c"] = os.path.basename(salida_c)
        except Exception as e:  # noqa: BLE001
            print(f"  c. respelling ✗ {e}")

        # d. frase + recorte
        frase, posicion = FRASES[palabra]
        texto_d = f"{TAG_EMOCION} {frase}"
        salida_d_frase = os.path.join(OUT, f"{palabra}-d-frase-completa.mp3")
        salida_d_recorte = os.path.join(OUT, f"{palabra}-d-recortada.mp3")
        total_chars += len(texto_d)
        try:
            generar(key, texto_d, salida_d_frase)
            dur = duracion(salida_d_frase)
            start, end = aislar_palabra(salida_d_frase, salida_d_recorte, posicion, dur)
            print(f"  d. frase+recorte  ✓ frase: \"{frase}\" — recorte [{start:.2f}s, {end:.2f}s] de {dur:.2f}s")
            fila["d_frase"] = os.path.basename(salida_d_frase)
            fila["d_recorte"] = os.path.basename(salida_d_recorte)
        except Exception as e:  # noqa: BLE001
            print(f"  d. frase+recorte  ✗ {e}")

        filas.append(fila)
        print()

    print(f"Caracteres enviados a la API (las 4 variantes x 6 palabras, con etiqueta incluida): {total_chars}")

    # HTML de comparación
    html_path = os.path.join(AQUI, "..", "public", "dev-experimento-idioma.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(construir_html(filas))
    print(f"\nComparación: public/dev-experimento-idioma.html")


def construir_html(filas: list[dict]) -> str:
    filas_html = []
    for fi in filas:
        p = fi["palabra"]

        def audio(clave, etiqueta):
            fn = fi.get(clave)
            if not fn:
                return f"<td>—</td>"
            return f'<td>{etiqueta}<br><audio controls src="/experimento-idioma-candb/{fn}?v=1"></audio></td>'

        filas_html.append(f"""
  <tr>
    <td class="word">{p}</td>
    {audio("a", "control")}
    {audio("b", "language_code=es")}
    {audio("c", RESPELLING[p])}
    {audio("d_recorte", "recortada de frase")}
    {audio("d_frase", "frase completa (referencia)")}
  </tr>""")

    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Experimento idioma — candB</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; }}
  th, td {{ text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; vertical-align: top; }}
  th {{ font-size: 0.8rem; color: #666; }}
  audio {{ width: 180px; height: 32px; }}
  .word {{ font-weight: 600; }}
</style>
</head>
<body>
<h1>candB — 4 formas de decir cada palabra (hipótesis: idioma, no timbre)</h1>
<p>voice_id: JddqVF50ZSIR7SRbJE6u (candB). Cada URL tiene <code>?v=1</code> para evitar caché vieja.</p>
<table>
  <tr><th>Palabra</th><th>a. control</th><th>b. language_code=es</th><th>c. respelling</th><th>d. recortada</th><th>d. frase completa</th></tr>
  {''.join(filas_html)}
</table>
</body>
</html>
"""


if __name__ == "__main__":
    main()
