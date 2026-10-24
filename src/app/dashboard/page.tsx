import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAggregationDesa, getAggregationDasawisma } from '@/lib/aggregation';
import {
  Users,
  Home,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  FileDown,
  Activity,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle,
} from 'lucide-react';

export const metadata = {
  title: 'Dashboard Eksekutif PKK - SIMPATIK',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; tahun?: string }>;
}) {
  const resolvedParams = await searchParams; // Next 16 convention
  const currentYear = new Date().getFullYear();
  const activeYear = resolvedParams.tahun ? parseInt(resolvedParams.tahun, 10) || currentYear : currentYear;

  const [wilayahList, pendingCount, recentFamilies] = await Promise.all([
    prisma.wilayah.findMany({ orderBy: { rt: 'asc' } }),
    prisma.keluarga.count({ where: { statusData: 'DRAFT' } }),
    prisma.keluarga.findMany({
      where: {
        statusData: 'VERIFIKASI',
        ...(resolvedParams.wilayahId ? { wilayahId: resolvedParams.wilayahId } : {}),
      },
      include: {
        wilayah: true,
        anggota: true,
      },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  // Compute aggregation statistics
  const aggData = resolvedParams.wilayahId
    ? await getAggregationDasawisma(resolvedParams.wilayahId, { tahun: activeYear, semester: 'TAHUNAN' })
    : await getAggregationDesa({ tahun: activeYear, semester: 'TAHUNAN' });

  const activeWilayah = wilayahList.find((w) => w.id === resolvedParams.wilayahId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
            Pusat Data Administrasi Terpadu
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
            Dashboard Statistik TP PKK
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {activeWilayah
              ? `Rekapitulasi Wilayah: ${activeWilayah.namaDasawisma} (RT ${activeWilayah.rt} / RW ${activeWilayah.rw}) — Tahun ${activeYear}`
              : `Rekapitulasi Agregat Seluruh Wilayah Desa Demaan (Tahun ${activeYear})`}
          </p>
        </div>

        {/* Filter & Export Action Group */}
        <div className="flex flex-col items-start md:items-end gap-3 self-start md:self-auto">
          {/* Filter Wilayah & Tahun Form */}
          <form method="get" className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              name="wilayahId"
              defaultValue={resolvedParams.wilayahId || ''}
              className="text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">Semua Wilayah Desa</option>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>
                  RT {w.rt} / RW {w.rw} ({w.namaDasawisma})
                </option>
              ))}
            </select>
            <input
              type="number"
              name="tahun"
              defaultValue={activeYear}
              className="w-20 text-xs px-2.5 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              placeholder="Tahun"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition-colors"
            >
              Tampilkan
            </button>
          </form>

          {/* Quick Export Group: Excel + PDF Rekap */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/api/export/excel?tahun=${activeYear}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors shadow-sm"
              title="Unduh seluruh 31 sheet berkas master Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh Excel</span>
            </a>
            <a
              href={`/api/export/pdf?jenis=rekap-dasawisma&tahun=${activeYear}${resolvedParams.wilayahId ? `&wilayahId=${resolvedParams.wilayahId}` : ''}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors shadow-sm"
              title="Unduh PDF Format Resmi Rekap Dasawisma (Lampiran 4.16a)"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF Rekap Dasawisma (4.16a)</span>
            </a>
            <a
              href={`/api/export/pdf?jenis=rekap-desa&tahun=${activeYear}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors shadow-sm"
              title="Unduh PDF Format Resmi Rekap Desa (Lampiran 4.17a)"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF Rekap Desa (4.17a)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Verification Notification Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Ada {pendingCount} pengajuan data mandiri warga yang menunggu verifikasi
              </p>
              <p className="text-[11px] text-amber-700">
                Periksa kesesuaian data Kartu Keluarga sebelum disahkan ke buku rekap resmi.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/verifikasi"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            Buka Antrean Verifikasi
          </Link>
        </div>
      )}

      {/* Main Aggregation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Total Keluarga (KK)</p>
          <p className="text-2xl font-bold text-stone-900">{aggData.totalKeluarga}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block">100% Terverifikasi</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Total Jiwa (Warga)</p>
          <p className="text-2xl font-bold text-stone-900">{aggData.totalAnggota}</p>
          <span className="text-[10px] text-stone-400 block">{aggData.totalLakiLaki} L &bull; {aggData.totalPerempuan} P</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Balita (&le; 5 Th)</p>
          <p className="text-2xl font-bold text-amber-700">{aggData.totalBalita}</p>
          <span className="text-[10px] text-stone-400 block">{aggData.totalBalitaL} L &bull; {aggData.totalBalitaP} P</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Lansia (&ge; 60 Th)</p>
          <p className="text-2xl font-bold text-stone-900">{aggData.totalLansia}</p>
          <span className="text-[10px] text-stone-400 block">Prioritas Posyandu</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Rumah Sehat</p>
          <p className="text-2xl font-bold text-emerald-700">{aggData.totalRumahSehat}</p>
          <span className="text-[10px] text-stone-400 block">{aggData.totalRumahKurangSehat} Kurang Sehat</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <p className="text-[11px] font-medium text-stone-500">Jamban Keluarga</p>
          <p className="text-2xl font-bold text-stone-900">{aggData.totalJamban}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block">Layak Sanitasi</span>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm text-xs">
        <div>
          <span className="text-stone-400 block text-[11px]">Pasangan Usia Subur (PUS)</span>
          <span className="font-bold text-stone-800 text-sm">{aggData.totalPus} Pasangan</span>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">Wanita Usia Subur (WUS)</span>
          <span className="font-bold text-stone-800 text-sm">{aggData.totalWus} Orang</span>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">Ibu Hamil Aktif</span>
          <span className="font-bold text-amber-700 text-sm">{aggData.totalIbuHamil} Orang</span>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">Ibu Nifas / Menyusui</span>
          <span className="font-bold text-emerald-700 text-sm">{aggData.totalIbuMenyusui} Orang</span>
        </div>
      </div>

      {/* Data Records & Actions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Daftar Keluarga Terverifikasi</h2>
            <p className="text-xs text-stone-500">
              Menampilkan {recentFamilies.length} kepala keluarga terbaru yang sah dalam buku rekapitulasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/peta"
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              Lihat di Peta Spasial
            </Link>
          </div>
        </div>

        {recentFamilies.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Belum ada keluarga dengan status terverifikasi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">No. KK</th>
                  <th className="px-4 py-3">Kepala Rumah Tangga</th>
                  <th className="px-4 py-3">Wilayah Dasawisma</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Kriteria Rumah</th>
                  <th className="px-4 py-3">Jamban</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentFamilies.map((f) => (
                  <tr key={f.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-stone-800">
                      {f.noKk}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      {f.namaKepalaRumahTangga}
                      <span className="block text-[11px] font-normal text-stone-400 truncate max-w-xs">
                        {f.alamat}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      <span className="font-medium text-stone-800">{f.wilayah?.namaDasawisma || '-'}</span>
                      <span className="block text-[11px] text-stone-400">
                        RT {f.wilayah?.rt || '-'} / RW {f.wilayah?.rw || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-800 font-medium">
                      {f.anggota.length} Jiwa
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          f.kriteriaRumah === 'SEHAT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {f.kriteriaRumah === 'SEHAT' ? 'Layak Huni' : 'Kurang Sehat'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {f.jambanKeluarga ? (
                        <span className="text-emerald-700 font-medium">Tersedia ({f.jumlahJamban})</span>
                      ) : (
                        <span className="text-red-600 font-medium">Tidak Ada</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/laporan/cetak/${f.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-md transition-colors text-[11px]"
                      >
                        <Printer className="w-3.5 h-3.5 text-stone-600" />
                        <span>Cetak Lampiran 4.15</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
