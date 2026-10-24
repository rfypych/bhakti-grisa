import React from 'react';
import { prisma } from '@/lib/prisma';
import { GisMap } from '@/components/map/GisMap';
import { MapHouseholdData, getPinColor, filterHouseholdsWithCoordinates } from '@/components/map/MapPinMarker';
import { calculateAge } from '@/lib/demographics';
import { getSessionUser, getScopeWilayahIds } from '@/lib/auth';
import { MapPin, AlertTriangle, ShieldCheck, Heart, Filter } from 'lucide-react';

export const metadata = {
  title: 'Peta Spasial Rumah Warga (GIS) - SIMPATIK',
};

export default async function PetaSpasialPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; rt?: string }>;
}) {
  const resolvedParams = await searchParams; // Next 16 convention
  const user = await getSessionUser();
  const scopeWilayahIds = await getScopeWilayahIds(user);

  const whereClause: any = {
    statusData: { not: 'ARSIP' },
  };

  if (scopeWilayahIds !== null) {
    if (resolvedParams.wilayahId && scopeWilayahIds.includes(resolvedParams.wilayahId)) {
      whereClause.wilayahId = resolvedParams.wilayahId;
    } else {
      whereClause.wilayahId = { in: scopeWilayahIds };
    }
  } else if (resolvedParams.wilayahId) {
    whereClause.wilayahId = resolvedParams.wilayahId;
  }

  const [families, wilayahList] = await Promise.all([
    prisma.keluarga.findMany({
      where: whereClause,
      include: {
        wilayah: true,
        anggota: {
          include: {
            peristiwaVital: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wilayah.findMany({
      where: scopeWilayahIds !== null ? { id: { in: scopeWilayahIds } } : {},
      orderBy: [{ rt: 'asc' }],
    }),
  ]);

  const now = new Date();

  const households: MapHouseholdData[] = families.map((f) => {
    let hasBalita = false;
    let hasIbuHamil = false;

    for (const m of f.anggota) {
      const age = calculateAge(m.tanggalLahir, now);
      if (age <= 5) {
        hasBalita = true;
      }
      for (const pv of m.peristiwaVital) {
        if (pv.jenisPeristiwa === 'KEHAMILAN') {
          hasIbuHamil = true;
        }
      }
    }

    return {
      id: f.id,
      noKk: f.noKk,
      namaKepalaRumahTangga: f.namaKepalaRumahTangga,
      alamat: f.alamat,
      latitude: f.latitude,
      longitude: f.longitude,
      kriteriaRumah: f.kriteriaRumah,
      jambanKeluarga: f.jambanKeluarga,
      jumlahAnggota: f.anggota.length,
      hasBalita,
      hasIbuHamil,
      wilayah: f.wilayah
        ? {
            rt: f.wilayah.rt,
            rw: f.wilayah.rw,
            namaDasawisma: f.wilayah.namaDasawisma,
          }
        : null,
    };
  });

  const validMapped = filterHouseholdsWithCoordinates(households);
  const redCount = validMapped.filter(
    (h) => getPinColor({ kriteriaRumah: h.kriteriaRumah, jambanKeluarga: h.jambanKeluarga, hasBalita: h.hasBalita, hasIbuHamil: h.hasIbuHamil }) === 'red'
  ).length;
  const yellowCount = validMapped.filter(
    (h) => getPinColor({ kriteriaRumah: h.kriteriaRumah, jambanKeluarga: h.jambanKeluarga, hasBalita: h.hasBalita, hasIbuHamil: h.hasIbuHamil }) === 'yellow'
  ).length;
  const greenCount = validMapped.filter(
    (h) => getPinColor({ kriteriaRumah: h.kriteriaRumah, jambanKeluarga: h.jambanKeluarga, hasBalita: h.hasBalita, hasIbuHamil: h.hasIbuHamil }) === 'green'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-bold text-stone-900">Peta Spasial Rumah Warga (GIS)</h1>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Visualisasi spasial sebaran rumah tangga, kepemilikan jamban, dan warga rentan berbasis geolokasi GPS.
          </p>
        </div>

        {/* RT Filter dropdown */}
        <form method="get" className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-500" />
          <select
            name="wilayahId"
            defaultValue={resolvedParams.wilayahId || ''}
            className="text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Wilayah RT</option>
            {wilayahList.map((w) => (
              <option key={w.id} value={w.id}>
                RT {w.rt} / RW {w.rw} ({w.namaDasawisma})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* KPI Cards & Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500">Terpetakan (GPS)</p>
            <p className="text-xl font-bold text-stone-900">{validMapped.length} <span className="text-xs text-stone-400 font-normal">/ {households.length} KK</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              <p className="text-[11px] font-medium text-stone-500">Perlu Perhatian</p>
            </div>
            <p className="text-xl font-bold text-red-700">{redCount} <span className="text-xs text-stone-400 font-normal">KK</span></p>
            <p className="text-[10px] text-stone-400">Kurang sehat / Tanpa jamban</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <p className="text-[11px] font-medium text-stone-500">Prioritas Posyandu</p>
            </div>
            <p className="text-xl font-bold text-amber-700">{yellowCount} <span className="text-xs text-stone-400 font-normal">KK</span></p>
            <p className="text-[10px] text-stone-400">Ada Balita / Ibu Hamil</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <p className="text-[11px] font-medium text-stone-500">Sehat Standar</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">{greenCount} <span className="text-xs text-stone-400 font-normal">KK</span></p>
            <p className="text-[10px] text-stone-400">Sanitasi & jamban baik</p>
          </div>
        </div>
      </div>

      {/* Interactive Map Component */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <GisMap households={households} />
      </div>

      {/* Info note */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1">
        <p className="font-semibold text-stone-800">Petunjuk Navigasi Spasial:</p>
        <p>&bull; Klik pin marker untuk melihat ringkasan status sanitasi, jumlah jiwa, dan identitas kepala rumah tangga.</p>
        <p>&bull; Warna pin diperbarui secara otomatis berdasarkan kriteria sanitasi dan kelompok rentan (Balita & Ibu Hamil).</p>
      </div>
    </div>
  );
}
