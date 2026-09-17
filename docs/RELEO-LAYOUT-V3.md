# REleo — Layout V3: inmersivo en los 11 juegos restantes

Rama `feature/juegos-v3-layout`, sobre `main` (Leo Vuela V2 ya en producción).
Objetivo: extender el canvas inmersivo + HUD overlay de Leo Vuela a los demás
juegos, arreglar el HUD apretado en mobile y reemplazar el thumbnail roto del
Mundo 5. Alcance explícito: layout únicamente — nada de mecánicas, narrativa,
arte nuevo, ni tocar Flash de Palabras más allá de lo imprescindible.

Verificación en los 4 viewports pedidos (390×844, 360×740, 1280×900, 1920×1080)
con capturas reales vía Playwright — no análisis estático — para cada juego que
se tocó.

## Paso 1 — HUD apretado en mobile (base para todo lo demás)

`ArcadeHud` overlay usaba `top: 52`, que era el borde inferior del **botón**
del header flotante, no el borde real del header (que sigue 8px de padding más
abajo). En 390×844/360×740 el HUD quedaba pegado, casi tocando el header.

Fix: `GameShell.tsx` ahora exporta `IMMERSIVE_HEADER_H` (44 + spacing.sm·2 =
60) como fuente única del alto real del header flotante; `ArcadeHud` lo usa
(`top: IMMERSIVE_HEADER_H + spacing.sm`) en vez de un número remedido a mano.
Cualquier juego que necesite esquivar el header (HUD overlay, MoveButtons,
o el layout propio de un juego sin ArcadeHud) importa esta constante.

Commit `93ca5c0`. Verificado en los 4 viewports antes de tocar ningún juego,
como pedía el encargo.

## Paso 2 — Los 11 juegos

