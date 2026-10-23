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

ROOT = Path(__file__).resolve().parents[3]
REVISION = ROOT/'revisions/2026-10-23'
OUT = REVISION/'report'
OUT.mkdir(exist_ok=True)
ASSETS = OUT
ASSETS.mkdir(exist_ok=True)
S = json.loads((ROOT / 'finance/summary.json').read_text(encoding='utf-8-sig'))
I = json.loads((ROOT / 'finance/inputs.json').read_text(encoding='utf-8-sig'))
B = S['scenarios']['base']
D = S['scenarios']['downside']
verified_sources=list(csv.DictReader((REVISION/'source-verification.csv').open(encoding='utf-8-sig')))
sources=[{'source_id':row['source_id'],'publisher':row['publisher_or_author'],'title':row['exact_title'],'URL':row['url'],'publication_date':row['publication_or_update'],'data_period':row['data_period']} for row in verified_sources if row['source_id'] not in ['S02a','PHOTO']]
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
labels = [('Discover', 'English destination page'), ('Match', 'Known catalog constraints'), ('Trip Truth Card', 'Included / excluded / total'), ('Booking review', 'Departure and terms'), ('Payment simulation', 'No card details collected'), ('Trip Passport', 'Saved details and status')]
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

b = page('Problem and market')
b.insert(0, ('title', 'Samal Journey'))
b.insert(1, ('subtitle', 'Technology product proposal for Saryarqa Routes'))
b.insert(2, ('meta', 'REVIEW DRAFT  |  Team name pending  |  ZERTTEX Hackathon 2026  |  23 October 2026'))
p(b, 'Samal Journey is a proposed booking product for Saryarqa Routes. It gives travelers one consistent record of what a trip includes, what it costs and what happens after booking. The proposed first market is a small segment of travelers from India. A limited pilot is worth testing, but demand and operating arrangements remain unconfirmed. The financial forecast reaches payback in month 23 under the base assumptions; 30% fewer new travelers would leave the project below payback after 24 months.')
h(b, 'The company and the booking problem')
p(b, 'Saryarqa Routes is the fictional company in the case. Founded in Astana in 2020, it has 9 full-time employees and about 25 freelance guides. It sells guided trips lasting 2-7 days to Charyn Canyon, Kolsai Lakes, Turkestan and Burabay. In 2025, it served 3,400 travelers and earned 150,000,000 KZT, with a stated average price of 44,000 KZT. About 96% of travelers came from Kazakhstan. Sales take place through Instagram messages, WhatsApp and calls; customers pay by Kaspi transfer or cash. Its website is one Russian-language page. The target is a 30% foreign-traveler share within 24 months, with up to 20,000,000 KZT for development and launch in the first year. [C, pp.1-2]')
p(b, 'The case describes foreign guests who cannot understand how to book, judge whether the company is trustworthy, pay with a foreign card or identify what is included. These are case statements; this project has not interviewed guests. There is also a small inconsistency in the supplied figures: 3,400 multiplied by 44,000 is 149,600,000 KZT, or 400,000 below the reported revenue. Both original values are retained. [C]')
h(b, 'A proposed market to test')
table(b, ['Country', 'Accommodation guests', 'Implication for this proposal'], [
    ['China', '127,059', 'Largest of these three flows; language and sales channels need separate research.'],
    ['India', '91,148', 'Proposed first market, with documented visa-free access and air routes.'],
    ['Germany', '24,672', 'An alternative with a smaller recorded flow; customer value is unmeasured.']
], [0.15,0.22,0.63])
p(b, 'These are guests from the named countries in Kazakhstan hotels and other accommodation during January-September 2024. The government summary cites the Bureau of National Statistics. It does not establish leisure demand, unique people or customers available to this company; the country definition and repeat-stay treatment are not fully explained. [S01]')
p(b, 'The proposed segment is India-resident adults comfortable booking in English, traveling as couples or small friend groups and considering a 2-3 day nature trip from Almaty. This preference still needs research. The Indian Embassy describes visa-free stays for Indian citizens of up to 14 days, within a 42-day limit per 180 days. Air India documents Air Astana flights between Almaty and Delhi/Mumbai; its September 2025 codeshare announcement required regulatory approval. Citizenship, current entry rules, flight schedules and the operator\'s ability to run Almaty departures must be checked for a pilot. [S02, S03]')
p(b, 'For this segment, the Russian-only page may hinder discovery and independent booking. Test English destination pages and a capped search campaign aimed at people already considering Kazakhstan. Measure completed trips and their contribution, alongside visits and inquiries. Clear exclusions, meeting details and cancellation terms address the case complaints; payment recovery should explain whether a booking is pending, declined or confirmed.')

