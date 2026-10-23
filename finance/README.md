# QazaqPass financial model

This is an AI-assisted planning draft for substantive team and operator review. All forecast demand, conversion, margin, capacity and cost inputs are estimates. Company facts are preserved from the supplied `Zertex_Case1_Technology_Product.pdf`, pages 1–2. The main task read and visually inspected all three original pages. This does not claim that team members have reviewed or approved the assumptions.

`inputs.json` is the canonical source. `calculate.mjs` produces `summary.json` and `monthly_cash_flows.csv`. The report must use the generated summary, not a separately maintained financial table. The XLSX has a single live forecast with an editable Base/Downside selector on Assumptions. Switching the selector recalculates all months and headline outputs. The CSV contains the full 24-month results for both cases at once.

Run with Node.js 24 or another compatible modern Node.js:

```powershell
node finance/calculate.mjs
node finance/test_model.mjs
```

To regenerate the editable workbook, use the bundled workspace Node runtime and `@oai/artifact-tool` package, then run `node finance/build_workbook.mjs`. The authoring package is an environment capability, not an application dependency. The local `finance/node_modules` junction points to that bundled runtime and must remain untracked. Workbook rendering and formula checks run as part of the builder. Do not install similarly named packages from an unknown source.

The workbook is editable for exploration. Its changes do not automatically write back to JSON. Apply approved assumptions to `inputs.json` and regenerate the outputs before updating the report, so JSON, CSV and XLSX remain one reproducible model.

## Basis

- The illustrative forecast runs January 2027–December 2028. Year 2 means January–December 2028, not a cumulative share over two years.
- Base completion is 180 new travelers in Year 1 and 1,500 in Year 2. No revenue uplift is credited to existing customers changing sales channel.
- The funnel is qualified sessions × 10% inquiries × 15% paid parties × 2 travelers × 80% completed, capped at planned incremental seats. Qualified sessions are 7,500 and 62,500 respectively. The Year 2 increase of 8.33 times is ambitious and unvalidated.
- Assumed channel mix is 20% paid and 80% earned, direct, referral or partner traffic. Marketing appears once as a cash expense. Its cost per completed traveler is an output, not a second expense. No partnership is claimed to exist.
- Average realized price is the case's KZT 44,000. Delivery costs are estimated at 70% of revenue, payment costs at 3%, and variable service at KZT 440 per completed traveler. Contribution is KZT 11,440, or 26%, per traveler before project fixed costs. Prototype tour prices are synthetic and are not used here.
- Initial work costs KZT 7,780,000 from 960 paid hours and explicit estimated rates. Monthly running costs are KZT 260,000 from Month 4, including support and maintenance. Marketing is KZT 200,000 monthly from Month 4.
- The KZT 1,518,000 contingency is 15% of initial work plus Year 1 running costs. The entire reserve is conservatively treated as spent in Month 3, not as an extra return or an unspent asset.
- Revenue and tour cash costs settle in the travel month. No customer advance float, financing, cash savings, tax benefit or legacy revenue is counted. Actual tax, supplier and settlement terms may increase funding requirements and need validation.
- The strict first-year test includes development, running, marketing, contingency **and** incremental tour delivery/payment/service cash costs. Base gross uses are KZT 19,298,800 against the KZT 20,000,000 ceiling. The fixed project envelope alone is KZT 13,438,000. Peak external funding is a distinct net cash measure.
- Exactly 30% fewer incremental completed travelers defines the downside. Price and foreign mix remain unchanged; delivery, payment and variable service costs move with travelers. Initial work, operating costs, marketing and contingency remain identical.
- The annual legacy baseline stays at approximately 3,264 domestic and 136 foreign travelers. Year 2 base share is 1,486 / 4,900 = 30.33%. Downside share is 1,081 / 4,450 = 24.29%. At the assumed 90% new foreign mix, the target needs at least 1,473.33 expected incremental travelers in Year 2.
- Capacity uses 12 seats per departure, four guide-days including buffer, and about 25 freelancers each available 12 days monthly. Maximum modeled base utilization is 84%. This aggregate calculation does not prove guide language, location, transport or date availability.
- The preserved case values do not exactly reconcile: 3,400 × KZT 44,000 = KZT 149,600,000, KZT 400,000 below the stated revenue of KZT 150,000,000. No historical figure is silently corrected.

## Interpretation and gates

Base payback first occurs in Month 23; the 24-month cumulative cash result is only **KZT 261,200**. Downside payback is not reached in 24 months and cumulative cash is **negative KZT 5,504,560**. No later payback date is extrapolated. The base is fragile, not a robust investment commitment.

Before expanding, the operator should verify the actual contribution per completed booking, separate new customers from migration, measure qualified visits and completed cohorts, secure matching guide and transport availability, and confirm card fees and settlement terms. The Year 2 base requires marketing cost per completed new traveler to fall from KZT 10,000 in the pilot to KZT 1,600. Do not scale spending based on the forecast alone. Collect enough completed pilot cohorts to judge whether the assumed 2.4% session-to-traveler yield and margin are attainable; the operator must set acceptable evidence and investment thresholds.

## Verification

The deterministic checks independently reconcile cash totals, unit margin, cost ceiling, annual foreign-share denominators, exact downside treatment, payback crossing, all monthly capacity bounds, zero demand and capacity constraints. The workbook builder checks both live selector values against the deterministic model and changes a late-period traffic input to verify recalculation and the seat cap. `workbook_verification.json` records formula checks and limitations. Workbook sheets are rendered to PNG and visually inspected. Native Microsoft Excel desktop recalculation is not claimed.

Expected results are projections. Fractional monthly counts are retained to avoid distorting the exact downside. The AI-use declaration and official eligibility, authorship and competition-rule review remain team responsibilities.
