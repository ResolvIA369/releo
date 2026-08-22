#!/usr/bin/env python3
"""
Regenera TODOS los audios de la Seño Sofía con ElevenLabs (voz Jessica).

Reemplaza a regenerate-all-audio.py (que usaba edge-tts / es-AR-ElenaNeural).
El corpus es EXACTAMENTE el mismo: se importa de ese script para no duplicarlo
ni arriesgar que se desincronicen.

Lo nuevo es la emoción. El modelo eleven_v3 acepta etiquetas dentro del texto
([warmly], [excited], [gently]...), así que cada tipo de frase se dirige según
su función: las palabras Doman suaves y pausadas, las celebraciones con
entusiasmo, los cuentos en tono de narración. Eso es lo que ninguna voz de Edge
podía hacer.

⚠️  LICENCIA: el plan gratuito de ElevenLabs NO da derechos comerciales.
    Para generar los audios de la app hace falta el plan Starter (USD 6/mes,
    cancelable), que sí los incluye. El script avisa si detecta plan gratuito
    y exige --si-ya-pague para seguir.

Uso:
    python3 scripts/regenerate-all-elevenlabs.py --dry-run     # cuenta y no gasta
    python3 scripts/regenerate-all-elevenlabs.py --si-ya-pague
    python3 scripts/regenerate-all-elevenlabs.py --si-ya-pague --solo palabra
"""

import asyncio
import importlib.util
import json
import os
import sys
import time
import urllib.error
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
OUT = os.path.join(RAIZ, "public", "audio", "sofia")

API = "https://api.elevenlabs.io/v1"
VOZ_JESSICA = "cgSgspJ2msm6clMCkdW9"
MODELO = "eleven_v3"

# ─── Emoción por tipo de archivo ──────────────────────────────────────────────
# La clave es el prefijo del nombre. Se prueba de más específico a más general.
# `estilo` y `estabilidad` van a voice_settings: más estilo = más expresión;
# menos estabilidad = más variación entre tomas.
EMOCION = [
    ("palabra-",    "[gently]",    0.35, 0.55),  # la palabra Doman: clara y sin adornos
    ("historia-",   "[warmly]",    0.55, 0.45),
    ("repaso-",     "[warmly]",    0.55, 0.45),  # mismo tono de cuento  # cuentos: tono de narración
    ("celebra-",    "[excited]",   0.75, 0.30),
    ("reaccion-",   "[excited]",   0.70, 0.32),
    ("flash-",      "[excited]",   0.70, 0.32),
    ("afirmacion-", "[warmly]",    0.65, 0.40),  # "sos increíble": cariño, no euforia
    ("animo-",      "[warmly]",    0.60, 0.40),  # cuando se equivoca: contener, no retar
    ("saludo-",     "[cheerfully]", 0.65, 0.38),
    ("despedida-",  "[warmly]",    0.60, 0.42),
    ("reglas-",     "[gently]",    0.40, 0.55),  # explicar un juego: claridad ante todo
    ("tutor-",      "[gently]",    0.45, 0.50),
    ("sesion-",     "[cheerfully]", 0.55, 0.45),
    ("intro",       "[warmly]",    0.60, 0.42),
    ("round",       "[cheerfully]", 0.60, 0.40),
    ("frase-",      "[warmly]",    0.55, 0.45),
]
POR_DEFECTO = ("[warmly]", 0.55, 0.45)


def emocion_de(nombre):
    for prefijo, tag, estilo, estab in EMOCION:
        if nombre.startswith(prefijo):
            return tag, estilo, estab
    return POR_DEFECTO


# ─── Corpus: se importa del script viejo ──────────────────────────────────────

def _textos_en_componentes():
    """Rescata los audios cuyo texto está escrito en los .tsx y no en los scripts."""
    import glob, re
    faltan = {"intro-burbujas", "intro-lluvia", "intro-parte2", "intro-pesca",
              "intro-tren", "reglas-leo-corre", "reglas-leo-vuela", "reglas-salta-palabra"}
    hallados = {}
    for f in glob.glob(os.path.join(RAIZ, "src/**/*.tsx"), recursive=True):
        s = open(f, encoding="utf-8").read()
        for n, t in re.findall(r'sofiaPlayAudio\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"', s):
            if n in faltan:
                hallados[n] = t
        for n, const in re.findall(r'useSofiaIntro\([^,]+,\s*"([^"]+)"\s*,\s*([A-Z_]+)', s):
            if n not in faltan:
                continue
            m = (re.search(rf'const\s+{const}\s*=\s*"((?:[^"\\]|\\.)*)"', s)
                 or re.search(rf'const\s+{const}\s*=\s*`([^`]*)`', s))
            if m:
                hallados[n] = m.group(1)
    if len(hallados) < len(faltan):
        print(f"⚠️  Sólo se recuperaron {len(hallados)}/{len(faltan)} textos de componentes: "
              f"faltan {sorted(faltan - set(hallados))}. Quedarían con la voz vieja.")
    return hallados


def _cuentos_de_repaso():
    """previousStory de curriculum.ts: 43 cuentos que repasan la sesión anterior."""
    import re
    ruta = os.path.join(RAIZ, "src/features/session/config/curriculum.ts")
    txt = open(ruta, encoding="utf-8").read()
    pares = re.findall(r'\n\s*(\d+):\s*\{[^}]*?previousStory:\s*"((?:[^"\\\\]|\\\\.)*)"', txt, re.S)
    return {int(a): b for a, b in pares}


