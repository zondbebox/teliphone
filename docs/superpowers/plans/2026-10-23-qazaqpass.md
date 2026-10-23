# QazaqPass implementation plan

> For agentic workers: use superpowers:executing-plans or subagent-driven-development. The supplied QazaqPass brief defines the product; do not restart ideation.

**Goal:** Deliver an English, runnable local booking prototype and an evidence-based, financially reproducible team-review package.

**Architecture:** One localhost Node server serves a static responsive UI and validated JSON API. One durable local JSON store holds versioned catalog records, bookings, ownership and event history. Booking snapshots preserve the reviewed Trip Truth Card. No live payments or external AI requests.

**Tech stack:** Node.js 24.16.0, native HTTP/filesystem/test modules, semantic HTML, CSS, browser JavaScript. Python document and spreadsheet tools supplied by the desktop runtime. No npm dependencies.

**Spec:** Supplied QazaqPass master briefs and the three-page Zertex_Case1_Technology_Product.pdf. Source documents remain outside the repository. docs/requirements.md maps requirements.

## Global constraints
- English only; fictional company facts preserved exactly.
- Demonstration data and AI-proposed decisions visibly labelled.
- No real cards, passport details, payments, interviews, approvals or public deployment.
- 4–8 A4 main report pages, separate References and AI Declaration.
- One finance model, 24 months, downside = 30% fewer incremental completed travelers.
- GitHub target only zondbebox/teliphone. Preserve remote history; main only if confirmed empty, otherwise codex/qazaqpass.

## Design decisions carried forward
Warm white, charcoal and lake teal; editorial tour imagery and generous space. Tour detail prioritizes duration, departure city, price, inclusions, exclusions and cancellation before checkout. Mobile uses a visible booking action without covering content. Journey: discover > match > truth card > departure > review > payment simulation > passport > operator update.

Node with no dependencies is the implementation choice for this bounded local demonstration: it is runnable using the existing runtime, avoids dependency installation and keeps server validation testable. The proposed production pilot needs stronger authentication, database concurrency, provider integration and monitoring. No claim that the supplied brief mandated this stack.

## Review focus
1. Two users competing for remaining seats cannot oversell.
2. Duplicate payment events cannot duplicate confirmation or consume seats twice.
3. Bookings preserve accepted price/terms when catalog changes.
4. Private booking/admin data cannot be read through another browser session.
5. Sold-out, invalid dates and no-match states remain honest and usable on mobile.

## Task 1: evidence and finances (parallel)
- [x] Read all case pages, extract requirements and missing rules.
- [x] Open primary sources; write research/sources.csv and assumptions.
- [x] Build finance/inputs.json, calculation script, monthly outputs, summary.json and formula XLSX.
- [x] Independently check downside ratios, costs, cash flow, payback and foreign share.

## Task 2: server and domain
Files: server.mjs, lib/catalog.mjs, lib/store.mjs, tests/*.test.mjs.
- [x] Write behavioral tests before implementation and observe failures.
- [x] GET /api/catalog returns {tours}; tours expose id,title,region,city,days,price,difficulty,interests,description,itinerary,included,excluded,cancellation,meeting,updatedAt,departures [{id,date,capacity,available}].
- [x] POST /api/match takes {startDate,endDate,party,budget,city,interest,difficulty}; returns {tours,explanation}.
- [x] POST /api/bookings takes {tourId,departureId,party,name,email,acceptedTerms,idempotencyKey}; returns {booking}. GET /api/bookings lists own; GET /api/bookings/:id reads own. Each booking: id,reference,status,party,total,name,email,tour (snapshot),departure,guide,timeline.
- [x] POST /api/bookings/:id/payment takes {outcome,eventId}; outcomes success,declined,cancelled,pending. Returns {booking}. Only confirmed means successful demo payment.
- [x] GET /api/admin with x-admin-key returns {tours,bookings,questions}. PATCH /api/admin/bookings/:id supports guide and status completed only when confirmed. PATCH /api/admin/tours/:id supports price, cancellation and departure capacity without invalidating holds.
- [x] Protect mutation origin, bound request body, sanitize public errors, use ownership cookies and no-store responses. Bind 127.0.0.1 only.
- [x] Run node --test; record actual results.

## Task 3: responsive product UI
Files: public/index.html, public/app.js, public/styles.css, public/images/.
- [x] Build catalog, matching form, tour detail/Truth Card, checkout, payment controls, passport and admin.
- [x] Use catalog from server throughout, safe DOM encoding and accessible labels/focus.
- [x] Browser-test full booking, decline/retry, pending/cancelled, no matches, sold-out and operator update.
- [x] Inspect 360/768/1440 widths and save real screenshots.

## Task 4: report and handover
Files: docs/report.md, scripts/build_report.py, deliverables/, assets/.
- [x] Report consumes finance summary, opened sources and actual screenshots.
- [x] Export editable DOCX and PDF; inspect every PDF page, page counts and citations. DOCX structure verified; visual pagination remains unverified because LibreOffice is unavailable.
- [x] Independent code/package review; fix significant findings with regression tests.
- [x] Final checks, secret scan, intended-file review, coherent commits and authorized push if access permits; verify remote SHA.

## Progress and limitations
Implemented the bounded local demonstration and produced the research, financial and report package. Twenty automated application tests pass; browser evidence covers the full desktop and mobile journey and 360/768/1440 widths. The report has six main A4 pages plus References and AI Declaration, all visually inspected. The financial workbook and both scenarios were independently checked. See docs/verification.md and deliverables/report_verification.json for evidence and limits. The user authorized a chosen Git author; local commits identify Codex <codex@localhost>. An authenticated empty remote permits main under the supplied rule. Git delivery is recorded in the final handover after remote-tip verification. No public deployment occurred. Official AI rules, team eligibility, substantive human authorship review and real-user validation remain pending and are not marked complete by this implementation checklist.
