import ExcelJS from 'exceljs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generateOfficialExcelWorkbook } from './excelTemplate';

const execFileAsync = promisify(execFile);

export const CATATAN_KELUARGA_SHEET = 'catatan keluarga';

export type ExportPdfJenis =
  | 'catatan-keluarga'
  | 'data-warga'
  | 'data-keluarga'
  | 'rekap-dasawisma'
  | 'rekap-desa';

export interface PdfExportConfig {
  sheetName: string;
  lampiranNo: string;
  defaultFilename: string;
  orientation: 'landscape' | 'portrait';
  paperSize?: number; // 9 = A4
  fitToWidth: number;
  fitToHeight: number;
  printArea?: string;
  isFamilySheet: boolean;
}

export const PDF_EXPORT_CONFIGS: Record<ExportPdfJenis, PdfExportConfig> = {
  'catatan-keluarga': {
    sheetName: 'catatan keluarga',
    lampiranNo: 'LAMPIRAN 4.15',
    defaultFilename: 'Catatan-Keluarga-Lampiran-4.15',
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    printArea: 'A1:S42',
    isFamilySheet: true,
  },
  'data-warga': {
    sheetName: 'data warga ',
    lampiranNo: 'LAMPIRAN 4.14.1a',
    defaultFilename: 'Data-Warga-Lampiran-4.14.1a',
    orientation: 'portrait',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    isFamilySheet: true,
  },
  'data-keluarga': {
    sheetName: 'data keluarga',
    lampiranNo: 'LAMPIRAN 4.14.2a',
    defaultFilename: 'Data-Keluarga-Lampiran-4.14.2a',
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    isFamilySheet: true,
  },
  'rekap-dasawisma': {
    sheetName: 'rekap cat data &keg.warga',
    lampiranNo: 'LAMPIRAN 4.16a',
    defaultFilename: 'Rekap-Dasawisma-Lampiran-4.16a',
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    isFamilySheet: false,
  },
  'rekap-desa': {
    sheetName: 'rekap cat data &keg.warga desa',
    lampiranNo: 'LAMPIRAN 4.17a',
    defaultFilename: 'Rekap-Desa-Lampiran-4.17a',
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    isFamilySheet: false,
  },
};

/**
 * Builds a single-sheet workbook trimmed to only the specified sheet type,
 * with print setup configured for A4 fit-to-width.
 */
export async function buildTrimmedWorkbook(
  jenis: ExportPdfJenis,
  options: {
    keluargaId?: string;
    tahun: number;
    wilayahId?: string;
  }
): Promise<{ workbook: ExcelJS.Workbook; config: PdfExportConfig }> {
  const config = PDF_EXPORT_CONFIGS[jenis];
  if (!config) {
    throw new Error(`Jenis PDF "${jenis}" tidak didukung.`);
  }

  const exportOpts: any = { tahun: options.tahun };
  if (options.keluargaId) exportOpts.keluargaId = options.keluargaId;
  if (options.wilayahId) exportOpts.dasawismaId = options.wilayahId;

  const buffer = await generateOfficialExcelWorkbook(exportOpts);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);

  const keep = wb.getWorksheet(config.sheetName);
  if (!keep) {
    throw new Error(`Sheet "${config.sheetName}" tidak ditemukan di workbook hasil injeksi.`);
  }

  for (const ws of [...wb.worksheets]) {
    if (ws.id !== keep.id) {
      wb.removeWorksheet(ws.id);
    }
  }

  keep.pageSetup = {
    ...keep.pageSetup,
    orientation: config.orientation,
    paperSize: config.paperSize ?? 9, // A4
    fitToPage: true,
    fitToWidth: config.fitToWidth,
    fitToHeight: config.fitToHeight,
    ...(config.printArea ? { printArea: config.printArea } : {}),
    margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  return { workbook: wb, config };
}

/**
 * Backward compatibility wrapper for Catatan Keluarga (Lampiran 4.15).
 */
export async function buildCatatanKeluargaWorkbook(
  keluargaId: string,
  tahun: number
): Promise<ExcelJS.Workbook> {
  const { workbook } = await buildTrimmedWorkbook('catatan-keluarga', { keluargaId, tahun });
  return workbook;
}

/**
 * Renders an official master sheet into PDF format via headless LibreOffice.
 */
export async function generateOfficialPdf(
  jenis: ExportPdfJenis,
  options: {
    keluargaId?: string;
    tahun: number;
    wilayahId?: string;
  }
): Promise<{ pdfBuffer: Buffer; filename: string }> {
  const { workbook, config } = await buildTrimmedWorkbook(jenis, options);

  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'simpatik-pdf-'));
  try {
    const safeBase = jenis.replace(/[^a-zA-Z0-9_-]/g, '_');
    const xlsxPath = path.join(dir, `${safeBase}.xlsx`);
    await workbook.xlsx.writeFile(xlsxPath);

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

    const pdfPath = path.join(dir, `${safeBase}.pdf`);
    const pdfBuffer = await fs.promises.readFile(pdfPath);
    const filename = `${config.defaultFilename}-${options.tahun}.pdf`;

    return { pdfBuffer, filename };
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}

/**
 * Backward compatibility wrapper for Catatan Keluarga PDF generation.
 */
export async function generateCatatanKeluargaPdf(
  keluargaId: string,
  tahun: number
): Promise<Buffer> {
  const { pdfBuffer } = await generateOfficialPdf('catatan-keluarga', { keluargaId, tahun });
  return pdfBuffer;
}
