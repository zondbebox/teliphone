"""Generate the report source, editable DOCX and PDF from canonical model outputs.

Run with the bundled Python runtime. No network, service credentials or real data.
Re-run after changes to finance/summary.json or genuine screenshots.
"""
from pathlib import Path
import csv
import json
import html
import math
import hashlib
from zipfile import ZipFile
from PIL import Image as PILImage, ImageDraw, ImageFont
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'deliverables'
OUT.mkdir(exist_ok=True)
ASSETS = ROOT / 'assets'
ASSETS.mkdir(exist_ok=True)
S = json.loads((ROOT / 'finance/summary.json').read_text(encoding='utf-8-sig'))
I = json.loads((ROOT / 'finance/inputs.json').read_text(encoding='utf-8-sig'))
B = S['scenarios']['base']
D = S['scenarios']['downside']
sources = list(csv.DictReader((ROOT / 'research/sources.csv').open(encoding='utf-8-sig')))
fmt = lambda n: f'{n:,.0f}'
pct = lambda n: f'{100*n:.2f}%'
million = lambda n: f'{n/1_000_000:.3f}'
pages = []

def page(title):
    blocks = [('h1', title)]
    pages.append(blocks)
    return blocks

def p(b, text): b.append(('p', text))
def h(b, text): b.append(('h2', text))
def table(b, headers, rows, widths=None): b.append(('table', headers, rows, widths))
def img(b, path, caption, height_mm): b.append(('image', path, caption, height_mm))

# Render the actual proposed flow as an image rather than leaving diagram source.
flow = PILImage.new('RGB', (1600, 680), '#FDFBF7')
draw = ImageDraw.Draw(flow)
font_path = Path('C:/Windows/Fonts/arial.ttf')
bold_path = Path('C:/Windows/Fonts/arialbd.ttf')
font = ImageFont.truetype(str(font_path), 29)
bold = ImageFont.truetype(str(bold_path), 31)
small = ImageFont.truetype(str(font_path), 24)
labels = [('Discover', 'English destination page'), ('Match', 'Known catalog constraints'), ('Trip Truth Card', 'Included / excluded / total'), ('Booking review', 'Departure and terms'), ('Payment simulation', 'No card details collected'), ('Trip Passport', 'Confirmed demo reference')]
for index, (title, sub) in enumerate(labels):
    col, row = index % 3, index // 3
    x, y = 35 + col * 525, 40 + row * 260
    draw.rounded_rectangle((x, y, x+480, y+170), radius=15, fill='#F2EDE4', outline='#304D43', width=3)
    draw.text((x+22, y+28), title, fill='#1C1F22', font=bold)
    draw.text((x+22, y+87), sub, fill='#304D43', font=small)
    if col < 2:
        draw.line((x+482,y+85,x+516,y+85),fill='#A7583B',width=5)
        draw.polygon([(x+516,y+85),(x+505,y+77),(x+505,y+93)],fill='#A7583B')
draw.line([(1530,210),(1530,252),(15,252),(15,385),(35,385)],fill='#A7583B',width=4)
draw.polygon([(35,385),(24,377),(24,393)],fill='#A7583B')
draw.text((40, 572), 'Pending / declined / cancelled remain separate from confirmed.', fill='#1C1F22', font=font)
draw.text((40, 622), 'Operator workspace authors trips, answers private questions and assigns guides.', fill='#1C1F22', font=font)
flow.save(ASSETS / 'flow.png')

