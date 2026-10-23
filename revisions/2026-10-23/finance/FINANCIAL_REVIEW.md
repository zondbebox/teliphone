# Samal Journey financial review

23 October 2026. Review draft for the team and fictional case operator, Saryarqa Routes.

The report's material financial figures reconcile to the current financial model. No numerical correction or change to a commercial assumption was needed. The revised workbook changes only its visible product title to the user's confirmed singular name, **Samal Journey**. The original workbook, inputs, summaries, calculations, previews and verification files remain unchanged.

## Files and method

- Original model: `finance/Samal_Journeys_Financial_Model.xlsx`; canonical assumptions: `finance/inputs.json`; report outputs: `finance/summary.json` and `finance/monthly_cash_flows.csv`.
- Revised copy: `revisions/2026-10-23/finance/Samal_Journey_Financial_Model.xlsx`.
- Source case: supplied `Zertex_Case1_Technology_Product.pdf`, pp. 1–2. Its company figures are fictional case facts, not externally observed business results.
- The independent Python audit recalculates every field in all 48 monthly scenario rows, the annual and 24-month totals, contribution, capacity, foreign-share denominators, peak funding and first payback crossing. It compares saved worksheet cells and formulas before/after the one-cell title edit.
- Artifact Tool imports the original workbook, changes Summary!C2, recalculates Base and Downside, checks 12 scenario results, restores Base, scans for formula errors and exports a separate copy. Seven previews across all three worksheets were visually inspected.
- `audit_results.json` records successful arithmetic and preservation checks. `original_hashes.json` records the 19 original files; all hashes match after the work. `copy_verification.json` records the live workbook checks. No original financial file was regenerated or overwritten.

## Case figures and calculation basis

| Claim | Checked result | Source and interpretation |
| --- | --- | --- |
| 2025 travelers | 3,400 | Case p. 1; Assumptions!D24. Travelers, not bookings or parties. |
| 2025 revenue | KZT 150,000,000 | Case p. 1; Assumptions!D25. Historical case revenue; excluded from incremental product cash flow. |
| Stated average | KZT 44,000 per traveler | Case p. 1; Assumptions!D12. Used as the forecast's fixed realized price. Synthetic website tour prices do not enter the model. |
| Domestic proportion | About 96% | Case p. 1. Approximate derived annual base: 3,264 domestic and 136 foreign, Assumptions!D22:D23. |
| Development and launch budget | Up to KZT 20,000,000 in Year 1 | Case p. 2; Assumptions!D26. The model's broader gross-cash comparison is an additional conservative planning test. |
| Foreign-traveler goal | 30% within 24 months | Case p. 1; Assumptions!D27. The model interprets this as the annual share during months 13–24, not the cumulative share across both years. |
| Source-case discrepancy | KZT 400,000 | 3,400 × 44,000 = 149,600,000, below stated 150,000,000. Summary!D29. Both supplied figures are preserved; the source does not establish the reason. |

Year 1 is January–December 2027 and Year 2 is January–December 2028. These dates are illustrative assumptions. Initial work is paid in months 1–3 with weights 30%, 40%, 30%. Running costs and marketing start in month 4: nine active months in Year 1 and twelve in Year 2. Revenue and variable cash costs are recognized in the travel month. The 2025 annual legacy traveler base is held flat in each forecast year solely for the foreign-share and shared guide-capacity calculations.

## Costs and unit contribution

| Initial work | Hours × KZT/hour | Recalculated KZT | Workbook |
| --- | --- | --- | --- |
| Research and journey design | 80 × 7,000 | 560,000 | Assumptions!D37:F37 |
| Product and interface design | 100 × 8,000 | 800,000 | Assumptions!D38:F38 |
| Application engineering | 480 × 9,000 | 4,320,000 | Assumptions!D39:F39 |
| QA, accessibility and security review | 120 × 7,000 | 840,000 | Assumptions!D40:F40 |
| Approved content and translation | 80 × 6,000 | 480,000 | Assumptions!D41:F41 |
| Operator training and launch | 40 × 6,000 | 240,000 | Assumptions!D42:F42 |
| Production payment integration allowance | 60 × 9,000 | 540,000 | Assumptions!D43:F43 |
| Total | 960 hours | 7,780,000 | Assumptions!D44/F44 |

The staffing description also reconciles: research/product 180 hours; application/payment engineering 540; QA 120; content/training 120. Engineering is 540 ÷ 12 = 45 combined hours per week, not evidence of one person's availability. All fees are estimates, not quotes or verified local salary benchmarks.

