import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { INITIAL_OFFICERS } from '@/lib/seedData';
import { OfficerAccount, UserRole } from '@/lib/domain';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function DashboardLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';
  let allOfficers: OfficerAccount[] = INITIAL_OFFICERS;
  let pendingDraftCount = 0;

  try {
    const [user, dbUsers, draftCount] = await Promise.all([
      getSessionUser(),
      prisma.pengguna.findMany({
        where: { aktif: true },
        include: { wilayah: true },
      }),
      prisma.keluarga.count({
        where: { statusData: 'DRAFT' },
      }),
    ]);

    pendingDraftCount = draftCount;

    if (dbUsers && dbUsers.length > 0) {
      allOfficers = dbUsers.map((u) => ({
        id: u.id,
        nama: u.nama,
        username: u.username,
        passwordPlain: '',
        role: u.peran as any,
        aktif: u.aktif,
        scopeDusun: u.wilayah?.dusun,
        scopeRw: u.wilayah?.rw,
        scopeRt: u.wilayah?.rt,
        wilayahId: u.wilayahId || undefined,
        terakhirMasuk: u.updatedAt?.toISOString() || new Date().toISOString(),
      }));
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'ADMIN_DESA';
      currentUser = {
        id: user.id,
        nama: user.nama,
        username: user.username,
        passwordPlain: '',
        role: user.peran as any,
        aktif: user.aktif,
        scopeDusun: user.wilayah?.dusun,
        scopeRw: user.wilayah?.rw,
        scopeRt: user.wilayah?.rt,
        wilayahId: user.wilayahId || undefined,
        terakhirMasuk: user.updatedAt?.toISOString() || new Date().toISOString(),
      };
    } else if (allOfficers.length > 0) {
      // Default fallback for preview/development when not logged in
      currentUser = allOfficers[0];
      currentRole = currentUser.role;
    }
  } catch (err) {
    console.warn('Failed to load session/officers for DashboardLayout, using defaults:', err);
    if (allOfficers.length > 0) {
      currentUser = allOfficers[0];
      currentRole = currentUser.role;
    }
  }

  return (
    <DashboardLayout
      currentUser={currentUser}
      currentRole={currentRole}
      allOfficers={allOfficers}
      pendingDraftCount={pendingDraftCount}
    >
      {children}
    </DashboardLayout>
  );
}
