#!/usr/bin/env python3
"""Arma cola/10-sofia-intervenciones.jsonl: frases cortas reutilizables de Sofía.

Voz Jessica. Etiqueta y estilo por categoría, alineados con
scripts/regenerate-all-elevenlabs.py (EMOCION). Sin género gramatical del chico
(nada de "listo/lista"): la app no sabe a quién le habla.
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))

# categoria: (tag, estilo, estabilidad, frases)
C = {
"saludos": ("[cheerfully]", 0.65, 0.38, [
 "¡Hola!", "¡Hola! ¿Cómo estás?", "¡Qué bueno verte!", "¡Qué alegría verte de nuevo!",
 "¿Empezamos?", "Hoy vamos a aprender algo nuevo.", "¡Hola, hola! Te estaba esperando.",
 "¡Buen día! ¿Jugamos a leer?", "¡Buenas tardes! ¿Leemos un ratito?", "¡Buenas noches! Leamos algo antes de dormir.",
 "¡Volviste! Qué lindo.", "Estoy muy contenta de verte.", "¿Tenés ganas de leer conmigo?",
 "¡Hola! Leo y yo te estábamos esperando.", "¿Preparado el corazón y los ojos? ¡Vamos!",
 "Hoy tengo algo especial para vos.", "¡Hola! ¿Me ayudás a leer hoy?", "¡Qué bueno que viniste!",
 "Acomodate bien, que empezamos.", "¡Hola, amigo lector!", "¿Cómo te fue hoy? Ahora a leer un ratito.",
 "¡Llegó la hora de leer!", "Yo ya estoy. ¿Y vos? ¡Empecemos!", "Hoy va a ser un día muy lindo para leer.",
]),
"inicio": ("[cheerfully]", 0.55, 0.45, [
 "Vamos a empezar.", "Prestá mucha atención.", "Mirá esta palabra.", "Escuchá con atención.",
 "Ahora probá vos.", "Vamos juntos.", "Primero escuchame.", "Después lo hacés vos.",
 "Mirá bien.", "Mirá con los ojos bien abiertos.", "Prepará las orejitas.", "Empezamos en tres, dos, uno... ¡ya!",
 "Lo hacemos juntos la primera vez.", "Yo te muestro y vos repetís.", "Esta es nueva. ¡Mirala bien!",
 "Vamos a jugar un juego.", "Te voy a mostrar unas palabras.", "Vamos a leer unas palabras nuevas.",
 "Ahora viene una frase.", "Ahora viene un cuento.", "Vamos a repasar lo que ya sabés.",
 "Empezamos con una fácil.", "Atención, que ahí viene.", "Sentate cómodo y mirá la pantalla.",
 "¿Estás? ¡Arrancamos!", "Mirá, escuchá y después decímelo vos.",
]),
"consignas": ("[gently]", 0.45, 0.50, [
 "Tocá la respuesta correcta.", "Elegí la palabra correcta.", "Escuchá y elegí.", "Leé esta palabra.",
 "Repetí después de mí.", "Completá la palabra.", "Buscá la letra que falta.", "Ordená las letras.",
 "Uní cada palabra con su imagen.", "Intentá leerla sin ayuda.", "Escuchala una vez más.",
 "Elegí una opción.", "Tocá la imagen que corresponde.", "Tocá la palabra que te digo.",
 "Buscá la palabra igual.", "Encontrá las dos palabras iguales.", "Arrastrá la palabra hasta su dibujo.",
 "Tocá la palabra que empieza igual.", "Tocá la que dice lo mismo que el dibujo.", "Leé la frase en voz alta.",
 "Decí la palabra en voz alta.", "Leé conmigo.", "Seguí la palabra con el dedo.",
 "Tocá el dibujo para escucharlo.", "Tocá la palabra para escucharla.", "Ordená las palabras para armar la frase.",
 "¿Cuál de estas dice lo que escuchaste?", "¿Dónde dice lo que te digo?", "Mirá la imagen y elegí su palabra.",
 "Tocá todas las que sean iguales.", "Buscá la que es distinta.", "Contá cuántas palabras tiene la frase.",
 "Ahora leé vos.", "Escuchemos palabra por palabra.", "Leela despacito.", "Ahora leela un poquito más rápido.",
 "Tocá la flecha para seguir.", "Tocá el parlante para escuchar otra vez.", "¿Querés escucharlo otra vez?",
 "Elegí el dibujo que va con la frase.", "Respondé tocando una imagen.", "Tocá la respuesta que te parezca.",
]),
"refuerzo": ("[excited]", 0.75, 0.30, [
 "¡Muy bien!", "¡Excelente!", "¡Lo hiciste!", "¡Perfecto!", "¡Buen trabajo!", "¡Genial!", "¡Eso es!",
 "¡Correcto!", "¡Cada vez mejor!", "¡Muy buena lectura!", "¡Seguí así!", "¡Qué bien lo hiciste!",
 "¡Lo estás haciendo muy bien!", "¡Excelente esfuerzo!", "¡Bravo!", "¡Increíble!", "¡Fantástico!",
 "¡Sí, señor! ¡Esa es!", "¡Esa era!", "¡Le acertaste!", "¡Justo esa!", "¡Qué buena vista tenés!",
 "¡Leíste muy bien!", "¡Wow, qué rápido!", "¡Me encanta cómo leés!", "¡Sos una estrella!",
 "¡Ya la sabés!", "¡Te salió perfecto!", "¡Eso! ¡Así se hace!", "¡Muy, muy bien!",
 "¡Uy, qué bien!", "¡Impresionante!", "¡Leo está saltando de alegría!", "¡Aplausos!",
 "¡Qué orgullo!", "¡Diez puntos!", "¡Otra más bien hecha!", "¡No se te escapa ninguna!",
 "¡Qué bien escuchaste!", "¡Qué bien miraste!", "¡Lo leíste solito!", "¡Lo leíste sin ayuda!",
 "¡Mirá todo lo que sabés!", "¡Estás aprendiendo un montón!", "¡Cómo me gusta leer con vos!",
 "¡Eso fue genial!", "¡Le pusiste muchas ganas!", "¡Te felicito!", "¡Bárbaro!", "¡Espectacular!",
 "¡Re bien!", "¡Qué capo!", "¡Estás leyendo como un campeón!", "¡Tres seguidas! ¡Qué bien!",
 "¡Cinco seguidas! ¡Imparable!", "¡Ninguna equivocada! ¡Increíble!", "¡Esa era difícil y la sacaste!",
 "¡Qué buena memoria!", "¡La reconociste enseguida!", "¡Así me gusta!", "¡Sí! ¡Muy bien pensado!",
 "¡Eso es leer!", "¡Perfecto, sin dudar!", "¡Qué bien que te salió!", "¡Mirá cómo aprendés!",
 "¡Sabía que podías!", "¡Brillante!", "¡Sos un gran lector!", "¡Vamos todavía!", "¡Bien ahí!",
]),
"errores": ("[warmly]", 0.60, 0.40, [
 "Casi.", "Probemos otra vez.", "Escuchá nuevamente.", "No pasa nada, intentemos de nuevo.",
 "Prestá atención a este sonido.", "Vamos a hacerlo juntos.", "Te doy una pista.", "Escuchá cómo suena.",
 "Probá una vez más.", "Estuviste cerca.", "Uy, esa no era. ¡Probá otra!", "Mmm, casi casi.",
 "No te preocupes, equivocarse es parte de aprender.", "Mirala de nuevo, despacito.", "Intentemos otra.",
 "Esa no es, pero vas muy bien.", "Fijate bien en el principio de la palabra.", "Fijate bien en el final de la palabra.",
 "Mirá el dibujo, te va a ayudar.", "Escuchala otra vez y elegí.", "Vamos más despacio.",
 "Respirá hondo y probá de nuevo.", "Todos nos equivocamos. ¡Otra vez!", "Ya casi la tenés.",
 "Esta es difícil. Hagámosla juntos.", "Te la leo yo primero.", "Escuchá: así se dice.",
 "Mirá cuál es. Esta es la correcta.", "La próxima te sale, seguro.", "¡No te rindas! Probá de nuevo.",
 "Se parecen mucho, ¿no? Mirá la diferencia.", "Esa se parece, pero no es.", "Probá con otra opción.",
 "Tranqui, tenemos tiempo.", "Equivocarse está bien. Así se aprende.", "Vamos de nuevo, sin apuro.",
 "Mirá letra por letra.", "Pensalo un poquito más.", "¿Querés que te ayude?", "Te ayudo con esta.",
]),
"pistas": ("[gently]", 0.45, 0.50, [
 "Te doy una pista: mirá el dibujo.", "Pista: empieza igual que tu nombre... ¡mirá bien!",
 "Pista: es una palabra corta.", "Pista: es una palabra larga.", "Pista: es un animal.",
 "Pista: es algo que se come.", "Pista: es algo de la casa.", "Pista: es un color.",
 "Pista: es una parte del cuerpo.", "Pista: es algo que se hace.", "Pista: es una persona de la familia.",
 "Pista: es algo de la naturaleza.", "Pista: es un juguete.", "Pista: es algo que se usa para vestirse.",
 "Pista: está arriba.", "Pista: está abajo.", "Pista: está a la izquierda.", "Pista: está a la derecha.",
 "Pista: está en el medio.", "Fijate en la primera letra.", "Fijate en la última letra.",
 "Escuchá cómo empieza.", "Escuchá cómo termina.", "Mirá qué largas son las palabras.",
]),
"transiciones": ("[cheerfully]", 0.55, 0.45, [
 "Vamos con la siguiente.", "Ahora una un poquito más difícil.", "Seguimos.", "Muy bien, avancemos.",
 "Terminamos esta parte.", "Vamos al próximo desafío.", "Ahora vamos a leer.", "Excelente, avancemos.",
 "¡A la próxima!", "Ahí viene otra.", "Una más.", "Ya casi terminamos.", "Faltan poquitas.",
 "La última.", "Ahora cambiamos de juego.", "Ahora vamos a escuchar un cuento.",
 "Ahora vamos a repasar.", "Vamos a ver si te acordás de estas.", "Ahora palabras nuevas.",
 "Ahora una frase entera.", "Pasamos al siguiente nivel.", "¡Subiste de nivel!", "Hagamos una pausa cortita.",
 "Estirá los brazos... ¡y seguimos!", "Volvemos a empezar.", "Ahora, más rápido.", "Ahora, más despacio.",
 "Ahora te toca a vos.", "Ahora me toca a mí.", "Vamos con otra ronda.", "Mitad del camino. ¡Vamos bien!",
 "Esta es la mitad. ¡Seguimos!", "Te acordás de esta, ¿no?", "Una que ya conocés.",
]),
"finalizacion": ("[warmly]", 0.60, 0.42, [
 "¡Terminaste!", "¡Excelente trabajo!", "Hoy aprendiste muchísimo.", "Nos vemos en la próxima.",
 "Podés estar muy orgulloso de tu esfuerzo.", "Gracias por aprender conmigo.", "¡Terminamos por hoy!",
 "¡Qué lindo leer con vos!", "Mañana seguimos, ¿sí?", "Hoy leíste un montón de palabras.",
 "Leo y yo estamos muy contentos.", "¡Chau, chau! Hasta mañana.", "Te espero mañana para leer.",
 "Fue un día de lectura genial.", "¡Misión cumplida!", "Completaste todo. ¡Bravo!",
 "Andá a contarle a tu familia lo que leíste.", "Hoy fuiste un gran lector.", "Me encantó leer con vos.",
 "Descansá, que te lo ganaste.", "¡Qué gran sesión!", "Ganaste una estrella nueva.",
 "Mirá todas las estrellas que juntaste.", "La próxima vamos a aprender más.", "¡Hasta la próxima aventura!",
 "Un beso grande. ¡Chau!", "Que tengas un día hermoso.", "Que descanses. ¡Buenas noches!",
]),
"preguntas_generales": ("[curious]", 0.55, 0.45, [
 "¿Qué palabra es esta?", "¿Qué dice acá?", "¿Te acordás de esta?", "¿Cuál es la correcta?",
 "¿Cuál te gustó más?", "¿Qué pasó en el cuento?", "¿Quién era el personaje?", "¿Dónde estaba?",
 "¿Qué encontró?", "¿Cómo terminó la historia?", "¿Qué pasó al principio?", "¿Qué pasó al final?",
 "¿Cómo se sentía?", "¿Por qué pensás que hizo eso?", "¿Qué hubieras hecho vos?",
 "¿Querés jugar otra vez?", "¿Seguimos?", "¿Querés leer otro?", "¿Te animás con una más difícil?",
 "¿Cuántas palabras leíste?", "¿Me la leés vos?", "¿Qué ves en el dibujo?", "¿De qué color es?",
 "¿Es grande o chiquito?", "¿Dónde está Leo?", "¿Me ayudás a encontrarla?", "¿Lo intentamos juntos?",
]),
"emociones_sofia": ("[warmly]", 0.60, 0.42, [
 "¡Qué divertido!", "¡Me encanta esta palabra!", "Esta es una de mis favoritas.", "¡Ja, ja! ¡Qué gracioso!",
 "¡Uh, qué sorpresa!", "Mmm... ¡qué rico suena eso!", "¡Qué lindo dibujo!", "¡Mirá qué lindo!",
 "¡Uy, qué miedo! Es broma.", "Shh... escuchá.", "¡Ay, qué ternura!", "¡Esto me pone muy feliz!",
 "Estoy muy orgullosa de vos.", "Me alegra mucho que leas conmigo.", "¡Qué emoción!",
]),
"leo": ("[cheerfully]", 0.65, 0.38, [
 "¡Mirá a Leo, está contentísimo!", "Leo quiere jugar con vos.", "¡Leo te está aplaudiendo!",
 "Leo dice que sos muy inteligente.", "Leo también está aprendiendo a leer.", "¡Leo rugió de alegría!",
 "Ayudemos a Leo a encontrar la palabra.", "Leo se perdió. ¿Lo ayudamos?", "Leo tiene hambre de palabras.",
 "¡Uy! Leo se quedó dormido. ¡Despertalo leyendo!", "Leo te trajo una sorpresa.", "¡Vamos, Leo, vamos!",
]),
"autonomia": ("[gently]", 0.45, 0.50, [
 "Ahora sin ayuda.", "Esta vez no te la leo. ¡Probá vos!", "Yo sé que podés solito.",
 "Si necesitás ayuda, tocá el parlante.", "Tomate tu tiempo.", "No hay apuro.", "Pensá y después tocá.",
 "Primero mirá todas las opciones.", "Leé todas antes de elegir.", "Confiá en lo que ves.",
 "Si no estás seguro, probá.", "Vos podés.", "Yo te acompaño.",
]),
}


def main():
    os.makedirs(os.path.join(AQUI, "cola"), exist_ok=True)
    salida = os.path.join(AQUI, "cola", "10-sofia-intervenciones.jsonl")
    vistos = set()
    n = 0
    with open(salida, "w", encoding="utf-8") as f:
        for cat, (tag, estilo, estab, frases) in C.items():
            for i, texto in enumerate(frases, 1):
                if texto in vistos:
                    continue
                vistos.add(texto)
                id_ = f"sofia-{cat}-{i:03d}"
                f.write(json.dumps({
                    "id": id_, "categoria": cat, "texto": texto, "voz": "jessica",
                    "tag": tag, "estilo": estilo, "estab": estab, "nivel": None,
                    "archivo": f"sofia/{cat}/{id_}.mp3",
                }, ensure_ascii=False) + "\n")
                n += 1
    print(n, "frases →", salida)


if __name__ == "__main__":
    main()
