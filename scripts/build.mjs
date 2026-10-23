import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const relative of ['server.mjs', 'lib/catalog.mjs', 'lib/store.mjs', 'public/app.js', 'public/operator.js', 'public/editorial.js', 'scripts/demo.mjs']) {
  const check = spawnSync(process.execPath, ['--check', resolve(root, relative)], { encoding: 'utf8' });
  if (check.status !== 0) {
    process.stderr.write(check.stderr || `Syntax check failed: ${relative}\n`);
    process.exit(1);
  }
}
for (const relative of ['public/index.html', 'public/styles.css', 'public/operator.css', 'public/editorial.css', 'public/typography.css']) {
  if (!existsSync(resolve(root, relative)) || !readFileSync(resolve(root, relative), 'utf8').trim()) {
    throw new Error(`Missing or empty application asset: ${relative}`);
  }
}
const target = resolve(root, 'dist');
mkdirSync(target, { recursive: true });
for (const relative of ['public', 'lib', 'scripts', 'server.mjs', 'package.json', 'package-lock.json']) {
  cpSync(resolve(root, relative), resolve(target, relative), { recursive: true });
}
writeFileSync(resolve(target, 'BUILD.txt'), 'Samal Journey local demonstration bundle. Run node server.mjs here. No public deployment or real payment integration.\n');
console.log('Build passed: syntax checked; runnable local bundle written to dist/. Browser behavior is verified separately.');
