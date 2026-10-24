import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Home, ClipboardList, Activity, MapPin, FileSpreadsheet, PlusCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SIMPATIK - Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga',
  description: 'Inisiatif Program Inovasi & Pengabdian Masyarakat Bhakti Grisa, Desa Demaan, Kudus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-stone-50">
        {/* Navigation Bar (Hidden in print mode) */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  SP
                </div>
                <div>
                  <span className="font-extrabold text-stone-900 tracking-tight text-base">SIMPATIK</span>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block -mt-1">
                    Bhakti Grisa &bull; Demaan
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-stone-600">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg hover:text-emerald-800 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/verifikasi"
                  className="px-3 py-1.5 rounded-lg hover:text-emerald-800 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Verifikasi</span>
                </Link>
                <Link
                  href="/dashboard/lapor-peristiwa"
                  className="px-3 py-1.5 rounded-lg hover:text-emerald-800 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-4 h-4" />
                  <span>Lapor Peristiwa</span>
                </Link>
                <Link
                  href="/dashboard/peta"
                  className="px-3 py-1.5 rounded-lg hover:text-emerald-800 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Peta Spasial</span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/api/export/excel"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Unduh Excel (31 Sheet)</span>
              </a>

              <Link
                href="/formulir"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Input Data Keluarga</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1">{children}</main>

        {/* Footer (Hidden in print mode) */}
        <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500 print:hidden">
          <p className="font-semibold text-stone-700">
            SIMPATIK &copy; {new Date().getFullYear()} — Inisiatif Bhakti Grisa
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Sistem Informasi Manajemen PKK & Tertib Administrasi Kependudukan Keluarga Desa Demaan, Kudus.
          </p>
        </footer>
      </body>
    </html>
  );
}
