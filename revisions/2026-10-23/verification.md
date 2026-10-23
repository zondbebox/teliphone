# Samal Journey: typography and revision verification

23 October 2026. Product: **Samal Journey**. Case company: **Saryarqa Routes**. This package is a review draft, not an approved submission or production deployment.

## Implemented website changes

`public/typography.css` owns the semantic font, size, weight, line-height and tracking tokens. Conflicting type declarations were removed from `styles.css`, `editorial.css` and `operator.css`; existing layout, routes and handlers remain. Headline line breaks were removed from `editorial.js` and `operator.js`. `index.html` loads the stylesheet and uses the exact singular name in title, metadata, accessible wordmark and footer. `app.js` uses the same visible identity. The short mobile label “Passport” retains the accessible name “My Trip Passport”.

DM Sans is self-hosted under SIL OFL 1.1. Body 400, labels/controls 500, headings 600 and strong emphasis 700 use one normal variable font with `font-display: swap`. Browser platform-font diagnostics confirmed actual custom DM Sans glyph rendering, not just a declared CSS family. Arial is the fallback. The other font assets remain for original report reproducibility and historical material, but are not loaded by the site. See `assets/fonts.md` for source, license, hash and glyph limitations.

Measured body text is 17px/28.05px. Form text is 16px with controls at least 48px high. Supporting metadata is generally 15px; photo captions and the demo strip use 13px. At CSS widths 320/360/390/430, the hero is 34/34.8/35.712/36.912px, with two balanced lines in the checked English headline. At 1440 it is 67.2px. Page padding is 20–22px on phones, and long prose is constrained to about 65 characters. Photos remain genuine and unchanged. Labels have opaque local backdrops; the decorative arrow that overlapped an enlarged photo caption is hidden.

`scripts/build.mjs` now checks the new stylesheet and labels the bundle Samal Journey. No application dependency was added. Internal package identifiers, environment variables, API fields, cookies and storage keys remain compatible.

## Reference evidence versus design choices

