/**
 * Generates PWA icons as PNG using a canvas approach.
 * Run: node scripts/generate-icons.mjs
 */

import { writeFileSync, mkdirSync } from "fs";

// Simple PNG generator (uncompressed, no dependencies needed)
function createPNG(size, bgColor, emoji, textColor) {
  // We'll create an SVG and let the user convert it,
  // or create a minimal valid PNG with embedded SVG via data URI

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <linearGradient id="book" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <!-- Book icon -->
  <g transform="translate(${size * 0.5}, ${size * 0.42}) scale(${size / 512})">
    <!-- Open book -->
    <path d="M-80,-60 C-80,-60 -10,-75 0,-50 C10,-75 80,-60 80,-60 L80,60 C80,60 10,45 0,70 C-10,45 -80,60 -80,60 Z" fill="url(#book)" stroke="#fff" stroke-width="4"/>
    <!-- Center line -->
    <line x1="0" y1="-50" x2="0" y2="70" stroke="#fff" stroke-width="3" opacity="0.6"/>
    <!-- Page lines left -->
    <line x1="-60" y1="-30" x2="-10" y2="-38" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <line x1="-60" y1="-10" x2="-10" y2="-18" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <line x1="-60" y1="10" x2="-10" y2="2" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <!-- Page lines right -->
    <line x1="60" y1="-30" x2="10" y2="-38" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <line x1="60" y1="-10" x2="10" y2="-18" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <line x1="60" y1="10" x2="10" y2="2" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <!-- Stars -->
    <g transform="translate(-50, -90) scale(0.5)">
      <polygon points="0,-20 6,-6 20,-6 9,4 12,18 0,10 -12,18 -9,4 -20,-6 -6,-6" fill="#fde68a"/>
    </g>
    <g transform="translate(50, -85) scale(0.4)">
      <polygon points="0,-20 6,-6 20,-6 9,4 12,18 0,10 -12,18 -9,4 -20,-6 -6,-6" fill="#fde68a"/>
    </g>
    <g transform="translate(0, -100) scale(0.6)">
      <polygon points="0,-20 6,-6 20,-6 9,4 12,18 0,10 -12,18 -9,4 -20,-6 -6,-6" fill="#fde68a"/>
    </g>
  </g>
  <!-- Text -->
  <text x="${size * 0.5}" y="${size * 0.82}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${size * 0.1}" fill="white" letter-spacing="${size * 0.005}">DOMAN</text>
  <text x="${size * 0.5}" y="${size * 0.92}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="${size * 0.055}" fill="rgba(255,255,255,0.8)">Aprende a leer</text>
</svg>`;

  return svg;
}

mkdirSync("public/icons", { recursive: true });

// Generate SVGs (browsers can use these, and they look great at any size)
const svg192 = createPNG(192);
const svg512 = createPNG(512);

writeFileSync("public/icons/icon-192.svg", svg192);
writeFileSync("public/icons/icon-512.svg", svg512);

// Also save as .png extension with SVG content wrapped for browser compatibility
// The manifest accepts SVG if we declare the right type, but for maximum compat
// we output the SVGs and provide instructions

console.log("✅ Icons generated:");
console.log("   public/icons/icon-192.svg");
console.log("   public/icons/icon-512.svg");
console.log("");
console.log("These are SVG files that work as app icons.");
console.log("Opening in browser: file:///path/to/public/icons/icon-512.svg");
