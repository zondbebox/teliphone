import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { seedCatalog } from '../lib/catalog.mjs';

const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const catalog = () => seedCatalog().map(tour => ({ ...tour,
  departures: tour.departures.map(departure => ({ ...departure, available: departure.capacity })) }));
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Small DOM boundary for exercising the actual routing and form handlers. This does
// not replace the real-browser keyboard, layout and HTML parsing verification.
function harness(hash = '#home', respond = () => undefined) {
  class Element {
    innerHTML = '';
    textContent = '';
    children = [];
    classList = { remove() {} };
    querySelectorAll() { return []; }
    querySelector() { return this.children.find(child => child.role === 'alert') || null; }
    append(child) { this.children.push(child); }
    setAttribute(key, value) { this[key] = value; }
    focus() {}
    scrollIntoView() {}
  }
  class Form extends Element {
    constructor(id, values, dataset = {}) { super(); this.id = id; this.values = values; this.dataset = dataset; }
  }
  const main = new Element(), results = new Element(), toast = new Element();
  const handlers = new Map();
  const location = { hash };
  const calls = [];
  const context = vm.createContext({
    document: {
      querySelector(selector) {
        if (selector === '#main') return main;
        if (selector === '#toast') return toast;
        if (selector === '#match-results') return main.innerHTML.includes('id="match-results"') ? results : null;
        return new Element();
      },
      createElement: () => new Element(),
      addEventListener(name, callback) { handlers.set(name, [...(handlers.get(name) || []), callback]); },
    },
    HTMLFormElement: Form,
    FormData: class { constructor(form) { this.values = form.values; } *[Symbol.iterator]() { yield* Object.entries(this.values); } },
    location,
    window: { scrollTo() {}, addEventListener() {}, print() {} },
    crypto: { randomUUID },
    setTimeout: () => 0,
    console,
    async fetch(path, options = {}) {
      calls.push({ path, options });
      const result = await respond(path, options, calls.length);
      return { ok: true, json: async () => result ?? (path === '/api/catalog' ? { tours: catalog() } : {}) };
    },
  });
  vm.runInContext(source, context);
  return {
    main, results, location, calls,
    async ready() { await tick(); },
    async navigate(next) { location.hash = next; await vm.runInContext('render()', context); },
    async submit(id, values, dataset) {
      const form = new Form(id, values, dataset);
      for (const callback of handlers.get('submit') || []) await callback({ target: form, preventDefault() {} });
      assert.equal(form.children.filter(child => child.role === 'alert').length, 0,
        form.children.map(child => child.textContent).join('\n'));
    },
  };
}

function optionsFor(markup, name) {
  const select = markup.match(new RegExp(`<select\\b[^>]*name="${name}"[^>]*>([\\s\\S]*?)</select>`));
  assert.ok(select, `Select ${name} exists`);
  // Only start tags create options; attributes mistakenly placed on </option>
  // cannot create selectable choices. Real-browser checks validate the parser too.
  return [...select[1].matchAll(/<option\b([^>]*)>([^<]*)/g)].map(([, attrs, label]) => ({
    value: attrs.match(/\bvalue="([^"]*)"/)?.[1] ?? label.trim(),
    selected: /\bselected\b/.test(attrs), disabled: /\bdisabled\b/.test(attrs),
  }));
}

test('matching form exposes each supported city, interest and physical difficulty', async () => {
  const app = harness('#match');
  await app.ready();
  assert.deepEqual(optionsFor(app.main.innerHTML, 'city').map(option => option.value), ['any', 'Almaty', 'Astana', 'Shymkent']);
  assert.deepEqual(optionsFor(app.main.innerHTML, 'interest').map(option => option.value), ['any', 'nature', 'culture']);
  assert.deepEqual(optionsFor(app.main.innerHTML, 'difficulty').map(option => option.value), ['easy', 'moderate', 'challenging']);
  assert.equal(optionsFor(app.main.innerHTML, 'difficulty').find(option => option.selected)?.value, 'moderate');
});

test('a delayed passport response cannot replace the newer home route', async () => {
  const delayed = deferred();
  const tour = catalog()[0];
  const app = harness('#passport/demo-booking', path => path.startsWith('/api/bookings/') ? delayed.promise : undefined);
  await app.ready();
  await app.navigate('#home');
  const home = app.main.innerHTML;
  delayed.resolve({ booking: { id: 'demo-booking', reference: 'QP-DEMO', status: 'confirmed', party: 1,
    total: tour.price, tour, departure: tour.departures[0], guide: null, timeline: [] } });
  await tick();
  assert.equal(app.location.hash, '#home');
  assert.ok(app.main.innerHTML === home, 'The latest route must retain its content after an older booking response');
});

test('a failed old booking request cannot replace the current route with an error page', async () => {
  const delayed = deferred();
  const app = harness('#passport/demo-booking', path => path.startsWith('/api/bookings/') ? delayed.promise : undefined);
  await app.ready();
  await app.navigate('#home');
  const home = app.main.innerHTML;
  delayed.reject(new Error('Old request failed'));
  await tick();
  assert.equal(app.location.hash, '#home');
  assert.ok(app.main.innerHTML === home, 'An error from a previous route must not replace the active page');
});

test('opening a match retains its valid departure and requested party size', async () => {
  const tour = catalog().find(tour => tour.id === 'burabay');
  const matched = { ...tour, departures: [tour.departures[1]] };
  const app = harness('#match', path => path === '/api/match' ? { tours: [matched], explanation: 'Fits all constraints.' } : undefined);
  await app.ready();
  await app.submit('match-form', { startDate: '2026-11-14', endDate: '2026-11-15', party: '3', budget: '60000',
    city: 'Astana', interest: 'nature', difficulty: 'easy' });
  const href = app.results.innerHTML.match(/href="(#[^"]*burabay[^"]*)"/)?.[1];
  assert.ok(href, 'A matching tour can be opened');
  await app.navigate(href);
  const departures = optionsFor(app.main.innerHTML, 'departureId');
  assert.equal((departures.find(option => option.selected) || departures.find(option => !option.disabled))?.value,
    tour.departures[1].id, 'Opening a match must not default to a departure outside the requested date range');
  const party = app.main.innerHTML.match(/<input\b(?=[^>]*name="party")[^>]*\bvalue="([^"]*)"/);
  assert.equal(party?.[1], '3', 'The requested party size must survive opening the matched tour');
});

test('a stale catalog response cannot change the price submitted from an already displayed checkout', async () => {
  const delayed = deferred();
  let catalogRequests = 0, submitted;
  const original = catalog();
  const changed = catalog();
  changed[0].price = 65000;
  changed[0].version = 2;
  const app = harness('#tours', (path, options) => {
    if (path === '/api/catalog') return ++catalogRequests === 1 ? delayed.promise : { tours: original };
    if (path === '/api/bookings') { submitted = JSON.parse(options.body); return { booking: { id: 'demo-created' } }; }
  });
  await app.ready();
  await app.navigate('#checkout/charyn');
  assert.ok(app.main.innerHTML.includes('58,000 KZT'), 'Checkout displays the original reviewed price');
  delayed.resolve({ tours: changed });
  await tick();
  await app.submit('checkout-form', { name: 'Alex Demo', email: 'alex@example.com', acceptedTerms: 'on' }, { tour: 'charyn' });
  assert.equal(submitted.quotedPrice, 58000, 'Submission must use the price shown in the checkout');
  assert.equal(submitted.catalogVersion, 1, 'Submission must use the terms version shown in the checkout');
});
