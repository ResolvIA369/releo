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

---

## Deuda conocida

- **Los locks de progresión están desactivados**: `isLocked = false` hardcodeado en
  `src/app/(main)/play/page.tsx` y `src/app/(main)/learn/page.tsx` (3 lugares, con
  `// TODO: restore lock logic after testing`). La lógica de
  `features/progression/config/unlock-requirements.ts` existe y **tiene tests que
  pasan**, pero la UI no la usa. Decidir: reactivar o borrar.
- **`npm run lint` reporta ~47 errores y ~109 warnings preexistentes**, casi todos
  de las reglas nuevas de `react-hooks` (`refs`, `set-state-in-effect`) y
  `no-unused-vars`. Nada rompe en runtime; es limpieza pendiente.
- El service worker **solo cachea navegaciones**: imágenes, audio y video no
  entran al caché, así que "usala sin internet" todavía no es del todo cierto.
