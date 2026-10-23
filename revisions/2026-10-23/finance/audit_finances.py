"""Independent read-only financial audit. Writes evidence only beside this script."""
from pathlib import Path
import csv, hashlib, json, math, zipfile
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
SOURCE = ROOT / 'finance'
NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
checks = []
def close(actual, expected, label, tolerance=1e-6):
    assert math.isclose(float(actual), float(expected), rel_tol=1e-12, abs_tol=tolerance), f'{label}: {actual} != {expected}'
    checks.append(label)
def exact(actual, expected, label):
    assert actual == expected, f'{label}: {actual} != {expected}'
    checks.append(label)
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()

manifest = json.loads((OUT / 'original_hashes.json').read_text(encoding='utf-8'))
for relative, sha in manifest.items():
    exact(digest(ROOT / relative), sha, 'Preserved original: ' + relative)
p = json.loads((SOURCE / 'inputs.json').read_text(encoding='utf-8'))
saved = json.loads((SOURCE / 'summary.json').read_text(encoding='utf-8'))
with (SOURCE / 'monthly_cash_flows.csv').open(encoding='utf-8', newline='') as f:
    csv_rows = list(csv.DictReader(f))
d = p['drivers']; case = p['case']
work = sum(x['hours'] * x['rate'] for x in p['initial_work'])
hours = sum(x['hours'] for x in p['initial_work'])
running = sum(x['units'] * x['rate'] for x in p['monthly_running'])
reserve = (work + running * 9) * d['contingency_rate']
unit = d['realized_price'] * (1 - d['tour_delivery_share'] - d['payment_fee_share']) - d['variable_service_per_traveler']
close(hours, 960, 'Initial paid hours')
close(work, 7780000, 'Initial paid cost')
close(running, 260000, 'Active-month running cost')
close(reserve, 1518000, 'Contingency basis')
close(unit, 11440, 'Unit contribution')
close(unit / d['realized_price'], .26, 'Contribution margin')
close(case['revenue_2025'] - case['travelers_2025'] * case['average_price'], 400000, 'Source case difference')
close(sum(p['legacy_monthly_seasonality']), 1, 'Annual legacy seasonality sums to one')
close(sum(p['initial_cash_weights']), 1, 'Initial cash weights sum to one')
exact(case['travelers_2025'], 3400, 'Supplied case travelers')
exact(case['revenue_2025'], 150000000, 'Supplied case revenue')
exact(case['average_price'], 44000, 'Supplied case average price')
exact(case['budget'], 20000000, 'Supplied case development/launch ceiling')
exact(case['foreign_share_target'], .30, 'Supplied case foreign-share goal')

