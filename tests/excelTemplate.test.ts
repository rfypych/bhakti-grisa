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
    await wb.xlsx.load(buffer as any);

    expect(wb.worksheets.length).toBe(31);
    const sheetDataWarga = wb.getWorksheet('data warga ');
    expect(sheetDataWarga).toBeDefined();

    const sheetRekapDasawisma = wb.getWorksheet('rekap cat data &keg.warga');
    expect(sheetRekapDasawisma).toBeDefined();

    // Verify master file remained untouched
    const afterStats = fs.statSync(masterPath);
    expect(afterStats.mtimeMs).toBe(initialMtime);
  });

  it('keeps the printed column-number row intact on the data keluarga sheet', async () => {
    const wil = await prisma.wilayah.upsert({
      where: { id: 'test-wilayah-nomor' },
      update: {},
      create: {
        id: 'test-wilayah-nomor',
        dusun: 'Krajan',
        rw: '01',
        rt: '09',
        namaDasawisma: 'Melati Nomor',
      },
    });
    const fam = await prisma.keluarga.create({
      data: {
        noKk: '3201010000000777',
        wilayahId: wil.id,
        namaKepalaRumahTangga: 'Bapak Uji Nomor',
        alamat: 'Jl. Uji Nomor',
        kriteriaRumah: 'SEHAT',
        sumberAir: 'SUMUR',
        statusData: 'VERIFIKASI',
        anggota: {
          create: {
            nik: '3200000000000099',
            nama: 'Bapak Uji Nomor',
            hubunganKeluarga: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Kudus',
            tanggalLahir: new Date('1985-01-01'),
            statusPerkawinan: 'KAWIN',
          },
        },
      },
    });
    try {
      const buffer = await generateOfficialExcelWorkbook({ tahun: 2026, keluargaId: fam.id });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const ws = wb.getWorksheet('data keluarga');
      expect(ws).toBeDefined();
      // Row 23 is the printed column-number row (1-10) and must survive
      for (let c = 1; c <= 10; c++) {
        expect(ws!.getCell(23, c).value).toBe(c);
      }
      // The first member lands on row 24, below the number row
      expect(ws!.getCell(24, 3).value).toBe('Bapak Uji Nomor');
      expect(ws!.getCell(24, 5).value).toBe('Kawin');
      expect(ws!.getCell(24, 6).value).toBe('L');

      // Same guard on the dasawisma recap sheet: three-tier header
      // (rows 11-13), printed number row 14 (1-29), data from row 15
      const wsRekap = wb.getWorksheet('rekap cat data &keg.warga');
      expect(wsRekap).toBeDefined();
      for (let c = 1; c <= 29; c++) {
        expect(wsRekap!.getCell(14, c).value).toBe(c);
      }
      expect(wsRekap!.getCell(15, 2).value).toBe('Bapak Uji Nomor');
    } finally {
      await prisma.keluarga.delete({ where: { id: fam.id } });
    }
  });
});
