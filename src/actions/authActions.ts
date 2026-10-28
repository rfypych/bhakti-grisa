'use server';

import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
} from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function getCurrentSessionUserAction() {
  const user = await getSessionUser();
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    peran: user.peran,
    wilayahId: user.wilayahId || undefined,
    aktif: user.aktif,
  };
}

export async function loginAction(formData: { username: string; kataSandi: string }) {
  const username = formData.username?.trim();
  const kataSandi = formData.kataSandi;

  if (!username || !kataSandi) {
    return { success: false, error: 'Nama pengguna dan kata sandi wajib diisi.' };
  }

  const user = await prisma.pengguna.findUnique({
    where: { username },
    include: { wilayah: true },
  });

  if (!user || !user.aktif) {
    // Generic error message for security
    return { success: false, error: 'Nama pengguna atau kata sandi tidak valid.' };
  }

  const isValid = await verifyPassword(kataSandi, user.kataSandiHash);
  if (!isValid) {
    return { success: false, error: 'Nama pengguna atau kata sandi tidak valid.' };
  }

  const token = await createSessionToken({
    userId: user.id,
    peran: user.peran,
    wilayahId: user.wilayahId,
  });

  await setSessionCookie(token);

  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}