| # | Juego | Inmersivo | % viewport antes → después | Problemas encontrados |
|---|---|---|---|---|
| 1 | Lluvia de Palabras (`word-rain`) | SÍ | ~35% → ~93% mobile, ~85%+ desktop | Bug real de altura 0 con `flex:1`/`height:100%` (el wrapper de children de GameShell no tiene `flex-grow`, resuelve a `auto`) — resuelto con `calc(100dvh - 16px)`. Distancia de caída (hardcoded 450px) → medida real con `ResizeObserver`. |
| 2 | Pesca de Palabras (`word-fishing`) | SÍ | ~40% → ~90%+ mobile, ~85%+ desktop | Rango de nado horizontal (hardcoded `[-140,560]`) hacía que los peces nadaran en una franja angosta en desktop ancho — medido con `ResizeObserver` (`areaWidth`). |
| 3 | Burbujas Mágicas (`daily-bits`) | SÍ | ~99% (1280×900), ~99% (1920×1080) | Piso de spawn/rebote de burbujas (12%/5%) ajustado a 18%/16% porque el HUD overlay pasó a vivir *dentro* del contenedor. Preexistente sin tocar (mecánica, fuera de alcance): la tarjeta de palabra objetivo trunca con "…" en mobile con palabras largas; burbujas sin detección de colisión entre sí. |
| 4 | Leo Corre (`leo-runner`) | SÍ | **1920×1080: ~88%. 1280×900: ~70% (no llega al objetivo)** | Canvas Pixi 820×420 (aspecto 1.95:1), más ancho que Leo Vuela/Salta (1.52:1). En 1280×900 el ancho manda (`min(96vw, …)` queda acotado por el 96vw) antes que el alto, y el resultado queda en ~70%. No corregido: forzarlo exigiría o romper el margen de seguridad de 96vw que comparten los demás juegos (inconsistente con el patrón) o cambiar la resolución lógica del canvas (mecánica/arte, fuera de alcance). Mobile portrait compacto (~44-47%), igual que ya acepta Leo Vuela — el objetivo ≥80% del pedido es explícitamente para desktop. |
| 5 | Salta la Palabra (`salta-palabra`) | SÍ | ~86% (1280×900), ~97% (1920×1080) | Mismo aspecto que Leo Vuela (640×420 = 1.52:1) — sin el problema de Leo Corre. `MoveButtons` ya vivía dentro del wrapper, sin cambios. |
| 6 | Tren de Palabras (`word-train`) | **NO — revertido, sin tocar** | — | Su área de juego es una franja horizontal angosta y fija (rieles + vagones, ~150px de alto natural) — no hay "canvas dominante" sobre el que un HUD overlay tenga sentido. Forzarlo habría dejado un HUD flotante enorme sobre una franja chica con mucho espacio vacío alrededor, o hubiera exigido inventar escenografía nueva para llenar ese espacio (fuera de alcance: nada de arte nuevo). Aplica el espíritu de la REGLA DE ORO aunque no estaba en la lista de sospechosos — mismo criterio (layout que no encaja), motivo distinto (forma, no drag&drop). |
| 7 | Empareja Palabra-Imagen (`word-image-match`) | SÍ | ~55-60% → ~88% (1280×900), ~85% (1920×1080) | No usa `ArcadeHud` (no es un juego de canvas continuo) — mismo tratamiento de `GameShell` (header flotante + LeoCompanion oculto), pero el escalado de tamaño es `clamp(px, vh/vw, px)` en vez de `ResizeObserver`: acá el "área de juego" es una grilla fija de 4 opciones (siempre las mismas 4), no algo que haga falta medir. |
| 8 | Rompecabezas (`memory-cards`) | **NO — revertido, sin tocar** | Prototipado y descartado: 1920×1080 quedó en ~53% con una palabra de 2 sílabas ("mamá", el caso *más común*: la mayoría de las 220 palabras tienen 2-3 sílabas) | A diferencia de Empareja (SIEMPRE 4 opciones fijas), la cantidad de piezas varía 1-4 según el diccionario de sílabas — no hay grilla fija que agrandar. Se probó el mismo patrón que Empareja (`clamp` + immersive), se capturó, y el hueco vacío confirmó la sospecha del pedido original. Revertido con `git checkout`. |
| 9 | Construye la Frase (`phrase-builder`) | **NO — salteado, sin prototipar** | — | Mismo patrón estructural que Rompecabezas (slots de oración + palabras disponibles: 2-4 ítems variables, sin grilla fija), ya confirmado en el punto anterior. No hacía falta repetir el ciclo implementar→capturar→revertir para demostrar algo ya demostrado. |
| 10 | Categorías (`category-sort`) | **NO — salteado, sin prototipar** | — | Mismo patrón, aún más chico: 2-3 botones de categoría apilados en columna, menos contenido que Rompecabezas/Construye la Frase. |
| 11 | Flash de Palabras (`word-flash`) | **NO — salteado, sin tocar** | — | No usa `GameShell`/`ArcadeHud` — pantalla propia (`position:fixed inset:0`) que ya es full-bleed por diseño (tarjeta `min(85vw,70vh,720px)` + aspect-ratio 4/3, "pantalla limpia durante el flash" por método Doman, con comentarios explícitos de fidelidad al método). Regla del pedido: "sólo si no altera la presentación de la tarjeta; ante la duda, salteala" — con esa arquitectura, cualquier cambio arriesga la tarjeta. Se saltea sin tocar nada. |

**Resumen:** 5 de 11 juegos pasaron a inmersivo limpio (Lluvia, Pesca,
Burbujas, Leo Corre, Salta la Palabra) + Empareja con un tratamiento
equivalente sin `ArcadeHud` — 6 en total. 5 quedaron sin tocar: 2 revertidos
después de prototipar y confirmar que no encajaban (Tren, Rompecabezas), 2
salteados sin prototipar por ser estructuralmente idénticos a un caso ya
confirmado (Construye la Frase, Categorías), y 1 salteado por arquitectura
propia y riesgo sobre el método Doman (Flash de Palabras).

Un hallazgo no anticipado: Leo Corre no llega al objetivo de ≥80% en
1280×900 (llega a ~70%) por su aspecto de canvas más ancho que el resto.
Documentado arriba, no corregido en esta tanda.

## Paso 3 — Thumbnail del Mundo 5

`public/images/worlds/libro.png` era un paisaje de montaña con río (1200×654,
dimensión distinta a las otras 4 miniaturas — todas 480×300) — el Mundo 5 es
"El Libro Mágico"; ese paisaje no tiene nada que ver.

Reemplazado por una card generada por código (SVG → PNG vía `sharp`, ya en
`package.json`): degradé con el color de marca del mundo (`#f093fb`) + una
pila de libros dibujada a mano con rects redondeados + el nombre del mundo.
Sin ilustración nueva ni encargada. El emoji 📚 se descartó: `Noto Color
Emoji` no renderiza a color vía `sharp`/`librsvg` en este entorno — sale en
negro plano, se ve roto.

