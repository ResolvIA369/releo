# Carpeta de videos

Coloca aquí los videos que la app reproduce al final de cada pasada
de la fase "Repetir" en el juego Flash de Palabras.

## Archivos esperados

| Nombre del archivo            | Cuándo se reproduce                                              |
|-------------------------------|------------------------------------------------------------------|
| `leo-celebration.mp4`         | Cuando el niño tuvo **más de 2 aciertos** en la pasada (3 o más).|
| `leo-motivation.mp4`          | Cuando el niño tuvo **0, 1 o 2 aciertos** en la pasada.          |

## Recomendaciones técnicas

- **Formato**: `.mp4` con codec H.264 + AAC (compatibilidad universal).
- **Duración sugerida**: 5–10 segundos. Más largo se vuelve repetitivo.
- **Resolución**: 1280x720 o 720x720 cuadrado. La app lo escala
  a `min(85vw, 720px)` de ancho × `min(70vh, 540px)` de alto.
- **Tamaño máximo recomendado**: < 2 MB cada uno (para que carguen
  rápido en mobile). Comprimí con HandBrake si es muy pesado.
- **Audio**: incluir audio de Leo / la Seño Sofía hablando, no
  necesita música de fondo (la app no muta el video).

## Comportamiento si los videos no existen

Si no encontrás los archivos o todavía no los grabaste, la app
muestra el botón "Continuar →" y al fallar la carga del video se
salta automáticamente a la siguiente fase. No bloquea el juego.
