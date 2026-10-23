import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
import { directory, calculate } from './calculate.mjs';

const input = JSON.parse(await fs.readFile(path.join(directory,'inputs.json'),'utf8'));
const result = calculate(input);
const wb = Workbook.create();
const summary = wb.worksheets.add('Summary');
const assumptions = wb.worksheets.add('Assumptions');
const flow = wb.worksheets.add('Monthly cash flow');
const pine='#284C3E', olive='#6E7A5C', terracotta='#AD6249', paper='#FDFBF7', blue='#1F57B8', green='#147446';
const money='#,##0;(#,##0);"–"', count='#,##0.0;(#,##0.0);"–"';
for(const s of [summary,assumptions,flow]) {
  s.showGridLines=false;
  s.getRange('A1:B110').format.columnWidth=2.2;
  s.getRange('C1:AA110').format.font={name:'Arial',size:10,color:'#1C1F22'};
  s.getRange('C1:AA110').format.rowHeight=21;
  s.getRange('C1:AA110').format.verticalAlignment='center';
  s.getRange('C1:C110').format.columnWidth=47;
  s.getRange('D1:AA110').format.columnWidth=16;
  s.getRange('C2').format.font={name:'Arial',size:15,bold:true,color:pine};
  s.getRange('C4').values=[['Case selected']];
  s.getRange('D4').format={font:{color:green,bold:true},fill:'#EDF0E8',horizontalAlignment:'center',borders:{preset:'outside',style:'dotted',color:olive}};
  if(s!==assumptions)s.getRange('D4').formulas=[["=Assumptions!D4"]];
}
summary.tabColor=pine;assumptions.tabColor=olive;
summary.getRange('C2:F39').format.fill=paper;
assumptions.getRange('C2:I100').format.fill=paper;
flow.getRange('C2:AA47').format.fill=paper;
for(const sheet of [summary,assumptions,flow]) {
  sheet.getRange('C2:F2').format.borders={bottom:{style:'thin',color:terracotta}};
  sheet.getRange('D4').format.fill='#EDF0E8';
}
summary.getRange('C2').values=[['Samal Journeys financial outlook']];
summary.getRange('C3').values=[['A digital product for Saryarqa Routes']];
summary.getRange('C3').format.font.color=olive;
assumptions.getRange('C2').values=[['Forecast assumptions']];
flow.getRange('C2').values=[['Monthly incremental cash flow (KZT)']];
flow.freezePanes.freezeRows(8);flow.freezePanes.freezeColumns(3);
assumptions.freezePanes.freezeRows(4);

