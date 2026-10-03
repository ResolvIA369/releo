# Textos a revisar: biblioteca-voz/cola

Fecha: 2026-10-03. Revisión SÓLO de marcado: no se modificó ningún archivo de cola/ ni se llamó a ninguna API. Formato de cada hallazgo: `archivo | id | motivo`.

## Ítems revisados

Total 2399 filas en 18 archivos de cola/*.jsonl.

| Categoría | Archivos | Ítems |
|---|---|---|
| Intervenciones de Sofía (saludos 24, inicio 26, consignas 42, refuerzo 70, errores 40, pistas 24, transiciones 34, finalización 28, preguntas generales 27, emociones 15, Leo 12, autonomía 13) | 10- | 355 |
| Sofía extra (fórmulas de cuento 20, guía de lectura 20, rutina 20, afecto 12, técnico 10) | 15- | 82 |
| Palabras (27 con texto_tts) | 40- | 771 |
| Frases | 50-, 51- | 371 (251 + 120) |
| Microhistorias (nivel 1, 2 y 3) | 60-, 62-, 64- | 110 (40 + 40 + 30) |
| Preguntas de comprensión de microhistorias | 61-, 63-, 65- | 330 (120 + 120 + 90) |
| Cuentos (28 cuentos x 5 escenas) | 70-, 72-, 74- | 140 escenas |
| Preguntas de comprensión de cuentos | 71-, 73-, 75- | 140 (40 + 40 + 60) |
| Sílabas y vocales (revisadas sólo para la sección 1 y el texto_tts) | 80- | 100 |

## Método

Automático (scripts en /tmp/claude-1000/q/, no en el repo): conteo por categoría; búsqueda "doman"/"glenn" sin distinguir mayúsculas sobre las líneas completas (texto, texto_tts y extra); regex de tuteo y regionalismos (tú, tienes, puedes, eres, quieres, ven, mira/escucha/toma en imperativo, aquí, coche, pastel, zumo, gafas, etc.) con revisión manual del contexto de cada coincidencia (el regex da muchos falsos positivos con la 3.ª persona narrativa); cruce de cada respuesta de las 470 preguntas con el texto de su historia (palabras de la respuesta ausentes de la historia); búsqueda de tokens ingleses y onomatopeyas.

Lectura propia (todo el corpus, no sólo muestras): las 355+82 frases de Sofía, las 371 frases, las 110 microhistorias y las 28 historias completas (140 escenas) con cada una de sus 470 preguntas y respuestas, y las 771 palabras. Las secciones 2 (inglés), 4 (contenido), 5 (parecidos) y el criterio de qué es dudoso en 3 y 6 son juicio propio, sin diccionario: /usr/share/dict no existe en el sistema, así que el barrido de palabras inglesas lo hice leyendo la lista de 771 palabras y comparando por grafía idéntica con palabras inglesas comunes (puede haber omisiones en palabras inglesas poco frecuentes). El parecido con cuentos conocidos (sección 5) sale de mi memoria de obras; no verifiqué con búsqueda externa. La pronunciación real del TTS no se probó: toda la sección 2 son riesgos a verificar escuchando.

Nota: la consigna decía 28 palabras con texto_tts ya tratadas; el archivo tiene 27 (más 100 en 80-silabas.jsonl, que son sílabas). No investigué la diferencia.

## Conteo de hallazgos por sección

| Sección | Hallazgos (líneas) |
|---|---|
| 1. "Doman" | 1 (agrupa 100 filas de 80-silabas.jsonl; sólo en extra.experimental, 0 en texto hablado) |
| 2. Palabras/tokens con homografía inglesa sin texto_tts | 35 (25 palabras de 40-palabras.jsonl + 10 de frases/Sofía/cuentos con onomatopeyas o préstamos ingleses) |
| 3. Vocabulario no rioplatense | 18 (tuteo real: 3 casos en micro-n1-13, micro-n2-09, cuento-05-e5) |
| 4. Contenido dudoso 3-7 años | 22 |
| 5. Parecidos con cuentos conocidos | 16 (3 muy cercanos: sopa de piedras, ¿Eres tú mi mamá?, hombre de jengibre) |
| 6. Preguntas con respuesta ambigua | 14 (de 470) |
| 7. Otros (errores de texto, género, repeticiones) | 22 |

## 1. Apariciones de "Doman" / "Glenn Doman" / "método Doman"

80-silabas.jsonl | silaba-a ... silaba-ci (las 100 filas, mismo texto) | "Doman" aparece SÓLO en el campo interno extra.experimental: "sílaba aislada por TTS: escuchar antes de usar; REleo es Doman, no silábico". No está en texto ni en texto_tts, no se locuta ni se muestra. En el contenido hablado hay 0 apariciones ("Glenn" y "método Doman": 0 en todo el corpus).

## 2. Palabras que existen también en inglés y NO tienen texto_tts

Criterio: grafía idéntica a una palabra inglesa corriente (el detector de idioma del TTS ve la misma cadena). No hay /usr/share/dict en el sistema; hice el barrido propio, leyendo las 771 palabras una por una. Prioridad: alta = pronunciación inglesa muy probable y distinta; media = posible; baja = dudosa. Las 27 con texto_tts (pony, koala, panda, hámster, animal, pizza, pasta, kiwi, yogur, cola, robot, piano, dado, cactus, beige, color, once, par, sed, taxi, moto, motor, hotel, tuba, foto, doctora, señor) no se tocaron. (La consigna decía 28; el archivo tiene 27 palabras con texto_tts.)

40-palabras.jsonl | palabra-lib-auto | "auto" (ALTA): inglés /ˈɔːtoʊ/; sin texto_tts. Sugerido: "áuto".
40-palabras.jsonl | palabra-lib-plaza | "plaza" (ALTA): inglés /ˈplɑːzə/ ("plaza", centro comercial).
40-palabras.jsonl | palabra-lib-patio | "patio" (ALTA): inglés /ˈpætioʊ/; riesgo de "pátio".
40-palabras.jsonl | palabra-lib-arena | "arena" (ALTA): inglés /əˈriːnə/ (estadio).
40-palabras.jsonl | palabra-lib-chocolate | "chocolate" (ALTA): inglés /ˈtʃɒklət/.
40-palabras.jsonl | palabra-lib-camping | "camping" (ALTA): inglés idéntico; en AR se dice "cámping" con acento propio; el TTS lo lee a la inglesa.
40-palabras.jsonl | palabra-lib-collar | "collar" (ALTA): inglés /ˈkɒlər/ ("cuello de camisa").
40-palabras.jsonl | palabra-lib-cartel | "cartel" (ALTA): inglés /kɑːrˈtɛl/ ("cartel", narcos).
40-palabras.jsonl | palabra-lib-mate | "mate" (ALTA): inglés /meɪt/ ("compañero"); riesgo de "meit".
40-palabras.jsonl | palabra-lib-bravo | "bravo" (ALTA): inglés /ˈbrɑːvoʊ/.
40-palabras.jsonl | palabra-lib-living | "living" (ALTA): inglés "living" /ˈlɪvɪŋ/; en AR se dice "lí-bing"; hoy lo leería inglés, verificar cuál sale.
40-palabras.jsonl | palabra-lib-short | "short" (ALTA): inglés /ʃɔːrt/; en AR se dice casi igual, pero conviene fijar cuál queremos (hoy depende del TTS).
40-palabras.jsonl | palabra-lib-familiar | "familiar" (ALTA): inglés /fəˈmɪljər/.
40-palabras.jsonl | palabra-lib-vocal | "vocal" (MEDIA): inglés /ˈvoʊkəl/ ("vocal").
40-palabras.jsonl | palabra-lib-mono | "mono" (MEDIA): inglés /ˈmɒnoʊ/ ("mono").
40-palabras.jsonl | palabra-lib-burro | "burro" (MEDIA): inglés /ˈbɜːroʊ/ (burrito).
40-palabras.jsonl | palabra-lib-mosquito | "mosquito" (MEDIA): inglés /məˈskiːtoʊ/.
40-palabras.jsonl | palabra-lib-flamenco | "flamenco" (MEDIA): inglés /fləˈmɛŋkoʊ/ (baile).
40-palabras.jsonl | palabra-lib-margarita | "margarita" (MEDIA): inglés /ˌmɑːrɡəˈriːtə/ (cóctel).
40-palabras.jsonl | palabra-lib-tortilla | "tortilla" (MEDIA): inglés /tɔːrˈtiːə/.
40-palabras.jsonl | palabra-lib-sombrero | "sombrero" (MEDIA): inglés /sɒmˈbrɛəroʊ/.
40-palabras.jsonl | palabra-lib-peso | "peso" (MEDIA): inglés /ˈpeɪsoʊ/ (moneda); está en el bloque "pares" (peso/beso) donde la pronunciación contrastiva importa.
40-palabras.jsonl | palabra-lib-fresco | "fresco" (MEDIA): inglés /ˈfrɛskoʊ/ (pintura mural).
40-palabras.jsonl | palabra-lib-empanada | "empanada" (BAJA): inglés /ˌɛmpəˈnɑːdə/.
40-palabras.jsonl | palabra-lib-sal | "sal" (BAJA): "Sal" (nombre propio) en inglés; palabra muy corta, el detector de idioma suele fallar con 3 letras.
40-palabras.jsonl | palabra-lib-prima | "prima" (BAJA): inglés /ˈpriːmə/ ("prima donna").
50-frases.jsonl | frase-lib-n1-045 ... frase-lib-n1-050 ("Hay leche.", "Hay sopa.", "Hay pan.", "Hay un gato.", "Hay una flor.", "Hoy hay sol.") | frases de 2-4 palabras que empiezan con "Hay" (inglés "hay" = heno /heɪ/); frase-lib-n1-047 "Hay pan." tiene dos palabras que son inglés ("hay", "pan"), sin contexto para el detector; riesgo real de locución inglesa. Probar escucha.
50-frases.jsonl | frase-lib-n1-012 | "Yo como pan." (3 palabras cortas; "pan" = sartén en inglés). Misma advertencia, riesgo menor.
10-sofia-intervenciones.jsonl | sofia-refuerzo-024 | "¡Wow, qué rápido!": "Wow" es inglés; en una frase en español el TTS puede ir a inglés o deletrear. Verificar escucha.
74-cuentos-extra2.jsonl | cuento-20-e1, cuento-20-e3, cuento-20-e4, cuento-20-e5 | onomatopeya inglesa "Squish, squish" (5 repeticiones); el TTS en español probablemente dice "esquish". Mejor "chof, chof"/"cuich" o tts explícito.
74-cuentos-extra2.jsonl | cuento-25-e2, cuento-25-e3, cuento-25-e4, cuento-25-e5 | "la Cosquillator": palabra híbrida con terminación inglesa; la pronunciación no está definida (cosquilléitor / cosquilátor).
72-cuentos-extra.jsonl | cuento-14-e2 | "crunch, crunch, crunch": onomatopeya inglesa; en español "crunch" (suena /kruntʃ/) es aceptable pero conviene verificar.
60-microhistorias.jsonl | micro-n2-09 | "¡Splash!" (inglés). También en 62-microhistorias-extra.jsonl | micro-x-n1-06 "¡Splash!". Otras onomatopeyas de la colección usan "Plash"/"Plaf" (micro-n1-03, micro-x-n1-03): inconsistente.
64-microhistorias-n3-extra.jsonl | micro-y-n3-20 | "hello, hello" / "hello!" / "un pequeño hello": aquí la palabra inglesa es el chiste; debe sonar inglés ("helóu") y el resto del texto, español. Sin texto_tts ni marcado de idioma; verificar escucha.
62-microhistorias-extra.jsonl | micro-x-n2-14 | "En el shopping" (inglés /ˈʃɒpɪŋ/; en AR se dice "shópin"); y también aparece en 63-preguntas-micro-extra.jsonl | micro-x-n2-14-p1 "¿Qué miraba Teo en el shopping?". Verificar escucha.

## 3. Vocabulario no rioplatense (tuteo y regionalismos)

Método: regex sobre todo el corpus (tienes, puedes, eres, quieres, ven, tú, vosotros, aquí, coche, zumo, pastel, etc.) más lectura propia de todo el texto narrativo. Distinguí 3.ª persona narrativa (no marcada) de imperativo/indicativo tuteado (marcado). No hay un solo "tú", "tienes", "puedes", "quieres", "vosotros", "ordenador", "zumo", "gafas", "patata", "piscina": 0 apariciones. Los hallazgos reales son pocos.

60-microhistorias.jsonl | micro-n1-13 | Imperativo tuteado: "Un pájaro le dice: toma aire." (vos: "tomá aire"). "La nube toma aire" (3.ª persona) está bien.
60-microhistorias.jsonl | micro-n2-09 | Tuteo en diálogo: "no vuelas por el aire, pero mira" (vos: "no volás por el aire, pero mirá").
70-cuentos.jsonl | cuento-05-e5 | Tuteo: "si un día pasas por ahí y ves una puerta" (vos: "pasás"; "ves" ya es válido en voseo).
60-microhistorias.jsonl | micro-n2-08 | Regionalismo: título y texto "Dos calcetines y un lunar" / "calcetín(es)" (AR: medias; el propio corpus usa "medias" en micro-n1-14, micro-n2-04 y en palabras). Además "¡Aquí estás!" (AR: "acá"). La pregunta 61-preguntas-micro.jsonl | micro-n2-08-p1 "¿Cómo eran los calcetines?" hereda el término.
50-frases.jsonl | frase-lib-n2-017 | "Mi abuela hace un pastel." (AR: torta; "torta" existe en palabras y en frases, p. ej. frase-lib-n2-078). Mismo tema en 64-microhistorias-n3-extra.jsonl | micro-y-n3-21 ("pastelero", "el pastel más grande del mundo") y 65-preguntas-micro-n3-extra.jsonl | micro-y-n3-21-p2 ("¿Con qué cortaron el pastel?").
51-frases-extra.jsonl | frase-x-n2-038 | "El bus escolar llega a las ocho." (AR: colectivo/micro escolar; el corpus usa "colectivo" en frase-lib-n3-063 y micro-x-n2-07).
51-frases-extra.jsonl | frase-x-n1-041 | "Armo un puzzle." (palabras tiene "rompecabezas", más rioplatense para 3-7 años). Igual en frase-x-n2-032 ("Armamos un puzzle de cien piezas.").
50-frases.jsonl | frase-lib-n2-015 | "Los niños juegan en el patio." (neutro; el corpus usa nene/nena/chicos; "niños" no es error pero es menos rioplatense).
40-palabras.jsonl | palabra-lib-coche | "coche": en AR es el cochecito de bebé o, en España, el auto. Ya existe "auto" en el corpus; tiene sentido ambiguo para un nene argentino (coche = carro de bebé).
40-palabras.jsonl | palabra-lib-cometa | "cometa": España/México; en AR es "barrilete" (que también está en la lista, palabra-lib-barrilete). Dos palabras para el mismo objeto, la de menor uso local se podría sacar.
40-palabras.jsonl | palabra-lib-pizarra | "pizarra": válido pero en AR de escuela se dice "pizarrón" (baja prioridad).
64-microhistorias-n3-extra.jsonl | micro-y-n3-13 | "El portero se rascó la gorra" (AR: encargado; "portero" se entiende pero es de España/otros). Baja prioridad.
60-microhistorias.jsonl | micro-n3-09 | "el portaequipajes" de la bicicleta (AR: "parrilla"; "portaequipajes" es neutro, baja prioridad).
15-sofia-extra.jsonl | sofia-tecnico-008 | "Tocá aquí para escuchar." (el resto del corpus usa "acá": sofia-preguntas_generales-002 "¿Qué dice acá?").
64-microhistorias-n3-extra.jsonl | micro-y-n3-20 | Referencia metalingüística: "ladraba perfecto en español rioplatense, con voseo y todo" (un chico de 3-7 años no sabe qué es voseo; el chiste no se entiende). Contenido para adultos dentro de un cuento infantil.
10-sofia-intervenciones.jsonl | sofia-refuerzo-024 | "¡Wow, qué rápido!": anglicismo evitable ("¡Guau!", "¡Uy, qué rápido!"). Ver también sección 2.
15-sofia-extra.jsonl | sofia-rutina-013 | "Desbloqueaste un mundo nuevo." jerga de videojuego (desbloquear); innecesario para 3-7 años.
40-palabras.jsonl | palabra-lib-mira, palabra-lib-escucha, palabra-lib-habla, palabra-lib-toma, palabra-lib-camina, palabra-lib-saca, palabra-lib-trae, palabra-lib-lleva, palabra-lib-pide, palabra-lib-cuenta, palabra-lib-ayuda, palabra-lib-prueba, palabra-lib-espera, palabra-lib-guarda, palabra-lib-ordena (y todo el bloque de verbos en 3.ª persona) | Formas ambiguas entre 3.ª persona ("él mira") e imperativo tuteado ("tú mira"; en voseo sería "mirá"). Se leen como 3.ª persona por convivir con "comen", pero sin sujeto en pantalla (palabra suelta) el nene lo verá como orden. Revisar si la ilustración/uso las trata como acción de otro.

## 4. Contenido dudoso para 3-7 años

Nada de muerte, sangre, violencia ni temas adultos fuertes en las historias: todos los miedos se resuelven con buen final. Los hallazgos son conductas imitables o susto moderado.

64-microhistorias-n3-extra.jsonl | micro-y-n3-13 | "sacó el techo del ascensor. Las jirafas subieron con los cuellos afuera": viajar con el cuerpo fuera del ascensor; peligro imitable (grave si el niño lo toma como juego).
62-microhistorias-extra.jsonl | micro-x-n2-14 | "Subió y bajó cinco veces corriendo en contra" de una escalera mecánica; conducta peligrosa imitable, sin ninguna consecuencia en el texto.
74-cuentos-extra2.jsonl | cuento-18-e2 | El abuelo lleva a la nena a la huerta cuando "a lo lejos algo gruñó" (tormenta con truenos); en e3 caminan bajo la lluvia. Salir al aire libre en tormenta eléctrica es riesgo real, presentado sin precaución. Además el tema central es el miedo a los truenos (apropiado, pero la conducta no).
72-cuentos-extra.jsonl | cuento-16-e2 | Miedo moderado: noche sola en carpa, "Leo se tapó hasta las orejas", ruidos y "una sombra enorme que se movía... Tragó saliva", sale a investigar solo de noche. Se resuelve bien (era su propia sombra); sensible para 3-4 años a la hora de dormir.
74-cuentos-extra2.jsonl | cuento-28-e2 | "se coló por una rejilla. Cayó a un caño oscuro": Mateo "lo seguía corriendo" por la calle con lluvia; invita a jugar cerca de alcantarillas/corrientes de calle. Riesgo bajo.
72-cuentos-extra.jsonl | cuento-10-e3 | Cruzar un río "metió una pata... un paso, otro" con el agua a la panza; es una fábula de superar miedo y lo guía un pájaro, pero modela vadear un río solo (peligro imitable, bajo).
70-cuentos.jsonl | cuento-07-e3 | "un vecino llamado Pablo, al que sorprendió escondido en el baño": un adulto escondido en la casa; confuso para seguridad infantil (extraños en casa). Baja prioridad pero fácil de corregir.
72-cuentos-extra.jsonl | cuento-09-e4 | "Leo encendió un fuego chiquito y calentó leche con miel en una cacerola": fuego/cocina por un personaje que es modelo del niño (Leo). Bajo.
64-microhistorias-n3-extra.jsonl | micro-y-n3-21 | "con un fuego de leña" en la plaza y "Un nene trajo una sierra de su papá" (herramienta peligrosa; se resuelve con "mejor una pala"). Bajo.
64-microhistorias-n3-extra.jsonl | micro-y-n3-06 | "La señora Lola leyó una carta de amor que no era para ella": tema romántico y correspondencia ajena; muy leve.
60-microhistorias.jsonl | micro-n3-01 | "Valentina lo probó sin permiso" (el abrigo de la abuela) y el cuento premia la transgresión (descubre la receta). Bajo.
74-cuentos-extra2.jsonl | cuento-27-e4 | "Hace veinte años que nadie me escribe" + lágrima: soledad de una anciana; tono triste pero con final cálido. Bajo.
40-palabras.jsonl | palabra-lib-bala | "bala": en el bloque "pares" aparece sin contexto; para un nene argentino "bala" = proyectil (también golosina, en otros países). Sin ilustración clara puede asociarse a arma.
40-palabras.jsonl | palabra-lib-mina | "mina": explosivo, y en lunfardo "mujer" (despectivo). Mejor evitar o desambiguar con ilustración.
40-palabras.jsonl | palabra-lib-cana | "cana": lunfardo (policía/cárcel) o cabello blanco; sin contexto, riesgo de lectura no infantil.
40-palabras.jsonl | palabra-lib-carcel | "cárcel": tema de adultos en vocabulario infantil (junto a "patrullero", "soldado", "pirata"); revisar si hace falta.
40-palabras.jsonl | palabra-lib-fosforo | "fósforo": objeto de fuego que el niño puede querer imitar; sólo cuidar la ilustración.
40-palabras.jsonl | palabra-lib-bomba | "bomba": ambigua (bomba de agua vs. explosivo); con ilustración neutra no es problema, sin ella evoca explosivo.
40-palabras.jsonl | palabra-lib-sangre | "sangre": vocabulario del cuerpo, normal; sólo cuidar la ilustración.
40-palabras.jsonl | palabra-lib-enano | "enano": puede leerse como despectivo para una persona de talla baja; palabra de cuento (el enano), revisar si se quiere.
40-palabras.jsonl | palabra-lib-bebote | "bebote": palabra rara/despectiva ("bebé grande") sin uso infantil claro; revisar.
40-palabras.jsonl | palabra-lib-cuchillo, palabra-lib-serrucho | Herramientas cortantes: vocabulario normal; sólo cuidar que la ilustración no invite a usarlos.

## 5. Parecidos con cuentos o fábulas conocidas

62-microhistorias-extra.jsonl | micro-x-n1-18 | "Pepe y el pan": el pan rueda por la puerta, "todos corren atrás del pan" (Pepe, un perro, una nena). Es "El hombre de jengibre / La torta rodante"; muy cercano.
62-microhistorias-extra.jsonl | micro-x-n1-04 | "Piti y el zapato": el pollito que sigue a un zapato creyéndolo su mamá = "¿Eres tú mi mamá?" (P. D. Eastman) y el patito feo; muy cercano.
60-microhistorias.jsonl | micro-n2-14 | "La sopa de piedras de la zorra": es el cuento tradicional "Sopa de piedras"/"Stone Soup", casi sin cambios (olla, piedras, cada vecino trae una verdura).
64-microhistorias-n3-extra.jsonl | micro-y-n3-05 | "Nina y el monstruo del placard": monstruo chiquito y peludo con miedo en el placard = Monsters, Inc. (Disney/Pixar) / "Hay un monstruo en mi armario".
64-microhistorias-n3-extra.jsonl | micro-y-n3-17 | "El cangrejo que caminaba derecho": fábula de Esopo "El cangrejo y su madre" (el cangrejo que quiere caminar derecho); sólo cambia el final.
70-cuentos.jsonl | cuento-08 (escenas e1 a e5) | "Leo y el rugido chiquito": león que no sabe rugir y se avergüenza = Simba (El Rey León, Disney) y el libro "El león que no sabía rugir"; además la estructura "el pequeño ayuda al grande" es "El león y el ratón" (Esopo).
72-cuentos-extra.jsonl | cuento-15 (e1 a e5) | "La ballena que cantaba bajito": rasgo que la avergonzaba resulta salvar al grupo en la tormenta = Rudolph, el reno de la nariz roja (la nariz en la niebla/tormenta).
70-cuentos.jsonl | cuento-07 (e1 a e5) | "El cumpleaños del fantasma tímido": fantasma amistoso y solitario que se esconde = Casper / Gasparín.
74-cuentos-extra2.jsonl | cuento-28 (e1 a e5) | "El viaje del barquito de papel": barquito de papel por la calle con lluvia, la rejilla, el caño oscuro, el arroyo y el mar = episodio del barquito de papel de "El soldadito de plomo" (Andersen).
70-cuentos.jsonl | cuento-06 (e1 a e5) | "La tortuga que llegaba tarde": tortuga lenta con la moral inversa de "La liebre y la tortuga" (Esopo); parentesco leve.
64-microhistorias-n3-extra.jsonl | micro-y-n3-14 | "Tomás y su sombra perezosa": sombra con voluntad propia que se va = Peter Pan (la sombra que se escapa); parentesco leve.
62-microhistorias-extra.jsonl | micro-x-n1-09 | "El cocodrilo y la muela": dentista chiquito que mete el cuerpo en la boca de un animal grande = "Doctor De Soto" (William Steig) / "El cocodrilo y el dentista" popular; parentesco medio.
60-microhistorias.jsonl | micro-n1-06 | "El pez que no quería nadar": pez que salva a una hormiga sobre una hoja = "La paloma y la hormiga" (Esopo) con los papeles invertidos; parentesco leve.
62-microhistorias-extra.jsonl | micro-x-n1-16 | "Ramón y el queso": "la luna es un queso" es folclore de la luna de queso; parentesco leve.
62-microhistorias-extra.jsonl | micro-x-n1-03 | "Tito en el barro": cerdito que salta en charcos de barro = Peppa Pig; parentesco leve.
60-microhistorias.jsonl | micro-n1-11 | "El perro y la sombra": perro que persigue "algo negro" que es su propia sombra, cercano a "El perro y su reflejo" (Esopo); parentesco leve.

## 6. Preguntas de comprensión con respuesta ambigua o que no se desprende claro de la historia

Método: script que cruza cada respuesta con el texto de su historia (470 preguntas) para detectar palabras de la respuesta que no aparecen; después lectura de las 470 contra la historia. La mayoría son inferencias legítimas; listo sólo las que son dudosas.

61-preguntas-micro.jsonl | micro-n2-02-p3 | "¿Cómo llamó la jirafa al semáforo? => Amigo de tres ojos": en la historia lo llama "¡Hola, amigo!"; "amigo de tres ojos" lo dice al final ante los animales ("me guió un amigo de tres ojos"). Respuesta parcialmente válida: "amigo" también es correcta.
61-preguntas-micro.jsonl | micro-n2-05-p3 | "¿Con quiénes lo compartió Lucía? => Con los vecinos": el texto dice "lo compartió con todos"; los vecinos "la seguían", pero "todos" no se nombra como vecinos.
61-preguntas-micro.jsonl | micro-n1-09-p2 | "¿Quién se llevó el globo? => El viento": el texto sólo dice "Sopla el viento. ¡Fuuu! El globo se va"; causalidad inferida, nunca dicha.
61-preguntas-micro.jsonl | micro-n3-07-p2 | "¿Por qué estaba en peligro el barco? => Había niebla y la luz titilaba": respuesta de dos causas; el texto agrega "estaba cerca de las rocas y no veía nada". Una respuesta correcta distinta (las rocas) quedaría marcada como mal.
63-preguntas-micro-extra.jsonl | micro-x-n1-04-p2 | "¿A quién cree Piti que es su mamá? => A un zapato": el texto nunca dice "cree"; sólo "¡Mamá! dice Piti. Sigue al zapato". Inferencia.
63-preguntas-micro-extra.jsonl | micro-x-n1-10-p3 | "¿Cuántas gotas hay al final? => Diez": el texto dice "la red tiene diez perlas" (no gotas) y narra sólo "otra gota. Y otra gota". Contar diez exige igualar perlas con gotas.
63-preguntas-micro-extra.jsonl | micro-x-n1-12-p3 | "¿Qué hacen Rufo y el grillo? => Cantan juntos a la luna": el texto dice "Ya tiene un amigo para cantar a la luna" (intención futura) y "Auuu / Cri, cri" alternados, no que canten juntos.
63-preguntas-micro-extra.jsonl | micro-x-n1-14-p2 | "¿Cómo es el tomate? => Rojo, redondo y enorme": "enorme" no aparece (el texto dice "rojo y redondo... como una pelota", "crece y crece").
65-preguntas-micro-n3-extra.jsonl | micro-y-n3-01-p3 | "¿Qué hizo Facundo cuando llegó tarde? => Se sacó todo y se fue a nadar": el texto nunca dice que llegó tarde; "Cuando terminó, la escuela ya había cerrado". Pregunta con premisa implícita.
65-preguntas-micro-n3-extra.jsonl | micro-y-n3-16-p3 | "¿Cuántas abejas esperaban su turno al final? => Siete, Zumba más otra y otras cinco": requiere sumar 1+1+5 con datos dispersos ("otra abeja", "otras cinco") y el texto no da el total; no apta para 3-7 años.
71-preguntas-cuentos.jsonl | cuento-04-p3 | "¿Qué sintió Dalia cuando llegó al mar? => Un poco de miedo, porque era enorme": en la misma escena también "le gustó mucho"; la respuesta esperada cubre sólo la primera emoción.
73-preguntas-cuentos-extra.jsonl | cuento-15-p4 | "¿Qué pasó en la bahía un día? => Hubo una tormenta enorme": pregunta abierta; en la bahía pasan varias cosas (cantan, Marea practica, tormenta, rescate). Hay varias respuestas válidas.
75-preguntas-cuentos-extra2.jsonl | cuento-18-p4 | "¿Qué hacían... cuando se escuchaba un trueno? => Contaban para saber qué tan lejos estaba": el texto muestra que cuentan pero nunca explica el para qué; se apoya en conocimiento externo.
75-preguntas-cuentos-extra2.jsonl | cuento-23-p2 | "¿Cómo se sintió Leo después del primer gol? => Con vergüenza, con las orejas caídas": el texto dice "orejas caídas y la cara calentita", "Se había equivocado frente a todos", pero nunca nombra "vergüenza"; también podría decirse "triste".

## 7. Otros hallazgos fuera de las seis secciones (errores de texto, género, repeticiones)

60-microhistorias.jsonl | micro-n2-05 | Error de palabra: "La heladera se había equivocado de cartel" (la historia dice "heladería" antes; "heladera" = refrigerador).
70-cuentos.jsonl | cuento-08-e5 | Error de conjugación en la narración: "Él se sube a su roca, toma aire y rugí: ¡mrrr!" (debería ser "ruge").
74-cuentos-extra2.jsonl | cuento-26-e5 | Inconsistencia de género: Nube es "un gatito" en e1 a e3 y luego "Toto la cuidaba de las moscas".
62-microhistorias-extra.jsonl | micro-x-n2-02 | "La pulpo Olga": género gramatical incoherente ("la pulpo"; "el pulpo"/"la pulpa"). Además "ocho patas" mientras micro-y-n3-01 y cuento-19 dicen "brazos".
62-microhistorias-extra.jsonl | micro-x-n2-10 | "Mamá le dio agua de cabeza": frase poco clara (remedio del hipo con agua bebida al revés) para un oyente de 3-7 años.
60-microhistorias.jsonl | micro-n1-08 | El personaje se llama "Nena" sin artículo ("Nena ve a la vaca. Nena tiene un sombrero."); suena a sustantivo común. También en 61-preguntas-micro.jsonl | micro-n1-08-p2 "¿Qué le puso Nena a la vaca?".
74-cuentos-extra2.jsonl | cuento-25-e4 | Frase ilegible: "Mejor tu máquina que no sirve, dijo, que este invento." (no se entiende quién es el invento ni el contraste).
64-microhistorias-n3-extra.jsonl | micro-y-n3-09 | "le dio la mitad de su bufanda de bayas secas": incoherente (¿bufanda hecha de bayas?).
64-microhistorias-n3-extra.jsonl | micro-y-n3-27 | "Aurora le dijo que había venido a comprar, pero que no pensaba": críptico para oyentes de 3-7 años.
70-cuentos.jsonl | cuento-06-e4 | "Todos los demás animales me contaron lo que vieron en el camino: a vos. Ya te vieron pasar": confuso (el rey habla de que los animales "la vieron" pasar).
10-sofia-intervenciones.jsonl | sofia-refuerzo-069 | "¡Vamos todavía!" no es una frase natural en español; probable error de redacción ("¡Vamos que todavía hay más!"?).
10-sofia-intervenciones.jsonl | sofia-finalizacion-005 | Género masculino por defecto: "Podés estar muy orgulloso de tu esfuerzo" (chicas usuarias de la app).
10-sofia-intervenciones.jsonl | sofia-saludos-015 | "¿Preparado el corazón y los ojos?" (masculino por defecto, y frase de manual).
10-sofia-intervenciones.jsonl | sofia-inicio-024 | "Sentate cómodo y mirá la pantalla." (masculino por defecto).
10-sofia-intervenciones.jsonl | sofia-autonomia-011 | "Si no estás seguro, probá." (masculino por defecto).
10-sofia-intervenciones.jsonl | sofia-refuerzo-068 | "¡Sos un gran lector!" (masculino por defecto). Idem sofia-finalizacion-018 "Hoy fuiste un gran lector", sofia-saludos-020 "¡Hola, amigo lector!", sofia-refuerzo-053 "como un campeón".
15-sofia-extra.jsonl | sofia-afecto-004 | "Me encanta que seas tan curioso." (masculino por defecto).
10-sofia-intervenciones.jsonl | sofia-refuerzo-041 | "¡Lo leíste solito!" (y autonomia-003 "podés solito"): masculino por defecto.
60-microhistorias.jsonl | micro-n3-07 | Casi duplicado conceptual de 74-cuentos-extra2.jsonl | cuento-21 (faro, gaviota, niebla, barco en peligro, campana/luz); mismo esquema argumental dos veces en el corpus.
62-microhistorias-extra.jsonl | micro-x-n2-13 | Concepto duplicado en 64-microhistorias-n3-extra.jsonl | micro-y-n3-07 (rana que hace un sonido que no es de rana, cuac/muuu).
60-microhistorias.jsonl | micro-n1-12 | Concepto duplicado en 64-microhistorias-n3-extra.jsonl | micro-y-n3-30 (el eco que contesta, el nene lo toma por un amigo).
60-microhistorias.jsonl | micro-n2-03 | Barquito de papel y charco, repetido en 74-cuentos-extra2.jsonl | cuento-28 (mismo objeto/idea).
Nombres propios repetidos entre piezas distintas | Bruno (cuento-03 oso, cuento-20 amigo invisible, micro-n3-09 oso), Baltasar (cuento-06 elefante, micro-x-n2-09 búho, micro-y-n3-25 rey), Gaspar (micro-x-n2-18, micro-y-n3-15), Lalo (micro-x-n1-01, cuento-24, micro-y-n3-13), Tito/Tino (cuento-03 zorro Tito, micro-x-n1-03 cerdito Tito, cuento-19 pulpo Tino), Aurelio (micro-x-n2-03 y cuento-17), Matías (micro-n3-12 y cuento-22). Conviene variar para que el niño no confunda personajes.
