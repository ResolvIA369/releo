#!/usr/bin/env python3
"""
Banner de YouTube 2560x1440 para el canal REleo (v4).

AJUSTE CRÍTICO: TODO el contenido importante (logo + texto + Sofía) debe
quedar dentro de la ZONA SEGURA central 1546x423 (x 507..2053, y 508..931),
que es lo único visible en todos los dispositivos.

Layout dentro de la zona segura: logo (izq) · texto (centro) · Sofía (der),
todo verticalmente centrado.

Guías de desarrollo: poné BANNER_GUIDES=/ruta.png al correr el script para
generar además una versión con la zona segura y las cajas dibujadas. El PNG
final (banner-youtube.png) SIEMPRE se guarda sin guías.
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOFIA_PATH = os.path.join(ROOT, "public", "images", "sofia", "sofia-cards.png")
# logo_Releo.png no existe; usamos el logo del león canónico (ya transparente).
LOGO_PATH = os.path.join(ROOT, "public", "images", "logo", "releo.png")
OUT = os.path.join(ROOT, "public", "thumbnails", "banner-youtube.png")
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Lienzo
W, H = 2560, 1440
# Zona segura central 1546x423
SAFE_W, SAFE_H = 1546, 423
SAFE_X = (W - SAFE_W) // 2          # 507
SAFE_Y = (H - SAFE_H) // 2          # 508
SAFE_R = SAFE_X + SAFE_W            # 2053
SAFE_B = SAFE_Y + SAFE_H            # 931
YC = (SAFE_Y + SAFE_B) / 2          # 719.5

# Colores
ARENA = (245, 230, 200)   # #F5E6C8
CELESTE = (135, 206, 235)  # #87CEEB
TEXT = (31, 41, 55)       # #1F2937

# Sizing (todo confinado a la zona segura)
PAD = 30                  # margen interno desde los bordes de la zona segura
LOGO_H = 330
SOFIA_H_MAX = 380
SOFIA_W_MAX = 345         # cap de ancho: las tarjetas en abanico la ensanchan
GAP = 45
MAIN_PX = 130             # objetivo; se reduce para entrar en 2 líneas
SUB_PX = 65


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def make_gradient(w, h, c_left, c_right):
    row = Image.new("RGB", (w, 1))
    px = row.load()
    for x in range(w):
        px[x, 0] = lerp(c_left, c_right, x / (w - 1))
    return row.resize((w, h)).convert("RGBA")


def _alpha_from_floodfill(img_rgb, thresh):
    w, h = img_rgb.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(img_rgb, seed, (255, 0, 255), thresh=thresh)
    rgba = img_rgb.convert("RGBA")
    rgba.putdata([
        (0, 0, 0, 0) if (r, g, b) == (255, 0, 255) else (r, g, b, 255)
        for (r, g, b, a) in rgba.getdata()
    ])
    return rgba


def load_sofia():
    rgba = _alpha_from_floodfill(Image.open(SOFIA_PATH).convert("RGB"), 40)
    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def load_logo():
    """Logo del león. Si viene opaco con fondo oscuro, lo hace transparente."""
    img = Image.open(LOGO_PATH).convert("RGBA")
    if img.split()[3].getextrema()[0] == 255:        # totalmente opaco
        rgb = img.convert("RGB")
        w, h = rgb.size
        corners = [rgb.getpixel(p) for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
        dark = all(sum(c) / 3 < 60 for c in corners)
        img = _alpha_from_floodfill(rgb, 70 if dark else 40)
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def line_w(font, text):
    l, _, r, _ = font.getbbox(text)
    return r - l


def wrap(text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = f"{cur} {w}".strip()
        if line_w(font, test) <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_block(text, start_px, region_w, max_lines):
    px = start_px
    while px > 20:
        f = ImageFont.truetype(FONT_BOLD, px)
        lines = wrap(text, f, region_w)
        if len(lines) <= max_lines:
            return f, lines, px
        px -= 2
    f = ImageFont.truetype(FONT_BOLD, 20)
    return f, wrap(text, f, region_w), 20


# Imágenes cacheadas (el floodfill es lo caro)
_sofia = _logo = None


def build_banner(draw_guides=False):
    global _sofia, _logo
    canvas = make_gradient(W, H, ARENA, CELESTE)

    # ── Logo: izquierda de la zona segura, centrado vertical ────────────
    if _logo is None:
        _logo = load_logo()
    l_scale = LOGO_H / _logo.height
    lw, lh = int(_logo.width * l_scale), int(_logo.height * l_scale)
    logo = _logo.resize((lw, lh), Image.LANCZOS)
    logo_x = SAFE_X + PAD
    logo_y = int(YC - lh / 2)
    canvas.alpha_composite(logo, (logo_x, logo_y))
    logo_right = logo_x + lw

    # ── Sofía: derecha de la zona segura, <=380 alto y cap de ancho ─────
    if _sofia is None:
        _sofia = load_sofia()
    s_scale = min(SOFIA_H_MAX / _sofia.height, SOFIA_W_MAX / _sofia.width)
    sw, sh = int(_sofia.width * s_scale), int(_sofia.height * s_scale)
    sofia = _sofia.resize((sw, sh), Image.LANCZOS)
    sofia_x = SAFE_R - PAD - sw          # pegada al borde derecho de la zona segura
    sofia_y = int(YC - sh / 2)           # centrada vertical dentro de la zona segura
    canvas.alpha_composite(sofia, (sofia_x, sofia_y))

    # ── Texto: centro, entre logo y Sofía ───────────────────────────────
    text_left = logo_right + GAP
    text_right = sofia_x - GAP
    region_w = text_right - text_left
    cx = (text_left + text_right) / 2

    main_font, main_lines, main_px = fit_block("Aprendé a leer con la Seño Sofía", MAIN_PX, region_w, 2)
    sub_font, sub_lines, sub_px = fit_block("Lectura temprana en español · Nuevas clases cada semana", SUB_PX, region_w, 2)

    main_lh = int(main_px * 1.08)
    sub_lh = int(sub_px * 1.18)
    gap = int(main_px * 0.42)
    block_h = main_lh * len(main_lines) + gap + sub_lh * len(sub_lines)
    y0 = YC - block_h / 2

    def stack(draw, font, lines, lh, start_y, fill):
        yy = start_y
        for ln in lines:
            l = font.getbbox(ln)[0]
            draw.text((cx - line_w(font, ln) / 2 - l, yy), ln, font=font, fill=fill)
            yy += lh
        return yy

    # Sombra blanca suave (glow)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    yend = stack(gd, main_font, main_lines, main_lh, y0, (255, 255, 255, 235))
    stack(gd, sub_font, sub_lines, sub_lh, yend + gap, (255, 255, 255, 235))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(7)))

    # Texto oscuro encima
    draw = ImageDraw.Draw(canvas)
    yend = stack(draw, main_font, main_lines, main_lh, y0, TEXT)
    stack(draw, sub_font, sub_lines, sub_lh, yend + gap, TEXT)

    info = {
        "logo": (logo_x, logo_y, lw, lh),
        "sofia": (sofia_x, sofia_y, sw, sh),
        "text_region": (int(text_left), int(text_right), int(region_w)),
        "main_px": main_px, "main_lines": main_lines,
        "sub_px": sub_px, "sub_lines": sub_lines,
        "block_y": (int(y0), int(y0 + block_h)),
        "cx": int(cx),
    }

    # ── Guías de desarrollo (solo si se piden) ──────────────────────────
    if draw_guides:
        g = ImageDraw.Draw(canvas)
        g.rectangle([SAFE_X, SAFE_Y, SAFE_R, SAFE_B], outline=(220, 38, 38), width=4)
        g.rectangle([logo_x, logo_y, logo_x + lw, logo_y + lh], outline=(37, 99, 235), width=3)
        g.rectangle([sofia_x, sofia_y, sofia_x + sw, sofia_y + sh], outline=(22, 163, 74), width=3)
        g.rectangle([int(text_left), info["block_y"][0], int(text_right), info["block_y"][1]],
                    outline=(202, 138, 4), width=3)
        g.line([(W // 2, SAFE_Y), (W // 2, SAFE_B)], fill=(120, 120, 120), width=1)

    return canvas, info


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    # PNG final: SIN guías
    final, info = build_banner(draw_guides=False)
    final.convert("RGB").save(OUT, "PNG")
    print(f"OK  {os.path.relpath(OUT, ROOT)}  ({W}x{H})  — sin guías")
    print(f"    zona segura: {SAFE_W}x{SAFE_H}  x[{SAFE_X}..{SAFE_R}] y[{SAFE_Y}..{SAFE_B}]")
    print(f"    logo:  x[{info['logo'][0]}..{info['logo'][0]+info['logo'][2]}] y[{info['logo'][1]}..{info['logo'][1]+info['logo'][3]}]  ({info['logo'][2]}x{info['logo'][3]})")
    print(f"    Sofía: x[{info['sofia'][0]}..{info['sofia'][0]+info['sofia'][2]}] y[{info['sofia'][1]}..{info['sofia'][1]+info['sofia'][3]}]  ({info['sofia'][2]}x{info['sofia'][3]})")
    print(f"    texto: region x[{info['text_region'][0]}..{info['text_region'][1]}] ({info['text_region'][2]}px)  y[{info['block_y'][0]}..{info['block_y'][1]}]")
    print(f"           main={info['main_px']}px {info['main_lines']}  sub={info['sub_px']}px {info['sub_lines']}")

    # Versión con guías (opcional, para desarrollo)
    guides_path = os.environ.get("BANNER_GUIDES")
    if guides_path:
        g, _ = build_banner(draw_guides=True)
        g.convert("RGB").save(guides_path, "PNG")
        print(f"    [guías] {guides_path}")


if __name__ == "__main__":
    main()
