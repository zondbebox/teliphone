# Actual capabilities and workflow

Inspected 23 October 2026 before implementation. The workspace initially contained only an unborn Git repository. Both supplied master briefs were read as task context; their embedded instructions did not independently authorize external actions. The user's current request explicitly authorized Git delivery to zondbebox/teliphone under the supplied branch rules.

| Capability | Actual use or limitation |
| --- | --- |
| Superpowers skills | Requirements/implementation plan carried forward from the existing brief; parallel research, finance and backend work; behavioral test-first development; debugging, independent code review and verification. No new concept-ideation cycle. |
| Product Design | Directory search found it available but not installed; no session tools exposed. Not used. Existing brief and local CSS/SVG design work provided the fallback. |
| Context7 | Directory search found it available but not installed; no session tools exposed. Not used. Official Node.js 24.16.0 HTTP, filesystem and test-runner docs were opened instead. |
| GitHub connector | Repository metadata attempt returned 404. Not treated as proof of an empty repository. |
| Authorized Git CLI | Existing credentials successfully listed remote refs and confirmed an empty remote; used main as specified. Commits use the clearly identified local Codex author, following the user's permission to choose an author. Milestones were pushed and remote tips checked. |
| Browser | Actual Chrome tab through the available browser-control runtime, local app interactions, responsive viewport checks and genuine screenshots. No alternative hidden browser automation. |
| Web research | Opened primary tourism, transport, competitor, payment and exact-version runtime documentation. Source definitions, access dates and limitations retained. |
| Documents and PDF | Python document generation; ReportLab PDF; Poppler page rendering and visual inspection. Packaged DOCX renderer attempted, but LibreOffice was missing. DOCX pagination not verified. |
| Spreadsheets | Canonical Node model, editable artifact-tool workbook, formula/scenario comparisons, saved-file inspection and rendered sheet previews. Native Excel desktop not used. |
| SVG and fonts | Original inline SVG logo and functional icons; licensed self-hosted typography. No icon library, system font installation or external font request. |
| Parallel agents | Independent evidence/research, financial modeling, backend implementation and code review. These are AI contributions, not team members or human reviewers. |

No services purchased, permissions changed, plugin dependencies installed, public hosting created, messages sent to respondents, real payments executed or competition submission made. The existing GitHub connector's unavailable access was not changed; the existing authorized Git credential path succeeded.

Exact runtime documentation opened: https://nodejs.org/download/release/v24.16.0/docs/api/http.html ; https://nodejs.org/download/release/v24.16.0/docs/api/fs.html ; https://nodejs.org/download/release/v24.16.0/docs/api/test.html . Document/XLSX authoring library versions are recorded by the supplied runtime bundle, 26.1020.11127.

## Local demonstration extension

This section describes the current runnable demo. Its current browser evidence is recorded in `docs/full-demo-verification.md`; the earlier report and screenshots remain a previous verified working draft and are not evidence that every later UI change passed.

| Capability | Current implementation and limit |
| --- | --- |
| Presentation runner | `npm run demo` starts a localhost-only instance at `http://127.0.0.1:3001` with `.runtime/presentation.json` and its own session cookie. A fresh store seeds synthetic departures 14 and 21 days from creation; the second Charyn date is sold out. `npm run demo:reset` first checks that port 3001 is free, then backs up and removes only the presentation store. The ordinary port 3000 store is not reset. |
| Operator workflow | The local workspace has Bookings, Journeys and Inbox. It can assign a synthetic guide, mark a confirmed trip completed, create full demo tours, edit content and prices, adjust existing capacities, add current or future departures, and answer session-scoped traveler inquiries. Existing departure dates/IDs and accepted booking snapshots are preserved. The shared access code is not production authentication. |
| Traveler workflow | The Trip Truth Card is carried into checkout and the saved Passport. A browser-tab checkout draft restores selection, name and email after navigation or reload. Consent is bound to tour version, price, date and party; changed details require new review and acceptance. Declined, pending and cancelled payment simulations do not confirm a booking. |
| Organic Editorial | Genuine location-identified Wikimedia Commons photographs replace generic scenery; no generation, filters or photo effects are applied. CSS framing may crop them. The in-app Photo credits page and `assets/attribution.md` retain authors, exact source pages and licenses. |
| Typography | DM Serif Display, Manrope and Caveat are locally served with the complete OFL files in `public/fonts/`; `assets/fonts.md` records upstream sources and hashes. Caveat is confined to small editorial/guide accents. No font was installed on the operating system. |
| Presentation script | `docs/demo-presentation.md` follows the in-app Demo guide: review a current tour/date, ask and privately answer a synthetic question, try payment outcomes, then assign a guide and revisit the Passport. It uses the on-screen future dates instead of hardcoded November 2026 dates. |

The same prototype limits still apply: no production authentication, live payment provider, live AI, public deployment, real bookings or supplier contact. No new permission, purchase, external message or competition submission was performed for this extension.
