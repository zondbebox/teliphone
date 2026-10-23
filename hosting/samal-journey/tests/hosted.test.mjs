import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoApi } from '../.generated/runtime.mjs';

const now = () => new Date('2032-01-05T12:00:00Z');
const operator = { 'x-admin-key': 'local-demo-only' };
function storageArea() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
const post = (body, headers) => ({ method: 'POST', body: JSON.stringify(body), headers });
const patch = body => ({ method: 'PATCH', body: JSON.stringify(body), headers: operator });
async function reserve(demo, overrides = {}) {
  const { tours } = await demo.request('/api/catalog');
  assert.ok(tours[0], 'Catalog must be available before creating a booking');
  const tour = tours[0];
  const input = { tourId: tour.id, departureId: tour.departures[0].id, party: 2, name: 'Alex Demo', email: 'alex@example.com', acceptedTerms: true, quotedPrice: tour.price, catalogVersion: tour.version, idempotencyKey: crypto.randomUUID(), ...overrides };
  return (await demo.request('/api/bookings', post(input))).booking;
}

test('fresh visitors get four bookable seed tours dated in the future', async () => {
  const demo = createDemoApi({ storage: null, now: () => new Date('2032-01-05T12:00:00Z') });
  const { tours } = await demo.request('/api/catalog');
  assert.equal(tours.length, 4);
  assert.equal(tours[0].departures[0].date, '2032-01-19');
  assert.equal(tours[0].departures[0].available, 12);
  assert.equal(tours[0].departures[1].available, 0);
});

test('another visitor cannot see or edit the first visitor bookings, questions, or catalog', async () => {
  const a = createDemoApi({ storage: storageArea(), now });
  const b = createDemoApi({ storage: storageArea(), now });
  const booking = await reserve(a);
  await a.request('/api/questions', post({ tourId: 'charyn', body: 'Demo question?' }));
  await a.request('/api/admin/tours/charyn', patch({ title: 'My private demo title' }));
  assert.deepEqual((await b.request('/api/bookings')).bookings, []);
  assert.deepEqual((await b.request('/api/questions')).questions, []);
  assert.equal((await b.request('/api/catalog')).tours[0].title, 'Charyn Canyon');
  await assert.rejects(b.request(`/api/bookings/${booking.id}`), { status: 404 });
  await assert.rejects(b.request(`/api/admin/bookings/${booking.id}`, patch({ guide: 'Demo Guide A' })), { status: 404 });
});

test('reloading the same session restores the booking, questions, and operator edits', async () => {
  const storage = storageArea();
  const first = createDemoApi({ storage, now });
  const booking = await reserve(first);
  const { question } = await first.request('/api/questions', post({ tourId: 'charyn', body: 'Demo rest stop request' }));
  await first.request(`/api/admin/questions/${question.id}`, patch({ answer: 'Demo: yes, ask the guide.' }));
  await first.request('/api/admin/tours/charyn', patch({ price: 60000 }));
  const reloaded = createDemoApi({ storage, now });
  assert.equal((await reloaded.request('/api/bookings')).bookings[0].id, booking.id);
  assert.equal((await reloaded.request('/api/questions')).questions[0].answer, 'Demo: yes, ask the guide.');
  assert.equal((await reloaded.request('/api/catalog')).tours[0].price, 60000);
});

test('decline releases seats, success restores the hold, and replay does not double reserve', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const booking = await reserve(demo);
  const seats = async () => (await demo.request('/api/catalog')).tours[0].departures[0].available;
  assert.equal(await seats(), 10);
  const route = `/api/bookings/${booking.id}/payment`;
  assert.equal((await demo.request(route, post({ outcome: 'declined', eventId: 'decline-1' }))).booking.status, 'declined');
  assert.equal(await seats(), 12);
  assert.equal((await demo.request(route, post({ outcome: 'success', eventId: 'success-1' }))).booking.status, 'confirmed');
  assert.equal(await seats(), 10);
  await demo.request(route, post({ outcome: 'success', eventId: 'success-1' }));
  assert.equal(await seats(), 10);
  await assert.rejects(demo.request(route, post({ outcome: 'cancelled', eventId: 'cancel-1' })), { status: 409 });
});

