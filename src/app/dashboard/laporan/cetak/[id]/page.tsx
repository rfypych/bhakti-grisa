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

        <div className="flex items-center gap-3">
          <a
            href={`/api/export/pdf?keluargaId=${family.id}&tahun=${new Date().getFullYear()}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh PDF Format Resmi (Sheet Excel)</span>
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
