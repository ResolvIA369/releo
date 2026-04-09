#!/usr/bin/env python3
"""
Generate missing Sofia MP3 files using edge-tts (Microsoft Neural voices).
Voice: es-MX-DaliaNeural (Mexican Spanish, female, friendly)
"""

import asyncio
import os
import edge_tts

VOICE = "es-MX-DaliaNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "sofia")

# ═══════════════════════════════════════════════════════════════════════
# All phrases that need MP3s, grouped by prefix
# ═══════════════════════════════════════════════════════════════════════

PHRASES = {
    # ─── Game reactions (short) ───────────────────────────────────────
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

    # ─── Tutor persona: greetings (without {name}) ───────────────────
    "tutor-saludo-01": "¡Hola! ¡Qué bueno verte! ¿Listo para aprender?",
    "tutor-saludo-02": "¡Llegaste! Hoy tengo palabras muy divertidas para ti",
    "tutor-saludo-03": "¡Hola! Soy la Seño Sofía. ¡Vamos a aprender juntos!",
    "tutor-saludo-04": "¡Hola, amiguito! Vamos a leer juntos",
    "tutor-saludo-05": "¡Bienvenido! Hoy vamos a descubrir palabras nuevas",
    "tutor-saludo-06": "¡Qué alegría verte de nuevo! ¿Empezamos?",
    "tutor-saludo-07": "¡Hola! Tengo una clase muy especial para hoy",
    "tutor-saludo-08": "¡Hola, estrellita! ¿Listos para aprender?",
    "tutor-saludo-09": "¡Me da mucho gusto verte! Hoy aprenderemos juntos",
    "tutor-saludo-10": "¡Aquí estoy! Vamos a divertirnos aprendiendo a leer",

    # ─── Tutor persona: encouragements (without {name}) ──────────────
    "tutor-animo-01": "¡Muy bien! Eres increíble",
    "tutor-animo-02": "¡Lo lograste! Sabía que podías",
    "tutor-animo-03": "¡Excelente! Cada vez lees mejor",
    "tutor-animo-04": "¡Bravo! Esa palabra ya es tuya",
    "tutor-animo-05": "¡Fantástico! La Seño Sofía está muy orgullosa de ti",
    "tutor-animo-06": "¡Genial! Eres un gran lector",
    "tutor-animo-07": "¡Así se hace! Cada día aprendes más",
    "tutor-animo-08": "¡Maravilloso! Tu esfuerzo vale mucho",
    "tutor-animo-09": "¡Perfecto! Sigue así, campeón",
    "tutor-animo-10": "¡Qué bien lo hiciste! Me encanta cómo aprendes",
    "tutor-animo-11": "¡Eres una estrella! Brillas cada vez más",
    "tutor-animo-12": "¡Wow! Esa fue rapidísima",
    "tutor-animo-13": "¡Súper! Ya casi eres un maestro de la lectura",
    "tutor-animo-14": "¡Increíble! Cada palabra te hace más fuerte",
    "tutor-animo-15": "¡Lo ves? ¡Puedes con todo!",

    # ─── Tutor persona: farewells (without {name}) ───────────────────
    "tutor-despedida-01": "¡Fue una gran clase! Nos vemos mañana",
    "tutor-despedida-02": "¡Aprendiste mucho hoy! La Seño Sofía está orgullosa de ti",
    "tutor-despedida-03": "¡Hasta la próxima! Recuerda: tú eres un gran lector",
    "tutor-despedida-04": "¡Qué clase tan bonita! Descansa y mañana seguimos",
    "tutor-despedida-05": "¡Adiós! Hoy brillaste mucho",
    "tutor-despedida-06": "¡Nos vemos pronto! Hoy fue un gran día de lectura",
    "tutor-despedida-07": "¡Hasta mañana! Recuerda que la Seño Sofía siempre cree en ti",
    "tutor-despedida-08": "¡Chao! Hoy aprendimos palabras hermosas juntos",

    # ─── Tutor persona: on mistake (without {name}) ──────────────────
    "tutor-error-01": "¡Casi! Intentemos otra vez, tú puedes",
    "tutor-error-02": "No te preocupes, aprender es intentar muchas veces",
    "tutor-error-03": "Esa es difícil, pero juntos la vamos a aprender",
    "tutor-error-04": "¡Buen intento! Vamos a verla una vez más",
    "tutor-error-05": "No pasa nada, cada intento te acerca más",
    "tutor-error-06": "¡Ánimo! Los mejores lectores también practican mucho",
    "tutor-error-07": "Esa palabra es traviesa, pero tú eres más listo",
    "tutor-error-08": "¡Tranquilo! Yo también tuve que practicar mucho",
    "tutor-error-09": "¡Sigue intentando! Cada vez estás más cerca",
    "tutor-error-10": "No hay prisa, vamos a tu ritmo",

    # ─── Session flow phrases ────────────────────────────────────────
    "sesion-presentacion": "Te voy a mostrar las palabras. Mira bien y escucha cómo se dicen.",
    "sesion-historia-intro": "Ahora te voy a contar una historia con las palabras que aprendiste. ¡Escucha bien!",
    "sesion-historia-review": "Ahora escucha otra historia que tiene TODAS las palabras que sabes.",
    "sesion-review-acuerdas": "¿Te acuerdas de esta?",
    "sesion-review-esa-es": "¡Esa es!",
    "sesion-review-mira": "¡Mira esta!",
    "sesion-review-y-esta": "¡Y esta!",
    "sesion-review-ultima": "¡La última!",

    # ─── Between presentation rounds ─────────────────────────────────
    "sesion-entre-01": "Esas son nuestras 5 palabras de hoy. ¡Vamos a verlas otra vez!",
    "sesion-entre-02": "¡Genial! Ahora las veremos de nuevo. ¡Presta atención!",
    "sesion-entre-03": "¡Ya casi las sabes! Una última vez.",
    "sesion-entre-04": "¡Las conoces! Una vez más para que las recuerdes siempre.",
    "sesion-entre-05": "¡Ya las conoces! Ahora quiero escucharte a ti. Yo te voy a mostrar cada palabra y tú me la dices en voz alta. ¿Sí? ¡Vamos!",
    "sesion-entre-06": "Ahora es tu turno. Cuando veas la palabra, dila en voz alta. ¡Tú puedes!",

    # ─── Between repeat rounds ───────────────────────────────────────
    "sesion-repeat-01": "¡Lo estás haciendo increíble! ¡Tu voz suena muy bien! Vamos otra vez.",
    "sesion-repeat-02": "¡Así se hace! Tu voz suena hermosa. ¡Sigamos!",
    "sesion-repeat-03": "¡Casi terminamos! ¡La última ronda! ¡Tú puedes!",
    "sesion-repeat-04": "¡Increíble! Ya casi terminamos. ¡Una más!",
    "sesion-repeat-05": "¡Lo lograste! ¡Aprendiste 5 palabras nuevas! ¡Eres un campeón de la lectura!",
    "sesion-repeat-06": "¡Bravo! ¡5 palabras nuevas para ti! ¡Eres increíble!",

    # ─── Farewell phrases ────────────────────────────────────────────
    "sesion-despedida-palabras": "¡Fue una clase maravillosa! Hoy aprendiste:",
    "sesion-repite-conmigo": "Repite conmigo:",
    "sesion-chau-01": "¡Nos vemos en la próxima clase! ¡Chau chau!",
    "sesion-chau-02": "¡Hasta la próxima! ¡Eres increíble!",
    "sesion-chau-03": "¡Fue una gran clase! ¡Te espero pronto!",

    # ─── Review phrases ──────────────────────────────────────────────
    "sesion-review-intro-01": "¡Pero antes de irnos, vamos a recordar las palabras de la clase pasada! ¿Las recuerdas?",
    "sesion-review-intro-02": "¿Recuerdas las palabras de la clase pasada? ¡Vamos a verlas!",
    "sesion-review-complete-01": "¡Las recuerdas todas! ¡Qué memoria tan buena tienes!",
    "sesion-review-complete-02": "¡Increíble! ¡Las recordaste todas!",

    # ─── Affirmations (all from affirmations.ts) ─────────────────────
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

    # ─── Sofia session affirmations (from sofia-phrases.ts) ──────────
    "afirmacion-sesion-01": "Yo soy inteligente y puedo aprender cualquier cosa",
    "afirmacion-sesion-02": "Cada día soy más fuerte y más capaz",
    "afirmacion-sesion-03": "Leer me abre puertas a mundos increíbles",
    "afirmacion-sesion-04": "Yo creo en mí y en lo que puedo hacer",
    "afirmacion-sesion-05": "Soy valiente porque aprendo cosas nuevas",
    "afirmacion-sesion-06": "Mi familia está orgullosa de mí",

    # ─── Multiplayer ─────────────────────────────────────────────────
    "reglas-multijugador": "Sofia dice una palabra y muestra 4 emojis. El jugador que toque el emoji correcto gana un punto.",
}


async def generate_mp3(filename: str, text: str):
    """Generate a single MP3 file."""
    output_path = os.path.join(OUTPUT_DIR, f"{filename}.mp3")

    if os.path.exists(output_path):
        return f"  SKIP {filename} (already exists)"

    try:
        communicate = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="+2Hz")
        await communicate.save(output_path)
        return f"  ✓ {filename}"
    except Exception as e:
        return f"  ✗ {filename}: {e}"


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total = len(PHRASES)
    print(f"\nGenerating {total} MP3 files with voice: {VOICE}")
    print(f"Output: {OUTPUT_DIR}\n")

    # Process in batches of 5 to avoid rate limits
    items = list(PHRASES.items())
    for i in range(0, len(items), 5):
        batch = items[i:i+5]
        tasks = [generate_mp3(name, text) for name, text in batch]
        results = await asyncio.gather(*tasks)
        for r in results:
            print(r)

    print(f"\nDone! Generated MP3s in {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
