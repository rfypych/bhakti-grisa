import React from 'react';
import { getPendingSubmissions } from '@/actions/verifikasiActions';
import { VerificationCard } from '@/components/verifikasi/VerificationCard';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldCheck, Inbox } from 'lucide-react';

export const metadata = {
  title: 'Antrean Verifikasi Data Warga - SIMPATIK',
};

export default async function VerifikasiPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const user = await getSessionUser();

  if (user && user.peran !== 'ADMIN_DESA' && user.peran !== 'KADER_RT') {
    redirect('/dashboard?notice=Akses+verifikasi+hanya+tersedia+untuk+Kader+RT+dan+Admin+Desa');
  }

  const targetWilayahId =
    user?.peran === 'KADER_RT' && user.wilayahId
      ? user.wilayahId
      : resolvedParams.wilayahId;

  const submissions = await getPendingSubmissions(targetWilayahId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-bold text-stone-900">Antrean Verifikasi Data Warga</h1>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Validasi pengajuan data mandiri warga via portal publik RT sebelum masuk ke agregasi resmi desa.
          </p>
        </div>
        <div className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold self-start sm:self-center">
          {submissions.length} Pengajuan Menunggu
        </div>
      </div>

      {/* Queue Content */}
      {submissions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Antrean Verifikasi Kosong</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Semua pengajuan mandiri warga telah diverifikasi atau belum ada pengajuan baru dari tautan publik RT.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((item) => (
            <VerificationCard key={item.id} submission={item} />
          ))}
        </div>
      )}
    </div>
  );
}
