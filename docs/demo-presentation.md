# Samal Journeys: 2–3 minute local presentation

Use this with the in-app **Demo guide** at `http://127.0.0.1:3001/#demo`. All names, prices, departures, questions and answers in this walk-through are synthetic. No real booking, charge, email or supplier contact occurs.

## Prepare

From the project folder, with port 3001 free:

```powershell
npm run demo:reset
npm run demo
```

Open `http://127.0.0.1:3001/#demo` in one browser and keep using that browser session for both traveler and operator views. The reset makes a timestamped backup of any previous `.runtime/presentation.json` before the next launch seeds a fresh store; it refuses to run while the presentation server occupies port 3001. This instance has its own data and cookie, separate from the ordinary port 3000 demo.

The fresh presentation store places departure dates **14 and 21 days after it is created**. Read the available Charyn date from the screen. Do not assume a fixed calendar date. The later seeded Charyn departure is sold out. If a previous presentation changed the inventory, stop the server and repeat the reset before presenting.

## On-screen run sheet

| Time | Action | What to say |
| --- | --- | --- |
| 0:00–0:35 · Explore | On **Demo guide**, choose **Open the demonstration tour**. Show the available future date and two travelers. Point to the **Trip Truth Card**: included and excluded items, meeting point, physical demands, cancellation terms and questions needing human confirmation. | “Travelers see the actual demo terms before deciding. The total and availability come from the same catalog that the operator maintains.” |
| 0:35–1:05 · Ask | In **Ask about this trip**, enter **Can the walking route include rest stops?** and save. Open **Operator workspace → Inbox**, enter the local access code (`local-demo-only` by default), and answer **Demo answer: We can plan rest stops; confirm the route before a real trip.** Return to the Charyn tour in the same browser session and show the answer. | “The question reaches the local operator inbox. The answer goes back to this traveler session; it is not a public claim or live support service.” |
| 1:05–2:05 · Book | Choose the available departure for two, then **Review this trip**. Enter **Alex Demo** and **alex@example.com**. Point to the total and terms; accept them and continue. Choose **Simulate decline** or **Simulate pending** and show that the booking is not confirmed. Then choose **Simulate success**. | “Checkout keeps the selected trip and reviewed terms together. These buttons test payment states locally; no money or card data moves. Only the success event confirms the demo Passport.” |
| 2:05–2:45 · Prepare | Open **Operator workspace → Bookings**, assign **Demo Guide A**, and save. Reopen **My Trip Passport** in the same browser session and refresh. Show the guide, accepted trip details and timeline. | “The operator update appears on the traveler’s Passport. The booking keeps the terms accepted at checkout even if the catalog changes later.” |

Use the displayed date and price when speaking; catalog values can change. If time is tight, choose just one non-success payment outcome and avoid typing long explanations. Keep the script to one traveler question and one booking.

## Useful follow-up, outside the 2–3 minutes

- **Find my trip** applies explicit dates, party size, per-traveler budget, starting city, interests and difficulty to listed departures. An impossible budget yields a clear no-match state; there is no live AI.
- **Operator workspace → Journeys** can create a complete synthetic tour, edit its Truth Card content and price, change capacity on an existing departure and add a new future departure. Existing departure dates remain fixed and a saved booking retains its accepted snapshot.
- At checkout, navigation or reload restores the browser-tab draft's selection, name and email. Changing the selected departure, party, displayed price or tour version requires the traveler to review and accept the current terms again.
- **Photo credits** links to the source and license for four genuine destination photographs. The site uses no photo effects; DM Serif Display, Manrope and Caveat fonts are served locally with their Open Font Licenses.

This remains a localhost prototype with a shared demo operator code, simulated payments, rule-based matching and synthetic content. It has no production authentication, live payment integration, live AI or public deployment. The existing report is an earlier verified working draft; this run sheet describes the current local app and does not revise the report or financial files.
