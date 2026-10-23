import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const base = resolve(root);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const server = createServer(async (request, response) => {
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:3002').pathname);
    const target = resolve(base, '.' + (path === '/' ? '/index.html' : path));
    if (!target.startsWith(base + sep) || !mime[extname(target)]) {
      response.writeHead(404).end('Not found');
      return;
    }
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': mime[extname(target)] });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(3002, '127.0.0.1', () => console.log('Samal public-demo preview: http://127.0.0.1:3002'));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
