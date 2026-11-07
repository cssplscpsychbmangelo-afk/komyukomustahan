#!/usr/bin/env node
/* Zero-dependency static server for the SUPERPOWER activity.
   Usage: node serve.js [port]   (default 8000)
   Binds 0.0.0.0 so it works behind a proxy/preview host. */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.argv[2] || process.env.PORT || 8000);
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return send(res, 400, 'Bad request');
  }

  if (pathname === '/') pathname = '/index.html';

  // resolve inside ROOT only
  const target = path.join(ROOT, path.normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!target.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  fs.readFile(target, (err, buf) => {
    if (err) {
      if (err.code === 'ENOENT' && !path.extname(target)) {
        return fs.readFile(target + '.html', (e2, buf2) => {
          if (e2) return send(res, 404, 'Not found');
          send(res, 200, buf2, MIME['.html']);
        });
      }
      return send(res, 404, 'Not found');
    }
    send(res, 200, buf, MIME[path.extname(target).toLowerCase()] || 'application/octet-stream');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`SUPERPOWER running at http://localhost:${PORT} (bound ${HOST})`);
});
