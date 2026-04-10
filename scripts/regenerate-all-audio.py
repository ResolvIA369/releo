#!/usr/bin/env python3
"""
Regenerate ALL Sofia audio files with a single consistent voice
(es-AR-ElenaNeural — Argentine Spanish, friendly female).

This script:
  1. Reads the list of palabra-*.mp3 files currently in the folder
     and regenerates each with the word as text.
  2. Extracts story5 texts from curriculum.ts and generates
     historia-1..historia-44.
  3. Regenerates every phrase MP3 (reactions, tutor, session,
     affirmations, game rules, etc.) from a hardcoded mapping.

Before running: delete the whole /public/audio/sofia/ folder so
we start from a clean slate.
"""

import asyncio
import os
import re
import edge_tts

VOICE = "es-AR-ElenaNeural"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio", "sofia")
CURRICULUM = os.path.join(ROOT, "src", "features", "session", "config", "curriculum.ts")

# ─── Pull stories from curriculum.ts ──────────────────────────────

def load_stories():
    with open(CURRICULUM, "r", encoding="utf-8") as f:
        text = f.read()
    stories = {}
    # Match entries like:  12: {\n    story5: "....",
    pattern = re.compile(r'^\s*(\d+):\s*\{\s*\n\s*story5:\s*"((?:[^"\\]|\\.)*)"', re.M)
    for m in pattern.finditer(text):
        idx = int(m.group(1))
        raw = m.group(2)
        # Unescape \" and other escapes
        raw = raw.replace('\\"', '"').replace('\\n', ' ').replace("\\'", "'")
        stories[idx] = raw
    return stories


# ─── Individual words ─────────────────────────────────────────────
# Read existing filenames, strip prefix, use the word itself as text.

def load_words():
    words = []
    for fn in sorted(os.listdir(OUT)) if os.path.isdir(OUT) else []:
        if fn.startswith("palabra-") and fn.endswith(".mp3"):
            word = fn[len("palabra-"):-len(".mp3")]
            words.append((fn[:-4], word))
    return words


# ─── Phrase → MP3 mappings ────────────────────────────────────────

