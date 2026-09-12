# REleo — Juegos V2: aprender a leer jugando

**Fecha:** 2026-09-11
**Alcance:** diagnóstico + arquitectura + elección y diseño de piloto. **Sin cambios de código.**
**Método:** inspección real del repo (`saas-factory/src`, `saas-factory/tests`, `saas-factory/public`), no del README (que está desactualizado en varios puntos — señalado abajo cada vez que aplica).

---

## 0. Principio que ordena todo el documento

> El niño gana porque reconoció la palabra escrita. El juego es el vehículo, la lectura es el objetivo.

Cada juego se juzga primero por si se puede ganar **sin leer**. Recién después, por cuánto divierte.

---

## 1. Resumen ejecutivo — los 5 hallazgos que más importan

1. **Hay un atajo real que rompe el principio central, y aparece en 2 de los 12 juegos.** En **Empareja Palabra-Imagen** y en **Categorías**, Sofía dice la palabra en voz alta *antes* de que el niño elija (`WordImageMatch.tsx`, `CategoryGame.tsx`). El niño puede jugar de oído y ganar sin leer una sola letra. El propio código de `WordImageMatch.tsx` ya resuelve esto correctamente para el resto de las locuciones ("decir la palabra solo DESPUÉS del acierto") — falta aplicar esa misma regla a la primera locución. Es el hallazgo más urgente del documento.
2. **La progresión Doman completa (palabra → pares → frases → historias) ya existe en los datos**, con las 44 sesiones del currículum trayendo `contextSentence` y `story5` en las 5 fases — pero **hoy solo la usa el Flash**. Ningún otro juego escala su complejidad ni su contenido con la fase. Es la oportunidad más grande de "progresión pedagógica = progresión de juego" sin generar contenido nuevo.
3. **Tu hipótesis de piloto (Leo Corre) no es la mejor candidata.** Leo Corre tiene, además, un problema pedagógico en Mundo 1: con 3 carriles y solo 2 con palabra (la tercera es una "piedra" de andamiaje), hay ~50% de probabilidad de acertar sin leer. **Leo Vuela** es la base técnica más madura —de hecho es el juego *del que se extrajeron* los sistemas compartidos de arcade (`docs/refactor-arcade-plan.md`, ya en el repo)— y no tiene ese atajo. Ver sección 8.
4. **No existe ningún sistema de "la palabra provoca algo en el mundo".** La idea central de la sección 6 del brief (consecuencia semántica post-acierto) no tiene ni un gancho técnico hoy: `useGameState` no dispara eventos, no hay mapa palabra→animación, y el único compositor de escenas por capas que existe (`src/illustration/`) es un remanente aislado de la feature "Cuenta Cuentos" (ya dada de baja) con un personaje zorro genérico, sin ningún asset de las 220 palabras del corpus.
5. **No existe narrativa entre mundos/juegos.** Ni un solo texto de Sofía conecta un mundo con otro o dice por qué el niño está jugando. Es terreno limpio, no hay que deshacer nada.

---

## 2. Mapa real de la arquitectura (para orientarse)

```
src/features/games/
  config/game-registry.ts     → 12 juegos (id, nombre, ícono, minPhase — minPhase es campo MUERTO, no gatea nada)
  components/                 → 1 componente por juego + compartidos (GameShell, GameAmbience, GameIntro, GameSetup, ArcadeHud, ArcadeIntro)
  hooks/                      → useGameState (genérico), useGameSession (Flash), useArcadeEnergy/Level/Clock, useGameKeys, useDemoAutoplay
  config/audio-rules.ts       → tabla declarativa de cuándo habla Sofía por juego

src/features/progression/config/worlds.ts   → 5 mundos reales (nombres correctos abajo, el README tiene otros viejos)
src/features/session/config/curriculum.ts   → 44 sesiones, cada una con 5 palabras + contextSentence + story5
src/features/rewards/                       → RewardsLayer + GameCompleteScreen, compartido por los 12 juegos
src/illustration/                           → compositor de escenas por capas, AISLADO, de la feature "Cuenta Cuentos" (dada de baja), sin assets del corpus real
```

**Los 12 juegos reales** (registry, `game-registry.ts`):

| id | Nombre público | Ícono | Componente |
|---|---|---|---|
| `word-flash` | Flash de Palabras | ⚡ | `WordFlash.tsx` |
| `word-image-match` | Empareja Palabra-Imagen | 🖼️ | `WordImageMatch.tsx` |
| `memory-cards` | Rompecabezas | 🧩 | `MemoryCards.tsx` |
| `word-train` | Tren de Palabras | 🚂 | `WordTrain.tsx` |
| `phrase-builder` | Construye la Frase | 🧱 | `BuildSentence.tsx` |
| `word-rain` | Lluvia de Palabras | 🌧️ | `WordRain.tsx` |
| `category-sort` | Categorías | 🗂️ | `CategoryGame.tsx` |
| `word-fishing` | Pesca de Palabras | 🎣 | `WordFishing.tsx` |
| `daily-bits` | Burbujas Mágicas | 🫧 | `BitsReading.tsx` |
| `leo-runner` | Leo Corre | 🦁 | `LeoRunner.tsx` |
| `salta-palabra` | Salta la Palabra | 🦘 | `SaltaPalabra.tsx` |
| `leo-vuela` | Leo Vuela | 🪁 | `LeoVuela.tsx` |

("Cuenta Cuentos" existió y se dio de baja — comentario explícito en `game-registry.ts`: *"the stories were word lists that didn't form coherent narratives"*. El README raíz sigue listando "9 juegos" y varios nombres de mundo viejos — no usarlo como fuente para nada de esto.)

---

## 3. Flash de Palabras — auditoría (núcleo pedagógico, NO se gamifica)

- **Archivo:** `WordFlash.tsx` (~650 líneas), máquina de estados de 20 fases.
- **Mecánica real:** Ronda 1 (presentación ×3, FlipCard con giro 3D), Ronda 2 (repetición ×3, tap con `TimeBar`), Ronda 3 (historia con `story5`), repaso de la sesión anterior + "cuento de repaso", afirmación, despedida.
- **Fidelidad al método:** alta. Es exposición, no un quiz — no aplica la lógica de "atajo sin leer" de la misma forma que en los otros 11 juegos.
- **El problema que sí hay que resolver:** la palabra **no aparece instantánea**. Se revela con un giro 3D de 600ms (`FlipCard.tsx`), y Sofía empieza a nombrarla a los 200ms — es decir, mientras la tarjeta todavía está girando. Esto contradice exactamente el pedido de la sección 3 del brief ("la palabra debe seguir siendo la protagonista absoluta", "mínima distracción"). Es el ajuste más importante y más barato de todo el documento: bajar la duración del flip a algo casi imperceptible (o reemplazarlo por un fundido rápido) en `presentation` y `review`, sin tocar nada de la lógica de rondas.
- **Código muerto encontrado (no rompe nada, pero conviene decidir qué hacer):**
  - `highlightedWord` se declara y se lee en el render de la Ronda 3 (el JSX espera resaltar la palabra que Sofía está diciendo), pero **nunca se le asigna un valor** — el highlight sincronizado prometido no ocurre nunca.
  - Reconocimiento de voz (`useSpeechRecognition`, ~60 líneas) está completo pero jamás se invoca (`mic.start()` no se llama en ningún punto); `showMic`/`showTimer` están hardcodeados en `false`.
  - El bonus "+5 monedas al completar" que menciona el README no aparece en `WordFlash.tsx` ni en `RewardsLayer.tsx` — o vive en otro lugar no auditado, o es documentación vieja.
