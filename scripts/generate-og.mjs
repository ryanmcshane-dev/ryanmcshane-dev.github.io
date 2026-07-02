// Generates the 1200x630 Open Graph share image (public/og-image.png) from an
// inline SVG. Run with: npm run generate:og. Re-run if the name/title/theme change.
import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const name = esc('Ryan McShane');
const role = esc('Senior Software Engineer & Tech Lead');
const positioning = esc('Spec-driven development · Agentic coding · Event-driven platforms');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#0f1729"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="16%" r="55%">
      <stop offset="0" stop-color="#2dd4bf" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#0d9488"/>

  <text x="80" y="150" font-family="'Segoe UI', Arial, sans-serif" font-size="30"
        fill="#2dd4bf" letter-spacing="2" font-weight="600">&gt;_ ryanmcshane.github.io</text>

  <text x="78" y="320" font-family="'Segoe UI', Arial, sans-serif" font-size="104"
        fill="#f6f7fa" font-weight="700" letter-spacing="-3">${name}</text>

  <text x="80" y="400" font-family="'Segoe UI', Arial, sans-serif" font-size="46"
        fill="#9aa3b2" font-weight="500">${role}</text>

  <text x="80" y="500" font-family="'Segoe UI', Arial, sans-serif" font-size="30"
        fill="#e6e9ef" font-weight="400">${positioning}</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true },
  background: '#0b1220',
});

const png = resvg.render().asPng();
const out = resolve(root, 'public', 'og-image.png');
await writeFile(out, png);
console.log(`[generate:og] Wrote ${out} (${png.length} bytes)`);
