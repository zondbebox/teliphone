/* Operator workspace. Loaded as a classic script before app.js. */
let operatorFlash = '';

function operatorLines(value) {
  return String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function operatorCollectTour(values, interests, existingDepartures, newDepartures) {
  return {
    title: values.title.trim(), region: values.region.trim(), city: values.city,
    days: Number(values.days), price: Number(values.price), difficulty: values.difficulty,
    interests, description: values.description.trim(),
    highlights: operatorLines(values.highlights), itinerary: operatorLines(values.itinerary),
    included: operatorLines(values.included), excluded: operatorLines(values.excluded),
    meeting: values.meeting.trim(), physicalDemands: values.physicalDemands.trim(),
    cancellation: values.cancellation.trim(), questions: operatorLines(values.questions),
    departures: [
      ...existingDepartures.map(row => ({ id: row.id, capacity: Number(row.capacity) })),
      ...newDepartures.filter(row => row.date || row.capacity).map(row => ({ date: row.date, capacity: Number(row.capacity) })),
    ],
  };
}

function operatorPage() {
  const section = location.hash.split('/')[1] || 'bookings';
  return ['bookings', 'catalog', 'inbox'].includes(section) ? section : 'bookings';
}

function operatorEmpty(title, copy) {
  return `<div class="op-empty"><span class="op-empty-mark" aria-hidden="true">◇</span><h3>${title}</h3><p>${copy}</p></div>`;
}

function operatorInput(label, name, value = '', attributes = '') {
  return `<label class="op-field"><span>${label}</span><input name="${name}" value="${esc(value)}" ${attributes}></label>`;
}

function operatorTextarea(label, name, value = '', rows = 3, attributes = '') {
  return `<label class="op-field"><span>${label}</span><textarea name="${name}" rows="${rows}" ${attributes}>${esc(value)}</textarea></label>`;
}

function operatorLogin() {
  main.innerHTML = `<div class="operator-login"><div class="op-login-aside"><span class="op-kicker">Saryarqa Routes · local demonstration</span><span class="op-login-symbol" aria-hidden="true">✳</span><p>Every detail<br>has a person<br>behind it.</p></div><section class="op-login-panel" aria-labelledby="op-login-title"><a class="op-back" href="#home">← Return to journeys</a><span class="op-kicker">Operator access</span><h1 id="op-login-title">The work<br><em>behind the journey.</em></h1><p>Use your configured local operator access code to review bookings, keep the catalog accurate, and answer traveler questions.</p><form data-operator-action="login"><label class="op-field"><span>Access code</span><input name="key" type="password" autocomplete="off" required autofocus></label><button class="op-primary">Open workspace <span aria-hidden="true">↗</span></button></form><p class="op-small">Local demo access only. The key stays in memory for this tab.</p></section></div>`;
}

function operatorBookingCard(b) {
  const updateable = ['confirmed', 'completed'].includes(b.status);
  const tourTitle = b.tour?.title || b.tourTitle || 'Tour';
  return `<article class="op-booking"><div class="op-booking-head"><div><span class="op-kicker">${esc(b.reference)} · ${esc(b.tour?.city || '')}</span><h3>${esc(tourTitle)}</h3></div><span class="op-status ${b.status === 'completed' ? 'is-complete' : ''}">${esc(titleCase(b.status))}</span></div><div class="op-booking-meta"><span>${esc(date(b.departure.date))}</span><span>${esc(b.party)} ${Number(b.party) === 1 ? 'traveler' : 'travelers'}</span><span>${esc(money(b.total))}</span></div>${updateable ? `<form data-operator-action="booking" data-id="${esc(b.id)}" class="op-booking-form"><div class="op-form-row">${operatorInput('Assigned guide · synthetic name', 'guide', b.guide || '', 'maxlength="80" placeholder="Add a guide name"')}<label class="op-field"><span>Journey status</span><select name="status"><option value="confirmed" ${b.status === 'confirmed' ? 'selected' : 'disabled'}>Confirmed</option><option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option></select></label></div><button class="op-text-button">Save booking update <span aria-hidden="true">↗</span></button></form>` : '<p class="op-small">Guide assignment opens after the demo payment is confirmed.</p>'}</article>`;
}

function operatorBookings(data) {
  const bookings = [...(data.bookings || [])].reverse();
  return `<div class="op-section-head"><div><span class="op-kicker">Journey operations</span><h2>Bookings</h2><p>Guide assignments and completed journeys appear in the traveler’s Trip Passport.</p></div><span class="op-large-count">${bookings.length.toString().padStart(2, '0')}</span></div>${bookings.length ? `<div class="op-booking-list">${bookings.map(operatorBookingCard).join('')}</div>` : operatorEmpty('A clear desk, for now.', 'Confirmed demo bookings will arrive here after travelers complete the simulated payment step.')}`;
}

function operatorCatalogCard(t, index) {
  const next = t.departures?.find(d => d.available > 0);
  return `<article class="op-tour-card"><div class="op-tour-index">${String(index + 1).padStart(2, '0')} <span>—</span> ${esc(t.region)}</div><div class="op-tour-content"><div><h3>${esc(t.title)}</h3><p>${esc(t.city)} · ${esc(t.days)} days · ${esc(titleCase(t.difficulty))}</p></div><div class="op-tour-price">${esc(money(t.price))}<small>per traveler · demo</small></div></div><div class="op-tour-bottom"><span>${esc(t.departures?.length || 0)} departures · ${next ? `Next ${esc(date(next.date))}` : 'No open seats'}</span><a href="#operator/catalog/edit/${encodeURIComponent(t.id)}" aria-label="Edit ${esc(t.title)}">Edit journey <span aria-hidden="true">↗</span></a></div></article>`;
}

function operatorCatalog(data) {
  const tours = data.tours || [];
  const path = location.hash.split('/');
  if (path[2] === 'new') return operatorEditor(null);
  if (path[2] === 'edit') {
    const tour = tours.find(t => t.id === decodeURIComponent(path[3] || ''));
    return tour ? operatorEditor(tour) : operatorEmpty('Journey not found.', 'Return to the catalog and choose a current tour.');
  }
  return `<div class="op-section-head"><div><span class="op-kicker">The living catalog</span><h2>Journeys</h2><p>Keep traveler facing details and demo availability aligned.</p></div><a class="op-primary" href="#operator/catalog/new">Create journey <span aria-hidden="true">↗</span></a></div><div class="op-catalog-list">${tours.length ? tours.map(operatorCatalogCard).join('') : operatorEmpty('No journeys yet.', 'Create the first demonstration tour to make the catalog visible.')}</div><p class="op-footnote">Existing departures keep their dates and IDs. A saved booking keeps the terms its traveler accepted.</p>`;
}

function operatorNewDepartureRow() {
  return `<div class="op-form-row op-new-departure">${operatorInput('Departure date', 'newDate', '', `type="date" min="${new Date().toISOString().slice(0, 10)}" required`)}${operatorInput('Capacity', 'newCapacity', '', 'type="number" min="0" max="100" required')}</div>`;
}

function operatorEditor(t) {
  const create = !t;
  const value = key => t?.[key] || '';
  const lineValue = key => (t?.[key] || []).join('\n');
  return `<div class="op-editor-head"><a class="op-back" href="#operator/catalog">← All journeys</a><span class="op-kicker">${create ? 'Create a journey' : `Edit journey · version ${esc(t.version)}`}</span><h2>${create ? 'A new route, clearly told.' : esc(t.title)}</h2><p>These are demonstration details. Review every field before using them with real travelers.</p></div><form class="op-editor" data-operator-action="tour" ${create ? '' : `data-id="${esc(t.id)}"`}><section class="op-editor-section"><div class="op-editor-intro"><span>01 / Identity</span><h3>The essentials</h3><p>How this journey appears in discovery and matching.</p></div><div class="op-editor-fields">${operatorInput('Journey title', 'title', value('title'), 'maxlength="100" required')}${operatorInput('Region', 'region', value('region'), 'maxlength="100" required')}<div class="op-form-row"><label class="op-field"><span>Starting city</span><select name="city" required>${['Almaty', 'Astana', 'Shymkent'].map(city => `<option ${t?.city === city ? 'selected' : ''}>${city}</option>`).join('')}</select></label>${operatorInput('Duration · days', 'days', value('days'), 'type="number" min="2" max="7" required')}</div><div class="op-form-row">${operatorInput('Price · KZT per traveler', 'price', value('price'), 'type="number" min="1" required')}<label class="op-field"><span>Physical pace</span><select name="difficulty">${['easy', 'moderate', 'challenging'].map(level => `<option value="${level}" ${t?.difficulty === level ? 'selected' : ''}>${titleCase(level)}</option>`).join('')}</select></label></div><fieldset class="op-checks"><legend>Interests</legend><label><input type="checkbox" name="interest" value="nature" ${create || t.interests?.includes('nature') ? 'checked' : ''}> Nature & landscapes</label><label><input type="checkbox" name="interest" value="culture" ${t?.interests?.includes('culture') ? 'checked' : ''}> Culture & heritage</label></fieldset>${operatorTextarea('Short description', 'description', value('description'), 3, 'maxlength="1000" required')}</div></section><section class="op-editor-section"><div class="op-editor-intro"><span>02 / Experience</span><h3>What happens</h3><p>Put each highlight and each day on its own line.</p></div><div class="op-editor-fields">${operatorTextarea('Highlights · one per line', 'highlights', lineValue('highlights'), 4, 'required')}${operatorTextarea('Itinerary · one day per line', 'itinerary', lineValue('itinerary'), 6, 'required')}${operatorTextarea('Included · one per line', 'included', lineValue('included'), 4, 'required')}${operatorTextarea('Excluded · one per line', 'excluded', lineValue('excluded'), 4, 'required')}</div></section><section class="op-editor-section"><div class="op-editor-intro"><span>03 / The truth card</span><h3>Useful details</h3><p>These details are copied into a booking when the traveler accepts them.</p></div><div class="op-editor-fields">${operatorTextarea('Meeting point', 'meeting', value('meeting'), 3, 'required')}${operatorTextarea('Physical demands', 'physicalDemands', value('physicalDemands'), 3, 'required')}${operatorTextarea('Cancellation terms', 'cancellation', value('cancellation'), 4, 'required')}${operatorTextarea('Questions needing confirmation · one per line', 'questions', lineValue('questions'), 4, 'required')}</div></section><section class="op-editor-section"><div class="op-editor-intro"><span>04 / Departure dates</span><h3>Places available</h3><p>Existing dates are fixed. Change capacity or add a future departure.</p></div><div class="op-editor-fields"><div class="op-departures">${(t?.departures || []).map(d => `<div class="op-existing-departure" data-id="${esc(d.id)}"><div><strong>${esc(date(d.date))}</strong><small>${esc(d.available)} available · date fixed</small></div>${operatorInput('Total capacity', 'existingCapacity', d.capacity, 'type="number" min="0" max="100" required')}</div>`).join('')}</div><div class="op-new-departures">${create ? operatorNewDepartureRow() : ''}</div><button type="button" class="op-text-button" data-operator-action="add-departure">+ Add another departure</button></div></section><div class="op-editor-actions"><p>Saved changes persist in this local demo. Existing bookings retain their accepted snapshot.</p><button class="op-primary">${create ? 'Create journey' : 'Save journey'} <span aria-hidden="true">↗</span></button></div></form>`;
}

function operatorInquiryCard(q) {
  const answered = Boolean(q.answer);
  return `<article class="op-inquiry"><div class="op-inquiry-heading"><div><span class="op-kicker">${esc(q.tourTitle || 'Journey question')} · ${q.createdAt ? esc(new Date(q.createdAt).toLocaleDateString('en-GB')) : 'Local demo'}</span><h3>${esc(q.body)}</h3></div><span class="op-status ${answered ? 'is-complete' : ''}">${answered ? 'Answered' : 'Open'}</span></div>${answered ? `<div class="op-answer"><span>Operator answer</span><p>${esc(q.answer)}</p></div>` : `<form data-operator-action="inquiry" data-id="${esc(q.id)}">${operatorTextarea('Your answer · visible to this traveler in the demo', 'answer', '', 3, 'maxlength="2000" required')}<button class="op-text-button">Save answer <span aria-hidden="true">↗</span></button></form>`}</article>`;
}

function operatorInbox(data) {
  const inquiries = [...(data.inquiries || [])].reverse();
  const open = inquiries.filter(q => !q.answer);
  const answered = inquiries.filter(q => q.answer);
  return `<div class="op-section-head"><div><span class="op-kicker">Human follow-up</span><h2>Traveler inbox</h2><p>Questions here are synthetic messages from the local demo. Answers appear in that traveler’s tour and Passport view.</p></div><span class="op-large-count">${open.length.toString().padStart(2, '0')}</span></div><div class="op-inbox-group"><h3>Waiting for an answer <small>${open.length}</small></h3>${open.length ? open.map(operatorInquiryCard).join('') : operatorEmpty('Nothing waiting.', 'New traveler questions will appear here for a person to answer.')}</div><div class="op-inbox-group"><h3>Answered <small>${answered.length}</small></h3>${answered.length ? answered.map(operatorInquiryCard).join('') : '<p class="op-small">Answered questions will be collected here.</p>'}</div><details class="op-static-questions"><summary>Catalog confirmation prompts</summary><p>These are prompts attached to each tour, separate from traveler messages.</p>${(data.questions || []).map(q => `<div><strong>${esc(q.tourTitle)}</strong><span>${esc(q.question)}</span></div>`).join('')}</details>`;
}

async function renderOperatorWorkspace(token = routeVersion) {
  if (!state.adminKey) { operatorLogin(); return; }
  try {
    const data = await api('/api/admin', { headers: { 'x-admin-key': state.adminKey } });
    if (token !== routeVersion) return;
    const page = operatorPage();
    const counts = { bookings: (data.bookings || []).length, catalog: (data.tours || []).length, inbox: (data.inquiries || []).filter(q => !q.answer).length };
    main.innerHTML = `<div class="operator-workspace"><header class="op-topbar"><a class="op-wordmark" href="#home">QazaqPass <span>operator</span></a><div><span>Local demo workspace</span><button data-operator-action="logout">Lock workspace ↗</button></div></header><div class="op-layout"><aside class="op-sidebar"><div><span class="op-kicker">The operating desk</span><p>Keep the promise<br><em>clear.</em></p></div><nav aria-label="Operator sections"><a href="#operator/bookings" ${page === 'bookings' ? 'aria-current="page"' : ''}>Bookings <span>${counts.bookings}</span></a><a href="#operator/catalog" ${page === 'catalog' ? 'aria-current="page"' : ''}>Journeys <span>${counts.catalog}</span></a><a href="#operator/inbox" ${page === 'inbox' ? 'aria-current="page"' : ''}>Inbox <span>${counts.inbox}</span></a></nav><p class="op-sidebar-note">All prices, departures, and availability shown here are synthetic.</p></aside><div class="op-main"><nav class="op-mobile-tabs" aria-label="Operator sections"><a href="#operator/bookings" ${page === 'bookings' ? 'aria-current="page"' : ''}>Bookings <span>${counts.bookings}</span></a><a href="#operator/catalog" ${page === 'catalog' ? 'aria-current="page"' : ''}>Journeys <span>${counts.catalog}</span></a><a href="#operator/inbox" ${page === 'inbox' ? 'aria-current="page"' : ''}>Inbox <span>${counts.inbox}</span></a></nav>${operatorFlash ? `<div class="op-flash" role="status">${esc(operatorFlash)}</div>` : ''}<section aria-label="${page === 'catalog' ? 'Journey catalog' : page === 'inbox' ? 'Traveler inbox' : 'Bookings'}">${page === 'catalog' ? operatorCatalog(data) : page === 'inbox' ? operatorInbox(data) : operatorBookings(data)}</section></div></div></div>`;
    operatorFlash = '';
  } catch (error) {
    if (token !== routeVersion) return;
    main.innerHTML = `<div class="operator-login op-error-page"><section class="op-login-panel"><span class="op-kicker">Workspace unavailable</span><h1>We could not open the desk.</h1><p role="alert">${esc(error.message)}</p><div class="op-error-actions"><button class="op-primary" data-operator-action="retry">Try again ↗</button><button data-operator-action="logout" class="op-text-button">Use another access code</button></div></section></div>`;
  }
}

document.addEventListener('submit', async event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.operatorAction) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const action = form.dataset.operatorAction;
  const values = Object.fromEntries(new FormData(form));
  await busy(form, async () => {
    const submittedOn = routeVersion;
    if (action === 'login') {
      const key = String(values.key || '');
      await api('/api/admin', { headers: { 'x-admin-key': key } });
      if (!form.isConnected || submittedOn !== routeVersion) return;
      state.adminKey = key;
      await renderOperatorWorkspace(submittedOn);
      return;
    }
    if (action === 'booking') {
      await api(`/api/admin/bookings/${encodeURIComponent(form.dataset.id)}`, { method: 'PATCH', headers: { 'x-admin-key': state.adminKey }, body: JSON.stringify({ guide: values.guide || null, ...(values.status === 'completed' ? { status: 'completed' } : {}) }) });
      if (!form.isConnected || submittedOn !== routeVersion) return;
      operatorFlash = 'Booking saved. The Trip Passport now shows this update.';
    } else if (action === 'inquiry') {
      await api(`/api/admin/questions/${encodeURIComponent(form.dataset.id)}`, { method: 'PATCH', headers: { 'x-admin-key': state.adminKey }, body: JSON.stringify({ answer: String(values.answer).trim() }) });
      if (!form.isConnected || submittedOn !== routeVersion) return;
      operatorFlash = 'Answer saved for the traveler.';
    } else if (action === 'tour') {
      const interests = [...form.querySelectorAll('input[name="interest"]:checked')].map(input => input.value);
      const existing = [...form.querySelectorAll('.op-existing-departure')].map(row => ({ id: row.dataset.id, capacity: row.querySelector('input').value }));
      const added = [...form.querySelectorAll('.op-new-departure')].map(row => ({ date: row.querySelector('input[type="date"]').value, capacity: row.querySelector('input[type="number"]').value }));
      const payload = operatorCollectTour(values, interests, existing, added);
      if (!interests.length) throw new Error('Choose at least one interest.');
      if (payload.itinerary.length !== payload.days) throw new Error(`Write one itinerary line for each of the ${payload.days} days.`);
      if (!payload.departures.length) throw new Error('Add at least one departure.');
      const path = form.dataset.id ? `/api/admin/tours/${encodeURIComponent(form.dataset.id)}` : '/api/admin/tours';
      const result = await api(path, { method: form.dataset.id ? 'PATCH' : 'POST', headers: { 'x-admin-key': state.adminKey }, body: JSON.stringify(payload) });
      if (!form.isConnected || submittedOn !== routeVersion) return;
      operatorFlash = form.dataset.id ? 'Journey saved. Existing booking terms remain unchanged.' : 'Journey created and added to the catalog.';
      if (!form.dataset.id) { location.hash = `operator/catalog/edit/${encodeURIComponent(result.tour.id)}`; return; }
    }
    if (!form.isConnected || submittedOn !== routeVersion) return;
    await renderOperatorWorkspace(submittedOn);
  });
});

document.addEventListener('click', async event => {
  const button = event.target.closest('button[data-operator-action]');
  if (!button) return;
  const action = button.dataset.operatorAction;
  if (action === 'retry') {
    await renderOperatorWorkspace(routeVersion);
  } else if (action === 'logout') {
    state.adminKey = '';
    operatorFlash = '';
    operatorLogin();
  } else if (action === 'add-departure') {
    const group = button.closest('.op-editor-fields').querySelector('.op-new-departures');
    group.insertAdjacentHTML('beforeend', operatorNewDepartureRow());
    group.lastElementChild.querySelector('input').focus();
  }
});
