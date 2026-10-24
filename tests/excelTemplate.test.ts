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

  it('populates recap sheets 15, 17, 19, and 22 with data in their data areas', async () => {
    const wil = await prisma.wilayah.upsert({
      where: { id: 'test-wil-wave-a' },
      update: {},
      create: {
        id: 'test-wil-wave-a',
        dusun: 'Dusun Makmur',
        rw: '05',
        rt: '02',
        namaDasawisma: 'Dahlia 5',
      },
    });

    const fam = await prisma.keluarga.create({
      data: {
        noKk: '3319019999880001',
        wilayahId: wil.id,
        namaKepalaRumahTangga: 'Bapak Hartono',
        alamat: 'Jl. Dahlia No. 5',
        kriteriaRumah: 'SEHAT',
        jambanKeluarga: true,
        sumberAir: 'PDAM',
        statusData: 'VERIFIKASI',
        anggota: {
          create: [
            {
              nik: '3319019999880011',
              nama: 'Bapak Hartono',
              hubunganKeluarga: 'KEPALA_KELUARGA',
              jenisKelamin: 'L',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1980-05-10'),
              statusPerkawinan: 'KAWIN',
            },
            {
              nik: '3319019999880012',
              nama: 'Ibu Ratna',
              hubunganKeluarga: 'ISTRI',
              jenisKelamin: 'P',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1985-07-20'),
              statusPerkawinan: 'KAWIN',
              peristiwaVital: {
                create: {
                  jenisPeristiwa: 'KEHAMILAN',
                  tanggalPeristiwa: new Date('2026-03-01'),
                  keterangan: 'Hamil anak kedua',
                },
              },
            },
          ],
        },
      },
    });

    try {
      const buffer = await generateOfficialExcelWorkbook({ tahun: 2026, dasawismaId: wil.id });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);

      // Sheet 15 (RT recap)
      const ws15 = wb.getWorksheet('rekap cat data &keg.warga rt');
      expect(ws15).toBeDefined();
      expect(ws15!.getCell(15, 2).value).toBeTruthy(); // First Dasawisma name written

      // Sheet 17 (RW recap)
      const ws17 = wb.getWorksheet('rekap cat data &keg.warga rw');
      expect(ws17).toBeDefined();
      expect(ws17!.getCell(15, 2).value).toBeTruthy(); // First RT number written

      // Sheet 19 (Dusun recap)
      const ws19 = wb.getWorksheet('rekap cat data &keg.warga dsn');
      expect(ws19).toBeDefined();
      expect(ws19!.getCell(15, 2).value).toBeTruthy(); // First RW number written

      // Sheet 22 (Dasawisma Bumil recap)
      const ws22 = wb.getWorksheet('rekap bumil');
      expect(ws22).toBeDefined();
      expect(ws22!.getCell(23, 2).value).toBeTruthy(); // Mother name written at row 23
    } finally {
      await prisma.peristiwaVital.deleteMany({
        where: { anggota: { keluargaId: fam.id } },
      });
      await prisma.anggotaKeluarga.deleteMany({
        where: { keluargaId: fam.id },
      });
      await prisma.keluarga.delete({ where: { id: fam.id } });
    }
  });

  it('keeps printed column-number rows intact across all touched recap and bumil sheets (13, 15, 17, 19, 20, 22, 24, 26, 28, 30)', async () => {
    const buffer = await generateOfficialExcelWorkbook({ tahun: 2026, rtId: 'all' });
    const wbExport = new ExcelJS.Workbook();
    await wbExport.xlsx.load(buffer as any);

    const wbMaster = new ExcelJS.Workbook();
    await wbMaster.xlsx.readFile(masterPath);

    const sheetsToCheck = [
      { name: 'rekap cat data &keg.warga', numRow: 14, maxCols: 29 },
      { name: 'rekap cat data &keg.warga rt', numRow: 14, maxCols: 30 },
      { name: 'rekap cat data &keg.warga rw', numRow: 14, maxCols: 32 },
      { name: 'rekap cat data &keg.warga dsn', numRow: 14, maxCols: 33 },
      { name: 'rekap cat data &keg.warga desa', numRow: 14, maxCols: 33 },
      { name: 'rekap bumil', numRow: 22, maxCols: 17 },
      { name: 'rekap bumil rt', numRow: 22, maxCols: 15 },
      { name: 'rekap bumil rw', numRow: 14, maxCols: 16 },
      { name: 'rekap bumil dsn', numRow: 14, maxCols: 17 },
      { name: 'rekap bumil desakelurahan', numRow: 19, maxCols: 18 },
    ];

    for (const s of sheetsToCheck) {
      const wsExport = wbExport.getWorksheet(s.name);
      const wsMaster = wbMaster.getWorksheet(s.name);
      expect(wsExport, `Sheet ${s.name} missing in export`).toBeDefined();
      expect(wsMaster, `Sheet ${s.name} missing in master`).toBeDefined();

      for (let c = 1; c <= s.maxCols; c++) {
        const masterVal = wsMaster!.getCell(s.numRow, c).value;
        const exportVal = wsExport!.getCell(s.numRow, c).value;
        expect(
          exportVal,
          `Sheet ${s.name} Col ${c} at row ${s.numRow} was overwritten!`
        ).toEqual(masterVal);
      }
    }

    // Specific assertions for Sheet 20 (rekap cat data &keg.warga desa)
    const ws20Export = wbExport.getWorksheet('rekap cat data &keg.warga desa');
    expect(ws20Export).toBeDefined();
    // Row 14 is column number row (col 2 must be 2, not a dusun name)
    expect(ws20Export!.getCell(14, 1).value).toBe(1);
    expect(ws20Export!.getCell(14, 2).value).toBe(2);
    // Row 15 is first data row
    expect(ws20Export!.getCell(15, 2).value).toBeTruthy();

    // Specific assertion for Sheet 22 (rekap bumil) cell D39 (Row 39 Col 4)
    const ws22Export = wbExport.getWorksheet('rekap bumil');
    const ws22Master = wbMaster.getWorksheet('rekap bumil');
    expect(ws22Export).toBeDefined();
    expect(ws22Export!.getCell(39, 4).value).toBe(ws22Master!.getCell(39, 4).value);
    expect(ws22Export!.getCell(39, 4).value).toBe('Orang');
  });

  it('sheet bumil tingkat desa (30) memuat ibu hamil dari fixture test', async () => {
    const wil = await prisma.wilayah.upsert({
      where: { id: 'test-wil-bumil-desa' },
      update: {},
      create: {
        id: 'test-wil-bumil-desa',
        dusun: 'Dusun Mawar Indah',
        rw: '07',
        rt: '03',
        namaDasawisma: 'Mawar 3',
      },
    });

    const fam = await prisma.keluarga.create({
      data: {
        noKk: '3319018888770001',
        wilayahId: wil.id,
        namaKepalaRumahTangga: 'Bapak Suryono',
        alamat: 'Jl. Mawar Indah No. 3',
        statusData: 'VERIFIKASI',
        anggota: {
          create: [
            {
              nik: '3319018888770011',
              nama: 'Bapak Suryono',
              hubunganKeluarga: 'KEPALA_KELUARGA',
              jenisKelamin: 'L',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1982-01-01'),
              statusPerkawinan: 'KAWIN',
            },
            {
              nik: '3319018888770012',
              nama: 'Ibu Lestari',
              hubunganKeluarga: 'ISTRI',
              jenisKelamin: 'P',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1987-04-15'),
              statusPerkawinan: 'KAWIN',
              peristiwaVital: {
                create: {
                  jenisPeristiwa: 'KEHAMILAN',
                  tanggalPeristiwa: new Date('2026-02-10'),
                  keterangan: 'Pemeriksaan trimester 1',
                },
              },
            },
          ],
        },
      },
    });

    try {
      const buffer = await generateOfficialExcelWorkbook({ tahun: 2026, rtId: 'all' });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);

      const ws30 = wb.getWorksheet('rekap bumil desakelurahan');
      expect(ws30).toBeDefined();

      // Check that at least one dusun row has JUMLAH IBU HAMIL (Col 6) >= 1
      let foundPregnantCount = false;
      for (let r = 20; r <= 26; r++) {
        const val = Number(ws30!.getCell(r, 6).value || 0);
        if (val >= 1) {
          foundPregnantCount = true;
          break;
        }
      }
      expect(foundPregnantCount, 'Expected at least 1 pregnant mother in sheet 30 rows 20-26').toBe(true);

      // Check sum row at Row 27 Col 6
      const totalBumilDesa = Number(ws30!.getCell(27, 6).value || 0);
      expect(totalBumilDesa).toBeGreaterThanOrEqual(1);
    } finally {
      await prisma.peristiwaVital.deleteMany({
        where: { anggota: { keluargaId: fam.id } },
      });
      await prisma.anggotaKeluarga.deleteMany({
        where: { keluargaId: fam.id },
      });
      await prisma.keluarga.delete({ where: { id: fam.id } });
    }
  });
});