b = page('Problem and Market')
b.insert(0, ('title', 'Samal Journeys'))
b.insert(1, ('subtitle', 'Technology Product Proposal for Saryarqa Routes'))
b.insert(2, ('meta', 'ZERTTEX Hackathon 2026  |  TeamName placeholder  |  23 October 2026'))
p(b, 'AI-assisted working draft for substantive team review. Samal Journeys is a proposed browser application for Saryarqa Routes that connects tour matching, transparent trip information, booking and operator follow-up. The recommended pilot is a narrow India-resident segment; commercial demand, user benefit and production readiness remain unproven.')
h(b, 'Company and problem')
p(b, 'The fictional Saryarqa Routes was founded in Astana in 2020 and has 9 full-time employees and about 25 freelance guides. It sells guided trips of 2-7 days to Charyn Canyon, Kolsai Lakes, Turkestan and Burabay. In 2025 it served 3,400 travelers, earned 150,000,000 KZT and stated an average price of 44,000 KZT; about 96% of travelers came from Kazakhstan. Sales use Instagram messages, WhatsApp and calls; payment is by Kaspi transfer or cash. Its website is one page in Russian. The goal is 30% foreign travelers within 24 months; the first-year development and launch budget is up to 20,000,000 KZT. [C, pp.1-2]')
p(b, 'Foreign guests in the case report unclear booking, uncertain trust, foreign-card failure and unclear inclusions. These are supplied case complaints, not interviews conducted for this project. Multiplying the supplied traveler count by the average gives 149,600,000 KZT, 400,000 below reported revenue; both case values are preserved. [C]')
h(b, 'One proposed segment and alternatives')
table(b, ['Country', 'Accommodation guests', 'Pilot judgment'], [
    ['China', '127,059', 'Largest flow here; language and channel fit require separate research.'],
    ['India', '91,148', 'Proposed pilot; official access evidence supports a focused test.'],
    ['Germany', '24,672', 'Credible alternative; smaller flow, customer value unmeasured.']
], [0.15,0.22,0.63])
p(b, 'Counts cover January-September 2024 guests in Kazakhstan hotels and other accommodation, from a government summary citing BNS. They are not leisure-only demand, unique customers or an addressable sales market; nationality/residence and repeat-stay detail are incomplete. [S01]')
p(b, 'The proposed segment is India-resident adults comfortable booking in English, traveling as couples or small friend groups and considering a 2-3 day nature trip from Almaty. This preference is a hypothesis. The Embassy notice describes up to 14 visa-free days for Indian citizens, subject to the stated 42-day/180-day limit. Air India documents Delhi/Mumbai-Almaty services; its 2025 codeshare announcement was subject to approvals. Recheck actual entry rules and schedules. Operator delivery from Almaty also needs confirmation. [S02-S03]')
p(b, 'For this proposed English-booking segment, the Russian-only page and message-based sales may obstruct discovery and self-service; the strength of that barrier needs interviews. Test operator-approved English destination pages and a capped search campaign aimed at people already considering Kazakhstan. Measure qualified visits through completed trips, not clicks alone. Clear meeting details, exclusions and cancellation terms address the case complaints; transparent payment recovery addresses uncertainty after a decline.')

b = page('Existing Solutions and Product')
p(b, 'Samal Journeys should be assessed against configuring existing tools. The following vendor evidence identifies useful capabilities and unresolved fit, not proven competitor weaknesses. [S04-S05]')
table(b, ['Dimension', 'Viator marketplace', 'Bokun operator software'], [
    ['Discovery and journey', 'Marketplace distribution; customer booking and payment.', 'Direct booking widgets plus OTA and marketplace channels.'],
    ['Transparency and control', 'Operator controls listing content, retail price and availability; submission review.', 'Operator manages product content, availability, resources and payment links.'],
    ['Payment and operations', 'Vendor handles payments/refunds; pays after experience. Kazakhstan payout eligibility unverified.', 'Booking and channel management; Kazakhstan gateway suitability and Halyk connection unverified.'],
    ['Cost and effort', 'USD29 per submitted product plus completed-booking commission; exact rate needs contract. Listings need preparation.', 'START USD49/month plus 1.5% applicable-booking fee, up to five users; setup and payment fees may be additional.']
], [0.20,0.40,0.40])
p(b, 'No USD-to-KZT conversion is assumed. During weeks 1-2, test whether a configured tool can meet the operator workflow and local payment needs at lower total cost. If it can, prefer configuration. Custom development creates maintenance and security obligations; it is justified only if the shared-content journey adds demonstrated value.')
h(b, 'One mechanism across five capabilities')
p(b, 'The Trip Truth Card is one structured, operator-controlled record of itinerary, departure/meeting details, price, inclusions, exclusions, physical demands, cancellation terms and content status. Matching, checkout and the Trip Passport reuse it. The proposed benefit is fewer contradictory promises; no conversion increase or unprecedented invention is claimed.')
img(b, 'assets/screenshots/samal/desktop-truth-card.png', 'Figure 1. Samal Journeys Trip Truth Card in the running local application. Price, dates and policies are demonstration data. Genuine browser capture, 23 October 2026.', 105)

b = page('Journey and Technical Scope')
img(b, 'assets/flow.png', 'Figure 2. Proposed integrated user flow. The payment step is a local simulation.', 61)
p(b, 'The five capabilities are catalog matching, Trip Truth Card, guided booking, Trip Passport and operator workspace. Matching uses dates, party size, budget, city, interests and difficulty to return compatible departures. Checkout preserves traveler drafts when navigating or reloading, and requests fresh consent when accepted terms change. Only simulated success confirms a Passport; pending, declined and cancelled remain distinct. Operators can author tours, edit content and future capacity, assign guides and answer private traveler questions. The Passport preserves accepted price and policy snapshots after catalog edits. Answers come from the operator; the product does not invent itinerary details or credentials.')
h(b, 'Demonstration and production boundary')
p(b, 'The local prototype uses Node 24.16, HTML/CSS/JavaScript and persistent JSON, with no npm dependencies or API key. It has no live AI, real payments or service worker. Its dedicated presentation mode seeds future dates and can reset its own backed-up store. The warm editorial interface uses local fonts, licensed destination photographs without effects and responsive navigation. Tour prices, policies, capacity and traveler records are synthetic; guide assignment records a state, not a verified credential. Demo operator access is unsuitable for public exposure.')
p(b, 'The planned production system retains one application and catalog/booking model, with transactional storage, durable reservation holds, authenticated operator roles, audit events, backups and a hosted checkout. Personal data should be minimized; no card number or passport is needed in this demonstration. Production retention, consent and customer terms require operator and legal review. No compliance certification is claimed.')
h(b, 'Payment evidence and conditions')
p(b, 'Halyk ePay is a candidate. Official information describes account/application/terminal onboarding and an other-bank-card tariff of 3%. Hosted-page examples support KZT requests and English; full/partial refund and test/status endpoints are documented. These facts do not prove India-issued-card acceptance or contractual settlement currency/timing. Obtain written merchant approval, issuer support, fee/refund terms and test results before launch. The demo is not a Halyk sandbox. [S06-S10]')
p(b, 'For production, keep merchant secrets server-side, check invoice/amount/currency/terminal, validate notifications and query authenticated provider status. Confirm only a verified final charge; a browser return or successful status request alone is insufficient. Unique payment/event keys and atomic inventory updates must prevent duplicate confirmation. [S08-S10]')