- **Tests:** `WordFlash.test.tsx` tiene 3 tests triviales (que la pantalla inicial renderiza). Cero cobertura de la máquina de estados, del cálculo de estrellas/monedas o del timeout de Ronda 2.
- **Progresión Doman ya implementada acá:** `curriculum.ts` trae `contextSentence` y `story5` completos para las 44 sesiones, las 5 fases — la pirámide palabra→pares→frases→historias que pide la sección 8 del brief **ya existe como dato**, solo el Flash la consume hoy.

**Propuesta V2 (conservadora, tal como pide la sección 3 del brief):**
- Acortar/eliminar el giro 3D durante la exposición (<150ms o fundido).
- Terminar `highlightedWord` para que la Ronda 3 resalte en vivo la palabra que se está narrando.
- Decidir sobre el código muerto de micrófono (borrar si no se retoma, o dejarlo documentado como pendiente).
- Nada de esto cambia el ritmo, la repetición ni la mecánica de reconocimiento global.

---

## 4. Auditoría pedagógica — los 11 juegos

### 4.1 Empareja Palabra-Imagen (`word-image-match`)

- **Mecánica:** palabra en texto arriba, 4 imágenes/emoji abajo, tocar la correcta. 7s por ronda.
- **Objetivo pedagógico real:** comprensión semántica (palabra→significado).
- **Etapa Doman/global:** verificación de comprensión, posterior al reconocimiento.
- **Fortalezas:** las imágenes son el mecanismo de respuesta en sí (no una pista decorativa al lado de un texto que delata la respuesta), eso es correcto por diseño. Distractores mezclados cada ronda.
- **Problema — CRÍTICO:** `sofiaNameWord(currentWord.text)` se dispara apenas se renderiza la ronda, **antes** de que el niño elija (comentario en el propio código: *"so the child knows which image to look for"*). El niño puede ganar el 100% de las rondas de oído, sin mirar el texto.
- **Atajo sin leer:** sí, total, por audio.
- **Diversión actual:** 4/10 — stagger animation en el grid, `VictoryBurst`, sin movimiento de escenario.
- **Propuesta V2:**
  - **Conservar:** el mecanismo de selección por imagen, el timing de 7s, el patrón de "decir la palabra solo tras el acierto" (ya existe en otra rama del mismo archivo — solo hay que aplicarlo también a la exposición inicial).
  - **Cambiar:** eliminar o convertir en opcional-bajo-demanda (botón 🔊) la locución previa a la elección.
  - **Animaciones propuestas:** consecuencia semántica post-acierto (el objeto de la imagen "cobra vida" un instante — perrito que mueve la cola, casa que se ilumina).
  - **Ambientación:** ninguna nueva necesaria, ya tiene layout claro.
  - **Recompensa:** la actual (moneda + confetti) + el gesto semántico de arriba.
  - **Función narrativa posible:** punto de entrada natural para "la palabra provoca algo" (sección 6 del brief) porque ya usa imágenes reales.
  - **Dificultad de implementación:** baja (mover una línea de audio).
  - **Prioridad:** **máxima** — es un bug pedagógico activo, no una mejora.

### 4.2 Categorías (`category-sort`)

- **Mecánica:** Sofía anuncia la palabra por audio, el niño toca 1 de 2-3 botones de categoría (texto).
- **Objetivo pedagógico real:** categorización semántica (requiere haber comprendido el significado, no solo reconocer la forma).
- **Problema — CRÍTICO, mismo patrón que 4.1:** audio previo a la elección (`CategoryGame.tsx`). Mitigado parcialmente porque las categorías sí son texto (hay que leer dónde tocar), pero con solo 2-3 bins fijos el niño memoriza posición tras 1-2 rondas sin necesidad de leer nunca la palabra objetivo.
- **Diversión actual:** 4/10 — música de "selva" en loop, sin movimiento de escenario.
- **Propuesta V2:**
  - **Cambiar:** mismo fix que 4.1 (audio solo bajo demanda o tras acierto) + rotar más categorías por sesión para que la posición no sea memorizable.
  - **Conservar:** el mecanismo de bins de texto (correcto, exige lectura de la categoría).
  - **Prioridad:** **alta** (mismo bug que 4.1, un poco menos grave por el segundo texto a leer).

### 4.3 Rompecabezas (`memory-cards`)

- **Mecánica:** se muestra la palabra completa 2s con audio (ancla Doman correcta), luego se ofrece dividida en sílabas desordenadas (`SYLLABLE_MAP`, diccionario manual de las 220 palabras) que el niño toca en orden.
- **Objetivo pedagógico real:** **decodificación silábica/fonética — no es lectura global.** Es filosóficamente distinto: en Doman se lee la palabra completa como un todo visual, acá se reconstruye por partes.
- **¿Es coherente con el enfoque?** Sí, pero como **actividad complementaria de transferencia**, no como equivalente pedagógico de los otros 11 juegos. El diseño ya mitiga esto mostrando la palabra completa antes de fragmentar.
- **Bug menor encontrado:** el texto que Sofía dice como reglas de este juego (`GAME_RULES_TEXT["memory-cards"]`) describe un juego de memoria de pares ("volteá las tarjetas y buscá las iguales... 45 segundos") que **no es la mecánica actual**. Reglas habladas desincronizadas del juego real.
- **Diversión actual:** 5/10 — piezas con spring físico y rotación, más táctil que la mayoría.
- **Propuesta V2:**
  - **Conservar:** la mecánica intacta, la exposición previa de la palabra completa.
  - **Cambiar:** corregir el texto hablado de reglas para que describa el armado por sílabas, no el memo-pares. Etiquetar explícitamente en el currículum/UI que es actividad complementaria (no reemplaza reconocimiento global).
  - **Prioridad:** media (el bug de reglas es barato de arreglar; el reposicionamiento pedagógico es una decisión de producto, no de código).

