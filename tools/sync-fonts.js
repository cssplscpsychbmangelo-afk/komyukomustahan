#!/usr/bin/env node
/* Copies the exact font files the page needs out of node_modules and
   into public/fonts, so the app stays fully offline (no CDN, no Google
   Fonts request, no network at runtime).

     npm install
     node tools/sync-fonts.js
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST = path.join(ROOT, 'public', 'fonts');

const FILES = [
  ['@fontsource/cinzel', 'cinzel-latin-400-normal.woff2'],
  ['@fontsource/cinzel', 'cinzel-latin-600-normal.woff2'],
  ['@fontsource/cinzel', 'cinzel-latin-700-normal.woff2'],
  ['@fontsource/cormorant-garamond', 'cormorant-garamond-latin-300-italic.woff2'],
  ['@fontsource/cormorant-garamond', 'cormorant-garamond-latin-400-italic.woff2'],
  ['@fontsource/inter', 'inter-latin-400-normal.woff2'],
  ['@fontsource/inter', 'inter-latin-500-normal.woff2'],
  ['@fontsource/inter', 'inter-latin-600-normal.woff2']
];

fs.mkdirSync(DEST, { recursive: true });

let copied = 0, missing = 0;
for (const [pkg, file] of FILES) {
  const src = path.join(ROOT, 'node_modules', pkg, 'files', file);
  if (!fs.existsSync(src)) {
    console.warn('  missing: ' + pkg + '/files/' + file);
    missing++;
    continue;
  }
  fs.copyFileSync(src, path.join(DEST, file));
  copied++;
}

const total = fs.readdirSync(DEST)
  .map(f => fs.statSync(path.join(DEST, f)).size)
  .reduce((a, b) => a + b, 0);

console.log(`\n  ${copied} font files in public/fonts (${Math.round(total / 1024)} KB)` +
  (missing ? `, ${missing} missing — run npm install` : ''));
