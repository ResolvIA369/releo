#!/usr/bin/env python3
"""
Genera las 44 miniaturas de YouTube (1280x720) de REleo, una por sesión
del currículum Doman (5 mundos).

Diseño por mundo (fondo degradado izq->der, color de palabra, color de header):
- Mundo 1 (sesiones 1-10,  Isla de las Palabras):     #F5E6C8->#87CEEB | rojo  | amarillo
- Mundo 2 (sesiones 11-20, Bahía del Saber):           #E0F2FE->#1E40AF | rojo  | blanco
- Mundo 3 (sesiones 21-30, Valle de las Letras):       #D1FAE5->#065F46 | negro | amarillo
- Mundo 4 (sesiones 31-40, Montaña del Conocimiento):  #FEF3C7->#7C2D12 | negro | blanco
- Mundo 5 (sesiones 41-44, Libro Mágico):              #EDE9FE->#4C1D95 | violeta | amarillo

Comunes a todas:
- Header (gancho) centrado arriba, con sombra oscura
- Tarjetas flash con las 5 palabras de la sesión (zona central-izquierda)
- Logo REleo (león) arriba-izquierda
- Sofía a la derecha, mirando hacia las tarjetas
- "CLASE N" abajo-derecha, blanco bold con sombra
"""
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ─── Paths ──────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOFIA_PATH = os.path.join(ROOT, "public", "images", "sofia", "sofia-cards.png")
LOGO_PATH = os.path.join(ROOT, "public", "images", "logo", "releo.png")
OUT_DIR = os.path.join(ROOT, "public", "thumbnails")
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# ─── Canvas / colores fijos ─────────────────────────────────────────────
W, H = 1280, 720
WHITE = (255, 255, 255)
DARK_SHADOW = (30, 25, 15)


