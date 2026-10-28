import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { INITIAL_FAMILIES, INITIAL_WILAYAH, INITIAL_OFFICERS } from '@/lib/seedData';
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
  let families: KeluargaRecord[] = INITIAL_FAMILIES;
  let wilayahList: Wilayah[] = INITIAL_WILAYAH;
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbKeluarga, dbWilayah, user] = await Promise.all([
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
      prisma.wilayah.findMany({
        orderBy: [{ dusun: 'asc' }, { rw: 'asc' }, { rt: 'asc' }],
      }),
      getSessionUser(),
    ]);

    if (dbKeluarga && dbKeluarga.length > 0) {
      families = dbKeluarga.map(mapDbKeluargaToDomain);
    }

    if (dbWilayah && dbWilayah.length > 0) {
      wilayahList = dbWilayah.map(mapDbWilayahToDomain);
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(user);
    } else if (INITIAL_OFFICERS.length > 0) {
      currentUser = INITIAL_OFFICERS[0];
      currentRole = currentUser.role;
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk PetaPage, menggunakan seed fallback:', err);
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
