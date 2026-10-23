import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = resolve(root, 'source');
const dist = resolve(root, 'dist');
if (relative(root, dist) !== 'dist' || !dist.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('Refusing unsafe output directory.');
const read = file => readFileSync(resolve(source, file), 'utf8').replaceAll('\r\n', '\n');
function replaceOnce(content, before, after, label) {
  const matches = typeof before === 'string' ? content.split(before).length - 1 : [...content.matchAll(new RegExp(before.source, before.flags.includes('g') ? before.flags : before.flags + 'g'))].length;
  if (matches !== 1) throw new Error(`${label}: expected exactly one source match, found ${matches}`);
  return content.replace(before, () => after);
}

// Retain every domain method, changing only Node imports, the constructor and persistence.
let store = read('domain/store.mjs').replace(/^import .*;\n/gm, '');
const constructorStart = store.indexOf('  constructor(path, now = () => new Date(), { presentation = false } = {}) {');
const transactionStart = store.indexOf('  transaction(mutate) {');
if (constructorStart < 0 || transactionStart < constructorStart) throw new Error('Store constructor boundaries changed. Review the adapter.');
const browserConstructor = `  constructor(storage, key, now = () => new Date()) {
    this.storage = storage;
    this.key = key;
    this.now = now;
    const saved = storage.getItem(key);
    if (saved) {
      this.state = JSON.parse(saved);
      if (this.state.schemaVersion !== 2 || !['tours', 'bookings', 'sessions', 'events', 'inquiries'].every(key => Array.isArray(this.state[key]))) {
        throw new Error('Unsupported browser demo data.');
      }
    } else {
      this.state = { schemaVersion: 2, tours: seedCatalog({ futureFrom: this.now() }), bookings: [], sessions: [], events: [], inquiries: [] };
      this.persist(this.state);
    }
  }

  persist(state) { this.storage.setItem(this.key, JSON.stringify(state)); }

`;
store = store.slice(0, constructorStart) + browserConstructor + store.slice(transactionStart);
store = store.replace('A single-process local demo store. Transactions are synchronous and commit by atomic rename.', 'Browser-session demo store. Original business rules, with session storage persistence.');
store = store.replace('failed validation or disk writes cannot partially mutate memory.', 'failed validation cannot partially mutate memory.');
const cryptoHelpers = `const randomUUID = () => globalThis.crypto.randomUUID();
const randomBytes = size => ({ toString: () => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(size)), byte => byte.toString(16).padStart(2, '0')).join('') });\n`;
const runtime = cryptoHelpers + read('domain/catalog.mjs') + '\n' + store + '\n' + read('demo-api.mjs');
if (/from ['"]node:|process\.|\bfetch\s*\(/.test(runtime)) throw new Error('Runtime still contains a Node or network dependency.');

let app = read('public/app.js');
app = replaceOnce(app, /^async function api\(path,options=\{\}\).*$/m,
  'async function api(path,options={}){return window.SamalDemo.request(path,options);}', 'Explicit browser API entrypoint');
app = replaceOnce(app, "const checkoutStorageKey = 'qazaqpass.checkoutDraft.v1';", 'const checkoutStorageKey = window.SamalDemo.checkoutKey;', 'Checkout namespace');
app = app.replaceAll('sessionStorage.', 'window.SamalDemo.storage.');
app = app.replaceAll('this local demo', 'this browser session demo').replaceAll('this local demonstration', 'this browser session demonstration').replaceAll('LOCAL DEMO', 'BROWSER DEMO').replaceAll('Local simulation', 'Browser simulation');
app = app.replaceAll('local catalog', 'browser-session catalog');
app = replaceOnce(app, /^function about\(\).*$/m, read('hosted-about.txt').trim(), 'Hosted About page');
app += `\nwindow.addEventListener('samal:reset',()=>{Object.assign(state,{tours:[],matches:null,draft:null,adminKey:'',bookingKey:null,bookingKeyFor:null,checkoutDraft:null,checkoutReviewKey:null});location.hash='#home';void render();});\n`;

let editorial = read('public/editorial.js');
editorial = editorial.replace('The traveler and operator views use the same local application.', 'The traveler and operator views share only your browser session. Other visitors have their own demo.');
editorial = replaceOnce(editorial,
  'Stop the presentation server, run <code>npm run demo:reset</code>, then <code>npm run demo</code>. The reset backs up only the dedicated presentation data and refuses while its server is running. Ordinary demo bookings are kept separate.',
  'Use Reset my demo below or in the top notice to remove your demo bookings, questions, catalog edits and draft details. This affects only this app in this browser tab. A fresh session has future sample departures. <button class="button secondary small" type="button" data-reset-demo>Reset my demo</button>', 'Hosted reset guide');
editorial = editorial.replace('The operator’s default local access code is', 'Enter the public sandbox toggle').replace('This is demonstration access, not production authentication.', 'It opens only your own browser-session workspace; it is not a password or production authentication. Changes persist across reloads while session storage is available. Closing the tab normally ends this session; browser tab restoration may restore it.');
editorial = editorial.replace('assets/attribution.md', 'credits/attribution.md');

let operator = read('public/operator.js');
operator = operator.replaceAll('local demonstration', 'browser session demo').replaceAll('this local demo', 'this browser session demo').replaceAll('the local demo', 'this browser session');
operator = operator.replace('Use your configured local operator access code to review bookings, keep the catalog accurate, and answer traveler questions.', 'Enter <code>local-demo-only</code> to try the operator sandbox. You can edit only the synthetic bookings, catalog and questions in your own browser session.');
operator = operator.replace('Local demo access only. The key stays in memory for this tab.', 'This public demo toggle is not production authentication. No changes or messages are sent to an operator.');
operator = operator.replace('<span>Access code</span>', '<span>Demo toggle · local-demo-only</span>').replace('name="key" type="password"', 'name="key" type="text"');

let html = read('public/index.html').replaceAll('Local demonstration', 'Browser session demonstration');
html = replaceOnce(html, '<script src="/operator.js" defer>', '<link rel="stylesheet" href="/hosted.css"><script src="/hosted-runtime.js" defer></script><script src="/operator.js" defer>', 'Hosted runtime load order');
html = replaceOnce(html, '<div class="demo-strip">A working travel demo <span>·</span> Sample tours & prices. No real bookings or payments.</div>',
  '<div class="demo-strip hosted-demo-strip"><span id="session-demo-notice" role="status">Browser session demo · Entries stay in this tab. No real bookings or payments.</span><button type="button" class="hosted-reset" data-reset-demo>Reset my demo</button></div>', 'Hosted disclosure strip');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(resolve(source, 'public'), dist, { recursive: true });
cpSync(resolve(source, 'credits'), resolve(dist, 'credits'), { recursive: true });
writeFileSync(resolve(dist, 'hosted-runtime.js'), '(function(){\n"use strict";\n' + runtime.replace(/^export /gm, '') + '\n' + read('browser-bootstrap.js') + '\n})();\n');
// This identical module is used by Node's behavioral tests, with no bootstrap or DOM dependency.
mkdirSync(resolve(root, '.generated'), { recursive: true });
writeFileSync(resolve(root, '.generated', 'runtime.mjs'), runtime);
for (const [name, content] of Object.entries({ 'app.js': app, 'operator.js': operator, 'editorial.js': editorial, 'index.html': html, 'hosted.css': read('hosted.css') })) writeFileSync(resolve(dist, name), content);
function inventory(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(item => {
    const path = resolve(directory, item.name);
    const name = prefix + item.name;
    if (item.isDirectory()) return inventory(path, name + '/');
    if (!item.isFile()) throw new Error('Source/output must contain only regular files.');
    return [{ path: name, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }];
  });
}
writeFileSync(resolve(root, '.generated', 'build-evidence.json'), JSON.stringify({ source: inventory(source), output: inventory(dist) }, null, 2) + '\n');
console.log(`Built ${inventory(dist).length} static files. Browser-only demo; no server API or runtime records copied.`);
