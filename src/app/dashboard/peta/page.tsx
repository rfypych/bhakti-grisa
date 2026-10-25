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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terpetakan (GPS)</CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {validMapped.length}{' '}
              <span className="text-xs font-normal text-muted-foreground">/ {households.length} KK</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Koordinat valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perhatian</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-destructive">
              {redCount} <span className="text-xs font-normal text-muted-foreground">KK</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kurang sehat / Tanpa jamban</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prioritas Posyandu</CardTitle>
            <Heart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {yellowCount} <span className="text-xs font-normal text-muted-foreground">KK</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ada Balita / Ibu Hamil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sehat Standar</CardTitle>
            <ShieldCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {greenCount} <span className="text-xs font-normal text-muted-foreground">KK</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sanitasi &amp; jamban baik</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map Component */}
      <Card className="p-3 overflow-hidden shadow-sm">
        <GisMap households={households} />
      </Card>

      {/* Info note */}
      <Card className="bg-muted/40 border-border">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
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
