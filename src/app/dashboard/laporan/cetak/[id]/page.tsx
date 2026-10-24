import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CatatanKeluargaPrint } from '@/components/print/CatatanKeluargaPrint';
import Link from 'next/link';
import { Printer, ArrowLeft, FileDown } from 'lucide-react';
import { PrintButton } from './PrintButton';

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
    <div className="min-h-screen bg-stone-100 py-6 px-4 print:bg-white print:p-0 print:m-0">
      {/* Action Navigation Bar (Hidden when printing) */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-stone-200" />
          <span className="text-xs text-stone-600 font-medium">
            Pratinjau Format Cetak Resmi — <b>Lampiran 4.15</b>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/export/pdf?jenis=catatan-keluarga&keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition-colors"
            title="Unduh Lampiran 4.15 Catatan Keluarga"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF 4.15 (Catatan Keluarga)</span>
          </a>
          <a
            href={`/api/export/pdf?jenis=data-keluarga&keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-200 transition-colors"
            title="Unduh Lampiran 4.14.2a Data Keluarga"
          >
            <FileDown className="w-3.5 h-3.5 text-stone-500" />
            <span>PDF 4.14.2a (Data Keluarga)</span>
          </a>
          <a
            href={`/api/export/pdf?jenis=data-warga&keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-200 transition-colors"
            title="Unduh Lampiran 4.14.1a Data Warga"
          >
            <FileDown className="w-3.5 h-3.5 text-stone-500" />
            <span>PDF 4.14.1a (Data Warga)</span>
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md border border-stone-200 print:shadow-none print:border-none print:rounded-none overflow-hidden">
        <CatatanKeluargaPrint family={family as any} />
      </div>
    </div>
  );
}
