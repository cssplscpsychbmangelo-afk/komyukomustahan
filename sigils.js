/* ============================================================
   Sigils — one line-art glyph per superpower.
   Each is inner SVG markup drawn in a 0 0 100 100 viewBox.
   Strokes inherit `currentColor`, so the card renderer can tint
   a sigil with that power's elemental colour.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SIGILS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const dots = (pts, r) => pts.map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="${r || 1.4}" opacity="${i % 2 ? 0.55 : 0.9}"/>`).join('');

  const S = {};

  /* 01 AEGIS — shielding dome over a small figure */
  S.shield = `
    <path d="M50 12 L80 24 V50 C80 68 66 80 50 88 C34 80 20 68 20 50 V24 Z" opacity="0.9"/>
    <path d="M50 22 L71 31 V50 C71 63 61 72 50 78 C39 72 29 63 29 50 V31 Z" opacity="0.45"/>
    <path d="M50 22 V78 M29 46 H71" opacity="0.22"/>
    <path d="M14 50 H6 M94 50 H86 M50 94 V99" opacity="0.5"/>
    <g fill="currentColor" stroke="none">${dots([[50, 50]], 3.4)}</g>
    <path d="M34 88 Q50 96 66 88" opacity="0.35"/>`;

  /* 02 CHRONOS — a clock face coming apart into fragments */
  S.clock = `
    <circle cx="48" cy="52" r="27" opacity="0.9"/>
    <path d="M48 34 V52 L60 59" opacity="0.95"/>
    <path d="M48 25 V28 M48 76 V79 M21 52 H24 M72 52 H75" opacity="0.5"/>
    <path d="M28 32 L30 34 M66 70 L68 72 M68 32 L66 34 M30 70 L28 72" opacity="0.3"/>
    <path d="M82 20 A9 9 0 0 1 90 30" opacity="0.7"/>
    <path d="M86 44 A7 7 0 0 1 92 50" opacity="0.4"/>
    <path d="M14 72 A8 8 0 0 0 20 84" opacity="0.55"/>
    <g fill="currentColor" stroke="none">${dots([[84, 62], [16, 28], [78, 88], [63, 14]], 1.6)}</g>`;

  /* 03 VITALIS — a hand cupping a heart that grows into a bloom */
  S.bloom = `
    <path d="M50 62 C38 54 30 46 30 38 C30 31 36 27 41 30 C45 32 48 37 50 41 C52 37 55 32 59 30 C64 27 70 31 70 38 C70 46 62 54 50 62 Z" opacity="0.9"/>
    <path d="M22 66 Q50 92 78 66" opacity="0.55"/>
    <path d="M50 66 V80" opacity="0.4"/>
    <path d="M31 20 A5 5 0 0 1 41 22" opacity="0.6"/>
    <path d="M68 22 A5 5 0 0 1 78 18" opacity="0.45"/>
    <path d="M12 44 A6 6 0 0 1 20 40" opacity="0.35"/>
    <path d="M84 40 A6 6 0 0 0 92 46" opacity="0.35"/>
    <g fill="currentColor" stroke="none">${dots([[16, 26], [86, 24], [50, 12]], 1.7)}</g>`;

  /* 04 SONORA — sound rings pushing out from a voice */
  S.wave = `
    <circle cx="26" cy="50" r="5" fill="currentColor" stroke="none" opacity="0.95"/>
    <path d="M38 34 A22 22 0 0 1 38 66" opacity="0.9"/>
    <path d="M48 24 A35 35 0 0 1 48 76" opacity="0.65"/>
    <path d="M58 15 A48 48 0 0 1 58 85" opacity="0.42"/>
    <path d="M67 9 A58 58 0 0 1 67 91" opacity="0.22"/>
    <path d="M14 30 V70" opacity="0.3"/>`;

  /* 05 VERDANT — a sprout with roots and a flower */
  S.sprout = `
    <path d="M50 88 V44" opacity="0.9"/>
    <path d="M50 62 C40 62 30 56 26 46 C38 42 48 48 50 58" opacity="0.95"/>
    <path d="M50 54 C60 54 71 47 74 37 C62 33 52 40 50 50" opacity="0.85"/>
    <circle cx="50" cy="34" r="9" opacity="0.9"/>
    <path d="M50 25 V19 M50 43 V49 M41 34 H35 M59 34 H65" opacity="0.45"/>
    <path d="M50 88 C42 92 34 92 28 88 M50 88 C58 92 66 92 72 88" opacity="0.4"/>
    <g fill="currentColor" stroke="none">${dots([[20, 24], [82, 58], [76, 20]], 1.6)}</g>`;

  /* 06 WARP — a portal ring with stars falling through */
  S.portal = `
    <ellipse cx="50" cy="50" rx="26" ry="34" opacity="0.9"/>
    <ellipse cx="50" cy="50" rx="16" ry="24" opacity="0.55"/>
    <ellipse cx="50" cy="50" rx="6" ry="12" opacity="0.9" fill="currentColor" stroke="none"/>
    <path d="M24 38 Q50 30 76 38 M24 62 Q50 70 76 62" opacity="0.3"/>
    <g fill="currentColor" stroke="none">${dots([[18, 28], [82, 32], [14, 66], [86, 68], [50, 8], [50, 92]], 1.8)}</g>
    <path d="M78 42 A10 10 0 0 1 84 34" opacity="0.5"/>`;

  /* 07 VERITAS — an eye with rays and a cracked mirror */
  S.eye = `
    <path d="M14 50 C28 32 72 32 86 50 C72 68 28 68 14 50 Z" opacity="0.9"/>
    <circle cx="50" cy="50" r="10" opacity="0.95"/>
    <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none"/>
    <path d="M50 9 V18 M50 82 V91 M14 30 L21 35 M86 30 L79 35 M14 70 L21 65 M86 70 L79 65" opacity="0.45"/>
    <path d="M34 24 L30 14 M66 24 L70 14" opacity="0.3"/>`;

  /* 08 IGNIS — rising phoenix wings made of flame */
  S.phoenix = `
    <path d="M50 84 C46 70 40 62 30 58 C36 56 44 58 50 64 C56 58 64 56 70 58 C60 62 54 70 50 84 Z" opacity="0.9"/>
    <path d="M50 64 C38 56 28 40 26 20 C38 28 48 40 50 56" opacity="0.8"/>
    <path d="M50 64 C62 56 72 40 74 20 C62 28 52 40 50 56" opacity="0.8"/>
    <path d="M50 56 C46 44 46 30 50 16 C54 30 54 44 50 56" opacity="0.55"/>
    <path d="M20 62 C14 56 12 44 16 34" opacity="0.4"/>
    <path d="M80 62 C86 56 88 44 84 34" opacity="0.4"/>
    <g fill="currentColor" stroke="none">${dots([[30, 76], [70, 76], [50, 92], [22, 84], [78, 84]], 1.5)}</g>`;

  /* 09 NEXUS — five people joined into one constellation */
  S.weave = `
    <path d="M50 22 L78 43 L68 76 L32 76 L22 43 Z" opacity="0.62"/>
    <path d="M50 22 L68 76 M78 43 L32 76 M68 76 L22 43 M32 76 L78 43" opacity="0.26"/>
    <path d="M50 52 L50 22 M50 52 L78 43 M50 52 L68 76 M50 52 L32 76 M50 52 L22 43" opacity="0.5"/>
    <circle cx="50" cy="52" r="5" fill="currentColor" stroke="none"/>
    <circle cx="50" cy="22" r="5.5" opacity="0.95"/>
    <circle cx="78" cy="43" r="5.5" opacity="0.95"/>
    <circle cx="68" cy="76" r="5.5" opacity="0.95"/>
    <circle cx="32" cy="76" r="5.5" opacity="0.95"/>
    <circle cx="22" cy="43" r="5.5" opacity="0.95"/>
    <g fill="currentColor" stroke="none">${dots([[50, 8], [92, 30], [80, 92], [20, 92], [8, 30]], 1.4)}</g>`;

  /* 10 AETHER — two spread wings lifting free of the ground */
  S.wing = `
    <path d="M47 62 C40 46 30 33 12 21 C16 30 17 37 16 44 C21 41 26 41 29 43 C27 48 27 52 29 56 C33 53 37 53 40 55 C40 58 43 60 47 62 Z" opacity="0.92"/>
    <path d="M53 62 C60 46 70 33 88 21 C84 30 83 37 84 44 C79 41 74 41 71 43 C73 48 73 52 71 56 C67 53 63 53 60 55 C60 58 57 60 53 62 Z" opacity="0.92"/>
    <path d="M50 60 V74" opacity="0.5"/>
    <path d="M30 80 Q50 72 70 80" opacity="0.45"/>
    <path d="M22 68 l-5 -5 M78 68 l5 -5" opacity="0.3"/>
    <g fill="currentColor" stroke="none">${dots([[50, 12], [16, 62], [84, 62]], 1.5)}</g>`;

  /* 11 EMPATHIA — overlapping hearts inside a listening ring */
  S.heart = `
    <path d="M50 76 C34 64 24 54 24 44 C24 36 31 31 37 35 C42 38 47 45 50 50 C53 45 58 38 63 35 C69 31 76 36 76 44 C76 54 66 64 50 76 Z" opacity="0.95"/>
    <path d="M50 62 C40 54 34 48 34 42 C34 37 39 34 43 37" opacity="0.35"/>
    <path d="M22 50 A32 32 0 0 1 50 16" opacity="0.35"/>
    <path d="M78 50 A32 32 0 0 1 50 84" opacity="0.35"/>
    <g fill="currentColor" stroke="none">${dots([[18, 26], [82, 26], [50, 90]], 1.6)}</g>`;

  /* 12 VOLT — a bolt inside a breaking ring */
  S.bolt = `
    <path d="M56 12 L34 54 H48 L42 88 L70 42 H54 L60 12 Z" opacity="0.95"/>
    <path d="M20 34 A34 34 0 0 1 38 14" opacity="0.5"/>
    <path d="M82 66 A34 34 0 0 1 64 86" opacity="0.5"/>
    <path d="M16 66 L24 58 M84 34 L76 42" opacity="0.35"/>`;

  /* 13 ATLAS — stone lifted clear of the ground */
  S.monolith = `
    <rect x="38" y="14" width="26" height="17" rx="2.5" opacity="0.9"/>
    <rect x="18" y="40" width="22" height="15" rx="2.5" opacity="0.72"/>
    <rect x="60" y="36" width="24" height="18" rx="2.5" opacity="0.6"/>
    <rect x="40" y="64" width="22" height="14" rx="2.5" opacity="0.45"/>
    <path d="M12 88 Q50 74 88 88" opacity="0.55"/>
    <path d="M12 88 Q50 78 88 88" opacity="0.22"/>
    <path d="M28 60 l-7 -7 M72 60 l7 -7 M50 58 V50" opacity="0.32"/>
    <g fill="currentColor" stroke="none">${dots([[14, 26], [86, 22]], 1.5)}</g>`;

  /* 14 ORACLE — timelines branching from an open hand */
  S.thread = `
    <path d="M20 82 C34 76 40 68 46 56 C50 48 54 40 60 30 C64 22 70 16 78 12" opacity="0.9"/>
    <path d="M46 56 C52 48 62 46 74 48" opacity="0.65"/>
    <path d="M46 56 C44 44 46 34 52 24" opacity="0.5"/>
    <path d="M46 56 C36 50 28 40 24 28" opacity="0.35"/>
    <g fill="currentColor" stroke="none">${dots([[78, 12], [74, 48], [52, 24], [24, 28]], 2)}</g>
    <path d="M20 82 H84" opacity="0.25" stroke-dasharray="3 5"/>`;

  /* 15 LUMEN — a radiant star seeding smaller stars */
  S.star = `
    <path d="M50 22 L55 45 L78 50 L55 55 L50 78 L45 55 L22 50 L45 45 Z" opacity="0.95"/>
    <circle cx="50" cy="50" r="6" fill="currentColor" stroke="none" opacity="0.8"/>
    <path d="M50 10 V18 M50 82 V90 M10 50 H18 M82 50 H90" opacity="0.4"/>
    <g fill="currentColor" stroke="none">${dots([[20, 22], [80, 22], [20, 78], [80, 78]], 1.6)}</g>
    <path d="M30 90 Q50 84 70 90" opacity="0.3"/>`;

  /* 16 NOVA — a shattering ring re-forming into something new */
  S.nova = `
    <circle cx="50" cy="50" r="14" fill="currentColor" stroke="none" opacity="0.9"/>
    <circle cx="50" cy="50" r="24" opacity="0.7"/>
    <circle cx="50" cy="50" r="34" opacity="0.32" stroke-dasharray="6 7"/>
    <path d="M50 8 L50 22 M50 78 L50 92 M8 50 L22 50 M78 50 L92 50" opacity="0.5"/>
    <path d="M22 22 L30 30 M78 22 L70 30 M22 78 L30 70 M78 78 L70 70" opacity="0.35"/>
    <ellipse cx="50" cy="50" rx="44" ry="12" opacity="0.25"/>`;

  return S;
});
