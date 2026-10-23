# Samal Journey browser demo

A public, static demonstration of Samal Journey, a digital product for the fictional Saryarqa Routes company. The existing design, genuine licensed destination photographs, local DM Sans font and traveler/operator flows are retained.

This is a browser-session sandbox. It has no booking server, payment provider, email delivery, live AI or production authentication. Use synthetic details only. Enter `local-demo-only` in the operator view to enable that view in your own session; the value is a public demo toggle, not a secret.

## Reproduce

Requires Node 22 or newer. No dependencies or package installation are needed.

```sh
npm test
npm run build
npm run preview
```

The preview serves only `dist/` at `http://127.0.0.1:3002`. Deploy only `dist/` as static files. The hosting manifest is managed separately at `.openai/hosting.json`.

## Source and data

`source/public/` and `source/domain/` retain sanitized copies of the original UI, catalog and Store code. No runtime records, bookings, logs, reports or original Git metadata were copied. `scripts/build.mjs` reads only this project's retained source, copies the assets and generates the browser runtime. The original application's server and repository files remain untouched.

The generator changes Store imports, constructor and persistence; booking validation, accepted Truth Card snapshots, availability, idempotency, payment transitions, matching and operator authoring rules are retained. WebCrypto supplies random identifiers. The existing frontend `api()` entrypoint calls an explicit local adapter. There is no fetch interception, service worker or network booking API. Hosted-only wording and the reset notice are generated without modifying the retained original UI files.

Each browser tab uses `sessionStorage` keys `samalJourney.hostedDemo.v1` and `samalJourney.hostedCheckout.v1`. Reloads retain the same tab's demo when storage works. Other visitors have their own state; operator edits affect only the current session. Browser duplication/restoration can copy or restore session storage. A reset removes only this app's keys. Fresh sessions seed departures 14 and 21 days ahead.

Blocked/full storage falls back to memory and shows a notice. Memory changes may be lost on reload; previously saved data may return if a later write failed. When storage removal itself fails, reset clears the current in-memory session without reloading a stale stored copy. The top notice explicitly warns that a saved copy may return on reload and directs the visitor to clear this site's browser data. No real personal information should be entered.

The hosting service receives normal page/asset requests; entered form data is not transmitted by this app. Copyright/license notices are retained under `source/credits/`, `dist/credits/` and the font files. The visible Photo credits page retains author/source/license links. AI-assisted authorship and substantive team review requirements remain on About.

## Verification

`npm test` rebuilds and exercises real generated Store/API behavior: isolated visitors, reload persistence, decline/pending/cancel/success capacity, immutable accepted terms, repeated requests, stale quotes, operator authoring/guide/replies, unknown routes, storage failure, corrupted storage and scoped reset. Build evidence with source/output SHA-256 values is written to `.generated/build-evidence.json`.

Browser QA and public-host deployment verification are recorded separately by the coordinating task. Automated tests do not establish native browser rendering, production readiness or competition compliance.
