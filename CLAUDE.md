# REleo — Guía del proyecto

App educativa para enseñar a leer con el **método Doman** (Glenn Doman): flash de
palabras + juegos. Mascotas: **Leo** (león) y la **Seño Sofía**.
En vivo: **https://releo.resolvia.online**

> Este archivo describe REleo. El repo nació del template *SaaS Factory*, pero la
> app ya no sigue ese Golden Path: **no hay Supabase, ni login, ni pagos, ni IA**.
> Todo es local y offline-first.

---

## Stack real

| Capa | Qué se usa |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Estado | Zustand (`src/shared/store/useAppStore.ts`) |
| Persistencia | **IndexedDB** vía `idb` (`src/features/persistence/services/db.ts`) — no hay backend |
| Animación | framer-motion · canvas-confetti · pixi.js |
| Estilos | **inline styles desde `design-tokens.ts`** (ver abajo) + algo de Tailwind 3.4 |
| Voz | Web Speech API + audios pregrabados en `public/audio/sofia` |
| Tests | Vitest (unit) + Playwright (`tests/games/`) |
| Deploy | Vercel, **manual** |

No hay auth ni base de datos remota: el perfil del chico, el progreso y las
tarjetas de repaso viven en IndexedDB del dispositivo.

---

## Comandos

```bash
npm run dev              # dev server (Turbopack)
npm run build            # build de producción
npm run typecheck        # tsc --noEmit
npm run lint             # eslint (flat config, ESLint 9)
npm test                 # vitest run
npm run test:qa          # playwright sobre los juegos
npm run optimize:assets  # recomprime public/ in-place (ver "Assets")
```

Antes de deployar: `npm run typecheck && npm test && npm run build`.

---

## Deploy — LEER ANTES DE TOCAR

El proyecto Vercel es **`releo`** (team `resolvia369`) y **NO está conectado a git**.

```bash
vercel deploy --prod     # desde saas-factory/
```

Consecuencias:
- **`git push` NO actualiza producción.** Solo el comando de arriba.
- El deploy sube el **working tree completo**, commiteado o no. Cuidado con dejar
  cambios a medio hacer.
- Tras el deploy el usuario sigue viendo la versión vieja hasta tocar
  **"Actualizar"** en el banner del PWA (o Ctrl+Shift+R). Es a propósito:
  `public/service-worker.js` no llama `skipWaiting()` hasta que el usuario acepta.

---

## Convenciones que importan

### Estilos: tokens inline, no clases inventadas
La app estiliza con **objetos inline** importados de
`src/shared/styles/design-tokens.ts` (`colors`, `spacing`, `fonts`, `fontSizes`,
`radii`, `shadows`), que son theme-aware vía CSS vars. Al tocar UI, seguir ese
patrón.

**`bg-background` no existe como token de Tailwind acá.** El `tailwind.config.ts`
define solo `surface`, `border`, `text-base`, etc. Inventar clases da estilos
silenciosamente rotos.

### Arquitectura feature-first
```
src/features/<feature>/{components,hooks,config,types,__tests__}
src/shared/{components,services,store,styles,constants,utils}
```
Features: `games` (8 juegos), `session` (flash Doman), `progression` (mundos),
`persistence`, `tutor` (Sofía), `onboarding`, `landing`.

### Assets — `public/` pesa, cuidarlo
`public/` son ~75 MB (45 MB de video, 22 MB de audio, ~6 MB de imágenes) y se
sube entero en cada deploy.

Al agregar una imagen, pasarla por el optimizador:

```bash
npm run optimize:assets          # in-place, mismo nombre y extensión
node scripts/optimize-assets.mjs --dry   # ver qué haría
```

Convierte a PNG con paleta de 256 colores y recorta al ancho real de uso. En las
ilustraciones planas de REleo eso pesa **menos que WebP** y no obliga a renombrar
referencias (varias son dinámicas: `` `/thumbnails/thumbnail-sesion-${id}.png` ``).
Los anchos objetivo por carpeta están en `RULES` dentro del script.

**No metas PNGs de 2800px sin pasarlos por ahí.** Un solo personaje sin optimizar
son 2,6 MB.

### Preload de personajes
Leo y Sofía se precargan con `preload()` de `react-dom` en
`src/app/(main)/layout.tsx` — **solo dentro de la app**, nunca en el layout raíz,
para que la landing pública no pague ese costo.

