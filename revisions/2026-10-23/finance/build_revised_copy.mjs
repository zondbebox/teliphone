import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { Workbook, FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'../../..');
const source=path.join(root,'finance/Samal_Journeys_Financial_Model.xlsx');
const expected=JSON.parse(await fs.readFile(path.join(root,'finance/summary.json'),'utf8'));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const summary=wb.worksheets.getItem('Summary');
const assumptions=wb.worksheets.getItem('Assumptions');
summary.getRange('C2').values=[['Samal Journey financial outlook']];
const checks=[];
for(const name of ['Base','Downside']){
 assumptions.getRange('D4').values=[[name]];
 wb.recalculate();
 const s=expected.scenarios[name.toLowerCase()];
 for(const [cell,value,label] of [['D8',s.year1.completed,'year-one completed travelers'],['E8',s.year2.completed,'year-two completed travelers'],['F18',s.ending_cash_flow,'24-month cash flow'],['E22',s.year2.foreign_share,'year-two foreign share'],['D17',s.year1.gross_cash_uses,'year-one cash uses']]){
  assert.ok(Math.abs(summary.getRange(cell).values[0][0]-value)<0.02,`${name}: ${label}`);
  checks.push(`${name}: ${label}`);
 }
 assert.equal(summary.getRange('D27').values[0][0],s.payback_month??'Not reached');
 checks.push(`${name}: payback`);
}
assumptions.getRange('D4').values=[['Base']];
wb.recalculate();
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Revised copy error scan'});
console.log(errors.ndjson);
await fs.mkdir(path.join(directory,'previews'),{recursive:true});
for(const [sheetName,range,name] of [['Summary','C2:F39','summary'],['Assumptions','C2:G33','assumptions-drivers'],['Assumptions','C36:F57','assumptions-costs'],['Assumptions','C60:I84','assumptions-monthly'],['Assumptions','C87:I100','assumptions-notes'],['Monthly cash flow','C2:I20','monthly-funnel'],['Monthly cash flow','C23:I47','monthly-cash']]){
 const preview=await wb.render({sheetName,range,scale:1.5,format:'png'});
 await fs.writeFile(path.join(directory,'previews',`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(directory,'Samal_Journey_Financial_Model.xlsx'));
await fs.writeFile(path.join(directory,'copy_verification.json'),JSON.stringify({source:'finance/Samal_Journeys_Financial_Model.xlsx',edit:'Summary!C2 only: Samal Journey financial outlook',checks,formula_error_scan:errors.ndjson,limitation:'Artifact Tool import/recalculation/export checked. Native Microsoft Excel desktop behavior was not verified.'},null,2)+'\n');
console.log(`Revised copy exported; ${checks.length} live scenario checks passed.`);
