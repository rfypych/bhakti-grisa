import React from 'react';
import { getRecentPeristiwaVital, getEligibleMothers, getAllLivingMembers } from '@/actions/peristiwaActions';
import { PeristiwaClientWrapper } from '@/components/peristiwa/PeristiwaClientWrapper';
import { getSessionUser } from '@/lib/auth';
import { Activity, Baby, HeartCrack, Calendar, Heart, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Baby className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Kelahiran</p>
              <p className="text-xl font-bold text-foreground">{totalKelahiran}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Kehamilan</p>
              <p className="text-xl font-bold text-foreground">{totalKehamilan}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0">
              <Heart className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nifas</p>
              <p className="text-xl font-bold text-foreground">{totalNifas}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-secondary text-primary flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mutasi Pindah</p>
              <p className="text-xl font-bold text-foreground">{totalMutasi}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <HeartCrack className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Kematian</p>
              <p className="text-xl font-bold text-foreground">{totalKematian}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Log Table */}
      <Card>
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Catatan Peristiwa Vital Terbaru</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Menampilkan {recentEvents.length} catatan log peristiwa kependudukan terkini
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {recentEvents.length === 0 ? (
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <Calendar className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium">Belum ada catatan peristiwa vital yang terekam.</p>
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
