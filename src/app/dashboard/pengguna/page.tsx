import React from 'react';
import { getPenggunaList } from '@/actions/penggunaActions';
import { prisma } from '@/lib/prisma';
import { PenggunaManager } from '@/components/pengguna/PenggunaManager';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Manajemen Akun Pengelola - SIMPATIK',
};

export default async function PenggunaPage() {
  const user = await getSessionUser();
  if (user && user.peran !== 'ADMIN_DESA') {
    redirect('/dashboard?notice=Akses+modul+Pengguna+hanya+tersedia+untuk+Admin+Desa');
  }

  const [users, wilayahList] = await Promise.all([
    getPenggunaList(),
    prisma.wilayah.findMany({
      orderBy: [{ dusun: 'asc' }, { rw: 'asc' }, { rt: 'asc' }, { namaDasawisma: 'asc' }],
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Akun Pengelola PKK</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pengelolaan hak akses, pembuatan akun resmi, dan konfigurasi wilayah cakupan kader dan pengurus.
          </p>
        </div>
      </div>

      <PenggunaManager initialUsers={users as any} wilayahList={wilayahList} />
    </div>
  );
}
