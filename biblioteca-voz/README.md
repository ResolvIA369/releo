# Biblioteca de voz de la Seño Sofía

Producida el 1-oct-2026 para aprovechar créditos de ElevenLabs antes del corte
de ciclo. **La app todavía no la usa**: es material pregrabado para integrar
después sin volver a pagar TTS. Está fuera de `public/` y en `.vercelignore` a
propósito (no sube en el deploy). No pisa nada de `public/audio/sofia/`.

## Qué hay

| Carpeta (`sofia/…`) | Qué es | Voz |
|---|---|---|
| `saludos/ inicio/ cuento_formulas/ guia_lectura/ rutina/ afecto/ tecnico/ consignas/ refuerzo/ errores/ pistas/ transiciones/ finalizacion/ preguntas_generales/ emociones_sofia/ leo/ autonomia/` | Intervenciones cortas de Sofía, muchas variantes por categoría para que no suene repetida | Jessica |
| `palabras/<dominio>/` | ~770 palabras nuevas (no repiten las 220 de `words.ts`) | candB |
| `frases/nivel-1..3/` | Frases progresivas para aprender a leer | Jessica |
| `microhistorias/nivel-1..3/` (+ `preguntas/`) | Microhistorias de 20-60 s y sus preguntas de comprensión | Jessica |
| `cuentos/cuento-NN-*/escena-K.mp3` + `completo.mp3` (+ `preguntas/`) | 28 cuentos originales en escenas y la narración completa unida (`unir-cuentos.py`, sin créditos); textos en `textos/cuentos*.md` | Jessica |
| `vocales/ silabas-directas/` | **Experimental.** REleo es Doman (palabra entera), no silábico: escuchar antes de usar | candB |

Voces y etiquetas, iguales a la app (CLAUDE.md, «Voz de Sofía»): Jessica
`cgSgspJ2msm6clMCkdW9` y candB `JddqVF50ZSIR7SRbJE6u`, modelo `eleven_v3`, MP3
de 192 kbps y 44,1 kHz.

## Archivos

- `cola/*.jsonl`: la fuente. Una línea es un audio, con su texto, voz, etiqueta y nivel.
- `manifest.jsonl`: una fila por cada audio generado (id, categoría, texto, archivo, voice_id, modelo, nivel, caracteres, fecha y estado).
  Ojo: `model` es el modelo que se **pidió** (constante del script), no uno que confirme el servidor.
  `caracteres` es el header `character-cost` de cada respuesta (si faltara, el script anota el largo del texto).
- `MANIFEST.sha256`: hash de cada archivo de la biblioteca (para verificar el respaldo).
- `qa/`: muestra de escucha (`escucha.html`, se arma con `armar-escucha.py`) y `textos-a-revisar.md`.
  Estado: **GENERADO, PENDIENTE DE QA**. Nada de esto se escuchó todavía de punta a punta.
- `errores.jsonl`: lo que falló después de los reintentos.
- `sospechosos.jsonl`: audios cuya duración no cuadra con el texto (`control-duraciones.py`). Hay que escucharlos.
- `consumo.log`: los caracteres acumulados durante la corrida.

## Reanudar o ampliar

```bash
python3 biblioteca-voz/producir.py --hilos 4          # salta lo que ya existe
python3 biblioteca-voz/producir.py --solo 60          # sólo las colas 60-*
python3 biblioteca-voz/control-duraciones.py
python3 biblioteca-voz/unir-cuentos.py              # arma completo.mp3 de cada cuento
```

Para agregar contenido, escribí un `cola/NN-algo.jsonl` nuevo y volvé a correr.

**Ojo con las palabras:** una palabra suelta que también existe en inglés se
puede leer en inglés. Las que tienen `texto_tts` llevan un respelling. Antes
de pasar cualquier palabra a la app, hay que escucharla, igual que se hizo
con las 220 del currículum.