b = page('MVP and Implementation')
p(b, f"The proposed pilot takes approximately 12 weeks after operator and team agreement. The model allocates {fmt(S['shared']['initial_work_hours'])} paid hours: product/research 180, application/payment engineering 540, QA 120, and content/training 120. Engineering averages 45 hours/week, shared by an engineering lead and integration support. A product/UX lead, QA/security support and operator content/launch owner cover the other roles. These rates and capacity are planning assumptions, not supplier quotes.")
table(b, ['Weeks', 'Deliverables and owner', 'Dependency and acceptance gate'], [
    ['1-2', 'Product/UX + operator: verify segment, audit catalog, compare build versus configure; start payment onboarding.', 'Team-owned strategy; approved sample Truth Card; merchant requirements received.'],
    ['3-4', 'Designer + engineer: matching, tour page, responsive layout, schema and inventory model.', 'Catalog content ready; no-match and price consistency pass; early comprehension tests.'],
    ['5-6', 'Engineer: booking, atomic holds, hosted checkout adapter, passport and operator controls.', 'Approved provider test access; duplicate/failed/pending events cannot overbook or falsely confirm.'],
    ['7-8', 'QA/security + operator: refund/reconciliation tests, role access, privacy controls and content audit.', 'Merchant terms agreed; no unresolved critical security/payment defect; guides/transport verified.'],
    ['9-10', 'UX + operator: recruit ten target adults, run consented tasks, train staff and revise.', 'Consent and synthetic test data; actual observations recorded, failures prioritized.'],
    ['11-12', 'Engineer + operator: retest fixes, rehearse operations, approve capped live pilot.', 'Critical gates passed, support/refund owner ready, approved capacity and rollback plan.']
], [0.10,0.46,0.44])
h(b, 'Real-user testing is planned')
p(b, 'No interviews or surveys have been conducted. Recruit ten India-resident adults comfortable booking in English who are considering Kazakhstan, with varied travel experience and devices. Explain voluntary participation, no purchase and separate recording consent. Use anonymous codes and synthetic traveler details; collect no payment-card or passport data. Follow the full protocol in docs/validation_protocol.md.')
p(b, 'Ask participants to find a suitable departure, state two exclusions and the full KZT party charge, explain cancellation, complete a demo booking, recover from a decline and distinguish pending from confirmed. Proposed thresholds: at least 8/10 unassisted core completions, 9/10 correct price/exclusions, and 10/10 correct safety-critical payment-state interpretation. These are decision gates, not results. Report true numerators and denominators; a small formative sample cannot establish conversion uplift.')
p(b, 'Agent-driven Chrome checks exercised 1440, 768 and 360px layouts, mood filters, new-tour authoring/matching, private question and answer persistence, guide assignment and booking recovery. A three-person Charyn booking retained its accepted 174,000 KZT total after the catalog price and cancellation policy changed. Checkout drafts survived navigation/reload and required renewed consent. Declined, pending and confirmed states were visibly distinct. Keyboard focus was visible and the final warning/error log was empty. All 42 automated tests passed. Review and regression checks fixed stale checkout responses, multiline input, departure limits and the live party total on the Truth Card. These are software checks, not user research; see docs/full-demo-verification.md and docs/samal-verification.md.')

