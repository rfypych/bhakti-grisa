import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { KeluargaRecord, OfficerAccount, UserRole } from '@/lib/domain';
import { mapDbKeluargaToDomain, mapDbUserToOfficer } from '@/lib/dbMappers';
import { DashboardCetak } from '@/components/dashboard/DashboardCetak';

export const metadata = {
  title: 'Cetak Catatan Keluarga (Lampiran 4.15) - SIMPATIK Grudo',
  description: 'Lembar Resmi Cetak Lampiran 4.15 Catatan Keluarga PKK Desa Grudo.',
};

export const dynamic = 'force-dynamic';

export default async function CetakLaporanIndexPage() {
  let families: KeluargaRecord[] = [];
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbKeluarga, sessionUser] = await Promise.all([
      prisma.keluarga.findMany({
        where: { statusData: 'VERIFIKASI' },
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

    if (sessionUser) {
      currentRole = (sessionUser.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(sessionUser);
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk CetakLaporanIndexPage:', err);
  }

  return (
    <DashboardCetak
      families={families}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}