b = page('Existing solutions and proposed value')
p(b, 'Saryarqa Routes could configure an existing booking service instead of building Samal Journey. Viator and Bókun cover much of the required journey. Their published features are useful comparison points, but local payment compatibility and total cost still need checking. [S04, S04a, S05]')
table(b, ['Dimension', 'Viator marketplace', 'Bókun operator software'], [
    ['Discovery and booking', 'Marketplace distribution with customer booking and payment.', 'Direct-booking widgets and connections to online travel agencies and marketplaces.'],
    ['Content and availability', 'Operators set listing content, retail price and availability; listings undergo review.', 'Operators manage product content, availability, resources and payment links.'],
    ['Payments and operations', 'Handles payment/refunds and pays after the experience. Kazakhstan payout eligibility remains unverified.', 'Manages bookings and distribution channels. Kazakhstan gateway support and a Halyk connection remain unverified.'],
    ['Published cost', 'USD29 per submitted product plus commission on completed bookings. The exact commission needs a contract.', 'START: $49/month as displayed, plus 1.5% on applicable bookings and up to five users. Billing currency, setup and payment terms need confirmation.']
], [0.20,0.40,0.40])
p(b, 'Viator specifies USD; the opened Bókun page displays a dollar sign without an explicit billing currency. No currency conversion is assumed. During weeks 1-2, test whether either service meets the operator\'s workflow and payment requirements at a lower total cost. If it does, configuration is preferable. Custom software adds maintenance and security work, so its benefit must be demonstrated.')
h(b, 'One trip record throughout the booking')
p(b, 'The Trip Truth Card stores the itinerary, departure and meeting details, price, inclusions, exclusions, physical demands, cancellation policy and content status. Matching, checkout and the Trip Passport reuse that record. For Saryarqa Routes, the proposed value is fewer conflicting promises across sales and follow-up. This is a practical design choice whose effect needs testing; the report does not claim that structured trip information is a new invention.')
img(b, 'revisions/2026-10-23/screenshots/after-desktop-truth.png', 'Figure 1. The Trip Truth Card in the local Samal Journey demo. Tour prices, dates and policies are synthetic. Captured from the running application on 23 October 2026.', 105)

b = page('Product journey and technical scope')
img(b, 'revisions/2026-10-23/report/flow.png', 'Figure 2. Booking flow for the proposed product. The current demo simulates payment and does not charge a customer.', 61)
p(b, 'The product has five parts: catalog matching, the Trip Truth Card, guided booking, the Trip Passport and an operator workspace. Matching checks dates, party size, budget, starting city, interests and difficulty against available departures. Checkout preserves a traveler\'s draft during navigation or reload and asks for consent again when terms change. The Trip Passport shows the current booking status; only simulated success marks it confirmed. It keeps the accepted price and policy even if the catalog is edited later.')
p(b, 'Operators can create tours, revise content and future capacity, assign guides and answer private questions. Travelers see the saved answer in their booking record. The software uses the catalog for prices and availability; an operator must answer questions that the catalog cannot resolve.')
h(b, 'What the demonstration proves')
p(b, 'The local application runs on Node 24.16 with HTML, CSS, JavaScript and a JSON data file. It needs no npm dependencies or paid API. It includes no live AI, real payment integration or service worker. Its presentation mode creates future sample dates and backs up its own data before a reset. Responsive pages use local fonts and licensed destination photographs without photo effects. Tour policies, capacity and traveler records are demonstration data, and an entered guide name is not a verified qualification.')
p(b, 'Public use would require authenticated operator roles, transactional storage, temporary seat reservations with expiry, an audit trail, backups and a hosted payment page. Demo access and local JSON storage are insufficient for production. The operator must approve privacy terms, retention periods and customer conditions. The demonstration collects neither card numbers nor passport details; no compliance certification is claimed.')
h(b, 'Payment provider requirements')
p(b, 'Halyk ePay is a candidate for the pilot. Its documentation describes merchant account/application/terminal onboarding, a published 3% tariff for other-bank cards, English payment pages and KZT request examples. Full and partial refund operations and test/status endpoints are documented. These details do not establish India-issued-card acceptance or settlement currency and timing. Written merchant approval, issuer support, fee/refund terms and end-to-end tests are still needed. The local demo is not a Halyk sandbox. [S06-S10]')
p(b, 'Production confirmation must come from a verified final charge. The server should validate the invoice, amount, currency and terminal, check provider notifications and query authenticated payment status. A browser return or successful status query alone does not prove payment. Unique event identifiers and atomic inventory updates must prevent duplicate confirmation or overbooking. [S08-S10]')