### 4.4 Tren de Palabras (`word-train`)

- **Mecánica:** tren con 3-4 vagones de texto, Sofía dice la palabra objetivo al aparecer, el niño toca el vagón correcto antes de que cruce.
- **Objetivo pedagógico real:** reconocimiento global de palabra aislada por discriminación entre distractores — **el más fiel al método de los 11**, porque el audio-previo acá no es atajo (todas las opciones son texto, sin leer no se sabe cuál vagón tocar).
- **Fortalezas:** ya usa `useArcadeClock`/`useArcadeEnergy`/`useArcadeLevel`, pájaros de fondo, energía/niveles/música arcade — es el juego "estático" más cercano a videojuego.
- **Diversión actual:** 7/10, el más alto de los juegos no-PixiJS.
- **Propuesta V2:**
  - **Conservar:** todo el mecanismo, es el estándar a imitar en los demás.
  - **Cambiar:** poco. Candidato natural para escenario más rico (parallax simple, evento sorpresa cada ciertos vagones).
  - **Prioridad:** baja/media (ya funciona bien; mejora incremental, no urgente).

### 4.5 Construye la Frase (`phrase-builder`)

- **Mecánica:** frases curadas (`SENTENCE_EXAMPLES`/`PHRASE_EXAMPLES`, código de generación aleatoria existe pero está muerto en producción — comentario explícito "never random generation"). Palabras sueltas como botones, el niño las toca en orden.
- **Discrepancia con el README:** el README dice "arrastra palabras" — la implementación real es tap-en-orden, no drag. Corregir el texto del README/UI si se comunica así en algún lado visible al usuario.
- **Objetivo pedagógico real:** sintaxis/comprensión de frase — único juego con `minPhase: 2` en el registry (aunque ese campo es muerto y no gatea nada en runtime, ver sección 5).
- **Riesgo menor:** con frases de 2-3 palabras, la última queda por eliminación sin necesidad de leerla.
- **Diversión actual:** 3/10, la más baja del roster — estático, sin movimiento de escenario.
- **Oportunidad grande:** es candidato natural para consumir `contextSentence` real del currículum de la fase activa (hoy usa sus propias frases curadas, no las del currículum de sesión — a confirmar si se busca esa integración).
- **Propuesta V2:**
  - **Conservar:** frases curadas (no generación aleatoria — la calidad del lenguaje importa más que la variedad).
  - **Cambiar:** mínimo 4 palabras por frase para evitar el descarte trivial; animación de "la frase cobra vida" al completar (la escena que describe la frase se arma/anima).
  - **Prioridad:** media — bajo riesgo pedagógico, pero es el juego con menos diversión, se beneficiaría mucho de una consecuencia visual.

### 4.6 Lluvia de Palabras (`word-rain`)

- **Mecánica:** 3 carriles, tarjeta con target + 2 distractores cae, tocar la del carril correcto antes de tocar el suelo. Carriles mezclados cada oleada.
- **Objetivo pedagógico real:** reconocimiento global bajo presión de tiempo — consolidación, no primera exposición.
- **Fortalezas:** sin atajo (colores/tamaños uniformes, carril aleatorio), `fitWordFontSize` ajusta tipografía a la longitud.
- **Diversión actual:** 6/10 — cae en línea recta, poca variación visual entre palabras.
- **Propuesta V2:**
  - **Conservar:** la lógica de carriles/distractores, intacta.
  - **Cambiar:** consecuencia semántica al tocar el suelo (splash/impacto temático), variar trayectoria en niveles altos.
  - **Prioridad:** media.

### 4.7 Pesca de Palabras (`word-fishing`)

- **Mecánica:** 4 peces (target + 3 distractores) nadan en loop horizontal a distinta fila; tocar el correcto.
- **Objetivo pedagógico real:** igual a Lluvia — consolidación por discriminación bajo movimiento.
- **Fortalezas:** ya tiene noción de profundidad (filas) y personaje temático (peces) — de los 3 "juegos de atrapar" es el que más margen tiene para evolucionar hacia mini-juego (ej. "Leo pesca con caña", el pez atrapado salta a una canasta como recompensa física).
- **Diversión actual:** 6.5/10, el mejor posicionado de los 3 "de atrapar" para crecer.
- **Propuesta V2:**
  - **Conservar:** mecánica de filas + velocidad por nivel.
  - **Cambiar:** el pez atrapado salta hacia Leo como consecuencia (no solo desaparece), variar tamaño/profundidad con perspectiva.
  - **Prioridad:** media-alta (mejor relación esfuerzo/resultado del trío "de atrapar").

### 4.8 Burbujas Mágicas (`daily-bits`)

- **Mecánica:** 5-7 burbujas flotan con física de rebote simple, tocar la del texto correcto.
- **Problema técnico (no pedagógico):** la física se actualiza con `forceRender` de React en cada tick — es el patrón más costoso de los 3 "de atrapar" en re-render; en hardware modesto puede notarse en partidas largas.
- **Problema de legibilidad:** a diferencia de Lluvia, acá no hay `fitWordFontSize` — con palabras largas en burbujas de tamaño fijo hay riesgo de overflow.
- **Discrepancia de nombre:** el audio de reglas (`reglas-burbujas`) y el comportamiento de audio (solo nombra la palabra, sin refuerzos) corresponden más a un "bit" de lectura Doman que a un arcade de reventar burbujas — el nombre público "Burbujas Mágicas" 🫧 está un poco desalineado con cómo se configuró el audio.
- **Diversión actual:** 6/10 — el "pop" es satisfactorio pero el layout se siente repetitivo.
- **Propuesta V2:**
  - **Cambiar primero (antes que cualquier arte nuevo):** mover la física a refs+transform directo en vez de `forceRender`; agregar `fitWordFontSize`.
  - **Después:** tamaño de burbuja que escale con el nivel/energía para dar sensación de progreso.
  - **Prioridad:** media — el fix de performance es barato y previo a cualquier inversión visual.

### 4.9 Leo Corre (`leo-runner`)

