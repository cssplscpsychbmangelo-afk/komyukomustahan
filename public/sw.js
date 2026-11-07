/* ============================================================
   Service worker — keeps the activity usable with no connection.
   Everything it needs is small enough to precache in one go, so a
   session never breaks because the venue wifi did.

   Bump VERSION whenever a cached file changes.
   ============================================================ */
'use strict';

const VERSION = 'superpower-v1';

const ASSETS = [
  'index.html',
  'gallery.html',
  'guide.html',
  'styles.css',
  'card.css',
  'superpowers.js',
  'sigils.js',
  'cards.js',
  'export.js',
  'app.js',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'fonts/cinzel-latin-400-normal.woff2',
  'fonts/cinzel-latin-600-normal.woff2',
  'fonts/cinzel-latin-700-normal.woff2',
  'fonts/cormorant-garamond-latin-300-italic.woff2',
  'fonts/cormorant-garamond-latin-400-italic.woff2',
  'fonts/inter-latin-400-normal.woff2',
  'fonts/inter-latin-500-normal.woff2',
  'fonts/inter-latin-600-normal.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* cache-first: the app is static, so a hit is always correct */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        /* offline and not cached: fall back to the play screen */
        if (req.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
