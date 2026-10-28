'use server';

import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface WilayahInput {
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
  ketuaNama?: string;
  ketuaDasawisma?: string;
  kontak?: string;
  targetKK?: number;
}

/**
 * Retrieves all wilayah entities with associated family count.
 */
export async function getWilayahListWithCounts() {
  return prisma.wilayah.findMany({
    orderBy: [
      { dusun: 'asc' },
      { rw: 'asc' },
      { rt: 'asc' },
      { namaDasawisma: 'asc' },
    ],
    include: {
      _count: {
        select: { keluarga: true },
      },
    },
  });
}

/**
 * Creates a new wilayah entity after verifying unique constraint.
 */
export async function createWilayahAction(data: WilayahInput) {
  const user = await getSessionUser();
  if (user && user.peran !== 'ADMIN_DESA') {
    return { success: false, error: 'Akses ditolak: Hanya Admin Desa yang dapat menambahkan wilayah.' };
  }

  const dusun = data.dusun.trim();
  const rw = data.rw.trim();
  const rt = data.rt.trim();
  const namaDasawisma = data.namaDasawisma.trim();

  if (!dusun || !rw || !rt || !namaDasawisma) {
    return { success: false, error: 'Dusun, RW, RT, dan Nama Dasawisma wajib diisi.' };
  }

  const existing = await prisma.wilayah.findFirst({
    where: { dusun, rw, rt, namaDasawisma },
  });

  if (existing) {
    return {
      success: false,
      error: `Wilayah dengan Dusun "${dusun}", RW "${rw}", RT "${rt}", dan Dasawisma "${namaDasawisma}" sudah terdaftar.`,
    };
  }

  const ketuaNama = data.ketuaNama?.trim() || data.ketuaDasawisma?.trim() || null;

  const wilayah = await prisma.wilayah.create({
    data: {
      dusun,
      rw,
      rt,
      namaDasawisma,
      ketuaNama,
      kontak: data.kontak?.trim() || null,
    },
  });

  try {
    revalidatePath('/dashboard/wilayah');
    revalidatePath('/dashboard');
    revalidatePath('/formulir');
  } catch {
    // ignore
  }

  return { success: true, wilayah };
}

/**
 * Updates an existing wilayah entity after verifying unique constraint.
 */
export async function updateWilayahAction(id: string, data: WilayahInput) {
  const user = await getSessionUser();
  if (user && user.peran !== 'ADMIN_DESA') {
    return { success: false, error: 'Akses ditolak: Hanya Admin Desa yang dapat mengubah data wilayah.' };
  }

  const dusun = data.dusun.trim();
  const rw = data.rw.trim();
  const rt = data.rt.trim();
  const namaDasawisma = data.namaDasawisma.trim();

  if (!dusun || !rw || !rt || !namaDasawisma) {
    return { success: false, error: 'Dusun, RW, RT, dan Nama Dasawisma wajib diisi.' };
  }

  const existing = await prisma.wilayah.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'Data wilayah tidak ditemukan.' };
  }

  // Check unique collision with another record
  const collision = await prisma.wilayah.findFirst({
    where: {
      dusun,
      rw,
      rt,
      namaDasawisma,
      NOT: { id },
    },
  });

  if (collision) {
    return {
      success: false,
      error: `Wilayah dengan Dusun "${dusun}", RW "${rw}", RT "${rt}", dan Dasawisma "${namaDasawisma}" sudah terdaftar pada data lain.`,
    };
  }

  const ketuaNama = data.ketuaNama?.trim() || data.ketuaDasawisma?.trim() || null;

  const wilayah = await prisma.wilayah.update({
    where: { id },
    data: {
      dusun,
      rw,
      rt,
      namaDasawisma,
      ketuaNama,
      kontak: data.kontak?.trim() || null,
    },
  });

  try {
    revalidatePath('/dashboard/wilayah');
    revalidatePath('/dashboard');
    revalidatePath('/formulir');
  } catch {
    // ignore
  }

  return { success: true, wilayah };
}

/**
 * Deletes a wilayah entity strictly if no families are linked to it.
 */
export async function deleteWilayahAction(id: string) {
  const user = await getSessionUser();
  if (user && user.peran !== 'ADMIN_DESA') {
    return { success: false, error: 'Akses ditolak: Hanya Admin Desa yang dapat menghapus wilayah.' };
  }

  const existing = await prisma.wilayah.findUnique({
    where: { id },
    include: {
      _count: {
        select: { keluarga: true },
      },
    },
  });

  if (!existing) {
    return { success: false, error: 'Data wilayah tidak ditemukan.' };
  }

  if (existing._count.keluarga > 0) {
    return {
      success: false,
      error: `Wilayah ini tidak dapat dihapus karena masih menampung ${existing._count.keluarga} data keluarga. Pindahkan atau hapus keluarga terkait terlebih dahulu.`,
    };
  }

  await prisma.wilayah.delete({ where: { id } });

  try {
    revalidatePath('/dashboard/wilayah');
    revalidatePath('/dashboard');
    revalidatePath('/formulir');
  } catch {
    // ignore
  }

  return { success: true };
}

export const tambahWilayahAction = createWilayahAction;
export const hapusWilayahAction = deleteWilayahAction;