b = page('MVP plan and validation')
p(b, f"The proposed pilot takes about 12 weeks after agreement with the operator. The budget allows {fmt(S['shared']['initial_work_hours'])} paid hours: 180 for product/research, 540 for application/payment engineering, 120 for QA and 120 for content/training. Engineering averages 45 hours per week, shared by a lead and integration support. A product/UX lead, QA/security support and an operator content/launch owner cover the other work. These are planning estimates, not confirmed supplier quotes.")
table(b, ['Weeks', 'Work and responsibility', 'Conditions for proceeding'], [
    ['1-2', 'Product/UX and operator: test the market choice, audit tours, compare configuration with custom development and start payment onboarding.', 'Team explains its market choice; operator approves a sample Truth Card; merchant requirements are known.'],
    ['3-4', 'Designer and engineer: matching, tour page, responsive layout, catalog schema and inventory model.', 'Catalog is ready; unsuitable searches and price consistency are tested; early readers understand the terms.'],
    ['5-6', 'Engineer: booking, seat holds, hosted checkout adapter, Passport and operator controls.', 'Provider test access is approved; duplicate, failed and pending events cannot falsely confirm or overbook.'],
    ['7-8', 'QA/security and operator: test refunds, reconciliation, roles, privacy and content.', 'Merchant terms are agreed; no critical security/payment defect remains; guides and transport are verified.'],
    ['9-10', 'UX and operator: recruit ten target adults, run consented tasks, train staff and revise.', 'Use consent and synthetic details; record actual observations and fix serious failures.'],
    ['11-12', 'Engineer and operator: retest, rehearse support and approve a capped pilot.', 'Support/refund owner, delivery capacity and rollback procedure are ready; required checks pass.']
], [0.10,0.46,0.44])
h(b, 'Planned participant testing')
p(b, 'No interviews or surveys have taken place. Recruit ten India-resident adults who are comfortable booking in English and considering Kazakhstan, with varied devices and travel experience. Explain that participation is voluntary, no purchase is required and recording needs separate consent. Use anonymous codes and synthetic traveler details; collect no card or passport data.')
p(b, 'Ask each participant to find a suitable departure, identify two exclusions and the full party charge, explain cancellation, complete a demo booking, recover from a decline and distinguish pending from confirmed. Proposed criteria are 8/10 unassisted core completions, 9/10 correct price/exclusions and 10/10 correct payment-state interpretation. Record actual counts. Ten formative tests can reveal usability failures but cannot establish a conversion increase.')
h(b, 'Completed software checks')
p(b, 'Agent-controlled Chrome checks covered 1440, 768 and 360px layouts, filters, tour creation and matching, private answers, guide assignment and payment recovery. A three-person Charyn booking kept its accepted 174,000 KZT total after catalog changes. Drafts survived navigation/reload, while changed terms required fresh consent. Pending, declined and confirmed states remained distinct. All 42 automated tests passed, including regressions for stale responses, multiline input, departure limits and the live party total. These results describe software behavior; no participant outcomes or human approval are claimed.')

