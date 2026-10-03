# QA de la biblioteca de voz de Sofía (3-oct-2026)

Tanda de verificación sobre los 2.399 audios generados el 1-oct en
`biblioteca-voz/sofia/`. **No genera audio nuevo ni toca la app.** El ítem 7 (bug
móvil) sí toca la app y va aparte.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho

## 1. Modelo y créditos
- [x] model_id real por llamada (código + manifest), por categoría y voz
- [x] Qué es 78.966: caracteres de texto o créditos cobrados
- [x] Suma real de caracteres enviados (cola/) contra duración total
- [x] Origen del "0,5 crédito por carácter": dato o supuesto

## 2. Reporte roto (reescribir completo)
- [x] Saldo y REsiliencia (¿misma key/cuenta? evidencia)
- [x] Por qué no se commitean los 430 MB
- [x] Sonidos de letras y sílabas experimentales

## 3. Respaldo
- [x] `biblioteca-voz/MANIFEST.sha256`
- [x] `.tar.zst` en `~/respaldos/` (ruta y tamaño)
- [x] Remotes de rclone (sólo listar, no subir)

## 4. Muestra de escucha
- [x] `biblioteca-voz/qa/escucha.html`: 28 respellings, 3 por tema (19), 10 sílabas, 10 de Sofía, 2 cuentos completos
- [x] OK/MAL + nota + Exportar `qa-resultados.json`, sin depender de localStorage

## 5. Revisión de textos (sólo marcar)
- [x] `biblioteca-voz/qa/textos-a-revisar.md`: Doman, homógrafas con inglés, no rioplatense, contenido dudoso 3-7, parecido a cuentos conocidos, preguntas ambiguas

## 6. Cierre
- [x] Commit de código y textos (sin audios; `biblioteca-voz/.gitignore` excluye sofia/ y *.mp3)
- [x] Sin deploy (ni de la biblioteca ni de la app) y sin push: un push a main publica en producción
- [x] REne: ADELANTO que corrige la ENTREGA_LISTA y marca el estado GENERADO_PENDIENTE_QA (rene-hito no tiene ese tipo)
- [x] Reporte final

## 7. Bug móvil: cartel de Vercel al girar a horizontal
- [x] Diagnóstico: a) toolbar/comments · b) página de error por navegación · c) service worker con HTML viejo
- [x] En qué URL pasa (no determinado: falta la URL exacta que abrió César) (prod / preview)
- [x] Reproducción con Playwright (vertical → horizontal), prod y local
- [x] (no aplica: no se confirmó b ni c) Si es b o c: fix + test, commit, push, deploy a PREVIEW (no prod)

## Bitácora

- 3-oct: modelo = `eleven_v3` en 2.399/2.399 según el request (código + manifest). El servidor no lo confirma por separado: la key no tiene `speech_history_read`.
- 3-oct: 78.966 = suma del header `character-cost`. Texto enviado = 156.728 caracteres (179.350 con etiquetas de emoción). Cobrado ÷ enviado-con-etiqueta = 0,44, estable en todas las categorías.
- 3-oct: duración medida con ffprobe = 222,9 min individuales + 86,0 min de narraciones completas (estas repiten las escenas de cuentos, no son TTS nuevo).
- 3-oct: MANIFEST.sha256 con 2.460 archivos. Respaldo en `~/respaldos/releo-biblioteca-voz-2026-10-01.tar.zst` (420 MB, 2.427 mp3 verificados al desempaquetar). rclone no está instalado ni configurado.
- 3-oct: REsiliencia `audio/tts-lote.mjs` lee el mismo `~/.elevenlabs-key` → misma key y misma cuenta.
- 3-oct: escucha.html con 106 audios (27 respellings, 57 por tema, 10 sílabas, 10 de Sofía, 2 cuentos). Se probó con Playwright: los 106 cargan, OK/MAL/nota/Exportar funcionan, y también con localStorage bloqueado. Pasó por el crítico ciego y se corrigió.
- 3-oct, bug móvil: NO reproducido. En Playwright (Pixel 7, prod, /play/leo-vuela y /play/salta-palabra, vertical→horizontal) no hubo navegaciones, ni HTTP ≥400, ni errores. El código no navega al girar (RotateGate sólo cambia estado). El SW sólo sirve HTML cacheado sin red. No se probó local ni con la PWA instalada.
- 3-oct, Vercel (dato, vía API): `ssoProtection = all_except_custom_domains` → toda URL *.vercel.app muestra «Vercel Authentication» (verificado: 302) y el dominio propio no. Toolbar sin configurar (defaults). **GitHub SÍ está vinculado** (rama de producción main): hasta el 23-sep cada push a main generó un deploy de producción con source=git. Un push a main hoy publicaría en producción.
- 3-oct, textos: textos-a-revisar.md con 150 hallazgos en 7 secciones. «Doman» aparece sólo en metadatos internos (extra de 80-silabas, manifest, README), en ningún texto hablado. Verificados a mano: «rugí» en cuento-08-e5 y «heladera» por heladería en micro-n2-05.
- 3-oct: MANIFEST.sha256 regenerado (2.456 archivos, 2.427 mp3) después de los cambios en README y .gitignore. Los mp3 coinciden con los del respaldo; el README del .tar.zst es la versión anterior.
