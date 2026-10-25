import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CatatanKeluargaPrint } from '@/components/print/CatatanKeluargaPrint';
import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import { PrintButton } from './PrintButton';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Cetak Catatan Keluarga (Lampiran 4.15) - SIMPATIK',
};

export default async function CetakLaporanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // Next 16 convention: params is a Promise

  const family = await prisma.keluarga.findUnique({
    where: { id },
    include: {
      wilayah: true,
      anggota: {
        orderBy: { tanggalLahir: 'asc' },
      },
      hatinyaPkk: true,
      industriRumahTangga: true,
    },
  });

  if (!family) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/40 py-6 px-4 print:bg-white print:p-0 print:m-0">
      {/* Action Navigation Bar (Hidden when printing) */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-md border border-border shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="min-h-touch gap-1.5 text-xs">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" data-icon="inline-start" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">
            Pratinjau Format Cetak Resmi : <b>Lampiran 4.15</b>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="min-h-touch text-xs font-semibold">
            <a
              href={`/api/export/pdf?jenis=catatan-keluarga&keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
              title="Unduh Lampiran 4.15 Catatan Keluarga"
            >
              <FileDown className="size-4" data-icon="inline-start" />
              <span>PDF 4.15 (Catatan Keluarga)</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-touch text-xs">
            <a
              href={`/api/export/pdf?jenis=data-keluarga&keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
              title="Unduh Lampiran 4.14.2a Data Keluarga"
            >
              <FileDown className="size-4 text-muted-foreground" data-icon="inline-start" />
              <span>PDF 4.14.2a (Data Keluarga)</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-touch text-xs">
            <a
              href={`/api/export/pdf?jenis=data-warga&keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
              title="Unduh Lampiran 4.14.1a Data Warga"
            >
              <FileDown className="size-4 text-muted-foreground" data-icon="inline-start" />
              <span>PDF 4.14.1a (Data Warga)</span>
            </a>
          </Button>
          <PrintButton />
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="max-w-6xl mx-auto bg-white rounded-md shadow-md border border-border print:shadow-none print:border-none print:rounded-none overflow-hidden">
        <CatatanKeluargaPrint family={family as any} />
      </div>
    </div>
  );
}
