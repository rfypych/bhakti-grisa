import { describe, it, expect } from 'vitest';
import { formatCatatanKeluargaPrintData } from '../src/components/print/CatatanKeluargaPrint';

describe('Print Data Formatter', () => {
  const sampleFamily = {
    id: 'fam-1',
    noKk: '3319011234560001',
    namaKepalaRumahTangga: 'Budi Santoso',
    alamat: 'RT 01 RW 02 Desa Grisa',
    kriteriaRumah: 'SEHAT',
    jambanKeluarga: true,
    jumlahJamban: 1,
    sumberAir: 'SUMUR',
    tempatSampah: true,
    wilayah: {
      namaDasawisma: 'Melati 1',
      rt: '01',
      rw: '02',
      dusun: 'Krajan',
    },
    anggota: [
      {
        id: 'mem-1',
        nik: '3319011234560001',
        nama: 'Budi Santoso',
        statusPerkawinan: 'KAWIN',
        jenisKelamin: 'L',
        tempatLahir: 'Kudus',
        tanggalLahir: new Date('1985-04-12'),
        agama: 'ISLAM',
        pendidikan: 'SMA_SMK_SEDERAJAT',
        pekerjaan: 'SWASTA',
        disabilitas: false,
        kegPancasila: true,
        kegGotongRoyong: true,
        kegPendidikanKeterampilan: false,
        kegKoperasi: false,
        kegPangan: true,
        kegSandang: false,
        kegKesehatan: true,
        kegPerencanaanSehat: true,
      },
    ],
  };

  it('formats family and member records for Lampiran 4.15 18-column table', () => {
    const formatted = formatCatatanKeluargaPrintData(sampleFamily as any);
    expect(formatted.columns.length).toBe(18);
    expect(formatted.kriteriaRumahLabel).toBeDefined();
    expect(formatted.kriteriaRumahLabel).toBe('Layak Huni');
    expect(formatted.rows.length).toBe(1);
    expect(formatted.rows[0].cells.length).toBe(18);
    expect(formatted.rows[0].cells[0]).toBe('Budi Santoso');
  });

  it('correctly sets kriteriaRumahLabel to Tidak Layak Huni when KURANG_SEHAT', () => {
    const unwellFamily = {
      ...sampleFamily,
      kriteriaRumah: 'KURANG_SEHAT',
    };
    const formatted = formatCatatanKeluargaPrintData(unwellFamily as any);
    expect(formatted.kriteriaRumahLabel).toBe('Tidak Layak Huni');
  });
});