---

## Voz de Sofía

**Desde el 19-sep-2026 hay DOS voces, divididas a propósito por función.
No unificar.**

| Qué genera | Voz | voice_id | Por qué |
|---|---|---|---|
| `palabra-*.mp3` (las 220 palabras que el chico lee, Flash de Palabras) | **candB** | `JddqVF50ZSIR7SRbJE6u` | Jessica es una voz de base en inglés: en pruebas mispronunciaba palabras en español. candB es nativa de español latinoamericano — se eligió tras comparar tres candidatas con material idéntico (ver `muestras-voz/muestras-candidatas-latam.py`). **Ojo:** `0uHpKhb0ymsdvmCtPV8y` es candA, la otra candidata descartada — no confundir (pasó el 19-sep-2026, corregido el mismo día antes de tocar más que 10 palabras). |
| Todo lo demás — frases, reglas, reacciones, afirmaciones de sesión (~495 archivos) | **Jessica** | `cgSgspJ2msm6clMCkdW9` | Voz canónica desde el 22-ago-2026, sigue siéndolo para todo lo que NO es una palabra suelta que el chico tiene que leer. |

La división es por **función, no por calidad**: candB dice las palabras
sueltas (necesitan pronunciación nativa exacta, se leen aisladas, sin
contexto que ayude a desambiguar), Jessica guía la sesión (frases largas,
tono cálido, ya validada). No reemplazar una por la otra en el resto del
corpus sin repetir la comparación.

- **Pipeline de las 220 palabras (candB):** `scripts/regenerate-words-candb.py`.
  Deriva la lista de las 220 palabras reales desde
  `src/shared/constants/words.ts` vía Node (no desde el disco — hay 7
  archivos huérfanos en `public/audio/sofia/palabra-*.mp3` que no son del
  currículum actual: `autos`, `café`, `calcetín`, `chaqueta`, `falda`,
  `morado`, `pijama` — no tocarlos). Usa la misma etiqueta de emoción
  `[gently]` que el corpus le asigna hoy al prefijo `"palabra-"`. Reemplaza
  a `scripts/regenerate-marked-words.py` (borrado el 19-sep-2026: apuntaba
  a Jessica, ya no corresponde).
- **Pipeline de afirmaciones de sesión (Jessica):**
  `scripts/regenerate-afirmaciones-inicio.py`, para las 8
  `afirmacion-inicio-01..08.mp3` de `SofiaAffirmationGate.tsx`.

### Respelling fonético (19-sep-2026)

Diagnóstico del 19-sep: el problema con palabras como "hospital" no era
timbre de voz, era **detección de idioma** — una palabra suelta que también
existe en inglés (homógrafa: `hospital`, `pan`, `come`, `sin`...) o de una
sola letra (`y`, que dispara la lectura "why") no le da al modelo contexto
para leerla en español. Confirmado con un cruce estadístico contra listas de
frecuencia de inglés: las 47 palabras que César marcó como mal
pronunciadas tienen una tasa de homografía con el inglés muchísimo más alta
que las que no marcó (hasta 30x en el corte más estricto). Se probaron 4
soluciones (`language_code=es` forzado, respelling fonético, frase con
contexto y recorte, control) — **ganó el respelling fonético**.

**Mecanismo:**
- **`scripts/respelling-palabras.json`** es la fuente única. Cada clave es
  la palabra real (la que está en `words.ts` y el chico ve en pantalla);
  cada valor es la grafía que se le manda a la API de TTS en su lugar —
  **sólo para generar el MP3, nunca se muestra**. Ej.: `"hospital":
  "ospital"` (la h es muda en español igual, sacarla saca el gatillo de
  lectura inglesa), `"y": "i"` (evita que lea "why").
- `scripts/regenerate-words-candb.py` lo carga con `cargar_respelling()` —
  no hay ninguna copia paralela del diccionario en otro lado.
- **Garantía de que no se filtra a la UI:**
  `src/shared/__tests__/audio-respelling-integrity.test.ts` — corre en
  `npm test`, revienta si alguna grafía respelled apareciera como texto de
  una palabra en `ALL_WORDS` (words.ts). Si algún día alguien "corrige" a
  mano `words.ts` para que coincida con el respelling pensando que es el
  texto correcto, este test lo agarra.
