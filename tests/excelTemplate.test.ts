import { describe, it, expect, beforeEach } from 'vitest';
import { generateOfficialExcelWorkbook } from '../src/lib/excelTemplate';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { prisma } from '../src/lib/prisma';

describe('Excel Template Injection Engine', () => {
  const masterPath = 'docs/kolom dasawisma.xlsx';
  let initialMtime: number;

  beforeEach(async () => {
    const stats = fs.statSync(masterPath);
    initialMtime = stats.mtimeMs;

    // Seed sample data if not present
    const existingWilayah = await prisma.wilayah.findFirst();
    if (!existingWilayah) {
      await prisma.wilayah.create({
        data: {
          id: 'test-wilayah-excel',
          dusun: 'Krajan',
          rw: '01',
          rt: '01',
          namaDasawisma: 'Melati 1',
        },
      });
    }
  });

  it('loads docs/kolom dasawisma.xlsx, populates data, and retains 31 sheets', async () => {
    const buffer = await generateOfficialExcelWorkbook({ tahun: 2026, rtId: 'all' });
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);

    expect(wb.worksheets.length).toBe(31);
    const sheetDataWarga = wb.getWorksheet('data warga ');
    expect(sheetDataWarga).toBeDefined();

    const sheetRekapDasawisma = wb.getWorksheet('rekap cat data &keg.warga');
    expect(sheetRekapDasawisma).toBeDefined();

    // Verify master file remained untouched
    const afterStats = fs.statSync(masterPath);
    expect(afterStats.mtimeMs).toBe(initialMtime);
  });
});
