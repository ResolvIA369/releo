# Plan: modelo arcade en los 4 juegos de acción restantes

Rama: `feature/juegos-arcade`. Un commit por ítem, `tsc` + `vitest` verdes
después de cada uno. Orden: Tren → Lluvia → Pesca → Burbujas.

NO tocar los juegos de pensar (Empareja, Rompecabezas, Construye la Frase,
Categorías) ni el Flash de Palabras.

## Contexto técnico

Los 4 juegos son DOM/React (no PixiJS como los Leo). Reúso los hooks/módulos
compartidos que ya existen: `useArcadeEnergy`, `useArcadeLevel`, `useSofiaIntro`,
`ArcadeMusic`, `ArcadeHud`. Los hooks de energía/nivel se manejan con un `dt` en
frames (convención de los tickers Pixi); para los juegos DOM agrego un driver
rAF compartido.

### Decisión sobre obstáculos (importante)

`GroundObstacles`/`LaneObstacles` asumen un **avatar que se mueve por el mundo y
recibe golpes** (Leo volando/corriendo/saltando). Los 4 juegos de acción son
"tocá el objetivo correcto" SIN avatar que pilotear: el dedo toca targets, no hay
un personaje que esquive. Un obstáculo "que resta energía al tocarlo con
invulnerabilidad" no tiene dónde golpear. Forzarlo sería indistinguible de un
distractor más. Por eso, siguiendo la instrucción ("si no encaja, dejalo sin
obstáculos y anotalo"), **los 4 van SIN obstáculos**. Se documenta acá y listo.

Todo lo demás del modelo arcade SÍ aplica: flujo continuo, energía, niveles por
tiempo, premios, música de selva + ducking, intro de Sofía, error mudo.

## Ítems

- [ ] **0** `useArcadeClock`: hook rAF compartido que emite `dt` (frames) cada
      frame respetando un flag `active` (pausa/fase). Driver de energía/nivel
      para los juegos DOM.

- [ ] **1** Tren de Palabras (`word-train`): `WORD_TRAIN_TUNING`, flujo continuo
      (sin pantalla de dificultad ni pausa de anuncio: el tren entra y Sofía
      nombra en paralelo), energía, niveles por tiempo (126s) que aceleran el
      tren, premios por nivel, música + ducking, intro de Sofía, error mudo.
      Mecánica intacta: tocar el vagón correcto. Sin obstáculos.
      Intro: «¡Hola! Soy la Seño Sofía. Mirá los trenes que pasan. Escuchá la
      palabra, y tocá el vagón donde está escrita antes de que se vaya. ¡Vos
      podés! ¡Allá va el tren!»

- [ ] **2** Lluvia de Palabras (`word-rain`): `WORD_RAIN_TUNING`, flujo continuo,
      energía, niveles que aceleran la caída, premios, música + ducking, intro,
      error mudo. Mecánica intacta: atrapar la palabra que cae. Sin obstáculos.
      Intro: «¡Hola! Soy la Seño Sofía. Del cielo caen palabras. Escuchá cuál te
      pido, y tocala antes de que llegue al suelo. ¡Vos podés! ¡A atrapar!»

- [ ] **3** Pesca de Palabras (`word-fishing`): `WORD_FISHING_TUNING`, flujo
      continuo (sin timer de 10s por ronda: la energía marca el ritmo), niveles
      que aceleran los peces, premios, música + ducking, intro, error mudo.
      Mecánica intacta: tocar el pez correcto. Sin obstáculos.
      Intro: «¡Hola! Soy la Seño Sofía. Los peces nadan con palabras. Escuchá
      cuál pescar, y tocá el pez correcto. ¡Vos podés! ¡A pescar!»

- [ ] **4** Burbujas Mágicas (`daily-bits`): `BUBBLES_TUNING`, flujo continuo,
      energía, niveles que aceleran/agregan burbujas, premios, música + ducking,
      intro, error mudo. Mecánica intacta: reventar la burbuja correcta. Sin
      obstáculos.
      Intro: «¡Hola! Soy la Seño Sofía. Las palabras flotan en burbujas. Escuchá
      cuál reventar, y tocá la burbuja correcta. ¡Vos podés! ¡A reventar!»

- [ ] **Final** Playwright completo + verificación en navegador de los 4 + push.

## Estado / pendientes

(se completa al cerrar)
