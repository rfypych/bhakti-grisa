import ExcelJS from 'exceljs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generateOfficialExcelWorkbook } from './excelTemplate';

const execFileAsync = promisify(execFile);

export const CATATAN_KELUARGA_SHEET = 'catatan keluarga';

/**
 * Builds a single-sheet workbook containing only the official
 * "catatan keluarga" sheet (Lampiran 4.15) of the master template,
 * injected with one family's data, and sets print setup so the sheet
 * renders on one A4 landscape page.
 */
export async function buildCatatanKeluargaWorkbook(
  keluargaId: string,
  tahun: number
): Promise<ExcelJS.Workbook> {
  const buffer = await generateOfficialExcelWorkbook({ tahun, keluargaId });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any); // Buffer generic differs between @types/node 26 and exceljs typings

  const keep = wb.getWorksheet(CATATAN_KELUARGA_SHEET);
  if (!keep) {
    throw new Error(`Sheet "${CATATAN_KELUARGA_SHEET}" tidak ditemukan di workbook hasil injeksi.`);
  }

  for (const ws of [...wb.worksheets]) {
    if (ws.id !== keep.id) {
      wb.removeWorksheet(ws.id);
    }
  }

  keep.pageSetup = {
    ...keep.pageSetup,
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    printArea: 'A1:S42',
    margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  return wb;
}

/**
 * Renders the official Catatan Keluarga sheet to PDF through LibreOffice
 * headless, so the printed document is the actual master Excel format
 * (not an HTML recreation). Requires `soffice` on the server PATH.
 */
export async function generateCatatanKeluargaPdf(
  keluargaId: string,
  tahun: number
): Promise<Buffer> {
  const wb = await buildCatatanKeluargaWorkbook(keluargaId, tahun);

  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'simpatik-pdf-'));
  try {
    const xlsxPath = path.join(dir, 'catatan-keluarga.xlsx');
    await wb.xlsx.writeFile(xlsxPath);

    await execFileAsync(
      'soffice',
      [
        '--headless',
        '--norestore',
        `-env:UserInstallation=file://${path.join(dir, 'lo-profile')}`,
        '--convert-to',
        'pdf',
        '--outdir',
        dir,
        xlsxPath,
      ],
      { timeout: 90000 }
    );

    const pdfPath = path.join(dir, 'catatan-keluarga.pdf');
    return await fs.promises.readFile(pdfPath);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}