PHRASES = {
    # ─── Short reactions ──────────────────────────────────────────
    "reaccion-muy-bien": "¡Muy bien!",
    "reaccion-intenta-otra-vez": "¡Intenta otra vez!",
    "reaccion-se-acabo-tiempo": "¡Se acabó el tiempo!",
    "reaccion-se-escapo": "¡Se escapó!",
    "reaccion-ese-no": "¡Ese no! Fíjate bien",
    "reaccion-busca-bien": "¡Busca bien!",
    "reaccion-que-linda-historia": "¡Qué linda historia!",
    "reaccion-esa-no": "¡Esa no!",
    "reaccion-si": "¡Sí!",
    "reaccion-eso": "¡Eso!",
    "reaccion-bravo": "¡Bravo!",
    "reaccion-genial": "¡Genial!",
    "reaccion-perfecto": "¡Perfecto!",
    "reaccion-excelente": "¡Excelente!",
    "reaccion-asi-es": "¡Así es!",
    "reaccion-correcto": "¡Correcto!",
    "reaccion-esa-es": "¡Esa es!",
    "reaccion-lo-sabias": "¡Lo sabías!",
    "reaccion-increible": "¡Increíble!",
    "reaccion-wow": "¡Wow!",

    # ─── Tutor saludos ────────────────────────────────────────────
    "saludo-01": "¡Hola! ¡Qué bueno verte! ¿Listo para aprender?",
    "saludo-02": "¡Llegaste! Hoy tengo palabras muy divertidas para vos",
    "saludo-03": "¡Hola! Soy la Seño Sofía. ¡Vamos a aprender juntos!",
    "saludo-04": "¡Hola, amiguito! Vamos a leer juntos",
    "saludo-05": "¡Bienvenido! Hoy vamos a descubrir palabras nuevas",
    "saludo-06": "¡Qué alegría verte de nuevo! ¿Empezamos?",
    "saludo-07": "¡Hola! Tengo una clase muy especial para hoy",
    "saludo-08": "¡Hola, estrellita! ¿Listos para aprender?",
    "saludo-09": "¡Me da mucho gusto verte! Hoy aprenderemos juntos",
    "saludo-10": "¡Acá estoy! Vamos a divertirnos aprendiendo a leer",
    "tutor-saludo-01": "¡Hola! ¡Qué bueno verte! ¿Listo para aprender?",
    "tutor-saludo-02": "¡Llegaste! Hoy tengo palabras muy divertidas para vos",
    "tutor-saludo-03": "¡Hola! Soy la Seño Sofía. ¡Vamos a aprender juntos!",
    "tutor-saludo-04": "¡Hola, amiguito! Vamos a leer juntos",
    "tutor-saludo-05": "¡Bienvenido! Hoy vamos a descubrir palabras nuevas",
    "tutor-saludo-06": "¡Qué alegría verte de nuevo! ¿Empezamos?",
    "tutor-saludo-07": "¡Hola! Tengo una clase muy especial para hoy",
    "tutor-saludo-08": "¡Hola, estrellita! ¿Listos para aprender?",
    "tutor-saludo-09": "¡Me da mucho gusto verte! Hoy aprenderemos juntos",
    "tutor-saludo-10": "¡Acá estoy! Vamos a divertirnos aprendiendo a leer",

    # ─── Tutor celebra (praises for correct answers) ──────────────
    "celebra-01": "¡Muy bien! Sos increíble",
    "celebra-02": "¡Lo lograste! Sabía que podías",
    "celebra-03": "¡Excelente! Cada vez leés mejor",
    "celebra-04": "¡Bravo! Esa palabra ya es tuya",
    "celebra-05": "¡Fantástico! La Seño Sofía está muy orgullosa de vos",
    "celebra-06": "¡Genial! Sos un gran lector",
    "celebra-07": "¡Así se hace! Cada día aprendés más",
    "celebra-08": "¡Maravilloso! Tu esfuerzo vale mucho",
    "celebra-09": "¡Perfecto! Seguí así, campeón",
    "celebra-10": "¡Qué bien lo hiciste! Me encanta cómo aprendés",

    # ─── Animo (encouragement after mistake) ──────────────────────
    "animo-01": "¡Intenta otra vez!",
    "animo-02": "¡Casi! Probá una vez más, vos podés",
    "animo-03": "No te preocupes, aprender es intentar muchas veces",
    "animo-04": "¡Buscá bien!",
    "animo-05": "No pasa nada, cada intento te acerca más",
    "animo-06": "¡Ánimo! Los mejores lectores también practican mucho",
    "animo-07": "Esa palabra es traviesa, pero vos sos más listo",
    "animo-08": "¡Tranquilo! Yo también tuve que practicar mucho",
    "animo-09": "¡Seguí intentando! Cada vez estás más cerca",
    "animo-10": "No hay prisa, vamos a tu ritmo",
    "animo-11": "¡Vamos! Vos podés",
    "animo-12": "¡Un poquito más!",
    "animo-13": "¡No te rindas!",
    "animo-14": "¡Estás muy cerca!",
    "animo-15": "¡Lo vas a lograr!",
    "animo-16": "¡Se acabó el tiempo!",

    # ─── Despedidas ───────────────────────────────────────────────
    "despedida-01": "¡Fue una gran clase! Nos vemos mañana",
    "despedida-02": "¡Aprendiste mucho hoy! La Seño Sofía está orgullosa de vos",
    "despedida-03": "¡Hasta la próxima! Recordá: sos un gran lector",
    "despedida-04": "¡Qué clase tan linda! Descansá y mañana seguimos",
    "despedida-05": "¡Adiós! Hoy brillaste mucho",
    "despedida-06": "¡Nos vemos pronto! Hoy fue un gran día de lectura",
    "despedida-07": "¡Hasta mañana! Recordá que la Seño Sofía siempre cree en vos",
    "despedida-08": "¡Chau! Hoy aprendimos palabras hermosas juntos",
    "despedida-09": "¡Nos vemos en la próxima clase!",
    "despedida-10": "¡Fue un placer aprender con vos hoy!",
    "tutor-despedida-01": "¡Fue una gran clase! Nos vemos mañana",
    "tutor-despedida-02": "¡Aprendiste mucho hoy! La Seño Sofía está orgullosa de vos",
    "tutor-despedida-03": "¡Hasta la próxima! Recordá: sos un gran lector",
    "tutor-despedida-04": "¡Qué clase tan linda! Descansá y mañana seguimos",
    "tutor-despedida-05": "¡Adiós! Hoy brillaste mucho",
    "tutor-despedida-06": "¡Nos vemos pronto! Hoy fue un gran día de lectura",
    "tutor-despedida-07": "¡Hasta mañana! Recordá que la Seño Sofía siempre cree en vos",
    "tutor-despedida-08": "¡Chau! Hoy aprendimos palabras hermosas juntos",

    # ─── Tutor animos (alternate encouragement) ───────────────────
    "tutor-animo-01": "¡Muy bien! Sos increíble",
    "tutor-animo-02": "¡Lo lograste! Sabía que podías",
    "tutor-animo-03": "¡Excelente! Cada vez leés mejor",
    "tutor-animo-04": "¡Bravo! Esa palabra ya es tuya",
    "tutor-animo-05": "¡Fantástico! La Seño Sofía está muy orgullosa de vos",
    "tutor-animo-06": "¡Genial! Sos un gran lector",
    "tutor-animo-07": "¡Así se hace! Cada día aprendés más",
    "tutor-animo-08": "¡Maravilloso! Tu esfuerzo vale mucho",
    "tutor-animo-09": "¡Perfecto! Seguí así, campeón",
    "tutor-animo-10": "¡Qué bien lo hiciste! Me encanta cómo aprendés",
    "tutor-animo-11": "¡Sos una estrella! Brillás cada vez más",
    "tutor-animo-12": "¡Wow! Esa fue rapidísima",
    "tutor-animo-13": "¡Súper! Ya casi sos un maestro de la lectura",
    "tutor-animo-14": "¡Increíble! Cada palabra te hace más fuerte",
    "tutor-animo-15": "¿Lo ves? ¡Podés con todo!",

    # ─── Tutor errors ─────────────────────────────────────────────
    "tutor-error-01": "¡Casi! Intentémoslo otra vez, vos podés",
    "tutor-error-02": "No te preocupes, aprender es intentar muchas veces",
    "tutor-error-03": "Esa es difícil, pero juntos la vamos a aprender",
    "tutor-error-04": "¡Buen intento! Vamos a verla una vez más",
    "tutor-error-05": "No pasa nada, cada intento te acerca más",
    "tutor-error-06": "¡Ánimo! Los mejores lectores también practican mucho",
    "tutor-error-07": "Esa palabra es traviesa, pero vos sos más listo",
    "tutor-error-08": "¡Tranquilo! Yo también tuve que practicar mucho",
    "tutor-error-09": "¡Seguí intentando! Cada vez estás más cerca",
    "tutor-error-10": "No hay prisa, vamos a tu ritmo",

    # ─── Affirmations ─────────────────────────────────────────────
    "afirmacion-01": "Yo soy importante",
    "afirmacion-02": "Yo amo quien soy",
    "afirmacion-03": "Yo soy inteligente y puedo aprender cualquier cosa",
    "afirmacion-04": "Cada día soy más fuerte y más capaz",
    "afirmacion-05": "Leer me abre puertas a mundos increíbles",
    "afirmacion-06": "Yo creo en mí y en lo que puedo hacer",
    "afirmacion-07": "Soy valiente porque aprendo cosas nuevas",
    "afirmacion-08": "Mi familia está orgullosa de mí",
    "afirmacion-09": "Soy capaz de aprender cosas nuevas",
    "afirmacion-10": "Cada día aprendo algo nuevo",
    "afirmacion-principal": "Repetí conmigo: yo puedo, yo creo en mí, yo soy inteligente",
    "afirmacion-auto-01": "Yo soy importante",
    "afirmacion-auto-02": "Yo amo quien soy",
    "afirmacion-auto-03": "Soy valioso",
    "afirmacion-auto-04": "Me quiero tal y como soy",
    "afirmacion-auto-05": "Yo soy único y especial",
    "afirmacion-auto-06": "No hay nadie como yo en el mundo",
    "afirmacion-auto-07": "Estoy orgulloso de ser yo",
    "afirmacion-auto-08": "Merezco amor y respeto",
    "afirmacion-auto-09": "Soy suficiente tal como soy",
    "afirmacion-conf-01": "Yo creo en mí",
    "afirmacion-conf-02": "Yo soy inteligente",
    "afirmacion-conf-03": "Soy capaz de aprender cosas nuevas",
    "afirmacion-conf-04": "Puedo hacerlo si lo intento",
    "afirmacion-conf-05": "Cada día aprendo algo nuevo",
    "afirmacion-conf-06": "Soy valiente",
    "afirmacion-conf-07": "Confío en mis habilidades",
    "afirmacion-conf-08": "Lo intento y lo logro",
    "afirmacion-conf-09": "Soy bueno resolviendo problemas",
    "afirmacion-rel-01": "Hay muchas personas que se preocupan por mí",
    "afirmacion-rel-02": "Soy querido por mi familia",
    "afirmacion-rel-03": "Mis amigos me aprecian",
    "afirmacion-rel-04": "Siempre puedo pedir ayuda",
    "afirmacion-rel-05": "Soy un buen amigo",
    "afirmacion-rel-06": "Trato a los demás con respeto",
    "afirmacion-rel-07": "Comparto con alegría",
    "afirmacion-lect-01": "Me encanta aprender a leer",
    "afirmacion-lect-02": "Cada palabra que leo me hace más fuerte",
    "afirmacion-lect-03": "Leer me abre puertas a nuevos mundos",
    "afirmacion-lect-04": "Disfruto practicar todos los días",
    "afirmacion-lect-05": "Cada intento me acerca más a mi meta",
    "afirmacion-lect-06": "Me siento orgulloso de mi progreso",
    "afirmacion-lect-07": "Aprender es divertido",
    "afirmacion-lect-08": "Soy un gran lector",
    "afirmacion-lect-09": "Los errores me ayudan a mejorar",
    "afirmacion-sesion-01": "Yo soy inteligente y puedo aprender cualquier cosa",
    "afirmacion-sesion-02": "Cada día soy más fuerte y más capaz",
    "afirmacion-sesion-03": "Leer me abre puertas a mundos increíbles",
    "afirmacion-sesion-04": "Yo creo en mí y en lo que puedo hacer",
    "afirmacion-sesion-05": "Soy valiente porque aprendo cosas nuevas",
    "afirmacion-sesion-06": "Mi familia está orgullosa de mí",

    # ─── Session flow ─────────────────────────────────────────────
    "intro": "¡Hola! Hoy vamos a aprender palabras nuevas. Prestá mucha atención, porque vas a ver palabras muy especiales. Solo tenés que mirarlas y escucharme. ¿Estás listo? ¡Vamos!",
    "farewell": "¡Increíble trabajo el de hoy! Has aprendido palabras nuevas, y lo hiciste de maravilla. Recordá siempre que sos una persona única, especial y muy valiosa. Estoy muy orgullosa de vos. ¡Te mando un gran abrazo y nos vemos en nuestra próxima aventura de aprendizaje!",
    "chau-chau": "¡Chau chau! Nos vemos en la próxima clase",
    "repeat-conmigo": "Repetí conmigo:",
    "review-intro": "¡Esperá, no te vayas todavía! Antes de terminar, vamos a ver si te acordás de los amigos que conocimos ayer. ¿Te acordás de ellos?",
    "round2-intro": "¡Guau! Ya casi las tenés todas grabadas en tu cabecita. Ahora preparate, porque en la siguiente parte te toca a vos decirme qué dicen las palabras.",
    "round3-intro": "¡Ahora escuchá esta historia muy linda con las palabras que aprendiste!",
    "round1-between1": "¡Excelente esfuerzo! Tu cerebro está brillando y absorbiendo todo. Vamos a verlas una vez más, ¡concentrate!",
    "round1-between2": "¡Lo hacés cada vez mejor! Sos un campeón. Vamos por la última tanda de esta ronda, ¡vos podés!",
    "round1-between3": "¡Guau! Ya casi las tenés todas grabadas en tu cabecita.",

    # ─── Flash / frase variants (used across game phases) ─────────
    "flash-casi": "¡Casi! ¡Una más y listo!",
    "flash-historia": "¡Ahora te voy a contar una historia!",
    "flash-increible": "¡Lo estás haciendo increíble! ¡Tu voz suena hermosa!",
    "flash-lograste": "¡Lo lograste! ¡Aprendiste 5 palabras nuevas! ¡Sos un campeón de la lectura!",
    "flash-recordaste": "¡Las recordaste todas! ¡Qué buena memoria tenés!",
    "frase-casi": "¡Casi! Una más y listo",
    "frase-historia-linda": "¡Qué linda historia!",
    "frase-increible": "¡Lo estás haciendo increíble! Tu voz suena hermosa",
    "frase-lograste": "¡Lo lograste! ¡Aprendiste 5 palabras nuevas!",
    "frase-nos-vemos": "¡Nos vemos en la próxima clase! ¡Chau chau!",
    "frase-recordaste": "¡Las recordaste todas! ¡Qué buena memoria tenés!",
    "frase-repite": "Repetí conmigo:",

    # ─── Session between-presentation phrases ─────────────────────
    "sesion-presentacion": "Te voy a mostrar las palabras. Mirá bien y escuchá cómo se dicen.",
    "sesion-historia-intro": "Ahora te voy a contar una historia con las palabras que aprendiste. ¡Escuchá bien!",
    "sesion-historia-review": "Ahora escuchá otra historia que tiene todas las palabras que sabés.",
    "sesion-review-acuerdas": "¿Te acordás de esta?",
    "sesion-review-esa-es": "¡Esa es!",
    "sesion-review-mira": "¡Mirá esta!",
    "sesion-review-y-esta": "¡Y esta!",
    "sesion-review-ultima": "¡La última!",
    "sesion-entre-01": "Esas son nuestras 5 palabras de hoy. ¡Vamos a verlas otra vez!",
    "sesion-entre-02": "¡Genial! Ahora las veremos de nuevo. ¡Prestá atención!",
    "sesion-entre-03": "¡Ya casi las sabés! Una última vez.",
    "sesion-entre-04": "¡Las conocés! Una vez más para que las recuerdes siempre.",
    "sesion-entre-05": "¡Ya las conocés! Ahora quiero escucharte a vos. Yo te voy a mostrar cada palabra y vos me la decís en voz alta. ¿Sí? ¡Vamos!",
    "sesion-entre-06": "Ahora es tu turno. Cuando veas la palabra, decila en voz alta. ¡Vos podés!",
    "sesion-repeat-01": "¡Lo estás haciendo increíble! ¡Tu voz suena muy bien! Vamos otra vez.",
    "sesion-repeat-02": "¡Así se hace! Tu voz suena hermosa. ¡Sigamos!",
    "sesion-repeat-03": "¡Casi terminamos! ¡La última ronda! ¡Vos podés!",
    "sesion-repeat-04": "¡Increíble! Ya casi terminamos. ¡Una más!",
    "sesion-repeat-05": "¡Lo lograste! ¡Aprendiste 5 palabras nuevas! ¡Sos un campeón de la lectura!",
    "sesion-repeat-06": "¡Bravo! ¡5 palabras nuevas para vos! ¡Sos increíble!",
    "sesion-despedida-palabras": "¡Fue una clase maravillosa! Hoy aprendiste:",
    "sesion-repite-conmigo": "Repetí conmigo:",
    "sesion-chau-01": "¡Nos vemos en la próxima clase! ¡Chau chau!",
    "sesion-chau-02": "¡Hasta la próxima! ¡Sos increíble!",
    "sesion-chau-03": "¡Fue una gran clase! ¡Te espero pronto!",
    "sesion-review-intro-01": "¡Pero antes de irnos, vamos a recordar las palabras de la clase pasada! ¿Te acordás?",
    "sesion-review-intro-02": "¿Te acordás de las palabras de la clase pasada? ¡Vamos a verlas!",
    "sesion-review-complete-01": "¡Te acordaste de todas! ¡Qué memoria tan buena tenés!",
    "sesion-review-complete-02": "¡Increíble! ¡Las recordaste todas!",

    # ─── Game rules ───────────────────────────────────────────────
    "reglas-empareja": "Voy a mostrarte una palabra. ¡Tocá la imagen que le corresponde antes de que se acabe el tiempo!",
    "reglas-memoria": "¡Armá la palabra! Yo te digo una palabra y vos tocás las sílabas en orden para armarla.",
    "reglas-rompecabezas": "¡Armá la palabra! Yo te digo una palabra y vos tocás las sílabas en orden para armarla.",
    "reglas-lluvia": "¡Palabras caen del cielo! Yo te digo cuál atrapar. ¡Tocala antes de que llegue al suelo!",
    "reglas-pesca": "¡Los peces nadan con palabras! Yo te digo cuál pescar. ¡Tocá el pez correcto!",
    "reglas-categorias": "¡Poné cada palabra en su categoría! Yo te digo la palabra y vos elegís dónde va.",
    "reglas-frase": "¡Ordená las palabras para formar la oración!",
    "reglas-tren": "Yo te digo una palabra y vos la buscás entre todos los vagones del tren que se mueve. ¡Tocalo rápido antes de que se escape!",
    "reglas-cuentos": "¡Vamos a leer un cuento juntos! Tocá cada palabra en orden y Sofía te la lee.",
    "reglas-burbujas": "¡Palabras flotan en burbujas! Yo te digo cuál reventar. ¡Tocá la burbuja correcta!",
    "reglas-bits": "¡Palabras flotan en burbujas! Yo te digo cuál reventar. ¡Tocá la burbuja correcta!",
    "reglas-multijugador": "Sofía dice una palabra y muestra 4 emojis. El jugador que toque el emoji correcto gana un punto.",
}


