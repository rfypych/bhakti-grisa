import { describe, it, expect, beforeEach } from 'vitest';
import { getAggregationDasawisma, getAggregationRT, getAggregationDesa } from '../src/lib/aggregation';
import { prisma } from '../src/lib/prisma';

describe('Multi-Level Aggregation Engine', () => {
  let testWilayahId: string;
  let testWilayahId2: string;

  beforeEach(async () => {
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();

    const w1 = await prisma.wilayah.create({
      data: {
        id: 'test-dasawisma-1',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Melati 1',
      },
    });
    testWilayahId = w1.id;

    const w2 = await prisma.wilayah.create({
      data: {
        id: 'test-dasawisma-2',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Melati 2',
      },
    });
    testWilayahId2 = w2.id;

    // Family 1 in Dasawisma 1: 3 members (Father, Mother, Toddler boy)
    await prisma.keluarga.create({
      data: {
        id: 'fam-1',
        noKk: '3319010000000001',
        namaKepalaRumahTangga: 'Budi Santoso',
        alamat: 'Jl. Mawar No. 1',
        wilayahId: testWilayahId,
        kriteriaRumah: 'SEHAT',
        jambanKeluarga: true,
        jumlahJamban: 1,
        sumberAir: 'PDAM',
        tempatSampah: true,
        spal: true,
        stikerP4k: true,
        makananPokok: 'BERAS',
        aktivitasUp2k: true,
        statusData: 'VERIFIKASI',
        anggota: {
          create: [
            {
              nik: '3319010000000011',
              nama: 'Budi Santoso',
              hubunganKeluarga: 'KEPALA_KELUARGA',
              jenisKelamin: 'L',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1985-06-15'),
              statusPerkawinan: 'KAWIN',
            },
            {
              nik: '3319010000000012',
              nama: 'Siti Aminah',
              hubunganKeluarga: 'ISTRI',
              jenisKelamin: 'P',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1988-08-20'),
              statusPerkawinan: 'KAWIN',
            },
            {
              nik: '3319010000000013',
              nama: 'Andi Santoso',
              hubunganKeluarga: 'ANAK',
              jenisKelamin: 'L',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('2023-01-10'), // Balita L
              statusPerkawinan: 'BELUM_KAWIN',
            },
          ],
        },
      },
    });

    // Family 2 in Dasawisma 1: 2 members (Lansia grandfather, toddler girl)
    await prisma.keluarga.create({
      data: {
        id: 'fam-2',
        noKk: '3319010000000002',
        namaKepalaRumahTangga: 'Slamet',
        alamat: 'Jl. Mawar No. 2',
        wilayahId: testWilayahId,
        kriteriaRumah: 'KURANG_SEHAT',
        jambanKeluarga: true,
        jumlahJamban: 1,
        sumberAir: 'SUMUR',
        makananPokok: 'BERAS',
        statusData: 'VERIFIKASI',
        anggota: {
          create: [
            {
              nik: '3319010000000021',
              nama: 'Slamet',
              hubunganKeluarga: 'KEPALA_KELUARGA',
              jenisKelamin: 'L',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('1955-03-10'), // Lansia (71 yo in 2026)
              statusPerkawinan: 'DUDA',
            },
            {
              nik: '3319010000000022',
              nama: 'Rina',
              hubunganKeluarga: 'CUCU',
              jenisKelamin: 'P',
              tempatLahir: 'Kudus',
              tanggalLahir: new Date('2024-04-05'), // Balita P
              statusPerkawinan: 'BELUM_KAWIN',
            },
          ],
        },
      },
    });
  });

  it('accurately counts Balita, Lansia, Rumah Sehat, and Jamban for a Dasawisma', async () => {
    const result = await getAggregationDasawisma('test-dasawisma-1', { tahun: 2026 });
    expect(result).toHaveProperty('totalKeluarga');
    expect(result.totalKeluarga).toBe(2);
    expect(result.totalLakiLaki).toBe(3); // Budi, Andi, Slamet
    expect(result.totalPerempuan).toBe(2); // Siti, Rina
    expect(result.totalBalitaL).toBe(1); // Andi
    expect(result.totalBalitaP).toBe(1); // Rina
    expect(result.totalLansia).toBe(1); // Slamet
    expect(result.totalRumahSehat).toBe(1);
    expect(result.totalJamban).toBe(2);
    expect(result.totalPus).toBe(1); // Siti
    expect(result.totalWus).toBe(1); // Siti
  });

  it('accurately aggregates data at RT level', async () => {
    const result = await getAggregationRT('01', { tahun: 2026 });
    expect(result.totalKeluarga).toBe(2);
    expect(result.totalBalita).toBe(2);
  });

  it('accurately aggregates data at Desa level', async () => {
    const result = await getAggregationDesa({ tahun: 2026 });
    expect(result.totalKeluarga).toBe(2);
    expect(result.totalAnggota).toBe(5);
  });
});
