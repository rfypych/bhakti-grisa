import React from 'react';
import { getWilayahListWithCounts } from '@/actions/wilayahActions';
import { WilayahManager } from '@/components/wilayah/WilayahManager';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MapPin, Layers, Home, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Dusun / Lingkungan</p>
            <p className="text-2xl font-extrabold text-foreground">{uniqueDusun}</p>
            <span className="text-[10px] text-muted-foreground block">Unit Tingkat Desa</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Rukun Warga (RW)</p>
            <p className="text-2xl font-extrabold text-foreground">{uniqueRW}</p>
            <span className="text-[10px] text-muted-foreground block">Satuan Rukun Warga</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Rukun Tetangga (RT)</p>
            <p className="text-2xl font-extrabold text-foreground">{uniqueRT}</p>
            <span className="text-[10px] text-muted-foreground block">Satuan Rukun Tetangga</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Kelompok Dasawisma</p>
            <p className="text-2xl font-extrabold text-primary">{totalDasawisma}</p>
            <span className="text-[10px] text-primary font-semibold block">Basis Pendataan PKK</span>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total KK Terdaftar</p>
            <p className="text-2xl font-extrabold text-foreground">{totalKeluarga}</p>
            <span className="text-[10px] text-muted-foreground block">Di Seluruh Wilayah</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Table & Management Client Component */}
      <WilayahManager initialList={wilayahList} />
    </div>
  );
}
