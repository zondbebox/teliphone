# Public demo verification — 23 October 2026

URL: https://samal-journey.burger1223333.chatgpt.site

Sites deployment succeeded with public access. Anonymous HTTP requests without a cookie or authenticated browser returned 200 for the home page and hosted JavaScript runtime. The actual hosted page rendered the existing Samal Journey by Saryarqa Routes design.

## Deployment identity

- Project: `appgprj_6adb8c49c9348191a113a55935019c3e`
- Version: `appgprj_6adb8c49c9348191a113a55935019c3e~appgver_9215b825447c81919ac7cd682dda8e65`
- Deployment: `appgdep_6adb912b1a088191b2043ac872ff3fa0`
- Verified Sites source commit: `43a56166f3f0e16240a29cedba04619944db1e0d`
- Archive hash: `sha256:705e0d1cbc635b0e9fd1f490eea75000422369e39b8a7395c826d79ed8780974`

The installed Sites helper synchronized and verified the exact source, then packaged the build. This repository retains the sanitized source and builder under `hosting/samal-journey`; generated dist is reproducible and ignored by the parent repository. Sites has a separate source repository used by its publishing workflow. No credentials are recorded here.

## Checks

- 18 generated-store/API tests pass, independently reviewed: visitor isolation, persistence, payment transitions/capacity, snapshots, idempotency, authoring, replies, corrupted/full/blocked storage and scoped reset.
- Original localhost regression suite remains separate; 42/42 tests passed after the root test-command adjustment.
- Local static preview in Chrome: Charyn for two travelers, total 116,000 KZT; decline then success; confirmed Passport survives reload; guide assignment and question/reply appear in the traveler view.
- A separately opened tab starts with no bookings; resetting that tab preserves the first tab's confirmed booking and guide.
- Actual published HTTPS origin: two-traveler checkout, simulated success, correct total and confirmed Passport after reload. Reset returns to a clean home page.
- Network observation during hosted booking and reload contains page/asset GET requests, no API request, POST or booking payload. No browser console errors were captured. See `network.json`.
- Actual published screenshots: desktop at 1440×1000 CSS viewport and mobile at 390×844. No horizontal overflow. Local static preview also checked at 320 CSS pixels. Visible hero photographs loaded successfully; photographs below the fold use normal lazy loading.

The screenshots are direct browser captures, without image editing. Automated clicks affected by smooth-scroll timing were completed and verified with keyboard form submission. All temporary viewport overrides were cleared before handoff.

## Limits and disclosure

This is a public demonstration, not a production booking service. Session storage is per tab; browser duplication/restoration can preserve a copy. Blocked storage uses memory with visible warnings; if deletion is denied, a prior saved copy can return on reload. Users should enter synthetic details only. Operator edits affect the same browser sandbox, not other visitors. No real payment, email, external inquiry, live AI or shared operational database is connected.

Tests used desktop Chrome with mobile viewport emulation, not physical phones or Safari/Firefox. The public link's continued availability depends on the Sites service/account. No custom domain was purchased. The original localhost server and report/financial artifacts were preserved. Team review and honest AI disclosure remain required.

Tools used for this publication: Sites, Browser via cua_repl, Superpowers planning/TDD/verification, Node, and authorized Git. No new application dependency or paid service was added.