Verificado en las dos vistas reales donde se usa (no sólo el archivo):
la lista "Elige un mundo" (80×80, `objectFit:cover`) y el banner grande de
selección de bloque (500×140, `objectFit:cover`) — capturas con Playwright.
Commit `e18fd75`.

## Estado final

- **typecheck**: limpio (`tsc --noEmit`, 0 errores).
- **vitest**: 234/234 tests, 34 archivos.
- **Playwright** (`npm run test:qa`, `tests/games/`): 63/63 tests.
- **build** (`npm run build`, producción): compila limpio, 20 páginas
  estáticas + `/play/[gameId]` dinámica.

Corrido tres veces a lo largo de la rama (después de Paso 1, después de cada
juego, y al cierre) — no sólo al final.

## Commits de esta rama

```
93ca5c0 fix(arcade-hud): HUD overlay ya no queda pegado al header flotante en mobile
56ae48b feat(word-rain): Lluvia de Palabras pasa a canvas inmersivo (>80% viewport)
22ec80c feat(word-fishing): Pesca de Palabras pasa a canvas inmersivo (>80% viewport)
7e561a7 feat(daily-bits): Burbujas Magicas pasa a canvas inmersivo (>80% viewport)
08b9a6e feat(leo-runner): Leo Corre pasa a canvas inmersivo (>80% viewport en desktop)
48f8e25 feat(salta-palabra): Salta la Palabra pasa a canvas inmersivo (>80% viewport en desktop)
88e291d feat(word-image-match): Empareja Palabra-Imagen pasa a canvas inmersivo (>80% viewport en desktop)
e18fd75 fix(worlds): reemplaza thumbnail del Mundo 5 (decia "MONTAÑA")
```

## Paso 4 — QA del Preview: cartel de objetivo y colisión Leo/palabras

César revisó el Preview del Paso 2 y reportó un bug bloqueante en Leo Corre:
el cartel "Tocá: <palabra>" se renderizaba DENTRO de la barra de progreso
(fondo naranja estirado, sin forma de pill) y el sprite de Leo tapaba la
palabra del carril izquierdo. Pidió además auditar el mismo patrón en los
otros 5 juegos immersive y el orden audio/visual del cartel de objetivo.

### A. Cartel de objetivo fuera de la barra (`ArcadeHud.tsx`)

El wrapper del overlay era una sola fila flex (`display:flex`) con el cartel
en `flex:1` compartiendo fila con el badge de nivel y la barra de energía.
En Leo Corre (canvas 820×420, aspecto 1.95:1 — el más ancho de los 6 juegos
immersive) ese `flex:1` estiraba el cartel a casi todo el ancho de pantalla:
se leía como una barra de progreso, no como un cartel. En los demás juegos
(aspecto 1.52:1) el mismo bug existía pero era menos notorio.

Fix: el wrapper pasa a `flexDirection:"column"`; el cartel es el único hijo
en flujo (`width:"max-content", maxWidth:"78cqw"`, sin `flex:1`); badge y
energía pasan a `position:absolute` en las esquinas de la misma banda. Mismo
font-size/padding que antes — el alto total de la banda no cambió, así que
la banda segura de nubes de Leo Vuela (`CLOUD_BANDS`) sigue intacta.

### B. Leo tapaba la palabra (`LeoRunner.tsx`)