function value(s,address,v){s.getRange(address).values=[[v]];}
function formula(s,address,v){s.getRange(address).formulas=[[v]];s.getRange(address).format.font.color=v.includes('!')?green:'#000000';}
function header(s,address){s.getRange(address).format={fill:pine,font:{bold:true,color:'#FFFFFF'},horizontalAlignment:'center',borders:{bottom:{style:'thin',color:'#FFFFFF'}}};}
function total(s,address){s.getRange(address).format={font:{bold:true},borders:{top:{style:'thin',color:'#CDBDA8'}}};}
value(assumptions,'D4','Base');
assumptions.getRange('D4').dataValidation={rule:{type:'list',values:['Base','Downside']}};
value(assumptions,'C7','Active completed-traveler multiplier');
formula(assumptions,'D7','=IF(D4="Base",D8,IF(D4="Downside",D9,NA()))');
value(assumptions,'C8','Base');value(assumptions,'D8',1);
value(assumptions,'C9','Downside');value(assumptions,'D9',input.drivers.downside_traveler_multiplier);
assumptions.getRange('D7:D9').setNumberFormat('0.0%');
const rows=[
  ['Realized revenue per traveler',input.drivers.realized_price,'KZT','Case average; forecast assumption'],
  ['Tour delivery share of revenue',input.drivers.tour_delivery_share,'Ratio','Planning estimate; obtain supplier margins'],
  ['Payment fee share of revenue',input.drivers.payment_fee_share,'Ratio','Planning estimate; obtain merchant quote'],
  ['Variable service per traveler',input.drivers.variable_service_per_traveler,'KZT','Planning estimate'],
  ['Foreign share of new travelers',input.drivers.incremental_foreign_share,'Ratio','Planning estimate; ambitious target mix'],
  ['Qualified session to inquiry',input.drivers.qualified_session_to_inquiry,'Ratio','Planning estimate; measure pilot cohorts'],
  ['Inquiry to paid party',input.drivers.inquiry_to_paid_party,'Ratio','Planning estimate; measure pilot cohorts'],
  ['Travelers per party',input.drivers.travelers_per_party,'Travelers','Planning estimate'],
  ['Paid travelers completing travel',input.drivers.paid_to_completed,'Ratio','Planning estimate; no cancelled revenue'],
  ['Paid share of qualified sessions',input.drivers.paid_share_of_sessions,'Ratio','80% earned/direct/referral/partner assumed'],
  ['Annual domestic baseline, approximate',input.case.annual_domestic_baseline_approximate,'Travelers','3,400 x approximately 96%'],
  ['Annual foreign baseline, approximate',input.case.annual_foreign_baseline_approximate,'Travelers','3,400 x approximately 4%'],
  ['2025 travelers, case fact',input.case.travelers_2025,'Travelers','Supplied case PDF, pages 1–2'],
  ['2025 revenue, case fact',input.case.revenue_2025,'KZT','Supplied case PDF, pages 1–2'],
  ['First-year ceiling, case fact',input.case.budget,'KZT','Case: development and launch; stricter test here'],
  ['Year-two foreign share goal',input.case.foreign_share_target,'Ratio','30% of total year-two travelers'],
  ['Seats per incremental departure',input.drivers.seats_per_incremental_departure,'Seats','Planning estimate'],
  ['Guide days per departure with buffer',input.drivers.guide_days_per_departure_including_buffer,'Days','Planning estimate; average tour plus buffer'],
  ['Freelance guide pool, approximate',input.case.freelance_guides_approximate,'Guides','Case about 25; no availability commitment'],
  ['Available days per guide each month',input.drivers.available_days_per_guide_per_month,'Days','Planning estimate; locations/languages untested'],
  ['Contingency on initial work and Y1 run',input.drivers.contingency_rate,'Ratio','Full reserve treated as spent in Month 3']
];
assumptions.getRange('C11:G11').values=[['Driver','Value','Unit',null,'Source or assumption']];header(assumptions,'C11:G11');
for(let i=0;i<rows.length;i++){
  value(assumptions,`C${i+12}`,rows[i][0]);value(assumptions,`D${i+12}`,rows[i][1]);value(assumptions,`E${i+12}`,rows[i][2]);value(assumptions,`G${i+12}`,rows[i][3]);
  assumptions.getRange(`D${i+12}`).setNumberFormat(rows[i][2]==='Ratio'?'0.0%':money);
}
assumptions.getRange('G11:G33').format.columnWidth=58;
assumptions.getRange('D8:D32').format.font.color=blue;
assumptions.getRange('D11').format.font.color='#FFFFFF';
assumptions.getRange('D12:D32').format.fill='#FFF5D9';
assumptions.getRange('C36:F36').values=[['Initial paid work','Hours','KZT / hour','Cash cost']];header(assumptions,'C36:F36');
for(let i=0;i<input.initial_work.length;i++){
  const r=i+37,x=input.initial_work[i];assumptions.getRange(`C${r}:E${r}`).values=[[x.item,x.hours,x.rate]];
  formula(assumptions,`F${r}`,`=D${r}*E${r}`);
}
value(assumptions,'C44','Total initial work');formula(assumptions,'D44','=SUM(D37:D43)');formula(assumptions,'F44','=SUM(F37:F43)');total(assumptions,'C44:F44');
assumptions.getRange('D37:E43').format.font.color=blue;
assumptions.getRange('E37:F44').setNumberFormat(money);
assumptions.getRange('C47:F47').values=[['Monthly running from Month 4','Units / hours','KZT / unit','Monthly cost']];header(assumptions,'C47:F47');
for(let i=0;i<input.monthly_running.length;i++){
  const r=i+48,x=input.monthly_running[i];assumptions.getRange(`C${r}:E${r}`).values=[[x.item,x.units,x.rate]];formula(assumptions,`F${r}`,`=D${r}*E${r}`);
}
value(assumptions,'C53','Total monthly running');formula(assumptions,'F53','=SUM(F48:F52)');total(assumptions,'C53:F53');
assumptions.getRange('D48:E52').format.font.color=blue;assumptions.getRange('E48:F53').setNumberFormat(money);
value(assumptions,'C55','Monthly marketing from Month 4');value(assumptions,'D55',input.monthly_marketing);assumptions.getRange('D55').format.font.color=blue;
value(assumptions,'C57','Contingency cash provision');formula(assumptions,'D57','=(F44+F53*SUM(H61:H72))*D32');assumptions.getRange('D55:D57').setNumberFormat(money);
assumptions.getRange('C60:I60').values=[['Period','Qualified sessions','New departures','Legacy seasonality','Initial cash weight','Running active','Marketing KZT']];header(assumptions,'C60:I60');
const sessions=[...input.year1_qualified_sessions,...input.year2_qualified_sessions];
const departures=[...input.year1_incremental_departures,...input.year2_incremental_departures];
for(let i=0;i<24;i++){
  const r=i+61, date=new Date(input.forecast_start);date.setUTCMonth(date.getUTCMonth()+i);
  assumptions.getRange(`C${r}:H${r}`).values=[[date,sessions[i],departures[i],input.legacy_monthly_seasonality[i%12],input.initial_cash_weights[i]??0,i<3?0:1]];
  formula(assumptions,`I${r}`,`=$D$55*H${r}`);
}
assumptions.getRange('C61:C84').setNumberFormat('mmm-yy');assumptions.getRange('D61:H84').format.font.color=blue;assumptions.getRange('F61:G84').setNumberFormat('0.0%');assumptions.getRange('I61:I84').setNumberFormat(money);
value(assumptions,'C87','Interpretation and limitations');assumptions.getRange('C87').format.font.bold=true;
// Short plain lines remain readable without merging table cells.
const notes=[
  'All costs and demand drivers are estimates requiring operator validation.',
  'Case source: Zertex_Case1_Technology_Product.pdf, pages 1–2.',
  'Initial fees assume 960 paid hours over approximately 12 weeks.',
  'The full contingency provision is conservatively spent in Month 3.',
  'Revenue and variable costs settle in the travel month. No payment float is used.',
  'No cash savings, tax benefits, debt or legacy online migration revenue are counted.',
  'Year 2 sessions grow 8.33 times. Earned and partner traffic is not contracted.',
  'Scale depends on measured conversion, margin, acquisition cost and guide capacity.',
  'Fractional traveler counts are expected values, not literal reservations.',
  'The downside changes completed travelers only. Fixed costs remain unchanged.',
  'Foreign share is annual, using the approximately 3,264 domestic and 136 foreign base.',
  'The model uses the 44,000 KZT case price. Prototype tour prices are synthetic.',
  'Edit canonical inputs.json and regenerate report outputs to keep all formats aligned.'
];notes.forEach((n,i)=>value(assumptions,`C${i+88}`,n));

