import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { seedCatalog } from '../lib/catalog.mjs';

const operatorSource = readFileSync(new URL('../public/operator.js', import.meta.url), 'utf8');
const editorialSource = readFileSync(new URL('../public/editorial.js', import.meta.url), 'utf8');
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
function harness(hash = '#home', respond = () => undefined, storage = new Map()) {
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
  const main = new Element(), results = new Element(), questions = new Element(), toast = new Element();
  const handlers = new Map();
  const location = { hash };
  const calls = [];
  const context = vm.createContext({
    sessionStorage: { getItem(key) { return storage.get(key) ?? null; }, setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); } },
    document: {
      querySelector(selector) {
        if (selector === '#main') return main;
        if (selector === '#toast') return toast;
        if (selector === '#match-results') return main.innerHTML.includes('id="match-results"') ? results : null;
        if (selector === '#traveler-question-list') return main.innerHTML.includes('id="traveler-question-list"') ? questions : null;
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
  vm.runInContext(operatorSource, context);
  vm.runInContext(editorialSource, context);
  vm.runInContext(source, context);
  return {
    main, results, questions, location, calls, state: vm.runInContext('state', context),
    async inputCheckout(values, tourId = 'charyn') {
      const form = new Form('checkout-form', values, { tour: tourId });
      const target = { name: 'name', closest(selector) { return selector === '#checkout-form' ? form : null; } };
      for (const callback of handlers.get('input') || []) await callback({ target });
    },
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


test('checkout details survive navigating away and returning without losing unchanged consent', async () => {
  const app = harness('#checkout/charyn');
  await app.ready();
  await app.inputCheckout({name:'Taylor Demo',email:'taylor@example.com',acceptedTerms:'on'});
  await app.navigate('#home');
  await app.navigate('#checkout/charyn');
  assert.match(app.main.innerHTML, /name="name"[^>]*value="Taylor Demo"/);
  assert.match(app.main.innerHTML, /name="email"[^>]*value="taylor@example.com"/);
  assert.match(app.main.innerHTML, /name="acceptedTerms"[^>]*checked/);
});

test('checkout restores a synthetic draft after a page reload but drops consent for changed terms', async () => {
  const storage = new Map();
  const app = harness('#checkout/charyn', () => undefined, storage);
  await app.ready();
  await app.inputCheckout({name:'Taylor Demo',email:'taylor@example.com',acceptedTerms:'on'});
  const changed = catalog();
  changed[0].version = 2;
  changed[0].price = 65000;
  const reloaded = harness('#checkout/charyn', path => path === '/api/catalog' ? {tours:changed} : undefined, storage);
  await reloaded.ready();
  assert.match(reloaded.main.innerHTML, /name="name"[^>]*value="Taylor Demo"/);
  assert.match(reloaded.main.innerHTML, /65,000 KZT/);
  assert.doesNotMatch(reloaded.main.innerHTML, /name="acceptedTerms"[^>]*checked/);
});

test('changing party size keeps traveler details and requires consent to the new total', async () => {
  const app = harness('#checkout/charyn');
  await app.ready();
  await app.inputCheckout({name:'Taylor Demo',email:'taylor@example.com',acceptedTerms:'on'});
  await app.navigate('#tour/charyn');
  await app.submit('departure-form',{departureId:'charyn-2026-11-07',party:'3'},{tour:'charyn'});
  await app.navigate('#checkout/charyn');
  assert.match(app.main.innerHTML, /name="name"[^>]*value="Taylor Demo"/);
  assert.match(app.main.innerHTML, /174,000 KZT/);
  assert.doesNotMatch(app.main.innerHTML, /name="acceptedTerms"[^>]*checked/);
});

test('tour questions use the private session API and escape the operator answer', async () => {
  const app = harness('#tour/charyn', path => path.startsWith('/api/questions?')
    ? {questions:[{id:'q1',body:'Can I bring a walking aid?',answer:'Yes, check <terrain> first.'}]}
    : path === '/api/questions' ? {question:{id:'q2'}} : undefined);
  await app.ready();
  assert.match(app.main.innerHTML, /data-question-tour="charyn"/);
  assert.match(app.questions.innerHTML, /Can I bring a walking aid\?/);
  assert.match(app.questions.innerHTML, /&lt;terrain&gt;/);
  await app.submit('', {body:'Is there a rest stop?'}, {questionTour:'charyn'});
  const post = app.calls.find(call => call.path === '/api/questions');
  assert.equal(post.options.method, 'POST');
  assert.equal(JSON.parse(post.options.body).tourId, 'charyn');
  assert.equal(JSON.parse(post.options.body).body, 'Is there a rest stop?');
});

test('a delayed private question response cannot replace the newer route', async () => {
  const delayed = deferred();
  const app = harness('#tour/charyn', path => path.startsWith('/api/questions?') ? delayed.promise : undefined);
  await app.ready();
  await app.navigate('#home');
  const home = app.main.innerHTML;
  delayed.resolve({questions:[{id:'q1',body:'Old question',answer:null}]});
  await tick();
  assert.equal(app.main.innerHTML, home);
  assert.doesNotMatch(app.questions.innerHTML, /Old question/);
});

test('match dates come from current catalog departures', async () => {
  const shifted = catalog();
  for (const tour of shifted) for (const [index, departure] of tour.departures.entries())
    departure.date = index === 0 ? '2027-02-10' : '2027-03-01';
  const app = harness('#match', path => path === '/api/catalog' ? {tours:shifted} : undefined);
  await app.ready();
  assert.match(app.main.innerHTML, /name="startDate"[^>]*value="2027-02-10"/);
  assert.match(app.main.innerHTML, /name="endDate"[^>]*value="2027-03-03"/);
});

test('changing departure keeps traveler details and clears prior consent', async () => {
  const app = harness('#checkout/kolsai');
  await app.ready();
  await app.inputCheckout({name:'Taylor Demo',email:'taylor@example.com',acceptedTerms:'on'}, 'kolsai');
  await app.navigate('#tour/kolsai');
  await app.submit('departure-form',{departureId:'kolsai-2026-11-14',party:'1'},{tour:'kolsai'});
  await app.navigate('#checkout/kolsai');
  assert.match(app.main.innerHTML, /name="name"[^>]*value="Taylor Demo"/);
  assert.doesNotMatch(app.main.innerHTML, /name="acceptedTerms"[^>]*checked/);
  assert.match(app.main.innerHTML, /14 November 2026/);
});

test('unavailable session storage keeps the draft in memory', async () => {
  const blocked = {get(){throw new Error('blocked');},set(){throw new Error('blocked');},delete(){throw new Error('blocked');}};
  const app = harness('#checkout/charyn', () => undefined, blocked);
  await app.ready();
  await app.inputCheckout({name:'Taylor Demo',email:'taylor@example.com',acceptedTerms:'on'});
  await app.navigate('#home');
  await app.navigate('#checkout/charyn');
  assert.match(app.main.innerHTML, /name="name"[^>]*value="Taylor Demo"/);
});

test('an old successful checkout cannot erase a newer trip draft or booking key', async () => {
  const oldResponse = deferred(), newResponse = deferred(), storage = new Map();
  let bookingRequests = 0;
  const app = harness('#checkout/charyn', path => path === '/api/bookings'
    ? (++bookingRequests === 1 ? oldResponse.promise : newResponse.promise) : undefined, storage);
  await app.ready();
  await app.inputCheckout({name:'Charyn Demo',email:'charyn@example.com',acceptedTerms:'on'});
  const oldSubmit = app.submit('checkout-form', {name:'Charyn Demo',email:'charyn@example.com',acceptedTerms:'on'}, {tour:'charyn'});
  await tick();
  await app.navigate('#checkout/kolsai');
  await app.inputCheckout({name:'Kolsai Demo',email:'kolsai@example.com',acceptedTerms:'on'}, 'kolsai');
  const newSubmit = app.submit('checkout-form', {name:'Kolsai Demo',email:'kolsai@example.com',acceptedTerms:'on'}, {tour:'kolsai'});
  await tick();
  const requests = app.calls.filter(call => call.path === '/api/bookings').map(call => JSON.parse(call.options.body));
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].idempotencyKey, requests[1].idempotencyKey);
  const newKey = app.state.bookingKey;
  oldResponse.resolve({booking:{id:'old-charyn'}});
  await oldSubmit;
  assert.equal(app.location.hash, '#checkout/kolsai');
  assert.equal(app.state.bookingKey, newKey);
  assert.equal(app.state.checkoutDraft.name, 'Kolsai Demo');
  assert.equal(JSON.parse(storage.get('qazaqpass.checkoutDraft.v1')).name, 'Kolsai Demo');
  assert.equal(app.state.checkoutDraft.consentKey, app.state.checkoutReviewKey);
  newResponse.resolve({booking:{id:'new-kolsai'}});
  await newSubmit;
  assert.equal(app.location.hash, 'payment/new-kolsai');
  assert.equal(storage.has('qazaqpass.checkoutDraft.v1'), false);
});
