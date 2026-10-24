import { describe, it, expect, beforeEach } from 'vitest';
import { laporKelahiranAction, laporKematianAction } from '../src/actions/peristiwaActions';
import { prisma } from '../src/lib/prisma';

describe('Event Log Actions', () => {
  let testKeluargaId: string;
  let motherId: string;

  beforeEach(async () => {
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();

    const w = await prisma.wilayah.create({
      data: {
        id: 'wil-event-test',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Melati 1',
      },
    });

    const fam = await prisma.keluarga.create({
      data: {
        id: 'fam-event-test',
        noKk: '3319017777770001',
        namaKepalaRumahTangga: 'Bapak Ahmad',
        alamat: 'RT 01',
        wilayahId: w.id,
      },
    });
    testKeluargaId = fam.id;

    const mother = await prisma.anggotaKeluarga.create({
      data: {
        id: 'mother-id-1',
        nik: '3319018888880001',
        nama: 'Ibu Siti',
        hubunganKeluarga: 'ISTRI',
        jenisKelamin: 'P',
        tempatLahir: 'Kudus',
        tanggalLahir: new Date('1995-05-15'),
        keluargaId: testKeluargaId,
      },
    });
    motherId = mother.id;
  });

  it('creates newborn record and logs vital event in Lampiran 4.18', async () => {
    const result = await laporKelahiranAction({
      ibuId: motherId,
      namaBayi: 'Bayi Sehat',
      tanggalLahir: new Date('2026-10-22'),
      jenisKelamin: 'L',
      akteKelahiran: false,
    });

    expect(result.success).toBe(true);
    expect(result.childId).toBeDefined();

    // Verify newborn member created in the same family
    const child = await prisma.anggotaKeluarga.findUnique({
      where: { id: result.childId },
    });
    expect(child).toBeDefined();
    expect(child?.nama).toBe('Bayi Sehat');
    expect(child?.keluargaId).toBe(testKeluargaId);
    expect(child?.isNikSementara).toBe(true);
    expect(child?.nik).toMatch(/^TEMP-20261022-[A-Z0-9]{4}$/);

    // Verify vital event logged
    const event = await prisma.peristiwaVital.findFirst({
      where: { namaBayi: 'Bayi Sehat' },
    });
    expect(event).toBeDefined();
    expect(event?.jenisPeristiwa).toBe('KELAHIRAN_BAYI');
  });

  it('logs mortality event and archives deceased member', async () => {
    const result = await laporKematianAction({
      anggotaId: motherId,
      namaAlmarhum: 'Ibu Siti',
      tanggalKematian: new Date('2026-10-23'),
      sebabKematian: 'Komplikasi persalinan',
      statusAlmarhum: 'IBU_HAMIL_MELAHIRKAN_NIFAS',
    });

    expect(result.success).toBe(true);

    const event = await prisma.peristiwaVital.findFirst({
      where: { namaAlmarhum: 'Ibu Siti' },
    });
    expect(event).toBeDefined();
    expect(event?.jenisPeristiwa).toBe('KEMATIAN_IBU');

    // The deceased member is archived out of the living population.
    const member = await prisma.anggotaKeluarga.findUnique({
      where: { id: motherId },
    });
    expect(member?.statusKehidupan).toBe('MENINGGAL');
  });
});
