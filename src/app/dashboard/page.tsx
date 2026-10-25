import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  getAggregationDesa,
  getAggregationDasawisma,
  getAggregationRW,
  getAggregationDusun,
} from '@/lib/aggregation';
import { getSessionUser, getScopeWilayahIds } from '@/lib/auth';
import {
  Users,
  Home,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  FileDown,
  Activity,
  Printer,
  Filter,
  CheckCircle2,
  Droplets,
  Heart,
  Baby,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata = {
  title: 'Dashboard Eksekutif PKK - SIMPATIK',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; tahun?: string; notice?: string }>;
}) {
  const resolvedParams = await searchParams; // Next 16 convention
  const currentYear = new Date().getFullYear();
  const activeYear = resolvedParams.tahun ? parseInt(resolvedParams.tahun, 10) || currentYear : currentYear;

  const user = await getSessionUser();
  const scopeWilayahIds = await getScopeWilayahIds(user);

  let effectiveWilayahId = resolvedParams.wilayahId;
  if (user?.peran === 'KADER_RT' && user.wilayahId) {
    effectiveWilayahId = user.wilayahId;
  } else if (scopeWilayahIds !== null && effectiveWilayahId && !scopeWilayahIds.includes(effectiveWilayahId)) {
    effectiveWilayahId = undefined;
  }

  const allowedWilayahList =
    scopeWilayahIds !== null
      ? await prisma.wilayah.findMany({
          where: { id: { in: scopeWilayahIds } },
          orderBy: { rt: 'asc' },
        })
      : await prisma.wilayah.findMany({ orderBy: { rt: 'asc' } });

  const familiesCondition: any = { statusData: 'VERIFIKASI' };
  if (effectiveWilayahId) {
    familiesCondition.wilayahId = effectiveWilayahId;
  } else if (scopeWilayahIds !== null) {
    familiesCondition.wilayahId = { in: scopeWilayahIds };
  }

  const pendingCondition: any = { statusData: 'DRAFT' };
  if (effectiveWilayahId) {
    pendingCondition.wilayahId = effectiveWilayahId;
  } else if (scopeWilayahIds !== null) {
    pendingCondition.wilayahId = { in: scopeWilayahIds };
  }

  const [pendingCount, recentFamilies] = await Promise.all([
    prisma.keluarga.count({ where: pendingCondition }),
    prisma.keluarga.findMany({
      where: familiesCondition,
      include: {
        wilayah: true,
        anggota: true,
      },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  // Compute aggregation statistics
  let aggData;
  if (effectiveWilayahId) {
    aggData = await getAggregationDasawisma(effectiveWilayahId, { tahun: activeYear, semester: 'TAHUNAN' });
  } else if (user?.peran === 'PENGURUS_RW' && user.wilayah) {
    aggData = await getAggregationRW(user.wilayah.rw, { tahun: activeYear, semester: 'TAHUNAN' }, { dusun: user.wilayah.dusun });
  } else if (user?.peran === 'PENGURUS_DUSUN' && user.wilayah) {
    aggData = await getAggregationDusun(user.wilayah.dusun, { tahun: activeYear, semester: 'TAHUNAN' });
  } else {
    aggData = await getAggregationDesa({ tahun: activeYear, semester: 'TAHUNAN' });
  }

  const activeWilayah = allowedWilayahList.find((w) => w.id === effectiveWilayahId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-8">
      {resolvedParams.notice && (
        <div
          role="alert"
          className="p-4 bg-warning/10 border border-warning/30 rounded-md flex items-center gap-2.5 text-sm text-foreground font-medium"
        >
          <AlertTriangle className="size-5 text-amber-700 shrink-0" />
          <span>{resolvedParams.notice}</span>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Badge variant="secondary" className="font-bold text-xs uppercase tracking-wider text-primary">
            Pusat Data Administrasi Terpadu
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-2">
            Dashboard Statistik TP PKK
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeWilayah
              ? `Rekapitulasi Wilayah: ${activeWilayah.namaDasawisma} (RT ${activeWilayah.rt} / RW ${activeWilayah.rw}) : Tahun ${activeYear}`
              : user?.peran === 'PENGURUS_RW' && user.wilayah
              ? `Rekapitulasi Agregat RW ${user.wilayah.rw} (${user.wilayah.dusun}) : Tahun ${activeYear}`
              : user?.peran === 'PENGURUS_DUSUN' && user.wilayah
              ? `Rekapitulasi Agregat ${user.wilayah.dusun} : Tahun ${activeYear}`
              : `Rekapitulasi Agregat Seluruh Wilayah Desa Grudo : Tahun ${activeYear}`}
          </p>
        </div>

        {/* Filter & Export Action Group */}
        <div className="flex flex-col items-start md:items-end gap-3 self-start md:self-auto">
          {/* Filter Wilayah & Tahun Form */}
          <form method="get" className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              name="wilayahId"
              disabled={user?.peran === 'KADER_RT'}
              defaultValue={effectiveWilayahId || ''}
              className="flex min-h-touch rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium disabled:opacity-50"
            >
              {user?.peran !== 'KADER_RT' && (
                <option value="">
                  {user?.peran === 'PENGURUS_RW'
                    ? `Seluruh RW ${user.wilayah?.rw || ''}`
                    : user?.peran === 'PENGURUS_DUSUN'
                    ? `Seluruh ${user.wilayah?.dusun || 'Dusun'}`
                    : 'Semua Wilayah Desa'}
                </option>
              )}
              {allowedWilayahList.map((w) => (
                <option key={w.id} value={w.id}>
                  RT {w.rt} / RW {w.rw} ({w.namaDasawisma})
                </option>
              ))}
            </select>
            <input
              type="number"
              name="tahun"
              defaultValue={activeYear}
              className="flex min-h-touch w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              placeholder="Tahun"
            />
            <Button type="submit" size="sm" className="min-h-touch font-semibold">
              Tampilkan Data
            </Button>
          </form>

          {/* Quick Export Group: Excel + PDF Rekap */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="min-h-touch text-xs">
              <a
                href={`/api/export/excel?tahun=${activeYear}`}
                title="Unduh seluruh 31 sheet berkas master Excel"
              >
                <FileSpreadsheet className="size-4 text-primary" data-icon="inline-start" />
                <span>Unduh Excel</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-touch text-xs">
              <a
                href={`/api/export/pdf?jenis=rekap-dasawisma&tahun=${activeYear}${resolvedParams.wilayahId ? `&wilayahId=${resolvedParams.wilayahId}` : ''}`}
                title="Unduh PDF Format Resmi Rekap Dasawisma (Lampiran 4.16a)"
              >
                <FileDown className="size-4 text-destructive" data-icon="inline-start" />
                <span>PDF Rekap Dasawisma (4.16a)</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-touch text-xs">
              <a
                href={`/api/export/pdf?jenis=rekap-desa&tahun=${activeYear}`}
                title="Unduh PDF Format Resmi Rekap Desa (Lampiran 4.17a)"
              >
                <FileDown className="size-4 text-destructive" data-icon="inline-start" />
                <span>PDF Rekap Desa (4.17a)</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Verification Notification Alert Banner */}
      {pendingCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Ada {pendingCount} pengajuan data mandiri warga yang menunggu verifikasi
                </p>
                <p className="text-xs text-muted-foreground">
                  Periksa kesesuaian data Kartu Keluarga sebelum disahkan ke buku rekap resmi.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="min-h-touch self-stretch sm:self-auto font-semibold bg-amber-700 hover:bg-amber-800 text-white">
              <Link href="/dashboard/verifikasi">
                Buka Antrean Verifikasi
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Aggregation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Keluarga (KK)</p>
            <p className="text-2xl font-extrabold text-foreground">{aggData.totalKeluarga}</p>
            <Badge variant="default" className="text-[10px] font-semibold gap-1">
              <CheckCircle2 className="size-3" />
              <span>100% Terverifikasi</span>
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Jiwa (Warga)</p>
            <p className="text-2xl font-extrabold text-foreground">{aggData.totalAnggota}</p>
            <span className="text-xs text-muted-foreground block font-mono">
              {aggData.totalLakiLaki} L &bull; {aggData.totalPerempuan} P
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Balita (&le; 5 Th)</p>
            <p className="text-2xl font-extrabold text-amber-700">{aggData.totalBalita}</p>
            <span className="text-xs text-muted-foreground block font-mono">
              {aggData.totalBalitaL} L &bull; {aggData.totalBalitaP} P
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Lansia (&ge; 60 Th)</p>
            <p className="text-2xl font-extrabold text-foreground">{aggData.totalLansia}</p>
            <span className="text-xs text-muted-foreground block">Prioritas Posyandu</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Rumah Sehat</p>
            <p className="text-2xl font-extrabold text-primary">{aggData.totalRumahSehat}</p>
            <span className="text-xs text-muted-foreground block font-medium">
              {aggData.totalRumahKurangSehat} Kurang Sehat
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Jamban Keluarga</p>
            <p className="text-2xl font-extrabold text-foreground">{aggData.totalJamban}</p>
            <Badge variant="outline" className="text-[10px] font-semibold text-primary">
              Layak Sanitasi
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Bar */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block text-xs">Pasangan Usia Subur (PUS)</span>
            <span className="font-bold text-foreground text-sm">{aggData.totalPus} Pasangan</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Wanita Usia Subur (WUS)</span>
            <span className="font-bold text-foreground text-sm">{aggData.totalWus} Jiwa</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Ibu Hamil Aktif</span>
            <span className="font-bold text-amber-700 text-sm">{aggData.totalIbuHamil} Bumil</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Ibu Nifas / Menyusui</span>
            <span className="font-bold text-primary text-sm">{aggData.totalIbuMenyusui} Ibu</span>
          </div>
        </CardContent>
      </Card>

      {/* Data Records & Actions Table */}
      <Card>
        <CardHeader className="border-b border-border py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Daftar Keluarga Terverifikasi</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Menampilkan {recentFamilies.length} kepala keluarga terbaru yang sah dalam buku rekapitulasi.
            </CardDescription>
          </div>

          <Button asChild variant="outline" size="sm" className="min-h-touch text-xs self-start sm:self-auto">
            <Link href="/dashboard/peta">
              <MapPin className="size-4 text-primary" data-icon="inline-start" />
              <span>Lihat di Peta Spasial</span>
            </Link>
          </Button>
        </CardHeader>

        {recentFamilies.length === 0 ? (
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Belum ada keluarga dengan status terverifikasi di wilayah ini.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">No. KK</TableHead>
                  <TableHead className="whitespace-nowrap">Kepala Rumah Tangga</TableHead>
                  <TableHead className="whitespace-nowrap">Wilayah Dasawisma</TableHead>
                  <TableHead className="whitespace-nowrap">Anggota</TableHead>
                  <TableHead className="whitespace-nowrap">Kriteria Rumah</TableHead>
                  <TableHead className="whitespace-nowrap">Jamban</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFamilies.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono font-medium text-foreground whitespace-nowrap">
                      {f.noKk}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground whitespace-nowrap">
                        {f.namaKepalaRumahTangga}
                      </div>
                      <span className="block text-xs text-muted-foreground truncate max-w-xs">
                        {f.alamat}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium text-foreground">{f.wilayah?.namaDasawisma || '-'}</span>
                      <span className="block text-xs text-muted-foreground">
                        RT {f.wilayah?.rt || '-'} / RW {f.wilayah?.rw || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {f.anggota.length} Jiwa
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={f.kriteriaRumah === 'SEHAT' ? 'default' : 'warning'}
                        className="gap-1 font-semibold"
                      >
                        {f.kriteriaRumah === 'SEHAT' ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>Layak Huni</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="size-3" />
                            <span>Kurang Sehat</span>
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {f.jambanKeluarga ? (
                        <span className="text-primary font-medium flex items-center gap-1 text-xs">
                          <CheckCircle2 className="size-3" />
                          <span>Tersedia ({f.jumlahJamban})</span>
                        </span>
                      ) : (
                        <span className="text-destructive font-medium flex items-center gap-1 text-xs">
                          <AlertTriangle className="size-3" />
                          <span>Tidak Ada</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button asChild variant="outline" size="sm" className="min-h-touch text-xs">
                        <Link href={`/dashboard/laporan/cetak/${f.id}`}>
                          <Printer className="size-3.5 text-primary" data-icon="inline-start" />
                          <span>Cetak Lampiran 4.15</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
