import React from 'react';
import { getRecentPeristiwaVital, getEligibleMothers, getAllLivingMembers } from '@/actions/peristiwaActions';
import { PeristiwaClientWrapper } from '@/components/peristiwa/PeristiwaClientWrapper';
import { Activity, Baby, HeartCrack, Calendar, User, FileText } from 'lucide-react';

export const metadata = {
  title: 'Lapor Peristiwa Vital - SIMPATIK',
};

export default async function LaporPeristiwaPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  await searchParams; // Next 16 convention

  const [recentEvents, mothers, members] = await Promise.all([
    getRecentPeristiwaVital(30),
    getEligibleMothers(),
    getAllLivingMembers(),
  ]);

  const totalKelahiran = recentEvents.filter((e) => e.jenisPeristiwa === 'KELAHIRAN_BAYI').length;
  const totalKematian = recentEvents.filter((e) =>
    ['KEMATIAN_IBU', 'KEMATIAN_BAYI', 'KEMATIAN_BALITA'].includes(e.jenisPeristiwa)
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-bold text-stone-900">Modul Lapor Peristiwa</h1>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Pencatatan cepat dinamika kependudukan: kelahiran bayi, kehamilan, dan kematian warga (Lampiran 4.18).
          </p>
        </div>

        <PeristiwaClientWrapper mothers={mothers} members={members} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Kelahiran Tercatat</p>
            <p className="text-2xl font-bold text-stone-900">{totalKelahiran}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <HeartCrack className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Kematian Tercatat</p>
            <p className="text-2xl font-bold text-stone-900">{totalKematian}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-50 text-stone-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Total Log Vital</p>
            <p className="text-2xl font-bold text-stone-900">{recentEvents.length}</p>
          </div>
        </div>
      </div>

      {/* Event Log Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-800">Catatan Peristiwa Vital Terbaru</h2>
          <span className="text-xs text-stone-500">Menampilkan {recentEvents.length} log terakhir</span>
        </div>

        {recentEvents.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-sm">Belum ada catatan peristiwa vital yang terekam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis Peristiwa</th>
                  <th className="px-4 py-3">Nama Terkait</th>
                  <th className="px-4 py-3">Wilayah / Keluarga</th>
                  <th className="px-4 py-3">Detail & Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentEvents.map((event) => {
                  const eventDate = new Date(event.tanggalPeristiwa).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  let badgeColor = 'bg-stone-100 text-stone-800 border-stone-200';
                  let eventLabel = event.jenisPeristiwa.replace(/_/g, ' ');

                  if (event.jenisPeristiwa === 'KELAHIRAN_BAYI') {
                    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    eventLabel = 'Kelahiran Bayi';
                  } else if (event.jenisPeristiwa === 'KEHAMILAN') {
                    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                    eventLabel = 'Kehamilan';
                  } else if (event.jenisPeristiwa.startsWith('KEMATIAN')) {
                    badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                    eventLabel = event.jenisPeristiwa === 'KEMATIAN_IBU' ? 'Kematian Ibu' : 'Kematian Bayi/Balita';
                  }

                  const personName = event.namaBayi || event.namaAlmarhum || event.anggota?.nama || '-';
                  const krtName = event.anggota?.keluarga?.namaKepalaRumahTangga || '-';
                  const rtInfo = event.anggota?.keluarga?.wilayah?.rt ? `RT ${event.anggota.keluarga.wilayah.rt}` : '-';

                  return (
                    <tr key={event.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">
                        {eventDate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeColor}`}>
                          {eventLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">
                        {personName}
                        {event.jenisKelaminBayi && (
                          <span className="ml-1 text-[11px] text-stone-400 font-normal">
                            ({event.jenisKelaminBayi === 'L' ? 'Laki-laki' : 'Perempuan'})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                        <div className="font-medium">{krtName}</div>
                        <div className="text-[11px] text-stone-400">{rtInfo}</div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {event.sebabKematian && (
                          <span className="font-medium text-rose-700">Penyebab: {event.sebabKematian}. </span>
                        )}
                        {event.keterangan || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
