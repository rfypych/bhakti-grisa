import ExcelJS from 'exceljs';
import fs from 'fs';

async function detailedAnalysis() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('docs/kolom dasawisma.xlsx');

  const refLines = fs.readFileSync('/home/hatch/workspace/agy-prompts/simpatik-excel-inventory.md', 'utf8').split('\n');
  
  // Parse supervisor reference headers
  // e.g. ## 1. "data warga " — dimensi 36 baris x 5 kolom, sel terisi 91, merge 1, formula 0
  const refMap = new Map();
  const headerRegex = /^##\s+(\d+)\.\s+"([^"]+)"\s+—\s+dimensi\s+(\d+)\s+baris\s+x\s+(\d+)\s+kolom,\s+sel\s+terisi\s+(\d+),\s+merge\s+(\d+),\s+formula\s+(\d+)/;
  
  for (const line of refLines) {
    const match = line.match(headerRegex);
    if (match) {
      refMap.set(parseInt(match[1]), {
        idx: parseInt(match[1]),
        name: match[2],
        rows: parseInt(match[3]),
        cols: parseInt(match[4]),
        filled: parseInt(match[5]),
        merges: parseInt(match[6]),
        formulas: parseInt(match[7]),
      });
    }
  }

  const comparison = [];

  wb.worksheets.forEach((ws, i) => {
    const idx = i + 1;
    let filled = 0;
    let formulas = 0;
    let maxR = 0;
    let maxC = 0;

    ws.eachRow({ includeEmpty: false }, (row, r) => {
      if (r > maxR) maxR = r;
      row.eachCell({ includeEmpty: false }, (cell, c) => {
        filled++;
        if (c > maxC) maxC = c;
        if (cell.formula) formulas++;
      });
    });

    const mergeCount = (ws.model?.merges || []).length;
    const ref = refMap.get(idx);

    const diffs = [];
    if (!ref) {
      diffs.push(`Sheet ${idx} not found in reference!`);
    } else {
      if (ws.name !== ref.name) diffs.push(`Name diff: ours="${ws.name}" vs ref="${ref.name}"`);
      if (ws.rowCount !== ref.rows && maxR !== ref.rows) diffs.push(`Row diff: ws.rowCount=${ws.rowCount}, maxRow=${maxR} vs ref=${ref.rows}`);
      if (ws.columnCount !== ref.cols && maxC !== ref.cols) diffs.push(`Col diff: ws.columnCount=${ws.columnCount}, maxCol=${maxC} vs ref=${ref.cols}`);
      if (filled !== ref.filled) diffs.push(`Filled diff: ours=${filled} vs ref=${ref.filled}`);
      if (mergeCount !== ref.merges) diffs.push(`Merge diff: ours=${mergeCount} vs ref=${ref.merges}`);
      if (formulas !== ref.formulas) diffs.push(`Formula diff: ours=${formulas} vs ref=${ref.formulas}`);
    }

    // Examine headers and structure
    const headers = [];
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      if (r <= 16) {
        const cells = [];
        row.eachCell({ includeEmpty: false }, (cell, c) => {
          cells.push(`${cell.address}:${String(cell.value).replace(/\s+/g, ' ').trim()}`);
        });
        headers.push({ row: r, text: cells.slice(0, 10).join(' | ') });
      }
    });

    comparison.push({
      idx,
      name: ws.name,
      ourStats: {
        rowCount: ws.rowCount,
        maxR,
        columnCount: ws.columnCount,
        maxC,
        filled,
        merges: mergeCount,
        formulas,
      },
      refStats: ref,
      diffs,
      merges: ws.model?.merges || [],
      headers,
    });
  });

  fs.writeFileSync('scripts/reconciliation_comparison.json', JSON.stringify(comparison, null, 2));
  console.log('Comparison complete.');
}

detailedAnalysis().catch(console.error);
