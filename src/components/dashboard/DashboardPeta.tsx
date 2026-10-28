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
  filterFamiliesByRoleScope,
  filterWilayahByRoleScope,
  getRbacPermissions,
} from '@/lib/domain';
import {
  BoardButton,
  BoardSurface,
  BoardSegmentedControl,
  BoardStatusLabel,
} from '@/components/boardui';

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

            {/* Interactive SVG + DOM Pin GIS Surface */}
            <div
              data-testid="gis-map-canvas"
              className={`relative w-full h-[460px] overflow-hidden select-none ${
                mapStyle === 'CADASTRE'
                  ? 'bg-slate-100 dark:bg-slate-900'
                  : 'bg-emerald-50/70 dark:bg-slate-950'
              }`}
            >
              <div
                className="w-full h-full transition-transform duration-150 origin-center relative"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* Vector Cadastral Background of Desa Grudo */}
                <svg
                  viewBox="0 0 800 500"
                  className="w-full h-full object-cover"
                  aria-label="Peta Spasial Wilayah Dusun Grudo, Krajan, Mojorejo, dan Nglarangan"
                >
                  {/* Grid Lines */}
                  <g stroke="currentColor" className="text-slate-300/60 dark:text-slate-800" strokeWidth="1">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <line key={`v-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={500} />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={`h-${i}`} x1={0} y1={i * 50} x2={800} y2={i * 50} />
                    ))}
                  </g>

                  {/* Dusun Administrative Polygons */}
                  <polygon
                    points="40,40 390,40 370,240 40,250"
                    className="fill-teal-500/10 stroke-teal-700/40"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <polygon
                    points="400,40 760,40 760,240 380,240"
                    className="fill-sky-500/10 stroke-sky-700/40"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <polygon
                    points="40,260 370,250 380,460 40,460"
                    className="fill-amber-500/10 stroke-amber-700/40"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <polygon
                    points="390,250 760,250 760,460 390,460"
                    className="fill-indigo-500/10 stroke-indigo-700/40"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />

                  {/* River / Saluran Irigasi Grudo */}
                  <path
                    d="M 0,320 Q 220,290 420,340 T 800,300"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="10"
                    strokeOpacity="0.25"
                  />

                  {/* Main Arterial Roads (Jl. Raya Grudo & Jl. Hasanudin) */}
                  <path
                    d="M 40,180 L 760,180 M 385,30 L 385,470 M 140,80 L 660,410"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-400/70 dark:text-slate-700"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  {/* Dusun Labels */}
                  <text x="65" y="75" className="fill-slate-600 dark:fill-slate-400 text-[13px] font-bold">
                    DUSUN GRUDO (RW 01 · Dahlia &amp; Melati)
                  </text>
                  <text x="420" y="75" className="fill-slate-600 dark:fill-slate-400 text-[13px] font-bold">
                    DUSUN KRAJAN (RW 02 · Mawar &amp; Anggrek)
                  </text>
                  <text x="65" y="440" className="fill-slate-600 dark:fill-slate-400 text-[13px] font-bold">
                    DUSUN MOJOREJO (RW 03 · Kenanga &amp; Bougenville)
                  </text>
                  <text x="420" y="440" className="fill-slate-600 dark:fill-slate-400 text-[13px] font-bold">
                    DUSUN NGLARANGAN (RW 04 · Cempaka &amp; Flamboyan)
                  </text>

                  {/* Balai Desa Landmark */}
                  <g transform="translate(350, 155)">
                    <rect
                      x="0"
                      y="0"
                      width="76"
                      height="24"
                      rx="4"
                      className="fill-slate-900 dark:fill-slate-100"
                    />
                    <text
                      x="38"
                      y="15"
                      textAnchor="middle"
                      className="fill-white dark:fill-slate-900 text-[10px] font-bold"
                    >
                      BALAI DESA
                    </text>
                  </g>
                </svg>

                {/* Interactive Household Severity Pins */}
                {mappedHouseholds.map(({ fam, sev }) => {
                  const { xPct, yPct } = projectCoord(fam.latitude, fam.longitude);
                  const isSelected = activeHousehold?.fam.id === fam.id;

                  const pinStyles: Record<SeverityPin, string> = {
                    MERAH: 'bg-red-600 text-white border-white ring-red-600/40',
                    KUNING: 'bg-amber-500 text-slate-950 border-white ring-amber-500/40',
                    HIJAU: 'bg-teal-700 text-white border-white ring-accent-500/40',
                  };

                  const pinSymbol: Record<SeverityPin, string> = {
                    MERAH: '✕',
                    KUNING: '!',
                    HIJAU: '✓',
                  };

                  return (
                    <button
                      key={fam.id}
                      type="button"
                      onClick={() => setSelectedFamilyId(fam.id)}
                      aria-label={`Pin Rumah KK ${fam.namaKepalaKeluarga} (${sev.severity})`}
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none transition-transform ${
                        isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                      }`}
                    >
                      <div
                        className={`px-2 py-1 rounded-lg border-2 shadow-md ring-4 flex items-center gap-1 text-[11px] font-mono font-bold whitespace-nowrap ${
                          pinStyles[sev.severity]
                        }`}
                      >
                        <span>{pinSymbol[sev.severity]}</span>
                        <span>{fam.namaKepalaKeluarga.split(' ')[0]}</span>
                      </div>
                    </button>
                  );
                })}
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