# ─── Generator ────────────────────────────────────────────────────

CONCURRENCY = 6

async def generate_one(name: str, text: str):
    out = os.path.join(OUT, f"{name}.mp3")
    try:
        c = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="+2Hz")
        await c.save(out)
        return f"  ✓ {name}"
    except Exception as e:
        return f"  ✗ {name}: {e}"


async def run_batch(items):
    sem = asyncio.Semaphore(CONCURRENCY)

    async def bounded(name, text):
        async with sem:
            return await generate_one(name, text)

    tasks = [bounded(n, t) for n, t in items]
    for coro in asyncio.as_completed(tasks):
        print(await coro)


async def main():
    # 1. Collect existing word list from filenames BEFORE wiping
    words = load_words()
    print(f"Found {len(words)} existing word MP3s to preserve")

    # 2. Wipe the folder
    if os.path.isdir(OUT):
        removed = 0
        for fn in os.listdir(OUT):
            if fn.endswith(".mp3"):
                os.remove(os.path.join(OUT, fn))
                removed += 1
        print(f"Deleted {removed} old MP3s")

    os.makedirs(OUT, exist_ok=True)

    # 3. Build the full list of (filename, text) pairs
    all_items = []

    # Words
    for name, word in words:
        all_items.append((name, word))

    # Stories
    stories = load_stories()
    print(f"Loaded {len(stories)} stories from curriculum")
    for idx, text in stories.items():
        all_items.append((f"historia-{idx}", text))

    # Phrases
    for name, text in PHRASES.items():
        all_items.append((name, text))

    # Deduplicate by name (keep last)
    seen = {}
    for name, text in all_items:
        seen[name] = text
    all_items = list(seen.items())

    print(f"\nGenerating {len(all_items)} MP3 files with voice: {VOICE}")
    print(f"Output: {OUT}\n")

    await run_batch(all_items)

    print(f"\nDone! Regenerated audio in {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
