import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { KeluargaRecord, Wilayah, OfficerAccount, UserRole } from '@/lib/domain';
import {
  mapDbKeluargaToDomain,
  mapDbWilayahToDomain,
  mapDbUserToOfficer,
} from '@/lib/dbMappers';
import { DashboardPeta } from '@/components/dashboard/DashboardPeta';

export const metadata = {
  title: 'Peta Spasial Rumah Warga & Indeks Kerentanan GIS - SIMPATIK Grudo',
  description: 'Visualisasi spasial sebaran rumah tangga, fasilitas sanitasi jamban/SPAL, dan peta kerentanan warga berbasis kadastral desa.',
};

export const dynamic = 'force-dynamic';

export default async function PetaPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; rt?: string }>;
}) {
  await searchParams;
  let families: KeluargaRecord[] = [];
  let wilayahList: Wilayah[] = [];
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbKeluarga, dbWilayah, user] = await Promise.all([
      prisma.keluarga.findMany({
        where: { statusData: 'VERIFIKASI' },
        include: {
          wilayah: true,
          anggota: {
            include: { peristiwaVital: true },
          },
          hatinyaPkk: true,
          industriRumahTangga: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.wilayah.findMany({
        orderBy: [{ dusun: 'asc' }, { rw: 'asc' }, { rt: 'asc' }],
      }),
      getSessionUser(),
    ]);

    if (dbKeluarga) {
      families = dbKeluarga.map(mapDbKeluargaToDomain);
    }

    if (dbWilayah) {
      wilayahList = dbWilayah.map(mapDbWilayahToDomain);
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(user);
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk PetaPage:', err);
  }

  return (
    <DashboardPeta
      families={families}
      wilayahList={wilayahList}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}

export { DashboardPeta };