test('retry rejects a released booking when another booking has taken its seats', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const booking = await reserve(demo);
  await demo.request(`/api/bookings/${booking.id}/payment`, post({ outcome: 'declined', eventId: 'decline-1' }));
  await reserve(demo, { party: 12 });
  await assert.rejects(demo.request(`/api/bookings/${booking.id}/payment`, post({ outcome: 'success', eventId: 'success-1' })), { status: 409 });
  assert.equal((await demo.request(`/api/bookings/${booking.id}`)).booking.status, 'declined');
});

test('operator guide and reply reach the traveler while the accepted Truth Card stays unchanged', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const booking = await reserve(demo);
  await demo.request(`/api/bookings/${booking.id}/payment`, post({ outcome: 'success', eventId: 'success-1' }));
  await demo.request(`/api/admin/bookings/${booking.id}`, patch({ guide: 'Demo Guide A', status: 'completed' }));
  await demo.request('/api/admin/tours/charyn', patch({ price: 62000, title: 'Updated demo route' }));
  const { question } = await demo.request('/api/questions', post({ tourId: 'charyn', body: 'Can we stop for a rest?' }));
  await demo.request(`/api/admin/questions/${question.id}`, patch({ answer: 'Demo response: rest stops included.' }));
  const updated = (await demo.request(`/api/bookings/${booking.id}`)).booking;
  assert.equal(updated.guide, 'Demo Guide A');
  assert.equal(updated.status, 'completed');
  assert.equal(updated.total, 116000);
  assert.equal(updated.tour.title, 'Charyn Canyon');
  assert.equal(updated.tour.price, 58000);
  assert.equal((await demo.request('/api/questions?tourId=charyn')).questions[0].status, 'answered');
});

test('operator sandbox toggle is required but grants no cross-session data', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  await assert.rejects(demo.request('/api/admin'), { status: 401 });
  await assert.rejects(demo.request('/api/admin', { headers: { 'x-admin-key': 'wrong' } }), { status: 401 });
  assert.equal((await demo.request('/api/admin', { headers: operator })).tours.length, 4);
});

test('blocked storage still supports booking and operator updates in memory', async () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const demo = createDemoApi({ storage: blocked, now });
  const booking = await reserve(demo);
  await demo.request(`/api/bookings/${booking.id}/payment`, post({ outcome: 'success', eventId: 'success-1' }));
  await demo.request(`/api/admin/bookings/${booking.id}`, patch({ guide: 'Demo Guide A' }));
  assert.equal((await demo.request('/api/bookings')).bookings[0].guide, 'Demo Guide A');
  assert.equal(demo.persistence.mode, 'memory');
});

test('quota failure does not partially lose a booking or permit an overbooking', async () => {
  const storage = storageArea();
  const demo = createDemoApi({ storage, now });
  storage.setItem = () => { throw new Error('quota'); };
  const booking = await reserve(demo, { party: 12 });
  assert.equal(demo.persistence.mode, 'memory');
  assert.equal((await demo.request('/api/bookings')).bookings[0].id, booking.id);
  await assert.rejects(reserve(demo), { status: 409 });
  assert.equal((await demo.request('/api/bookings')).bookings.length, 1);
});

test('reset clears only this app keys and reseeds the current session', async () => {
  const storage = storageArea();
  storage.setItem('another-app', 'leave-me');
  const demo = createDemoApi({ storage, now });
  await reserve(demo);
  demo.storage.setItem(demo.checkoutKey, 'synthetic draft');
  demo.reset();
  assert.deepEqual((await demo.request('/api/bookings')).bookings, []);
  assert.equal(storage.getItem('another-app'), 'leave-me');
  assert.equal(demo.storage.getItem(demo.checkoutKey), null);
  assert.deepEqual((await createDemoApi({ storage, now }).request('/api/bookings')).bookings, []);
});

test('matching enforces budget, capacity, date, and difficulty', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const result = await demo.request('/api/match', post({ startDate: '2032-01-19', endDate: '2032-01-22', party: 2, budget: 60000, city: 'Almaty', interest: 'nature', difficulty: 'moderate' }));
  assert.deepEqual(result.tours.map(t => t.id), ['charyn']);
  const empty = await demo.request('/api/match', post({ startDate: '2032-01-19', endDate: '2032-01-22', party: 2, budget: 100, city: 'Almaty', interest: 'nature', difficulty: 'moderate' }));
  assert.equal(empty.tours.length, 0);
});

test('invalid and external routes fail locally rather than making network requests', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  await assert.rejects(demo.request('https://example.com/api/catalog'), { status: 400 });
  await assert.rejects(demo.request('/api/missing'), { status: 404 });
  await assert.rejects(demo.request('/api/bookings', { method: 'POST', body: 'not-json' }), { status: 400 });
  await assert.rejects(demo.request('/api/bookings', post([])), { status: 400 });
});