results = {}; recalculated = []
for scenario, multiplier in [('base', 1), ('downside', .7)]:
    cumulative = 0; months = []
    sessions = p['year1_qualified_sessions'] + p['year2_qualified_sessions']
    departures = p['year1_incremental_departures'] + p['year2_incremental_departures']
    for i, visits in enumerate(sessions):
        inquiry = visits * d['qualified_session_to_inquiry']
        parties = inquiry * d['inquiry_to_paid_party']
        demand = parties * d['travelers_per_party'] * d['paid_to_completed']
        capacity = departures[i] * d['seats_per_incremental_departure']
        base = min(demand, capacity); completed = base * multiplier
        revenue = completed * d['realized_price']
        delivery = revenue * d['tour_delivery_share']; payment = revenue * d['payment_fee_share']
        service = completed * d['variable_service_per_traveler']; contribution = revenue - delivery - payment - service
        operating = running if i >= 3 else 0; marketing = p['monthly_marketing'] if i >= 3 else 0
        development = work * p['initial_cash_weights'][i] if i < 3 else 0
        contingency = reserve if i == 2 else 0
        cf = contribution - operating - marketing - development - contingency
        cumulative += cf
        legacy = case['travelers_2025'] * p['legacy_monthly_seasonality'][i % 12]
        guide_days = math.ceil((legacy + completed) / d['seats_per_incremental_departure']) * d['guide_days_per_departure_including_buffer']
        guide_capacity = case['freelance_guides_approximate'] * d['available_days_per_guide_per_month']
        r = {'scenario': scenario, 'month': i + 1, 'period': f'{2027 + i // 12}-{i % 12 + 1:02d}', 'year': i // 12 + 1,
             'qualified_sessions': visits, 'inquiries': inquiry, 'paid_parties': parties, 'unconstrained_travelers': demand,
             'planned_incremental_departures': departures[i], 'incremental_capacity': capacity, 'base_completed': base,
             'completed': completed, 'incremental_foreign': completed * d['incremental_foreign_share'],
             'incremental_domestic': completed * (1 - d['incremental_foreign_share']), 'revenue': revenue,
             'delivery': delivery, 'payment': payment, 'service': service, 'contribution': contribution,
             'operating': operating, 'marketing': marketing, 'development': development, 'contingency': contingency,
             'cash_flow': cf, 'cumulative_cash_flow': cumulative, 'funding_required': max(0, -cumulative),
             'gross_cash_uses': delivery + payment + service + operating + marketing + development + contingency,
             'legacy_travelers': legacy, 'total_departures': guide_days / d['guide_days_per_departure_including_buffer'],
             'guide_days': guide_days, 'guide_capacity_days': guide_capacity, 'guide_utilization': guide_days / guide_capacity}
        row = csv_rows[i + (24 if scenario == 'downside' else 0)]
        for key, expected in r.items():
            if isinstance(expected, str): exact(row[key], expected, f'CSV {scenario} {i+1}: {key}')
            else: close(row[key], expected, f'CSV {scenario} {i+1}: {key}')
        months.append(r)
    aggregates = {}
    additive = ['qualified_sessions','inquiries','paid_parties','completed','incremental_foreign','incremental_domestic','revenue','delivery','payment','service','contribution','operating','marketing','development','contingency','cash_flow','gross_cash_uses']
    for period, selection in [('year1', months[:12]), ('year2', months[12:]), ('total24', months)]:
        a = {key: sum(r[key] for r in selection) for key in additive}
        a['project_fixed_envelope'] = sum(a[k] for k in ['operating','marketing','development','contingency'])
        a['peak_funding_required'] = max(r['funding_required'] for r in selection)
        a['marketing_cost_per_incremental_completed'] = a['marketing'] / a['completed']
        a['implied_cost_per_paid_session'] = a['marketing'] / (a['qualified_sessions'] * d['paid_share_of_sessions'])
        a['peak_guide_utilization'] = max(r['guide_utilization'] for r in selection)
        if period != 'total24':
            a['foreign_total'] = case['annual_foreign_baseline_approximate'] + a['incremental_foreign']
            a['domestic_total'] = case['annual_domestic_baseline_approximate'] + a['incremental_domestic']
            a['foreign_share'] = a['foreign_total'] / (a['foreign_total'] + a['domestic_total'])
        for k, expected in a.items(): close(saved['scenarios'][scenario][period][k], expected, f'Summary {scenario} {period}: {k}')
        aggregates[period] = a
    payback = next((r['month'] for r in months if r['cumulative_cash_flow'] >= 0), None)
    exact(saved['scenarios'][scenario]['payback_month'], payback, f'{scenario} first payback crossing')
    close(saved['scenarios'][scenario]['ending_cash_flow'], cumulative, f'{scenario} ending cash')
    close(saved['scenarios'][scenario]['peak_funding_required'], max(r['funding_required'] for r in months), f'{scenario} peak funding')
    exact(saved['scenarios'][scenario]['peak_funding_month'], max(months, key=lambda r: r['funding_required'])['month'], f'{scenario} peak funding month')
    results[scenario] = {**aggregates, 'payback_month': payback, 'ending_cash': cumulative, 'payback_crossing': [{k: r[k] for k in ['month','period','cash_flow','cumulative_cash_flow']} for r in months[21:24]]}
    recalculated.extend(months)
