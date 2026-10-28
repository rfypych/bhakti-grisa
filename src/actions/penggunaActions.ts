'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, getSessionUser } from '@/lib/auth';
import { PeranPengguna } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface CreatePenggunaInput {
  nama: string;
  username: string;
  kataSandi?: string;
  passwordPlain?: string;
  peran?: PeranPengguna;
  role?: PeranPengguna;
  wilayahId?: string | null;
  scopeDusun?: string | null;
  scopeRw?: string | null;
  scopeRt?: string | null;
}

/**
 * Fetches all registered accounts (accessible by ADMIN_DESA).
 */
export async function getPenggunaList() {
  const user = await getSessionUser();
  if (user && user.peran !== 'ADMIN_DESA') {
    throw new Error('Akses ditolak: Hanya Admin Desa yang dapat melihat daftar pengguna.');
  }

  return prisma.pengguna.findMany({
    include: { wilayah: true },
    orderBy: [{ peran: 'asc' }, { nama: 'asc' }],
  });
}

/**
 * Creates a new user account with role assignment and anchor wilayah.
 */
export async function createPenggunaAction(data: CreatePenggunaInput) {
  const currentUser = await getSessionUser();
  if (currentUser && currentUser.peran !== 'ADMIN_DESA') {
    return { success: false, error: 'Akses ditolak: Hanya Admin Desa yang dapat membuat akun pengguna.' };
  }

  const nama = data.nama?.trim();
  const username = data.username?.trim().toLowerCase();
  const kataSandi = (data.kataSandi || data.passwordPlain || '').trim();
  const peran = data.peran || data.role;
  const wilayahId = peran === 'ADMIN_DESA' ? null : (data.wilayahId || null);

  if (!nama || !username || !kataSandi || !peran) {
    return { success: false, error: 'Nama, username, kata sandi, dan peran wajib diisi.' };
  }

  if (kataSandi.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter.' };
  }

  const existing = await prisma.pengguna.findUnique({
    where: { username },
  });

  if (existing) {
    return { success: false, error: `Nama pengguna "${username}" sudah digunakan oleh akun lain.` };
  }

  const hash = await hashPassword(kataSandi);

  const newUser = await prisma.pengguna.create({
    data: {
      nama,
      username,
      kataSandiHash: hash,
      peran,
      wilayahId,
      aktif: true,
    },
    include: { wilayah: true },
  });

  try {
    revalidatePath('/dashboard/pengguna');
  } catch {
    // ignore
  }

  return { success: true, pengguna: newUser };
}

/**
 * Toggles account active status (activate/deactivate).
 */
export async function toggleStatusPenggunaAction(id: string) {
  const currentUser = await getSessionUser();
  if (currentUser) {
    if (currentUser.peran !== 'ADMIN_DESA') {
      return { success: false, error: 'Akses ditolak: Hanya Admin Desa yang dapat mengubah status akun.' };
    }
    if (currentUser.id === id) {
      return { success: false, error: 'Tidak dapat menonaktifkan akun sendiri yang sedang aktif digunakan.' };
    }
  }

  const target = await prisma.pengguna.findUnique({ where: { id } });
  if (!target) {
    return { success: false, error: 'Akun pengguna tidak ditemukan.' };
  }

  await prisma.pengguna.update({
    where: { id },
    data: { aktif: !target.aktif },
  });

  try {
    revalidatePath('/dashboard/pengguna');
  } catch {
    // ignore
  }

  return { success: true, aktif: !target.aktif };
}

/**
 * Resets password for a user account.
 */
export async function resetPasswordAction(id: string, kataSandiBaru: string) {
  const currentUser = await getSessionUser();
  if (currentUser && currentUser.peran !== 'ADMIN_DESA') {
    return { success: false, error: 'Akses ditolak: Hanya Admin Desa yang dapat mengatur ulang kata sandi.' };
  }

  if (!kataSandiBaru || kataSandiBaru.length < 6) {
    return { success: false, error: 'Kata sandi baru minimal 6 karakter.' };
  }

  const target = await prisma.pengguna.findUnique({ where: { id } });
  if (!target) {
    return { success: false, error: 'Akun pengguna tidak ditemukan.' };
  }

  const hash = await hashPassword(kataSandiBaru);

  await prisma.pengguna.update({
    where: { id },
    data: { kataSandiHash: hash },
  });

  try {
    revalidatePath('/dashboard/pengguna');
  } catch {
    // ignore
  }

  return { success: true };
}

export const tambahPenggunaAction = createPenggunaAction;
export const resetPasswordPenggunaAction = resetPasswordAction;
