# Auditoría de grabación — los 11 juegos V1

**Fecha:** 2026-09-14 · **Rama:** `feature/juegos-v2` · **Objetivo:** dejar los 11
juegos que NO son Leo Vuela en condiciones de grabarse en video mañana. No es
un rediseño — es sacar errores, assets rotos y bugs evidentes.

Leo Vuela ya está aprobado y mergeado (V2). Este documento cubre los otros 11.

> **Nota (19-sep-2026):** Los commits que cita este documento (`df3edda`,
> `1d20fd4`, y otros de la misma rama) viven en `releo.git`, el repo interior
> anidado en `saas-factory/` — no en el repo exterior `doman-v4.git`. Una
> auditoría del 18-sep que solo miró el repo exterior concluyó erróneamente
> que estos commits nunca existieron y una versión anterior de este documento
> llegó a decir eso. Es falso: son commits reales, verificables con
> `git log`/`git show` parado en `saas-factory/`.

---

## Fase A — Auditoría (read-only)

Hecha con 4 subagentes de investigación en paralelo, cada uno auditando 2-3
juegos leyendo el código real (no se asumió nada de rondas anteriores sin
confirmarlo de nuevo). Criterios: pedagogía, funcionamiento, visual, audio,
veredicto de grabación.

| Juego | Pedagogía | Funcionamiento | Visual | Audio (antes) | Grabable HOY |
|---|---|---|---|---|---|
| **leo-runner** | OK — opciones siempre texto en carteles, azar 1/2 (Mundo 1, hay 1 piedra) a 1/3 (Mundos 2+) | OK — fallback a emoji si el sprite no carga; capas Pixi sin protección explícita (ver abajo) | Sprite Leo pulido; fondo geométrico simple (no rompe nada); canvas self-cap 760px | `musicVolumeDb: -22` | SÍ, con reserva de volumen |
| **salta-palabra** | OK — mismo patrón, 3 opciones texto, azar 1/3 | OK — mismo esqueleto que leo-runner, misma reserva de capas | Igual que arriba; canvas self-cap 640px | `musicVolumeDb: -22` | SÍ, con reserva de volumen |
| **word-flash** | N/A — no es de opción múltiple (Doman puro: ver+oír+repetir). **Fuera de alcance, no se toca** | Carga con fallback en videos/imágenes rotas; el micrófono está declarado (`hasMicrophone:true`) pero NO se usa en el flujo real (Ronda 2 es tap, no reconocimiento de voz) — discrepancia cosmética, no bug funcional | Layout propio a pantalla completa, sin comparación directa con Leo Vuela | Sin música de fondo tipo arcade | Informativo únicamente — no se toca pase lo que pase |
| **word-image-match** | **Ya corregido** (commit `df3edda`, 11-sep): Sofía solo confirma DESPUÉS del acierto. Test `WordImageMatch.test.tsx` vigente, 3/3 verdes hoy | OK | Sin bitmaps, imágenes chicas + emoji | `useGameMusic` hook compartido: **-24dB hardcodeado** | SÍ |
| **memory-cards** | OK como mecánica (ver palabra completa como texto antes de armar con sílabas), pero **nota estructural**: un toque de sílaba incorrecta no penaliza ni se registra como intento — se puede ganar por ensayo-error dentro del timer sin leer bien. Es un problema de mecánica preexistente, no de audio — **no se toca** (rediseñar mecánicas está fuera de alcance) | OK | Sin bitmaps | mismo hook `useGameMusic`: **-24dB** | CON RESERVAS (volumen + nota de mecánica documentada) |
| **word-train** | OK — vagones siempre texto, azar 25-33% | OK, sin temporizadores colgados | CSS/emoji, sin bitmaps | `musicVolumeDb: -22` | SÍ, con reserva de volumen |
| **phrase-builder** | **Ya estaba bien** (confirmado hoy): solo habla después de completar. Misma nota estructural que Rompecabezas (ensayo-error sin penalización) — no se toca | OK | CSS/emoji | mismo hook `useGameMusic`: **-24dB** | CON RESERVAS (volumen + nota de mecánica documentada) |
| **word-rain** | OK — gotas siempre texto, azar 33% | OK | CSS/emoji | `musicVolumeDb: -22` | SÍ, con reserva de volumen |
| **category-sort** | **Ya corregido** (commit `df3edda`). Test `CategoryGame.test.tsx` vigente hoy. Guard real: si el bloque de palabras no tiene ≥2 categorías válidas, muestra un aviso en vez de trabarse — **recomendado probar 2-3 bloques antes de grabar** para no toparse con esa pantalla en cámara | OK, con la salvedad de arriba | Sin bitmaps | `musicVolumeDb: -22`, **hardcodeado inline** (no aparece en grep de configs — línea 46 de `CategoryGame.tsx`) | CON RESERVAS (volumen + probar bloques) |
| **word-fishing** | OK — peces siempre texto, azar 25% | OK | CSS/emoji | `musicVolumeDb: -22` | SÍ, con reserva de volumen |
| **daily-bits** | OK — burbujas siempre texto, azar 14-20% | OK, sin Pixi ni carga de imágenes | Sin bitmaps propios, pero el **thumbnail del Mundo 5** (`/images/worlds/libro.png`, único mundo de este juego) es un PNG genérico de stock (1200×654, sin tocar desde 1-ago) que además dice **"MONTAÑA" en un cartel**, a pesar de que este mundo es "El Libro Mágico" — error de contenido visible, no solo de estilo | `musicVolumeDb: -22` | CON RESERVAS (volumen + thumbnail roto) |

