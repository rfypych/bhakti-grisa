import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  Activity,
  MapPin,
  Layers,
  Users,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileBottomBar } from '@/components/layout/MobileBottomBar';
import { UserNavHeader } from '@/components/layout/UserNavHeader';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SIMPATIK - Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga',
  description: 'Inisiatif Program Inovasi & Pengabdian Masyarakat Bhakti Grisa, Desa Grudo, Ngawi.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const isAdmin = user?.peran === 'ADMIN_DESA';
  const canVerify = !user || user.peran === 'ADMIN_DESA' || user.peran === 'KADER_RT';

  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navigation Bar (Hidden in print mode) */}
        <header className="sticky top-0 z-40 bg-card border-b border-border print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  SP
                </div>
                <div>
                  <span className="font-bold text-foreground tracking-tight text-base block leading-none">
                    SIMPATIK
                  </span>
                  <span className="text-[11px] text-primary font-medium uppercase tracking-wider block mt-1">
                    Bhakti Grisa &bull; Desa Grudo
                  </span>
                </div>
              </Link>

              <nav className="hidden xl:flex items-center gap-1 text-sm font-medium text-muted-foreground shrink-0">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 min-h-touch whitespace-nowrap"
                >
                  <LayoutDashboard className="size-4 text-primary shrink-0" />
                  <span className="whitespace-nowrap">Dashboard</span>
                </Link>
                {canVerify && (
                  <Link
                    href="/dashboard/verifikasi"
                    className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 min-h-touch whitespace-nowrap"
                  >
                    <ClipboardList className="size-4 text-primary shrink-0" />
                    <span className="whitespace-nowrap">Verifikasi</span>
                  </Link>
                )}
                <Link
                  href="/dashboard/lapor-peristiwa"
                  className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 min-h-touch whitespace-nowrap"
                >
                  <Activity className="size-4 text-primary shrink-0" />
                  <span className="whitespace-nowrap">Lapor Peristiwa</span>
                </Link>
                <Link
                  href="/dashboard/peta"
                  className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 min-h-touch whitespace-nowrap"
                >
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span className="whitespace-nowrap">Peta Spasial</span>
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/dashboard/wilayah"
                      className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 min-h-touch whitespace-nowrap"
                    >
                      <Layers className="size-4 text-primary shrink-0" />
                      <span className="whitespace-nowrap">Wilayah</span>
                    </Link>
                    <Link
                      href="/dashboard/pengguna"
                      className="px-3 py-2 rounded-md hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 min-h-touch whitespace-nowrap"
                    >
                      <Users className="size-4 text-primary shrink-0" />
                      <span className="whitespace-nowrap">Pengguna</span>
                    </Link>
                  </>
                )}
              </nav>

              <MobileNav userRole={user?.peran} />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex min-h-touch text-sm">
                <a href="/api/export/excel">
                  <FileSpreadsheet className="size-4 text-primary" data-icon="inline-start" />
                  <span>Unduh Excel</span>
                </a>
              </Button>

              <Button asChild size="sm" className="hidden lg:inline-flex min-h-touch text-sm">
                <Link href="/formulir">
                  <PlusCircle className="size-4" data-icon="inline-start" />
                  <span>Isi Data Keluarga</span>
                </Link>
              </Button>

              <UserNavHeader user={user} />
            </div>
          </div>
        </header>

        {/* Main Content View with padding-bottom on mobile for the bottom bar */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile Dedicated Bottom Bar */}
        <MobileBottomBar userRole={user?.peran} />

        {/* Footer (Hidden in print mode) */}
        <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground print:hidden">
          <div className="max-w-5xl mx-auto px-4 space-y-2">
            <p className="font-bold text-foreground">
              SIMPATIK &copy; {new Date().getFullYear()} : Inisiatif Program Pengabdian Masyarakat Bhakti Grisa
            </p>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Kependudukan Keluarga Dasawisma Desa Grudo, Kecamatan Ngawi, Kabupaten Ngawi.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
