# QazaqPass by Saryarqa Routes

An English, AI-assisted working package for ZERTTEX Hackathon 2026, Stage 1, Case 1. The fictional operator's trips are presented through one versioned **Trip Truth Card**, then a validated local booking journey. This is a reviewable demonstration, not a production travel service or an approved competition submission.

## Run locally

Requires Node.js **24.16.0** (the version used here). The application has **no npm dependencies**, no paid services and no API keys. From this folder:

```powershell
node server.mjs
```

Open **http://127.0.0.1:3000**. The server binds only to localhost. `npm start` does the same thing. Optional configuration: copy `.env.example` to `.env`, then run `node --env-file=.env server.mjs`. Do not publish this demo server.

Operator workspace: use **local-demo-only** unless `QAZAQPASS_ADMIN_KEY` is configured. This openly documented shared code is a demo mechanism, not production authentication. Use synthetic names and `example.com` email addresses. No email, payment, card or passport data is sent to a provider.

## Demonstrate the complete journey

1. Open **Find my trip**. Try November 2026, Almaty, nature, moderate difficulty and a budget of KZT 100,000 per traveler.
2. Open Charyn Canyon. Read its inclusions, exclusions, cancellation terms and questions requiring operator confirmation. The 14 November departure is visibly sold out.
3. Choose 7 November and two travelers. The demo total is **KZT 116,000**, based on the synthetic KZT 58,000 tour price.
4. Review, enter Alex Demo / alex@example.com, accept the demo terms and continue.
5. Try decline, pending and cancellation. None confirms payment. Retry success to create a confirmed **demo** Trip Passport. Reload to verify persistence.
6. Open the operator workspace, assign a synthetic guide and save. Reopen the Passport to see the assignment and actual application timeline.
7. Try an impossible budget to see an honest no-match result. Match Burabay for 14–15 November with three people to verify the selected date and party survive opening the result.

## Checks

```powershell
npm test
npm run check
npm run build
node finance/calculate.mjs
node finance/test_model.mjs
```

`build` checks JavaScript syntax and copies a runnable local bundle to ignored `dist/`. It is **not** a browser test or a deployment. This JavaScript project has no separate TypeScript compiler or lint configuration; these are not claimed as passed. The browser verification record and tool limitations are in `docs/verification.md`.

The HTTP tests start independent temporary servers and stores. They do not modify your demo bookings. UI regression tests exercise real route/form handlers through a limited DOM boundary; visual and keyboard testing is performed separately in the browser.

## Project files

| Path | Purpose |
| --- | --- |
| `public/`, `server.mjs`, `lib/` | Responsive UI, HTTP API, domain logic and synthetic catalog |
| `tests/` | Server behavior and UI regression coverage |
| `docs/report.md` | Full editable report text |
| `deliverables/TeamName_TechnologyProduct.pdf` | Visually inspected A4 working report draft |
| `deliverables/TeamName_TechnologyProduct.docx` | Editable companion; DOCX pagination requires Word/LibreOffice review |
| `finance/inputs.json` | Canonical financial assumptions |
| `finance/summary.json`, `monthly_cash_flows.csv` | Reproducible outputs used in the report |
| `finance/QazaqPass_Financial_Model.xlsx` | Editable formula workbook with Base/Downside selector |
| `research/` | Opened sources, case facts, assumptions and market proposal |
| `docs/team_review.md` | Missing official rules, provisional decisions and human checks |
| `docs/validation_protocol.md` | Planned real-user research; no interviews fabricated |
| `assets/` | Genuine browser screenshots, rendered flow and asset attribution |

`TeamName` is an unresolved filename placeholder. QazaqPass is the product name, not a confirmed team name.

## Architecture and data

Browser HTML/CSS/JavaScript → same-origin Node HTTP API → single-process domain store → atomically replaced local JSON file. Public catalog records carry a version. Creation requires a displayed price/version, consent, valid traveler inputs and a valid departure. Capacity counts active reservations; declined/cancelled payments release seats. Creating the same booking or receiving the same payment event again is idempotent. Bookings retain the accepted tour snapshot when operators change the catalog.

Bookings are scoped by an HttpOnly, SameSite cookie. Operator API calls require the configured demo key. Mutations require the exact local Origin; responses are no-store and scripts/styles/fonts are served locally. No service worker caches private data. The rule-based matching interface calls deterministic catalog logic; it is not live generative AI. There is no external AI provider integration to configure.

Runtime state is stored in ignored `.runtime/qazaqpass.json`. Keep that file if you want to preserve demo bookings across restarts. For a fresh demo, stop the server and **move that specific file to a backup** before restarting. Never commit runtime files or real traveler data.

## Boundaries of the prototype

- The company facts come from the supplied case; tour-specific prices, policies, dates, capacities and guide names are synthetic.
- Only November 2026 departures are seeded. When those dates pass, create a reviewed future seed for a new demonstration; expired bookings cannot be confirmed.
- One server process is supported. Abandoned reservation holds do not expire automatically. Production needs a transactional database, timed holds, authentication, audit and retention controls.
- Payments are local simulations, **not a Halyk sandbox**. Onboarding, foreign-issued-card acceptance, settlement, refunds and security verification remain launch gates. A browser return would never prove a real payment.
- Production catalog authoring is broader than this demo: the UI edits prices, cancellation terms and capacity, assigns guides and completes bookings. It does not create new tours/departures or resolve customer tickets.
- Printed itineraries are static documents. No offline inventory, payment, live support, emergency monitoring or installable PWA is implemented.
- No real-user study, supplier contract, partnership, compliance certification or team approval is claimed. No public deployment or competition submission occurred.

## Reports and model reproduction

The Node calculation is portable and dependency-free. Workbook generation uses the desktop runtime's `@oai/artifact-tool`, documented in `finance/README.md`; this authoring capability is not an app dependency. Edit canonical JSON and regenerate outputs before changing the report. Workbook-only exploratory edits do not synchronize back into JSON.

`scripts/build_report.py` consumes the financial summary, source register and real screenshots. It requires Python with `python-docx`, `reportlab` and Pillow from the bundled document runtime. PDF rendering uses Poppler. The packaged DOCX renderer could not run because LibreOffice `soffice.exe` was unavailable; the editable DOCX exists but its pagination is unverified. Use the verified PDF for page-count review and inspect any edited Word export before submission.

All source statements and forecasts require substantive team review. The base financial result is fragile: ambitious acquisition growth is a hypothesis, and the required downside misses both 24-month payback and the foreign-share goal. Read the financial assumptions before treating any number as a business commitment.