test('tour authoring validates content and exposes new departures in discovery', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const template = (await demo.request('/api/catalog')).tours[0];
  const { tour } = await demo.request('/api/admin/tours', post({ ...template, title: 'Synthetic new journey', departures: [{ date: '2032-02-01', capacity: 4 }] }, operator));
  assert.equal(tour.version, 1);
  assert.equal(tour.departures[0].available, 4);
  assert.equal((await demo.request('/api/catalog')).tours.length, 5);
  await demo.request(`/api/admin/tours/${tour.id}`, patch({ departures: [{ date: '2032-02-08', capacity: 6 }] }));
  assert.equal((await demo.request('/api/catalog')).tours[4].departures.length, 2);
  await assert.rejects(demo.request('/api/admin/tours', post({ ...template, itinerary: ['One day only'], departures: [{ date: '2032-02-01', capacity: 4 }] }, operator)), { status: 400 });
  assert.equal((await demo.request('/api/catalog')).tours.length, 5);
});

test('booking retries are idempotent and changed Trip Truth Card quotes are rejected', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const first = await reserve(demo, { idempotencyKey: 'same-request' });
  const repeated = await reserve(demo, { idempotencyKey: 'same-request' });
  assert.equal(repeated.id, first.id);
  assert.equal((await demo.request('/api/bookings')).bookings.length, 1);
  await assert.rejects(reserve(demo, { idempotencyKey: 'same-request', party: 3 }), { status: 409 });
  await demo.request('/api/admin/tours/charyn', patch({ price: 63000 }));
  await assert.rejects(reserve(demo, { quotedPrice: 58000, catalogVersion: 1 }), { status: 409 });
  const firstDeparture = (await demo.request('/api/catalog')).tours[0].departures[0];
  await assert.rejects(demo.request('/api/admin/tours/charyn', patch({ departures: [{ id: firstDeparture.id, capacity: 1 }] })), { status: 409 });
  assert.equal((await demo.request('/api/catalog')).tours[0].departures[0].available, 10);
});

test('unreadable saved data recovers a clean demo without clearing unrelated storage', async () => {
  const storage = storageArea();
  storage.setItem('samalJourney.hostedDemo.v1', '{bad-json');
  storage.setItem('another-app', 'keep');
  const demo = createDemoApi({ storage, now });
  assert.equal((await demo.request('/api/catalog')).tours.length, 4);
  assert.deepEqual((await demo.request('/api/bookings')).bookings, []);
  assert.equal(demo.persistence.recovered, true);
  assert.equal(storage.getItem('another-app'), 'keep');
});

test('reset still clears current in-memory data when browser removal is blocked', async () => {
  const storage = storageArea();
  const demo = createDemoApi({ storage, now });
  await reserve(demo);
  storage.removeItem = () => { throw new Error('blocked'); };
  const result = demo.reset();
  assert.equal(result.reloadSafe, false);
  assert.deepEqual((await demo.request('/api/bookings')).bookings, []);
  assert.equal(demo.persistence.mode, 'memory');
});

test('failed reset discloses that a stored copy may return after reload', async () => {
  const storage = storageArea();
  const demo = createDemoApi({ storage, now });
  await reserve(demo);
  const remove = storage.removeItem;
  const save = storage.setItem;
  storage.setItem = storage.removeItem = () => { throw new Error('blocked'); };
  assert.equal(demo.reset().reloadSafe, false);
  assert.equal(demo.persistence.resetIncomplete, true);
  storage.removeItem = remove;
  storage.setItem = save;
  assert.equal((await createDemoApi({ storage, now }).request('/api/bookings')).bookings.length, 1);
});

test('pending holds seats and cancellation releases them', async () => {
  const demo = createDemoApi({ storage: storageArea(), now });
  const booking = await reserve(demo);
  const route = `/api/bookings/${booking.id}/payment`;
  assert.equal((await demo.request(route, post({ outcome: 'pending', eventId: 'pending-1' }))).booking.status, 'pending');
  assert.equal((await demo.request('/api/catalog')).tours[0].departures[0].available, 10);
  assert.equal((await demo.request(route, post({ outcome: 'cancelled', eventId: 'cancel-1' }))).booking.status, 'cancelled');
  assert.equal((await demo.request('/api/catalog')).tours[0].departures[0].available, 12);
});