b = page('Costs and Payback')
p(b, 'All financial figures below come from finance/summary.json and its reproducible model, in KZT. The illustrative forecast begins January 2027; development occupies months 1-3 and the pilot begins month 4. Costs, traffic, conversion, margins and seasonality are unvalidated assumptions. The case average of 44,000 KZT drives the model; synthetic prototype tour prices do not. No legacy revenue, online migration, internal commission or staff-time saving is counted as new income.')
cost_rows = [[x['item'], str(x['hours']), fmt(x['rate']), fmt(x['hours']*x['rate'])] for x in I['initial_work']]
cost_rows.append(['Initial work total', fmt(S['shared']['initial_work_hours']), '', fmt(S['shared']['initial_work'])])
table(b, ['Initial work', 'Hours', 'KZT/hour', 'KZT'], cost_rows, [0.48,0.12,0.18,0.22])
running_breakdown = '; '.join(f"{x['item']} {fmt(x['units']*x['rate'])}" for x in I['monthly_running'])
p(b, f"Running cost is {fmt(S['shared']['monthly_running'])}/active month: {running_breakdown}. Marketing is one separate {fmt(S['shared']['monthly_marketing'])}/active-month line. Year-one running and marketing are {fmt(B['year1']['operating'])} and {fmt(B['year1']['marketing'])}. Contingency is {fmt(S['shared']['contingency'])}: 15% of the sum of initial work and year-one running, conservatively treated as cash spent in month 3. No student or AI labor is assumed free.")
table(b, ['24 month model metric', 'Base', '30% fewer travelers'], [
    ['Incremental completed travelers', fmt(B['total24']['completed']), fmt(D['total24']['completed'])],
    ['Incremental tour revenue', fmt(B['total24']['revenue']), fmt(D['total24']['revenue'])],
    ['Incremental contribution', fmt(B['total24']['contribution']), fmt(D['total24']['contribution'])],
    ['Cumulative project cash flow', fmt(B['ending_cash_flow']), fmt(D['ending_cash_flow'])],
    ['Peak funding required', fmt(B['peak_funding_required']), fmt(D['peak_funding_required'])],
    ['First nonnegative cumulative month', B['payback_label'], 'Not reached in 24 months'],
    ['Year 1 gross cash uses', fmt(B['year1']['gross_cash_uses']), fmt(D['year1']['gross_cash_uses'])]
], [0.49,0.25,0.26])
p(b, f"At {fmt(I['drivers']['realized_price'])} realized revenue per traveler, assumed delivery cost is {I['drivers']['tour_delivery_share']:.0%}, payment cost {I['drivers']['payment_fee_share']:.0%} and other variable service {fmt(I['drivers']['variable_service_per_traveler'])}. Contribution is therefore {fmt(S['shared']['contribution_per_traveler'])} ({100*S['shared']['contribution_margin']:.0f}%) per completed traveler. The payment rate is informed by the published other-bank tariff but remains subject to merchant terms. [S06-S07] Cash flow subtracts fixed running, marketing, development and contingency from contribution; there are no evidenced cash savings.")
p(b, f"The first-year fixed project envelope is {fmt(B['year1']['project_fixed_envelope'])}; gross uses including incremental tour delivery and variable fees are {fmt(B['year1']['gross_cash_uses'])}, below the case's {fmt(S['shared']['budget'])} ceiling under a deliberately stricter planning rule. Downside keeps fixed costs unchanged and reduces only completed travelers and genuinely variable costs by 30%. Revenue is not profit; tax, settlement timing and supplier terms require validation.")

b = page('Impact Risks and Conclusion')
h(b, 'Acquisition and capacity determine the result')
p(b, f"The proposed funnel is qualified visit -> inquiry ({I['drivers']['qualified_session_to_inquiry']:.0%}) -> paid party ({I['drivers']['inquiry_to_paid_party']:.0%}) -> {I['drivers']['travelers_per_party']} travelers -> completed trip ({I['drivers']['paid_to_completed']:.0%}). It produces {fmt(B['year1']['completed'])} new travelers in year 1 and {fmt(B['year2']['completed'])} in year 2. Qualified sessions rise from {fmt(B['year1']['qualified_sessions'])} to {fmt(B['year2']['qualified_sessions'])}, or {S['shared']['year2_session_growth_multiple']:.2f} times. The assumed {1-I['drivers']['paid_share_of_sessions']:.0%} earned/direct/referral/partner traffic is not secured. Marketing cost per incremental completed traveler drops from {fmt(B['year1']['marketing_cost_per_incremental_completed'])} to {fmt(B['year2']['marketing_cost_per_incremental_completed'])}; this ambitious improvement is the principal commercial risk.")
p(b, f"Year-two foreign share uses the annual months 13-24 denominator: {fmt(B['year2']['foreign_total'])} foreign / ({fmt(B['year2']['foreign_total'])} foreign + {fmt(B['year2']['domestic_total'])} domestic) = {pct(B['year2']['foreign_share'])}. Downside is {pct(D['year2']['foreign_share'])}, missing the goal. Approximate baselines are {fmt(S['shared']['baseline_foreign_approximate'])} foreign and {fmt(S['shared']['baseline_domestic_approximate'])} domestic; incremental mix is assumed {I['drivers']['incremental_foreign_share']:.0%} foreign. Capacity assumes groups of {I['drivers']['seats_per_incremental_departure']}, {I['drivers']['guide_days_per_departure_including_buffer']} guide-days including buffer and about {I['case']['freelance_guides_approximate']} freelancers available {I['drivers']['available_days_per_guide_per_month']} days/month. Peak base utilization is {100*B['total24']['peak_guide_utilization']:.0f}%; language, location, vehicles and guide availability are unverified.")
table(b, ['Risk and owner', 'Mitigation', 'Warning or stop trigger'], [
    ['Misinformation / product owner', 'Approved card data; deterministic dates, price and seats; human follow-up.', 'Any unsupported promise or price contradiction.'],
    ['Payments / finance + engineer', 'Merchant approval; issuer tests; verified events, refunds and reconciliation.', 'Unknown settlement terms, false confirmation or duplicate charge.'],
    ['Privacy and security / engineer', 'Minimize data; secure roles, logs and retention; external review.', 'Sensitive data leak or unresolved critical access flaw.'],
    ['Acquisition / growth owner', 'Capped cohorts; measure incremental completion and contribution.', 'Acquisition cost exceeds contribution for two cohorts.'],
    ['Delivery and capacity / operator', 'Reserve guides, transport and suppliers; cap departures.', 'Unstaffed departure or planned guide load above 85%.']
], [0.26,0.43,0.31])
p(b, 'Measure company impact through completed foreign bookings, contribution and support time; traveler impact through correct comprehension and booking completion. Better information may improve these customers\' experience of booking Kazakhstan travel. A single operator product cannot be claimed to transform the national tourism image. All these outcomes are planned until measured.')
h(b, 'Recommendation and next decisions')
p(b, f"Proceed only as a small, measured pilot after substantive team and operator review. The base model reaches first payback in month {B['payback_month']} and ends at only {fmt(B['ending_cash_flow'])} cumulative cash; the downside ends at {fmt(D['ending_cash_flow'])} and does not pay back within 24 months. Recheck any later seasonal reversal and require adequate working capital. Do not scale on optimistic traffic assumptions alone.")
p(b, 'Before submission, the team must verify sources itself, own and revise the strategy, confirm eligibility and team details, obtain the missing Stage 1 Rules and AI-use framework, and complete the declaration. TeamName remains a placeholder. This package is not automatically submitted or publicly deployed. The deadline in the case is 25 October 2026 at 23:59 Astana time. [C]')