def hexc(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


# ─── Palabras por sesión (currículum Doman, PHASE1..PHASE5 en orden) ────
SESSIONS = {
    # Mundo 1 — Fase 1
    1: ["mamá", "papá", "bebé", "abuela", "abuelo"],
    2: ["hermano", "hermana", "tío", "tía", "primo"],
    3: ["pez", "pato", "conejo", "ratón", "oso"],
    4: ["perro", "gato", "caballo", "vaca", "pájaro"],
    5: ["manzana", "banana", "uva", "pera", "naranja"],
    6: ["ventana", "cocina", "baño", "piso", "techo"],
    7: ["mano", "pie", "ojo", "nariz", "boca"],
    8: ["oreja", "pelo", "dedo", "brazo", "pierna"],
    9: ["agua", "leche", "pan", "arroz", "huevo"],
    10: ["casa", "mesa", "silla", "cama", "puerta"],
    # Mundo 2 — Fase 2
    11: ["rojo", "azul", "verde", "amarillo", "blanco"],
    12: ["negro", "rosa", "gris", "violeta", "marrón"],
    13: ["grande", "pequeño", "largo", "corto", "alto"],
    14: ["bajo", "gordo", "flaco", "redondo", "cuadrado"],
    15: ["arriba", "abajo", "dentro", "fuera", "cerca"],
    16: ["lejos", "rápido", "lento", "caliente", "frío"],
    17: ["feliz", "triste", "enojado", "asustado", "cansado"],
    18: ["contento", "tranquilo", "sorprendido", "valiente", "amable"],
    19: ["sol", "luna", "estrella", "nube", "lluvia"],
    20: ["árbol", "flor", "río", "mar", "montaña"],
    # Mundo 3 — Fase 3
    21: ["come", "bebe", "duerme", "juega", "corre"],
    22: ["salta", "lee", "escribe", "canta", "baila"],
    23: ["abre", "cierra", "sube", "baja", "toca"],
    24: ["lava", "riega", "limpia", "pinta", "dibuja"],
    25: ["camisa", "pantalón", "zapato", "gorra", "pollera"],
    26: ["media", "vestido", "abrigo", "bufanda", "piyama"],
    27: ["libro", "lápiz", "papel", "tijeras", "pegamento"],
    28: ["mochila", "maestra", "amigo", "clase", "recreo"],
    29: ["parque", "tienda", "escuela", "hospital", "iglesia"],
    30: ["playa", "campo", "ciudad", "calle", "jardín"],
    # Mundo 4 — Fase 4
    31: ["el", "la", "los", "las", "un"],
    32: ["una", "unos", "unas", "y", "con"],
    33: ["en", "de", "por", "para", "sobre"],
    34: ["entre", "hasta", "desde", "sin", "hacia"],
    35: ["yo", "tú", "él", "ella", "nosotros"],
    36: ["mi", "tu", "su", "este", "ese"],
    37: ["hoy", "mañana", "ayer", "ahora", "después"],
    38: ["antes", "siempre", "nunca", "pronto", "tarde"],
    39: ["uno", "dos", "tres", "cuatro", "cinco"],
    40: ["seis", "siete", "ocho", "nueve", "diez"],
    # Mundo 5 — Fase 5
    41: ["quiere", "puede", "sabe", "tiene", "hace"],
    42: ["dice", "viene", "sale", "llega", "busca"],
    43: ["muy", "más", "menos", "bien", "mal"],
    44: ["aquí", "allí", "también", "solo", "junto"],
}

# ─── Header (gancho) por sesión ─────────────────────────────────────────
HEADERS = {
    1: "¿Tu hijo puede leer esto?",
    2: "¿Ya sabe leer estas palabras?",
    3: "¿Las reconoce en 1 segundo?",
    4: "¿Puede leerlas antes que vos?",
    5: "¿Las lee solo o necesita ayuda?",
    6: "¿Cuántas puede leer tu hijo?",
    7: "¿Las lee de corrido?",
    8: "¿Las reconoce a la primera?",
    9: "Mirá qué aprende hoy",
    10: "5 palabras nuevas hoy",
    11: "¿Los colores ya le salen solos?",
    12: "¿Sabe qué significa cada una?",
    13: "¿Las puede leer en voz alta?",
    14: "Nuevas palabras, nuevo nivel",
    15: "¿Cuántas adivina antes de leerlas?",
    16: "¿Ya llegaste al Mundo 2?",
    17: "¿Las lee o las adivina por imagen?",
    18: "Hoy aprende palabras de acción",
    19: "¿Tu hijo está listo para esto?",
    20: "Subiendo de nivel con REleo",
    21: "Palabras más difíciles ¿las lee?",
    22: "¿Llegó al Valle de las Letras?",
    23: "¿Sabe leer palabras largas?",
    24: "El nivel sube ¿tu hijo también?",
    25: "¿Reconoce la ropa escrita?",
    26: "¿Ya lee sin ayuda?",
    27: "Clase avanzada ¿está listo?",
    28: "¿Cuántas palabras nuevas hoy?",
    29: "Palabras de lugares ¿las conoce?",
    30: "¿Tu hijo sorprende a todos?",
    31: "Las palabras más desafiantes",
    32: "¿Lee estas palabras cortitas?",
    33: "Casi en la cima ¿llega?",
    34: "¿Tu hijo ya lee oraciones?",
    35: "El nivel más difícil empieza",
    36: "¿Reconoce estas palabritas?",
    37: "Palabras clave para leer todo",
    38: "¿Cuánto aprendió hasta acá?",
    39: "La Montaña del Conocimiento",
    40: "¿Está listo para el nivel final?",
    41: "El nivel final ¿lo supera?",
    42: "Ya puede leer oraciones completas",
    43: "Del flash a la lectura real",
    44: "El último desafío de REleo",
}

# ─── Configuración de diseño por mundo ──────────────────────────────────
WORLDS = [
    {"sessions": range(1, 11),  "bg": ("#F5E6C8", "#87CEEB"), "word": "#DC2626", "header": "#FBBF24"},
    {"sessions": range(11, 21), "bg": ("#E0F2FE", "#1E40AF"), "word": "#DC2626", "header": "#FFFFFF"},
    {"sessions": range(21, 31), "bg": ("#D1FAE5", "#065F46"), "word": "#1F2937", "header": "#FCD34D"},
    {"sessions": range(31, 41), "bg": ("#FEF3C7", "#7C2D12"), "word": "#1F2937", "header": "#FFFFFF"},
    {"sessions": range(41, 45), "bg": ("#EDE9FE", "#4C1D95"), "word": "#7C3AED", "header": "#FCD34D"},
]


def world_for(sid):
    for w in WORLDS:
        if sid in w["sessions"]:
            return w
    raise ValueError(f"sesión sin mundo: {sid}")


# ─── Helpers de dibujo ──────────────────────────────────────────────────

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def make_gradient(w, h, c_left, c_right):
    """Degradado horizontal izquierda->derecha."""
    base = Image.new("RGB", (w, h))
    px = base.load()
    row = [lerp(c_left, c_right, x / (w - 1)) for x in range(w)]
    for y in range(h):
        for x in range(w):
            px[x, y] = row[x]
    return base.convert("RGBA")


_grad_cache = {}


def get_gradient(c_left, c_right):
    key = (c_left, c_right)
    if key not in _grad_cache:
        _grad_cache[key] = make_gradient(W, H, c_left, c_right)
    return _grad_cache[key].copy()


def load_sofia():
    """Carga a Sofía, recorta el fondo blanco a transparente y la encuadra."""
    img = Image.open(SOFIA_PATH).convert("RGB")
    w, h = img.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(img, seed, (255, 0, 255), thresh=40)
    rgba = img.convert("RGBA")
    newdata = [
        (0, 0, 0, 0) if (r, g, b) == (255, 0, 255) else (r, g, b, 255)
        for (r, g, b, a) in rgba.getdata()
    ]
    rgba.putdata(newdata)
    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    return rgba


def load_logo():
    """Logo REleo (león). Ya viene con fondo transparente; solo se recorta."""
    img = Image.open(LOGO_PATH).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img


_sofia_cache = None
_logo_cache = None


def get_sofia():
    global _sofia_cache
    if _sofia_cache is None:
        _sofia_cache = load_sofia()
    return _sofia_cache


def get_logo():
    global _logo_cache
    if _logo_cache is None:
        _logo_cache = load_logo()
    return _logo_cache


def fit_font(text, max_w, max_h, start=52, min_size=20):
    size = start
    while size > min_size:
        f = ImageFont.truetype(FONT_BOLD, size)
        l, t, r, b = f.getbbox(text)
        if (r - l) <= max_w and (b - t) <= max_h:
            return f
        size -= 2
    return ImageFont.truetype(FONT_BOLD, min_size)


def draw_text_centered(draw, cx, cy, text, font, fill, shadow=None, shadow_off=(3, 3)):
    l, t, r, b = font.getbbox(text)
    tw, th = r - l, b - t
    x = cx - tw / 2 - l
    y = cy - th / 2 - t
    if shadow:
        draw.text((x + shadow_off[0], y + shadow_off[1]), text, font=font, fill=shadow)
    draw.text((x, y), text, font=font, fill=fill)


def make_card(word, card_w, card_h, angle, word_color):
    """Tarjeta flash blanca con sombra suave, palabra coloreada, rotada `angle`°."""
    pad = 34
    tile_w, tile_h = card_w + pad * 2, card_h + pad * 2

    shadow = Image.new("RGBA", (tile_w, tile_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [pad + 4, pad + 9, pad + card_w + 4, pad + card_h + 9],
        radius=16, fill=(0, 0, 0, 95),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))

    card = Image.new("RGBA", (tile_w, tile_h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle(
        [pad, pad, pad + card_w, pad + card_h],
        radius=16, fill=(255, 255, 255, 255), outline=(228, 228, 228, 255), width=2,
    )
    font = fit_font(word, card_w - 30, card_h - 28, start=54)
    draw_text_centered(cd, tile_w / 2, tile_h / 2, word, font, word_color)

    tile = Image.alpha_composite(shadow, card)
    return tile.rotate(angle, expand=True, resample=Image.BICUBIC)


def build_thumbnail(session_id):
    words = SESSIONS[session_id]
    cfg = world_for(session_id)
    bg_left, bg_right = hexc(cfg["bg"][0]), hexc(cfg["bg"][1])
    word_color = hexc(cfg["word"])
    header_color = hexc(cfg["header"])

    canvas = get_gradient(bg_left, bg_right)
    draw = ImageDraw.Draw(canvas)
    rng = random.Random(session_id * 97 + 13)  # rotaciones reproducibles

    # ── Sofía (zona derecha) ────────────────────────────────────────────
    sofia = get_sofia()
    target_h, max_w = 670, 480
    scale = min(target_h / sofia.height, max_w / sofia.width)
    sw, sh = int(sofia.width * scale), int(sofia.height * scale)
    sofia = sofia.resize((sw, sh), Image.LANCZOS)
    sx, sy = W - sw - 6, (H - sh) // 2
    canvas.alpha_composite(sofia, (sx, sy))

    # ── Logo REleo (arriba-izquierda) ───────────────────────────────────
    logo = get_logo()
    logo_h = 128
    lscale = logo_h / logo.height
    lw, lh = int(logo.width * lscale), int(logo.height * lscale)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    logo_x, logo_y = 16, 6
    canvas.alpha_composite(logo, (logo_x, logo_y))

    # ── Header (gancho de la sesión) ────────────────────────────────────
    header = HEADERS[session_id]
    head_left = logo_x + lw + 26
    head_right = W - 26
    head_cx = (head_left + head_right) / 2
    hfont = fit_font(header, head_right - head_left, 92, start=62)
    draw_text_centered(draw, head_cx, logo_y + lh / 2, header, hfont, header_color,
                       shadow=DARK_SHADOW, shadow_off=(3, 3))

    # ── Tarjetas flash (zona central-izquierda) ─────────────────────────
    card_w, card_h = 235, 108
    gap_x, gap_y = 20, 30
    cluster_cx, cluster_cy = 410, 388

    row_top = [words[0], words[1], words[2]]
    row_bot = [words[3], words[4]]
    top_total = len(row_top) * card_w + (len(row_top) - 1) * gap_x
    bot_total = len(row_bot) * card_w + (len(row_bot) - 1) * gap_x
    total_h = card_h * 2 + gap_y

    top_y = cluster_cy - total_h / 2 + card_h / 2
    bot_y = top_y + card_h + gap_y

    def place_row(row, total_w, center_y):
        start_x = cluster_cx - total_w / 2 + card_w / 2
        for i, word in enumerate(row):
            cx = start_x + i * (card_w + gap_x)
            angle = rng.uniform(-3, 3)
            tile = make_card(word, card_w, card_h, angle, word_color)
            px = int(cx - tile.width / 2)
            py = int(center_y - tile.height / 2)
            canvas.alpha_composite(tile, (px, py))

    place_row(row_top, top_total, top_y)
    place_row(row_bot, bot_total, bot_y)

    # ── CLASE N (abajo-derecha) ─────────────────────────────────────────
    clase_font = ImageFont.truetype(FONT_BOLD, 42)
    clase_text = f"CLASE {session_id}"
    l, t, r, b = clase_font.getbbox(clase_text)
    cxr = W - 28 - (r - l)
    cyr = H - 28 - (b - t)
    draw.text((cxr + 3, cyr + 3), clase_text, font=clase_font, fill=DARK_SHADOW)
    draw.text((cxr, cyr), clase_text, font=clase_font, fill=WHITE)

    out = os.path.join(OUT_DIR, f"thumbnail-sesion-{session_id:02d}.png")
    canvas.convert("RGB").save(out, "PNG")
    return out


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for sid in sorted(SESSIONS):
        path = build_thumbnail(sid)
        print(f"OK  sesión {sid:>2}: {os.path.basename(path)}  -> {', '.join(SESSIONS[sid])}")


if __name__ == "__main__":
    main()
