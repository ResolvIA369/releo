# Plan nocturno — Leo Corre y Salta la Palabra en Mundos 2, 3 y 4

> Corrida desatendida. Objetivo: extender `leo-runner` y `salta-palabra` a los
> Mundos 2, 3 y 4 (el Mundo 5 es de oraciones, queda afuera). Mundo 1 no se toca.
> Un commit por ítem, tests después de cada uno. Si un ítem se traba, se anota
> acá y se sigue con el siguiente.

## Recon previo (sin commit)

- [ ] Ver cómo el resto de la app estila la palabra por fase (color/tamaño)
      para replicarlo en los `Text` de Pixi.
- [ ] Confirmar que GameSetup permite elegir Mundos 2-4 en /play.
- [ ] Confirmar cobertura de MP3s `palabra-*` para las palabras de fases 2-4.
- [ ] Confirmar cómo /demo elige palabras por fase (`?phase=`).

## Leo Corre (leo-runner)

### Mundo 2 (fase 2 — roja más chica)
- [ ] Registrar en availableGames del Mundo 2.
- [ ] Palabras con color/tamaño de fase 2.
- [ ] Bloques de palabras del mundo + MP3 de Sofía correcto.
- [ ] Demo autoplay en /demo con fase 2.
- [ ] Smoke test Chromium del flujo completo, cero errores de consola.
- [ ] Tests de Playwright cubriendo el juego en este mundo, suite en verde.
- [ ] Commit.

### Mundo 3 (fase 3 — negra)
- [ ] Registrar en availableGames del Mundo 3.
- [ ] Palabras con color/tamaño de fase 3.
- [ ] Bloques de palabras del mundo + MP3 de Sofía correcto.
- [ ] Demo autoplay en /demo con fase 3.
- [ ] Smoke test Chromium del flujo completo, cero errores de consola.
- [ ] Tests de Playwright cubriendo el juego en este mundo, suite en verde.
- [ ] Commit.

### Mundo 4 (fase 4 — negra más chica)
- [ ] Registrar en availableGames del Mundo 4.
- [ ] Palabras con color/tamaño de fase 4.
- [ ] Bloques de palabras del mundo + MP3 de Sofía correcto.
- [ ] Demo autoplay en /demo con fase 4.
- [ ] Smoke test Chromium del flujo completo, cero errores de consola.
- [ ] Tests de Playwright cubriendo el juego en este mundo, suite en verde.
- [ ] Commit.

## Salta la Palabra (salta-palabra)

### Mundo 2 (fase 2 — roja más chica)
- [ ] Registrar en availableGames del Mundo 2.
- [ ] Palabras con color/tamaño de fase 2.
- [ ] Bloques de palabras del mundo + MP3 de Sofía correcto.
- [ ] Demo autoplay en /demo con fase 2.
- [ ] Smoke test Chromium del flujo completo, cero errores de consola.
- [ ] Tests de Playwright cubriendo el juego en este mundo, suite en verde.
- [ ] Commit.

### Mundo 3 (fase 3 — negra)
- [ ] Registrar en availableGames del Mundo 3.
- [ ] Palabras con color/tamaño de fase 3.
- [ ] Bloques de palabras del mundo + MP3 de Sofía correcto.
- [ ] Demo autoplay en /demo con fase 3.
- [ ] Smoke test Chromium del flujo completo, cero errores de consola.
- [ ] Tests de Playwright cubriendo el juego en este mundo, suite en verde.
- [ ] Commit.

### Mundo 4 (fase 4 — negra más chica)
- [ ] Registrar en availableGames del Mundo 4.
- [ ] Palabras con color/tamaño de fase 4.
- [ ] Bloques de palabras del mundo + MP3 de Sofía correcto.
- [ ] Demo autoplay en /demo con fase 4.
- [ ] Smoke test Chromium del flujo completo, cero errores de consola.
- [ ] Tests de Playwright cubriendo el juego en este mundo, suite en verde.
- [ ] Commit.

## Si queda tiempo — "juice" solo con código (sin assets nuevos)

- [ ] Squash-and-stretch en aciertos (ambos juegos).
- [ ] Easing con anticipación en el salto (SaltaPalabra).
- [ ] navigator.vibrate() en el toque para mobile (ambos juegos).
- [ ] Tests en verde + commit.

## Cierre

- [ ] tsc, unit y Playwright en verde al final.
- [ ] Notas de lo que quedó trabado (si hay).

## Notas / Trabas

(ninguna por ahora)
