import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { OfficerAccount, UserRole, Wilayah } from '@/lib/domain';
import { mapDbUserToOfficer, mapDbWilayahToDomain } from '@/lib/dbMappers';
import { DashboardPengguna } from '@/components/dashboard/DashboardPengguna';

export const metadata = {
  title: 'Manajemen Akun Pengelola PKK - SIMPATIK Grudo',
  description: 'Otorisasi & Scoping Wilayah Tugas Akun Pengelola PKK Desa Grudo (Admin Desa, Pengurus Dusun, RW, Kader RT).',
};

export const dynamic = 'force-dynamic';

export default async function PenggunaPage() {
  let officers: OfficerAccount[] = [];
  let wilayahList: Wilayah[] = [];
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

    if (dbUsers) {
      officers = dbUsers.map(mapDbUserToOfficer);
    }

    if (dbWilayah) {
      wilayahList = dbWilayah.map(mapDbWilayahToDomain);
    }

    if (sessionUser) {
      currentRole = (sessionUser.peran as UserRole) || 'ADMIN_DESA';
      currentUser = mapDbUserToOfficer(sessionUser);
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma untuk PenggunaPage:', err);
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
