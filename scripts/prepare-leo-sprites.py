#!/usr/bin/env python3
"""Prepara los sprites de Leo para los juegos arcade.

Toma las imagenes -removebg-preview de public/images/Leo/, recorta el
lienzo al contenido real (alfa) y remueve la sombra elipse "horneada"
del fondo cuando quedo como un bloque separado del cuerpo (los juegos
ya dibujan su propia sombra). Salida en public/images/games/.
"""

from PIL import Image
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "public/images/Leo")
OUT = os.path.join(ROOT, "public/images/games")

# wipe_gray_bottom: borra la sombra gris clara pegada a las patas
# (cuando no quedo separada por filas transparentes)
SPRITES = {
    "Leo_corre-removebg-preview.png": ("leo-corre-sprite.png", False),
    "Leo_Salta-removebg-preview.png": ("leo-salta-sprite.png", True),
    "Leo_vuela-removebg-preview.png": ("leo-vuela-sprite.png", False),
}

ALPHA_MIN = 16  # ruido de borde del removebg
GAP_ROWS = 6  # filas vacias que separan cuerpo de sombra
SHADOW_MAX_FRACTION = 0.18  # la sombra es un bloque chico al pie


def content_rows(im: Image.Image) -> list[bool]:
    a = im.getchannel("A")
    w, h = im.size
    px = a.load()
    return [any(px[x, y] > ALPHA_MIN for x in range(w)) for y in range(h)]


def drop_detached_shadow(im: Image.Image) -> Image.Image:
    rows = content_rows(im)
    h = len(rows)
    bottom = max(i for i, r in enumerate(rows) if r)
    # Subir desde abajo: fin del bloque inferior y el hueco que lo separa
    block_top = bottom
    while block_top > 0 and rows[block_top - 1]:
        block_top -= 1
    gap = 0
    cursor = block_top - 1
    while cursor >= 0 and not rows[cursor]:
        gap += 1
        cursor -= 1
    block_h = bottom - block_top + 1
    if gap >= GAP_ROWS and block_h <= h * SHADOW_MAX_FRACTION and cursor >= 0:
        print(f"  sombra horneada removida: filas {block_top}-{bottom} (gap {gap})")
        return im.crop((0, 0, im.width, block_top))
    return im


def wipe_gray_bottom(im: Image.Image) -> Image.Image:
    """Borra pixeles gris claro (la sombra) en la franja inferior;
    las patas son naranjas/marrones asi que no las toca."""
    px = im.load()
    w, h = im.size
    wiped = 0
    for y in range(int(h * 0.85), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r > 170 and max(r, g, b) - min(r, g, b) < 20:
                px[x, y] = (0, 0, 0, 0)
                wiped += 1
    print(f"  sombra al pie borrada: {wiped} px")
    return im


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for src_name, (out_name, wipe) in SPRITES.items():
        path = os.path.join(SRC, src_name)
        im = Image.open(path).convert("RGBA")
        print(f"{src_name} {im.size}")
        im = drop_detached_shadow(im)
        if wipe:
            im = wipe_gray_bottom(im)
        bbox = im.getbbox()
        im = im.crop(bbox)
        out_path = os.path.join(OUT, out_name)
        im.save(out_path)
        print(f"  -> {out_name} {im.size}")


if __name__ == "__main__":
    main()
