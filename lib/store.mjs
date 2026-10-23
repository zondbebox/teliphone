import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { seedCatalog } from './catalog.mjs';

const HOLDING = new Set(['awaiting_payment', 'pending', 'confirmed', 'completed']);
const OUTCOMES = { success: 'confirmed', declined: 'declined', cancelled: 'cancelled', pending: 'pending' };

export class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function requireValue(condition, message, status = 400) {
  if (!condition) throw new AppError(status, message);
}

function integer(value, min, max, label) {
  requireValue(Number.isSafeInteger(value) && value >= min && value <= max, `${label} must be a whole number from ${min} to ${max}.`);
  return value;
}

function text(value, max, label) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max
    && !/[\u0000-\u001f\u007f]/.test(value), `${label} is missing or invalid.`);
  return value.trim();
}

function date(value, label) {
  requireValue(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), `${label} must be a valid date.`);
  const parsed = new Date(value + 'T00:00:00Z');
  requireValue(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, `${label} must be a valid date.`);
  return parsed;
}

function publicBooking(booking) {
  const { owner, idempotencyKey, fingerprint, ...visible } = booking;
  return structuredClone(visible);
}

/** A single-process local demo store. Transactions are synchronous and commit by atomic rename. */
export class Store {
  constructor(path, now = () => new Date()) {
    this.path = path;
    this.now = now;
    if (existsSync(path)) {
      this.state = JSON.parse(readFileSync(path, 'utf8'));
      if (this.state.schemaVersion !== 1 || !Array.isArray(this.state.tours) || !Array.isArray(this.state.bookings)
        || !Array.isArray(this.state.sessions) || !Array.isArray(this.state.events)) {
        throw new Error('Unsupported or damaged local store. Preserve it and use a separate demo data path.');
      }
    } else {
      this.state = { schemaVersion: 1, tours: seedCatalog(), bookings: [], sessions: [], events: [] };
      this.persist(this.state);
    }
  }

