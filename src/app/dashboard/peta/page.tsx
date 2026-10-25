import React from 'react';
import { prisma } from '@/lib/prisma';
import { GisMap } from '@/components/map/GisMap';
import { MapHouseholdData, getPinColor, filterHouseholdsWithCoordinates } from '@/components/map/MapPinMarker';
import { calculateAge } from '@/lib/demographics';
import { getSessionUser, getScopeWilayahIds } from '@/lib/auth';
import { MapPin, AlertTriangle, ShieldCheck, Heart, Filter, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Peta Spasial Rumah Warga (GIS) - SIMPATIK',
};

export default async function PetaSpasialPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; rt?: string }>;
}) {
  const resolvedParams = await searchParams; // Next 16 convention
  const user = await getSessionUser();
  const scopeWilayahIds = await getScopeWilayahIds(user);

  const whereClause: any = {
    statusData: { not: 'ARSIP' },
  };

  if (scopeWilayahIds !== null) {
    if (resolvedParams.wilayahId && scopeWilayahIds.includes(resolvedParams.wilayahId)) {
      whereClause.wilayahId = resolvedParams.wilayahId;
    } else {
      whereClause.wilayahId = { in: scopeWilayahIds };
    }
  } else if (resolvedParams.wilayahId) {
    whereClause.wilayahId = resolvedParams.wilayahId;
  }

  const [families, wilayahList] = await Promise.all([
    prisma.keluarga.findMany({
      where: whereClause,
      include: {
        wilayah: true,
        anggota: {
          include: {
            peristiwaVital: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wilayah.findMany({
      where: scopeWilayahIds !== null ? { id: { in: scopeWilayahIds } } : {},
      orderBy: [{ rt: 'asc' }],
    }),
  ]);

  const now = new Date();

  const households: MapHouseholdData[] = families.map((f) => {
    let hasBalita = false;
    let hasIbuHamil = false;

    for (const m of f.anggota) {
      const age = calculateAge(m.tanggalLahir, now);
      if (age <= 5) {
        hasBalita = true;
      }
      for (const pv of m.peristiwaVital) {
        if (pv.jenisPeristiwa === 'KEHAMILAN') {
          hasIbuHamil = true;
        }
      }
    }

    return {
      id: f.id,
      noKk: f.noKk,
      namaKepalaRumahTangga: f.namaKepalaRumahTangga,
      alamat: f.alamat,
      latitude: f.latitude,
      longitude: f.longitude,
      kriteriaRumah: f.kriteriaRumah,
      jambanKeluarga: f.jambanKeluarga,
      jumlahAnggota: f.anggota.length,
      hasBalita,
      hasIbuHamil,
      wilayah: f.wilayah
        ? {
            rt: f.wilayah.rt,
            rw: f.wilayah.rw,
            namaDasawisma: f.wilayah.namaDasawisma,
          }
        : null,
    };
  });

  const validMapped = filterHouseholdsWithCoordinates(households);
  const redCount = validMapped.filter(
    (h) => getPinColor({ kriteriaRumah: h.kriteriaRumah, jambanKeluarga: h.jambanKeluarga, hasBalita: h.hasBalita, hasIbuHamil: h.hasIbuHamil }) === 'red'
  ).length;
  const yellowCount = validMapped.filter(
    (h) => getPinColor({ kriteriaRumah: h.kriteriaRumah, jambanKeluarga: h.jambanKeluarga, hasBalita: h.hasBalita, hasIbuHamil: h.hasIbuHamil }) === 'yellow'
  ).length;
  const greenCount = validMapped.filter(
    (h) => getPinColor({ kriteriaRumah: h.kriteriaRumah, jambanKeluarga: h.jambanKeluarga, hasBalita: h.hasBalita, hasIbuHamil: h.hasIbuHamil }) === 'green'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Peta Spasial Rumah Warga (GIS)</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisasi spasial sebaran rumah tangga, kepemilikan jamban, dan warga rentan berbasis geolokasi GPS.
          </p>
        </div>

        {/* RT Filter dropdown */}
        <form method="get" className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            name="wilayahId"
            defaultValue={resolvedParams.wilayahId || ''}
            className="flex min-h-touch rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
          >
            <option value="">Semua Wilayah RT</option>
            {wilayahList.map((w) => (
              <option key={w.id} value={w.id}>
                RT {w.rt} / RW {w.rw} ({w.namaDasawisma})
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" className="min-h-touch font-semibold">
            Filter Wilayah
          </Button>
        </form>
      </div>

      {/* KPI Cards & Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-secondary text-primary flex items-center justify-center shrink-0">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Terpetakan (GPS)</p>
              <p className="text-xl font-bold text-foreground">
                {validMapped.length}{' '}
                <span className="text-xs text-muted-foreground font-normal">/ {households.length} KK</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px] gap-1">
                  <AlertTriangle className="size-2.5" />
                  <span>Perhatian</span>
                </Badge>
              </div>
              <p className="text-xl font-bold text-destructive mt-0.5">
                {redCount} <span className="text-xs text-muted-foreground font-normal">KK</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Kurang sehat / Tanpa jamban</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Heart className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="warning" className="px-1.5 py-0 text-[10px] gap-1">
                  <Heart className="size-2.5" />
                  <span>Prioritas Posyandu</span>
                </Badge>
              </div>
              <p className="text-xl font-bold text-amber-700 mt-0.5">
                {yellowCount} <span className="text-xs text-muted-foreground font-normal">KK</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Ada Balita / Ibu Hamil</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="default" className="px-1.5 py-0 text-[10px] gap-1">
                  <ShieldCheck className="size-2.5" />
                  <span>Sehat Standar</span>
                </Badge>
              </div>
              <p className="text-xl font-bold text-primary mt-0.5">
                {greenCount} <span className="text-xs text-muted-foreground font-normal">KK</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Sanitasi &amp; jamban baik</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map Component */}
      <Card className="p-3 overflow-hidden shadow-sm">
        <GisMap households={households} />
      </Card>

      {/* Info note */}
      <Card className="bg-secondary/40 border-border">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-foreground text-sm">
            <Info className="size-4 text-primary" />
            <span>Petunjuk Navigasi Spasial</span>
          </div>
          <p>&bull; Klik pin marker untuk melihat ringkasan status sanitasi, jumlah jiwa, dan identitas kepala rumah tangga.</p>
          <p>&bull; Warna pin diperbarui secara otomatis berdasarkan kriteria sanitasi dan kelompok rentan (Balita &amp; Ibu Hamil).</p>
        </CardContent>
      </Card>
    </div>
  );
}
