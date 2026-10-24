import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWilayahAction,
  updateWilayahAction,
  deleteWilayahAction,
  getWilayahListWithCounts,
} from '../src/actions/wilayahActions';
import { prisma } from '../src/lib/prisma';

describe('Wilayah Management Server Actions', () => {
  beforeEach(async () => {
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();
  });

  it('creates, updates, and deletes an empty wilayah successfully', async () => {
    // 1. Create
    const createRes = await createWilayahAction({
      dusun: 'Dusun Melati',
      rw: '02',
      rt: '04',
      namaDasawisma: 'Dahlia 4',
      ketuaNama: 'Ibu Siti',
      kontak: '08123456789',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.wilayah).toBeDefined();
    const createdId = createRes.wilayah!.id;

    // 2. Read list
    const list = await getWilayahListWithCounts();
    expect(list.length).toBe(1);
    expect(list[0].namaDasawisma).toBe('Dahlia 4');
    expect(list[0]._count.keluarga).toBe(0);

    // 3. Update
    const updateRes = await updateWilayahAction(createdId, {
      dusun: 'Dusun Melati',
      rw: '02',
      rt: '04',
      namaDasawisma: 'Dahlia 4 Baru',
      ketuaNama: 'Ibu Siti Aminah',
      kontak: '08123456780',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.wilayah?.namaDasawisma).toBe('Dahlia 4 Baru');

    // 4. Delete empty wilayah
    const deleteRes = await deleteWilayahAction(createdId);
    expect(deleteRes.success).toBe(true);

    const check = await prisma.wilayah.findUnique({ where: { id: createdId } });
    expect(check).toBeNull();
  });

  it('rejects deletion of a wilayah that has families linked to it', async () => {
    const createRes = await createWilayahAction({
      dusun: 'Dusun Krajan',
      rw: '01',
      rt: '01',
      namaDasawisma: 'Mawar 1',
    });

    expect(createRes.success).toBe(true);
    const wilayahId = createRes.wilayah!.id;

    // Attach a family
    await prisma.keluarga.create({
      data: {
        noKk: '3319010000000001',
        namaKepalaRumahTangga: 'Bapak Ahmad',
        alamat: 'Jl. Krajan 1',
        wilayahId,
        statusData: 'VERIFIKASI',
      },
    });

    // Attempt delete
    const deleteRes = await deleteWilayahAction(wilayahId);
    expect(deleteRes.success).toBe(false);
    expect(deleteRes.error).toContain('keluarga');

    // Verify wilayah is still in DB
    const check = await prisma.wilayah.findUnique({ where: { id: wilayahId } });
    expect(check).not.toBeNull();
  });
});
