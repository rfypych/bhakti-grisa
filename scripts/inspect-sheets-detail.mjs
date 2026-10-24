import ExcelJS from 'exceljs';
import fs from 'fs';

async function inspectSheets() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('docs/kolom dasawisma.xlsx');

  const sheetsToInspect = [
    'data warga ',
    'data keluarga',
    'hatinya pkk',
    'industri rumah tangga',
    'catatan keluarga',
    'rekap cat data &keg.warga',
    'rekap cat data &keg.warga rt',
    'rekap cat data &keg.warga rw',
    'rekap cat data &keg.warga dsn',
    'rekap cat data &keg.warga desa',
    'rekap bumil',
    'rekap bumil rt',
    'rekap bumil rw',
    'rekap bumil dsn',
    'rekap bumil desakelurahan',
  ];

  const details = {};

  for (const sname of sheetsToInspect) {
    const ws = wb.getWorksheet(sname);
    if (!ws) {
      details[sname] = 'NOT FOUND';
      continue;
    }

    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      const cells = {};
      row.eachCell({ includeEmpty: false }, (cell, c) => {
        cells[cell.address] = String(cell.value).replace(/\s+/g, ' ').trim();
      });
      rows.push({ rowNumber: r, cells });
    });

    details[sname] = {
      name: ws.name,
      rowCount: ws.rowCount,
      columnCount: ws.columnCount,
      merges: ws.model?.merges || [],
      rows,
    };
  }

  fs.writeFileSync('scripts/sheets_detail.json', JSON.stringify(details, null, 2));
  console.log('Saved sheets_detail.json');
}

inspectSheets().catch(console.error);
