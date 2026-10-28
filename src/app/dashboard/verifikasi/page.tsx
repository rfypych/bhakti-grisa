import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { KeluargaRecord, OfficerAccount, UserRole } from '@/lib/domain';
import { mapDbKeluargaToDomain, mapDbUserToOfficer } from '@/lib/dbMappers';
import { DashboardVerifikasi } from '@/components/dashboard/DashboardVerifikasi';

export const metadata = {
  title: 'Antrean Verifikasi Data Warga - SIMPATIK Grudo',
  description: 'Pemeriksaan dan validasi pengajuan mandiri warga via portal RT sebelum diintegrasikan ke buku rekapitulasi desa.',
};

export const dynamic = 'force-dynamic';

export default async function VerifikasiPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string }>;
}) {
  const resolvedParams = await searchParams;
  let families: KeluargaRecord[] = [];
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbKeluarga, user] = await Promise.all([
      prisma.keluarga.findMany({
        include: {
          wilayah: true,
          anggota: true,
          hatinyaPkk: true,
          industriRumahTangga: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      getSessionUser(),
    ]);

    if (dbKeluarga) {
      families = dbKeluarga.map(mapDbKeluargaToDomain);
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(user);
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk VerifikasiPage:', err);
  }

  return (
    <DashboardVerifikasi
      families={families}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}

export { DashboardVerifikasi };
