import React from 'react';
import { getRecentPeristiwaVital, getEligibleMothers, getAllLivingMembers } from '@/actions/peristiwaActions';
import { PeristiwaClientWrapper } from '@/components/peristiwa/PeristiwaClientWrapper';
import { getSessionUser } from '@/lib/auth';
import { Activity, Baby, HeartCrack, Calendar, Heart, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata = {
  title: 'Lapor Peristiwa Vital - SIMPATIK',
};

export default async function LaporPeristiwaPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  await searchParams; // Next 16 convention

  const user = await getSessionUser();
  const canReport = !user || user.peran === 'ADMIN_DESA' || user.peran === 'KADER_RT';
  const targetWilayahId = user?.peran === 'KADER_RT' && user.wilayahId ? user.wilayahId : undefined;

  const [recentEvents, mothers, members] = await Promise.all([
    getRecentPeristiwaVital(30),
    canReport ? getEligibleMothers(targetWilayahId) : Promise.resolve([]),
    canReport ? getAllLivingMembers(targetWilayahId) : Promise.resolve([]),
  ]);

  const totalKelahiran = recentEvents.filter((e) => e.jenisPeristiwa === 'KELAHIRAN_BAYI').length;
  const totalKehamilan = recentEvents.filter((e) => e.jenisPeristiwa === 'KEHAMILAN').length;
  const totalNifas = recentEvents.filter((e) => e.jenisPeristiwa === 'NIFAS').length;
  const totalMutasi = recentEvents.filter((e) => e.jenisPeristiwa === 'MUTASI_KELUAR').length;
  const totalKematian = recentEvents.filter((e) =>
    ['KEMATIAN_IBU', 'KEMATIAN_BAYI', 'KEMATIAN_BALITA', 'KEMATIAN_WARGA'].includes(e.jenisPeristiwa)
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Modul Lapor Peristiwa</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pencatatan cepat dinamika kependudukan: kelahiran bayi, kehamilan, nifas, mutasi, dan kematian warga (Lampiran 4.18).
          </p>
        </div>

        {canReport ? (
          <PeristiwaClientWrapper mothers={mothers} members={members} />
        ) : (
          <div className="text-xs text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-md font-medium self-start sm:self-center">
            Mode Baca Log Peristiwa ({user?.peran === 'PENGURUS_RW' ? 'Pengurus RW' : 'Pengurus Dusun'})
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kelahiran</CardTitle>
            <Baby className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalKelahiran}</div>
            <p className="text-xs text-muted-foreground mt-1">Bayi baru lahir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kehamilan</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalKehamilan}</div>
            <p className="text-xs text-muted-foreground mt-1">Ibu hamil aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nifas</CardTitle>
            <Heart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalNifas}</div>
            <p className="text-xs text-muted-foreground mt-1">Ibu menyusui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mutasi Pindah</CardTitle>
            <Truck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalMutasi}</div>
            <p className="text-xs text-muted-foreground mt-1">Pindah domisili</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kematian</CardTitle>
            <HeartCrack className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalKematian}</div>
            <p className="text-xs text-muted-foreground mt-1">Warga meninggal</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Log Table */}
      <Card>
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Catatan Peristiwa Vital Terbaru</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Menampilkan {recentEvents.length} catatan log peristiwa kependudukan terkini (Lampiran 4.18)
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {recentEvents.length === 0 ? (
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia variant="icon">
                <Calendar className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Belum Ada Catatan</EmptyTitle>
              <EmptyDescription>
                Belum ada catatan peristiwa vital yang terekam di wilayah ini.
              </EmptyDescription>
            </Empty>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="whitespace-nowrap">Jenis Peristiwa</TableHead>
                  <TableHead className="whitespace-nowrap">Nama Terkait</TableHead>
                  <TableHead className="whitespace-nowrap">Wilayah / Keluarga</TableHead>
                  <TableHead>Detail & Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => {
                  const eventDate = new Date(event.tanggalPeristiwa).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  let badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' = 'secondary';
                  let eventLabel = event.jenisPeristiwa.replace(/_/g, ' ');
                  let EventIcon = Activity;

                  if (event.jenisPeristiwa === 'KELAHIRAN_BAYI') {
                    badgeVariant = 'default';
                    eventLabel = 'Kelahiran Bayi';
                    EventIcon = Baby;
                  } else if (event.jenisPeristiwa === 'KEHAMILAN') {
                    badgeVariant = 'outline';
                    eventLabel = 'Kehamilan';
                    EventIcon = Activity;
                  } else if (event.jenisPeristiwa === 'NIFAS') {
                    badgeVariant = 'outline';
                    eventLabel = 'Nifas / Menyusui';
                    EventIcon = Heart;
                  } else if (event.jenisPeristiwa === 'MUTASI_KELUAR') {
                    badgeVariant = 'secondary';
                    eventLabel = 'Mutasi Pindah';
                    EventIcon = Truck;
                  } else if (event.jenisPeristiwa.startsWith('KEMATIAN')) {
                    badgeVariant = 'destructive';
                    EventIcon = HeartCrack;
                    const DEATH_LABELS: Record<string, string> = {
                      KEMATIAN_IBU: 'Kematian Ibu',
                      KEMATIAN_BAYI: 'Kematian Bayi',
                      KEMATIAN_BALITA: 'Kematian Balita',
                      KEMATIAN_WARGA: 'Kematian Warga',
                    };
                    eventLabel = DEATH_LABELS[event.jenisPeristiwa] ?? 'Kematian Warga';
                  }

                  const personName = event.namaBayi || event.namaAlmarhum || event.anggota?.nama || '-';
                  const krtName = event.anggota?.keluarga?.namaKepalaRumahTangga || '-';
                  const rtInfo = event.anggota?.keluarga?.wilayah?.rt ? `RT ${event.anggota.keluarga.wilayah.rt}` : '-';

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {eventDate}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={badgeVariant} className="gap-1 font-semibold">
                          <EventIcon className="size-3" />
                          <span>{eventLabel}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {personName}
                        {event.jenisKelaminBayi && (
                          <span className="ml-1 text-xs text-muted-foreground font-normal">
                            ({event.jenisKelaminBayi === 'L' ? 'Laki-laki' : 'Perempuan'})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{krtName}</div>
                        <div className="text-xs text-muted-foreground">{rtInfo}</div>
                      </TableCell>
                      <TableCell>
                        {event.sebabKematian && (
                          <span className="font-medium text-destructive">Penyebab: {event.sebabKematian}. </span>
                        )}
                        {event.keterangan || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
