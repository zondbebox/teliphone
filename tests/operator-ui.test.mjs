import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/operator.js', import.meta.url), 'utf8');
const context = vm.createContext({ document: { addEventListener() {} } });
vm.runInContext(source, context);

test('tour editor collects full content and preserves existing departure dates', () => {
  const values = {
    title: 'Steppe Walk', region: 'Akmola Region', city: 'Astana', days: '2', price: '49000',
    difficulty: 'easy', description: 'A quiet route', highlights: 'Open sky\nForest path',
    itinerary: 'Day one\nDay two', included: 'Transport\nGuide', excluded: 'Meals',
    meeting: 'Central station', physicalDemands: 'Gentle walking', cancellation: 'Demo terms',
    questions: 'Confirm access',
  };
  const payload = context.operatorCollectTour(values, ['nature'], [{ id: 'old-id', capacity: '8' }], [{ date: '2026-12-03', capacity: '10' }]);
  assert.equal(payload.days, 2);
  assert.equal(payload.price, 49000);
  assert.deepEqual(Array.from(payload.highlights), ['Open sky', 'Forest path']);
  assert.deepEqual(Array.from(payload.departures, d => ({ ...d })), [
    { id: 'old-id', capacity: 8 }, { date: '2026-12-03', capacity: 10 },
  ]);
  assert.equal(payload.departures[0].date, undefined);
});
