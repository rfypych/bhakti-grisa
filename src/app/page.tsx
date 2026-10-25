import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  FileSpreadsheet,
  MapPin,
  ClipboardList,
  Activity,
  Users,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  LayoutDashboard,
  Building2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Live database queries for dynamic village counts and RT list
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
    <div className="flex flex-col gap-10 md:gap-14 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Village Header Banner (Flat, Honest, Warm Paper & Village Green) */}
      <Card className="p-6 sm:p-10 border-border shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
              <Building2 className="size-3.5 text-primary" />
              <span>Pemerintah Desa Grudo &bull; Tim Penggerak PKK</span>
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Keluarga
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Layanan pendataan Dasawisma, verifikasi berjenjang RT, pemetaan rumah sehat, dan rekapitulasi otomatis 31 buku resmi PKK Desa Grudo.
          </p>
        </div>

        {/* Primary Action Buttons (48px touch targets, full width on mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Button asChild size="default" className="min-h-touch w-full sm:w-auto text-base">
            <Link href="/formulir">
              <PlusCircle className="size-5" data-icon="inline-start" />
              <span>Isi Formulir Keluarga Mandiri</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="default" className="min-h-touch w-full sm:w-auto text-base">
            <Link href="/dashboard">
              <LayoutDashboard className="size-5 text-primary" data-icon="inline-start" />
              <span>Buka Dashboard Statistik</span>
            </Link>
          </Button>
        </div>

        {/* Real Data Counter Cards (Truthful data from database) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-10 rounded-md bg-background border border-border flex items-center justify-center shrink-0">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground block leading-none">
                {totalKeluarga}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1 block">
                Kepala Keluarga Terdata
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-10 rounded-md bg-background border border-border flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground block leading-none">
                {totalAnggota}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1 block">
                Jiwa Warga Tercatat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-10 rounded-md bg-background border border-border flex items-center justify-center shrink-0">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground block leading-none">
                {pendingDrafts}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1 block">
                Pengajuan Menunggu Verifikasi
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* RT Selection Portal for Residents */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Pilih Wilayah RT untuk Pengisian Formulir
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Warga dapat langsung memilih RT tempat tinggal untuk mengisi data keluarga secara mandiri. Data akan divalidasi oleh Kader RT setempat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {wilayahList.length === 0 ? (
            <Card className="col-span-full p-8 text-center">
              <CardDescription className="text-base">
                Belum ada data wilayah tersimpan di sistem. Silakan hubungi Admin Desa.
              </CardDescription>
            </Card>
          ) : (
            wilayahList.map((w) => (
              <Link
                key={w.id}
                href={`/formulir?wilayahId=${w.id}`}
                className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-ring/40 transition-colors min-h-[72px]"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                      RT {w.rt} / RW {w.rw}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Dusun {w.dusun}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mt-1">
                    {w.namaDasawisma}
                  </h3>
                </div>

                <div className="size-9 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowRight className="size-4" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Modul Kerja Tim Penggerak PKK */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Modul Kerja Tim Penggerak PKK
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Akses instrumen administrasi kependudukan dan monitoring lapangan untuk kader dan pengurus
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-ring/40 transition-colors flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <div className="size-10 rounded-md bg-muted text-foreground flex items-center justify-center mb-3">
                <LayoutDashboard className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">Dashboard Statistik</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                Ringkasan demografi, data keluarga, dan rekapitulasi berjenjang tingkat RT, RW, dan Desa.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button asChild variant="outline" size="sm" className="w-full min-h-touch text-sm">
                <Link href="/dashboard">Buka Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-ring/40 transition-colors flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <div className="size-10 rounded-md bg-muted text-foreground flex items-center justify-center mb-3">
                <ClipboardList className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">Antrean Verifikasi</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                Validasi dan persetujuan pengajuan mandiri warga dengan fitur komparasi data lama dan baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button asChild variant="outline" size="sm" className="w-full min-h-touch text-sm">
                <Link href="/dashboard/verifikasi">Periksa Antrean</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-ring/40 transition-colors flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <div className="size-10 rounded-md bg-muted text-foreground flex items-center justify-center mb-3">
                <Activity className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">Lapor Peristiwa Vital</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                Pencatatan cepat kelahiran, kehamilan, dan kematian warga secara otomatis (Lampiran 4.18).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button asChild variant="outline" size="sm" className="w-full min-h-touch text-sm">
                <Link href="/dashboard/lapor-peristiwa">Catat Peristiwa</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-ring/40 transition-colors flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <div className="size-10 rounded-md bg-muted text-foreground flex items-center justify-center mb-3">
                <MapPin className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">Peta Spasial GIS</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                Pemetaan interaktif rumah sehat, kepemilikan jamban, serta sebaran balita dan ibu hamil.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button asChild variant="outline" size="sm" className="w-full min-h-touch text-sm">
                <Link href="/dashboard/peta">Lihat Peta</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Excel Download Section (Flat, Honest, Clear) */}
      <Card className="bg-muted/40 border-border p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col gap-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-background">
              Mesin Template Master
            </Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Unduh Rekapitulasi 31 Sheet Buku Resmi PKK
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hasil agregasi kependudukan diinjeksikan langsung ke dalam template resmi Kemendagri tanpa mengubah format dan susunan sel baku.
          </p>
        </div>

        <Button asChild size="default" className="w-full md:w-auto min-h-touch text-base shrink-0">
          <a href="/api/export/excel">
            <FileSpreadsheet className="size-5" data-icon="inline-start" />
            <span>Unduh Rekapitulasi Excel</span>
          </a>
        </Button>
      </Card>
    </div>
  );
}
