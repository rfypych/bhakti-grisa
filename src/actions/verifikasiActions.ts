'use server';

import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getPendingSubmissions(wilayahId?: string) {
  const where: any = {
    statusData: 'DRAFT',
  };

  if (wilayahId && wilayahId !== 'all') {
    where.wilayahId = wilayahId;
  }

  return prisma.keluarga.findMany({
    where,
    include: {
      wilayah: true,
      anggota: true,
      hatinyaPkk: true,
      industriRumahTangga: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function approveSubmissionAction(keluargaId: string) {
  try {
    const existing = await prisma.keluarga.findUnique({
      where: { id: keluargaId },
      include: { anggota: true },
    });

    if (!existing) {
      return { success: false, error: 'Data keluarga tidak ditemukan.' };
    }

    if (!existing.anggota || existing.anggota.length === 0) {
      return { success: false, error: 'Berkas tidak dapat disetujui karena tidak memiliki anggota keluarga.' };
    }

    const user = await getSessionUser();
    if (user) {
      if (user.peran !== 'ADMIN_DESA' && user.peran !== 'KADER_RT') {
        return { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk memverifikasi data.' };
      }
      if (user.peran === 'KADER_RT' && user.wilayahId && existing.wilayahId !== user.wilayahId) {
        return { success: false, error: 'Akses ditolak: Anda hanya dapat memverifikasi pengajuan di wilayah Anda.' };
      }
    }

    const updated = await prisma.keluarga.update({
      where: { id: keluargaId },
      data: {
        statusData: 'VERIFIKASI',
        catatanVerifikasi: null,
      },
    });

    try {
      revalidatePath('/dashboard/verifikasi');
      revalidatePath('/dashboard/keluarga');
    } catch {
      // safe during test environment where Next cache context is absent
    }

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('[approveSubmissionAction] Error:', error);
    return { success: false, error: error.message || 'Gagal menyetujui data keluarga.' };
  }
}

export async function rejectSubmissionAction(keluargaId: string, reason: string) {
  try {
    const user = await getSessionUser();
    if (user) {
      if (user.peran !== 'ADMIN_DESA' && user.peran !== 'KADER_RT') {
        return { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk menolak data.' };
      }
      const existing = await prisma.keluarga.findUnique({ where: { id: keluargaId } });
      if (user.peran === 'KADER_RT' && user.wilayahId && existing?.wilayahId !== user.wilayahId) {
        return { success: false, error: 'Akses ditolak: Anda hanya dapat menolak pengajuan di wilayah Anda.' };
      }
    }

    const updated = await prisma.keluarga.update({
      where: { id: keluargaId },
      data: {
        statusData: 'ARSIP',
        catatanVerifikasi: reason || 'Ditolak oleh kader Dasawisma / RT',
      },
    });

    try {
      revalidatePath('/dashboard/verifikasi');
    } catch {
      // safe during test environment
    }

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('[rejectSubmissionAction] Error:', error);
    return { success: false, error: error.message || 'Gagal menolak data keluarga.' };
  }
}