- **Mecánica:** Leo corre de espaldas, 3 carriles (4 en Nivel 3), carteles bajan con target + distractores; tocar el carril antes de que el cartel llegue a la altura de Leo.
- **Problema — pedagógico, en Mundo 1:** `rocksForPhase(1)=1` deja solo 2 de 3 carriles con palabra (el tercero es una "piedra" de andamiaje) → ~50% de probabilidad de acertar sin leer nada, documentado como decisión deliberada en el propio código pero que sigue siendo un atajo real en la fase que más chicos van a jugar primero. En Mundos 2-5 no hay piedra y sí exige leer.
- **Render:** PixiJS real (`Application`/`Sprite`/`Graphics`), un solo sprite de Leo (squash-and-stretch + salto por interpolación, sin spritesheet de animación de correr), sin parallax.
- **Asset huérfano detectado:** hay un `leo-runner-sprite.png` de 236KB en disco que no se referencia en ningún código (posible legacy, revisar antes de borrar).
- **Diversión actual:** 6/10 — salto con anticipación, tropezón con tinte rojo, pero escenario plano sin fondo ilustrado ni variedad entre niveles.
- **Propuesta V2:**
  - **Cambiar primero:** reducir el andamiaje de Mundo 1 sin perderlo del todo (ej. 4 carriles con 1 piedra en vez de 3 con 1, para que la probabilidad de acierto por azar baje de 50% a 25%).
  - **Después:** fondo con parallax de 2 capas (patrón ya escrito en `Graphics`, bajo costo), reacción visual al fallar (hoy es "mudo").
  - **Prioridad:** media-alta por el problema pedagógico, pero no es el piloto (ver sección 8).

### 4.10 Salta la Palabra (`salta-palabra`)

- **Mecánica:** 3 palabras vuelan a la misma altura y avanzan; el niño mueve a Leo horizontalmente y salta para atraparla al pasar cerca del punto más alto del salto.
- **Fortalezas pedagógicas:** sin atajo — posición horizontal de las 3 palabras mezclada cada ronda, hay que leer para saber dónde pararse. Más variedad de input que Leo Corre (mover + saltar).
- **Diversión actual:** 6.5/10 — salto con anticipación (agachada previa), esquive lateral de obstáculos con puercoespines caminando.
- **Limitación:** el timing de "apex" para atrapar puede ser abstracto para un chico chico; parábola de salto siempre igual.
- **Propuesta V2:**
  - **Conservar:** mezcla de posición horizontal, doble input (mover+saltar).
  - **Cambiar:** variar fondo por nivel, partícula de polvo al aterrizar, sonido de salto/aterrizaje (hoy solo vibración).
  - **Prioridad:** media.

### 4.11 Leo Vuela (`leo-vuela`) — ver sección 8 y 9 para el diseño completo del piloto

- **Mecánica:** física continua de vuelo (gravedad + impulso, tipo "flappy"), 3 nubes en distintas bandas de altura, volar+moverse hasta atravesar la correcta.
- **Fortalezas:** sin atajo (bandas mezcladas cada ronda); es la base técnica más rica de los 12 juegos — rotación dinámica del sprite según velocidad, 4 tipos de obstáculo con física de empuje diferenciada (vs. solo "hit" booleano en los otros dos Leo), y **es el juego original del que se extrajeron los sistemas compartidos de arcade** (`docs/refactor-arcade-plan.md`, ya existente en el repo).
- **Diversión actual:** 7/10, la más alta de los 12 juegos no-Flash.
- **Assets ya producidos:** 3 loops de música específicos, ~8MB, ya en `public/audio/music/`.
- Ver secciones 8-9 para la propuesta V2 completa.

---

## 5. Tabla comparativa (1-10, estimación propia basada en la evidencia de arriba)

| Juego | Fidelidad pedagógica | Necesidad real de leer | Diversión | Calidad visual | Feedback | Progresión | Potencial de mejora |
|---|---|---|---|---|---|---|---|
| Flash de Palabras | 9 | — (exposición, no quiz) | 6 | 6 | 7 | 8 | 6 |
| Empareja Palabra-Imagen | 3 | **2** | 4 | 5 | 5 | 4 | 8 |
| Rompecabezas | 3 (otra habilidad) | 8 (de esa habilidad) | 5 | 6 | 6 | 5 | 6 |
| Tren de Palabras | 9 | 9 | 7 | 6 | 7 | 6 | 7 |
| Construye la Frase | 7 | 7 | 3 | 3 | 4 | 5 | 7 |
| Lluvia de Palabras | 8 | 8 | 6 | 5 | 6 | 6 | 6 |
| Categorías | 4 | **4** | 4 | 4 | 5 | 4 | 7 |
| Pesca de Palabras | 8 | 8 | 6.5 | 6 | 6 | 6 | 8 |
| Burbujas Mágicas | 8 | 8 | 6 | 5 | 6 | 6 | 6 |
| Leo Corre | 6 (atajo Mundo 1) | 6 | 6 | 6 | 6 | 6 | 7 |
| Salta la Palabra | 9 | 9 | 6.5 | 6 | 6 | 6 | 7 |
| **Leo Vuela** | 9 | 9 | **7** | **7** | 7 | 7 | **9** |

Negrita = los dos números que más deberían preocupar (el atajo de audio) y la mejor apuesta de piloto.

---

## 6. Estado real de la progresión Doman (mundos, fases, currículum)

**Corrección importante al planteo inicial:** los nombres de mundo que en el brief se mencionaban como hipótesis dudosa ("Bahía de los Pares", "Valle de las Frases", "Montaña de la Lectura") **son los nombres reales y vigentes** en `worlds.ts`. El README raíz tiene nombres viejos ("Bahía del Saber", "Valle de las Letras", "Montaña del Conocimiento") — desactualizado, no es fuente confiable.

| Fase | Mundo real | Contenido | Ejemplo real del currículum |
|---|---|---|---|
| 1 | 🏝️ Isla de las Palabras | sustantivos (familia, animales, comida, casa, cuerpo) | "Mamá y papá quieren al bebé..." |
| 2 | 🌊 Bahía de los Pares | pares/adjetivos (colores, tamaños, opuestos, emociones, naturaleza) | "El rojo, azul, verde..." |
| 3 | 🏔️ Valle de las Frases | oraciones sujeto+verbo+complemento (verbos, ropa, escuela, lugares) | "El niño come y bebe. Luego duerme, juega y camina." |
| 4 | 🌋 Montaña de la Lectura | frases con artículos/preposiciones/pronombres/tiempo/números | (frases funcionales, `curriculum.ts`) |
| 5 | 📚 El Libro Mágico | cuentos cortos, verbos avanzados/adverbios | historias completas de 3-6 oraciones |

**Veredicto:** la pirámide palabra → pares → frases → historias que pide la sección 8 del brief **no hay que construirla — ya está en los datos**, en las 44 sesiones, las 5 fases. Lo que falta es que los juegos (salvo el Flash) la reflejen. Hoy:

- `minPhase` en `game-registry.ts` es **campo muerto** — se define pero nunca se lee para gatear nada en runtime.
- La única variación real por fase/mundo es qué juegos aparecen listados (`availableGames` en `worlds.ts`), no cómo cada juego usa su contenido.
- El único juego con potencial natural de usar frases reales del currículum (`contextSentence`) es Construye la Frase, y hoy usa sus propias frases curadas independientes, no las de la sesión activa.

