# Verification record

Executed 23 October 2026 against the local working package. These are AI-assisted technical checks, not real-user research or substantive team approval.

## Automated checks

- `node --test` / `npm test`: 20 tests pass: 14 HTTP/domain behaviors, five UI regressions and one font-serving test.
- `npm run check`: JavaScript syntax checks pass. There is no separate TypeScript or lint configuration; neither is claimed as run.
- `npm run build`: runnable local bundle generated; syntax and required assets checked. No deployment occurred.
- `node finance/test_model.mjs`: independent cash totals, downside, 24-month periods, capacity, foreign denominators, payback and sensitivity checks pass.
- Workbook builder: live Base/Downside outputs agree with canonical calculations; no formula-error matches. `finance/verify_export.py` reopens the saved XLSX and checks formulas, cached values, selector, freeze panes and errors.
- Report checks: see `deliverables/report_verification.json` for the final file hash, A4 dimensions, actual page count and review status.

HTTP coverage includes simultaneous capacity competition, duplicate creation and payment events, pending holds, declined/cancelled releases, retry capacity checks, past-departure rejection, immutable accepted price/terms, stale quotes, consent/input validation, ownership isolation, admin access, origin checks, bounded JSON bodies and restart durability.

Independent code review found malformed matching options, stale asynchronous page/quote updates, loss of matching date/party context and missing mobile Passport navigation. These were fixed. The stale success/error, submitted quote and matching-context regressions were observed failing and then passing. Real browser checks confirmed the selectable options and mobile navigation. The tests' limited DOM boundary does not substitute for browser inspection.

## Genuine browser exercise

Chrome controlled through the available browser tool, using `http://127.0.0.1:3000`. No provider sandbox or external booking service was contacted.

| Journey / condition | Observed result |
| --- | --- |
| Charyn 7 November, two travelers | KZT 58,000 per traveler; KZT 116,000 at review, payment and Passport |
| Payment sequence | Declined -> pending -> cancelled -> success; each intermediate status shown honestly; only success confirms |
| Passport | Reference, saved itinerary, meeting instructions, real application event timeline and initially unassigned guide visible |
| Reload and server restart | Existing booking and guide assignment remained visible after reload and a controlled server restart |
| Operator update | Assigned synthetic Demo Guide A; its assignment appeared in the traveler's Passport and timeline |
| Sold-out departure | Charyn 14 November explicitly marked sold out and disabled |
| No match | KZT 1 budget returned no results; Adjust preferences retained the matching screen |
| Valid filters | All city, nature/culture and difficulty choices selectable; Almaty/nature/moderate produced two fitting tours |
| Matching context | Burabay, 14–15 November, party three retained 14 November and three travelers when opening the match |
| Mobile booking | At 360px, synthetic Taylor Demo / taylor@example.com booking completed; Passport showed 14 November, three travelers, KZT 144,000, confirmed |
| Mobile navigation | Passport entry visible from Home; existing Charyn booking opened successfully |
| Responsive layouts | 360x800, 768x1000 and 1440x1000 screenshots inspected. Mobile and tablet document scroll widths stayed within viewport widths. Forms, tour card and booking summary remained usable. |
| Keyboard | Tab reached lead traveler field with visible solid focus outline; labels and synthetic-details instructions exposed through accessibility tree |
| Assets | Genuine licensed Charyn photograph; SVG logo/arrows/inclusion/location/duration icons; locally served DM Serif Display and Manrope typography |
| Console | No browser error or warning entries observed in the final inspection |

Screenshots in `assets/screenshots/` are genuine application captures. `report-truth-card.png` is a crop of the actual tour screenshot for readability, not a generated UI. Some workflow evidence images predate the final font polish; final homepage/tour/Passport and mobile/tablet images show the latest visual direction.

## Document and financial visual checks

The original three-page case PDF was read and visually inspected. The report uses six main A4 pages, a separate References page and a separate AI Declaration, subject to the final hash-linked record. The generated PDF pages were rendered with Poppler and inspected for clipping, layout and legibility. The editable DOCX reopens and contains the intended tables/images, but **DOCX pagination is unverified**: the packaged renderer failed because LibreOffice `soffice.exe` was not found. Native Excel desktop recalculation is also unverified; workbook formula-engine, saved-file and rendered-preview checks were performed.

## Remaining limitations

No real users interviewed or tested. No team member/source verification or competition approval invented. Missing official Stage 1 Rules and Levels of AI Use framework remain unresolved. Fonts and image licenses are included; no repository-wide open-source license was selected. The local demo still lacks production identity, database concurrency across processes, reservation expiry, real payment/provider integration, broad catalog editing, localization and offline/PWA features. Those limitations are also disclosed in README and the report.

## Git delivery checks

Authenticated read-only `git ls-remote` completed successfully with no refs before initial creation; the browser also displayed the empty private repository. Initial branch `main` follows the supplied empty-repository rule. GitHub connector metadata itself returned 404 and was not used as evidence of emptiness. No existing workflows were present to trigger deployment. Intended files and outgoing history were reviewed and scanned before pushing. The final handover records the actual pushed SHA after a fresh remote-tip comparison. No force push, history rewrite, permission change, merge into an existing branch or public deployment occurred.
