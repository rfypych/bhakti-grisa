'use server';

import { prisma } from '@/lib/prisma';
import { generateVirtualNik } from '@/lib/virtualNik';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface KelahiranInput {
  ibuId: string;
  namaBayi: string;
  tanggalLahir: Date | string;
  jenisKelamin: 'L' | 'P';
  akteKelahiran?: boolean;
  nik?: string;
  beratBadanKg?: number;
  panjangBadanCm?: number;
}

export interface KematianInput {
  anggotaId: string;
  namaAlmarhum: string;
  tanggalKematian: Date | string;
  sebabKematian: string;
  statusAlmarhum?: 'IBU_HAMIL_MELAHIRKAN_NIFAS' | 'BAYI' | 'BALITA' | 'LAINNYA';
  keterangan?: string;
}

export interface KehamilanInput {
  anggotaId: string;
  tanggalCatat?: Date | string;
  status?: 'KEHAMILAN' | 'NIFAS';
  keterangan?: string;
}

/**
 * Records a birth event atomically:
 * 1. Inserts the newborn into AnggotaKeluarga (with Dukcapil NIK or virtual TEMP- NIK)
 * 2. Logs the vital event in PeristiwaVital (Lampiran 4.18)
 */
export async function laporKelahiranAction(data: KelahiranInput): Promise<{ success: boolean; childId: string }> {
  const mother = await prisma.anggotaKeluarga.findUnique({
    where: { id: data.ibuId },
    include: { keluarga: true },
  });

  if (!mother) {
    throw new Error(`Data ibu dengan ID ${data.ibuId} tidak ditemukan.`);
  }

  const user = await getSessionUser();
  if (user) {
    if (user.peran !== 'ADMIN_DESA' && user.peran !== 'KADER_RT') {
      throw new Error('Akses ditolak: Pengurus RW/Dusun hanya memiliki izin baca log peristiwa.');
    }
    if (user.peran === 'KADER_RT' && user.wilayahId && mother.keluarga?.wilayahId !== user.wilayahId) {
      throw new Error('Akses ditolak: Anda hanya dapat mencatat kelahiran pada warga di wilayah Dasawisma Anda.');
    }
  }

  const birthDate = new Date(data.tanggalLahir);
  const isTemporary = !data.nik || data.nik.trim() === '';
  const childNik = isTemporary ? generateVirtualNik(birthDate) : data.nik!.trim();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create newborn child member
    const child = await tx.anggotaKeluarga.create({
      data: {
        keluargaId: mother.keluargaId,
        nik: childNik,
        isNikSementara: isTemporary,
        nama: data.namaBayi.trim(),
        hubunganKeluarga: 'ANAK',
        jenisKelamin: data.jenisKelamin,
        tempatLahir: mother.keluarga?.alamat ? mother.keluarga.alamat.split(',')[0].trim() : 'Ngawi',
        tanggalLahir: birthDate,
        agama: mother.agama || 'ISLAM',
        pendidikan: 'TIDAK_TAMAT_SD',
        pekerjaan: 'TIDAK_BEKERJA',
        statusPerkawinan: 'BELUM_KAWIN',
      },
    });

    // 2. Log vital birth event
    await tx.peristiwaVital.create({
      data: {
        anggotaKeluargaId: child.id,
        jenisPeristiwa: 'KELAHIRAN_BAYI',
        tanggalPeristiwa: birthDate,
        namaBayi: data.namaBayi.trim(),
        jenisKelaminBayi: data.jenisKelamin,
        akteKelahiran: Boolean(data.akteKelahiran),
        keterangan: `Ibu: ${mother.nama}${data.beratBadanKg ? `, BB: ${data.beratBadanKg} kg` : ''}${data.panjangBadanCm ? `, PB: ${data.panjangBadanCm} cm` : ''}`,
      },
    });

    return child;
  });

  try {
    revalidatePath('/dashboard/lapor-peristiwa');
    revalidatePath('/dashboard');
  } catch {
    // ignore in non-request contexts
  }

  return {
    success: true,
    childId: result.id,
  };
}

/**
 * Records a mortality event and creates PeristiwaVital record.
 */