- Antes de generar una tanda, correr `--palabras <lista corta>` primero
  (nunca `--todas` directo) y escuchar. El respelling es una heurística por
  palabra, no una fórmula: lo que funciona para una no garantiza que
  funcione para otra.

**La voz canónica de todo lo que NO es palabra suelta sigue siendo
ElevenLabs "Jessica"** (`cgSgspJ2msm6clMCkdW9`, modelo
`eleven_v3`, salida 192kbps/44.1kHz mono), desde el **22-ago-2026**
(commit `2e21c29`, rama `main`, ancestro de todas las ramas activas). Ese
commit regeneró los ~495 MP3 existentes hasta ese momento — no quedó
ninguno viejo mezclado.

- **Pipeline de generación:** `scripts/regenerate-all-elevenlabs.py`. Usa
  `[etiquetas]` de estilo entre corchetes (`[gently]`, `[warmly]`,
  `[excited]`...) que el modelo `eleven_v3` interpreta como dirección de
  emoción — no es SSML, es una convención propia de ese modelo. La
  emoción por tipo de archivo (prefijo del nombre) está en el diccionario
  `EMOCION` del script.
- **Corpus de texto (fuente única):** `scripts/regenerate-all-audio.py`
  sigue siendo de dónde sale el texto (`PHRASES`, `load_words()`,
  `load_stories()`) — `regenerate-all-elevenlabs.py` lo importa. Si se
  agrega una frase nueva, se agrega ahí. **Pero ese archivo ya NO genera
  audio**: su propio pipeline (edge-tts / `es-AR-ElenaNeural`) quedó
  obsoleto el mismo 22-ago y correrlo pisaría los MP3 de Jessica con la
  voz vieja. Tiene un aviso en su docstring.
- **`generate-missing-mp3s.py`** y **`generate-audio.mjs`**: motores
  alternativos viejos, ambos con `es-MX-DaliaNeural` (voz mexicana que
  nunca fue la elegida) — el segundo además con rate/pitch distinto por
  frase (`msedge-tts`, Node). Ninguno de los dos generó lo que hoy está
  en `public/audio/sofia`. Ignorar — no correr bajo ningún concepto.
- **Antes de asumir qué voz tiene un MP3 existente, verificarlo**, no
  fiarse del nombre del script que "debería" haberlo generado: `file
  archivo.mp3` distingue el encoder — Jessica sale como `ID3 v2.4.0 [...]
  Lavf, 192 kbps, 44.1 kHz`; edge-tts sale como `LAME3.100, 48 kbps, 24
  kHz` (sin ID3). El 19-sep-2026 una sesión asumió edge-tts como voz
  canónica (documentación desactualizada) y generó 8 MP3 nuevos con la
  voz y el bitrate viejos, mezclados con el resto — se detectó y
  corrigió el mismo día.

---

## Gotchas conocidos

- **`turbopack.root`** está fijado en `next.config.ts`. Sin eso, Turbopack infiere
  la raíz en el directorio padre (que tiene otro `package-lock.json`) y el build
  revienta con *"Next.js package not found"*.
- El `experimental.mcpServer` solo se activa fuera de producción.
- Hay dos carpetas de Sofía: `public/images/Sofía` (con tilde) y
  `public/images/sofia`. Revisar cuál se referencia antes de borrar ninguna.
- **Este proyecto tuvo dos repos git gobernando la misma carpeta**: `releo.git`
  (el interior, `saas-factory/.git` — canónico, historia granular completa
  desde abril) y `doman-v4.git` (el exterior, `/home/cesar/proyectos/releo/.git`,
  que trackeaba los archivos de `saas-factory/` como si fueran propios, sin
  saber que había un repo anidado adentro). El 18-sep-2026 una sesión trabajó
  sin darse cuenta parado en el exterior, y eso llevó a una auditoría que
  concluyó — erróneamente — que varios commits y una rama citados en
  `docs/RELEO-AUDITORIA-GRABACION.md` y `docs/RELEO-LAYOUT-V3.md` nunca habían
  existido. Existían: estaban en el interior. El 19-sep se cortó la anidación
  (ver el resto de esta sección) y `doman-v4.git` quedó congelado como
  respaldo, sin uso futuro.
