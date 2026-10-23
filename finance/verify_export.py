"""Read-only checks of the exported XLSX package, using the Python standard library."""
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile
import json

root = Path(__file__).resolve().parent
ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(root / 'QazaqPass_Financial_Model.xlsx') as z:
    sheets = [ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')) for i in range(1, 4)]
    cell = lambda sheet, ref: sheet.find(f".//x:c[@r='{ref}']", ns)
    summary, assumptions, monthly = sheets
    for address in ['D8', 'E8', 'F18', 'E22', 'D27']:
        assert cell(summary, address).find('x:f', ns) is not None, address
    assert abs(float(cell(summary, 'F18').find('x:v', ns).text) - 261200) < 0.02
    assert abs(float(cell(summary, 'E22').find('x:v', ns).text) - 1486 / 4900) < 1e-10
    assert int(cell(summary, 'D27').find('x:v', ns).text) == 23
    assert assumptions.find('.//x:dataValidation', ns) is not None
    assert monthly.find('.//x:pane', ns) is not None
    assert all(c.attrib.get('t') != 'e' for s in sheets for c in s.findall('.//x:c', ns))
    assert 'Assumptions!$D$7' in cell(monthly, 'AA17').find('x:f', ns).text
    print('PASS: saved XLSX contains live summary formulas, expected cached results, a case selector, frozen monthly panes, and no exported error cells.')
