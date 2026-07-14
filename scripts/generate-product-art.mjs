/**
 * Generates the product artwork in client/public/products/ from the catalog.
 * Original, cohesive packshot-style illustrations (800x800 SVG) so every
 * product looks professional before real photos are added.
 *
 * Re-run after editing the catalog:  node scripts/generate-product-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import CATALOG from '../server/src/seed/catalog.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'public', 'products');
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hsl = (h, s, l, a = 1) => (a === 1 ? `hsl(${h} ${s}% ${l}%)` : `hsl(${h} ${s}% ${l}% / ${a})`);

/** Split a long product name into 1-3 short label lines. */
const labelLines = (name, max = 14) => {
  const words = name.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
    else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === 2) break;
    }
  }
  if (cur && lines.length < 3) lines.push(cur);
  return lines.slice(0, 3);
};

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'Segoe UI',Arial,Helvetica,sans-serif";

/* ---------- shared pieces ---------- */

const defs = (h) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${hsl(h, 40, 96)}"/>
      <stop offset="1" stop-color="${hsl(h, 34, 88)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="white" stop-opacity="0.85"/>
      <stop offset="1" stop-color="white" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${hsl(h, 42, 80)}"/>
      <stop offset="0.5" stop-color="${hsl(h, 48, 66)}"/>
      <stop offset="1" stop-color="${hsl(h, 44, 54)}"/>
    </linearGradient>
    <linearGradient id="bodyDeep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${hsl(h, 40, 46)}"/>
      <stop offset="1" stop-color="${hsl(h, 42, 30)}"/>
    </linearGradient>
    <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${hsl(h, 28, 34)}"/>
      <stop offset="1" stop-color="${hsl(h, 30, 20)}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9dfca"/><stop offset="0.5" stop-color="#c9b489"/><stop offset="1" stop-color="#a68a55"/>
    </linearGradient>
    <radialGradient id="pan" cx="0.35" cy="0.3" r="0.9">
      <stop offset="0" stop-color="${hsl(h, 60, 84)}"/>
      <stop offset="0.6" stop-color="${hsl(h, 55, 68)}"/>
      <stop offset="1" stop-color="${hsl(h, 50, 56)}"/>
    </radialGradient>
  </defs>`;

const scene = (h) => `
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#glow)"/>
  <circle cx="400" cy="430" r="252" fill="none" stroke="${hsl(h, 30, 55, 0.28)}" stroke-width="1.6"/>
  <circle cx="633" cy="222" r="4" fill="${hsl(h, 45, 55, 0.5)}"/>
  <circle cx="163" cy="286" r="3" fill="${hsl(h, 45, 55, 0.45)}"/>
  <circle cx="192" cy="596" r="4" fill="${hsl(h, 45, 55, 0.4)}"/>
  <ellipse cx="400" cy="648" rx="196" ry="26" fill="${hsl(h, 30, 30, 0.16)}"/>`;

const brandmark = (brand, h) => `
  <text x="400" y="98" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="34" fill="${hsl(h, 25, 26, 0.85)}">${esc(brand)}</text>
  <rect x="356" y="116" width="88" height="2" rx="1" fill="${hsl(h, 30, 40, 0.4)}"/>`;

const sizeTag = (size, h) => `
  <text x="400" y="742" text-anchor="middle" font-family="${SANS}" font-size="21" letter-spacing="4" fill="${hsl(h, 20, 34, 0.75)}">${esc(size.toUpperCase())}</text>`;

/** White label panel with brand + product lines, centered at (cx, cy). */
const label = (p, cx, cy, w, small = false) => {
  const lines = labelLines(p.name, small ? 12 : 14);
  const fs = small ? 21 : 24;
  const lh = fs + 6;
  const bh = 58 + lines.length * lh;
  const y0 = cy - bh / 2;
  let t = `<rect x="${cx - w / 2}" y="${y0}" width="${w}" height="${bh}" rx="10" fill="#fffdfb" opacity="0.96"/>
  <rect x="${cx - w / 2}" y="${y0}" width="${w}" height="${bh}" rx="10" fill="none" stroke="${hsl(p.hue, 20, 60, 0.5)}"/>
  <text x="${cx}" y="${y0 + 30}" text-anchor="middle" font-family="${SANS}" font-size="13" letter-spacing="3" fill="${hsl(p.hue, 30, 34)}">${esc(p.brand.toUpperCase())}</text>
  <rect x="${cx - 22}" y="${y0 + 40}" width="44" height="1.5" fill="${hsl(p.hue, 30, 50, 0.6)}"/>`;
  lines.forEach((ln, i) => {
    t += `<text x="${cx}" y="${y0 + 66 + i * lh}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="${fs}" fill="#33222b">${esc(ln)}</text>`;
  });
  return t;
};

/** Caption under small products (dropper, lipstick, compact). */
const caption = (p) => {
  const lines = labelLines(p.name, 22);
  let t = `<text x="400" y="678" text-anchor="middle" font-family="${SANS}" font-size="14" letter-spacing="3.5" fill="${hsl(p.hue, 30, 32)}">${esc(p.brand.toUpperCase())}</text>`;
  lines.slice(0, 2).forEach((ln, i) => {
    t += `<text x="400" y="${706 + i * 27}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="23" fill="#33222b">${esc(ln)}</text>`;
  });
  return t;
};

