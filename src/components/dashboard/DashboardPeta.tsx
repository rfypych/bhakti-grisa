'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Users,
  Droplets,
  Sprout,
  Layers,
} from 'lucide-react';
import {
  AppRoute,
  KeluargaRecord,
  OfficerAccount,
  SeverityPin,
  UserRole,
  Wilayah,
  computeHouseholdSeverity,
  extractUniqueDusun,
  filterFamiliesByRoleScope,
  filterWilayahByRoleScope,
  getRbacPermissions,
} from '@/lib/domain';
import {
  BoardButton,
  BoardSurface,
  BoardSegmentedControl,
  BoardStatusLabel,
} from '@/components/simpatik';
import { GisMap } from '@/components/map/GisMap';
import { MapHouseholdData } from '@/components/map/MapPinMarker';

export interface DashboardPetaProps {
  families: KeluargaRecord[];
  wilayahList: Wilayah[];
  currentUser: OfficerAccount | null;
  currentRole: UserRole;
  onNavigate?: (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => void;
}

// Coordinate projection bounds for Desa Grudo, Kec. Ngawi
const LAT_MIN = -7.412;
const LAT_MAX = -7.404;
const LNG_MIN = 111.436;
const LNG_MAX = 111.4465;

export function DashboardPeta({
  families,
  wilayahList,
  currentUser,
  currentRole,
  onNavigate,
}: DashboardPetaProps) {
  const router = useRouter();
  const [wilayahFilter, setWilayahFilter] = useState<string>('SEMUA');
  const [severityFilter, setSeverityFilter] = useState<'SEMUA' | SeverityPin>('SEMUA');
  const [mapStyle, setMapStyle] = useState<'CADASTRE' | 'TOPO'>('CADASTRE');
  const [zoom, setZoom] = useState<number>(1);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  const perms = getRbacPermissions(currentRole, currentUser);
  const scopedWilayah = filterWilayahByRoleScope(wilayahList, currentRole, currentUser);
  const scopedFamilies = filterFamiliesByRoleScope(families, currentRole, currentUser).filter(
    (f) => f.status === 'VERIFIKASI'
  );

  const mappedHouseholds = scopedFamilies
    .map((fam) => ({
      fam,
      sev: computeHouseholdSeverity(fam),
    }))
    .filter((item) => {
      const matchWil =
        wilayahFilter === 'SEMUA' || item.fam.wilayahId === wilayahFilter;
      const matchSev =
        severityFilter === 'SEMUA' || item.sev.severity === severityFilter;
      return matchWil && matchSev;
    });

  const householdsForMap: MapHouseholdData[] = mappedHouseholds.map(({ fam }) => ({
    id: fam.id,
    noKk: fam.noKK,
    namaKepalaRumahTangga: fam.namaKepalaKeluarga,
    alamat: fam.alamat,
    latitude: fam.latitude,
    longitude: fam.longitude,
    kriteriaRumah: fam.sanitasi.kriteriaRumah,
    jambanKeluarga: fam.sanitasi.punyaJamban,
    jumlahAnggota: fam.anggota.length,
    hasBalita: fam.anggota.some((a) => a.isBalita || (a.umur ?? 0) <= 5),
    hasIbuHamil: fam.anggota.some((a) => a.isIbuHamil),
    wilayah: {
      rt: fam.rt,
      rw: fam.rw,
      namaDasawisma: fam.namaDasawisma,
    },
  }));

  const activeHousehold =
    mappedHouseholds.find((h) => h.fam.id === selectedFamilyId) ||
    mappedHouseholds[0] ||
    null;

  const countMerah = scopedFamilies.filter(
    (f) => computeHouseholdSeverity(f).severity === 'MERAH'
  ).length;
  const countKuning = scopedFamilies.filter(
    (f) => computeHouseholdSeverity(f).severity === 'KUNING'
  ).length;
  const countHijau = scopedFamilies.filter(
    (f) => computeHouseholdSeverity(f).severity === 'HIJAU'
  ).length;

  const projectCoord = (lat: number, lng: number) => {
    const xPct = Math.min(92, Math.max(8, ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 84 + 8));
    const yPct = Math.min(90, Math.max(10, ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 80 + 10));
    return { xPct, yPct };
  };

  const handleNavigateCetak = (familyId: string) => {
    if (onNavigate) {
      onNavigate('/dashboard/laporan/cetak', { cetakId: familyId });
    } else {
      router.push(`/dashboard/laporan/cetak/${familyId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Spatial Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-default border border-separator-border rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-accent-600 dark:text-accent-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>Sistem Informasi Geografis (GIS) Kependudukan &amp; Sanitasi · {perms.scopeLabel}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Peta Spasial Rumah Warga &amp; Indeks Kerentanan Desa Grudo
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter wilayah peta spasial"
            value={wilayahFilter}
            onChange={(e) => setWilayahFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-surface-subtle border border-separator-border rounded-lg text-text-primary"
          >
            <option value="SEMUA">Semua RT/Dasawisma ({scopedWilayah.length})</option>
            {scopedWilayah.map((w) => (
              <option key={w.id} value={w.id}>
                Dasawisma {w.namaDasawisma} — RT {w.rt}/RW {w.rw} ({w.dusun})
              </option>
            ))}
          </select>

          <BoardSegmentedControl
            ariaLabel="Filter kode warna pin kerentanan"
            value={severityFilter}
            onChange={setSeverityFilter}
            options={[
              { value: 'SEMUA', label: 'Semua Pin', count: scopedFamilies.length },
              { value: 'MERAH', label: '✕ Merah', count: countMerah },
              { value: 'KUNING', label: '! Kuning', count: countKuning },
              { value: 'HIJAU', label: '✓ Hijau', count: countHijau },
            ]}
          />
        </div>
      </div>

      {/* Main GIS Split View: Interactive Map Canvas (Left 8 Cols) + Household Inspector Popup (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Interactive GIS Map Viewport */}
        <div className="lg:col-span-8 flex flex-col">
          <BoardSurface padding="none" className="overflow-hidden flex-1 flex flex-col">
            {/* Map Toolbar */}
            <div className="px-4 py-2.5 bg-surface-subtle border-b border-separator-border flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 font-mono text-text-secondary">
                <span>Peta Kadastral Desa Grudo (-7.4065°S, 111.4395°E)</span>
                <span aria-hidden="true">·</span>
                <span>{mappedHouseholds.length} Titik Rumah Aktif</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapStyle(mapStyle === 'CADASTRE' ? 'TOPO' : 'CADASTRE')}
                  className="px-2.5 py-1 rounded bg-surface-default border border-separator-border text-text-secondary hover:text-text-primary inline-flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Layer: {mapStyle === 'CADASTRE' ? 'Kadastral RT/RW' : 'Topografi Air'}</span>
                </button>
                <button
                  type="button"
                  aria-label="Perbesar peta"
                  onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.2).toFixed(1))))}
                  className="p-1.5 rounded bg-surface-default border border-separator-border text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Perkecil peta"
                  onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                  className="p-1.5 rounded bg-surface-default border border-separator-border text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Reset zoom peta"
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded bg-surface-default border border-separator-border text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Real Interactive Leaflet OpenStreetMap Surface */}
            <div
              data-testid="gis-map-canvas"
              className="relative w-full h-[520px] overflow-hidden select-none bg-surface-subtle"
            >
              <GisMap households={householdsForMap} />

              {/* Dusun Indicators & Landmarks Overlay */}
              <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 pointer-events-none">
                {extractUniqueDusun(scopedWilayah.length > 0 ? scopedWilayah : wilayahList).map((dusun) => (
                  <span
                    key={dusun}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 dark:bg-slate-900/95 text-teal-800 dark:text-teal-300 border border-teal-500/40 shadow-xs pointer-events-auto"
                  >
                    {`DUSUN ${dusun.toUpperCase()}`}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white border border-slate-700 shadow-xs pointer-events-auto">
                  BALAI DESA
                </span>
              </div>
            </div>

            {/* Map Legend Bar */}
            <div className="px-4 py-3 bg-surface-default border-t border-separator-border flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-text-primary">Legenda Indikator Pin:</span>
                <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400 font-medium">
                  <span className="font-mono font-bold">[✕ Merah]</span> Kerentanan Tinggi (Tanpa
                  Jamban / Rumah Tidak Sehat / Bumil Risiko)
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                  <span className="font-mono font-bold">[! Kuning]</span> Pantauan Gizi (Balita /
                  Lansia / Kurang Sehat)
                </span>
                <span className="inline-flex items-center gap-1.5 text-accent-600 dark:text-accent-400 font-medium">
                  <span className="font-mono font-bold">[✓ Hijau]</span> Rumah Sehat &amp; Pekarangan
                  Aktif
                </span>
              </div>
            </div>
          </BoardSurface>
        </div>

        {/* Right 4 Cols: Popup Profil Rumah Tangga (Selected Pin Inspector) */}
        <div className="lg:col-span-4 flex flex-col">
          <BoardSurface padding="md" className="flex-1 flex flex-col justify-between space-y-5">
            {activeHousehold ? (
              <>
                <div className="space-y-4">
                  <div className="border-b border-separator-border pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-text-muted">
                        Profil Spasial Rumah Tangga
                      </span>
                      <BoardStatusLabel
                        tone={
                          activeHousehold.sev.severity === 'HIJAU'
                            ? 'nominal'
                            : activeHousehold.sev.severity === 'KUNING'
                            ? 'warning'
                            : 'danger'
                        }
                        label={`Pin ${activeHousehold.sev.severity}`}
                      />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary mt-1">
                      KK {activeHousehold.fam.namaKepalaKeluarga}
                    </h2>
                    <div className="text-xs font-mono tabular-nums text-text-muted">
                      No. KK: {activeHousehold.fam.noKK}
                    </div>
                  </div>

                  {/* Alasan Klasifikasi Pin */}
                  <div className="p-3 rounded-lg bg-surface-subtle border border-separator-border space-y-1.5 text-xs">
                    <div className="font-semibold text-text-primary">
                      Diagnosis Kerentanan ({activeHousehold.sev.label}):
                    </div>
                    <ul className="space-y-1 text-text-secondary">
                      {activeHousehold.sev.reasons.map((r, idx) => (
                        <li key={idx}>• {r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Detail Lokasi & Sanitasi */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-separator-border/60">
                      <span className="text-text-muted">Wilayah Dasawisma</span>
                      <span className="font-medium text-text-primary">
                        {activeHousehold.fam.namaDasawisma} (RT {activeHousehold.fam.rt}/RW{' '}
                        {activeHousehold.fam.rw})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-separator-border/60">
                      <span className="text-text-muted">Dusun &amp; Alamat</span>
                      <span className="font-medium text-text-primary text-right max-w-[200px]">
                        {activeHousehold.fam.alamat}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-separator-border/60">
                      <span className="text-text-muted">Titik Koordinat GPS</span>
                      <span className="font-mono tabular-nums text-text-primary">
                        {activeHousehold.fam.latitude}, {activeHousehold.fam.longitude}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-separator-border/60">
                      <span className="text-text-muted flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Jumlah Anggota Aktif
                      </span>
                      <span className="font-mono tabular-nums font-semibold">
                        {
                          activeHousehold.fam.anggota.filter((a) => a.statusHidup === 'HIDUP')
                            .length
                        }{' '}
                        Jiwa
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-separator-border/60">
                      <span className="text-text-muted flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" /> Fasilitas Sanitasi
                      </span>
                      <span className="font-medium">
                        {activeHousehold.fam.sanitasi.sumberAir} ·{' '}
                        {activeHousehold.fam.sanitasi.punyaJamban ? 'Jamban Ada' : 'Tanpa Jamban'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5" /> Pekarangan &amp; UP2K
                      </span>
                      <span className="font-medium">
                        {activeHousehold.fam.pekarangan.ikutUp2k ? 'UP2K Aktif' : 'Non-UP2K'} ·{' '}
                        {activeHousehold.fam.pekarangan.toga ? 'TOGA' : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-separator-border flex flex-col gap-2">
                  <BoardButton
                    variant="primary"
                    size="md"
                    className="w-full"
                    icon={<Printer className="w-4 h-4" />}
                    onClick={() => handleNavigateCetak(activeHousehold.fam.id)}
                  >
                    Buka &amp; Cetak Catatan Keluarga (4.15)
                  </BoardButton>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-xs text-text-muted">
                Pilih salah satu pin rumah pada peta untuk melihat profil lengkap rumah tangga.
              </div>
            )}
          </BoardSurface>
        </div>
      </div>
    </div>
  );
}