### Hallazgo transversal — pedagogía (item B1 del pedido)

El bug real ("se puede ganar sin leer porque Sofía dice la palabra antes de
elegir") **ya fue corregido** en su única aparición conocida (Empareja y
Categorías, commit `df3edda`, 11-sep-2026) y sigue corregido hoy — confirmado
corriendo sus tests de regresión.

En los otros 9 juegos que sí anuncian el objetivo por audio antes de que el
chico elija (leo-runner, salta-palabra, word-train, word-rain, word-fishing,
daily-bits, y de otra forma leo-vuela), **las opciones visibles son siempre
texto en posición aleatoria** (carriles, vagones, gotas, peces, burbujas,
nubes). Oír la palabra no le dice al chico DÓNDE tocar — igual tiene que leer
el texto de cada opción y encontrar el que coincide. Verificado de nuevo hoy,
juego por juego, no asumido de la ronda anterior.

**Decisión para la Fase B:** no se agrega un test de "nunca sonar antes de
elegir" a estos 9 juegos, porque haría que la prueba fallara contra un diseño
correcto (habría que mutear el audio de instrucción, lo cual es rediseñar la
mecánica — explícitamente fuera de alcance). El criterio real del pedido es
"¿se puede ganar sin leer?", y la respuesta es NO en los 11. Se mantienen y
verifican los 2 tests que sí importan (Empareja, Categorías). Si preferís que
igual se mute el audio previo en los 9 juegos "de texto", es una decisión de
diseño a tomar aparte — no se hizo unilateralmente acá.

---

## Fase B — Correcciones en lote

### B1 — Audio pedagógico
**Sin cambios de código.** Ver hallazgo transversal arriba: no hay bug vigente
que corregir hoy en los 11 juegos. Los 2 tests de regresión existentes
(`WordImageMatch.test.tsx`, `CategoryGame.test.tsx`) se confirmaron vigentes.

### B2 — Volumen de música (→ -10dB, valor validado en Leo Vuela)
Estado: **completado**. Ver tabla de commits abajo.

| Archivo | Antes | Después |
|---|---|---|
| `config/leo-runner.ts` | -22 | -10 |
| `config/salta-palabra.ts` | -22 | -10 |
| `config/word-train.ts` | -22 | -10 |
| `config/word-rain.ts` | -22 | -10 |
| `config/word-fishing.ts` | -22 | -10 |
| `config/bubbles.ts` (daily-bits) | -22 | -10 |
| `hooks/useGameMusic.ts` (word-image-match, memory-cards, phrase-builder) | -24 | -10 |
| `components/CategoryGame.tsx` (inline, no estaba en ningún config nombrado) | -22 | -10 |

`musicDuckDb` se dejó intacto en todos los casos — el agachado durante la voz
de Sofía ya funcionaba bien, el problema era solo el volumen base.

Test de regresión agregado: `src/features/games/__tests__/music-volume.test.ts`
— falla si cualquier juego tiene `musicVolumeDb < -14`.

### B3 — Capas (ARCADE_Z + sortableChildren)
Estado: **completado** en los únicos 2 juegos que lo necesitaban.

