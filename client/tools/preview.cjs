#!/usr/bin/env node
/* Local preview server for the built client.
 *
 * Serves ./dist (or --dist <path>) and proxies /api to a locally running API,
 * so the production bundle can be driven without touching the deployed site.
 *
 * Binds 0.0.0.0 on purpose: the client falls back to http://localhost:5000/api
 * whenever the page origin is localhost or 127.0.0.1, and macOS AirPlay already
 * holds port 5000. Reaching it on the LAN address instead makes the client use
 * its origin-relative /api path, which this proxies.
 *
 *   node tools/preview.cjs --dist /path/to/dist --api 5099 --port 8099
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const arg = (name, fallback) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const DIST = path.resolve(arg('dist', path.join(__dirname, '..', 'dist')));
const API_PORT = Number(arg('api', 5099));
const PORT = Number(arg('port', 8099));

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json',
  '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp'
};

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const p = http.request(
      { host: '127.0.0.1', port: API_PORT, path: req.url, method: req.method, headers: req.headers },
      (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); }
    );
    p.on('error', (e) => { res.writeHead(502); res.end(String(e.message)); });
    req.pipe(p);
    return;
  }
  const clean = req.url.split('?')[0];
  let file = path.join(DIST, clean === '/' ? 'index.html' : clean);
  // SPA fallback: unknown paths are client routes, not missing files.
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  // index.html must never be cached, or the browser keeps asking for chunk
  // filenames from a previous build that no longer exist on disk. Hashed assets
  // are safe to cache forever precisely because their name changes on rebuild.
  const isHtml = path.extname(file) === '.html';
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': isHtml ? 'no-cache, must-revalidate' : 'public, max-age=31536000, immutable'
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`preview  dist=${DIST}  api=127.0.0.1:${API_PORT}  http://0.0.0.0:${PORT}`);
});
