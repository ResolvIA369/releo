# Plan: Refactor arcade + modelo completo en Leo Corre y Salta la Palabra

Rama: `feature/juegos-arcade`. Un commit por ítem, `tsc` + `vitest` verdes
después de cada uno. Sin tocar los demás juegos ni Flash de Palabras.
Si algo queda pendiente, se anota al pie y se frena.

## A) Refactor: sistemas comunes extraídos de Leo Vuela (sin cambiar su comportamiento)

- [x] **A1** `config/arcade-tuning.ts`: tipos compartidos (energía, niveles,
      premios, música) + helpers (`clampEnergy`, `levelForElapsed`,
      `rewardForLevel`, `pickNextTarget`). `leo-vuela.ts` re-exporta para que
      sus imports y tests sigan igual.
- [x] **A2** `components/arcade-music.ts`: la clase de loops con crossfade
      (ex `LeoVuelaMusic`) renombrada `ArcadeMusic`, genérica;
      `leo-vuela-music.ts` queda como re-export.
- [x] **A3** `components/ArcadeHud.tsx`: HUD genérico (badge nivel + aciertos +
      pill objetivo con prefijo configurable + barra de energía) parametrizado
      por color; Leo Vuela lo usa.
- [x] **A4** Hooks `useArcadeEnergy` (ref + UI + drenaje + game over),
      `useArcadeLevel` (tiempo jugado → nivel) y `useSofiaIntro` (intro que
      bloquea el arranque). Leo Vuela migra a los hooks, tests verdes.
- [x] **A5** `components/arcade-obstacles.ts`: base compartida (`spawnRoll`,
      tipos de frame con knock/energía, helpers de entidades) +
      `FloorObstacles` genérico para juegos "de piso" (troncos, pájaros que
      bajan, lluvia, puercoespines opcionales). Leo Vuela sigue con su sistema
      de cielo, importando la base.

## B) Modelo completo en Leo Corre y Salta la Palabra

Mecánica central intacta (Corre = elegir carril; Salta = saltar a atrapar).
Error de palabra = solo tint, sin audio. La lectura es lo único que da puntos.
Todo ajustable en un tuning por juego.

- [x] **B1** Leo Corre — `LEO_RUNNER_TUNING` + flujo continuo (carteles nunca
      paran, pill fija, Sofía en paralelo, palabras repetibles), energía,
      niveles por tiempo (126s), premios por nivel, error mudo.
- [x] **B2** Leo Corre — música de selva (mismos 3 loops, crossfade por nivel,
      ducking, gesto) + intro de Sofía (edge-tts es-AR-ElenaNeural). Texto:
      «¡Hola! Soy la Seño Sofía. Leo va a correr por el camino. Escuchá la
      palabra, y tocá el camino donde está escrita para que Leo corra hacia
      ella. ¡Vos podés! ¡A correr!»
- [x] **B3** Leo Corre — obstáculos de piso por nivel (troncos cruzando el
      camino, pájaros que bajan, ráfagas de lluvia), coherentes con las
      piedras existentes (las piedras siguen siendo parte de la decisión de
      lectura; los obstáculos nuevos aparecen entre tandas y restan energía
      con invulnerabilidad breve).
- [ ] **B4** Salta la Palabra — `SALTA_TUNING` + flujo continuo, energía,
      niveles, premios, error mudo.
- [ ] **B5** Salta la Palabra — música de selva + intro de Sofía (edge-tts
      es-AR-ElenaNeural). Texto: «¡Hola! Soy la Seño Sofía. Leo va a saltar
      bien alto. Escuchá la palabra, y tocá la pantalla para que Leo salte y
      la atrape. ¡Y ojo con los bichitos del camino! ¡Vos podés! ¡A saltar!»
- [ ] **B6** Salta la Palabra — obstáculos de piso: troncos, pájaros que
      bajan, lluvia y **puercoespines que caminan por el piso** (hay que
      saltarlos); tocarlos resta energía con invulnerabilidad breve.
- [ ] **Final** — suite Playwright completa + verificación en navegador de los
      3 juegos, push.

## Estado / pendientes

(se completa al cerrar)