b = page('References')
p(b, 'All external pages below were opened on 23 October 2026, before the case deadline. No later publication is used as historical evidence. Undated live documentation is identified as such; the team must re-open and verify it before submission. English translations of source titles are marked in the source register.')
p(b, '[C] ZERTTEX Hackathon 2026. Stage 1 Case 1 Technology Product. Case release 23 October 2026, 10:00 Astana time. Three-page supplied PDF: company facts pp.1-2; tasks and optional enhancements p.2; scoring and submission checklist p.3. The source file is not republished in the repository.')
for s in sources:
    b.append(('ref', f"[{s['source_id']}] {s['publisher']}. {s['title']}. Publication: {s['publication_date']}. Data: {s['data_period']}. {s['URL']}"))
p(b, 'Figure 1 is a genuine Samal Journeys local application capture. The prototype\'s Charyn Canyon photograph is by Bgag, photographed 22 September 2023, Wikimedia Commons, CC0 1.0. Attribution and destination check: assets/attribution.md. Figure 2 is an AI-assisted project flow diagram, not external evidence.')
b.append(('ref','Image source: https://commons.wikimedia.org/wiki/File:Charyn_Canyon,_Kazakhstan_02.jpg | License: https://creativecommons.org/publicdomain/zero/1.0/deed.en | Opened 23 October 2026.'))

b = page('AI Declaration')
p(b, 'This is an AI-assisted working draft requiring substantive human authorship review. The supplied product concept and brief were developed with ChatGPT assistance. The user selected the Samal Journeys name; Codex applied the brand and refreshed the demo and supporting artifacts. Codex materially assisted the evidence search and interpretation, product and technical refinement, application code and tests, financial model, document writing, formatting and verification work. This assistance is substantially more than grammar correction.')
h(b, 'Actual assistance and its limits')
table(b, ['Capability', 'Contribution', 'Limit'], [
    ['Codex and Superpowers skills', 'Requirements, implementation planning, parallel AI review, debugging and verification.', 'Decisions remain proposals until team-owned analysis and revision.'],
    ['Web research tools', 'Opened government, airline, vendor and provider pages and recorded sources.', 'AI source checks do not replace the case requirement that the team verify sources itself.'],
    ['Local engineering and browser tools', 'Local demo, tour authoring, private questions, regression checks and genuine browser captures.', 'No production payment, live AI, real booking or real-user study.'],
    ['Spreadsheets capability', 'Editable workbook and reproducible 24-month base/downside calculations.', 'Inputs remain planning assumptions, not observed financial results.'],
    ['Documents and PDF skills', 'Updated English report, editable Word document and independently rendered PDF.', 'PDF pages visually inspected. DOCX pagination unverified: packaged renderer lacks LibreOffice.'],
    ['GitHub and authorized Git tools', 'Repository inspection and authorized delivery workflow, reported separately.', 'No deployment or competition submission is authorized by a repository push.']
], [0.25,0.39,0.36])
p(b, 'Product Design and Context7 integrations were not available in this session and are not claimed as used. No additional service was installed to replace them. The selected dependency-free Node implementation does not imply consultation of those unavailable tools. The final verification log is the record of commands and checks actually executed; no participant responses or team approvals have been invented.')
h(b, 'Official framework and team responsibility')
p(b, 'Official AI-use level: UNRESOLVED. The separate Levels of AI Use framework and Stage 1 Rules & Evaluation Criteria were not supplied/found among the identified case materials. The team must obtain them, determine the correct level and check whether the planned submission complies. No official permission or level is inferred.')
p(b, 'The case requires the main thinking, ideas and strategy to be the team\'s own. The team must make substantive choices and revisions and record its reasoning. Approving this draft alone does not establish compliance. Eligibility, school/grades, team name and names have not been verified. Relevant chat links: not supplied; the team must add genuine links if required and appropriate, without inventing them.')
p(b, 'Review and final approval: NOT COMPLETED. No competition upload has occurred. Before using this report, complete docs/team_review.md, replace filename placeholders, check all evidence and assumptions, and make the final submission decision yourselves.')