const shine = (x, y, w, h, r = 10, o = 0.5) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="white" opacity="${o}"/>`;

/* ---------- vessel shapes ---------- */

const vessels = {
  tube: (p) => `
    <rect x="322" y="556" width="156" height="62" rx="16" fill="url(#cap)"/>
    <path d="M340 244 L460 244 L472 556 L328 556 Z" fill="url(#body)"/>
    <rect x="334" y="220" width="132" height="28" rx="9" fill="url(#body)"/>
    <rect x="334" y="232" width="132" height="4" fill="${hsl(p.hue, 30, 40, 0.35)}"/>
    ${shine(346, 262, 16, 270, 8, 0.45)}
    ${label(p, 400, 415, 196)}`,

  jar: (p) => `
    <rect x="272" y="352" width="256" height="74" rx="18" fill="url(#cap)"/>
    <ellipse cx="400" cy="356" rx="122" ry="12" fill="${hsl(p.hue, 25, 45, 0.6)}"/>
    <rect x="282" y="424" width="236" height="196" rx="22" fill="url(#body)"/>
    ${shine(298, 440, 18, 158, 9, 0.4)}
    ${label(p, 400, 522, 200)}`,

  bottle: (p) => `
    <rect x="352" y="232" width="96" height="58" rx="10" fill="url(#cap)"/>
    <path d="M330 322 Q330 292 360 290 L440 290 Q470 292 470 322 L470 592 Q470 620 442 620 L358 620 Q330 620 330 592 Z" fill="url(#body)"/>
    ${shine(344, 320, 16, 250, 8, 0.42)}
    ${label(p, 400, 470, 176)}`,

  pump: (p) => `
    <rect x="436" y="252" width="26" height="52" rx="8" fill="url(#cap)"/>
    <rect x="352" y="248" width="104" height="34" rx="10" fill="url(#cap)"/>
    <rect x="378" y="282" width="44" height="58" fill="url(#cap)"/>
    <path d="M318 372 Q318 340 352 340 L448 340 Q482 340 482 372 L482 590 Q482 620 452 620 L348 620 Q318 620 318 590 Z" fill="url(#body)"/>
    ${shine(332, 368, 16, 210, 8, 0.42)}
    ${label(p, 400, 490, 190)}`,

  dropper: (p) => `
    <rect x="372" y="308" width="56" height="44" rx="16" fill="#2c2228"/>
    <rect x="380" y="348" width="40" height="56" rx="6" fill="url(#cap)"/>
    <path d="M338 436 Q338 404 372 404 L428 404 Q462 404 462 436 L462 592 Q462 620 434 620 L366 620 Q338 620 338 592 Z" fill="url(#bodyDeep)"/>
    <rect x="396" y="410" width="8" height="180" rx="4" fill="${hsl(p.hue, 30, 78, 0.55)}"/>
    ${shine(350, 432, 13, 156, 6, 0.32)}
    ${caption(p)}`,

  spray: (p) => `
    <rect x="346" y="238" width="108" height="86" rx="14" fill="${hsl(p.hue, 20, 88, 0.85)}" stroke="${hsl(p.hue, 20, 60, 0.5)}"/>
    <rect x="382" y="256" width="36" height="30" rx="6" fill="url(#cap)"/>
    <path d="M328 356 Q328 324 362 324 L438 324 Q472 324 472 356 L472 592 Q472 620 444 620 L356 620 Q328 620 328 592 Z" fill="url(#body)"/>
    ${shine(342, 352, 15, 230, 7, 0.42)}
    ${label(p, 400, 480, 176)}`,

  compact: (p) => `
    <circle cx="400" cy="452" r="172" fill="url(#cap)"/>
    <circle cx="400" cy="452" r="150" fill="url(#pan)"/>
    <path d="M285 372 A150 150 0 0 1 512 415" fill="none" stroke="white" stroke-opacity="0.5" stroke-width="14" stroke-linecap="round"/>
    <circle cx="400" cy="452" r="150" fill="none" stroke="${hsl(p.hue, 25, 35, 0.4)}" stroke-width="2"/>
    <rect x="382" y="614" width="36" height="14" rx="7" fill="url(#metal)"/>
    ${caption(p)}`,

  lipstick: (p) => `
    <path d="M372 328 L428 328 L428 388 L372 372 Z" fill="${hsl(p.hue, 62, 46)}"/>
    <path d="M372 328 L392 328 L392 377 L372 372 Z" fill="white" opacity="0.28"/>
    <rect x="364" y="388" width="72" height="34" fill="url(#metal)"/>
    <rect x="352" y="422" width="96" height="198" rx="12" fill="url(#cap)"/>
    ${shine(364, 434, 12, 160, 6, 0.25)}
    ${caption(p)}`,

  rollon: (p) => `
    <path d="M326 400 Q326 322 400 322 Q474 322 474 400 L474 400 L326 400 Z" fill="url(#cap)"/>
    <path d="M326 400 Q326 372 356 372 L444 372 Q474 372 474 400 L474 590 Q474 620 444 620 L356 620 Q326 620 326 590 Z" fill="url(#body)"/>
    ${shine(340, 400, 15, 190, 7, 0.42)}
    ${label(p, 400, 508, 184)}`,
};

/* ---------- build ---------- */

let n = 0;
for (const p of CATALOG) {
  const draw = vessels[p.form] || vessels.bottle;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${esc(p.brand)} ${esc(p.name)}">
${defs(p.hue)}
${scene(p.hue)}
${brandmark(p.brand, p.hue)}
${draw(p)}
${sizeTag(p.size, p.hue)}
</svg>`;
  writeFileSync(join(OUT, `${p.slug}.svg`), svg);
  n++;
}
console.log(`Generated ${n} product artworks in client/public/products/`);