const labels={8:'Period',9:'Qualified sessions',10:'Inquiries',11:'Paid parties',12:'Travelers per party',13:'Completion rate',14:'Base demand before capacity',15:'Incremental traveler capacity',16:'Base travelers within capacity',17:'Active demand multiplier',18:'Incremental completed travelers',19:'Incremental foreign travelers',20:'Incremental domestic travelers',23:'Incremental revenue',24:'Tour delivery cost',25:'Payment cost',26:'Variable service cost',27:'Incremental contribution',28:'Contribution per traveler',30:'Fixed project running cost',31:'Marketing',32:'Initial work cash outflow',33:'Contingency cash provision',34:'Incremental project cash flow',35:'Cumulative project cash flow',36:'Funding required',37:'Payback candidate month (999 = none)',38:'Gross cash uses',41:'Legacy seasonal travelers',42:'Total travelers served',43:'All departures needed',44:'Guide days needed',45:'Available guide days',46:'Guide capacity utilization',47:'Unused incremental traveler capacity'};
for(const[r,l]of Object.entries(labels))value(flow,`C${r}`,l);
function col(n){let s='';for(;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
for(let i=0;i<24;i++){
  const c=col(i+4),prev=col(i+3),ar=61+i;
  const f={8:`=Assumptions!C${ar}`,9:`=Assumptions!D${ar}`,10:`=${c}9*Assumptions!$D$17`,11:`=${c}10*Assumptions!$D$18`,12:'=Assumptions!$D$19',13:'=Assumptions!$D$20',14:`=${c}11*${c}12*${c}13`,15:`=Assumptions!E${ar}*Assumptions!$D$28`,16:`=MIN(${c}14,${c}15)`,17:'=Assumptions!$D$7',18:`=${c}16*${c}17`,19:`=${c}18*Assumptions!$D$16`,20:`=${c}18-${c}19`,23:`=${c}18*Assumptions!$D$12`,24:`=${c}23*Assumptions!$D$13`,25:`=${c}23*Assumptions!$D$14`,26:`=${c}18*Assumptions!$D$15`,27:`=${c}23-SUM(${c}24:${c}26)`,28:`=IF(${c}18=0,0,${c}27/${c}18)`,30:`=Assumptions!$F$53*Assumptions!H${ar}`,31:`=Assumptions!I${ar}`,32:`=Assumptions!$F$44*Assumptions!G${ar}`,33:i===2?'=Assumptions!$D$57':'=0',34:`=${c}27-SUM(${c}30:${c}33)`,35:i===0?`=${c}34`:`=${prev}35+${c}34`,36:`=MAX(0,-${c}35)`,37:`=IF(${c}35>=0,${i+1},999)`,38:`=SUM(${c}24:${c}26)+SUM(${c}30:${c}33)`,41:`=Assumptions!$D$24*Assumptions!F${ar}`,42:`=${c}41+${c}18`,43:`=ROUNDUP(${c}42/Assumptions!$D$28,0)`,44:`=${c}43*Assumptions!$D$29`,45:'=Assumptions!$D$30*Assumptions!$D$31',46:`=${c}44/${c}45`,47:`=${c}15-${c}18`};
  for(const[r,form]of Object.entries(f))formula(flow,`${c}${r}`,form);
}
flow.getRange('D8:AA8').setNumberFormat('mmm-yy');header(flow,'C8:AA8');
flow.getRange('D9:AA20').setNumberFormat(count);flow.getRange('D23:AA38').setNumberFormat(money);flow.getRange('D41:AA47').setNumberFormat(count);
for(const r of [13,17,46])flow.getRange(`D${r}:AA${r}`).setNumberFormat('0.0%');
for(const r of [18,23,27,34,35,36,38])total(flow,`C${r}:AA${r}`);
flow.getRange('D35:AA35').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{font:{color:'#A53832'}}});
flow.getRange('D46:AA46').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:1,format:{fill:'#FBE4E1',font:{color:'#A53832',bold:true}}});

