import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

const NOW = () => new Date('2026-10-23T08:00:00Z');

async function setup(t, now = NOW) {
  const directory = mkdtempSync(join(tmpdir(), 'qazaqpass-test-'));
  const options = { storePath: join(directory, 'store.json'), adminKey: 'test-operator-key', now };
  const server = createApp(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  function client(cookie = '') {
    return async (path, { body, method = body ? 'POST' : 'GET', admin = false, headers = {} } = {}) => {
      const response = await fetch(base + path, {
        method,
        headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json', origin: base } : {}),
          ...(admin ? { 'x-admin-key': 'test-operator-key' } : {}), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const text = await response.text();
      return { status: response.status, headers: response.headers, data: text ? JSON.parse(text) : null, cookie };
    };
  }
  return { client, base, options, server };
}

async function catalog(client) {
  const result = await client('/api/catalog');
  assert.equal(result.status, 200);
  return result.data.tours;
}

function details(tour, overrides = {}) {
  return { tourId: tour.id, departureId: tour.departures[0].id, party: 2,
    name: 'Demo Traveler', email: 'visitor@example.com', acceptedTerms: true,
    quotedPrice: tour.price, catalogVersion: tour.version, idempotencyKey: crypto.randomUUID(), ...overrides };
}

test('catalog exposes transparent demonstration tours and availability without private records', async t => {
  const { client } = await setup(t);
  const browser = client();
  const result = await browser('/api/catalog');
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const tours = result.data.tours;
  assert.equal(tours.length, 4);
  assert.deepEqual(new Set(tours.map(x => x.city)), new Set(['Almaty', 'Shymkent', 'Astana']));
  assert.ok(tours.every(x => x.demo && x.included.length && x.excluded.length && x.itinerary.length === x.days));
  assert.ok(tours.some(x => x.departures.some(d => d.available === 0)));
  assert.equal(JSON.stringify(result.data).includes('email'), false);
  const health = await browser('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.status, 'ok');
});

test('self-hosted TrueType fonts are served with a usable font MIME type', async t => {
  const { base } = await setup(t);
  const response = await fetch(base + '/fonts/DMSerifDisplay-Regular.ttf');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'font/ttf');
  const data = Buffer.from(await response.arrayBuffer());
  assert.equal(data.readUInt32BE(0), 0x00010000);
});

test('matching applies dates, departure city, party capacity, budget, interest and difficulty', async t => {
  const { client } = await setup(t);
  const browser = client();
  const query = { startDate: '2026-11-07', endDate: '2026-11-09', party: 2, budget: 60000,
    city: 'Almaty', interest: 'nature', difficulty: 'moderate' };
  const result = await browser('/api/match', { body: query });
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.tours.map(x => x.id), ['charyn']);
  assert.ok(result.data.explanation.length > 0);
  assert.deepEqual((await browser('/api/match', { body: { ...query, city: 'Astana' } })).data.tours.map(x => x.id), ['burabay']);
  for (const overrides of [{ city: 'Shymkent' }, { budget: 10000 }, { interest: 'culture' },
    { difficulty: 'easy' }, { startDate: '2026-11-14', endDate: '2026-11-14' }]) {
    const none = await browser('/api/match', { body: { ...query, ...overrides } });
    assert.equal(none.status, 200);
    assert.equal(none.data.tours.length, 0);
  }
  for (const overrides of [{ startDate: '2026-02-30' }, { endDate: '2026-11-01' }, { party: 0 }, { budget: -1 }]) {
    assert.equal((await browser('/api/match', { body: { ...query, ...overrides } })).status, 400);
  }
});

test('booking holds seats, snapshots total, and repeat creation returns one booking', async t => {
  const { client } = await setup(t);
  const browser = client();
  const tour = (await catalog(browser))[0];
  const input = details(tour);
  const first = await browser('/api/bookings', { body: input });
  assert.equal(first.status, 201);
  assert.equal(first.data.booking.status, 'awaiting_payment');
  assert.equal(first.data.booking.total, 116000);
  assert.equal(first.data.booking.tour.price, 58000);
  assert.equal(first.data.booking.guide, null);
  assert.equal(first.data.booking.timeline.length, 1);
  assert.equal((await catalog(browser))[0].departures[0].available, 10);
  const repeat = await browser('/api/bookings', { body: input });
  assert.equal(repeat.data.booking.id, first.data.booking.id);
  assert.equal((await browser('/api/bookings')).data.bookings.length, 1);
  const conflict = await browser('/api/bookings', { body: { ...input, party: 3 } });
  assert.equal(conflict.status, 409);
});

test('competing browsers cannot oversell remaining seats including pending holds', async t => {
  const { client } = await setup(t);
  const a = client(), b = client();
  const tour = (await catalog(a))[0];
  const results = await Promise.all([a('/api/bookings', { body: details(tour, { party: 8 }) }),
    b('/api/bookings', { body: details(tour, { party: 8 }) })]);
  assert.deepEqual(results.map(x => x.status).sort(), [201, 409]);
  const winner = results[0].status === 201 ? a : b;
  const booking = results.find(x => x.status === 201).data.booking;
  assert.equal((await winner(`/api/bookings/${booking.id}/payment`, { body: { outcome: 'pending', eventId: 'pending-hold' } })).data.booking.status, 'pending');
  assert.equal((await catalog(a))[0].departures[0].available, 4);
});

test('successful demo payment is idempotent and cannot be downgraded or applied twice', async t => {
  const { client } = await setup(t);
  const browser = client();
  const tour = (await catalog(browser))[0];
  const booking = (await browser('/api/bookings', { body: details(tour) })).data.booking;
  const path = `/api/bookings/${booking.id}/payment`;
  const event = { outcome: 'success', eventId: 'verified-demo-event' };
  const paid = await browser(path, { body: event });
  assert.equal(paid.data.booking.status, 'confirmed');
  assert.equal(paid.data.booking.timeline.length, 2);
  assert.equal((await browser(path, { body: event })).data.booking.timeline.length, 2);
  const repeatedSuccess = await browser(path, { body: { outcome: 'success', eventId: 'second-success-event' } });
  assert.equal(repeatedSuccess.status, 200);
  assert.equal(repeatedSuccess.data.booking.timeline.length, 2);
  assert.equal((await catalog(browser))[0].departures[0].available, 10);
  assert.equal((await browser(path, { body: { outcome: 'declined', eventId: 'late-decline' } })).status, 409);
  assert.equal((await browser(path, { body: { outcome: 'pending', eventId: event.eventId } })).status, 409);
});

test('declined and cancelled payments release capacity; retries recheck it before confirmation', async t => {
  const { client } = await setup(t);
  const a = client(), b = client();
  const tour = (await catalog(a))[0];
  const booking = (await a('/api/bookings', { body: details(tour, { party: 8 }) })).data.booking;
  const path = `/api/bookings/${booking.id}/payment`;
  assert.equal((await a(path, { body: { outcome: 'declined', eventId: 'decline-1' } })).data.booking.status, 'declined');
  assert.equal((await catalog(a))[0].departures[0].available, 12);
  const other = (await b('/api/bookings', { body: details(tour, { party: 8 }) })).data.booking;
  assert.equal((await a(path, { body: { outcome: 'success', eventId: 'retry-1' } })).status, 409);
  await b(`/api/bookings/${other.id}/payment`, { body: { outcome: 'cancelled', eventId: 'cancel-1' } });
  assert.equal((await a(path, { body: { outcome: 'success', eventId: 'retry-1' } })).data.booking.status, 'confirmed');
});

test('an unpaid hold cannot be confirmed after its departure date has passed', async t => {
  let clock = new Date('2026-10-23T08:00:00Z');
  const { client } = await setup(t, () => clock);
  const browser = client();
  const tour = (await catalog(browser))[0];
  const booking = (await browser('/api/bookings', { body: details(tour) })).data.booking;
  clock = new Date('2026-11-08T08:00:00Z');
  assert.equal((await browser(`/api/bookings/${booking.id}/payment`, { body: { outcome: 'success', eventId: 'late-success' } })).status, 409);
  assert.equal((await browser(`/api/bookings/${booking.id}/payment`, { body: { outcome: 'cancelled', eventId: 'late-cancel' } })).data.booking.status, 'cancelled');
});

test('operator updates cannot silently change accepted terms or reduce capacity below holds', async t => {
  const { client } = await setup(t);
  const browser = client();
  const tour = (await catalog(browser))[0];
  const oldInput = details(tour);
  const booking = (await browser('/api/bookings', { body: oldInput })).data.booking;
  const updated = await browser(`/api/admin/tours/${tour.id}`, { method: 'PATCH', admin: true,
    body: { price: 65000, cancellation: 'DEMO: Updated cancellation terms. Ask the operator before any real booking.' } });
  assert.equal(updated.status, 200);
  const old = await browser(`/api/bookings/${booking.id}`);
  assert.equal(old.data.booking.total, 116000);
  assert.equal(old.data.booking.tour.cancellation, tour.cancellation);
  assert.equal((await browser('/api/bookings', { body: { ...oldInput, idempotencyKey: 'stale-price-attempt' } })).status, 409);
  const current = (await catalog(browser))[0];
  assert.equal(current.price, 65000);
  assert.equal((await browser(`/api/admin/tours/${tour.id}`, { method: 'PATCH', admin: true,
    body: { departures: [{ id: tour.departures[0].id, capacity: 1 }] } })).status, 409);
  assert.equal((await catalog(browser))[0].departures[0].available, 10);
});

test('operator can assign a guide and complete only a confirmed booking', async t => {
  const { client } = await setup(t);
  const browser = client();
  const tour = (await catalog(browser))[0];
  const booking = (await browser('/api/bookings', { body: details(tour) })).data.booking;
  const path = `/api/admin/bookings/${booking.id}`;
  assert.equal((await browser(path, { method: 'PATCH', admin: true, body: { status: 'completed' } })).status, 409);
  await browser(`/api/bookings/${booking.id}/payment`, { body: { outcome: 'success', eventId: 'operator-ready' } });
  assert.equal((await browser(path, { method: 'PATCH', admin: true, body: { guide: 'Demo guide A' } })).data.booking.guide, 'Demo guide A');
  const completed = await browser(path, { method: 'PATCH', admin: true, body: { status: 'completed' } });
  assert.equal(completed.data.booking.status, 'completed');
  assert.equal(completed.data.booking.timeline.at(-1).status, 'completed');
  const admin = await browser('/api/admin', { admin: true });
  assert.equal(admin.data.bookings.length, 1);
  assert.ok(admin.data.questions.length > 0);
});

test('booking validation rejects missing consent, incorrect quotes, invalid travelers and sold-out departures', async t => {
  const { client } = await setup(t);
  const browser = client();
  const tour = (await catalog(browser))[0];
  for (const overrides of [{ acceptedTerms: false }, { party: 1.5 }, { party: 13 }, { email: 'not-email' },
    { name: '' }, { quotedPrice: undefined }, { catalogVersion: undefined }, { idempotencyKey: '' }]) {
    assert.equal((await browser('/api/bookings', { body: details(tour, overrides) })).status, 400);
  }
  assert.equal((await browser('/api/bookings', { body: details(tour, { quotedPrice: 1 }) })).status, 409);
  assert.equal((await browser('/api/bookings', { body: details(tour, { departureId: tour.departures[1].id }) })).status, 409);
  assert.equal((await browser('/api/bookings')).data.bookings.length, 0);
});

test('ownership cookies keep private bookings and payment actions out of other browser sessions', async t => {
  const { client } = await setup(t);
  const a = client(), b = client();
  const tour = (await catalog(a))[0];
  const booking = (await a('/api/bookings', { body: details(tour) })).data.booking;
  assert.equal((await b('/api/bookings')).data.bookings.length, 0);
  assert.equal((await b(`/api/bookings/${booking.id}`)).status, 404);
  assert.equal((await b(`/api/bookings/${booking.id}/payment`, { body: { outcome: 'success', eventId: 'unauthorized' } })).status, 404);
  const malformed = await client('qazaqpass_session=made-up-session')('/api/bookings');
  assert.equal(malformed.data.bookings.length, 0);
  assert.match(malformed.headers.get('set-cookie'), /HttpOnly/);
  assert.match(malformed.headers.get('set-cookie'), /SameSite=Strict/);
});

test('admin authentication and same-origin mutations are enforced without exposing internals', async t => {
  const { client } = await setup(t);
  const browser = client();
  assert.equal((await browser('/api/admin')).status, 401);
  assert.equal((await browser('/api/admin', { headers: { 'x-admin-key': 'wrong' } })).status, 401);
  assert.equal((await browser('/api/admin', { admin: true })).status, 200);
  const tour = (await catalog(browser))[0];
  assert.equal((await browser('/api/bookings', { body: details(tour), headers: { origin: 'https://attacker.invalid' } })).status, 403);
  assert.equal((await browser('/api/bookings', { body: details(tour), headers: { origin: '' } })).status, 403);
});

test('request parsing limits oversized or malformed bodies and unexpected content types', async t => {
  const { client, base } = await setup(t);
  const browser = client();
  assert.equal((await browser('/api/bookings', { body: { padding: 'x'.repeat(17000) } })).status, 413);
  for (const [body, type, expected] of [['{broken', 'application/json', 400], ['{}', 'text/plain', 415], ['[]', 'application/json', 400]]) {
    const response = await fetch(base + '/api/bookings', { method: 'POST', headers: { origin: base, 'content-type': type }, body });
    assert.equal(response.status, expected);
  }
});

test('durable state preserves booking, session ownership and catalog edits across restart', async t => {
  const { client, options } = await setup(t);
  const browser = client();
  const tour = (await catalog(browser))[0];
  const response = await browser('/api/bookings', { body: details(tour) });
  await browser(`/api/bookings/${response.data.booking.id}/payment`, { body: { outcome: 'pending', eventId: 'persist-pending' } });
  await browser(`/api/admin/tours/${tour.id}`, { method: 'PATCH', admin: true, body: { price: 65000 } });
  const reloaded = createApp(options);
  reloaded.listen(0, '127.0.0.1');
  await once(reloaded, 'listening');
  t.after(() => new Promise(resolve => reloaded.close(resolve)));
  const result = await fetch(`http://127.0.0.1:${reloaded.address().port}/api/bookings`, { headers: { cookie: response.cookie } });
  const saved = await result.json();
  assert.equal(saved.bookings.length, 1);
  assert.equal(saved.bookings[0].status, 'pending');
  assert.equal(saved.bookings[0].timeline.length, 2);
  assert.equal(saved.bookings[0].tour.price, 58000);
  const currentCatalog = await fetch(`http://127.0.0.1:${reloaded.address().port}/api/catalog`);
  assert.equal((await currentCatalog.json()).tours[0].price, 65000);
});