b = page('Costs and payback')
p(b, 'The financial model forecasts incremental cash flows in KZT from January 2027 to December 2028. Development takes months 1-3; running costs and marketing begin in month 4, giving nine active months in year 1 and twelve in year 2. Costs, traffic, conversion and margins are assumptions to test. The model uses the case average of 44,000 KZT per traveler, not the demo tour prices. It counts new completed travelers only; it adds no legacy revenue, migration of existing bookings, internal commission or staff-time saving.')
cost_rows = [[x['item'], str(x['hours']), fmt(x['rate']), fmt(x['hours']*x['rate'])] for x in I['initial_work']]
cost_rows.append(['Initial work total', fmt(S['shared']['initial_work_hours']), '', fmt(S['shared']['initial_work'])])
table(b, ['Initial work', 'Hours', 'KZT/hour', 'KZT'], cost_rows, [0.48,0.12,0.18,0.22])
running_breakdown = '; '.join(f"{x['item']} {fmt(x['units']*x['rate'])}" for x in I['monthly_running'])
p(b, f"Monthly running cost is {fmt(S['shared']['monthly_running'])}: {running_breakdown}. Marketing adds {fmt(S['shared']['monthly_marketing'])} per active month. Year-one running and marketing therefore total {fmt(B['year1']['operating'])} and {fmt(B['year1']['marketing'])}. Contingency is {fmt(S['shared']['contingency'])}, equal to 15% of combined initial work and year-one running costs; the model treats it as spent in month 3. The model prices the work at stated hourly rates; it does not assume that students or AI make development free.")
table(b, ['24 month result', 'Base', '30% fewer new travelers'], [
    ['Completed new travelers', fmt(B['total24']['completed']), fmt(D['total24']['completed'])],
    ['Tour revenue', fmt(B['total24']['revenue']), fmt(D['total24']['revenue'])],
    ['Contribution after variable costs', fmt(B['total24']['contribution']), fmt(D['total24']['contribution'])],
    ['Cumulative project cash flow', fmt(B['ending_cash_flow']), fmt(D['ending_cash_flow'])],
    ['Peak month-end funding required', fmt(B['peak_funding_required']), fmt(D['peak_funding_required'])],
    ['First nonnegative cumulative month', 'Month 23 / November 2028', 'Not reached in 24 months'],
    ['Year 1 gross cash uses', fmt(B['year1']['gross_cash_uses']), fmt(D['year1']['gross_cash_uses'])]
], [0.47,0.26,0.27])
p(b, f"At {fmt(I['drivers']['realized_price'])} revenue per traveler, delivery costs are assumed at {I['drivers']['tour_delivery_share']:.0%}, payment at {I['drivers']['payment_fee_share']:.0%} and other variable service at {fmt(I['drivers']['variable_service_per_traveler'])}. This leaves {fmt(S['shared']['contribution_per_traveler'])} contribution per traveler ({100*S['shared']['contribution_margin']:.0f}%). The 3% payment input is informed by the published other-bank tariff and still needs merchant confirmation. [S06-S07] Fixed running, marketing, development and contingency are then deducted to calculate undiscounted, incremental pre-tax project cash flow.")
p(b, f"The first-year fixed project envelope is {fmt(B['year1']['project_fixed_envelope'])}. Including incremental tour delivery and variable fees, gross uses are {fmt(B['year1']['gross_cash_uses'])}, below the case ceiling of {fmt(S['shared']['budget'])} under a stricter budgeting interpretation. The downside reduces new completed travelers and genuinely variable costs by 30%, while fixed costs and marketing stay unchanged. Payback is not company profit; taxes, settlement delays and supplier terms remain outside the validated assumptions.")