def cargar_corpus():
    ruta = os.path.join(AQUI, "regenerate-all-audio.py")
    spec = importlib.util.spec_from_file_location("_corpus", ruta)
    mod = importlib.util.module_from_spec(spec)
    # El script viejo importa edge_tts al cargarse; si no está, no rompe nada
    # porque acá sólo se usan sus datos.
    spec.loader.exec_module(mod)

    items = []  # (nombre_archivo_sin_ext, texto)
    items += list(mod.load_words())
    # 8 audios de intros y reglas de juegos cuyo texto NO vive en los scripts
    # sino en los componentes (se pasan como respaldo a useSofiaIntro y
    # sofiaPlayAudio). Sin esto quedarían con la voz vieja y la app tendría
    # DOS voces mezcladas. Se extraen del código para no duplicarlos a mano.
    items += list(_textos_en_componentes().items())
    for sid, texto in mod.load_stories().items():
        items.append((f"historia-{sid}", texto))
    # Cuentos de repaso: reusan las 5 palabras de la sesión anterior. Estaban
    # escritos en curriculum.ts desde siempre y nunca se les había dado voz.
    for sid, texto in _cuentos_de_repaso().items():
        items.append((f"repaso-{sid}", texto))
    items += list(mod.PHRASES.items())

    # Sin duplicados, orden estable
    vistos, limpio = set(), []
    for nombre, texto in items:
        if nombre in vistos or not texto or not texto.strip():
            continue
        vistos.add(nombre)
        limpio.append((nombre, texto.strip()))
    return limpio


# ─── ElevenLabs ───────────────────────────────────────────────────────────────

def leer_key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if k:
        return k
    ruta = os.path.expanduser("~/.elevenlabs-key")
    if os.path.exists(ruta):
        return open(ruta).read().strip()
    sys.exit("❌ Falta la API key. Guardala en ~/.elevenlabs-key")


KEY = leer_key()


def generar(texto, estilo, estab, salida, reintentos=3):
    cuerpo = json.dumps({
        "text": texto,
        "model_id": MODELO,
        "voice_settings": {"stability": estab, "similarity_boost": 0.75,
                           "style": estilo, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{VOZ_JESSICA}?output_format=mp3_44100_192",
        data=cuerpo,
        headers={"xi-api-key": KEY, "Content-Type": "application/json"},
    )
    for intento in range(reintentos):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                datos = r.read()
            # Un MP3 de 0 bytes o cortísimo es un fallo silencioso: mejor
            # detectarlo acá que descubrir un audio mudo dentro de la app.
            if len(datos) < 800:
                raise RuntimeError(f"respuesta sospechosamente corta ({len(datos)} bytes)")
            open(salida, "wb").write(datos)
            return len(datos)
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < reintentos - 1:
                time.sleep(5 * (intento + 1))  # rate limit: esperar y reintentar
                continue
            if e.code == 401:
                sys.exit("❌ 401: la key no tiene permiso de text_to_speech.")
            if e.code == 402:
                sys.exit("❌ 402: se acabaron los créditos o el plan no alcanza.")
            raise
        except Exception:
            if intento < reintentos - 1:
                time.sleep(3)
                continue
            raise


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    dry = "--dry-run" in sys.argv
    confirmado = "--si-ya-pague" in sys.argv
    solo = None
    if "--solo" in sys.argv:
        solo = sys.argv[sys.argv.index("--solo") + 1]

    items = cargar_corpus()
    if solo:
        items = [(n, t) for n, t in items if n.startswith(solo)]

    total_chars = 0
    por_tipo = {}
    for nombre, texto in items:
        tag, _, _ = emocion_de(nombre)
        final = f"{tag} {texto}"
        total_chars += len(final)
        pref = nombre.split("-")[0]
        d = por_tipo.setdefault(pref, [0, 0])
        d[0] += 1
        d[1] += len(final)

    print(f"\nVoz: Jessica · modelo {MODELO}\n")
    print(f"{'tipo':<14}{'archivos':>9}{'caracteres':>12}")
    for pref, (n, c) in sorted(por_tipo.items(), key=lambda x: -x[1][1]):
        print(f"{pref:<14}{n:>9}{c:>12,}")
    print(f"{'TOTAL':<14}{len(items):>9}{total_chars:>12,}")
    print(f"\nEl plan Starter da 30.000 créditos/mes.", end=" ")
    print("Entra." if total_chars < 30000 else "⚠️  NO entra en un mes.")

    if dry:
        print("\n(--dry-run: no se generó nada)")
        return

    if not confirmado:
        print("\n⚠️  El plan gratuito NO da derechos comerciales sobre estos audios.")
        print("   Si ya contrataste el Starter, volvé a correrlo con --si-ya-pague\n")
        sys.exit(1)

    os.makedirs(OUT, exist_ok=True)
    hechos = fallados = saltados = 0

    for i, (nombre, texto) in enumerate(items, 1):
        salida = os.path.join(OUT, f"{nombre}.mp3")
        # Reanudable: una corrida de 495 archivos puede cortarse a la mitad.
        if os.path.exists(salida) and os.path.getsize(salida) > 800 and "--forzar" not in sys.argv:
            saltados += 1
            continue

        tag, estilo, estab = emocion_de(nombre)
        try:
            generar(f"{tag} {texto}", estilo, estab, salida)
            hechos += 1
            print(f"  [{i:>3}/{len(items)}] ✓ {nombre:<32} {tag}")
        except Exception as e:
            fallados += 1
            print(f"  [{i:>3}/{len(items)}] ✗ {nombre:<32} {e}")

    print(f"\n✅ {hechos} generados · {saltados} ya estaban · {fallados} fallaron")
    if fallados:
        print("   Volvé a correrlo: saltea los que ya están y reintenta los que faltan.")


if __name__ == "__main__":
    main()
