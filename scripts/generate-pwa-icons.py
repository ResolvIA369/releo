#!/usr/bin/env python3
"""
Generate PWA icons (192x192, 512x512) from the REleo logo.

For maskable purpose, the icon needs a safe zone — important content
should fit inside the inner 80% of the canvas. We add a colored
background that fills the full square so the masked shape always
shows the brand color.
"""

from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "public", "images", "logo", "releo.png")
ICON_DIR = os.path.join(ROOT, "public", "icons")

# Background color matches the manifest theme (light cream that
# complements the green ring of the logo). Pure white or theme
# purple also work; cream feels warm and child-friendly.
BG_COLOR = (255, 251, 235, 255)  # warm cream (#FFFBEB)

SIZES = [192, 512]


def crop_to_content(img: Image.Image) -> Image.Image:
    """Crop to the bounding box of non-transparent pixels."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def make_square_icon(src_img: Image.Image, size: int) -> Image.Image:
    """Center-fit the source onto a square canvas with a safe margin."""
    canvas = Image.new("RGBA", (size, size), BG_COLOR)

    # First crop to actual content (remove transparent margins)
    src = crop_to_content(src_img.copy())

    # If wider than tall, crop the central square portion
    w, h = src.size
    if w > h:
        # Crop to square centered horizontally
        offset = (w - h) // 2
        src = src.crop((offset, 0, offset + h, h))
    elif h > w:
        offset = (h - w) // 2
        src = src.crop((0, offset, w, offset + w))

    # Maskable safe zone: keep important content inside ~92% of canvas
    safe = int(size * 0.92)

    # Scale to safe zone
    src.thumbnail((safe, safe), Image.LANCZOS)

    # Center it
    x = (size - src.width) // 2
    y = (size - src.height) // 2
    canvas.paste(src, (x, y), src if src.mode == "RGBA" else None)

    return canvas


def main():
    if not os.path.exists(SOURCE):
        raise SystemExit(f"Source logo not found: {SOURCE}")

    src = Image.open(SOURCE).convert("RGBA")
    print(f"Source: {SOURCE} ({src.width}x{src.height})")

    for size in SIZES:
        icon = make_square_icon(src, size)
        out = os.path.join(ICON_DIR, f"icon-{size}.png")
        icon.save(out, "PNG", optimize=True)
        print(f"  ✓ {out} ({size}x{size})")

    print("\nDone! New PWA icons generated.")
    print("Note: users with the app already installed need to reinstall")
    print("or wait for the OS to refresh the icon cache.")


if __name__ == "__main__":
    main()
