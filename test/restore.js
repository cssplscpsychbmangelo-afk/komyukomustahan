/* Verifies the "welcome back" path: a returning participant should see their
   previous power and be able to jump straight back to their card.

   run: node test/restore.js
*/
'use strict';

const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const PORT = 8801;
let pass = 0, fail = 0;
const ok = (n, c, x) => { c ? (pass++, console.log('  \u2713 ' + n)) : (fail++, console.log('  \u2717 ' + n + (x ? '  — ' + x : ''))); };

const srv = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js'), String(PORT)], { stdio: 'ignore' });

function up() {
  return new Promise((res, rej) => {
    let n = 40;
    const tick = () => http.get({ host: '127.0.0.1', port: PORT, path: '/' }, r => { r.resume(); res(); })
      .on('error', () => (n-- <= 0 ? rej(new Error('no server')) : setTimeout(tick, 120)));
    tick();
  });
}

const opts = seed => ({
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: new VirtualConsole(),
  beforeParse(window) {
    if (seed) window.localStorage.setItem('superpower.kumustahan.v1', seed);
  }
});

(async () => {
  console.log('\nreturn visit\n');
  await up();
  const base = `http://127.0.0.1:${PORT}/index.html`;

  /* visit 1 — play through to the reveal, capture what was stored */
  const d1 = await JSDOM.fromURL(base, opts());
  await new Promise(r => setTimeout(r, 600));
  const doc = d1.window.document;
  doc.querySelector('#btn-begin').click();
  await new Promise(r => setTimeout(r, 60));
  doc.querySelector('#btn-to-quiz').click();
  await new Promise(r => setTimeout(r, 140));
  for (const k of ['B', 'B', 'B']) {
    doc.querySelector(`.option[data-key="${k}"]`).click();
    await new Promise(r => setTimeout(r, 420));
  }
  doc.querySelector('#btn-skip-processing').click();
  await new Promise(r => setTimeout(r, 250));

  ok('first visit reveals BBB -> NOVA', doc.querySelector('#reveal-name').textContent === 'NOVA');

  /* leave a reflection behind before we "close the tab" */
  doc.querySelector('#btn-to-reflect').click();
  await new Promise(r => setTimeout(r, 160));
  const ta = doc.querySelector('#stmt-2');
  ta.value = 'I need this power because no one should carry it alone.';
  ta.dispatchEvent(new d1.window.Event('input', { bubbles: true }));
  const seed = d1.window.localStorage.getItem('superpower.kumustahan.v1');
  ok('session saved to local storage', !!seed && JSON.parse(seed).power === 'nova');

  /* visit 2 — boot with that storage already in place */
  const d2 = await JSDOM.fromURL(base, opts(seed));
  await new Promise(r => setTimeout(r, 600));
  const d2doc = d2.window.document;

  const banner = d2doc.querySelector('#restore-slot .restore');
  ok('welcome-back banner appears', !!banner);
  ok('banner names the previous power', /NOVA/.test(banner ? banner.textContent : ''));

  const btn = d2doc.querySelector('#btn-restore');
  ok('banner offers a way back to the card', !!btn);
  btn.click();
  await new Promise(r => setTimeout(r, 250));

  ok('jumps straight to the reveal', d2doc.querySelector('#screen-reveal').classList.contains('is-active'));
  ok('shows the same power', d2doc.querySelector('#reveal-name').textContent === 'NOVA');
  ok('restores the original combination', d2doc.querySelector('#reveal-seal').textContent.replace(/\s/g, '') === 'BBB');

  /* the reflection written in visit 1 must come back with them */
  ok('stored session kept the reflection',
    /no one should carry it alone/.test(JSON.parse(d1.window.localStorage.getItem('superpower.kumustahan.v1')).reflections.s2));

  d2doc.querySelector('#btn-to-reflect').click();
  await new Promise(r => setTimeout(r, 200));
  const back = d2doc.querySelector('#stmt-2');
  ok('reflection is repopulated on the next visit',
    !!back && /no one should carry it alone/.test(back.value),
    back ? JSON.stringify(back.value.slice(0, 40)) : 'no field');

  console.log('\n' + '-'.repeat(46));
  console.log(fail === 0 ? `all ${pass} checks passed` : `${pass} passed, ${fail} failed`);
  srv.kill();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