- **19-sep-2026 — anidación destrackeada, pero no eliminada.** En el exterior
  se corrió `git rm -r --cached saas-factory/` y se agregó `saas-factory/` a
  su `.gitignore`: el exterior ya no ve ni trackea estos archivos, pero la
  carpeta sigue físicamente anidada (`saas-factory/` adentro de
  `/home/cesar/proyectos/releo/`, cada una con su propio `.git`). Aplanar la
  carpeta (mover `saas-factory/` un nivel arriba y reubicar el contenido del
  exterior a otra ruta) quedó **pendiente como tarea futura** — es la
  solución definitiva, pero no urgente ahora que el destrackeo cortó el
  riesgo de volver a commitear en el repo equivocado. El único contenido real
  que tenía el exterior y no estaba acá (`muestras-voz/`, `_wip-pending/`) se
  migró el mismo día — ver los dos ítems siguientes. Lo que quedó en el
  exterior después de eso es solo la documentación propia del template SaaS
  Factory (`CLAUDE.md`, `README.md`, `assets/*.png`, etc.) — nada específico
  de REleo, recuperable del repo público
  `saas-factory-community/saas-factory-setup` si hiciera falta.
- **`muestras-voz/`** (raíz del repo): dos rondas de comparación de voces,
  ninguna corrida por la app. La primera (script `generar-muestras.py`,
  ~abril) comparó voces edge-tts y llevó a elegir `es-AR-ElenaNeural` —
  la voz que se usó hasta el 22-ago. La segunda (`muestras-elevenlabs.py`,
  ~agosto) comparó voces de ElevenLabs (Sarah, Matilda, Lily, Alice,
  Laura, Jessica) y llevó a elegir Jessica — la voz canónica actual, ver
  "Voz de Sofía" arriba. Las muestras de ambas rondas conviven en la
  carpeta; el nombre del archivo indica cuál es cuál (`N-nombre.mp3` para
  edge-tts, `el-N-nombre.mp3` para ElevenLabs).
- **`_wip-pending/`** (raíz del repo): prototipos de features nunca
  integradas — onboarding, pantalla post-partida, repetición espaciada,
  haptics, una reescritura modular completa de Flash de Palabras
  (`WordFlash-modular-29abr/`). Tienen imports relativos rotos (asumían una
  ubicación dentro de `src/` que nunca llegaron a tener) — por eso está
  **excluida de `tsconfig.json` y de `eslint.config.mjs`**: no participa del
  build ni del typecheck. Si algún día se retoma algo de acá, hay que
  arreglar esos imports primero.
- **Al verificar un SHA o una rama, confirmá primero en qué repo estás
  parado** (`git remote -v`, `pwd`). Un commit ausente en el que estás no
  prueba que no exista — puede estar en el otro.
- **Un deploy no prueba que el código esté commiteado.** `vercel deploy` (con
  o sin `--prod`) se corre desde `saas-factory/` y sube el working tree tal
  cual está en disco — no depende de git ni de qué repo esté activo.
  Verificar con `git status` aparte.

---

## Progresión: qué bloquea y qué no

- **Los mundos NO se bloquean.** Están todos abiertos desde el principio. El
  sistema de `unlockRequirements` (palabras dominadas, rachas) se dio de baja: no
  buscar `unlock-requirements.ts`, ya no existe. `WorldStatus` es
  `available | current | completed` y solo describe, no restringe.
- **Las sesiones SÍ se bloquean en secuencia.** `SessionNodeList.tsx` exige haber
  completado la sesión anterior para abrir la siguiente. Es a propósito: es el
  orden del método Doman. Está vivo y funcionando.

## Deuda conocida

- **`npm run lint` da 0 errores y ~152 warnings.** Las 5 reglas del React Compiler
  (`react-hooks/refs`, `purity`, `immutability`, `preserve-manual-memoization`,
  `set-state-in-effect`) están bajadas a `warn` a propósito — ver el comentario en
  `eslint.config.mjs`. No son bugs. Si se activa el React Compiler (mejora real de
  performance en los juegos), volver a subirlas a `error` y encararlas.
- El service worker **solo cachea navegaciones**: imágenes, audio y video no
  entran al caché, así que "usala sin internet" todavía no es del todo cierto.
