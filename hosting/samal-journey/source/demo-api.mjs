// Combined with the retained catalog and browser-adapted Store by scripts/build.mjs.
// This adapter performs no network requests and has no production authentication.
const STATE_KEY = 'samalJourney.hostedDemo.v1';
const CHECKOUT_KEY = 'samalJourney.hostedCheckout.v1';

export function createDemoApi({ storage, now = () => new Date(), onPersistenceChange = () => {} } = {}) {
  const cache = new Map();
  const persistence = { mode: 'session', recovered: false };
  function memoryOnly() {
    persistence.mode = 'memory';
    onPersistenceChange({ ...persistence });
  }
  if (storage === undefined) {
    try { storage = globalThis.sessionStorage; } catch { storage = null; }
  }
  if (!storage) memoryOnly();
  const safeStorage = {
    getItem(key) {
      if (cache.has(key)) return cache.get(key);
      if (persistence.mode === 'session') {
        try { const value = storage.getItem(key); cache.set(key, value); return value; }
        catch { memoryOnly(); }
      }
      return null;
    },
    setItem(key, value) {
      cache.set(key, String(value));
      if (persistence.mode === 'session') {
        try { storage.setItem(key, String(value)); } catch { memoryOnly(); }
      }
    },
    removeItem(key) {
      cache.set(key, null);
      // Attempt cleanup even after a quota failure; removal may still work.
      try { if (storage) storage.removeItem(key); return Boolean(storage); }
      catch { memoryOnly(); return false; }
    },
  };
  let store;
  let owner;
  function initialize() {
    store = new Store(safeStorage, STATE_KEY, now);
    owner = store.session(store.state.sessions[0]).id;
  }
  try { initialize(); }
  catch {
    // Corrupt browser data must not prevent a visitor from opening the demo.
    safeStorage.removeItem(STATE_KEY);
    safeStorage.removeItem(CHECKOUT_KEY);
    persistence.recovered = true;
    initialize();
    onPersistenceChange({ ...persistence });
  }

  function body(options) {
    let value;
    try { value = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; }
    catch { throw new AppError(400, 'Send a valid JSON object.'); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError(400, 'Send a valid JSON object.');
    return value;
  }

  async function request(path, options = {}) {
    if (typeof path !== 'string' || !path.startsWith('/api/')) throw new AppError(400, 'Only this browser demo API is available.');
    const url = new URL(path, 'https://samal-demo.invalid');
    const route = url.pathname;
    const method = (options.method || 'GET').toUpperCase();
    if (route.startsWith('/api/admin') && options.headers?.['x-admin-key'] !== 'local-demo-only') {
      throw new AppError(401, 'Enter local-demo-only to open your browser-session operator sandbox. This is a demo toggle, not production authentication.');
    }
    if (method === 'GET' && route === '/api/health') return { status: 'ok', demo: true, browserSession: true };
    if (method === 'GET' && route === '/api/catalog') return { tours: store.catalog() };
    if (method === 'POST' && route === '/api/match') return store.match(body(options));
    if (method === 'GET' && route === '/api/questions') return { questions: store.questions(owner, url.searchParams.get('tourId')) };
    if (method === 'POST' && route === '/api/questions') return { question: store.createQuestion(body(options), owner) };
    if (method === 'GET' && route === '/api/bookings') return { bookings: store.bookings(owner) };
    if (method === 'POST' && route === '/api/bookings') return { booking: store.createBooking(body(options), owner).booking };
    const booking = route.match(/^\/api\/bookings\/([a-zA-Z0-9-]+)$/);
    if (method === 'GET' && booking) return { booking: store.booking(booking[1], owner) };
    const payment = route.match(/^\/api\/bookings\/([a-zA-Z0-9-]+)\/payment$/);
    if (method === 'POST' && payment) return { booking: store.payment(payment[1], owner, body(options)) };
    if (method === 'GET' && route === '/api/admin') return store.admin();
    if (method === 'POST' && route === '/api/admin/tours') return { tour: store.createTour(body(options)) };
    const question = route.match(/^\/api\/admin\/questions\/([a-zA-Z0-9-]+)$/);
    if (method === 'PATCH' && question) return { question: store.answerQuestion(question[1], body(options)) };
    const adminBooking = route.match(/^\/api\/admin\/bookings\/([a-zA-Z0-9-]+)$/);
    if (method === 'PATCH' && adminBooking) return { booking: store.updateBooking(adminBooking[1], body(options)) };
    const tour = route.match(/^\/api\/admin\/tours\/([a-zA-Z0-9-]+)$/);
    if (method === 'PATCH' && tour) return { tour: store.updateTour(tour[1], body(options)) };
    throw new AppError(404, 'Browser demo route not found.');
  }
  return {
    request, persistence, storage: safeStorage, checkoutKey: CHECKOUT_KEY,
    reset() {
      const stateRemoved = safeStorage.removeItem(STATE_KEY);
      const draftRemoved = safeStorage.removeItem(CHECKOUT_KEY);
      initialize();
      const reloadSafe = stateRemoved && draftRemoved;
      persistence.resetIncomplete = !reloadSafe;
      onPersistenceChange({ ...persistence });
      return { reloadSafe };
    },
  };
}
