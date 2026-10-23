// Synthetic demonstration records. None of these prices, dates or policies are case facts.
const updatedAt = '2026-10-23T08:00:00.000Z';
const cancellation = 'DEMO policy: cancel at least 7 days before departure for a full refund; 3–6 days for 50%; within 72 hours no refund. If the operator cancels, a full refund applies. Subject to team and operator review before real use.';
const questions = [
  'Confirm English-speaking guide availability for the selected departure.',
  'Confirm dietary needs, accessibility and any weather-related route changes with the operator.',
];

function departures(id, capacity = 12, dates = ['2026-11-07', '2026-11-14']) {
  return [
    { id: `${id}-${dates[0]}`, date: dates[0], capacity },
    { id: `${id}-${dates[1]}`, date: dates[1], capacity: id === 'charyn' ? 0 : capacity },
  ];
}

export function seedCatalog({ futureFrom } = {}) {
  const departureDates = futureFrom ? [14, 21].map(days => {
    const value = new Date(futureFrom);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }) : ['2026-11-07', '2026-11-14'];
  return [
    {
      id: 'charyn', title: 'Charyn Canyon', region: 'Almaty Region', city: 'Almaty', days: 2,
      price: 58000, difficulty: 'moderate', interests: ['nature'],
      description: 'A two-day demonstration itinerary from Almaty, with time to explore canyon landscapes and understand the journey before you book.',
      highlights: ['Canyon viewpoints', 'Unhurried guided walks', 'One overnight stay'],
      itinerary: ['Day 1 — Meet in Almaty, travel to Charyn Canyon and take a guided viewpoint walk; overnight near the route.',
        'Day 2 — A shorter canyon walk if conditions allow, followed by the return transfer to Almaty.'],
      included: ['Return ground transport from Almaty', 'One night in shared accommodation', 'Guided activities in the stated itinerary', 'Stated canyon entrance fees'],
      excluded: ['Flights and travel to Almaty', 'Meals and personal purchases', 'Travel insurance', 'Private room upgrades'],
      meeting: 'DEMO meeting plan: 08:00 in central Almaty. Exact pickup address requires operator confirmation before a real booking.',
      physicalDemands: 'Uneven terrain and exposed walking sections. Expect up to 3 hours of walking per day; weather may change the route.',
      departures: departures('charyn', 12, departureDates),
    },
    {
      id: 'kolsai', title: 'Kolsai Lakes', region: 'Almaty Region', city: 'Almaty', days: 3,
      price: 92000, difficulty: 'moderate', interests: ['nature'],
      description: 'A three-day demonstration escape to lake scenery, with a return journey from Almaty and a clear account of what the tour covers.',
      highlights: ['Lake viewpoints', 'Mountain scenery', 'Two overnight stays'],
      itinerary: ['Day 1 — Meet in Almaty and transfer to the Kolsai area; settle into shared accommodation.',
        'Day 2 — Guided lakeside walking on a route adjusted for seasonal access and weather.',
        'Day 3 — A relaxed local walk, then return by ground transport to Almaty.'],
      included: ['Return ground transport from Almaty', 'Two nights in shared accommodation', 'Guided activities in the stated itinerary', 'Stated lake entrance fees'],
      excluded: ['Flights and travel to Almaty', 'Meals and personal purchases', 'Travel insurance', 'Horse riding and optional activities'],
      meeting: 'DEMO meeting plan: 07:30 in central Almaty. Exact pickup address requires operator confirmation before a real booking.',
      physicalDemands: 'Uneven and potentially slippery paths. Expect up to 4 hours of walking per day; November snow may restrict access.',
      departures: departures('kolsai', 10, departureDates),
    },
    {
      id: 'turkestan', title: 'Turkestan Heritage', region: 'Turkestan Region', city: 'Shymkent', days: 2,
      price: 62000, difficulty: 'easy', interests: ['culture'],
      description: 'A two-day demonstration heritage route from Shymkent, with guided cultural visits and time to ask questions about the places you visit.',
      highlights: ['Heritage sites', 'Cultural context', 'One overnight stay'],
      itinerary: ['Day 1 — Meet in Shymkent, transfer to Turkestan and join a guided heritage walk; overnight in Turkestan.',
        'Day 2 — Continue the stated cultural visits, then return by ground transport to Shymkent.'],
      included: ['Return ground transport from Shymkent', 'One night in shared accommodation', 'Guided activities in the stated itinerary', 'Stated heritage-site entrance fees'],
      excluded: ['Flights and travel to Shymkent', 'Meals and personal purchases', 'Travel insurance', 'Private room upgrades'],
      meeting: 'DEMO meeting plan: 09:00 in central Shymkent. Exact pickup address requires operator confirmation before a real booking.',
      physicalDemands: 'Gentle walking with standing and some steps. Wheelchair access and rest-stop needs require operator confirmation.',
      departures: departures('turkestan', 14, departureDates),
    },
    {
      id: 'burabay', title: 'Burabay Forest & Lakes', region: 'Akmola Region', city: 'Astana', days: 2,
      price: 48000, difficulty: 'easy', interests: ['nature'],
      description: 'A two-day demonstration journey from Astana into Burabay, with gentle forest and lakeside walks and a return transfer included.',
      highlights: ['Forest trails', 'Lakeside scenery', 'One overnight stay'],
      itinerary: ['Day 1 — Meet in Astana, transfer to Burabay and take a guided lakeside walk; overnight in the area.',
        'Day 2 — An easy forest route if weather allows, followed by the return transfer to Astana.'],
      included: ['Return ground transport from Astana', 'One night in shared accommodation', 'Guided activities in the stated itinerary', 'Stated park entrance fees'],
      excluded: ['Flights and travel to Astana', 'Meals and personal purchases', 'Travel insurance', 'Optional activities or equipment rental'],
      meeting: 'DEMO meeting plan: 08:30 in central Astana. Exact pickup address requires operator confirmation before a real booking.',
      physicalDemands: 'Mostly gentle walking, up to 2 hours per day. Cold-weather clothing is essential; icy sections may change the route.',
      departures: departures('burabay', 12, departureDates),
    },
  ].map(tour => ({ ...tour, currency: 'KZT', cancellation, questions: [...questions], demo: true,
    contentStatus: 'Demo draft — operator review required', version: 1, updatedAt }));
}
