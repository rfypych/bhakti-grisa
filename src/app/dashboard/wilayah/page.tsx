import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
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
  let wilayahList: Wilayah[] = [];
  let families: KeluargaRecord[] = [];
  let officers: OfficerAccount[] = [];
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

    if (dbWilayah) {
      wilayahList = dbWilayah.map(mapDbWilayahToDomain);
    }

    if (dbKeluarga) {
      families = dbKeluarga.map(mapDbKeluargaToDomain);
    }

    if (dbUsers) {
      officers = dbUsers.map(mapDbUserToOfficer);
    }

    if (sessionUser) {
      currentRole = (sessionUser.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(sessionUser);
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk WilayahPage:', err);
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
