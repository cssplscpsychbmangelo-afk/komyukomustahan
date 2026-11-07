/* ============================================================
   SUPERPOWER — app
   Screens, the three questions, the reveal, reflection, export.

   Privacy: everything is local. Answers and reflections live in
   localStorage under one key and never leave the device. There is
   no network code in this file at all.
   ============================================================ */
(function () {
  'use strict';

  const SP = window.SUPERPOWERS;
  const CARDS = window.CARDS;
  const { QUESTIONS, POWERS, COPY, powerFor, powerIndex, odds, comboOf } = SP;

  const STORE_KEY = 'superpower.kumustahan.v1';

  /* ---------- state ---------- */
  const state = {
    screen: 'landing',
    step: 0,                 // 0..2 -> which question
    answers: { q1: null, q2: null, q3: null },
    power: null,
    reflected: false,
    history: []
  };

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const screens = {};
  ['landing', 'spiel', 'quiz', 'processing', 'reveal', 'reflect', 'twist'].forEach(name => {
    screens[name] = $('#screen-' + name);
  });

  /* matchMedia isn't universal (and some embedded webviews omit it) */
  const mq = query => (typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : { matches: false, addEventListener() {}, removeEventListener() {} });

  const prefersReduced = mq('(prefers-reduced-motion: reduce)');

  /* ---------- storage (private, local only) ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function save(patch) {
    const data = Object.assign({}, load(), patch || {});
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }
  function clearAll() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ }
  }

  /* ---------- accent colour ---------- */
  function applyAccent(power) {
    const root = document.documentElement;
    if (!power) {
      root.style.setProperty('--accent', '#e6c88b');
      root.style.setProperty('--accent-rgb', '230, 200, 139');
      root.style.setProperty('--accent-deep', '#6b5730');
      return;
    }
    const [r, g, b] = power.c1;
    root.style.setProperty('--accent', `rgb(${r},${g},${b})`);
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--accent-deep', `rgb(${power.c3.join(',')})`);
  }

  /* ---------- screen flow ---------- */
  function go(name, opts) {
    opts = opts || {};
    if (!screens[name]) return;
    state.history.push(state.screen);
    state.screen = name;

    Object.entries(screens).forEach(([key, el]) => {
      const on = key === name;
      el.classList.toggle('is-active', on);
      if (on) { el.removeAttribute('hidden'); } else { el.setAttribute('hidden', ''); }
    });

    if (name === 'quiz') renderQuestion();
    if (name === 'reveal') renderReveal();
    if (name === 'reflect') renderStatements();

    updateProgress();

    if (!opts.keepScroll) {
      window.scrollTo({ top: 0, behavior: prefersReduced.matches ? 'auto' : 'smooth' });
    }
    // move focus to the new screen's heading for keyboard and screen readers
    const heading = screens[name].querySelector('h1, h2, .q__prompt, .processing__line');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      try { heading.focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }
  }

  function updateProgress() {
    const order = ['landing', 'spiel', 'quiz', 'reveal', 'reflect', 'twist'];
    const i = order.indexOf(state.screen);
    const pct = state.screen === 'processing' ? 62 : i < 0 ? 0 : (i / (order.length - 1)) * 100;
    $('#progress').style.width = pct + '%';
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  /* ---------- hero stack on the landing screen ---------- */
  function buildHeroStack() {
    const stack = $('#hero-stack');
    // left and right sit behind; the middle card is the one that reads as "yours"
    const picks = [
      { power: POWERS[5], pos: 'back-left' },   // WARP
      { power: POWERS[10], pos: 'back-right' }, // EMPATHIA
      { power: POWERS[0], pos: 'front' }        // AEGIS
    ];
    picks.forEach(item => {
      const holder = document.createElement('div');
      holder.className = 'card card--mini hero-card hero-card--' + item.pos;
      holder.innerHTML = CARDS.renderCard(item.power, { id: 'hero-' + item.pos });
      const sheen = document.createElement('div');
      sheen.className = 'card__sheen';
      const grain = document.createElement('div');
      grain.className = 'card__grain';
      holder.append(sheen, grain);
      stack.appendChild(holder);
    });
  }

  /* ---------- the three questions ---------- */
  const chosen = { q1: null, q2: null, q3: null };

  function renderQuestion() {
    const stage = $('#quiz-stage');
    const q = QUESTIONS[state.step];
    const prior = state.step > 0 ? chosen[QUESTIONS[state.step - 1].id] : null;

    advancing = false;

    // dots
    const dots = $('#quiz-dots');
    dots.innerHTML = QUESTIONS.map((_, i) =>
      `<span class="dot ${i < state.step ? 'is-done' : ''} ${i === state.step ? 'is-now' : ''}"></span>`).join('');
    $('#quiz-label').textContent = `Question ${state.step + 1} of 3`;

    stage.innerHTML = `
      <div class="q">
        <div class="q__kicker">
          <p class="eyebrow">${q.kicker}</p>
          <span class="line"></span>
        </div>
        <h2 class="q__prompt" id="quiz-prompt">${q.prompt}</h2>
        <p class="q__hint">${COPY.question}</p>
        <ul class="options" role="list">
          ${q.options.map(o => `
            <li>
              <button class="option ${chosen[q.id] === o.key ? 'is-chosen' : ''}"
                      type="button" data-key="${o.key}" aria-pressed="${chosen[q.id] === o.key}">
                <span class="option__key" aria-hidden="true">${o.key}</span>
                <span class="option__label">${o.label}</span>
                <svg class="option__tick" width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                  <path d="M4 12.5 9.5 18 20 6.5"/>
                </svg>
              </button>
            </li>`).join('')}
        </ul>
        <div class="quiz__foot">
          ${state.step > 0
            ? '<button class="btn btn--ghost btn--sm" type="button" id="btn-q-back">Previous question</button>'
            : ''}
          <span class="spacer"></span>
          <p class="note">
            <span class="kbd">A</span><span class="kbd">B</span><span class="kbd">C</span><span class="kbd">D</span>
            or <span class="kbd">1</span>–<span class="kbd">4</span> to choose
          </p>
        </div>
      </div>`;

    $$('.option', stage).forEach(btn => {
      btn.addEventListener('click', () => choose(q.id, btn.dataset.key));
    });
    const back = $('#btn-q-back', stage);
    if (back) back.addEventListener('click', () => {
      state.step = Math.max(0, state.step - 1);
      renderQuestion();
      window.scrollTo({ top: 0, behavior: prefersReduced.matches ? 'auto' : 'smooth' });
    });
  }

  let advancing = false;

  function choose(qid, key) {
    if (advancing) return;          // a click plus a keypress must not double-advance
    chosen[qid] = key;
    state.answers = Object.assign({}, chosen);
    // brief highlight before advancing
    $$('#quiz-stage .option').forEach(b => {
      const on = b.dataset.key === key;
      b.classList.toggle('is-chosen', on);
      b.setAttribute('aria-pressed', String(on));
    });
    save({ answers: state.answers, revealed: false });

    advancing = true;
    const delay = prefersReduced.matches ? 60 : 340;
    setTimeout(() => {
      advancing = false;
      if (state.step < QUESTIONS.length - 1) {
        state.step += 1;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: prefersReduced.matches ? 'auto' : 'smooth' });
      } else {
        startProcessing();
      }
    }, delay);
  }

  /* ---------- processing / awakening ---------- */
  const RITES = [
    'The runes are listening…',
    'Weighing what you would protect…',
    'Weighing what you would repair…',
    'Weighing what you would become…',
    'Five parts of what you would change…',
    'Three parts of what people need…',
    'Seven parts of the gift you chose…',
    'Matching your combination…'
  ];

  function startProcessing() {
    go('processing');
    state.power = powerFor(state.answers);
    applyAccent(state.power);

    const glyph = $('#rites-glyph');
    glyph.innerHTML = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"
      stroke-width="1.1">${window.SIGILS[state.power.sigil] || ''}</svg>`;

    const line = $('#processing-line');
    const sub = $('#processing-sub');
    const total = prefersReduced.matches ? 700 : 3600;
    const per = total / RITES.length;
    let i = 0;
    clearInterval(startProcessing._t);
    line.textContent = RITES[0];
    startProcessing._t = setInterval(() => {
      i += 1;
      if (i >= RITES.length) {
        clearInterval(startProcessing._t);
        sub.textContent = 'Revealing your power';
        return;
      }
      line.style.opacity = '0';
      setTimeout(() => {
        line.textContent = RITES[i];
        line.style.opacity = '1';
      }, 180);
    }, per);

    clearTimeout(startProcessing._go);
    startProcessing._go = setTimeout(() => {
      clearInterval(startProcessing._t);
      go('reveal');
    }, total + 260);
  }

  /* ---------- reveal ---------- */
  function buildCard(power, container, opts) {
    container.innerHTML = CARDS.renderCard(power, opts);
    const sheen = document.createElement('div');
    sheen.className = 'card__sheen';
    const grain = document.createElement('div');
    grain.className = 'card__grain';
    container.appendChild(sheen);
    container.appendChild(grain);
    attachTilt(container);
  }

  function attachTilt(card) {
    if (!mq('(hover: hover) and (pointer: fine)').matches) return;
    if (prefersReduced.matches) return;
    let raf = null;
    const MAX = 11;
    function move(e) {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const ry = (px - .5) * 2 * MAX;
      const rx = (.5 - py) * 2 * MAX;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    }
    function enter() { card.classList.add('is-tilting'); }
    function leave() {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '40%');
    }
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);
  }

  function renderReveal() {
    if (!state.power) state.power = powerFor(state.answers);
    const p = state.power;
    applyAccent(p);

    buildCard(p, $('#reveal-card'), { id: 'reveal' });

    // a burst of light behind the card as it arrives
    const stage = $('.reveal__stage');
    $$('.awaken-flash', stage).forEach(el => el.remove());
    const flash = document.createElement('div');
    flash.className = 'awaken-flash';
    flash.setAttribute('aria-hidden', 'true');
    stage.appendChild(flash);
    setTimeout(() => flash.remove(), 1800);

    $('#reveal-domain').textContent = p.domain;
    $('#reveal-name').textContent = p.name;
    $('#reveal-title').textContent = p.title;
    $('#reveal-desc').textContent = p.desc;
    $('#reveal-vision').textContent = p.vision;

    $('#reveal-seal').innerHTML = ['q1', 'q2', 'q3']
      .map(k => `<b title="Question ${k.slice(1)}">${state.answers[k] || '·'}</b>`).join('');
    const o = odds()[p.key];
    $('#reveal-odds').textContent =
      `${o} of 64 combinations lead here · power index ${String(powerIndex(state.answers)).padStart(2, '0')}/16`;

    $('#reveal-recap').innerHTML = QUESTIONS.map(q => {
      const opt = q.options.find(x => x.key === state.answers[q.id]);
      return `<li><b>${state.answers[q.id] || '·'}</b><span>${q.short} — ${opt ? opt.label : 'not answered'}</span></li>`;
    }).join('');

    save({
      answers: state.answers,
      power: p.key,
      revealed: true,
      savedAt: Date.now()
    });
  }

  /* ---------- reflection ---------- */
  function renderStatements() {
    const host = $('#statements');
    if (host.dataset.built === 'true') { hydrateStatements(); return; }
    const p = state.power || powerFor(state.answers);
    const data = load();
    const reflections = data.reflections || {};

    host.innerHTML = COPY.reflectionFields.map((line, i) => `
      <div class="statement">
        <label for="stmt-${i}">
          <span class="n">${String(i + 1).padStart(2, '0')}</span>
          <span>${line} <span class="tail">__________.</span></span>
        </label>
        <textarea id="stmt-${i}" data-i="${i}" rows="1"
          placeholder="${i === 0
            ? (p ? p.name + ' — ' + p.title.toLowerCase() : '')
            : i === 1 ? 'a place, a person, a room, a country, a conversation…'
            : i === 2 ? 'say the real reason…'
            : 'something small enough to actually do…'}"></textarea>
        <span class="count" data-count="${i}"></span>
      </div>`).join('');

    host.dataset.built = 'true';

    $$('textarea', host).forEach(ta => {
      const i = ta.dataset.i;
      ta.value = reflections['s' + i] || '';
      autoGrow(ta);
      updateCount(ta);
      ta.addEventListener('input', () => {
        autoGrow(ta);
        updateCount(ta);
        const store = load();
        const r = store.reflections || {};
        r['s' + i] = ta.value;
        save({ reflections: r, reflected: true });
        state.reflected = true;
      });
    });

    // timer default 2:00
    resetTimer();
  }

  function hydrateStatements() {
    const reflections = load().reflections || {};
    $$('#statements textarea').forEach(ta => {
      ta.value = reflections['s' + ta.dataset.i] || '';
      autoGrow(ta);
      updateCount(ta);
    });
  }

  function autoGrow(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(28, ta.scrollHeight) + 'px';
  }
  function updateCount(ta) {
    const el = ta.parentElement.querySelector('.count');
    const n = ta.value.trim().length;
    el.textContent = n ? `${n}` : '';
  }

  /* countdown timer */
  let timer = { left: 120, running: false, id: null };
  function fmt(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function paintTimer() {
    $('#timer-clock').textContent = fmt(timer.left);
    $('#timer').classList.toggle('is-running', timer.running);
    $('#timer-toggle').textContent = timer.running ? 'Pause' : (timer.left === 120 ? 'Start timer' : 'Resume');
    $('#timer-toggle').setAttribute('aria-label', timer.running ? 'Pause reflection timer' : 'Start reflection timer');
  }
  function resetTimer() {
    clearInterval(timer.id);
    timer = { left: 120, running: false, id: null };
    paintTimer();
  }
  function toggleTimer() {
    if (timer.running) {
      clearInterval(timer.id);
      timer.running = false;
      paintTimer();
      return;
    }
    if (timer.left <= 0) timer.left = 120;
    timer.running = true;
    timer.id = setInterval(() => {
      timer.left -= 1;
      if (timer.left <= 0) {
        timer.left = 0;
        clearInterval(timer.id);
        timer.running = false;
        toast('Time. Where would you use your power?');
      }
      paintTimer();
    }, 1000);
    paintTimer();
  }

  /* ---------- export: download the card ---------- */
  /* the heavy lifting lives in export.js so it can be tested on its own */
  async function downloadCard() {
    const p = state.power || powerFor(state.answers);
    if (!p) { toast('Answer the three questions first.'); return; }
    if (!window.EXPORT) { toast('Export is unavailable in this browser.'); return; }
    try {
      const svg = await window.EXPORT.buildSvg(p, CARDS, { id: 'export' });
      const slug = p.name.toLowerCase();
      triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
        `superpower-${slug}.svg`);

      // a PNG as well, because most chat apps won't preview an SVG
      const png = await window.EXPORT.toPng(svg, CARDS.W, CARDS.H, 2);
      if (png) triggerDownload(png, `superpower-${slug}.png`);

      toast(`${p.name} saved to your device.`);
    } catch (e) {
      toast('Could not export the card. Try the share option.');
    }
  }

  function triggerDownload(blobOrUrl, filename) {
    const href = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(href);
      a.remove();
    }, 4000);
  }

  async function share() {
    const p = state.power || powerFor(state.answers);
    const text = p
      ? `My superpower is ${p.name} — ${p.title}. ${p.desc} What would you do if you could?`
      : 'What would you do if you could?';
    const url = location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SUPERPOWER', text, url });
        return;
      } catch (e) { /* user cancelled or unsupported */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast('Copied — paste it wherever your kumustahan is.');
    } catch (e) {
      toast('Copy the link from your address bar to share.');
    }
  }

  /* ---------- restore a previous session ---------- */
  function offerRestore() {
    const data = load();
    if (!data.revealed || !data.power) return;
    const p = POWERS.find(x => x.key === data.power);
    if (!p) return;
    const slot = $('#restore-slot');
    slot.innerHTML = `
      <div class="restore">
        <span>Welcome back. You last awakened <strong>${p.name}</strong> — ${p.title}.</span>
        <span class="spacer"></span>
        <button type="button" id="btn-restore">Return to my card</button>
      </div>`;
    applyAccent(p);
    $('#btn-restore').addEventListener('click', () => {
      state.answers = Object.assign({ q1: null, q2: null, q3: null }, data.answers || {});
      Object.assign(chosen, state.answers);
      state.power = p;
      state.step = 0;
      go('reveal');
    });
  }

  /* ---------- wiring ---------- */
  function init() {
    buildHeroStack();
    applyAccent(null);

    $('#btn-begin').addEventListener('click', () => go('spiel'));
    $('#btn-to-quiz').addEventListener('click', () => { state.step = 0; go('quiz'); });
    $('#btn-spiel-back').addEventListener('click', () => go('landing'));

    $('#btn-quiz-restart').addEventListener('click', () => {
      Object.assign(chosen, { q1: null, q2: null, q3: null });
      state.answers = { q1: null, q2: null, q3: null };
      state.step = 0;
      save({ answers: null, revealed: false });
      renderQuestion();
      toast('Cleared. Start again whenever you like.');
    });

    $('#btn-skip-processing').addEventListener('click', () => {
      clearTimeout(startProcessing._go);
      clearInterval(startProcessing._t);
      go('reveal');
    });

    $('#btn-to-reflect').addEventListener('click', () => go('reflect'));
    $('#btn-reflect-back').addEventListener('click', () => go('reveal'));
    $('#btn-to-twist').addEventListener('click', () => {
      go('twist');
      const data = load();
      $('#twist-answer').value = data.today || '';
    });
    $('#btn-download').addEventListener('click', downloadCard);
    $('#btn-download-2').addEventListener('click', downloadCard);
    $('#btn-share').addEventListener('click', share);

    $('#btn-save-today').addEventListener('click', () => {
      save({ today: $('#twist-answer').value });
      $('#today-saved').textContent = 'Saved on this device.';
      toast('Kept.');
    });
    $('#twist-answer').addEventListener('input', e => {
      $('#today-saved').textContent = '';
      save({ today: e.target.value });
    });

    $('#btn-again').addEventListener('click', () => {
      Object.assign(chosen, { q1: null, q2: null, q3: null });
      state.answers = { q1: null, q2: null, q3: null };
      state.step = 0;
      save({ answers: null, revealed: false });
      go('quiz');
    });

    $('#btn-clear').addEventListener('click', () => {
      if (!window.confirm('Clear your answers and reflections from this browser?')) return;
      clearAll();
      Object.assign(chosen, { q1: null, q2: null, q3: null });
      state.answers = { q1: null, q2: null, q3: null };
      state.power = null;
      $('#twist-answer').value = '';
      $('#today-saved').textContent = '';
      const host = $('#statements');
      if (host) { host.innerHTML = ''; host.dataset.built = 'false'; }
      applyAccent(null);
      go('landing');
      toast('Cleared. Nothing of yours remains on this device.');
    });

    $('#timer-toggle').addEventListener('click', toggleTimer);
    $('#timer-reset').addEventListener('click', resetTimer);

    /* keyboard: A–D / 1–4 to answer while on the quiz */
    document.addEventListener('keydown', e => {
      if (state.screen !== 'quiz') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const map = { a: 'A', b: 'B', c: 'C', d: 'D', 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
      const key = map[e.key.toLowerCase()];
      if (!key) return;
      e.preventDefault();
      choose(QUESTIONS[state.step].id, key);
    });

    offerRestore();
    updateProgress();

    // deep link: #reveal for facilitators demonstrating
    if (location.hash === '#quiz') go('quiz');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* keep the activity working offline. Skipped on file:// where service
     workers aren't allowed — the page still works, just uncached. */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* non-fatal */ });
    });
  }

  /* expose a tiny debug handle for facilitators */
  window.SUPERPOWER_APP = { state, go, powerFor, powerIndex, odds };
})();