b = page('Expected impact and decision')
h(b, 'Demand and capacity are the main constraints')
p(b, f"The assumed funnel converts qualified visits into inquiries at {I['drivers']['qualified_session_to_inquiry']:.0%}, inquiries into paid parties at {I['drivers']['inquiry_to_paid_party']:.0%}, and paid bookings into completed trips at {I['drivers']['paid_to_completed']:.0%}, with {I['drivers']['travelers_per_party']} travelers per party. This yields {fmt(B['year1']['completed'])} new travelers in year 1 and {fmt(B['year2']['completed'])} in year 2. It needs {fmt(B['year1']['qualified_sessions'])} then {fmt(B['year2']['qualified_sessions'])} qualified sessions, an increase of {S['shared']['year2_session_growth_multiple']:.2f} times. The assumed {1-I['drivers']['paid_share_of_sessions']:.0%} earned/direct/referral/partner traffic is not secured. Marketing cost per new completed traveler falls from {fmt(B['year1']['marketing_cost_per_incremental_completed'])} to {fmt(B['year2']['marketing_cost_per_incremental_completed'])}; this improvement is ambitious and untested.")
p(b, f"The forecast holds the 2025 legacy base flat at approximately {fmt(S['shared']['baseline_foreign_approximate'])} foreign and {fmt(S['shared']['baseline_domestic_approximate'])} domestic travelers in each year. It assumes {I['drivers']['incremental_foreign_share']:.0%} of new travelers are foreign. In year 2, foreign share is {fmt(B['year2']['foreign_total'])} / ({fmt(B['year2']['foreign_total'])} + {fmt(B['year2']['domestic_total'])}) = {pct(B['year2']['foreign_share'])}. The downside reaches only {pct(D['year2']['foreign_share'])}. Capacity assumes {I['drivers']['seats_per_incremental_departure']} people per group, {I['drivers']['guide_days_per_departure_including_buffer']} guide-days including buffer and about {I['case']['freelance_guides_approximate']} freelancers available {I['drivers']['available_days_per_guide_per_month']} days/month. Peak base utilization is {100*B['total24']['peak_guide_utilization']:.0f}%; language, location, vehicles and actual guide availability remain unverified.")
table(b, ['Risk and responsible role', 'Response', 'Warning or stop condition'], [
    ['Incorrect information / product owner', 'Approve catalog data; calculate dates, price and seats consistently; route unresolved questions to staff.', 'An unsupported promise or contradictory price.'],
    ['Payment / finance and engineer', 'Obtain merchant approval; test issuers, verified events, refunds and reconciliation.', 'Unknown settlement terms, false confirmation or duplicate charge.'],
    ['Privacy and security / engineer', 'Limit collected data; secure access, logs and retention; arrange external review.', 'A sensitive-data leak or critical access flaw.'],
    ['Acquisition / growth owner', 'Use capped cohorts and measure additional completed trips and contribution.', 'Acquisition cost exceeds contribution for two cohorts.'],
    ['Delivery / operator', 'Reserve guides, transport and suppliers before offering capacity.', 'An unstaffed departure or planned guide load above 85%.']
], [0.26,0.43,0.31])
p(b, 'Company measures should include completed foreign bookings, contribution and support time. Traveler measures should include correct understanding of terms and successful booking completion. Clearer booking information may improve those travelers\' experience of Kazakhstan, but one operator\'s product cannot establish a change in the country\'s overall tourism image. These effects have not been measured.')
h(b, 'Recommendation')
p(b, f"Proceed only with a small pilot after the team has justified its market and product choices and the operator has confirmed delivery and payment arrangements. Base-case cumulative cash first becomes positive in November 2028 and ends at {fmt(B['ending_cash_flow'])} KZT. The downside ends at {fmt(D['ending_cash_flow'])} KZT without payback in 24 months. The narrow base surplus makes working capital and acquisition performance important conditions for expansion.")