# Sources for each format are identical; generate markdown rather than maintain another prose copy.
md = []
for n, blocks in enumerate(pages, 1):
    md.append(f'<!-- Report page {n}; '+('main content' if n<=6 else 'separate section')+' -->')
    for block in blocks:
        kind = block[0]
        if kind in ('title','h1','h2'): md.append(('# ' if kind=='title' else '## ' if kind=='h1' else '### ')+block[1])
        elif kind in ('p','meta','ref','subtitle'): md.append(block[1])
        elif kind=='table':
            md.append('| '+' | '.join(block[1])+' |\n| '+' | '.join(['---']*len(block[1]))+' |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |' for row in block[2]))
        elif kind=='image': md.append(f'![{block[2]}](../{block[1]})')
    md.append('\n---\n')
(ROOT/'docs/report.md').write_text('\n\n'.join(md), encoding='utf-8')

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Mm(210), Mm(297)
sec.top_margin, sec.bottom_margin, sec.left_margin, sec.right_margin = Mm(17), Mm(17), Mm(18), Mm(18)
sec.footer_distance = Mm(8)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Caption']:
    st = doc.styles[name]
    st.font.name = 'Arial'
    st.font.color.rgb = RGBColor(0,0,0)
    st.paragraph_format.space_after = Pt(6)
doc.styles['Normal'].font.size = Pt(10)
doc.styles['Normal'].paragraph_format.line_spacing = 1.12
doc.styles['Title'].font.name = 'Georgia'
doc.styles['Title'].font.size = Pt(25)
doc.styles['Subtitle'].font.size = Pt(12)
doc.styles['Subtitle'].font.name = 'Arial'
doc.styles['Heading 1'].font.name = 'Georgia'
doc.styles['Heading 1'].font.size = Pt(17)
doc.styles['Heading 2'].font.size = Pt(11)
doc.styles['Caption'].font.size = Pt(8)
doc.styles['Heading 1'].paragraph_format.space_before = Pt(4)
doc.styles['Heading 2'].paragraph_format.space_before = Pt(7)
footer=sec.footer.paragraphs[0]
footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
run=footer.add_run('Saryarqa Routes | Samal Journeys | AI-assisted draft | ')
run.font.size=Pt(8)
field=OxmlElement('w:fldSimple'); field.set(qn('w:instr'),'PAGE'); footer._p.append(field)
doc.core_properties.title = 'Samal Journeys Technology Product Proposal'
doc.core_properties.author = 'AI assisted working draft for team review'
doc.core_properties.subject = 'A technology product for Saryarqa Routes | ZERTTEX Hackathon 2026 Stage 1 Case 1'
doc.core_properties.keywords = 'Samal Journeys, Saryarqa Routes, AI-assisted, team review pending'

def set_cell_shade(cell, fill):
    pr=cell._tc.get_or_add_tcPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:fill'),fill); pr.append(sh)