Los carteles resolvían en `LEO_Y - 52`, muy por debajo del alto real del
sprite de Leo (`LEO_SPRITE_H = 96`, ancla inferior): con esa geometría el
cartel ya estaba resolviendo con su mitad inferior 44px DENTRO del sprite,
que tiene zIndex más alto (`LEO_RUNNER_Z.leo`). Fix: nueva constante
`SIGN_RESOLVE_OFFSET = LEO_SPRITE_H + SIGN_H/2 + 10 = 134`, que reemplaza el
52 hardcodeado. Trade-off explícito y aceptado (César habilitó "subí las
tarjetas" como palanca): la ventana visible de lectura por cartel baja de
~296 a ~214px lógicos — sigue habiendo tiempo de sobra para leer, pero es
menos que antes. Velocidad, spawn y lógica de acierto no se tocaron.

### A+B combinados: el cartel también podía pisar un cartel recién spawneado

Al mirar Leo Corre jugando de verdad con las dos correcciones aplicadas
apareció un tercer problema, no reportado por César porque no era visible en
una captura estática: el cartel de objetivo flota con un offset fijo en px
reales (`IMMERSIVE_HEADER_H + spacing.sm = 68px`, para despejar el header),
y como el canvas se reescala por CSS, esos mismos 68px reales representan una
fracción del canvas lógico muy distinta según el tamaño real — chica en
desktop ancho, pero en el canvas de Leo Corre en mobile portrait (~190px
reales de alto, ya aceptado en el Paso 2 como límite de aspecto) esos 68px
son más de un tercio del alto. Con eso, un cartel recién spawneado (visible
casi de inmediato tras `SIGN_SPAWN_Y=-70`) quedaba tapado por el cartel de
objetivo (capturado en 1920×1080: "Tocá: banana" sobre "pez").

Fix: se mide el alto real del canvas una vez montado
(`hostRef.getBoundingClientRect()`) y se calcula `signSafeTopRef`, la banda
lógica donde un cartel todavía no es seguro mostrar — los carteles quedan
invisibles (`box.visible=false`) hasta cruzarla. Con un mínimo de ventana de
lectura garantizado (120px lógicos antes del punto de resolución) para que
el cálculo nunca devore toda la ventana visible en el canvas ultra-compacto
de mobile — el primer intento sin ese piso dejaba el cartel invisible
durante TODA la ronda en 390×844 (ronda perdida siempre, confirmado con una
serie de capturas de 8s sin un solo cartel visible). Con el piso, en la
práctica no se observó superposición residual en ningún viewport probado.

### C. Los otros 5 juegos immersive

Los 6 juegos que usan `ArcadeHud overlay` comparten el mismo componente, así
que el fix de A se aplicó a todos por igual. Revisado con capturas reales
(no asumido) en 1280×900, 1920×1080 y 390×844:

| Juego | Cartel de objetivo | Notas |
|---|---|---|
| Lluvia de Palabras | Bien — pill correcta | Mobile: una palabra recién spawneada (fade-in) aparece pegada al borde del pill sin taparlo; no bloquea lectura |
| Pesca de Palabras | Bien — pill correcta | Preexistente sin tocar: algún pez queda recortado por el borde del acuario en su nado horizontal (no relacionado al HUD) |
| Burbujas Mágicas | Bien — pill correcta | Sin superposición en ningún viewport |
| Salta la Palabra | Bien — pill correcta | Mobile: el cartel que salta roza la esquina de la barra de energía (no el pill de objetivo); texto siempre legible completo |
| Empareja Palabra-Imagen | Bien | No usa `ArcadeHud` (grid fijo de 4), sin el patrón de bug |
| Leo Vuela (producción, no pedido pero comparte el componente) | Bien — sin regresión | Verificado para no romper lo que ya está en producción |

Ninguno de los 5 tenía el bug A tan agudo como Leo Corre (su aspecto ancho
lo hacía el peor caso), y ninguno mostró el problema C de un cartel de
objetivo tapando una palabra recién spawneada.

### D. Auditoría: cartel visible antes o junto con el audio

Revisado el orden de llamadas en los 6 juegos: en todos, el setter del
estado de la palabra objetivo (que dispara el render del cartel) se llama
ANTES que la función que dispara el audio de Sofía, dentro del mismo cuerpo
de función síncrono. Auditoría cumplida, sin cambios de código necesarios.

### Verificación

- **typecheck**: limpio.
- **vitest**: 234/234.
- **Playwright** (`test:qa`): 63/63.
- **build**: compila limpio.
- Capturas reales (Playwright) de los 6 juegos immersive + Leo Vuela en
  1280×900, 1920×1080 y 390×844, más series de gameplay en Leo Corre
  (desktop y mobile) para cazar el momento de colisión Leo/cartel y el
  spawn de un cartel nuevo — no sólo el estado inicial.

### Commits de este paso

```
(pendiente al momento de escribir — ver `git log` de la rama)
```

## Cierre

Sin merge a `main`, sin deploy a producción — la rama se pushea para que
Vercel genere el Preview y César lo revise.
