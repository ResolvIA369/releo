# Verificar qué voz tienen los videos de Flash

Los videos de la tanda del 8-ago no guardan copia de los mp3: `releo-audio.mjs`
(editor-pro-max) arma el audio leyendo `public/` en el momento. Estos scripts
comparan el audio del `final.mp4` contra cada versión de git de las palabras,
con correlación cruzada normalizada (~1,0 = es ese archivo).

```bash
python3 comparar-audio.py /mnt/e/editor-pro-max/out/releo-tanda/sesion-01 5
python3 cambios-por-sesion.py      # las 44 sesiones: qué audios cambiaron + confirmación
python3 duraciones-palabras.py     # ¿entra la palabra nueva antes del evento siguiente?
```

Resultado del 3-oct-2026: las 44 sesiones tienen la voz de Jessica en las palabras
(versión `2e21c29`, o la del commit que agregó la palabra). Cambiaron las 220
palabras y nada más. Sirve también para confirmar un re-armado: después de
re-armar, la correlación contra la versión actual tiene que dar ~1,0.