| Cost or margin | Recalculated value | Basis |
| --- | --- | --- |
| Active-month running | KZT 260,000 | 35,000 hosting + 15,000 AI allowance + 90,000 maintenance + 90,000 support + 30,000 content; Assumptions!F48:F53. |
| Active-month marketing | KZT 200,000 | Assumptions!D55. Counted once. |
| Year 1 running / marketing | KZT 2,340,000 / 1,800,000 | Nine active months; Summary!D12:D13. |
| Year 2 running / marketing | KZT 3,120,000 / 2,400,000 | Twelve active months; Summary!E12:E13. |
| Contingency | KZT 1,518,000 | 15% × (7,780,000 + 2,340,000); Assumptions!D57. Entire provision is a Month 3 cash outflow. Marketing and tour-delivery costs are outside its percentage base. |
| Delivery cost per completed traveler | KZT 30,800 | 70% × 44,000; planning assumption. |
| Payment cost per completed traveler | KZT 1,320 | 3% × 44,000; planning assumption subject to merchant terms. |
| Other variable service | KZT 440 per completed traveler | Assumptions!D15; planning assumption. |
| Contribution per completed traveler | KZT 11,440; 26% | 44,000 − 30,800 − 1,320 − 440. This is before project fixed costs and tax, not net profit. |
| Year 1 fixed project envelope | KZT 13,438,000 | 7,780,000 + 2,340,000 + 1,800,000 + 1,518,000; Summary!D15. |
| 24-month fixed project envelope | KZT 18,958,000 | Year 1 envelope + Year 2 running/marketing 5,520,000; Summary!F15. |

The 3% fee is not proof of actual India-issued-card pricing, acceptance, chargeback cost or refund economics. External provider evidence is checked separately in the report's source log. Supplier, tax, merchant and settlement terms remain unconfirmed.

## Revenue, cash flow, funding and payback

All monetary amounts are KZT. Summary cells refer to the chosen live scenario in Assumptions!D4.

| Report metric | Base | 30% fewer new completed travelers | Workbook |
| --- | --- | --- | --- |
| Year 1 new completed travelers | 180 | 126 | Summary!D8 |
| Year 2 new completed travelers | 1,500 | 1,050 | Summary!E8 |
| 24-month new completed travelers | 1,680 | 1,176 | Summary!F8 |
| Year 1 revenue | 7,920,000 | 5,544,000 | Summary!D9 |
| Year 2 revenue | 66,000,000 | 46,200,000 | Summary!E9 |
| 24-month revenue | 73,920,000 | 51,744,000 | Summary!F9 |
| 24-month contribution | 19,219,200 | 13,453,440 | Summary!F10 |
| Year 1 net project cash flow | (11,378,800) | (11,996,560) | Summary!D18 |
| Year 2 net project cash flow | 11,640,000 | 6,492,000 | Summary!E18 |
| 24-month cumulative project cash | 261,200 | (5,504,560) | Summary!F18 |
| Peak month-end funding required | 11,378,800, Month 12 | 12,147,792, Month 14 | Summary!F19 and monthly funding row 36 |
| First nonnegative cumulative month | 23, November 2028 | Not reached within 24 months | Summary!D27 |
| Year 1 gross cash uses | 19,298,800 | 17,540,560 | Summary!D17 |

Gross first-year uses include incremental delivery, payment and service costs as well as the fixed project envelope. Base uses are KZT 701,200 below the case ceiling. Gross uses are distinct from external funding: customer receipts fund part of the outflows, so the base peak month-end funding balance is lower. The model does not calculate intra-month liquidity or refundable customer obligations.

The model's payback is the first month with nonnegative cumulative **undiscounted incremental pre-tax project cash flow**. It is not accounting profit, a discounted valuation or guaranteed recovery. Base cumulative cash is −466,160 at October 2028, +34,800 at November 2028 and +261,200 at December 2028. No reversal occurs in the modeled final month; later periods are not modeled. Downside never crosses zero within the horizon. No later downside date is extrapolated.

Monthly operating break-even and investment payback are different. At the stated contribution, 460,000 ÷ 11,440 ≈ 40.21 expected completed travelers cover one active month's running and marketing only. This diagnostic excludes initial work, contingency and tax and must not replace the cumulative Month 23 payback calculation. It is a calculation from existing inputs, not a new assumption or forecast.

## Acquisition, foreign share and capacity

The base funnel is qualified sessions × 10% inquiries × 15% paid parties × 2 travelers × 80% completion = 2.4% expected completed travelers per qualified session, before a seat cap. The input volume is 7,500 sessions in Year 1 and 62,500 in Year 2. It produces 180 and 1,500 completed travelers; no supplied month is constrained by the planned incremental seat cap. Sessions rise 8.3333 times. This is unvalidated demand, not measured traffic.

