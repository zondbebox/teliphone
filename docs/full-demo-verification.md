> Historical workflow verification before the Samal Journeys rebrand. Current brand and artifact evidence: [samal-verification.md](samal-verification.md).

# Full demonstration verification — 23 October 2026

This record covers the Organic Editorial and full operator/traveler extension on `codex/qazaqpass`, based on `32a600b`. It supersedes UI/runtime claims in the earlier verification record only where explicitly described below. Evidence was collected from the actual local application, not a generated mockup.

## Automated evidence

Final source: `npm test` passed **41/41**, with zero failures, skips or cancellations; `npm run check` and `npm run build` exited successfully. The build checks syntax and copies a runnable local bundle; it is not visual proof. No additional application dependencies were installed. Runtime: Node.js 24.16.0.

Coverage includes operator creation/editing and atomic validation, immutable accepted booking snapshots, capacity and payment idempotency, browser ownership, private question/answer persistence, migration of old records, isolated presentation cookies, backed-up reset and occupied-port protection, checkout draft restoration, changed-term re-consent, stale route responses and overlapping booking requests. Behavior fixes were checked with failing-then-passing regressions. UI tests use a limited DOM boundary; they are supplemented by browser checks below.

## Genuine browser evidence

Chrome was controlled through the available Browser tool on `http://127.0.0.1:3001`. Only synthetic names and example.com addresses were used. No real payment, booking, email or supplier message occurred.

| Scenario | Observed result |
| --- | --- |
| Mood filters | All four seeded tours; culture shows one, nature shows three. |
| Departure/Truth Card | Available Charyn departure on 6 November; 13 November disabled as sold out. Sample unit price 58,000 KZT. Dates are seeded relative to a fresh presentation launch. |
| Private question and answer | Traveler rest-stop question saved; operator Inbox changed from Open to Answered; saved answer visible on the traveler Passport after server restart. |
| Full tour creation | Created synthetic Almaty Slow Weekend — Demo with two itinerary days, required content, price 54,000 KZT and 5 December capacity eight. |
| Matching authored content | 5–6 December, Almaty, nature, easy and budget 60,000 KZT returned exactly the newly authored tour. |
| Mobile checkout draft | Alex Demo details survived changing party from two to three and a page reload. Consent cleared and total changed to 174,000 KZT. |
| Payment states | Declined, then Pending, then Confirmed were visibly distinct; only simulated success confirmed QP-248CCD92. |
| Guide assignment | Dana Demo saved in operator Bookings and appeared on the Passport and timeline. |
| Catalog edit and departure | Charyn price changed to 61,000 KZT; multiline cancellation terms and a 12 December departure/capacity eight saved as version two. |
| Accepted terms | Existing Passport remained version one, 58,000 KZT per traveler and 174,000 KZT total with the original cancellation policy. |
| Responsive layouts | Inspected 360×800, 768×1000 and 1440×1000. Document widths stayed within each viewport. Tablet navigation gap fixed and verified at 768px. |
| Keyboard | Tab reached mood filter with a visible solid focus outline. Semantic field labels and navigation exposed through accessibility tree. Reduced-motion CSS is present; no screen-reader conformance audit is claimed. |
| Photos | All three hero photographs loaded. Computed filter and transform were both none. Notes are static below card images. No photo parallax, zoom or hover effects. |
| Console | Final captured browser warning/error log was empty. |
| Fresh presentation | QA records backed up by the reset command; dedicated server restarted with four seed tours. Ordinary port 3000 store was not reset. |

Screenshots are in `assets/screenshots/full-demo/`. Desktop home/collection and mobile home show the final source. Tablet home includes the repaired navigation. Checkout/Passport screenshots document the synthetic test booking before reset. Captures use the Browser tool's supported Page.captureScreenshot capability at the stated viewport, without image post-processing. Some earlier captures in the repository predate this extension.

## Independent review and resulting fixes

A separate AI reviewer identified and re-reviewed three behavior defects: a delayed checkout could clear a newer draft, multiline text was rejected, and incremental departures could exceed the authoring limit. Each was fixed with regression coverage. A separate final CSS audit identified the 761–800px navigation gap; the breakpoint was aligned and verified in Chrome. Handwritten notes were moved outside photos to follow the user's latest no-effects direction. AI reviewers are not human team members or real user testers.

## Scope and remaining limits

The existing native HTML/CSS/JavaScript and Node architecture was retained; React, Tailwind and Framer Motion were preferences and were not introduced. Local licensed DM Serif Display, Manrope and Caveat supply the type hierarchy. Original SVG branding and functional icons remain. Genuine destination photographs, attribution and licenses are bundled. The journal quote is explicitly brand philosophy, not an invented traveler testimonial.

Superpowers, Browser, web/source research, authorized Git CLI and local filesystem/runtime tools were used for this extension. Product Design and Context7 were unavailable as installed tools and were not used. The GitHub connector's earlier access failure was not bypassed by changing its permissions; authorized Git credentials are used for delivery. The earlier document/PDF and spreadsheet work remains recorded in `docs/tool_workflow.md`.

The report PDF/DOCX and canonical financial model were not regenerated by this frontend extension. Their prior verification still applies to those unchanged files; they are not a report of the current UI. DOCX pagination, human team review, real-user research and final competition-rule confirmation remain outstanding. The application is a polished local demo: production authentication, a transactional database, hold expiry, live payments and supplier operations remain launch work. No public deployment, purchase, permission change or competition submission occurred.