**Bloqueo real (confirmado, matiza lo que dice `saas-factory/CLAUDE.md`):**
- Mundos: nunca se bloquean.
- Sesiones de Flash: se bloquean en secuencia (correcto, es el orden Doman).
- **Juegos de práctica (los 11 no-Flash): sí tienen gate** — el nodo "Juegos de Práctica" de cada mundo está bloqueado hasta que todas las sesiones de ese mundo estén completas. No hay gate adicional por juego individual una vez desbloqueado.

**Sistema de recompensas:** confirmado que es genuinamente compartido — los 12 componentes de juego importan `RewardsLayer`/`GameCompleteScreen`. Estrellas 90%/70%/menos, 0 aciertos = 0 recompensa (ya cuidado). No hay que rehacer nada acá.

---

## 7. Narrativa — estado real y propuesta

**No existe ningún hilo narrativo hoy.** Búsqueda exhaustiva de "dispersión de palabras", "misión", "recuperar" en todo `src/features` y `src/shared`: cero resultados relevantes. Todo el texto de Sofía existente (`sofia-phrases.ts`) es instruccional/motivacional genérico (saludos, "vamos a aprender 5 palabras", afirmaciones) — nada conecta un mundo con el siguiente.

Lo único reutilizable es **técnico, no de contenido**: el patrón `pick()`/`pickPhrase()` que ya rota variantes de frases de Sofía se puede extender para frases narrativas sin tocar la infraestructura de voz.

**Propuesta de narrativa ligera** (no cerrada, para validar):

> *Las palabras del Libro Mágico se dispersaron por los mundos. Leo va recuperándolas mundo por mundo, y cada palabra que el niño reconoce vuelve a su lugar en el libro.*

Encaja bien porque:
- El Mundo 5 YA se llama "El Libro Mágico" — no hay que inventar el destino de la historia, ya existe.
- Es coherente con que los juegos de práctica se desbloqueen recién al completar todas las sesiones de un mundo (la "recuperación" del mundo se cierra ahí).
- Cabe en 3-8 segundos por misión, tal como pide la sección 7 del brief, usando `GameIntro` como punto de enganche (hoy solo dice reglas mecánicas, es el lugar natural para 1-2 frases de historia antes de la regla).

No lo doy por decidido — es una hipótesis para que la valides, no una implementación.

---

## 8. Arquitectura reutilizable — qué existe hoy

| Sistema | Qué provee | Genericidad | Usado por |
|---|---|---|---|
| `GameShell.tsx` | Layout/HUD raíz: pausa, cofre, `LeoContext` (mood: idle/cheering/celebrating/encouraging/clapping/thinking) | Alta (8/10) — layout y chrome, no maneja escenario | los 12 |
| `useGameState` | score/attempts/wordsCompleted + persistencia, agnóstico de juego | Alta (8/10) | los 12 juegos no-Flash |
| `RewardsLayer` / `GameCompleteScreen` | Monedas, cofre, confetti, estrellas, video de celebración | Alta | los 12 |
| `audio-rules.ts` | Tabla declarativa de cuándo habla Sofía por juego (flags fijos, no eventos) | Media (7/10) | los 12 |
| `GameIntro.tsx` | Pantalla previa con reglas habladas | Media-alta — buen punto de enganche para narrativa corta, hoy solo dice mecánica | los 12 |
| `GameAmbience.tsx` | 4 capas decorativas por tema (lluvia, mar, burbujas, pájaros), `pointerEvents:none` | Media (6/10) — patrón reutilizable, cada ambiente es ad-hoc | 4-5 juegos |
| **Sistemas de arcade** (extraídos originalmente de Leo Vuela): `arcade-tuning.ts`, `useArcadeEnergy`, `useArcadeLevel`, `ArcadeMusic`, `ArcadeHud`, `ArcadeIntro`, `MoveButtons`, `createWordBag`, `arcade-obstacles.ts` (dibujos vectoriales compartidos: pájaro, tronco, puercoespín) | Muy alta — ya extraídos y documentados en `docs/refactor-arcade-plan.md` | Leo Corre, Salta, Leo Vuela (parcialmente los 4 juegos "de atrapar" via `docs/action-games-plan.md`, sin obstáculos por decisión ya documentada) |

**Lo que NO existe (gaps reales para la sección 6-9 del brief):**

- **Sistema de partículas genérico** — cada ambiente es a mano, sin parámetros.
- **"La palabra provoca algo en el mundo" (consecuencia semántica)** — cero gancho técnico. `useGameState` no dispara eventos; no hay mapa palabra→animación/objeto.
- **Transición de narrativa breve** — `GameIntro` solo dice reglas, nunca historia.
- **Leo y Sofía como rig animable** — son PNGs estáticos por mood (Leo: 3-4 imágenes; Sofía: 4 poses). Cualquier V2 que quiera más granularidad de pose necesita más arte (PNG) o migrar a spritesheet/rig — no hay atajo de código.
- **Props reutilizables del corpus** (perro, árbol, estrella, casa) — no existen ni en PNG ni en SVG. El compositor de `src/illustration/` existe como patrón (fondo+props+personajes en capas) pero tiene solo un personaje zorro genérico sin ningún vínculo a las 220 palabras reales — es arquitectura de referencia, no assets utilizables.

**Perf/QA existente:**
- `public/` pesa **115MB real** (README dice ~75MB, desactualizado): 45MB video, 56MB audio (545 MP3s), 7.8MB música, resto imágenes.
- `next/image` casi no se usa (2 archivos) contra 12 que usan `<img>` plano.
- `optimize-assets.mjs` ya hace una elección medida (PNG paleta de 256 colores gana a WebP en estas ilustraciones planas) — no hay que tocar esa decisión.
- Sin `prefers-reduced-motion` en ningún componente de juego.
- QA de Playwright (`tests/games/all-games.spec.ts`) es **100% técnico**: rutas cargan, archivos existen, componente contiene tal string. **Cero verificación pedagógica** — ningún test constata ausencia de pistas de audio/imagen ni plausibilidad de distractores. Además tiene referencias muertas (ruta `story-reader` ya no existe en el registry, el resumen dice "10 juegos" cuando son 12).

---

## 9. Elección del piloto

**Fórmula:** impacto visual × diversión × valor pedagógico × reutilización tecnológica / esfuerzo.

Candidatos con techo real de "mini videojuego" (los 3 con PixiJS):