Paid-party counts are 112.5 and 937.5 in the base funnel; these are expected values, not actual payment transactions. Multiplying by two gives 225 and 1,875 paid travelers before the completion assumption. Do not equate them to completed travelers or claim observed bookings.

The downside applies a 0.7 multiplier after the base demand/capacity calculation. It reduces new completed travelers, revenue, delivery, payment and variable service by exactly 30%. It does not reduce qualified visits, inquiries, fixed project costs, marketing or contingency. Price and foreign mix remain fixed. This tests one defined interpretation of “30% worse”; it is not a simultaneous 30% deterioration in every driver.

| Claim | Recalculation | Interpretation |
| --- | --- | --- |
| Year 1 marketing cost per new completed traveler | 1,800,000 ÷ 180 = 10,000 | Base; Summary!D23. |
| Year 2 marketing cost per new completed traveler | 2,400,000 ÷ 1,500 = 1,600 | Base; Summary!E23. A strong unvalidated improvement. |
| Paid / other traffic | 20% / 80% | Assumption, not contracted channel supply. Implied paid-session costs are 1,200 and 192 KZT by year. |
| Base Year 2 foreign share | (136 + 1,500 × 90%) ÷ (3,400 + 1,500) = 1,486 / 4,900 = 30.3265% | Rounded report 30.33%; Summary!E22. |
| Downside Year 2 foreign share | (136 + 1,050 × 90%) ÷ (3,400 + 1,050) = 1,081 / 4,450 = 24.2921% | Rounded report 24.29%; goal missed. |
| New travelers needed for 30% share | (30% × 3,400 − 136) ÷ (90% − 30%) = 1,473.33 | Expected annual incremental travelers at unchanged mix/base; Summary!D30. |
| Guide-day capacity | About 25 guides × 12 days = 300 per month | Availability assumption; Assumptions!D30:D31. |
| Peak base utilization | 63 required departures × 4 guide-days / 300 = 84% | July 2028; includes seasonal legacy and new travelers. Summary!E24. |

Capacity is an aggregate feasibility check. It does not establish individual guide language, location, credentials, date availability, transport supply or a legally workable staffing schedule. The report's 85% warning threshold is a proposed decision rule, not an independently measured safe capacity limit.

## Discrepancies, clarifications and team decisions

1. **Source discrepancy retained:** the supplied historical traveler count and average price do not exactly produce supplied revenue; the difference is 400,000 KZT. No unsupported explanation is added.
2. **No calculation discrepancy:** the report's cost, volume, revenue, margin, funding, payback, downside and foreign-share figures match the model, subject to stated rounding. Only the product name changes in the revised workbook.
3. **Timing clarified in the revised report:** Month 23 means November 2028, with nine active Year 1 operating months; payback is undiscounted incremental pre-tax cash, and the 2025 legacy base is held flat.
4. **AI usage allowance needs a team decision:** 15,000 KZT per active month remains in the model although the demo has no live AI. The team should explain its intended production use or approve a later assumption change. This audit does not silently remove it to improve returns.
5. **Commercial assumptions still need evidence:** traffic growth, 90% incremental foreign mix, conversion, supplier margin, rates, guide availability and settlement terms are not established by mathematical consistency. Keep them labeled as assumptions and obtain operator evidence.
6. **Framework/source requirement remains unresolved:** the case demands sourced figures and substantive team thinking. Arithmetic checks do not establish organizers' acceptance of unquoted planning rates or AI-generated strategic assumptions. The team must consult the separate official rules and own its choices.

No observed revenue uplift, real sales, signed supplier commitments, secured partnerships, tax benefit, cash saving or team verification is claimed. No discount rate, tax charge, financing cost or detailed advance-payment/refund timing is included. The 24-month model cannot establish post-horizon payback or later seasonal cash adequacy.

## Reproduction

Use the bundled Node runtime and `@oai/artifact-tool`; the local `node_modules` junction points to that runtime and is untracked. No installation is required. From the repository root:

```powershell
node finance/test_model.mjs
node revisions/2026-10-23/finance/build_revised_copy.mjs
& 'C:\Users\Zhanzhol\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' revisions/2026-10-23/finance/audit_finances.py
```

The builder writes only the revised XLSX, previews and copy verification. The audit writes only `audit_results.json`. Neither modifies original finance files. The audit deliberately fails if a preserved original hash differs. Native Microsoft Excel desktop recalculation has not been visually or interactively verified; this is an Artifact Tool and exported-package verification.