summary.getRange('C7:F7').values=[['Metric (KZT unless stated)','Year 1: 2027','Year 2: 2028','Total 24 months']];header(summary,'C7:F7');
const slabel={8:'New completed travelers',9:'Incremental tour revenue',10:'Incremental contribution',11:'Initial work',12:'Fixed running costs',13:'Marketing',14:'Contingency provision',15:'Project fixed cash envelope',16:'Tour delivery and variable costs',17:'Gross cash uses',18:'Net incremental project cash flow',19:'Peak funding balance in period',20:'All foreign travelers (annual)',21:'All domestic travelers (annual)',22:'Foreign traveler share (annual)',23:'Marketing / new completed traveler',24:'Peak guide capacity utilization'};
for(const[r,l]of Object.entries(slabel))value(summary,`C${r}`,l);
for(const [c,start,end] of [['D','D','O'],['E','P','AA'],['F','D','AA']]){
 const map={8:18,9:23,10:27,11:32,12:30,13:31,14:33,17:38,18:34};
 for(const[r,fr]of Object.entries(map))formula(summary,`${c}${r}`,`=SUM('Monthly cash flow'!${start}${fr}:${end}${fr})`);
 formula(summary,`${c}15`,`=SUM(${c}11:${c}14)`);formula(summary,`${c}16`,`=${c}9-${c}10`);formula(summary,`${c}19`,`=MAX('Monthly cash flow'!${start}36:${end}36)`);
 if(c!=='F'){
  formula(summary,`${c}20`,`=Assumptions!$D$23+SUM('Monthly cash flow'!${start}19:${end}19)`);formula(summary,`${c}21`,`=Assumptions!$D$22+SUM('Monthly cash flow'!${start}20:${end}20)`);formula(summary,`${c}22`,`=${c}20/(${c}20+${c}21)`);
 }else for(const r of [20,21,22])value(summary,`${c}${r}`,'n.a.');
 formula(summary,`${c}23`,`=IF(${c}8=0,"n.a.",${c}13/${c}8)`);formula(summary,`${c}24`,`=MAX('Monthly cash flow'!${start}46:${end}46)`);
}
summary.getRange('D8:F24').setNumberFormat(money);summary.getRange('D8:F8').setNumberFormat(count);summary.getRange('D20:E21').setNumberFormat(count);summary.getRange('D22:E22').setNumberFormat('0.0%');summary.getRange('D24:F24').setNumberFormat('0.0%');
value(summary,'C27','Payback month within 24 months');formula(summary,'D27','=IF(MIN(\'Monthly cash flow\'!D37:AA37)=999,"Not reached",MIN(\'Monthly cash flow\'!D37:AA37))');
value(summary,'C28','Headroom against strict Y1 gross ceiling');formula(summary,'D28','=Assumptions!D26-D17');
value(summary,'C29','Case revenue less travelers x stated price');formula(summary,'D29','=Assumptions!D25-Assumptions!D24*Assumptions!D12');
value(summary,'C30','New Y2 travelers required for 30% share');formula(summary,'D30','=(Assumptions!D27*Assumptions!D24-Assumptions!D23)/(Assumptions!D16-Assumptions!D27)');
summary.getRange('D28:D29').setNumberFormat(money);summary.getRange('D30').setNumberFormat(count);
summary.getRange('D8:F30').format.font.color='#1C1F22';
summary.getRange('F20:F22').format.horizontalAlignment='right';
for(const r of [10,15,17,18,22])total(summary,`C${r}:F${r}`);
summary.getRange('D28').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FBE4E1',font:{color:'#A53832',bold:true}}});
value(summary,'C33','AI-assisted planning draft. Inputs and strategy require substantive team review.');
value(summary,'C34','The base case depends on an unvalidated 8.33x traffic rise in Year 2.');
value(summary,'C35','The downside has exactly 30% fewer new travelers and unchanged fixed costs.');
value(summary,'C36','Year-two foreign share uses the second year, including the unchanged legacy base.');
value(summary,'C37','Gross Y1 cash uses include tour delivery, fees, operating costs and contingency.');
value(summary,'C38','No real bookings, secured partnerships, measured conversion uplift or cash savings.');
value(summary,'C39','Workbook is interactive. Regenerate canonical JSON/CSV after changing source inputs.');