for pi, blocks in enumerate(pages):
    if pi: doc.add_page_break()
    for block in blocks:
        kind=block[0]
        if kind in ('title','h1','h2'):
            doc.add_paragraph(block[1], style={'title':'Title','h1':'Heading 1','h2':'Heading 2'}[kind])
        elif kind in ('p','meta','ref','subtitle'):
            para=doc.add_paragraph(block[1],style='Subtitle' if kind=='subtitle' else 'Normal'); para.paragraph_format.widow_control=True
            if kind=='meta':
                for run in para.runs: run.font.size=Pt(8)
            if kind=='ref':
                para.paragraph_format.space_after=Pt(5)
                for run in para.runs: run.font.size=Pt(8)
        elif kind=='table':
            _, headers, rows, widths=block
            widths=widths or [1/len(headers)]*len(headers)
            t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
            for col,w in zip(t.columns,widths): col.width=Mm(174*w)
            for i,head in enumerate(headers): t.rows[0].cells[i].text=head
            for row in rows:
                for cell,value in zip(t.add_row().cells,row): cell.text=str(value)
            pr=t._tbl.tblPr; borders=OxmlElement('w:tblBorders')
            for side in ['top','left','bottom','right','insideH','insideV']:
                x=OxmlElement('w:'+side); x.set(qn('w:val'),'single'); x.set(qn('w:sz'),'4'); x.set(qn('w:color'),'D9D9D9'); borders.append(x)
            pr.append(borders)
            for ri,row in enumerate(t.rows):
                trPr=row._tr.get_or_add_trPr(); cant=OxmlElement('w:cantSplit'); trPr.append(cant)
                if ri==0: trPr.append(OxmlElement('w:tblHeader'))
                for ci,cell in enumerate(row.cells):
                    cell.width=Mm(174*widths[ci]); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
                    set_cell_shade(cell, '304D43' if ri==0 else 'F5F1EA' if ri%2 else 'FDFBF7')
                    margins=OxmlElement('w:tcMar')
                    for side in ['top','left','bottom','right']:
                        e=OxmlElement('w:'+side); e.set(qn('w:w'),'75'); e.set(qn('w:type'),'dxa'); margins.append(e)
                    cell._tc.get_or_add_tcPr().append(margins)
                    for para in cell.paragraphs:
                        para.paragraph_format.space_after=Pt(1); para.paragraph_format.line_spacing=1.05
                        for run in para.runs:
                            run.font.size=Pt(8.5); run.bold=(ri==0)
                            run.font.color.rgb=RGBColor.from_string('FFFFFF' if ri==0 else '1C1F22')
            doc.add_paragraph().paragraph_format.space_after=Pt(1)
        elif kind=='image':
            file=ROOT/block[1]
            if not file.exists(): raise FileNotFoundError('Genuine figure required before export: '+str(file))
            with PILImage.open(file) as im: ratio=im.width/im.height
            height=min(block[3],174/ratio)
            picture=doc.add_picture(str(file),height=Mm(height),width=Mm(height*ratio))
            picture._inline.docPr.set('descr', block[2])
            doc.add_paragraph(block[2],style='Caption')
docx_path=OUT/'TeamName_TechnologyProduct.docx'
doc.save(docx_path)

