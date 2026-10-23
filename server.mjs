import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { Store, AppError } from './lib/store.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicRoot = resolve(root, 'public');
const BODY_LIMIT = 16384;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

function json(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function parseBody(request) {
  if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    request.resume();
    throw new AppError(415, 'Use application/json for API requests.');
  }
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    let failed = false;
    request.on('data', chunk => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        if (!failed) reject(new AppError(413, 'Request is too large.'));
        failed = true;
      } else if (!failed) chunks.push(chunk);
    });
    request.on('end', () => {
      if (failed) return;
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
        resolveBody(body);
      } catch { reject(new AppError(400, 'Send a valid JSON object.')); }
    });
    request.on('error', () => reject(new AppError(400, 'The request was interrupted.')));
  });
}

function validAdmin(request, key) {
  const provided = request.headers['x-admin-key'];
  if (typeof provided !== 'string' || !provided.length) return false;
  const expected = Buffer.from(key);
  const actual = Buffer.from(provided);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createApp({ storePath = resolve(root, '.runtime', 'qazaqpass.json'), adminKey = process.env.QAZAQPASS_ADMIN_KEY || 'local-demo-only', now } = {}) {
  const store = new Store(storePath, now);
  const server = createServer(async (request, response) => {
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'");
    try {
      const port = server.address()?.port;
      const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
      const host = request.headers.host;
      if (!allowedHosts.has(host)) throw new AppError(403, 'Use this demonstration through its local address.');
      const url = new URL(request.url, `http://${host}`);
      const path = url.pathname;
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
        if (request.headers.origin !== `http://${host}`) throw new AppError(403, 'Mutating requests must come from this local application.');
      }
      if (path.startsWith('/api/')) {
        if (path.startsWith('/api/admin') && !validAdmin(request, adminKey)) throw new AppError(401, 'A valid local demo operator key is required.');
        const candidate = request.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('qazaqpass_session='))?.slice('qazaqpass_session='.length);
        const session = store.session(candidate);
        if (session.fresh) response.setHeader('set-cookie', `qazaqpass_session=${session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
        if (request.method === 'GET' && path === '/api/health') return json(response, 200, { status: 'ok', demo: true });
        if (request.method === 'GET' && path === '/api/catalog') return json(response, 200, { tours: store.catalog() });
        if (request.method === 'POST' && path === '/api/match') return json(response, 200, store.match(await parseBody(request)));
        if (request.method === 'GET' && path === '/api/bookings') return json(response, 200, { bookings: store.bookings(session.id) });
        if (request.method === 'POST' && path === '/api/bookings') {
          const result = store.createBooking(await parseBody(request), session.id);
          return json(response, result.created ? 201 : 200, { booking: result.booking });
        }
        const bookingPath = path.match(/^\/api\/bookings\/([a-zA-Z0-9-]+)$/);
        if (request.method === 'GET' && bookingPath) return json(response, 200, { booking: store.booking(bookingPath[1], session.id) });
        const paymentPath = path.match(/^\/api\/bookings\/([a-zA-Z0-9-]+)\/payment$/);
        if (request.method === 'POST' && paymentPath) return json(response, 200, { booking: store.payment(paymentPath[1], session.id, await parseBody(request)) });
        if (request.method === 'GET' && path === '/api/admin') return json(response, 200, store.admin());
        const adminBookingPath = path.match(/^\/api\/admin\/bookings\/([a-zA-Z0-9-]+)$/);
        if (request.method === 'PATCH' && adminBookingPath) return json(response, 200, { booking: store.updateBooking(adminBookingPath[1], await parseBody(request)) });
        const adminTourPath = path.match(/^\/api\/admin\/tours\/([a-zA-Z0-9-]+)$/);
        if (request.method === 'PATCH' && adminTourPath) return json(response, 200, { tour: store.updateTour(adminTourPath[1], await parseBody(request)) });
        throw new AppError(404, 'API route not found.');
      }
      if (!['GET', 'HEAD'].includes(request.method)) throw new AppError(405, 'Method not allowed.');
      let decoded;
      try { decoded = decodeURIComponent(path); } catch { throw new AppError(400, 'Invalid path.'); }
      const file = resolve(publicRoot, '.' + (decoded === '/' ? '/index.html' : decoded));
      if (!file.startsWith(publicRoot + sep) || !MIME[extname(file)] || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
        throw new AppError(404, 'Page not found.');
      }
      response.writeHead(200, { 'content-type': MIME[extname(file)] });
      response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
    } catch (error) {
      if (response.headersSent) return response.end();
      const status = error instanceof AppError ? error.status : 500;
      json(response, status, { error: status === 500 ? 'The local demo could not complete this request. Please retry.' : error.message });
      if (status === 500) console.error('Local demo request failed:', error.message);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  const server = createApp({ storePath: process.env.QAZAQPASS_DATA_PATH ? resolve(process.env.QAZAQPASS_DATA_PATH) : undefined });
  server.listen(port, '127.0.0.1', () => console.log(`QazaqPass demo: http://127.0.0.1:${port} (local only; synthetic bookings and payments)`));
}