b = page('AI Declaration')
p(b, 'The initial report and much of the supporting analysis were generated by AI. ChatGPT helped develop the supplied concept and brief. Codex generated and revised report text, interpreted sources, built the application and tests, produced the financial model and prepared the Word/PDF files. This was substantive generation and analysis, not grammar-only assistance.')
p(b, 'Codex used Superpowers for planning, implementation, debugging and AI code review; browser and web tools for source checks, demo testing and screenshots; and spreadsheet/document/PDF capabilities for calculations and artifacts. Humanizer version 3.1.0 was successfully installed and used to edit the report\'s prose, captions and this declaration. It is an editing skill, not a human author or evidence that the text was written independently by students. Product Design and Context7 were unavailable and were not used.')
p(b, 'The conversation confirms that the user supplied instructions, chose the product identity and visual direction, and requested revisions. It does not establish which team members developed the market strategy, checked sources themselves, validated financial assumptions or approved the conclusions. No interviews, surveys or participant testing are claimed. Substantive team contributions and relevant chat links remain to be supplied.')
p(b, 'The organizers\' Levels of AI Use framework and the separate Stage 1 Rules & Evaluation Criteria are missing from the identified materials. The applicable level is therefore unclassified; no numbered level is asserted. The case requires the main thinking, ideas and strategy to be the team\'s own. This review draft does not yet establish that requirement. Team analysis, documented contributions, source review and a final submission decision remain necessary. [C, p.3]')

b = page('References')
p(b, 'External sources were opened and checked on 23 October 2026. Live prices and technical documentation may change. Publication dates are recorded where available; an access date does not establish when an undated page was published. The team still needs to verify these sources itself. [C, p.3]')
p(b, '[C] ZERTTEX Hackathon 2026. Stage 1 Case 1 Technology Product. Released 23 October 2026 at 10:00 Astana time. Three-page supplied case: company facts and requirements pp.1-2; judging criteria and submission checklist p.3. The separate rules and AI-use framework were not supplied.')
for source in sources:
    b.append(('ref', f"[{source['source_id']}] {source['publisher']}. {source['title']}. Publication: {source['publication_date']}. Data: {source['data_period']}. {source['URL']}"))
p(b, 'Figure 1 is a genuine local browser capture. Figure 2 is an AI-generated diagram of the proposed workflow, not external evidence. The website\'s Charyn Canyon photograph is by Bgag, dated 22 September 2023, Wikimedia Commons, CC0 1.0. Full destination-image attributions are in assets/attribution.md.')
b.append(('ref','Image source: https://commons.wikimedia.org/wiki/File:Charyn_Canyon,_Kazakhstan_02.jpg | License: https://creativecommons.org/publicdomain/zero/1.0/deed.en | Checked 23 October 2026.'))

# Sources for each format are identical; generate markdown rather than maintain another prose copy.
md = []
for n, blocks in enumerate(pages, 1):
    md.append(f'<!-- Report page {n}; '+('main report content' if n<=6 else 'AI Declaration counted within content limit' if n==7 else 'References excluded from content limit')+' -->')
    for block in blocks:
        kind = block[0]
        if kind in ('title','h1','h2'): md.append(('# ' if kind=='title' else '## ' if kind=='h1' else '### ')+block[1])
        elif kind in ('p','meta','ref','subtitle'): md.append(block[1])
        elif kind=='table':
            md.append('| '+' | '.join(block[1])+' |\n| '+' | '.join(['---']*len(block[1]))+' |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |' for row in block[2]))
        elif kind=='image': md.append(f'![{block[2]}](../../../{block[1]})')
    md.append('\n---\n')
(OUT/'report.md').write_text('\n\n'.join(md), encoding='utf-8')

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
run=footer.add_run('Saryarqa Routes | Samal Journey | Review draft | ')
run.font.size=Pt(8)
field=OxmlElement('w:fldSimple'); field.set(qn('w:instr'),'PAGE'); footer._p.append(field)
doc.core_properties.title = 'Samal Journey Technology Product Proposal'
doc.core_properties.author = 'AI assisted working draft for team review'
doc.core_properties.subject = 'A technology product for Saryarqa Routes | ZERTTEX Hackathon 2026 Stage 1 Case 1'
doc.core_properties.keywords = 'Samal Journey, Saryarqa Routes, AI-assisted, team review pending'

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
    suffix='Report content' if doc.page<=6 else 'AI Declaration / content' if doc.page==7 else 'References'
    canvas.drawString(18*72/25.4,10*72/25.4,'Saryarqa Routes | Samal Journey | Review draft')
    canvas.drawRightString(A4[0]-18*72/25.4,10*72/25.4,f'{suffix} | {doc.page}')
    canvas.restoreState()