export async function laporKematianAction(data: KematianInput): Promise<{ success: boolean }> {
  const user = await getSessionUser();
  if (user) {
    if (user.peran !== 'ADMIN_DESA' && user.peran !== 'KADER_RT') {
      throw new Error('Akses ditolak: Pengurus RW/Dusun hanya memiliki izin baca log peristiwa.');
    }
    const targetMember = await prisma.anggotaKeluarga.findUnique({
      where: { id: data.anggotaId },
      include: { keluarga: true },
    });
    if (user.peran === 'KADER_RT' && user.wilayahId && targetMember?.keluarga?.wilayahId !== user.wilayahId) {
      throw new Error('Akses ditolak: Anda hanya dapat mencatat kematian pada warga di wilayah Dasawisma Anda.');
    }
  }

  // Map the reporter-facing category to the structured event type. General
  // deaths are KEMATIAN_WARGA: recording them as KEMATIAN_IBU would corrupt
  // the maternal mortality counters in official recaps.
  let jenisPeristiwa: 'KEMATIAN_IBU' | 'KEMATIAN_BAYI' | 'KEMATIAN_BALITA' | 'KEMATIAN_WARGA' = 'KEMATIAN_WARGA';

  if (data.statusAlmarhum === 'BAYI') {
    jenisPeristiwa = 'KEMATIAN_BAYI';
  } else if (data.statusAlmarhum === 'BALITA') {
    jenisPeristiwa = 'KEMATIAN_BALITA';
  } else if (data.statusAlmarhum === 'IBU_HAMIL_MELAHIRKAN_NIFAS') {
    jenisPeristiwa = 'KEMATIAN_IBU';
  }

  const deathDate = new Date(data.tanggalKematian);

  await prisma.$transaction(async (tx) => {
    await tx.peristiwaVital.create({
      data: {
        anggotaKeluargaId: data.anggotaId,
        jenisPeristiwa,
        tanggalPeristiwa: deathDate,
        namaAlmarhum: data.namaAlmarhum.trim(),
        sebabKematian: data.sebabKematian.trim(),
        keterangan: data.keterangan || (data.statusAlmarhum ? `Kategori: ${data.statusAlmarhum}` : undefined),
      },
    });

    // The deceased member stops counting as a living resident and must no
    // longer be offered in the living-member lists.
    await tx.anggotaKeluarga.update({
      where: { id: data.anggotaId },
      data: { statusKehidupan: 'MENINGGAL' },
    });
  });

  try {
    revalidatePath('/dashboard/lapor-peristiwa');
    revalidatePath('/dashboard');
  } catch {
    // ignore
  }

  return { success: true };
}

/**
 * Records pregnancy or nursing status.
 */
export async function laporKehamilanAction(data: KehamilanInput): Promise<{ success: boolean }> {
  const user = await getSessionUser();
  if (user) {
    if (user.peran !== 'ADMIN_DESA' && user.peran !== 'KADER_RT') {
      throw new Error('Akses ditolak: Pengurus RW/Dusun hanya memiliki izin baca log peristiwa.');
    }
    const targetMother = await prisma.anggotaKeluarga.findUnique({
      where: { id: data.anggotaId },
      include: { keluarga: true },
    });
    if (user.peran === 'KADER_RT' && user.wilayahId && targetMother?.keluarga?.wilayahId !== user.wilayahId) {
      throw new Error('Akses ditolak: Anda hanya dapat mencatat kehamilan pada warga di wilayah Dasawisma Anda.');
    }
  }

  const eventDate = data.tanggalCatat ? new Date(data.tanggalCatat) : new Date();

  await prisma.peristiwaVital.create({
    data: {
      anggotaKeluargaId: data.anggotaId,
      jenisPeristiwa: data.status === 'NIFAS' ? 'NIFAS' : 'KEHAMILAN',
      tanggalPeristiwa: eventDate,
      keterangan: data.keterangan || (data.status === 'NIFAS' ? 'Ibu Nifas / Menyusui' : 'Ibu Hamil Aktif'),
    },
  });

  try {
    revalidatePath('/dashboard/lapor-peristiwa');
    revalidatePath('/dashboard');
  } catch {
    // ignore
  }

  return { success: true };
}

/**
 * Fetches recent vital events for the dashboard table.
 */
export async function getRecentPeristiwaVital(limit: number = 20) {
  return prisma.peristiwaVital.findMany({
    take: limit,
    orderBy: { tanggalPeristiwa: 'desc' },
    include: {
      anggota: {
        include: {
          keluarga: {
            include: { wilayah: true },
          },
        },
      },
    },
  });
}

/**
 * Fetches eligible mothers (married women or adult females) for birth reporting.
 */
export async function getEligibleMothers(wilayahId?: string) {
  return prisma.anggotaKeluarga.findMany({
    where: {
      jenisKelamin: 'P',
      statusKehidupan: 'HIDUP',
      keluarga: {
        statusData: 'VERIFIKASI',
        ...(wilayahId ? { wilayahId } : {}),
      },
    },
    include: {
      keluarga: {
        include: { wilayah: true },
      },
    },
    orderBy: { nama: 'asc' },
  });
}

/**
 * Fetches all members for mortality reporting.
 */
export async function getAllLivingMembers(wilayahId?: string) {
  return prisma.anggotaKeluarga.findMany({
    where: {
      statusKehidupan: 'HIDUP',
      keluarga: {
        statusData: 'VERIFIKASI',
        ...(wilayahId ? { wilayahId } : {}),
      },
    },
    include: {
      keluarga: {
        include: { wilayah: true },
      },
    },
    orderBy: { nama: 'asc' },
  });
}