for i in range(24):
    b, downside = recalculated[i], recalculated[i+24]
    for key in ['completed','revenue','delivery','payment','service','contribution']:
        close(downside[key], b[key] * .7, f'Exact downside {i+1}: {key}')
    for key in ['operating','marketing','development','contingency']:
        close(downside[key], b[key], f'Fixed downside {i+1}: {key}')

# Compare exported cells, formulas, values and preserved native features.
def read_book(file):
    with zipfile.ZipFile(file) as z:
        strings = [''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        sheets = [ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')) for i in range(1,4)]
        cells = {}; features = {}
        for i, sheet in enumerate(sheets, 1):
            for c in sheet.findall('.//x:c', NS):
                v = c.find('x:v', NS); f = c.find('x:f', NS)
                if v is None and f is None: continue
                value = v.text if v is not None else None
                typ = c.attrib.get('t', 'n')
                if typ == 's': value = strings[int(value)]; typ = 'str'
                assert typ != 'e', (file, i, c.attrib['r'])
                cells[(i, c.attrib['r'])] = (typ, value, f.text if f is not None else None)
            for tag in ['dataValidations','sheetViews','conditionalFormatting','cols','pageMargins']:
                features[(i,tag)] = [ET.tostring(n,encoding='unicode') for n in sheet.findall('x:'+tag, NS)]
        return cells, features
original, native = read_book(SOURCE / 'Samal_Journeys_Financial_Model.xlsx')
revised, revised_native = read_book(OUT / 'Samal_Journey_Financial_Model.xlsx')
exact(set(original), set(revised), 'Saved cell locations preserved')
for key, before in original.items():
    after = revised[key]
    if key == (1,'C2'):
        exact(after, ('str','Samal Journey financial outlook',None), 'Correct singular product title')
        continue
    exact(before[0],after[0], f'Cell type {key}')
    exact(before[2],after[2], f'Formula {key}')
    if before[0] in ['n','b'] and before[1] is not None: close(after[1],before[1],f'Saved value {key}')
    else: exact(after[1],before[1],f'Saved label {key}')
exact(native,revised_native,'Validation, panes, conditions, widths and margins preserved')
for ref, expected in [('D8',180),('E8',1500),('F18',261200),('D17',19298800),('D27',23),('E22',1486/4900)]:
    close(revised[(1,ref)][1],expected, f'Exported headline {ref}')
for relative, sha in manifest.items(): exact(digest(ROOT / relative), sha, 'Final preserved original: ' + relative)

proof = {'status':'passed','date':'2026-10-23','method':'Independent Python arithmetic from canonical inputs; all 48 monthly CSV rows, material summary totals, both case recalculations and saved-workbook preservation checked.',
         'check_count':len(checks),'original_files_preserved':len(manifest),'case_source':'Zertex_Case1_Technology_Product.pdf, supplied PDF pp.1-2',
         'results':results,'financial_correction_required':False,
         'identified_source_discrepancy':{'description':'Case traveler count times stated average differs from stated case revenue. Both supplied values retained.','difference_KZT':400000},
         'limitations':['Projections are unvalidated planning assumptions, not evidence of demand or supplier prices.','No discounting, tax charge, financing, intra-month liquidity or payment/refund settlement schedule is modeled.','Native Microsoft Excel desktop recalculation not verified.'],
         'revised_workbook_sha256':digest(OUT/'Samal_Journey_Financial_Model.xlsx'),
         'visual_inspection':['summary','assumptions-drivers','assumptions-costs','assumptions-monthly','assumptions-notes','monthly-funnel','monthly-cash']}
(OUT/'audit_results.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
print(f'PASS: {len(checks)} arithmetic, source, preservation and export assertions; {len(manifest)} original files unchanged.')
