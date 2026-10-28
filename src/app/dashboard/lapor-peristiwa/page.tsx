import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { KeluargaRecord, PeristiwaRecord, OfficerAccount, UserRole } from '@/lib/domain';
import {
  mapDbKeluargaToDomain,
  mapDbPeristiwaToDomain,
  mapDbUserToOfficer,
} from '@/lib/dbMappers';
import { DashboardPeristiwa } from '@/components/dashboard/DashboardPeristiwa';

export const metadata = {
  title: 'Lapor Peristiwa Vital & Dinamika Penduduk - SIMPATIK Grudo',
  description: 'Pencatatan cepat peristiwa vital: kelahiran bayi (dengan Virtual NIK), kehamilan, kematian warga, dan mutasi keluar.',
};

export const dynamic = 'force-dynamic';

export default async function LaporPeristiwaPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  await searchParams;
  let families: KeluargaRecord[] = [];
  let events: PeristiwaRecord[] = [];
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbKeluarga, dbEvents, user] = await Promise.all([
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
      prisma.peristiwaVital.findMany({
        include: {
          anggota: {
            include: {
              keluarga: {
                include: { wilayah: true },
              },
            },
          },
        },
        orderBy: { tanggalPeristiwa: 'desc' },
        take: 50,
      }),
      getSessionUser(),
    ]);

    if (dbKeluarga) {
      families = dbKeluarga.map(mapDbKeluargaToDomain);
    }

    if (dbEvents) {
      events = dbEvents.map(mapDbPeristiwaToDomain);
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(user);
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk LaporPeristiwaPage:', err);
  }

  return (
    <DashboardPeristiwa
      families={families}
      events={events}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}

export { DashboardPeristiwa };
