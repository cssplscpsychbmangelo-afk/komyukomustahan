/* ============================================================
   Card renderer — builds each superpower as a collectible card.
   Pure string SVG, no canvas, no network, deterministic per power.

   Used by:
     · index.html  (inline SVG, so the page fonts apply)
     · gallery.html (thumbnail art only)
     · app.js      (standalone SVG / PNG export with embedded fonts)
   ============================================================ */
(function (root, factory) {
  const api = factory(root.SIGILS || (typeof require === 'function' ? require('./sigils.js') : {}));
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CARDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (SIGILS) {
  'use strict';

  const W = 420, H = 588;

  /* deterministic pseudo-random so a power always looks the same */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* baseline positions for the text block, keyed off how many
     description lines we ended up with */
  function layout(nLines) {
    const seal = 566;
    const sealRule = 546;
    const descLast = sealRule - 24;
    const desc = descLast - (nLines - 1) * 21;
    const title = desc - 39;
    const rule = title - 28;
    const name = rule - 23;
    return { seal, sealRule, descLast, desc, title, rule, name };
  }

  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function wrap(text, max) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? line + ' ' + w : w;
      if (next.length > max && line) { lines.push(line); line = w; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  /* four corner brackets, drawn inside the card */
  function corners(stroke) {
    const p = 22, l = 26;
    const corner = (x, y, sx, sy) =>
      `<path d="M${x} ${y + sy * l} L${x} ${y} L${x + sx * l} ${y}" fill="none"
             stroke="${stroke}" stroke-width="1.4" stroke-linecap="square"/>`;
    return corner(p, p, 1, 1) + corner(W - p, p, -1, 1) +
           corner(p, H - p, 1, -1) + corner(W - p, H - p, -1, -1);
  }

  /* the illuminated field behind the sigil */
  function field(power, id) {
    const r = rng(power.n * 977 + 31);
    const { c1, c2, c3 } = power;
    const cx = 210, cy = 206;
    let out = '';

    /* orbital tilt rings */
    out += `<g fill="none" stroke="${rgba(c1, .18)}" stroke-width="1">
      <ellipse cx="${cx}" cy="${cy}" rx="146" ry="146" opacity=".55"/>
      <ellipse cx="${cx}" cy="${cy}" rx="146" ry="52" transform="rotate(-18 ${cx} ${cy})" opacity=".5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="146" ry="52" transform="rotate(38 ${cx} ${cy})" opacity=".28"/>
      <ellipse cx="${cx}" cy="${cy}" rx="112" ry="112" opacity=".3" stroke-dasharray="2 7"/>
    </g>`;

    /* dust: deterministic scatter inside the art zone */
    let dust = '';
    for (let i = 0; i < 46; i++) {
      const ang = r() * Math.PI * 2;
      const dist = 44 + r() * 138;
      const x = cx + Math.cos(ang) * dist;
      const y = cy + Math.sin(ang) * dist * .94;
      if (y < 78 || y > 348) continue;
      const rad = 0.5 + r() * 1.5;
      const op = 0.16 + r() * 0.5;
      dust += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${i % 5 === 0 ? '#fff' : rgb(c1)}" opacity="${op.toFixed(2)}"/>`;
    }
    out += `<g>${dust}</g>`;

    /* a few larger four-point stars */
    let stars = '';
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + r() * .7;
      const dist = 96 + r() * 46;
      const x = cx + Math.cos(ang) * dist;
      const y = cy + Math.sin(ang) * dist * .82;
      const s = 5 + r() * 4;
      stars += `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s}
                       Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z"
                     fill="${rgba(c1, .8)}"/>`;
    }
    out += `<g>${stars}</g>`;

    /* seeded ground line / horizon */
    out += `<path d="M56 330 Q140 312 210 322 Q286 333 364 310" fill="none"
                   stroke="${rgba(c1, .2)}" stroke-width="1"/>`;

    return out;
  }

  /* ============================================================
     renderCard(power, opts) -> { svg, id }
     opts.id      : unique prefix for gradient ids (auto)
     opts.artOnly : true -> just the artwork (for thumbnails)
     ============================================================ */
  let uid = 0;

  function art(power, id) {
    const { c1, c2, c3 } = power;
    const gid = k => `${id}-${k}`;

    return `
    <g>
      <rect x="0" y="0" width="${W}" height="${H}" fill="#04050b"/>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${gid('bg')})"/>
      <ellipse cx="210" cy="208" rx="168" ry="168" fill="url(#${gid('aura')})"/>
      <ellipse cx="210" cy="270" rx="228" ry="118" fill="url(#${gid('wash')})"/>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${gid('navy')})"/>
      ${field(power, id)}
      <g color="rgb(${c1[0]},${c1[1]},${c1[2]})">
        <g transform="translate(210 206) scale(1.78) translate(-50 -50)"
           fill="none" stroke="url(#${gid('ink')})" stroke-width="1.32"
           stroke-linecap="round" stroke-linejoin="round"
           filter="url(#${gid('glow')})">
          ${SIGILS[power.sigil] || ''}
        </g>
        <g transform="translate(210 206) scale(1.78) translate(-50 -50)"
           fill="none" stroke="rgba(255,255,255,.85)" stroke-width=".42"
           stroke-linecap="round" stroke-linejoin="round" opacity=".42">
          ${SIGILS[power.sigil] || ''}
        </g>
      </g>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${gid('vignette')})"/>
    </g>`;
  }

  function defs(power, id) {
    const { c1, c2, c3 } = power;
    const gid = k => `${id}-${k}`;
    return `
    <defs>
      <radialGradient id="${gid('bg')}" cx="50%" cy="14%" r="96%">
        <stop offset="0%" stop-color="${rgba(c1, .17)}"/>
        <stop offset="18%" stop-color="${rgba(c2, .22)}"/>
        <stop offset="46%" stop-color="${rgba(c3, .5)}"/>
        <stop offset="74%" stop-color="rgba(6,8,18,.92)"/>
        <stop offset="100%" stop-color="#04050b"/>
      </radialGradient>
      <radialGradient id="${gid('navy')}" cx="50%" cy="118%" r="86%">
        <stop offset="0%" stop-color="rgba(24,32,66,.5)"/>
        <stop offset="60%" stop-color="rgba(12,16,36,.22)"/>
        <stop offset="100%" stop-color="rgba(8,10,24,0)"/>
      </radialGradient>
      <radialGradient id="${gid('aura')}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${rgba(c1, .3)}"/>
        <stop offset="38%" stop-color="${rgba(c2, .17)}"/>
        <stop offset="72%" stop-color="${rgba(c2, .04)}"/>
        <stop offset="100%" stop-color="${rgba(c2, 0)}"/>
      </radialGradient>
      <radialGradient id="${gid('wash')}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${rgba(c1, .12)}"/>
        <stop offset="60%" stop-color="${rgba(c1, .03)}"/>
        <stop offset="100%" stop-color="${rgba(c1, 0)}"/>
      </radialGradient>
      <radialGradient id="${gid('vignette')}" cx="50%" cy="38%" r="70%">
        <stop offset="46%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="82%" stop-color="rgba(0,0,0,.5)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,.88)"/>
      </radialGradient>
      <linearGradient id="${gid('ink')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="${rgb(c1)}"/>
        <stop offset="100%" stop-color="${rgb(c2)}"/>
      </linearGradient>
      <linearGradient id="${gid('foil')}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,.9)" stop-opacity=".9"/>
        <stop offset="40%" stop-color="${rgba(c1, .55)}"/>
        <stop offset="70%" stop-color="rgba(255,255,255,.15)"/>
        <stop offset="100%" stop-color="${rgba(c1, .7)}"/>
      </linearGradient>
      <linearGradient id="${gid('edge')}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${rgba(c1, .9)}"/>
        <stop offset="45%" stop-color="${rgba(c2, .22)}"/>
        <stop offset="100%" stop-color="${rgba(c1, .7)}"/>
      </linearGradient>
      <linearGradient id="${gid('name')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="52%" stop-color="#fdf6e9"/>
        <stop offset="100%" stop-color="${rgb(c1)}"/>
      </linearGradient>
      <filter id="${gid('glow')}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4.5" result="b"/>
        <feColorMatrix in="b" type="matrix" result="b2"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .85 0"/>
        <feMerge>
          <feMergeNode in="b2"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <linearGradient id="${gid('ink')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${rgb([255, 255, 255])}"/>
        <stop offset="34%" stop-color="${rgb(c1)}"/>
        <stop offset="100%" stop-color="${rgb(c2)}"/>
      </linearGradient>
      <linearGradient id="${gid('foil')}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,.9)" stop-opacity=".9"/>
        <stop offset="40%" stop-color="${rgba(c1, .55)}"/>
        <stop offset="70%" stop-color="rgba(255,255,255,.15)"/>
        <stop offset="100%" stop-color="${rgba(c1, .7)}"/>
      </linearGradient>
      <linearGradient id="${gid('edge')}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${rgba(c1, .85)}"/>
        <stop offset="45%" stop-color="${rgba(c2, .28)}"/>
        <stop offset="100%" stop-color="${rgba(c1, .6)}"/>
      </linearGradient>
      <linearGradient id="${gid('name')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="55%" stop-color="#fdf4e2"/>
        <stop offset="100%" stop-color="${rgb(c1)}"/>
      </linearGradient>
      <filter id="${gid('glow')}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;
  }

  function renderCard(power, opts) {
    opts = opts || {};
    const id = opts.id || `sp${++uid}`;
    const { c1, c2, c3 } = power;
    const gid = k => `${id}-${k}`;
    const padded = String(power.n).padStart(2, '0');

    /* The card is 420 units wide; the eyebrow has ~268 units before it
       reaches the right-aligned NO. NN label. Measured, not guessed. */
    const eyebrow = opts.brand || 'KOMYU KUMUSTAHAN';
    const eyebrowSize = eyebrow.length > 12 ? 7.6 : 8.6;
    const eyebrowTrack = eyebrow.length > 12 ? 1.8 : 3.4;

    if (opts.artOnly) {
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
                   class="card__svg" aria-hidden="true" focusable="false">
        ${defs(power, id)}
        ${art(power, id)}
        <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="26" fill="none"
              stroke="url(#${gid('edge')})" stroke-width="1.2" opacity=".8"/>
      </svg>`;
    }

    /* bottom block is anchored to the card edge and grows upward,
       so the card stays balanced whatever the description length */
    const descLines = wrap(power.desc, 46).slice(0, 3);
    const descGap = 21;
    const L = layout(descLines.length);
    const descTspans = descLines.map((l, i) =>
      `<tspan x="${W / 2}" dy="${i === 0 ? 0 : descGap}">${esc(l)}</tspan>`).join('');

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
                 class="card__svg" role="img"
                 aria-label="${esc(power.name)}, ${esc(power.title)}. Domain: ${esc(power.domain)}. ${esc(power.desc)}"
                 focusable="false">
      ${defs(power, id)}

      <!-- body -->
      <g>
        ${art(power, id)}
        <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="26" fill="none"
              stroke="url(#${gid('edge')})" stroke-width="1.4"/>
        ${corners(rgba(c1, .38))}
      </g>

      <!-- header -->
      <g font-family="Inter, system-ui, sans-serif" font-size="${eyebrowSize}" font-weight="600"
         letter-spacing="${eyebrowTrack}" fill="${rgba(c1, .78)}">
        <text x="44" y="54">${eyebrow}</text>
        <text x="${W - 44}" y="54" text-anchor="end" fill="rgba(255,255,255,.4)">NO. ${padded}</text>
      </g>
      <path d="M44 66 H${W - 44}" stroke="rgba(255,255,255,.12)" stroke-width="1"/>

      <!-- name -->
      <text x="${W / 2}" y="${L.name}" text-anchor="middle" font-family="Cinzel, Georgia, serif"
            font-size="50" font-weight="600" letter-spacing="3" fill="url(#${gid('name')})">
        ${esc(power.name)}
      </text>

      <!-- divider ornament -->
      <g stroke="${rgba(c1, .55)}" stroke-width="1" fill="none">
        <path d="M110 ${L.rule} H198 M222 ${L.rule} H310"/>
        <path d="M210 ${L.rule - 5.5} l5.5 5.5 -5.5 5.5 -5.5 -5.5 Z" fill="${rgba(c1, .9)}" stroke="none"/>
      </g>

      <!-- epithet -->
      <text x="${W / 2}" y="${L.title}" text-anchor="middle" font-family="Cormorant, Georgia, serif"
            font-style="italic" font-size="26" fill="${rgba(c1, .95)}">
        ${esc(power.title)}
      </text>

      <!-- description -->
      <text x="${W / 2}" y="${L.desc}" text-anchor="middle"
            font-family="Inter, system-ui, sans-serif" font-size="13.2"
            fill="rgba(238,235,228,.82)" letter-spacing=".1">${descTspans}</text>

      <!-- domain seal -->
      <g>
        <path d="M92 ${L.sealRule} H${W / 2 - 58} M${W / 2 + 58} ${L.sealRule} H${W - 92}"
              stroke="${rgba(c1, .3)}" stroke-width="1"/>
        <text x="${W / 2}" y="${L.seal}" text-anchor="middle"
              font-family="Inter, system-ui, sans-serif"
              font-size="10.2" font-weight="600" letter-spacing="4.4" fill="${rgba(c1, .9)}">
          ${esc(power.domain)}
        </text>
      </g>
    </svg>`;
  }

  /* the wrap attribute we use for desc is approximate; expose it for tests */
  return { renderCard, wrap, W, H };
});
