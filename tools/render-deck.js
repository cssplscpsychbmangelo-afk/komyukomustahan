#!/usr/bin/env node
/* Renders all sixteen cards plus a contact sheet to static files.

   Use it to print the deck, drop the art into slides, or check the
   whole deck at a glance after changing a colour or sigil.

     node tools/render-deck.js            -> build/deck/*.png + build/deck.png
     node tools/render-deck.js --svg      -> also keep the source SVGs

   Needs `sharp` (devDependency). Output goes to build/, which is
   git-ignored — cards are generated, not committed.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SP = require(path.join(ROOT, 'public', 'superpowers.js'));
const CARDS = require(path.join(ROOT, 'public', 'cards.js'));

const OUT = path.join(ROOT, 'build');
const DECK = path.join(OUT, 'deck');
const CARD_W = 900;
const CARD_H = Math.round(CARD_W * (CARDS.H / CARDS.W));
const keepSvg = process.argv.includes('--svg');

async function main() {
  fs.mkdirSync(DECK, { recursive: true });

  const tiles = [];
  for (const power of SP.POWERS) {
    const svg = CARDS.renderCard(power, { id: 'deck-' + power.n });
    if (keepSvg) {
      fs.writeFileSync(path.join(DECK, String(power.n).padStart(2, '0') + '-' + power.key + '.svg'), svg);
    }
    const png = await sharp(Buffer.from(svg)).resize(CARD_W, CARD_H).png().toBuffer();
    const name = String(power.n).padStart(2, '0') + '-' + power.key + '.png';
    fs.writeFileSync(path.join(DECK, name), png);
    tiles.push(png);
    process.stdout.write('  ' + name + '\n');
  }

  /* contact sheet, 4 x 4 */
  const cols = 4, gap = 24, thumbW = 420, thumbH = Math.round(thumbW * (CARDS.H / CARDS.W));
  const thumbs = await Promise.all(tiles.map(t => sharp(t).resize(thumbW, thumbH).png().toBuffer()));
  const width = cols * thumbW + (cols + 1) * gap;
  const rows = Math.ceil(thumbs.length / cols);
  const height = rows * thumbH + (rows + 1) * gap;

  await sharp({ create: { width, height, channels: 3, background: '#0a0b12' } })
    .composite(thumbs.map((t, i) => ({
      input: t,
      left: gap + (i % cols) * (thumbW + gap),
      top: gap + Math.floor(i / cols) * (thumbH + gap)
    })))
    .png()
    .toFile(path.join(OUT, 'deck.png'));

  console.log('\n  build/deck/ (' + SP.POWERS.length + ' cards, ' + CARD_W + 'x' + CARD_H + ')');
  console.log('  build/deck.png (contact sheet ' + width + 'x' + height + ')');
}

main().catch(e => { console.error(e); process.exit(1); });