await fs.mkdir(path.join(directory,'previews'),{recursive:true});
const checks=[];
function near(actual,expected,label){assert.ok(Math.abs(actual-expected)<0.05,`${label}: ${actual} vs ${expected}`);checks.push(label);}
// Recalculate both live cases and compare against the independent JavaScript cash calculation.
for(const name of ['Base','Downside']){
  value(assumptions,'D4',name);wb.recalculate();const expected=result.summary.scenarios[name.toLowerCase()];
  near(summary.getRange('D8').values[0][0],expected.year1.completed,`${name} Y1 volume`);
  near(summary.getRange('E8').values[0][0],expected.year2.completed,`${name} Y2 volume`);
  near(summary.getRange('F18').values[0][0],expected.ending_cash_flow,`${name} final cash`);
  near(summary.getRange('E22').values[0][0],expected.year2.foreign_share,`${name} annual denominator`);
  near(summary.getRange('D17').values[0][0],expected.year1.gross_cash_uses,`${name} strict budget`);
  assert.equal(summary.getRange('D27').values[0][0],expected.payback_month??'Not reached');
}
value(assumptions,'D4','Base');
const before=flow.getRange('AA18').values[0][0];
value(assumptions,'D84',5000);wb.recalculate();near(flow.getRange('AA18').values[0][0],Math.min(before*2,input.year2_incremental_departures[11]*input.drivers.seats_per_incremental_departure),'Later-period input recalculation and capacity cap');
value(assumptions,'D84',input.year2_qualified_sessions[11]);
value(assumptions,'D4','Base');wb.recalculate();
const errorScan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Final formula error scan'});
await fs.writeFile(path.join(directory,'workbook_verification.json'),JSON.stringify({checks,formula_error_scan:errorScan.ndjson,engine:'Artifact Tool calculation and XLSX export; Microsoft Excel desktop not available for native verification'},null,2));
console.log(errorScan.ndjson);
console.log((await wb.inspect({kind:'table',range:'Summary!C7:F30',include:'values,formulas',tableMaxRows:24,tableMaxCols:4,maxChars:5000})).ndjson);
for(const [sheetName,range,name]of [['Summary','C2:F39','summary'],['Assumptions','C2:G33','assumptions-drivers'],['Assumptions','C36:F57','assumptions-costs'],['Assumptions','C60:I72','assumptions-monthly'],['Monthly cash flow','C8:I20','monthly-funnel'],['Monthly cash flow','C23:I47','monthly-cash']]){
 const preview=await wb.render({sheetName,range,scale:1.5,format:'png'});await fs.writeFile(path.join(directory,'previews',`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
}
const exported=await SpreadsheetFile.exportXlsx(wb);await exported.save(path.join(directory,'Samal_Journeys_Financial_Model.xlsx'));
console.log(`Exported editable workbook. ${checks.length} live formula comparisons passed.`);
