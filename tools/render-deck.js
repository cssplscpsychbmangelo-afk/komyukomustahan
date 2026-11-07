#!/usr/bin/env node
/* Renders all sixteen cards, plus a contact sheet, to PNG.

   Use it to print the deck, drop art into slides, or check the whole
   deck at a glance after changing a colour or a sigil.

     node tools/render-deck.js            -> build/deck/*.png + build/deck.png
     node tools/render-deck.js --svg      -> keep the source SVGs too
     node tools/render-deck.js --out assets/deck   -> write somewhere else

   The card art borrows the page's fonts, so they are decompressed from
   fonts/ (woff2) to TTF and embedded before rasterising — otherwise
   the renderer silently substitutes its own fonts and the cards look wrong.

   Needs `sharp` and `wawoff2` (devDependencies). Output defaults to
   build/, which is git-ignored; assets/deck/ is the committed copy.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = __dirname.replace(/[\\/]test$|[\\/]tools$/, '');
const SP = require(path.join(ROOT, 'superpowers.js'));
const CARDS = require(path.join(ROOT, 'cards.js'));
const EXPORT = require(path.join(ROOT, 'export.js'));

const args = process.argv.slice(2);
const keepSvg = args.includes('--svg');
const outArg = args.indexOf('--out');
const OUT = path.join(ROOT, outArg >= 0 ? args[outArg + 1] : 'build');

const DECK = path.join(OUT, 'deck');
const CARD_W = 760;
const CARD_H = Math.round(CARD_W * (CARDS.H / CARDS.W));
const THUMB_W = 400;
const THUMB_H = Math.round(THUMB_W * (CARDS.H / CARDS.W));

/* ---------- fonts ---------- */
async function fontFetch() {
  let wawoff2;
  try { wawoff2 = require('wawoff2'); } catch (e) { wawoff2 = null; }
  if (!wawoff2) {
    console.warn('  ! wawoff2 not installed — cards will render in fallback fonts');
    return null;
  }
  const cache = new Map();
  return async url => {
    const src = path.join(ROOT, url);
    if (!cache.has(src)) cache.set(src, await wawoff2.decompress(fs.readFileSync(src)));
    const ttf = cache.get(src);
    return {
      ok: true,
      arrayBuffer: async () => ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength)
    };
  };
}

/* sharp can't read woff2, so swap the embedded format to truetype */
function forSharp(svg) {
  return svg
    .replace(/data:font\/woff2;base64,/g, 'data:font/ttf;base64,')
    .replace(/format\('woff2'\)/g, "format('truetype')");
}

async function main() {
  fs.mkdirSync(DECK, { recursive: true });

  const fetchImpl = await fontFetch();
  const tiles = [];

  for (const power of SP.POWERS) {
    const svg = await EXPORT.buildSvg(power, CARDS, { fetchImpl, id: 'deck-' + power.n });
    if (keepSvg) {
      fs.writeFileSync(
        path.join(DECK, String(power.n).padStart(2, '0') + '-' + power.key + '.svg'),
        svg);
    }
    const png = await sharp(Buffer.from(forSharp(svg)))
      .resize(CARD_W, CARD_H)
      .png({ palette: true, colours: 220, effort: 9, dither: 0.6, compressionLevel: 9 })
      .toBuffer();
    const name = String(power.n).padStart(2, '0') + '-' + power.key + '.png';
    fs.writeFileSync(path.join(DECK, name), png);
    tiles.push(png);
    process.stdout.write('  ' + name + '  ' + Math.round(png.length / 1024) + 'KB\n');
  }

  /* contact sheet, 4 x 4 */
  const cols = 4, gap = 22;
  const thumbs = await Promise.all(tiles.map(t => sharp(t).resize(THUMB_W, THUMB_H).png().toBuffer()));
  const rows = Math.ceil(thumbs.length / cols);
  const width = cols * THUMB_W + (cols + 1) * gap;
  const height = rows * THUMB_H + (rows + 1) * gap;

  await sharp({ create: { width, height, channels: 3, background: '#0a0b12' } })
    .composite(thumbs.map((t, i) => ({
      input: t,
      left: gap + (i % cols) * (THUMB_W + gap),
      top: gap + Math.floor(i / cols) * (THUMB_H + gap)
    })))
    .png({ palette: true, colours: 220, effort: 9, dither: 0.5 })
    .toFile(path.join(OUT, 'deck-all-powers.png'));

  console.log(`\n  ${path.relative(ROOT, DECK)}/ — ${SP.POWERS.length} cards at ${CARD_W}x${CARD_H}`);
  console.log(`  ${path.relative(ROOT, path.join(OUT, 'deck-all-powers.png'))} — ${width}x${height}`);
}

main().catch(e => { console.error(e); process.exit(1); });
