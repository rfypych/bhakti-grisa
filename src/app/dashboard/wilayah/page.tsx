import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { INITIAL_WILAYAH, INITIAL_FAMILIES, INITIAL_OFFICERS } from '@/lib/seedData';
import { KeluargaRecord, OfficerAccount, UserRole, Wilayah } from '@/lib/domain';
import {
  mapDbWilayahToDomain,
  mapDbKeluargaToDomain,
  mapDbUserToOfficer,
} from '@/lib/dbMappers';
import { DashboardWilayah } from '@/components/dashboard/DashboardWilayah';

export const metadata = {
  title: 'Manajemen Wilayah & Dasawisma - SIMPATIK Grudo',
  description: 'Manajemen hierarki kewilayahan Dusun, RW, RT, dan Dasawisma dengan Safety Guard proteksi integritas data.',
};

export const dynamic = 'force-dynamic';

export default async function WilayahPage() {
  let wilayahList: Wilayah[] = INITIAL_WILAYAH;
  let families: KeluargaRecord[] = INITIAL_FAMILIES;
  let officers: OfficerAccount[] = INITIAL_OFFICERS;
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbWilayah, dbKeluarga, dbUsers, sessionUser] = await Promise.all([
      prisma.wilayah.findMany({
        orderBy: [
          { dusun: 'asc' },
          { rw: 'asc' },
          { rt: 'asc' },
          { namaDasawisma: 'asc' },
        ],
      }),
      prisma.keluarga.findMany({
        include: {
          wilayah: true,
          anggota: true,
          hatinyaPkk: true,
          industriRumahTangga: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.pengguna.findMany({
        include: { wilayah: true },
        orderBy: [{ peran: 'asc' }, { nama: 'asc' }],
      }),
      getSessionUser(),
    ]);

    if (dbWilayah && dbWilayah.length > 0) {
      wilayahList = dbWilayah.map(mapDbWilayahToDomain);
    }

    if (dbKeluarga && dbKeluarga.length > 0) {
      families = dbKeluarga.map(mapDbKeluargaToDomain);
    }

    if (dbUsers && dbUsers.length > 0) {
      officers = dbUsers.map(mapDbUserToOfficer);
    }

    if (sessionUser) {
      currentRole = (sessionUser.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(sessionUser);
    } else if (officers.length > 0) {
      currentUser = officers.find((o) => o.role === 'ADMIN_DESA') || officers[0];
      currentRole = currentUser.role;
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk WilayahPage, menggunakan seed fallback:', err);
  }

  return (
    <DashboardWilayah
      wilayahList={wilayahList}
      families={families}
      officers={officers}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}

export { DashboardWilayah };
