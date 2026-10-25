import React from 'react';
import { getWilayahListWithCounts } from '@/actions/wilayahActions';
import { WilayahManager } from '@/components/wilayah/WilayahManager';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MapPin, Layers, Home, Users } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-bold text-stone-900">Manajemen Wilayah Administrasi</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Konfigurasi hierarki wilayah: Dusun/Lingkungan, RW, RT, dan Kelompok Dasawisma Desa Grudo.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Dusun / Lingkungan</p>
          <p className="text-2xl font-bold text-stone-900">{uniqueDusun}</p>
          <span className="text-[10px] text-stone-400 block">Unit Tingkat Desa</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Rukun Warga (RW)</p>
          <p className="text-2xl font-bold text-stone-900">{uniqueRW}</p>
          <span className="text-[10px] text-stone-400 block">Satuan Rukun Warga</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Rukun Tetangga (RT)</p>
          <p className="text-2xl font-bold text-stone-900">{uniqueRT}</p>
          <span className="text-[10px] text-stone-400 block">Satuan Rukun Tetangga</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Kelompok Dasawisma</p>
          <p className="text-2xl font-bold text-emerald-700">{totalDasawisma}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block">Basis Pendataan PKK</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-stone-500">Total KK Terdaftar</p>
          <p className="text-2xl font-bold text-stone-900">{totalKeluarga}</p>
          <span className="text-[10px] text-stone-400 block">Di Seluruh Wilayah</span>
        </div>
      </div>

      {/* Main Table & Management Client Component */}
      <WilayahManager initialList={wilayahList} />
    </div>
  );
}
