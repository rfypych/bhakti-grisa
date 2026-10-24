import ExcelJS from 'exceljs';
import fs from 'fs';

async function inspect() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('docs/kolom dasawisma.xlsx');

  console.log(`Total sheets: ${wb.worksheets.length}`);

  const results = [];

  wb.worksheets.forEach((ws, idx) => {
    let filledCells = 0;
    let formulas = 0;
    let maxRow = 0;
    let maxCol = 0;

    const rowSamples = [];

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > maxRow) maxRow = rowNumber;
      const rowValues = [];
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        filledCells++;
        if (colNumber > maxCol) maxCol = colNumber;
        if (cell.formula) formulas++;
        const valStr = cell.value ? String(cell.value).replace(/\s+/g, ' ').trim() : '';
        if (valStr) {
          rowValues.push(`${cell.address}=${valStr.substring(0, 40)}`);
        }
      });
      if (rowNumber <= 15 || rowNumber === maxRow) {
        rowSamples.push({ rowNumber, text: rowValues.join(' ; ') });
      }
    });

    const merges = ws.model?.merges || [];

    // Guess header rows and data start row
    // Look for row with column numbers (1, 2, 3...) or table labels
    let colNumberRow = null;
    let dataStartRow = null;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      let nums = 0;
      let cellCount = 0;
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        cellCount++;
        const val = String(cell.value).trim();
        if (/^\d+$/.test(val)) nums++;
      });
      if (nums >= 3 && nums >= cellCount * 0.5 && !colNumberRow) {
        colNumberRow = rowNumber;
        dataStartRow = rowNumber + 1;
      }
    });

    results.push({
      index: idx + 1,
      name: ws.name,
      rowCount: ws.rowCount,
      actualMaxRow: maxRow,
      columnCount: ws.columnCount,
      actualMaxCol: maxCol,
      filledCells,
      mergeCount: merges.length,
      sampleMerges: merges.slice(0, 5),
      formulaCount: formulas,
      colNumberRow,
      dataStartRow,
      rowSamples,
    });
  });

  fs.writeFileSync('scripts/inspection_result.json', JSON.stringify(results, null, 2));
  console.log('Inspection complete. Saved to scripts/inspection_result.json');
}

inspect().catch(console.error);
