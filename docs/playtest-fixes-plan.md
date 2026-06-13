# Plan: arreglos de playtest (juegos arcade)

Rama `feature/juegos-arcade`. Un commit por ítem, `tsc` + `vitest` verdes tras
cada uno. Todo lo nuevo configurable en los TUNING. Push al final.

## Sistémicos (vía hooks/módulos compartidos)

- [x] **1** Niveles por palabras acertadas, no por tiempo. `useArcadeLevel`
      avanza tras `wordsPerLevel` (10, configurable) aciertos; topa en 3; el
      juego sigue terminando por energía. `tick(dt)` queda solo como reloj de
      juego (invulnerabilidad de obstáculos); el nivel sube en `registerCorrect()`
      al acertar. Toca los 7 juegos + tests.
- [x] **2** Distribución pareja: selector de objetivo = "bolsa barajada"
      (`createWordBag`) que recorre todas las palabras del bloque una vez antes
      de rebarajar; sin repetir la última al cruzar barajadas. Reemplaza
      `pickNextTarget` en los 7 juegos.
- [x] **3** Intros de Sofía sin el "Hola" apagado: regenerar las 7 locuciones
      (arrancan directo "¡Soy la Seño Sofía!...") con edge-tts es-AR-ElenaNeural,
      y actualizar los textos fallback.
- [x] **4** Mostrar el avatar de Sofía durante la intro (reusar `SofiaAvatar` +
      `AudioWaves` del GameIntro). Componente compartido `ArcadeIntro` en los 7.

## Por juego

- [x] **5** Leo Salta: separación mínima entre obstáculos del piso
      (`minGroundGapPx`, configurable) para que los puercoespines siempre se
      puedan esquivar.
- [x] **6** Leo Salta: movimiento horizontal (←/→ + botones ◀▶, como Leo Vuela)
      además del salto.
- [x] **7** Leo Corre: 4º carril en Nivel 3 (`lanesByLevel: [3,3,4]`,
      configurable).
- [x] **8** Tren: que el "¡Muy bien!" suene completo — la tanda siguiente espera
      a que termine la felicitación en vez de cortarla.

- [x] **Final** Playwright + verificación en navegador de los juegos tocados + push.

## Textos de intro (sin "Hola")

- Tren: «¡Soy la Seño Sofía! Mirá los trenes que pasan. Escuchá la palabra, y
  tocá el vagón donde está escrita antes de que se vaya. ¡Vos podés! ¡Allá va el tren!»
- Lluvia: «¡Soy la Seño Sofía! Del cielo caen palabras. Escuchá cuál te pido, y
  tocala antes de que llegue al suelo. ¡Vos podés! ¡A atrapar!»
- Pesca: «¡Soy la Seño Sofía! Los peces nadan con palabras. Escuchá cuál pescar,
  y tocá el pez correcto. ¡Vos podés! ¡A pescar!»
- Burbujas: «¡Soy la Seño Sofía! Las palabras flotan en burbujas. Escuchá cuál
  reventar, y tocá la burbuja correcta. ¡Vos podés! ¡A reventar!»
- Leo Corre: «¡Soy la Seño Sofía! Leo va a correr por el camino. Escuchá la
  palabra, y tocá el camino donde está escrita para que Leo corra hacia ella.
  ¡Vos podés! ¡A correr!»
- Salta: «¡Soy la Seño Sofía! Leo va a saltar bien alto. Escuchá la palabra, y
  tocá la pantalla para que Leo salte y la atrape. ¡Y ojo con los bichitos del
  camino! ¡Vos podés! ¡A saltar!»
- Leo Vuela: «¡Soy la Seño Sofía! Hoy Leo quiere volar entre las nubes. Escuchá
  la palabra, y tocá la pantalla para que Leo vuele hasta la nube correcta.
  ¡Vos podés! ¡A volar!»

## Estado / pendientes

**COMPLETADO** (2026-06-13). 8 ítems + plan + cierre, un commit cada uno.
Verificación: tsc + 187 unit tests + Playwright 53/53 en verde; smoke en Chromium
real de Tren, Salta, Leo Corre y los juegos tocados (intro con avatar de Sofía
que se va al arrancar, HUD con energía/nivel, demo resolviendo correctas, botones
de mover en Salta, sin errores de página).

Notas:
- Niveles ahora por aciertos (wordsPerLevel: 10) en los 7 juegos; el reloj de
  juego (playSecRef) se mantiene para la invulnerabilidad de obstáculos.
- El 4º carril de Leo Corre entra en Nivel 3 (tras 20 aciertos); cubierto por
  tests de config/buildLanes (no alcanzable en un smoke corto).
- El arreglo de audio se aplicó solo a Tren (el reportado). El mismo patrón de
  delay fijo existe en los otros juegos pero sus felicitaciones no se reportaron
  cortadas; si aparece, se replica el encadenado al .finally.
