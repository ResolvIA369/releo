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
  riesgo de volver a commitear en el repo equivocado. El exterior
  (`doman-v4.git`) tiene contenido real que no está acá y no se migró:
  `muestras-voz/` (comparación de voces TTS que llevó a elegir
  `es-AR-ElenaNeural`) y `_wip-pending/` (prototipos sin integrar: onboarding,
  post-game, spaced repetition, haptics, una reescritura modular de
  WordFlash). Sigue existiendo, pero en un repo que ya no se mira de rutina.
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