  persist(state) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
    const file = openSync(temporary, 'r+');
    try { fsyncSync(file); } finally { closeSync(file); }
    renameSync(temporary, this.path);
  }

  transaction(mutate) {
    // Validate and change a copy: failed validation or disk writes cannot partially mutate memory.
    const next = structuredClone(this.state);
    const result = mutate(next);
    this.persist(next);
    this.state = next;
    return result;
  }

  session(candidate) {
    if (typeof candidate === 'string' && /^[a-f0-9]{64}$/.test(candidate) && this.state.sessions.includes(candidate)) {
      return { id: candidate, fresh: false };
    }
    const id = randomBytes(32).toString('hex');
    this.transaction(state => state.sessions.push(id));
    return { id, fresh: true };
  }

  reserved(state, tourId, departureId) {
    return state.bookings.filter(b => b.tour.id === tourId && b.departure.id === departureId && HOLDING.has(b.status))
      .reduce((sum, b) => sum + b.party, 0);
  }

  catalog(state = this.state) {
    return state.tours.map(tour => ({ ...structuredClone(tour), departures: tour.departures.map(d => ({ ...d,
      available: Math.max(0, d.capacity - this.reserved(state, tour.id, d.id)) })) }));
  }

  match(input) {
    const start = date(input.startDate, 'Start date');
    const end = date(input.endDate, 'End date');
    requireValue(start <= end, 'End date must be on or after the start date.');
    requireValue(input.startDate >= this.now().toISOString().slice(0, 10), 'Choose current or future travel dates.');
    const party = integer(input.party, 1, 12, 'Party size');
    const budget = integer(input.budget, 1, 10000000, 'Budget per traveler');
    const city = text(input.city, 40, 'Departure city');
    const interest = text(input.interest, 40, 'Interest');
    const difficulty = text(input.difficulty, 40, 'Difficulty');
    requireValue(['Almaty', 'Astana', 'Shymkent', 'any'].includes(city), 'Choose a listed departure city.');
    requireValue(['nature', 'culture', 'any'].includes(interest), 'Choose a listed interest.');
    requireValue(['easy', 'moderate', 'challenging', 'any'].includes(difficulty), 'Choose a listed difficulty.');
    const rank = { easy: 1, moderate: 2, challenging: 3, any: 3 };
    const tours = this.catalog().filter(tour => tour.price <= budget && (city === 'any' || tour.city === city)
      && (interest === 'any' || tour.interests.includes(interest)) && rank[tour.difficulty] <= rank[difficulty])
      .map(tour => ({ ...tour, departures: tour.departures.filter(d => {
        const ends = new Date(d.date + 'T00:00:00Z');
        ends.setUTCDate(ends.getUTCDate() + tour.days - 1);
        return d.date >= input.startDate && ends <= end && d.available >= party;
      }) })).filter(tour => tour.departures.length);
    return { tours, explanation: tours.length
      ? `${tours.length} catalog ${tours.length === 1 ? 'tour fits' : 'tours fit'} your dates, party size, per-traveler budget, starting city, interests and maximum physical difficulty. Only listed departures with enough seats are shown. Rule-based demo; no live AI was used.`
      : 'No catalog tour meets every selected constraint. Try wider dates, another departure city or a higher per-traveler budget. We do not invent tours, transfers or available seats. Rule-based demo; no live AI was used.' };
  }

  bookings(owner) { return this.state.bookings.filter(b => b.owner === owner).map(publicBooking); }

  owned(state, id, owner) {
    const booking = state.bookings.find(b => b.id === id && b.owner === owner);
    requireValue(booking, 'Booking not found in this browser session.', 404);
    return booking;
  }

  booking(id, owner) { return publicBooking(this.owned(this.state, id, owner)); }

  createBooking(input, owner) {
    const tourId = text(input.tourId, 80, 'Tour');
    const departureId = text(input.departureId, 100, 'Departure');
    const party = integer(input.party, 1, 12, 'Party size');
    const name = text(input.name, 100, 'Traveler name');
    const email = text(input.email, 254, 'Email').toLowerCase();
    requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email address.');
    requireValue(input.acceptedTerms === true, 'Review and accept the displayed demo terms.');
    const quotedPrice = integer(input.quotedPrice, 1, 10000000, 'Reviewed price');
    const catalogVersion = integer(input.catalogVersion, 1, 100000000, 'Catalog version');
    const idempotencyKey = text(input.idempotencyKey, 128, 'Booking request key');
    const fingerprint = JSON.stringify({ tourId, departureId, party, name, email, quotedPrice, catalogVersion });
    const previous = this.state.bookings.find(b => b.owner === owner && b.idempotencyKey === idempotencyKey);
    if (previous) {
      requireValue(previous.fingerprint === fingerprint, 'This request key was already used for different booking details.', 409);
      return { booking: publicBooking(previous), created: false };
    }
    return this.transaction(state => {
      const tour = state.tours.find(x => x.id === tourId);
      requireValue(tour, 'Tour not found.', 404);
      const departure = tour.departures.find(d => d.id === departureId);
      requireValue(departure, 'Departure not found.', 404);
      requireValue(departure.date >= this.now().toISOString().slice(0, 10), 'This departure is no longer bookable.', 409);
      requireValue(tour.price === quotedPrice && tour.version === catalogVersion,
        'The Trip Truth Card changed. Refresh the tour and review its current price and terms before booking.', 409);
      requireValue(departure.capacity - this.reserved(state, tour.id, departure.id) >= party,
        'There are not enough seats for this party. Choose another departure.', 409);
      const id = randomUUID();
      const at = this.now().toISOString();
      const booking = { id, reference: `QP-${id.slice(0, 8).toUpperCase()}`, status: 'awaiting_payment', party,
        total: party * tour.price, currency: 'KZT', name, email, tour: structuredClone(tour),
        departure: { id: departure.id, date: departure.date }, guide: null, demo: true, createdAt: at,
        timeline: [{ status: 'awaiting_payment', at, message: 'Demo reservation created; payment has not been confirmed.' }],
        owner, idempotencyKey, fingerprint };
      state.bookings.push(booking);
      return { booking: publicBooking(booking), created: true };
    });
  }

  payment(id, owner, input) {
    const outcome = text(input.outcome, 20, 'Payment outcome');
    requireValue(Object.hasOwn(OUTCOMES, outcome), 'Choose a supported demo payment outcome.');
    const eventId = text(input.eventId, 128, 'Payment event ID');
    const current = this.owned(this.state, id, owner);
    const previous = this.state.events.find(event => event.id === eventId);
    if (previous) {
      requireValue(previous.bookingId === id && previous.outcome === outcome, 'This payment event ID was already used.', 409);
      return publicBooking(current);
    }
    if (['confirmed', 'completed'].includes(current.status)) {
      requireValue(outcome === 'success', 'This booking is already confirmed; a demo payment cannot replace that status.', 409);
      // A repeated success with a new notification ID must not reserve seats or append confirmation twice.
      return this.transaction(state => {
        state.events.push({ id: eventId, bookingId: id, outcome });
        return publicBooking(this.owned(state, id, owner));
      });
    }
    return this.transaction(state => {
      const booking = this.owned(state, id, owner);
      const nextStatus = OUTCOMES[outcome];
      if (HOLDING.has(nextStatus)) {
        requireValue(booking.departure.date >= this.now().toISOString().slice(0, 10), 'This departure is no longer bookable.', 409);
      }
      if (HOLDING.has(nextStatus) && !HOLDING.has(booking.status)) {
        const tour = state.tours.find(x => x.id === booking.tour.id);
        const departure = tour.departures.find(d => d.id === booking.departure.id);
        requireValue(departure.capacity - this.reserved(state, tour.id, departure.id) >= booking.party,
          'Seats are no longer available. No demo payment was confirmed; choose another departure.', 409);
      }
      booking.status = nextStatus;
      const messages = {
        success: 'Demo payment event verified; booking confirmed. No real money was charged.',
        declined: 'Demo payment declined; seats released. Retry will check current capacity.',
        cancelled: 'Demo checkout cancelled; seats released. No payment was confirmed.',
        pending: 'Demo payment is pending; seats remain reserved. This is not a confirmation.',
      };
      booking.timeline.push({ status: nextStatus, at: this.now().toISOString(), message: messages[outcome] });
      state.events.push({ id: eventId, bookingId: id, outcome });
      return publicBooking(booking);
    });
  }

  admin() {
    return { tours: this.catalog(), bookings: this.state.bookings.map(publicBooking),
      questions: this.state.tours.flatMap(tour => tour.questions.map(question => ({ tourId: tour.id, tourTitle: tour.title, question, status: 'Requires operator confirmation' }))) };
  }

  updateBooking(id, input) {
    requireValue(Object.keys(input).length > 0 && Object.keys(input).every(key => ['guide', 'status'].includes(key)), 'Only guide assignment and completion can be updated.');
    if (Object.hasOwn(input, 'guide') && input.guide !== null) text(input.guide, 100, 'Guide');
    if (Object.hasOwn(input, 'status')) requireValue(input.status === 'completed', 'Only completed status can be set by the operator.');
    return this.transaction(state => {
      const booking = state.bookings.find(b => b.id === id);
      requireValue(booking, 'Booking not found.', 404);
      if (input.status) {
        requireValue(['confirmed', 'completed'].includes(booking.status), 'Only a confirmed booking can be completed.', 409);
        if (booking.status !== 'completed') {
          booking.status = 'completed';
          booking.timeline.push({ status: 'completed', at: this.now().toISOString(), message: 'Operator marked the demonstration trip as completed.' });
        }
      }
      if (Object.hasOwn(input, 'guide')) {
        requireValue(['confirmed', 'completed'].includes(booking.status), 'Assign a guide after demo payment confirmation.', 409);
        const guide = input.guide === null ? null : input.guide.trim();
        if (booking.guide !== guide) {
          booking.guide = guide;
          booking.timeline.push({ status: booking.status, at: this.now().toISOString(), message: guide ? `Demo guide assigned: ${guide}.` : 'Guide assignment removed; operator confirmation required.' });
        }
      }
      return publicBooking(booking);
    });
  }

  updateTour(id, input) {
    requireValue(Object.keys(input).length > 0 && Object.keys(input).every(key => ['price', 'cancellation', 'departures'].includes(key)), 'Only price, cancellation and departure capacities can be updated.');
    if (Object.hasOwn(input, 'price')) integer(input.price, 1, 10000000, 'Price');
    if (Object.hasOwn(input, 'cancellation')) text(input.cancellation, 2000, 'Cancellation terms');
    if (Object.hasOwn(input, 'departures')) requireValue(Array.isArray(input.departures) && input.departures.length > 0, 'Provide departure capacities.');
    return this.transaction(state => {
      const tour = state.tours.find(x => x.id === id);
      requireValue(tour, 'Tour not found.', 404);
      if (Object.hasOwn(input, 'price')) tour.price = input.price;
      if (Object.hasOwn(input, 'cancellation')) tour.cancellation = input.cancellation.trim();
      if (input.departures) {
        const seen = new Set();
        for (const edited of input.departures) {
          requireValue(edited && typeof edited === 'object' && !Array.isArray(edited), 'Each departure must have an ID and capacity.');
          const departureId = text(edited.id, 100, 'Departure ID');
          requireValue(!seen.has(departureId), 'Each departure may be edited only once.');
          seen.add(departureId);
          integer(edited.capacity, 0, 100, 'Departure capacity');
          const departure = tour.departures.find(d => d.id === departureId);
          requireValue(departure, 'Departure not found.', 404);
          requireValue(edited.capacity >= this.reserved(state, tour.id, departure.id), 'Capacity cannot be lower than reserved or confirmed seats.', 409);
          departure.capacity = edited.capacity;
        }
      }
      tour.version += 1;
      tour.updatedAt = this.now().toISOString();
      return this.catalog(state).find(x => x.id === id);
    });
  }
}
