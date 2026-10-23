# Public Samal Journey demo implementation plan

> For agentic workers: use Superpowers subagent-driven development or executing plans. Preserve the existing approved design and domain rules.

**Goal:** Give the user a persistent public URL that others can open and use to explore the existing demonstration.

**Architecture:** A separate static Sites deployment retains the current interface. A browser-session adapter reuses the booking/catalog domain rules, with each tab's synthetic records stored in sessionStorage (memory fallback if unavailable). No public API or shared operator database is deployed. The original localhost app and its records remain intact.

**Tech stack:** Existing native HTML/CSS/JavaScript and Node build/test scripts; no additional dependencies.

**Spec:** User request to create a shareable link; previously approved Samal Journey by Saryarqa Routes frontend. Hosting must preserve photography, typography, Trip Truth Card and demonstration booking flow.

## Constraints

- Only sanitized application source and licensed assets enter the hosted bundle.
- Never copy runtime records, credentials, screenshots of records, report drafts or Git metadata.
- Clearly label synthetic data, simulated payment and browser-session storage.
- Preserve real-photo credits, font license and honest AI disclosure.
- Operator interactions affect only the visitor's own sandbox.
- Public access is requested by the user; no paid service or custom domain purchase.

## Implementation and verification

- [ ] Add tests for session isolation, reload persistence, payment retry, snapshot consistency, operator changes, questions, storage failure and scoped reset.
- [ ] Generate a browser-compatible domain store from retained source and connect the explicit application API adapter.
- [ ] Build static dist with hosted-specific demo explanations and reset control.
- [ ] Review generated output for unwanted network calls and sensitive/runtime files.
- [ ] Exercise actual browser booking and operator flows; inspect desktop/mobile rendering and independent tabs.
- [ ] Sync exact source using the Sites helper, package, set requested public access and deploy saved version.
- [ ] Verify successful deployment, anonymous HTTP access, hosted assets and visible UI. Save a genuine screenshot.
- [ ] Preserve source and verification record on the existing authorized GitHub branch.

## Review focus

ES module startup ordering; stale booking quotes; browser storage failure; reset boundaries; operator sandbox isolation; static-host MIME/path handling; no real booking or question data transmitted.
