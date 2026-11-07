/* ============================================================
   Export — turns a card into a standalone, portable file.

   The card SVG normally borrows the page's fonts. For a download it
   has to carry them itself, so the fonts are fetched from our own
   folder, base64'd, and injected as @font-face rules. The result is
   one self-contained SVG that looks right anywhere — no page, no
   server, no internet.

   Exposed as window.EXPORT (also require()able for tests).
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.EXPORT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* only what the card actually draws with */
  const FONTS = [
    ['Cinzel', 'fonts/cinzel-latin-600-normal.woff2', 'normal', '600'],
    ['Cormorant', 'fonts/cormorant-garamond-latin-300-italic.woff2', 'italic', '300'],
    ['Inter', 'fonts/inter-latin-400-normal.woff2', 'normal', '400'],
    ['Inter', 'fonts/inter-latin-600-normal.woff2', 'normal', '600']
  ];

  const MIME = 'font/woff2';
  const SCALE_W = 840;
  const SCALE_H = 1176;

  function toBase64(bytes, btoaImpl) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    if (btoaImpl) return btoaImpl(bin);
    if (typeof btoa === 'function') return btoa(bin);
    return Buffer.from(bytes).toString('base64');
  }

  /**
   * Build a self-contained SVG for one power.
   * @param {object} power   entry from SUPERPOWERS.POWERS
   * @param {object} cards   the CARDS renderer
   * @param {object} opts    { fetchImpl, btoaImpl, id }
   * @returns {Promise<string>} svg markup
   */
  async function buildSvg(power, cards, opts) {
    opts = opts || {};
    const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch : null);
    const id = opts.id || 'export';

    let css = '';
    if (fetchImpl) {
      try {
        const rules = await Promise.all(FONTS.map(async ([family, path, style, weight]) => {
          const res = await fetchImpl(path);
          if (!res || !res.ok) throw new Error('font ' + path + ' unavailable');
          const bytes = new Uint8Array(await res.arrayBuffer());
          return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};` +
                 `src:url(data:${MIME};base64,${toBase64(bytes, opts.btoaImpl)}) format('woff2');}`;
        }));
        css = rules.join('');
      } catch (e) {
        css = ''; // unembedded: the viewer substitutes its own serif/sans
      }
    }

    const body = cards.renderCard(power, { id });
    const style = `<style type="text/css"><![CDATA[
${css}
text{font-kerning:normal}
]]></style>`;

    /* inject the style right after the opening tag, and give the file a
       fixed intrinsic size so it doesn't fall back to 300x150 anywhere */
    return body
      .replace(/<svg\b/, `<svg width="${SCALE_W}" height="${SCALE_H}"`)
      .replace(/(<svg[^>]*>)/, `$1${style}`);
  }

  /* Rasterise an SVG string to a PNG blob URL, for easy sharing. */
  function toPng(svgString, w, h, scale) {
    return new Promise(resolve => {
      if (typeof document === 'undefined' || typeof Image === 'undefined') return resolve(null);
      scale = scale || 2;
      const img = new Image();
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w * scale;
          canvas.height = h * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  return { buildSvg, toPng, FONTS };
});
