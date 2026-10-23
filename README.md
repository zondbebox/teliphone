# Samal Journeys by Saryarqa Routes

An English, AI-assisted working package for ZERTTEX Hackathon 2026, Stage 1, Case 1. The fictional operator's trips are presented through one versioned **Trip Truth Card**, then a validated local booking journey. This is a reviewable demonstration, not a production travel service or an approved competition submission.

## Run locally

Requires Node.js **24.16.0** (the version used here). The application has **no npm dependencies**, no paid services and no API keys. From this folder:

```powershell
npm start
```

Open **http://127.0.0.1:3000**. `node server.mjs` does the same thing. The server binds only to localhost. Optional configuration: copy `.env.example` to `.env`, then run `node --env-file=.env server.mjs`. Do not publish this demo server.

For a clean presentation, use the dedicated instance instead:

```powershell
npm run demo:reset
npm run demo
```

Open **http://127.0.0.1:3001**. `npm run demo` has its own `.runtime/presentation.json` store and `qazaqpass_presentation_session` cookie, separate from the ordinary server's `.runtime/qazaqpass.json` and cookie. Its seeded departures are set 14 and 21 days after the fresh store is created, so use the dates shown in the app rather than a fixed November date. Charyn's second seeded departure is sold out. To repeat a presentation, stop the port 3001 server, run `npm run demo:reset`, then restart it. Reset refuses while port 3001 is occupied, backs up the dedicated presentation file to a timestamped `.backup-*` file, and never resets ordinary demo bookings. If no presentation file exists, it reports that a fresh one will be created.

Operator workspace: use **local-demo-only** unless `QAZAQPASS_ADMIN_KEY` is configured. This openly documented shared code is a demo mechanism, not production authentication. Use synthetic names and `example.com` email addresses. No email, payment, card or passport data is sent to a provider.

## Demonstrate the complete journey

The [2–3 minute presentation script](docs/demo-presentation.md) follows the in-app **Demo guide**. It uses the fresh presentation instance and the dates displayed there.

1. Open **Demo guide**, then its Charyn Canyon tour. Read the Trip Truth Card: included and excluded items, meeting point, physical demands, cancellation terms and questions needing operator confirmation. Select the available future departure for two travelers; the other seeded Charyn date is sold out.
2. Ask the synthetic rest-stop question on the tour page. In **Operator workspace → Inbox**, sign in with the local code and save a clearly marked demo answer. Return to the same traveler browser session to see the private answer; it is not a public FAQ or real support message.
3. Review the displayed total at checkout. Enter **Alex Demo** and **alex@example.com**. You can navigate away or reload and recover the draft's tour, departure, party, name and email in that browser tab. If the departure, party, price or catalog version changes, review and accept the current terms again.
4. Try a declined or pending payment outcome. Neither confirms a booking. Simulate success to create a confirmed **demo** Trip Passport. Reload to verify persistence.
5. In **Operator workspace → Bookings**, assign **Demo Guide A** and save. Reopen the Passport to see the guide and actual application timeline. The saved booking retains the Trip Truth Card snapshot accepted at checkout.

The rule-based **Find my trip** form is an optional extension: use the displayed future date window, a party size and a per-traveler budget. It only returns listed departures with enough seats. An impossible budget produces an honest no-match result.

## Operator authoring

The workspace has **Bookings**, **Journeys** and **Inbox**. Under Journeys, the operator can create a complete synthetic tour or edit an existing one: title, region, start city, duration, difficulty, interests, price, description, highlights, day-by-day itinerary, inclusions, exclusions, meeting point, physical demands, cancellation terms and confirmation questions. A new tour needs at least one current or future departure. Existing departure dates and IDs stay fixed; capacity can change, and new future departures can be added. Changes increment the catalog version; existing bookings keep their accepted content snapshot. Under Inbox, the operator answers questions from the traveler browser session; answers are visible only to that session on the tour and Passport views.

All these records are local synthetic demo content. Operator content still needs human review before any real use.

## Checks

```powershell
npm test
npm run check
npm run build
node finance/calculate.mjs
node finance/test_model.mjs
```

`build` checks JavaScript syntax and copies a runnable local bundle to ignored `dist/`. It is **not** a browser test or a deployment. This JavaScript project has no separate TypeScript compiler or lint configuration; these are not claimed as passed. Current brand, browser and artifact evidence is in `docs/samal-verification.md`; earlier workflow checks remain in `docs/full-demo-verification.md` and `docs/verification.md`. The report has been refreshed for the current Samal Journeys demo.

The HTTP tests start independent temporary servers and stores. They do not modify your demo bookings. UI regression tests exercise real route/form handlers through a limited DOM boundary; visual and keyboard testing is performed separately in the browser.

## Project files