| | Leo Corre | Salta la Palabra | **Leo Vuela** |
|---|---|---|---|
| Valor pedagógico | 6 (atajo 50% en Mundo 1) | 9 (sin atajo) | 9 (sin atajo) |
| Infra técnica ya construida | Media | Media | **Alta** (más tipos de obstáculo, física propia, rotación de sprite, es el origen de los hooks compartidos) |
| Diversión actual | 6 | 6.5 | **7** |
| Assets de producción ya listos | Sprite básico | Sprite básico | Sprite + **8MB de música ya compuesta y en el repo** |
| Esfuerzo marginal para salto de calidad | Medio (además hay que corregir el atajo primero) | Medio | **Bajo** (parallax y trail se acoplan naturalmente a una física ya continua) |

**Elección: Leo Vuela.** No es la hipótesis inicial del brief, y la razón concreta para descartar Leo Corre es doble: (1) tiene un problema pedagógico sin resolver que cualquier inversión visual heredaría, mezclando dos frentes de trabajo en uno; (2) es objetivamente la infraestructura *menos* rica de los tres — Leo Vuela es, literalmente, el juego del que se extrajeron los sistemas que después usaron los otros dos. Construir sobre la base más madura reduce el esfuerzo de "amortizar la mejora en los siguientes juegos" que pide la sección 17 del brief.

Los juegos "de atrapar" en DOM (especialmente Pesca de Palabras) son buenos candidatos de **segunda ronda** una vez que el patrón visual del piloto esté validado — pero arrancar ahí implicaría además decidir si migrarlos a PixiJS, lo que es un cambio de tecnología, no una mejora incremental.

---

## 10. Diseño del piloto V2 — Leo Vuela

### Gameplay
Igual al de hoy en su esqueleto: Leo vuela con física de impulso+gravedad, 3 nubes en bandas de altura distintas, hay que volar y desplazarse hasta atravesar la nube correcta. No se toca el input ni la física base (ya están bien).

### Lectura
El niño debe leer el texto de las 3 nubes para saber a qué altura ir. Sin cambios — ya es la etapa más limpia del roster.

### Distractores
Se mantienen las 3 bandas de altura mezcladas cada ronda (ya no hay atajo posicional). Nuevo: escalar la longitud/complejidad de los distractores con la fase del mundo activo (hoy todas las palabras del bloque entran igual, sin relación con `contextSentence`/fase).

### Escenario
Agregar **parallax de 2-3 capas** (nubes lejanas que hoy son decoración estática, moverlas a distinta velocidad — bajo costo, patrón `Graphics` ya escrito). Variar la paleta del cielo por nivel/mundo (amanecer→día→atardecer) para dar sensación de progreso sin generar arte nuevo pesado.

### Leo
Mantener el sprite único, pero: (1) agregar 2-3 frames de aleteo real en vez de solo rotación/escala (menor costo de arte que un spritesheet completo), (2) trail/estela sutil al volar.

### Sofía
Habla en `ArcadeIntro` (regla del juego) y al nombrar el target — **sin cambios** de cuándo habla, porque acá el audio-previo no es atajo (ya se confirmó, hay 3 opciones de texto y la posición se mezcla). No agregar diálogo narrativo largo entre rondas — solo en la entrada al mundo (ver Narrativa).

### Animaciones
- Consecuencia semántica al atrapar la nube correcta: una versión mínima de "la palabra provoca algo" — por ejemplo la nube atrapada se convierte en una estrella que vuela al Libro Mágico (conecta con la narrativa de sección 7).
- Partícula de impacto/brillo al atravesar, más marcada en niveles altos.

### Sonido
Reusar los 3 loops de música ya producidos (crossfade + ducking, ya funciona). Agregar: sonido de "swoosh" al atravesar la nube correcta (hoy solo hay refuerzo de voz), sonido distinto y no punitivo para el error (hoy es "mudo").

### Progresión
Ya existe (`useArcadeLevel`, sube cada 10 aciertos, tope nivel 3) — extender el tope de nivel visualmente (fondo más "de noche"/"de tormenta liviana" en nivel 3) reusando el sistema de obstáculos existente, sin agregar mecánica nueva.

### Recompensa
La actual (moneda + estrella + cofre) + la consecuencia semántica de arriba. No introducir un sistema de recompensa paralelo.

### Narrativa
1-2 frases de Sofía en el `ArcadeIntro` de la primera vez que se juega en un mundo ("Leo va volando a buscar las palabras del mundo tal, que se dispersaron con el viento") — no en cada partida, para no volverse invasivo. Usa la hipótesis de sección 7 sin comprometerla como decisión final.

### Dificultad
Aumenta hoy con velocidad/frecuencia de obstáculos por nivel — se mantiene. Lo único nuevo: la complejidad léxica de las palabras podría empezar a escalar con la fase del mundo (ver Distractores), que es el único punto donde este juego today no refleja la progresión Doman real.

---

## 11. Qué necesito de vos antes de tocar código

**Puedo generar/programar yo (sin arte externo):**
- El parallax de nubes (reutiliza `Graphics` de PixiJS ya escrito).
- Los 2-3 frames de aleteo simples (son geometrías vectoriales sobre el sprite existente, no requieren ilustración nueva).
- El fix del audio-previo en Empareja Palabra-Imagen y Categorías (una línea de código, sección 4.1-4.2).
- El ajuste del giro del Flash (sección 3).
- El fix de performance de Burbujas Mágicas.
- La consecuencia semántica mínima (nube→estrella) reutilizando el sistema de partículas que haya que armar — es código, no arte.

**Necesita una decisión tuya (no técnica):**
- Si la narrativa de sección 7 ("las palabras se dispersaron") se adopta o se ajusta.
- Si Rompecabezas se recomunica explícitamente como actividad complementaria en la UI/currículum, o se deja como está.
- Si vale la pena resolver el asset huérfano `leo-runner-sprite.png` (236KB sin referenciar) o dejarlo.
- Prioridad relativa: ¿el fix crítico de audio (sección 4.1-4.2) se hace ya, en paralelo al piloto, o se espera a terminar el piloto? Dado que es un bug pedagógico activo y de bajísimo esfuerzo, mi recomendación es resolverlo ya, independiente del piloto — pero no lo toco sin tu aprobación porque el brief pidió no tocar código todavía.

**Assets externos que sí harían falta más adelante (no para el piloto mínimo):**
- Más poses/frames de Leo y Sofía si se quiere ir más allá de rotación/squash-stretch (arte nuevo).
- Props del corpus (perro, árbol, estrella, casa) si se quiere escalar "la palabra provoca algo" a más juegos que Leo Vuela.

---

## 12. Criterios objetivos para comparar V1 vs V2

