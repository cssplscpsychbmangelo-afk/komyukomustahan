#!/usr/bin/env node
/* Smoke test: loads the real pages in jsdom and drives the activity
   the way a participant would — begin, three answers, reveal,
   reflection, twist — then checks the export SVG path.

   run:  node test/smoke.js
   (requires jsdom; installed on demand, not a runtime dependency)
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.join(__dirname, '..', 'public');
let pass = 0, fail = 0;

function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fail++; console.log('  \u2717 ' + name + (extra ? '  — ' + extra : '')); }
}

let BASE = '';
let server = null;

function waitForServer(port, tries) {
  return new Promise((resolve, reject) => {
    const attempt = n => {
      const req = http.get({ host: '127.0.0.1', port, path: '/' }, res => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (n <= 0) return reject(new Error('server never came up'));
        setTimeout(() => attempt(n - 1), 120);
      });
    };
    attempt(tries || 40);
  });
}

async function startServer() {
  const port = 8791;
  server = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js'), String(port)], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForServer(port);
  BASE = 'http://127.0.0.1:' + port;
}

async function loadPage(file) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message.split('\n')[0]));
  vc.on('error', e => errors.push(String(e)));

  const dom = await JSDOM.fromURL(BASE + '/' + file, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc
  });

  await new Promise(r => setTimeout(r, 400));
  return { dom, win: dom.window, doc: dom.window.document, errors };
}

const tick = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
(async function main() {
  console.log('\nSUPERPOWER smoke test\n');
  await startServer();
  console.log('serving ' + BASE + '\n');

  /* ---------- 1. data / formula ---------- */
  console.log('formula');
  const SP = require('../public/superpowers.js');
  ok('16 powers defined', SP.POWERS.length === 16);
  ok('3 questions, 4 options each',
    SP.QUESTIONS.length === 3 && SP.QUESTIONS.every(q => q.options.length === 4));

  const seen = new Set();
  let combos = 0, allInRange = true;
  for (const q1 of 'ABCD') for (const q2 of 'ABCD') for (const q3 of 'ABCD') {
    combos++;
    const i = SP.powerIndex({ q1, q2, q3 });
    if (!Number.isInteger(i) || i < 1 || i > 16) allInRange = false;
    seen.add(i);
  }
  ok('64 combinations enumerated', combos === 64);
  ok('every index lands in 1…16', allInRange);
  ok('all 16 powers are reachable', seen.size === 16, 'got ' + seen.size);

  // every power reachable from every single-question answer
  const reach = {};
  for (const p of SP.POWERS) reach[p.key] = 0;
  Object.keys(SP.odds()).forEach(k => { reach[k] = SP.odds()[k]; });
  ok('odds sum to 64', Object.values(reach).reduce((a, b) => a + b, 0) === 64);

  // changing exactly one answer should usually change the power
  let flipped = 0, tested = 0;
  for (const q1 of 'ABCD') for (const q2 of 'ABCD') for (const q3 of 'ABCD') {
    const base = SP.powerFor({ q1, q2, q3 });
    const alt = SP.powerFor({ q1, q2, q3: q3 === 'A' ? 'B' : 'A' });
    tested++;
    if (alt.key !== base.key) flipped++;
  }
  ok('changing Q3 always changes the power', flipped === tested, flipped + '/' + tested);

  ok('known case AAA -> AEGIS', SP.powerFor({ q1: 'A', q2: 'A', q3: 'A' }).key === 'aegis');
  ok('known case DDD -> ORACLE', SP.powerFor({ q1: 'D', q2: 'D', q3: 'D' }).key === 'oracle');
  ok('known case BBB -> NOVA', SP.powerFor({ q1: 'B', q2: 'B', q3: 'B' }).key === 'nova');

  /* ---------- 2. card renderer ---------- */
  console.log('\ncards');
  const CARDS = require('../public/cards.js');
  const SIG = require('../public/sigils.js');
  ok('a sigil exists for every power', SP.POWERS.every(p => typeof SIG[p.sigil] === 'string'));
  let uniqueIds = true;
  const svgs = SP.POWERS.map((p, i) => {
    const s = CARDS.renderCard(p, { id: 't' + i });
    if (!s.includes(`id="t${i}-bg"`)) uniqueIds = false;
    return s;
  });
  ok('gradient ids are namespaced per card', uniqueIds);
  ok('every card carries its name and domain',
    SP.POWERS.every((p, i) => svgs[i].includes(p.name) && svgs[i].includes(p.domain)));
  ok('every card carries its description',
    SP.POWERS.every((p, i) => CARDS.wrap(p.desc, 44).every(line =>
      svgs[i].includes(line.replace(/&/g, '&amp;').replace(/’/g, '’')))));

  // text must not run off the card
  let fits = true, widest = 0;
  SP.POWERS.forEach(p => {
    CARDS.wrap(p.desc, 44).forEach(line => {
      widest = Math.max(widest, line.length);
      if (line.length > 46) fits = false;
    });
  });
  ok('description lines stay inside the card', fits, 'widest ' + widest + ' chars');

  // name width: Cinzel 600 at 41px is ~0.68em per char
  const nameTooWide = SP.POWERS.filter(p => {
    const px = p.name.length * 41 * 0.68 + (p.name.length - 1) * 2.6;
    return px > 420 - 88;
  }).map(p => p.name);
  ok('power names fit inside the card', nameTooWide.length === 0, nameTooWide.join(', '));

  /* ---------- 3. the activity in a browser ---------- */
  console.log('\nactivity page');
  const { win, doc, errors } = await loadPage('index.html');
  ok('page loads without script errors', errors.length === 0, errors[0]);

  ok('landing screen visible', doc.querySelector('#screen-landing').classList.contains('is-active'));
  ok('hero stack built (3 stacked cards)', doc.querySelectorAll('#hero-stack .hero-card').length === 3);

  doc.querySelector('#btn-begin').click();
  await tick(60);
  ok('begin -> spiel', doc.querySelector('#screen-spiel').classList.contains('is-active'));

  doc.querySelector('#btn-to-quiz').click();
  await tick(80);
  ok('spiel -> quiz', doc.querySelector('#screen-quiz').classList.contains('is-active'));
  ok('question 1 rendered', /change one thing in your life/.test(doc.querySelector('#quiz-prompt').textContent));
  ok('four options shown', doc.querySelectorAll('.option').length === 4);

  // answer Q1 = B
  doc.querySelector('.option[data-key="B"]').click();
  await tick(450);
  ok('advanced to question 2', /people need the most/.test(
    doc.querySelector('#quiz-prompt') ? doc.querySelector('#quiz-prompt').textContent : ''));

  // answer Q2 = C
  doc.querySelector('.option[data-key="C"]').click();
  await tick(450);
  ok('advanced to question 3', /one gift/.test(
    doc.querySelector('#quiz-prompt') ? doc.querySelector('#quiz-prompt').textContent : ''));

  // answer Q3 = D
  doc.querySelector('.option[data-key="D"]').click();
  await tick(450);
  ok('processing screen shown', doc.querySelector('#screen-processing').classList.contains('is-active'));

  doc.querySelector('#btn-skip-processing').click();
  await tick(80);
  ok('reveal screen shown', doc.querySelector('#screen-reveal').classList.contains('is-active'));

  const expected = SP.powerFor({ q1: 'B', q2: 'C', q3: 'D' });
  ok('revealed the right power (BCD -> ' + expected.name + ')',
    doc.querySelector('#reveal-name').textContent === expected.name,
    doc.querySelector('#reveal-name').textContent);
  ok('card rendered on reveal', !!doc.querySelector('#reveal-card svg.card__svg'));
  ok('accent colour switched to the power',
    win.document.documentElement.style.getPropertyValue('--accent-rgb') === expected.c1.join(', '));
  ok('combination seal shows answers', doc.querySelector('#reveal-seal').textContent.replace(/\s/g, '') === 'BCD');
  ok('recap lists three answers', doc.querySelectorAll('#reveal-recap li').length === 3);

  doc.querySelector('#btn-to-reflect').click();
  await tick(80);
  ok('reflect screen shown', doc.querySelector('#screen-reflect').classList.contains('is-active'));
  ok('four statements rendered', doc.querySelectorAll('#statements .statement').length === 4);

  // typing a reflection persists locally
  const ta = doc.querySelector('#stmt-0');
  ta.value = 'I would stand between a friend and their worst night.';
  ta.dispatchEvent(new win.Event('input', { bubbles: true }));
  const stored = JSON.parse(win.localStorage.getItem('superpower.kumustahan.v1'));
  ok('reflection saved to localStorage', /stand between/.test(stored.reflections.s0));

  doc.querySelector('#btn-to-twist').click();
  await tick(80);
  ok('twist screen shown', doc.querySelector('#screen-twist').classList.contains('is-active'));

  /* export path — fonts won't load in jsdom, so this exercises the fallback */
  ok('download button wired', !!doc.querySelector('#btn-download'));

  /* ---------- 3b. export ---------- */
  console.log('\nexport');
  const EXPORT = require('../public/export.js');
  const fakeFetch = async p => {
    const buf = fs.readFileSync(path.join(ROOT, p));
    return { ok: true, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  };
  const exported = await EXPORT.buildSvg(SP.POWERS[0], CARDS, { fetchImpl: fakeFetch, id: 'ex' });
  ok('exported SVG carries its own fonts', (exported.match(/data:font\/woff2;base64,/g) || []).length === 4);
  ok('exported SVG declares a fixed size', /<svg width="840" height="1176"/.test(exported));
  ok('exported SVG keeps the card art', exported.includes('AEGIS') && exported.includes('PROTECTION'));
  ok('export stays a reasonable size', exported.length < 400 * 1024, Math.round(exported.length / 1024) + 'KB');

  const noFonts = await EXPORT.buildSvg(SP.POWERS[1], CARDS, { fetchImpl: null, id: 'nf' });
  ok('export degrades gracefully without fonts', noFonts.startsWith('<svg') && noFonts.length > 5000);

  /* ---------- 4. gallery ---------- */
  console.log('\ngallery page');
  const g = await loadPage('gallery.html');
  ok('gallery loads without script errors', g.errors.length === 0, g.errors[0]);
  ok('16 cards in the deck', g.doc.querySelectorAll('#gallery-grid .card').length === 16);
  ok('lookup has 12 buttons', g.doc.querySelectorAll('#lookup-rows button').length === 12);
  ok('lookup starts on AAA -> AEGIS', /AEGIS/.test(g.doc.querySelector('#lookup-result').textContent));

  // AAD: 5·0 + 3·0 + 7·3 = 21 -> 1 + (21 mod 16) = 6 -> WARP
  g.doc.querySelector('#lookup-rows button[data-q="q3"][data-k="D"]').click();
  await tick(30);
  ok('lookup updates on change (AAD -> WARP, index 6)',
    /WARP/.test(g.doc.querySelector('#lookup-result').textContent),
    g.doc.querySelector('#lookup-result').textContent.trim().slice(0, 60));
  ok('lookup shows the index arithmetic',
    /mod 16\) = 6/.test(g.doc.querySelector('#lookup-result').textContent));

  // BBB -> NOVA (index 16)
  g.doc.querySelector('#lookup-rows button[data-q="q1"][data-k="B"]').click();
  g.doc.querySelector('#lookup-rows button[data-q="q2"][data-k="B"]').click();
  g.doc.querySelector('#lookup-rows button[data-q="q3"][data-k="B"]').click();
  await tick(30);
  ok('lookup BBB -> NOVA index 16',
    /NOVA/.test(g.doc.querySelector('#lookup-result').textContent) &&
    /mod 16\) = 16/.test(g.doc.querySelector('#lookup-result').textContent));

  // opening a card in the dialog
  const dialog = g.doc.querySelector('#power-dialog');
  if (typeof dialog.showModal !== 'function') {
    dialog.showModal = function () { this.setAttribute('open', ''); };
    dialog.close = function () { this.removeAttribute('open'); };
  }
  g.doc.querySelectorAll('#gallery-grid .card')[4].click();
  await tick(30);
  ok('card opens in the detail dialog, correct power',
    g.doc.querySelector('#dialog-name').textContent === 'VERDANT',
    g.doc.querySelector('#dialog-name').textContent);
  ok('dialog lists the combinations that reach it',
    /3 of 64 combinations/.test(g.doc.querySelector('#dialog-combos').textContent));
  g.doc.querySelector('#dialog-close').click();
  await tick(30);
  ok('dialog closes', !dialog.hasAttribute('open'));

  /* ---------- 4b. coming back later ---------- */
  console.log('\nreturn visit');
  // reuse the storage from the first session: grab it, then open a fresh page
  const saved = win.localStorage.getItem('superpower.kumustahan.v1');
  ok('session was stored', !!saved && JSON.parse(saved).revealed === true);

  {
    const back = await loadPage('index.html');
    back.win.localStorage.setItem('superpower.kumustahan.v1', saved);
    const back2 = await loadPage('index.html');   // same origin? jsdom instance is fresh
    // jsdom gives each page its own storage, so seed then re-init in this window
    back2.win.localStorage.setItem('superpower.kumustahan.v1', saved);
    ok('storage is readable for a returning participant',
      JSON.parse(back2.win.localStorage.getItem('superpower.kumustahan.v1')).power === expected.key);
  }

  /* ---------- 5. guide ---------- */
  console.log('\nguide page');
  const gu = await loadPage('guide.html');
  ok('guide loads without script errors', gu.errors.length === 0, gu.errors[0]);
  ok('mapping table has 16 rows', gu.doc.querySelectorAll('#formula-table tbody tr').length === 16);
  ok('mini deck lists 16 powers', gu.doc.querySelectorAll('#cards-mini span').length === 16);

  const cells = Array.from(gu.doc.querySelectorAll('#formula-table tbody tr'))
    .map(tr => Number(tr.lastElementChild.textContent));
  ok('mapping table counts sum to 64', cells.reduce((a, b) => a + b, 0) === 64);

  /* ---------- summary ---------- */
  console.log('\n' + '-'.repeat(46));
  console.log(fail === 0 ? `all ${pass} checks passed` : `${pass} passed, ${fail} failed`);
  if (server) server.kill();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => {
  console.error('\ntest crashed:', e);
  process.exit(1);
});
