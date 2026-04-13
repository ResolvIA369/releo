#!/usr/bin/env python3
"""Regenerate session-script MP3s that changed to es-AR."""
import asyncio, os, edge_tts

VOICE = "es-AR-ElenaNeural"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "sofia")

PHRASES = {
    "intro": "¡Hola! Soy la Seño Sofía y hoy vamos a descubrir palabras mágicas juntos. Antes de empezar quiero que sepas algo muy importante: sos una persona increíble, sos muy inteligente y sos capaz de aprender todo lo que te propongas. Ahora, prestá mucha atención. Te voy a ir mostrando unas palabras muy especiales para que las vayas conociendo y aprendiendo. Solo tenés que mirarlas y escucharme. ¿Estás listo? ¡Vamos!",
    "round1-between1": "¡Excelente esfuerzo! Tu cerebro está brillando y absorbiendo todo. Vamos a verlas una vez más, ¡concentrate!",
    "round1-between2": "¡Lo hacés cada vez mejor! Sos un campeón. Vamos por la última tanda de esta ronda, ¡vos podés!",
    "round1-between3": "¡Guau! Ya casi las tenés todas grabadas en tu cabecita.",
    "round2-intro": "¡Ahora preparate! En esta parte te toca a vos decirme qué dicen las palabras. ¡Vamos!",
    "round3-intro": "¡Ahora escuchá esta historia muy linda con las palabras que aprendiste!",
    "review-intro": "¡Esperá! No te vayas todavía. Antes de terminar, vamos a ver si te acordás de las palabras que conocimos ayer. ¿Te acordás? ¡Vamos a repasarlas rápido!",
    "farewell": "¡Increíble trabajo el de hoy! Aprendiste 5 palabras nuevas y lo hiciste de maravilla. Recordá siempre que sos una persona única, especial y muy valiosa. Estoy muy orgullosa de vos. ¡Te mando un gran abrazo y nos vemos en nuestra próxima aventura de aprendizaje!",
    "frase-recordaste": "¡Te las acordás todas! ¡Qué memoria tan buena!",
    "repeat-conmigo": "Repetí conmigo:",
    "chau-chau": "¡Nos vemos en la próxima clase! ¡Chau chau!",
    "flash-increible": "¡Lo estás haciendo increíble! ¡Tu voz suena hermosa!",
    "flash-casi": "¡Casi! ¡Una más y listo!",
    "flash-lograste": "¡Lo lograste! ¡Aprendiste 5 palabras nuevas! ¡Sos un campeón de la lectura!",
}

async def gen(name, text):
    out = os.path.join(OUT, f"{name}.mp3")
    try:
        c = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="+2Hz")
        await c.save(out)
        return f"  ✓ {name}"
    except Exception as e:
        return f"  ✗ {name}: {e}"

async def main():
    print(f"Regenerating {len(PHRASES)} session MP3s with {VOICE}...")
    for name, text in PHRASES.items():
        print(await gen(name, text))
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