| Path | Purpose |
| --- | --- |
| `public/`, `server.mjs`, `lib/` | Responsive UI, HTTP API, domain logic and synthetic catalog |
| `scripts/demo.mjs`, `docs/demo-presentation.md` | Isolated presentation instance, safe reset and short presentation script |
| `tests/` | Server behavior and UI regression coverage |
| `docs/report.md` | Current editable English report text |
| `deliverables/TeamName_TechnologyProduct.pdf` | Current A4 report with Samal Journeys branding, Saryarqa Routes company attribution and current demo evidence |
| `deliverables/TeamName_TechnologyProduct.docx` | Editable companion; DOCX pagination requires Word/LibreOffice review |
| `finance/inputs.json` | Canonical financial assumptions |
| `finance/summary.json`, `monthly_cash_flows.csv` | Reproducible outputs used in the report |
| `finance/Samal_Journeys_Financial_Model.xlsx` | Editable formula workbook with Base/Downside selector |
| `research/` | Opened sources, case facts, assumptions and market proposal |
| `docs/team_review.md` | Missing official rules, provisional decisions and human checks |
| `docs/validation_protocol.md` | Planned real-user research; no interviews fabricated |
| `assets/attribution.md`, `assets/fonts.md` | Destination photo and self-hosted font source/license records |

`TeamName` is an unresolved filename placeholder. Samal Journeys is the product name, not a confirmed team name.

## Architecture and data

Browser HTML/CSS/JavaScript → same-origin Node HTTP API → single-process domain store → atomically replaced local JSON file. Public catalog records carry a version. Creation requires a displayed price/version, consent, valid traveler inputs and a valid departure. Capacity counts active reservations; declined/cancelled payments release seats. Creating the same booking or receiving the same payment event again is idempotent. Bookings retain the accepted tour snapshot when operators change the catalog.

The checkout draft is kept in the browser tab's session storage until a booking is created. The selected tour/departure/party and entered name/email can be restored after navigation or reload; consent is tied to the displayed tour version, price, date and party and must be renewed if those change. Traveler questions and operator answers are scoped to that browser session. Bookings are scoped by an HttpOnly, SameSite cookie. Operator API calls require the configured demo key. Mutations require the exact local Origin; responses are no-store and scripts/styles/fonts are served locally. No service worker caches private data. The matching interface calls deterministic catalog logic; it is not live generative AI. There is no external AI provider integration to configure.

Organic Editorial uses genuine licensed photographs of Charyn Canyon, Kolsai Lake, the Khoja Ahmed Yasawi mausoleum in Turkistan and Burabay. They have no photo filters or generated effects; CSS may crop the displayed frame. Photo credits, exact sources and licenses are in `assets/attribution.md` and the in-app **Photo credits** page. DM Serif Display, Manrope and Caveat are self-hosted under their included Open Font Licenses; see `assets/fonts.md`. Caveat is used only for short editorial/guide accents while readable text stays in DM Serif Display and Manrope.

For compatibility, existing QAZAQPASS_* configuration names, qazaqpass cookies, checkout storage key and ordinary store filename are retained internally. New bookings use the SJ reference prefix; saved older references remain valid. These internal identifiers do not change the product brand.

Runtime state is stored in ignored `.runtime/qazaqpass.json` or `.runtime/presentation.json`. Preserve those files if you want to keep demo data across restarts. Use `npm run demo:reset` for a backed-up, fresh presentation; never commit runtime files or real traveler data.

## Boundaries of the prototype

- The company facts come from the supplied case; tour-specific prices, policies, dates, capacities and guide names are synthetic.
- The ordinary local server seeds fixed November 2026 departures, which eventually become unbookable. A freshly reset presentation instance generates future departures 14 and 21 days from creation. Do not reuse expired dates in a live demo.
- One server process per store is supported. Abandoned reservation holds do not expire automatically. Production needs a transactional database, timed holds, authentication, audit and retention controls.
- Payments are local simulations, **not a Halyk sandbox**. Onboarding, foreign-issued-card acceptance, settlement, refunds and security verification remain launch gates. A browser return would never prove a real payment.
- Operator tour authoring, departure additions, booking updates and private inquiry answers work in the local demo. The shared operator code is **not production authentication**, and no real support operation exists.
- Printed itineraries are static documents. No offline inventory, payment, live support, emergency monitoring or installable PWA is implemented.
- Matching is rule-based; there is **no live AI**. No real-user study, supplier contract, partnership, compliance certification or team approval is claimed. No public deployment or competition submission occurred.

## Reports and model reproduction

The Node calculation is portable and dependency-free. Workbook generation uses the desktop runtime's `@oai/artifact-tool`, documented in `finance/README.md`; this authoring capability is not an app dependency. Edit canonical JSON and regenerate outputs before changing the report. Workbook-only exploratory edits do not synchronize back into JSON.

`scripts/build_report.py` consumes the financial summary, source register and real screenshots. It requires Python with `python-docx`, `reportlab` and Pillow from the bundled document runtime. PDF rendering uses Poppler. The packaged DOCX renderer could not run because LibreOffice `soffice.exe` was unavailable; the editable DOCX exists but its pagination is unverified. Use the verified PDF for page-count review and inspect any edited Word export before submission.

The report and workbook use the Samal Journeys product brand for the fictional Saryarqa Routes company. The report describes the current local demonstration. Branding changes do not change the canonical financial assumptions or forecasts. All source statements and forecasts require substantive team review. The base financial result is fragile: ambitious acquisition growth is a hypothesis, and the required downside misses both 24-month payback and the foreign-share goal. Read the financial assumptions before treating any number as a business commitment.
