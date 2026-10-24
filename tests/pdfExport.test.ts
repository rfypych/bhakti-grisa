import { describe, it, expect, beforeEach } from 'vitest';
import { buildCatatanKeluargaWorkbook } from '../src/lib/pdfExport';
import { prisma } from '../src/lib/prisma';

describe('Official Catatan Keluarga workbook (for PDF rendering)', () => {
  let familyId: string;

  beforeEach(async () => {
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();

    const w = await prisma.wilayah.create({
      data: { id: 'wil-pdf-test', dusun: 'Krajan', rw: '01', rt: '01', namaDasawisma: 'Melati PDF' },
    });
    const fam = await prisma.keluarga.create({
      data: {
        noKk: '3374110101207777',
        namaKepalaRumahTangga: 'Bapak PDF Uji',
        alamat: 'RT 01',
        wilayahId: w.id,
        statusData: 'VERIFIKASI',
        kriteriaRumah: 'SEHAT',
        jambanKeluarga: true,
        jumlahJamban: 1,
        sumberAir: 'SUMUR',
        tempatSampah: true,
      },
    });
    familyId = fam.id;
    await prisma.anggotaKeluarga.create({
      data: {
        keluargaId: fam.id,
        nik: '3374111406877777',
        nama: 'Bapak PDF Uji',
        hubunganKeluarga: 'KEPALA_KELUARGA',
        jenisKelamin: 'L',
        tempatLahir: 'Kudus',
        tanggalLahir: new Date('1987-06-14'),
        statusPerkawinan: 'KAWIN',
        pendidikan: 'SMA_SMK_SEDERAJAT',
        pekerjaan: 'SWASTA',
        kegGotongRoyong: true,
      },
    });
    await prisma.anggotaKeluarga.create({
      data: {
        keluargaId: fam.id,
        nik: '3374115503907778',
        nama: 'Ibu PDF Uji',
        hubunganKeluarga: 'ISTRI',
        jenisKelamin: 'P',
        tempatLahir: 'Kudus',
        tanggalLahir: new Date('1990-03-15'),
        statusPerkawinan: 'KAWIN',
        pekerjaan: 'TIDAK_BEKERJA',
      },
    });
  });

  it('contains only the catatan keluarga sheet with the family injected', async () => {
    const wb = await buildCatatanKeluargaWorkbook(familyId, 2026);

    expect(wb.worksheets.length).toBe(1);
    const ws = wb.worksheets[0];
    expect(ws.name).toBe('catatan keluarga');

    // Info block filled from the family record
    expect(String(ws.getCell('D7').value)).toContain('Bapak PDF Uji');
    expect(String(ws.getCell('D8').value)).toContain('Melati PDF');
    expect(String(ws.getCell('D9').value)).toContain('2026');

    // Official vocabulary, not raw enum values: the master sheet's own
    // placeholders read "Layak huni/Tidak layak huni" and "PDAM/Sumur/..."
    expect(String(ws.getCell('N7').value)).toContain('Layak huni');
    expect(String(ws.getCell('N7').value)).not.toContain('SEHAT');
    expect(String(ws.getCell('N9').value)).toContain('Sumur');
    expect(ws.getCell(15, 3).value).toBe('Kawin');
    expect(ws.getCell(15, 7).value).toBe('Islam');
    expect(ws.getCell(15, 8).value).toBe('SMA/SMK Sederajat');
    expect(ws.getCell(15, 9).value).toBe('Swasta');
    expect(ws.getCell(16, 9).value).toBe('Tidak Bekerja');

    // Long labels must shrink to fit the fixed master column widths
    // instead of being clipped when the sheet is printed/rendered
    expect((ws.getCell(15, 8) as any).alignment?.shrinkToFit).toBe(true);
    expect((ws.getCell(15, 2) as any).alignment?.shrinkToFit).toBe(true);

    // Official form structure preserved: header rows and the column-number
    // row 14 (1..19) must NOT be overwritten by member data
    expect(String(ws.getCell('B12').value)).toContain('NAMA');
    expect(ws.getCell(14, 2).value === 2 || ws.getCell(14, 2).value === '2').toBe(true);
    expect(ws.getCell(14, 19).value === 19 || ws.getCell(14, 19).value === '19').toBe(true);

    // Members start at row 15
    expect(ws.getCell(15, 2).value).toBe('Bapak PDF Uji');
    expect(ws.getCell(16, 2).value).toBe('Ibu PDF Uji');
    expect(String(ws.getCell(15, 6).value)).toContain('/'); // date + age
    expect(ws.getCell(15, 12).value).toBe('V'); // Gotong Royong checkmark

    // Print setup for a single A4 landscape page
    expect(ws.pageSetup.orientation).toBe('landscape');
    expect(ws.pageSetup.fitToPage).toBe(true);

    // Merged ranges of the official sheet survive the trim
    expect((ws.model.merges || []).length).toBeGreaterThan(0);
  });
});
