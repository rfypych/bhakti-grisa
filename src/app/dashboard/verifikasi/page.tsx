import React from 'react';
import { getPendingSubmissions } from '@/actions/verifikasiActions';
import { VerificationCard } from '@/components/verifikasi/VerificationCard';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldCheck, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="max-w-5xl mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Antrean Verifikasi Data Warga</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Pemeriksaan dan validasi pengajuan mandiri warga via portal RT sebelum diintegrasikan ke buku rekapitulasi desa.
          </p>
        </div>

        <Badge variant={submissions.length > 0 ? 'warning' : 'secondary'} className="text-xs px-3 py-1 font-bold self-start sm:self-center">
          {submissions.length} Pengajuan Menunggu
        </Badge>
      </div>

      {/* Queue Content */}
      {submissions.length === 0 ? (
        <Card className="p-12 text-center border-border shadow-sm">
          <CardContent className="p-0 flex flex-col items-center gap-3">
            <div className="size-14 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Inbox className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Antrean Verifikasi Kosong</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Semua pengajuan mandiri warga di wilayah Anda telah diverifikasi atau belum ada pengajuan baru dari tautan formulir RT.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((item) => (
            <VerificationCard key={item.id} submission={item} />
          ))}
        </div>
      )}
    </div>
  );
}