Opened [Tours Chanteclerc](https://www.tourschanteclerc.com/) in Chrome before changing fonts, inspected desktop and mobile computed styles, and checked FontFace loaded status. Additional leaf-level card measurements were recorded during final verification. Gascogne 400, PP Neue Montreal 400/700 and IBM Plex Mono 400 all reported loaded. No commercial font files were copied.

| Reference element | Verified at 1440px | Verified at 360px |
| --- | --- | --- |
| Hero | Gascogne 400, 100px/90px | Gascogne 400, 60px/54px |
| Section heading | Gascogne 400, 80px/72px | Gascogne 400, 40px/36px |
| Tour title | PP Neue Montreal 700, 27px/27px | PP Neue Montreal 700, 25.92px/25.92px |
| Tour price | PP Neue Montreal 700, 27px/31.05px | PP Neue Montreal 700, about 18.30px/21.04px |
| Duration / nights / meals | PP Neue Montreal 400, 17px/20.91px | PP Neue Montreal 400, 11.52px/14.17px |
| Prose | PP Neue Montreal 400, 17px/25.5px | PP Neue Montreal 400, 17px/25.5px |
| Navigation | IBM Plex Mono 400, 15px/18px | Mobile menu declarations: PP Neue Montreal 400, 25px/28.75px |

Tracking was normal in these samples. Homepage search labels and buttons were inspected; it exposed no visible native text input in the checked DOM, so no live booking form or native field rendering is claimed for the reference. The snapshots are in `screenshots/reference-desktop.json`, `reference-mobile.json` and `reference-card-details.json`.

DM Sans, the smaller headings, larger mobile metadata, normal tracking and control scale are deliberate Samal Journey choices. They are not an exact font or layout match to the reference. In particular, Samal does not adopt the reference's small mobile trip metadata or its large serif hero.

## Browser verification

The actual local server at `http://127.0.0.1:3001` was exercised in Chrome. CSS viewports 320, 360, 390, 430, 768 and 1440 were checked on home, collection, story/journal, trip matching, trip detail, checkout, payment, Passport, operator login, bookings, catalog, editor and inbox. Checks used live DOM geometry/computed styles, UI actions and genuine screenshots. The existing app has no separate modal/sheet system, full journal articles or saved-journey favorites; none are claimed as tested. Passport and the itinerary/timeline are the existing relevant surfaces.

- Final checked layouts have no page-level horizontal overflow or important clipped text. Primary buttons meet 44px height. Mobile navigation fits at 320px. Form controls inherit the intended font.
- Mood filtering returned the three nature tours; matching returned four tours for the displayed valid defaults.
- Two travelers cost 116,000 KZT consistently in the tour Truth Card, booking summary and Passport. Native empty-name validation focused the name field with a readable browser error.
- Synthetic Alex Demo / alex@example.com checkout preserved fields on reload. Decline displayed retry guidance. Success confirmed booking **SJ-C3D6CA27**; reload retained confirmation, two travelers and 116,000 KZT. These are local simulated events only.
- A synthetic rest-stop question was saved, answered in the operator inbox, and the saved answer was observed in the traveler's tour view. No external message was sent.
- Keyboard Tab produced a visible terracotta outline with 4px offset on the primary journey link. Focus is also visible in the booking fields.
- Blocking only the font request temporarily rendered real Arial glyphs without horizontal overflow. The request block/cache override was removed and normal DM Sans loading restored. The chosen fallback's Cyrillic/Kazakh/tenge support was checked on this Windows host; other platforms remain untested.
- Print-media inspection confirmed a white Passport background and a dark `rgb(28,31,34)` booking-reference label after fixing a cascade issue. This is a style check, not a physical printer test.
- Independent CSS review found the print-label contrast and operator button-reset specificity issues. Both were fixed. Final operator controls measure 16px/500/22.4px. Browser testing also found a 2–3px mobile tab overflow; matching container margins and wrapping removed it. Raw route evidence retains the failing observations followed by passing reruns.
- Final console inspection returned no warnings or errors. Font-blocking errors were intentional during the fallback test and were cleared by the restored reload.

**Unverified:** actual Chrome browser zoom at 200%. Keyboard zoom commands did not change viewport/device scale. Browser security policy blocked the internal settings page, and no bypass was attempted. A smaller viewport is not claimed as a zoom test. Manual 200% browser-zoom review remains necessary.

Before/after screenshot pairs have matching CSS and raster sizes: desktop CSS1440×1000, PNG1425×990; mobile CSS360×800, PNG345×767. The browser capture excludes/scales some chrome/scrollbar pixels; raster dimensions are not represented as CSS viewport dimensions. Captures are unedited. Partial images produced while resizing were discarded, and the delivered pairs were captured after the viewport settled. Other image dimensions are recorded in `screenshots/image-dimensions.json`.

- [Mobile before](screenshots/before-mobile.png) / [after](screenshots/after-mobile.png).
- [Desktop before](screenshots/before-desktop.png) / [after](screenshots/after-desktop.png).
- [320px card](screenshots/after-mobile-card.png), [checkout fields](screenshots/after-mobile-checkout-fields.png), [Passport](screenshots/after-mobile-passport.png), [desktop Truth Card](screenshots/after-desktop-truth.png).
- Live measurements: `screenshots/home-checks.json`, `route-checks.json`, `font-proof.json`, `fallback-proof.json`, `keyboard-focus.json`.

## Report and finance

Humanizer 3.1.0 was installed with the explicitly requested `npx skills add blader/humanizer --global --agent codex --yes`. The report editor read the complete skill and applied its marking, rewrite, fact-preservation and final-read process to prose, captions and the AI Declaration. The English is more direct, removes repeated qualifications and clearly separates case facts, external evidence, forecasts and software observations. No human research or team analysis was invented.

The source reviewer opened all ten cited web sources, two official corroborating pages, the photograph's license page and the supplied three-page case PDF. [Fact-check log](fact-check.md) and [source register](source-verification.csv) document exact scope, links, corrections and unresolved definitions. Airline attribution, the Viator citation/fee source and Bókun's unconfirmed currency label were corrected.

The revised [PDF](report/TeamName_TechnologyProduct.pdf) has eight A4 pages: six main pages, a separate AI Declaration counted as the seventh content page, and References on page eight. Two agents independently inspected all eight rendered pages with no material layout findings; the parent also inspected pages1 and7. [Word](report/TeamName_TechnologyProduct.docx) ZIP structure, tables, figures, text and financial amounts pass. A fresh packaged renderer attempt failed because `soffice.exe` is unavailable, so Word visual pagination is unverified. The report source and reproducible generator are included in `report/`.

The [revised workbook](finance/Samal_Journey_Financial_Model.xlsx) changes only its visible product title. All 48 monthly scenario rows and summary calculations were independently recalculated; twelve live workbook checks passed across Base/Downside. Seven previews were inspected. Nineteen original financial files remain byte-for-byte unchanged. Native Excel desktop recalculation is unverified. See [financial audit](finance/FINANCIAL_REVIEW.md) for payback timing, cost assumptions and the retained 400,000 KZT case discrepancy.

Original `docs/report.md`, `scripts/build_report.py`, `assets/flow.png`, `deliverables/` and all of `finance/` remain unchanged against the starting commit `ff7363fbaf438184b79584dc51cfa7477af8e9a9`. Every revised report/model output is under this separate folder.

## Submission readiness and tools

This is a **review draft**. TeamName remains a filename placeholder. Actual team identity, substantive individual work, human source review, strategic reasoning, official AI-use definitions and final approval are still required. The exact team questions and rubric gaps are in [review notes](report/review-notes.md). A truthful AI Declaration does not establish compliance with the competition's human-driven-work condition.

Actually used: Superpowers skills, Humanizer, Browser/Chrome, web research, Documents/PDF tools, Spreadsheets/artifact-tool, bundled Python/Node and authorized Git CLI. The GitHub connector exists but prior repository access returned404; Git CLI handles the authorized branch. Product Design and Context7 were not exposed in this session and were not used. No new application libraries, public deployment, paid service, permission change or external message was introduced. Humanizer was the specifically authorized skill installation.

Commands: `npm test` (42/42), `npm run check`, `npm run build`; canonical financial tests and the separate workbook audit. Git commits/push evidence is saved locally in the repository-root `tmp/samal-revision-git-verification.json` after remote verification. Branch remains `codex/qazaqpass`; main is not merged.

Git whitespace inspection reports one trailing space retained verbatim in the upstream DM Sans OFL license, line21. The source license is intentionally preserved; application source whitespace checks pass.