1. **Cero regresión pedagógica:** el % de aciertos explicable sin haber visto/leído la palabra debe ser igual o menor que en V1 (medible con un test automatizado que juegue "a ciegas" solo con audio/posición y compare tasa de acierto esperada vs. real).
2. **Tiempo de sesión voluntaria:** si se puede instrumentar, cuánto tiempo/cuántas rondas juega un niño antes de soltar el juego, comparado contra el mismo dato en V1 (proxy de diversión real, no percibida).
3. **FPS mínimo sostenido** en un dispositivo de gama media (no debe bajar respecto a V1 con las capas de parallax/partículas nuevas).
4. **Peso de descarga adicional** (KB de assets nuevos) — debe ser bajo dado que el objetivo es reusar geometría vectorial, no sprites pesados.
5. **Cobertura de test:** el número de tests que verifican ausencia de atajos (nuevo tipo de test que hoy no existe en absoluto, sección 8) debe subir de 0 a al menos 1 por juego tocado.
6. **Feedback cualitativo de César/uso real:** ¿el niño mira la palabra antes de actuar, o resuelve por reflejo de posición/color? (esto es lo único que un test automatizado no puede confirmar solo — vale la pena una observación real, aunque sea breve, con el criterio del "crítico visual" que ya usan en ResolvIA para otras interfaces).

---

## 13. Estado de implementación del piloto (post-auditoría, 2026-09-11)

Ejecutado sobre `feature/juegos-v2` (rama local, sin pushear). Commits: `df3edda` (bug pedagógico), `fcb97bb` (Mundos 2-4), `01e3626` (sistemas reutilizables + integración), `9f14910` (fix de verificación visual).

### Bugs pedagógicos (hallazgo #1)
Corregidos en `WordImageMatch.tsx` y `CategoryGame.tsx`: Sofía ya no dice la palabra objetivo antes de que el niño elija; solo confirma por voz tras un acierto. Con tests de regresión (`WordImageMatch.test.tsx`, `CategoryGame.test.tsx`) que mockean `sofiaVoice` y verifican el orden.

### Leo Vuela V2 — qué cambió vs. V1
| | V1 | V2 |
|---|---|---|
| Cielo | fondo plano celeste fijo | `ArcadeSky`: parallax 2 capas + humor por nivel (día → atardecer → noche) |
| Consecuencia del acierto | ninguna, solo puntaje | la palabra vuela como emoji real hacia el Libro Mágico (ancla 📖), disparada **solo tras** el acierto |
| Distractor en Fase 2 (opuestos) | azar puro | un distractor real es el antónimo de la palabra objetivo cuando existe |
| Narrativa | ninguna | intro/outro de 3-6s con el nombre real del mundo, saltable, solo la primera vez por mundo por sesión de navegador |
| Estela de Leo | ninguna | partículas suaves en vuelo, solo en `qualityTier: "high"` |
| Telemetría | ninguna | `game_started` / `round_result` / `game_finished` / `game_abandoned` vía `gameTelemetry.ts` (sink desconectado por defecto) |
| Alcance | solo Mundo 1 | Mundos 1-4 (igual que Leo Corre/Salta la Palabra) |

### Verificación visual real (regla del proyecto: mirar antes de declarar terminado)
Con `capturar` (desktop 1440px y mobile ~390px), fase 1 y fase 2, se confirmó:
- La narrativa de intro se ve y lee bien en ambos anchos, con el nombre real del mundo ("Bahía de los Pares").
- El juego en curso (cielo día, HUD, libro, nubes-palabra, Leo) es legible en ambos anchos.
- **Encontrado y corregido en el momento**: la narrativa de intro no aparecía nunca en dev porque el `useState` que la activaba escribía en `sessionStorage` dentro de su initializer, y React StrictMode lo invoca dos veces al montar — la segunda invocación ya veía la marca propia. Fix: el initializer ahora solo lee; la escritura ("ya visto") se hace al cerrar la narrativa de verdad.
- **No verificado en vivo**: la transición a "atardecer"/"noche" (requiere ~10-20 aciertos por nivel; en 55s de autoplay headless solo se alcanzaron 3-4 aciertos, insuficiente para subir de nivel). Queda cubierta por tests unitarios de `moodForLevel` y por revisión de código (se llama en cada frame del ticker), pero no por una captura real de esos dos estados. Recomendado: una prueba manual jugando unos minutos antes de dar el piloto por cerrado.
- **Riesgo pre-existente, no introducido por V2**: en el instante exacto de atravesar una nube, el sprite de Leo puede tapar parcialmente el texto de la palabra (mecánica de "atrapar volando a través"). Es breve y ya existía en V1; no se tocó en este piloto.

### Performance
- No se agregó ningún asset binario nuevo (0 KB de imagen/audio/video). Todo lo nuevo es código: ~17 KB de TypeScript/TSX sin minificar (~487 líneas en 7 archivos), negligible frente a los ~75 MB de `public/`.
- `npm run build` compila sin errores (Next.js 16 + Turbopack).
- No se midió FPS real en un dispositivo físico ni con Lighthouse — este entorno no tiene un teléfono real ni un Chrome headless con GPU para un perfil confiable. Recomendado antes de producción: abrir el juego en un Android de gama media real unos minutos y confirmar que no hay caída de cuadros con la estela activada.

### Reutilizable para otros juegos arcade (Leo Corre, Salta la Palabra, y potencialmente Lluvia/Pesca/Burbujas)
`ArcadeSky`, `WordConsequenceFx` + `getConsequenceEmoji`, `MissionNarrative`, `useQualityTier`, `gameTelemetry` — ninguno tiene una dependencia dura con Leo Vuela; todos reciben `PIXI`/contenedor/props genéricos.

### Deuda y riesgos
1. La transición día→atardecer→noche no se vio en vivo (ver arriba).
2. El solape breve de Leo sobre la palabra al atrapar es una deuda visual pre-existente, no de este piloto.
3. `gameTelemetry` no tiene sink conectado todavía (a propósito, por pedido explícito de no agregar analytics externos en esta tarea) — los eventos hoy solo van a `console.debug` en dev.
4. Las líneas nuevas de narrativa (`MissionNarrative`) no tienen audio grabado de Sofía todavía — funcionan igual por texto en pantalla, pero falta generarlas (bloqueado: no hay `ELEVENLABS_API_KEY` en este entorno).

### Lista de assets — si se decide invertir en arte nuevo
- **NECESARIO:** ninguno. El piloto funciona completo con geometría vectorial (PixiJS Graphics/Text) y el sprite de Leo ya existente.
- **DESEABLE:**
  - 2 líneas de audio nuevas de Sofía (ElevenLabs, voz existente): "¡Se escaparon las palabras!" (intro) y una de cierre tipo "¡Las palabras volvieron al libro!" (outro). Costo bajo, mejora real de inmersión.
  - Una animación de aleteo (squash/stretch de alas) para Leo en vuelo — hoy el sprite es estático salvo inclinación/escala; requiere ver el PSD/capas originales del sprite, no se puede aproximar bien con un overlay vectorial sin verlo.
  - 1-2 siluetas de fondo (montañas/costa) específicas de cada mundo, para que el parallax lejano no sea genérico entre Isla/Bahía/Valle/Montaña.
