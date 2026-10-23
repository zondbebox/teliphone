# Samal Journey readability and report revision plan

> For agentic workers: use Superpowers execution and verification practices. The two user attachment requests are the specification.

Goal: Refine the existing website typography and deliver an evidence-checked, honestly disclosed English review report while preserving original report and finance files.
Architecture: Keep the dependency-free Node frontend and existing route/data contracts. Centralize typography in one semantic stylesheet, removing conflicting legacy type declarations. Work on report/evidence/finance copies in revisions/2026-10-23.
Tech stack: Node 24, native HTML/CSS/JS, bundled Python documents/PDF tools, artifact-tool spreadsheets, Chrome Browser.

## Constraints
- Exact product: Samal Journey. Company: Saryarqa Routes. Preserve storage keys and API identifiers.
- Keep original reports, financial inputs/results and workbook unchanged.
- Real photographs remain unchanged. No new application libraries or public deployment.
- AI Declaration counts in the 4–8 content pages; references separate and excluded.
- Human contributions, team name and official AI level remain unconfirmed until supplied.

## Review focus
- 320px/200% zoom: headings, prices and company identity must wrap without clipping.
- Typography controls must inherit legible sizes and preserve focus and 44px targets.
- Booking calculations and persistence must survive the style-only refactor.
- Report prose must not turn assumptions into observations or attribute AI analysis to people.
- Original artifacts and model economics must remain byte-for-byte unchanged.

## Tasks
- [x] Inspect current project, user requests and tooling; install requested Humanizer.
- [x] Capture desktop/mobile baseline and inspect reference computed typography and loaded fonts.
- [x] Replace conflicting typography declarations with semantic rem/clamp tokens and apply exact branding.
- [x] Browser-check home, catalog, matching, detail, checkout, passport and operator at 320,360,390,430,768,1440; zoom, fonts, keyboard, fallback and screenshots.
- [x] Reconcile external claims with opened primary sources and financial claims with canonical workbook; retain reproducible outputs.
- [x] Apply Humanizer to report, render/inspect PDF, check DOCX capabilities, and produce editorial/fact/team notes outside report.
- [x] Run tests/check/build, independent final review, coherent commits and authorized push with remote SHA verification.

## Decisions
The user explicitly requests immediate implementation and supplies the design specification; proceed without another ideation/approval cycle. Low-impact CSS/text changes use browser verification and existing regression tests rather than implementation-mirroring tests. Reports remain review drafts when essential human/framework information is missing.

Execution limits: actual 200% browser zoom, Word visual pagination, native Excel desktop recalculation and unconfirmed team/framework details remain explicitly unverified. These limits are described in verification.md and review-notes.md. Original artifacts and economic assumptions are preserved.
