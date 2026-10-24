import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraftToStorage, loadDraftFromStorage, clearDraftFromStorage } from '../src/hooks/useFormDraft';
import { saveKeluargaAction } from '../src/actions/keluargaActions';
import { prisma } from '../src/lib/prisma';

describe('useFormDraft Storage Helper', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('saves and restores partial form draft', () => {
    const key = 'simpatik_form_draft_rt01';
    const draft = { noKk: '3319011234560001', namaKepalaRumahTangga: 'Budi Santoso' };
    saveDraftToStorage(key, draft);
    const restored = loadDraftFromStorage(key, {});
    expect(restored).toEqual(draft);
  });

  it('clears draft from storage', () => {
    const key = 'simpatik_form_draft_rt01';
    saveDraftToStorage(key, { noKk: '123' });
    clearDraftFromStorage(key);
    expect(loadDraftFromStorage(key, null)).toBeNull();
  });
});

describe('saveKeluargaAction Server Action', () => {
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
        id: 'wil-action-test',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Melati 1',
      },
    });
    wilayahId = w.id;
  });

  it('saves cadre submission with VERIFIKASI status', async () => {
    const res = await saveKeluargaAction(
      {
        noKk: '3319019999990001',
        namaKepalaRumahTangga: 'Pak Joko',
        alamat: 'RT 01 RW 01',
        wilayahId,
        kriteriaRumah: 'SEHAT',
        jambanKeluarga: true,
        anggota: [
          {
            nik: '3319019999990011',
            nama: 'Pak Joko',
            hubunganKeluarga: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Kudus',
            tanggalLahir: '1980-01-01',
          },
        ],
      },
      false // cadre
    );

    expect(res.success).toBe(true);
    const saved = await prisma.keluarga.findUnique({
      where: { noKk: '3319019999990001' },
      include: { anggota: true },
    });
    expect(saved?.statusData).toBe('VERIFIKASI');
    expect(saved?.anggota.length).toBe(1);
  });

  it('saves public resident submission with DRAFT status', async () => {
    const res = await saveKeluargaAction(
      {
        noKk: '3319019999990002',
        namaKepalaRumahTangga: 'Warga Mandiri',
        alamat: 'RT 01 RW 01',
        wilayahId,
        anggota: [],
      },
      true // public resident
    );

    expect(res.success).toBe(true);
    const saved = await prisma.keluarga.findUnique({
      where: { noKk: '3319019999990002' },
    });
    expect(saved?.statusData).toBe('DRAFT');
  });

  it('automatically assigns virtual NIK for newborn without official NIK', async () => {
    const res = await saveKeluargaAction(
      {
        noKk: '3319019999990003',
        namaKepalaRumahTangga: 'Ayah Bayi',
        alamat: 'RT 01 RW 01',
        wilayahId,
        anggota: [
          {
            nama: 'Bayi Baru',
            isNikSementara: true,
            hubunganKeluarga: 'ANAK',
            jenisKelamin: 'P',
            tempatLahir: 'Kudus',
            tanggalLahir: '2026-10-01',
          },
        ],
      },
      false
    );

    expect(res.success).toBe(true);
    const member = await prisma.anggotaKeluarga.findFirst({
      where: { nama: 'Bayi Baru' },
    });
    expect(member?.nik).toMatch(/^TEMP-20261001-[A-Z0-9]{4}$/);
    expect(member?.isNikSementara).toBe(true);
  });
});
