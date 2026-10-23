import { createServer } from 'node:net';
import { existsSync, copyFileSync, unlinkSync, lstatSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const presentationPath = resolve(root, '.runtime', 'presentation.json');

function assertPresentationPath(path) {
  if (basename(resolve(path)) !== 'presentation.json') throw new Error('Presentation data path must end in presentation.json.');
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error('Presentation data path cannot be a symbolic link.');
}

async function ensurePortFree(port) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Presentation port must be between 0 and 65535.');
  const probe = createServer();
  try {
    await new Promise((resolveReady, reject) => {
      probe.once('error', reject);
      probe.listen(port, '127.0.0.1', resolveReady);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') throw new Error(`Presentation port ${port} is occupied; stop the active server before resetting.`);
    throw error;
  } finally {
    if (probe.listening) await new Promise(resolveClosed => probe.close(resolveClosed));
  }
}

export async function resetPresentation({ path = presentationPath, port = 3001 } = {}) {
  assertPresentationPath(path);
  await ensurePortFree(port);
  if (!existsSync(path)) return { backupPath: null };
  const backupPath = `${path}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
  copyFileSync(path, backupPath);
  unlinkSync(path);
  return { backupPath };
}

export async function startPresentation({ path = presentationPath, port = 3001, now } = {}) {
  assertPresentationPath(path);
  await ensurePortFree(port);
  const server = createApp({ storePath: path, presentation: true, now });
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveReady);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === 'reset') {
    resetPresentation().then(({backupPath}) => console.log(backupPath
      ? `Presentation data backed up to ${backupPath}. A fresh store will be seeded on next launch.`
      : 'No presentation data exists. A fresh store will be seeded on next launch.')).catch(error => {
      console.error(error.message); process.exitCode = 1;
    });
  } else {
    startPresentation().then(server => console.log(`QazaqPass presentation: http://127.0.0.1:${server.address().port} (local only; synthetic data)`))
      .catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