Solo `leo-runner` y `salta-palabra` usan PixiJS con capas propias (los otros 9
son DOM/CSS, sin este riesgo). Ninguno de los dos tenía HOY un bug visible —
el orden de `addChild()` resolvía bien porque la carga async del sprite de Leo
siempre terminaba antes del `addChild(leo)` síncrono que le sigue en el mismo
bloque — pero tampoco tenían la protección estructural que si tiene Leo Vuela
(`ARCADE_Z` + `sortableChildren=true`), y cualquier refactor futuro que
paralelice las cargas podría reproducir el mismo bug que ya se vio en Leo
Vuela. Se aplicó el mismo patrón preventivamente, con test de regresión que
fuerza el peor caso de orden de inserción.

### B4 — Thumbnails y assets obvios
Estado: **sin acción posible sin arte nuevo — documentado, no corregido.**

Los 4 mundos con juego arcade (isla/bahía/valle/montaña) ya fueron
actualizados en la ronda anterior (recortes derivados de los fondos de Leo
Vuela V2, commit `1d20fd4`) — se confirmó visualmente que siguen bien hoy.

El único asset visiblemente roto que quedó es `/images/worlds/libro.png`
(Mundo 5, "El Libro Mágico", usado solo por `daily-bits`): PNG de stock
genérico con un error de contenido (dice "MONTAÑA" en un cartel). **No hay un
fondo final de Leo Vuela para el Mundo 5 del cual derivar un recorte** — Leo
Vuela solo tiene arte para los mundos 1-4. Reemplazarlo bien requeriría
encargar una ilustración nueva, que está explícitamente fuera de alcance esta
noche. Queda pendiente como tarea aparte.

---

## Validación final

Corrida completa después de los 11 commits de la Fase B (8 de volumen, 2 de
capas; B1 y B4 no generaron commits — ver justificación arriba):

- `npm run typecheck` — limpio, 0 errores.
- `npx vitest run` — **234/234 verdes** (era 221/221 antes de esta ronda; se
  sumaron 9 tests de volumen + 4 de capas Pixi).
- `npm run build` — build de producción limpio, sin warnings nuevos.
- `npm run test:qa` (Playwright, 63 specs) — **63/63 verdes** (1 flaky en el
  primer intento por timing de navegación en `/onboarding`, no relacionado a
  ningún cambio de esta ronda — pasó en el reintento automático).
- Verificación visual manual (screenshot vía `/demo?game=<id>`) de los 7
  juegos tocados en código (leo-runner, salta-palabra, category-sort,
  daily-bits, word-image-match, memory-cards, phrase-builder): todos renderizan
  correctamente, sin regresiones visuales. Particular atención a leo-runner y
  salta-palabra (fix de capas): Leo, pistas, carteles y obstáculos se ven en
  el orden correcto.

## Veredicto final por juego

| Juego | Antes | Después de esta ronda |
|---|---|---|
| leo-runner | SÍ, con reserva de volumen | **SÍ** |
| salta-palabra | SÍ, con reserva de volumen | **SÍ** |
| word-flash | fuera de alcance | **fuera de alcance** (sin cambios, como se pidió) |
| word-image-match | SÍ | **SÍ** |
| memory-cards | CON RESERVAS (volumen) | **SÍ** (volumen corregido; nota de mecánica de ensayo-error queda documentada, no es bloqueante para grabar) |
| word-train | SÍ, con reserva de volumen | **SÍ** |
| phrase-builder | CON RESERVAS (volumen) | **SÍ** (misma nota que Rompecabezas) |
| word-rain | SÍ, con reserva de volumen | **SÍ** |
| category-sort | CON RESERVAS (volumen + bloques) | **CON RESERVAS** (volumen corregido; sigue recomendado probar 2-3 bloques de palabras antes de grabar, por el guard de "necesita 2 categorías") |
| word-fishing | SÍ, con reserva de volumen | **SÍ** |
| daily-bits | CON RESERVAS (volumen + thumbnail) | **CON RESERVAS** (volumen corregido; el thumbnail del Mundo 5 sigue roto — necesita arte nuevo, fuera de alcance) |

### Juegos que NO deberían mostrarse en video mañana
Ninguno. Los 11 son grabables. Dos (category-sort, daily-bits) tienen una
reserva puntual y no bloqueante — ver tabla arriba.
