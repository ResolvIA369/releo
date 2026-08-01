// Optimiza las imágenes de public/ EN EL LUGAR: mismo nombre, misma extensión.
//
// Por qué in-place y no WebP: los personajes e ilustraciones de REleo son
// planos, así que un PNG con paleta de 256 colores pesa MENOS que el WebP
// equivalente (37 KB vs 48 KB medido en Leo/animate.png) y no obliga a tocar
// ninguna referencia del código — varias son dinámicas
// (`/thumbnails/thumbnail-sesion-${id}.png`) y renombrarlas sería frágil.
//
// Uso:
//   node scripts/optimize-assets.mjs --dry    # solo reporta
//   node scripts/optimize-assets.mjs          # escribe
//
// public/ está versionado en git: si algo sale mal, `git checkout -- public`.

import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname, extname } from "path";

const DRY = process.argv.includes("--dry");

// Ancho máximo por carpeta, según el tamaño real al que se muestran.
// Se toma la regla más específica que matchee.
const RULES = [
  { match: "public/icons", skip: true }, // ya son 192/512, son los iconos PWA
  { match: "public/images/palabras", skip: true }, // ya pesan ~10 KB c/u
  { match: "public/images/worlds", width: 1200 },
  { match: "public/thumbnails", width: 600 },
  { match: "public/images/games", width: 800 },
  { match: "public/images/logo", width: 600 },
  { match: "public/og-image.png", width: 1200 }, // el OG se declara 1200x630
  { match: "public/images", width: 800 }, // Leo, Sofía, sofia y sueltos
  { match: "public", width: 800 },
];

function ruleFor(file) {
  return RULES.find((r) => file.startsWith(r.match)) ?? { width: 800 };
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

/** Reencoda respetando el formato original. PNG prueba paleta y sin paleta. */
async function encode(file, width) {
  const pipeline = () => sharp(file).resize({ width, withoutEnlargement: true });
  const isPng = extname(file).toLowerCase() === ".png";

  if (!isPng) {
    return pipeline().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }

  // Paleta (256 colores) suele ganar por mucho en ilustración plana, pero
  // puede bandear en fondos fotográficos: se queda la que pese menos, salvo
  // que la paleta sea sospechosamente chica frente a la versión full-color.
  const [palette, full] = await Promise.all([
    pipeline().png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer(),
    pipeline().png({ compressionLevel: 9, palette: false }).toBuffer(),
  ]);
  return palette.length <= full.length ? palette : full;
}

const files = walk("public");
let before = 0;
let after = 0;
let touched = 0;

for (const file of files) {
  const rule = ruleFor(file);
  const original = statSync(file).size;
  before += original;

  if (rule.skip) {
    after += original;
    continue;
  }

  const meta = await sharp(file).metadata();
  const out = await encode(file, rule.width);

  // No reescribir si no hay ganancia real (evita degradar por nada).
  if (out.length >= original * 0.95) {
    after += original;
    continue;
  }

  after += out.length;
  touched++;
  const pct = (100 - (out.length / original) * 100).toFixed(0);
  console.log(
    `${DRY ? "·" : "✓"} ${file.padEnd(52)} ${meta.width}px→${Math.min(meta.width, rule.width)}px  ` +
      `${(original / 1048576).toFixed(2)}MB → ${(out.length / 1024).toFixed(0)}KB  (-${pct}%)`
  );

  if (!DRY) writeFileSync(file, out);
}

console.log(
  `\n${DRY ? "[dry-run] " : ""}${touched}/${files.length} imágenes · ` +
    `${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB ` +
    `(-${(100 - (after / before) * 100).toFixed(0)}%)`
);