- **NO NECESARIO:** más nubes/variantes de nube, más partículas, más colores de cielo — lo vectorial actual ya cubre esto sin pesar KB.

---

## 14. Segunda ronda de QA — correcciones estructurales (2026-09-11)

Tras aprobar el piloto "con cambios", esta ronda cierra los problemas
estructurales encontrados antes de producir arte definitivo. No se agregó
narrativa, fases ni sistemas nuevos; no se tocó ningún otro juego.

### 14.1 Fuga por longitud de palabra — causa general, no solo "caliente/frío"
`puffW` (ancho del pill de cada nube) dependía de `label.width` de CADA
palabra por separado, así que la nube más larga de una ronda era siempre
visualmente más ancha — una pista sin necesidad de leer. Se corrigió en la
raíz: `normalizedCloudPuffWidth()` (`config/arcade-tuning.ts`) mide las 3
etiquetas de la ronda ANTES de dibujar y las 3 nubes comparten el mayor
ancho necesario (piso 140px para palabras muy cortas, techo de seguridad
320px muy por encima de "sorprendido", la palabra real más larga del
currículum en 11 letras). `LeoVuela.tsx` ahora mide las 3 etiquetas primero
y usa ese ancho compartido para las 3 nubes de cada tanda. Test de
regresión en `__tests__/leo-vuela.test.ts` (`normalizedCloudPuffWidth`),
incluyendo el caso real "frío"/"caliente". Verificado en vivo con
Playwright: ronda real con "enojado"(7)/"río"(3) mostrando pills del mismo
ancho.

### 14.2 Antónimo como distractor (Fase 2) — removido
El distractor priorizado por antónimo (`ANTONYM_PAIRS`/`getAntonym`, en
`buildCloudRound`) se evaluó contra el objetivo del juego (reconocimiento
visual/global de la palabra, no discriminación semántica) y se concluyó
que no aportaba: el juego no muestra imágenes, así que no hay pista
contextual que un antónimo esté "previniendo". Además introducía dos
problemas reales: la fuga por longitud en pares dispares (`caliente`/
`frío`, ya resuelta de forma general en 14.1) y el riesgo de que el chico
aprendiera el PATRÓN de co-ocurrencia (mismo par siempre) en vez de leer
cada palabra. Se removió el archivo `config/antonym-pairs.ts` y la
prioridad especial en `buildCloudRound`: Fase 2 ahora elige distractores al
azar del bloque, igual que el resto de las fases. No se tocó el currículum.

### 14.3 Ritmo — variedad ambiental sin mecánicas nuevas
`ArcadeSky` (única consumidora hoy, no afecta a Leo Corre/Salta la
Palabra) suma tres elementos puramente decorativos, sin significado
pedagógico y sin tocar energía/pilotaje: bob vertical sutil y constante en
las nubes de parallax, una bandada de fondo de baja frecuencia (silueta
chica y semitransparente, vive en `farLayer`, nunca colisiona) y una ráfaga
de viento que acelera brevemente el parallax cada tanto. Frecuencias bajas
a propósito (spawnRoll ~2-2.5/min) para romper monotonía sin
hiperestimular. Verificado en vivo (Playwright, capturas de bandada
visible sin competir con las nubes-palabra).

### 14.4 `wordsPerLevel = 10` — análisis, sin cambiarlo todavía
Evidencia: el piloto automático de demo (lectura "perfecta", nunca falla
por no leer) alcanzó 17/20 aciertos en ~8 minutos de juego continuo antes
de quedarse sin energía — no llegó a Nivel 3/noche. Los obstáculos de
Nivel 2 (`birdsPerMin: 5`, `boltsPerMin: 2`) ya consumen energía más rápido
de lo que el drenaje pasivo por sí solo explicaría, y un chico real (que sí
falla lecturas, a diferencia del bot) tiene *menos* margen que este
best-case. Conclusión: llegar a "noche" hoy requiere una sesión más larga y
más precisa que lo esperable para la edad objetivo; "atardecer" (10
aciertos) es razonablemente alcanzable, "noche" (20) probablemente no en
una sesión típica. Recomendación (no aplicada): bajar `wordsPerLevel` a
6-7, o revisar el balance de energía en Nivel 2+, antes de invertir en arte
de "noche". Requiere confirmar con sesiones reales, no solo el bot.

### 14.5 Especificación de assets — ver informe de QA entregado en el chat
Las especificaciones exactas (sprite de Leo con aleteo, fondos de los 4
mundos) se entregaron en el informe de esta ronda de QA, no se repiten acá
para no duplicar la fuente de verdad. Reemplazan/precisan los ítems
"deseable" de la lista de la sección 13.

---

## Apéndice — archivos citados por auditoría (para referencia rápida)

- Flash: `WordFlash.tsx`, `FlipCard.tsx`, `TimeBar.tsx`, `RewardsLayer.tsx`, `session/config/curriculum.ts`
- Emparejar/clasificar: `WordImageMatch.tsx`, `MemoryCards.tsx`, `WordTrain.tsx`, `BuildSentence.tsx`, `CategoryGame.tsx`
- Atrapar: `WordRain.tsx`, `WordFishing.tsx`, `BitsReading.tsx`, `config/word-rain.ts`, `config/word-fishing.ts`, `config/bubbles.ts`
- Arcade PixiJS: `LeoRunner.tsx`, `SaltaPalabra.tsx`, `LeoVuela.tsx`, `config/arcade-tuning.ts`, `components/arcade-music.ts`, `components/arcade-obstacles.ts`, `components/leo-vuela-obstacles.ts`, `hooks/useArcadeEnergy.ts`, `hooks/useArcadeLevel.ts`, `hooks/useArcadeClock.ts`
- Progresión: `progression/config/worlds.ts`, `progression/hooks/useProgression.ts`, `progression/components/SessionNodeList.tsx`, `shared/constants/phases.ts`
- Reutilizables/assets: `GameShell.tsx`, `GameAmbience.tsx`, `GameIntro.tsx`, `GameSetup.tsx`, `hooks/useGameState.ts`, `hooks/useGameSession.ts`, `config/audio-rules.ts`, `src/illustration/`, `tests/games/all-games.spec.ts`
- Planes previos ya en el repo (contexto adicional, no contradicho por este documento): `docs/refactor-arcade-plan.md`, `docs/action-games-plan.md`, `docs/overnight-plan.md`, `docs/playtest-fixes-plan.md`
