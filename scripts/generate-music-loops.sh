#!/usr/bin/env bash
# Genera los 3 loops de Leo Vuela desde el tema fuente de assets/.
# atempo cambia la velocidad SIN cambiar el tono. Nivel 1: lento,
# filtrado y mas bajo; Nivel 2: el tema tal cual (-1.4dB); Nivel 3:
# rapido y a volumen pleno.
#
# Requiere ffmpeg en el PATH, o: npm i -D ffmpeg-static
set -euo pipefail
cd "$(dirname "$0")/.."

FF="${FFMPEG:-$(node -e 'console.log(require("ffmpeg-static"))' 2>/dev/null || echo ffmpeg)}"
SRC="assets/Mystic Forest Path.mp3"
OUT="public/audio/music"
mkdir -p "$OUT"

"$FF" -y -hide_banner -loglevel error -i "$SRC" \
  -filter:a "atempo=0.85,lowpass=f=2000,volume=0.65" \
  -c:a libmp3lame -q:a 5 "$OUT/leo-vuela-nivel-1.mp3"

"$FF" -y -hide_banner -loglevel error -i "$SRC" \
  -filter:a "volume=0.85" \
  -c:a libmp3lame -q:a 5 "$OUT/leo-vuela-nivel-2.mp3"

"$FF" -y -hide_banner -loglevel error -i "$SRC" \
  -filter:a "atempo=1.18" \
  -c:a libmp3lame -q:a 5 "$OUT/leo-vuela-nivel-3.mp3"

echo "Loops generados en $OUT/"
