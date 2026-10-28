import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { INITIAL_OFFICERS, INITIAL_WILAYAH } from '@/lib/seedData';
import { OfficerAccount, UserRole, Wilayah } from '@/lib/domain';
import { mapDbUserToOfficer, mapDbWilayahToDomain } from '@/lib/dbMappers';
import { DashboardPengguna } from '@/components/dashboard/DashboardPengguna';

export const metadata = {
  title: 'Manajemen Akun Pengelola PKK - SIMPATIK Grudo',
  description: 'Otorisasi & Scoping Wilayah Tugas Akun Pengelola PKK Desa Grudo (Admin Desa, Pengurus Dusun, RW, Kader RT).',
};

export const dynamic = 'force-dynamic';

export default async function PenggunaPage() {
  let officers: OfficerAccount[] = INITIAL_OFFICERS;
  let wilayahList: Wilayah[] = INITIAL_WILAYAH;
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbUsers, dbWilayah, sessionUser] = await Promise.all([
      prisma.pengguna.findMany({
        include: { wilayah: true },
        orderBy: [{ peran: 'asc' }, { nama: 'asc' }],
      }),
      prisma.wilayah.findMany({
        orderBy: [
          { dusun: 'asc' },
          { rw: 'asc' },
          { rt: 'asc' },
          { namaDasawisma: 'asc' },
        ],
      }),
      getSessionUser(),
    ]);

    if (dbUsers && dbUsers.length > 0) {
      officers = dbUsers.map(mapDbUserToOfficer);
    }

    if (dbWilayah && dbWilayah.length > 0) {
      wilayahList = dbWilayah.map(mapDbWilayahToDomain);
    }

    if (sessionUser) {
      currentRole = (sessionUser.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(sessionUser);
    } else if (officers.length > 0) {
      currentUser = officers.find((o) => o.role === 'ADMIN_DESA') || officers[0];
      currentRole = currentUser.role;
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk PenggunaPage, menggunakan seed fallback:', err);
  }

  return (
    <DashboardPengguna
      officers={officers}
      wilayahList={wilayahList}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}

export { DashboardPengguna };