# Produce a deterministic, visually verified PDF independently of Office availability.
pdfmetrics.registerFont(TTFont('DMSerif',str(ROOT/'public/fonts/DMSerifDisplay-Regular.ttf')))
pdfmetrics.registerFont(TTFont('Arial',str(font_path)))
pdfmetrics.registerFont(TTFont('ArialBold',str(bold_path)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='ArialBold',italic='Arial',boldItalic='ArialBold')
styles={
    'subtitle':ParagraphStyle('subtitle',fontName='Arial',fontSize=11,leading=13.5,spaceAfter=7,textColor=colors.black),
    'title':ParagraphStyle('title',fontName='DMSerif',fontSize=23,leading=26,spaceAfter=8,textColor=colors.black),
    'h1':ParagraphStyle('h1',fontName='DMSerif',fontSize=18,leading=21,spaceAfter=8,spaceBefore=3,textColor=colors.black),
    'h2':ParagraphStyle('h2',fontName='ArialBold',fontSize=10.5,leading=13,spaceBefore=8,spaceAfter=5,textColor=colors.black),
    'p':ParagraphStyle('p',fontName='Arial',fontSize=9.6,leading=13.2,spaceAfter=7,textColor=colors.HexColor('#1C1F22')),
    'meta':ParagraphStyle('meta',fontName='Arial',fontSize=8,leading=10,spaceAfter=9),
    'ref':ParagraphStyle('ref',fontName='Arial',fontSize=8.2,leading=10.6,spaceAfter=7,wordWrap='CJK'),
    'cell':ParagraphStyle('cell',fontName='Arial',fontSize=8.2,leading=10.7),
    'th':ParagraphStyle('th',fontName='ArialBold',fontSize=8.2,leading=10.7,textColor=colors.white),
    'cap':ParagraphStyle('cap',fontName='Arial',fontSize=7.8,leading=10,spaceAfter=7,textColor=colors.HexColor('#80533F'))
}
def para(text,style): return Paragraph(html.escape(str(text)),styles[style])
story=[]
width=A4[0]-36*72/25.4-12
for pi,blocks in enumerate(pages):
    if pi: story.append(PageBreak())
    for block in blocks:
        kind=block[0]
        if kind in ('title','subtitle','h1','h2','p','meta','ref'): story.append(para(block[1],kind))
        elif kind=='table':
            _,headers,rows,widths=block
            widths=widths or [1/len(headers)]*len(headers)
            cells=[[para(x,'th') for x in headers]]+[[para(x,'cell') for x in row] for row in rows]
            t=Table(cells,colWidths=[width*x for x in widths],repeatRows=1,hAlign='LEFT')
            commands=[('BACKGROUND',(0,0),(-1,0),colors.HexColor('#304D43')),('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#d9d9d9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]
            commands += [('BACKGROUND',(0,i),(-1,i),colors.HexColor('#F3EEE5')) for i in range(1,len(cells),2)]
            t.setStyle(TableStyle(commands)); story.extend([t,Spacer(1,8)])
        elif kind=='image':
            file=ROOT/block[1]
            with PILImage.open(file) as im: ratio=im.width/im.height
            high=min(block[3]*72/25.4,width/ratio)
            story.append(KeepTogether([Image(str(file),width=high*ratio,height=high,hAlign='LEFT'),Spacer(1,4),para(block[2],'cap')]))
def foot(canvas,doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#FDFBF7')); canvas.rect(0,0,A4[0],A4[1],stroke=0,fill=1)
    canvas.setFont('Arial',7.5); canvas.setFillColor(colors.HexColor('#5F685F'))
    suffix='Main report' if doc.page<=6 else 'References' if doc.page==7 else 'AI Declaration'
    canvas.drawString(18*72/25.4,10*72/25.4,'Saryarqa Routes | Samal Journeys | AI-assisted draft')
    canvas.drawRightString(A4[0]-18*72/25.4,10*72/25.4,f'{suffix} | {doc.page}')
    canvas.restoreState()
pdf_path=OUT/'TeamName_TechnologyProduct.pdf'
SimpleDocTemplate(str(pdf_path),pagesize=A4,leftMargin=18*72/25.4,rightMargin=18*72/25.4,topMargin=16*72/25.4,bottomMargin=17*72/25.4,title='Samal Journeys Technology Product Proposal',subject='A technology product for Saryarqa Routes',author='AI assisted working draft for team review').build(story,onFirstPage=foot,onLaterPages=foot)
reader=PdfReader(pdf_path)
exported_text='\n'.join(item.extract_text() for item in reader.pages)
financial_values=[S['scenarios'][scenario][period][field] for scenario in ['base','downside'] for period,field in [('total24','revenue'),('total24','contribution'),('year1','gross_cash_uses')]]+[S['scenarios'][scenario][field] for scenario in ['base','downside'] for field in ['ending_cash_flow','peak_funding_required']]
reopened_doc=Document(docx_path)
with ZipFile(docx_path) as z: valid_docx=z.testzip() is None
docx_text='\n'.join(para.text for para in reopened_doc.paragraphs)+'\n'+'\n'.join(cell.text for table in reopened_doc.tables for row in table.rows for cell in row.cells)
check={'pages':len(reader.pages),'expected_pages':8,'expected_main_pages':6,'references_expected_page':7,'ai_declaration_expected_page':8,'a4':all(abs(float(p.mediabox.width)-A4[0])<1 and abs(float(p.mediabox.height)-A4[1])<1 for p in reader.pages),'markdown_generated_from_same_content':True,'financial_source':'finance/summary.json','canonical_financial_values_found':all(fmt(value) in exported_text for value in financial_values),'canonical_financial_values_in_docx':all(fmt(value) in docx_text for value in financial_values),'no_legacy_brand_in_final_text':'QazaqPass' not in exported_text and 'QazaqPass' not in docx_text,'company':'Saryarqa Routes','company_on_first_page':'Saryarqa Routes' in reader.pages[0].extract_text(),'docx_zip_valid':valid_docx,'docx_reopens':True,'docx_embedded_images':len(reopened_doc.inline_shapes),'docx_tables':len(reopened_doc.tables),'pdf_sha256':hashlib.sha256(pdf_path.read_bytes()).hexdigest(),'docx_sha256':hashlib.sha256(docx_path.read_bytes()).hexdigest(),'financial_source_sha256':hashlib.sha256((ROOT/'finance/summary.json').read_bytes()).hexdigest(),'brand':'Samal Journeys','current_automated_tests':42,'latest_screenshot':'assets/screenshots/samal/desktop-truth-card.png','screenshot_sha256':hashlib.sha256((ROOT/'assets/screenshots/samal/desktop-truth-card.png').read_bytes()).hexdigest(),'docx_visual_status':'Pending fresh packaged renderer attempt','pdf_visual_status':'Pending latest page image review'}
(OUT/'report_verification.json').write_text(json.dumps(check,indent=2),encoding='utf-8')
print(json.dumps(check,indent=2))
if len(reader.pages)!=8: raise RuntimeError('Report overflow: expected 8 total pages; inspect and repair layout')
assert check['canonical_financial_values_found'] and check['canonical_financial_values_in_docx'] and check['docx_zip_valid'] and check['a4']
assert check['no_legacy_brand_in_final_text'] and check['company_on_first_page']
assert check['docx_embedded_images']==2
assert 'References' in reader.pages[6].extract_text()
assert 'AI Declaration' in reader.pages[7].extract_text()
print('Created report.md, flow.png, DOCX and PDF. Render and visually inspect before claiming completion.')
