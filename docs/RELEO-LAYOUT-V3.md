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

## Cierre

Sin merge a `main`, sin deploy a producción — la rama se pushea para que
Vercel genere el Preview y César lo revise.
