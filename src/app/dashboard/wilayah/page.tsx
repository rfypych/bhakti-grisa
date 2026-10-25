import React from 'react';
import { getWilayahListWithCounts } from '@/actions/wilayahActions';
import { WilayahManager } from '@/components/wilayah/WilayahManager';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MapPin, Layers, Home, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Manajemen Wilayah & Dasawisma - SIMPATIK',
};

export default async function WilayahPage() {
  const user = await getSessionUser();
  if (user && user.peran !== 'ADMIN_DESA') {
    redirect('/dashboard?notice=Akses+modul+Wilayah+hanya+tersedia+untuk+Admin+Desa');
  }

  const wilayahList = await getWilayahListWithCounts();

  const totalDasawisma = wilayahList.length;
  const uniqueDusun = new Set(wilayahList.map((w) => w.dusun)).size;
  const uniqueRW = new Set(wilayahList.map((w) => `${w.dusun}-${w.rw}`)).size;
  const uniqueRT = new Set(wilayahList.map((w) => `${w.dusun}-${w.rw}-${w.rt}`)).size;
  const totalKeluarga = wilayahList.reduce((acc, w) => acc + w._count.keluarga, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Wilayah Administrasi</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi hierarki wilayah: Dusun/Lingkungan, RW, RT, dan Kelompok Dasawisma Desa Grudo.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dusun</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{uniqueDusun}</div>
            <p className="text-xs text-muted-foreground mt-1">Unit Tingkat Desa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rukun Warga</CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{uniqueRW}</div>
            <p className="text-xs text-muted-foreground mt-1">Satuan RW</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rukun Tetangga</CardTitle>
            <Home className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{uniqueRT}</div>
            <p className="text-xs text-muted-foreground mt-1">Satuan RT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dasawisma</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-primary">{totalDasawisma}</div>
            <p className="text-xs text-muted-foreground mt-1">Basis Pendataan PKK</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">KK Terdaftar</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalKeluarga}</div>
            <p className="text-xs text-muted-foreground mt-1">Di Seluruh Wilayah</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table & Management Client Component */}
      <WilayahManager initialList={wilayahList} />
    </div>
  );
}
