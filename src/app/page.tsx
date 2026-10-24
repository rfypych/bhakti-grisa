import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  ShieldCheck,
  FileSpreadsheet,
  MapPin,
  ClipboardList,
  Activity,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// The landing page renders live database state (RT portal list and data
// counters). Without this, Next.js prerenders it at build time and the
// portal/counters stay frozen at whatever the database contained then.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const wilayahList = await prisma.wilayah.findMany({
    orderBy: [{ rt: 'asc' }],
  });

  const [totalKeluarga, totalAnggota, pendingDrafts] = await Promise.all([
    prisma.keluarga.count({ where: { statusData: { not: 'ARSIP' } } }),
    prisma.anggotaKeluarga.count(),
    prisma.keluarga.count({ where: { statusData: 'DRAFT' } }),
  ]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-stone-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Inisiatif Pengabdian Masyarakat Bhakti Grisa &bull; Desa Demaan</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Keluarga
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Platform satu pintu pendataan Dasawisma, verifikasi berjenjang RT/RW/Desa, pemetaan spasial rumah sehat, dan rekapitulasi otomatis 31 sheet buku resmi PKK.
          </p>

          {/* Quick Stat Pill */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-stone-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{totalKeluarga} Kartu Keluarga Tercatat</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{totalAnggota} Jiwa Warga Terdata</span>
            </div>
            {pendingDrafts > 0 && (
              <>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-2 text-amber-300">
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  <span>{pendingDrafts} Pengajuan Menunggu Verifikasi</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* RT Selection & Self-Service Entry Portal */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xl -mt-16 relative z-10 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-stone-900">
              Pilih Wilayah RT Anda untuk Pengisian Formulir
            </h2>
            <p className="text-xs text-stone-600">
              Warga dapat mengisi data keluarga secara mandiri. Data akan divalidasi oleh Kader RT sebelum masuk ke buku rekap resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {wilayahList.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-stone-400">
                Belum ada data wilayah tersimpan di sistem.
              </div>
            ) : (
              wilayahList.map((w) => (
                <Link
                  key={w.id}
                  href={`/formulir?wilayahId=${w.id}`}
                  className="p-4 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 hover:shadow-md transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      RT {w.rt} / RW {w.rw}
                    </span>
                    <h3 className="text-sm font-bold text-stone-800 mt-1.5 group-hover:text-emerald-900">
                      {w.namaDasawisma}
                    </h3>
                    <p className="text-[11px] text-stone-500">Dusun {w.dusun}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Feature Navigation Modules */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">Modul Kerja Tim Penggerak PKK</h2>
          <p className="text-xs text-stone-600">
            Akses instan seluruh instrumen administrasi kependudukan dan pelaporan lapangan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard"
            className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Dashboard Utama</h3>
            <p className="text-xs text-stone-500">
              Statistik demografi, data keluarga, dan rekapitulasi real-time tingkat RT, RW, dan Desa.
            </p>
          </Link>

          <Link
            href="/dashboard/verifikasi"
            className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Antrean Verifikasi</h3>
            <p className="text-xs text-stone-500">
              Validasi dan setujui input mandiri warga dengan fitur komparasi data lama vs baru.
            </p>
          </Link>

          <Link
            href="/dashboard/lapor-peristiwa"
            className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Lapor Peristiwa</h3>
            <p className="text-xs text-stone-500">
              Pencatatan cepat kelahiran, kehamilan, dan kematian warga secara otomatis (Lampiran 4.18).
            </p>
          </Link>

          <Link
            href="/dashboard/peta"
            className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Peta Spasial GIS</h3>
            <p className="text-xs text-stone-500">
              Pemetaan interaktif kondisi rumah sehat, kepemilikan jamban, dan sebaran balita &amp; ibu hamil.
            </p>
          </Link>
        </div>
      </section>

      {/* Excel Download CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-emerald-800 to-stone-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2.5 py-1 rounded-md">
              Mesin Template Injection Master
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">
              Unduh Seluruh 31 Sheet Buku Resmi PKK Sekaligus
            </h2>
            <p className="text-xs text-stone-300 max-w-xl">
              Hasil agregasi langsung diinjeksikan ke template resmi Kemendagri tanpa merusak format baku dan tata letak sel asli.
            </p>
          </div>

          <a
            href="/api/export/excel"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Berkas Excel (.xlsx)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