pdf_path=OUT/'TeamName_TechnologyProduct.pdf'
SimpleDocTemplate(str(pdf_path),pagesize=A4,leftMargin=18*72/25.4,rightMargin=18*72/25.4,topMargin=16*72/25.4,bottomMargin=17*72/25.4,title='Samal Journey Technology Product Proposal',subject='A technology product for Saryarqa Routes',author='AI assisted working draft for team review').build(story,onFirstPage=foot,onLaterPages=foot)
reader=PdfReader(pdf_path)
exported_text='\n'.join(item.extract_text() for item in reader.pages)
financial_values=[S['scenarios'][scenario][period][field] for scenario in ['base','downside'] for period,field in [('total24','revenue'),('total24','contribution'),('year1','gross_cash_uses')]]+[S['scenarios'][scenario][field] for scenario in ['base','downside'] for field in ['ending_cash_flow','peak_funding_required']]
reopened_doc=Document(docx_path)
with ZipFile(docx_path) as z: valid_docx=z.testzip() is None
docx_text='\n'.join(para.text for para in reopened_doc.paragraphs)+'\n'+'\n'.join(cell.text for table in reopened_doc.tables for row in table.rows for cell in row.cells)
check={'pages':len(reader.pages),'expected_pages':8,'main_pages':6,'content_pages_including_ai':7,'content_limit':8,'references_expected_page':8,'ai_declaration_expected_page':7,'a4':all(abs(float(p.mediabox.width)-A4[0])<1 and abs(float(p.mediabox.height)-A4[1])<1 for p in reader.pages),'markdown_generated_from_same_content':True,'financial_source':'finance/summary.json','canonical_financial_values_found':all(fmt(value) in exported_text for value in financial_values),'canonical_financial_values_in_docx':all(fmt(value) in docx_text for value in financial_values),'no_legacy_brand_in_final_text':all(term not in exported_text and term not in docx_text for term in ['QazaqPass','Samal Journeys']),'company':'Saryarqa Routes','company_on_first_page':'Saryarqa Routes' in reader.pages[0].extract_text(),'docx_zip_valid':valid_docx,'docx_reopens':True,'docx_embedded_images':len(reopened_doc.inline_shapes),'docx_tables':len(reopened_doc.tables),'pdf_sha256':hashlib.sha256(pdf_path.read_bytes()).hexdigest(),'docx_sha256':hashlib.sha256(docx_path.read_bytes()).hexdigest(),'financial_source_sha256':hashlib.sha256((ROOT/'finance/summary.json').read_bytes()).hexdigest(),'brand':'Samal Journey','current_automated_tests':42,'latest_screenshot':'revisions/2026-10-23/screenshots/after-desktop-truth.png','screenshot_sha256':hashlib.sha256((ROOT/'revisions/2026-10-23/screenshots/after-desktop-truth.png').read_bytes()).hexdigest(),'docx_visual_status':'Pending fresh packaged renderer attempt','humanizer_version':'3.1.0','initial_authorship':'Substantially AI-generated; substantive team contribution unconfirmed','official_ai_level':'Unclassified; framework missing','draft_status':'REVIEW DRAFT','source_register':'revisions/2026-10-23/source-verification.csv','pdf_visual_status':'Pending latest page image review'}
(OUT/'report_verification.json').write_text(json.dumps(check,indent=2),encoding='utf-8')
print(json.dumps(check,indent=2))
if len(reader.pages)!=8: raise RuntimeError('Report overflow: expected 8 total pages; inspect and repair layout')
assert check['canonical_financial_values_found'] and check['canonical_financial_values_in_docx'] and check['docx_zip_valid'] and check['a4']
assert check['no_legacy_brand_in_final_text'] and check['company_on_first_page']
assert check['docx_embedded_images']==2
assert 'References' in reader.pages[7].extract_text()
assert 'AI Declaration' in reader.pages[6].extract_text()
print('Created revision-only review draft, flow figure, DOCX and PDF. Render and inspect before claiming completion.')
