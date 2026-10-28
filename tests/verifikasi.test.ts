import { describe, it, expect, beforeEach } from 'vitest';
import { approveSubmissionAction, rejectSubmissionAction, getPendingSubmissions } from '../src/actions/verifikasiActions';
import { prisma } from '../src/lib/prisma';

describe('Verification Flow', () => {
  let wilayahId: string;

  beforeEach(async () => {
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();

    const w = await prisma.wilayah.create({
      data: {
        id: 'test-wilayah-verif',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Melati 1',
      },
    });
    wilayahId = w.id;
  });

  it('approves a draft submission transitioning status to VERIFIKASI', async () => {
    const draft = await prisma.keluarga.create({
      data: {
        noKk: '9999000011112222',
        namaKepalaRumahTangga: 'Draft Family',
        alamat: 'RT 01',
        wilayahId,
        statusData: 'DRAFT',
      },
    });

    await prisma.anggotaKeluarga.create({
      data: {
        keluargaId: draft.id,
        nik: '999900001111222201',
        nama: 'Draft Family Head',
        hubunganKeluarga: 'KEPALA_KELUARGA',
        jenisKelamin: 'L',
        tempatLahir: 'Ngawi',
        tanggalLahir: new Date('1985-01-01'),
      },
    });

    const result = await approveSubmissionAction(draft.id);
    expect(result.success).toBe(true);

    const updated = await prisma.keluarga.findUnique({ where: { id: draft.id } });
    expect(updated?.statusData).toBe('VERIFIKASI');
  });

  it('rejects a draft submission transitioning status to ARSIP with reason', async () => {
    const draft = await prisma.keluarga.create({
      data: {
        noKk: '9999000011113333',
        namaKepalaRumahTangga: 'Draft Family 2',
        alamat: 'RT 01',
        wilayahId,
        statusData: 'DRAFT',
      },
    });

    const reason = 'Data Nomor KK tidak sesuai dengan arsip RT';
    const result = await rejectSubmissionAction(draft.id, reason);
    expect(result.success).toBe(true);

    const updated = await prisma.keluarga.findUnique({ where: { id: draft.id } });
    expect(updated?.statusData).toBe('ARSIP');
    expect(updated?.catatanVerifikasi).toBe(reason);
  });

  it('retrieves only pending DRAFT submissions', async () => {
    await prisma.keluarga.create({
      data: {
        noKk: '1111222233334444',
        namaKepalaRumahTangga: 'Draft User',
        alamat: 'RT 01',
        wilayahId,
        statusData: 'DRAFT',
      },
    });
    await prisma.keluarga.create({
      data: {
        noKk: '5555666677778888',
        namaKepalaRumahTangga: 'Verified User',
        alamat: 'RT 01',
        wilayahId,
        statusData: 'VERIFIKASI',
      },
    });

    const pending = await getPendingSubmissions(wilayahId);
    expect(pending.length).toBe(1);
    expect(pending[0].namaKepalaRumahTangga).toBe('Draft User');
  });
});
