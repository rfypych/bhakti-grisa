'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  FileSpreadsheet,
  Printer,
  Users,
  HeartPulse,
  Droplets,
  Sprout,
  Eye,
  CheckSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  AppRoute,
  KeluargaRecord,
  OfficerAccount,
  PeristiwaRecord,
  UserRole,
  Wilayah,
  computeDashboardAggregates,
  computeHouseholdSeverity,
  filterFamiliesByRoleScope,
  filterWilayahByRoleScope,
  generate31SheetsBukuDasawisma,
  getRbacPermissions,
} from '@/lib/domain';
import {
  downloadExcel31SheetWorkbook,
  downloadOfficialPdfReport,
} from '@/lib/exportUtils';
import {
  BoardAvatar,
  BoardButton,
  BoardChip,
  BoardStatCard,
  BoardCallout,
  BoardModal,
  BoardStatusLabel,
  BoardEmptyState,
} from '@/components/simpatik';

export interface DashboardHomeProps {
  families?: KeluargaRecord[];
  wilayahList?: Wilayah[];
  events?: PeristiwaRecord[];
  currentUser?: OfficerAccount | null;
  currentRole?: UserRole;
  globalSearch?: string;
  defaultModalOpen?: boolean;
  onNavigate?: (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => void;
}

export function DashboardHome({
  families = [],
  wilayahList = [],
  events = [],
  currentUser = null,
  currentRole: initialRole,
  globalSearch: propSearch = '',
  defaultModalOpen = false,
  onNavigate,
}: DashboardHomeProps) {
  const router = useRouter();
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState<string>('SEMUA');
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [localSearch, setLocalSearch] = useState<string>('');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [is31SheetModalOpen, setIs31SheetModalOpen] = useState<boolean>(defaultModalOpen);
  const [activeSheetNumber, setActiveSheetNumber] = useState<number>(1);

  const currentRole: UserRole = initialRole ?? (currentUser?.role || 'ADMIN_DESA');
  const perms = getRbacPermissions(currentRole, currentUser);
  const scopedWilayah = filterWilayahByRoleScope(wilayahList, currentRole, currentUser);
  const roleScopedFamilies = filterFamiliesByRoleScope(families, currentRole, currentUser);

  const activeSearch = propSearch || localSearch;

  const filteredFamilies = roleScopedFamilies.filter((f) => {
    const matchWilayah =
      selectedWilayahFilter === 'SEMUA' || f.wilayahId === selectedWilayahFilter;
    const matchTahun = f.tahunPendataan === selectedTahun;
    const q = activeSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      f.namaKepalaKeluarga.toLowerCase().includes(q) ||
      f.noKK.includes(q) ||
      f.namaDasawisma.toLowerCase().includes(q) ||
      f.dusun.toLowerCase().includes(q);
    return matchWilayah && matchTahun && matchSearch;
  });

  const agg = computeDashboardAggregates(filteredFamilies);
  const verifiedFamilies = filteredFamilies.filter((f) => f.status === 'VERIFIKASI');
  const all31Sheets = generate31SheetsBukuDasawisma(
    filteredFamilies,
    scopedWilayah,
    events,
    selectedTahun
  );
  const currentPreviewSheet =
    all31Sheets.find((s) => s.sheetNumber === activeSheetNumber) || all31Sheets[0];

  const handleNav = (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => {
    if (onNavigate) {
      onNavigate(route, params);
    } else {
      let url: string = route;
      if (params?.cetakId) {
        url = `/dashboard/laporan/cetak/${params.cetakId}`;
      } else if (params?.wilayahId) {
        url = `${route}?wilayahId=${params.wilayahId}`;
      }
      router.push(url);
    }
  };

  const handleExportExcel = () => {
    try {
      if (typeof window !== 'undefined') {
        const query = new URLSearchParams({
          tahun: selectedTahun.toString(),
          ...(selectedWilayahFilter !== 'SEMUA' ? { rtId: selectedWilayahFilter } : {}),
        });
        window.open(`/api/export/excel?${query.toString()}`, '_blank');
      }
    } catch {
      // Fallback
    }

    const file = downloadExcel31SheetWorkbook(
      filteredFamilies,
      scopedWilayah,
      events,
      selectedTahun,
      perms.scopeLabel
    );
    setExportFeedback(
      `Berhasil mengekspor 31 Sheet Buku Dasawisma PKK ke berkas "${file}" (${agg.totalKKTerverifikasi} KK Terverifikasi).`
    );
  };

  const handleExportPdf = () => {
    try {
      if (typeof window !== 'undefined') {
        const query = new URLSearchParams({
          jenis: 'rekap-dasawisma',
          tahun: selectedTahun.toString(),
          ...(selectedWilayahFilter !== 'SEMUA' ? { wilayahId: selectedWilayahFilter } : {}),
        });
        window.open(`/api/export/pdf?${query.toString()}`, '_blank');
      }
    } catch {
      // Fallback
    }

    const file = downloadOfficialPdfReport(
      filteredFamilies,
      selectedTahun,
      perms.scopeLabel
    );
    setExportFeedback(
      `Berhasil mengunduh dokumen resmi Lampiran 4.15 & Rekapitulasi Wilayah "${file}".`
    );
  };

  const dusunBreakdown = ['Grudo', 'Krajan', 'Mojorejo', 'Nglarangan'].map((dusun) => {
    const dFams = verifiedFamilies.filter((f) => f.dusun === dusun);
    const dSehat = dFams.filter((f) => f.sanitasi.kriteriaRumah === 'SEHAT').length;
    const dJiwa = dFams.reduce(
      (acc, f) => acc + f.anggota.filter((a) => a.statusHidup === 'HIDUP').length,
      0
    );
    return { dusun, kk: dFams.length, sehat: dSehat, jiwa: dJiwa };
  });

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Toolbar: Territory & Year Selectors + Official 31-Sheet & PDF Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background-secondary-default p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <BoardChip variant="bold" color="blue">
            {perms.scopeLabel}
          </BoardChip>

          <div>
            <label htmlFor="filter-wilayah-dash" className="sr-only">
              Filter Wilayah RT/Dasawisma
            </label>
            <select
              id="filter-wilayah-dash"
              aria-label="Filter Wilayah RT/Dasawisma"
              value={selectedWilayahFilter}
              onChange={(e) => setSelectedWilayahFilter(e.target.value)}
              className="h-9 rounded-2lg border border-border-button-default bg-background-primary-default px-2.5 py-1.5 text-body-medium text-text-primary shadow-xs outline-none focus:ring-2 focus:ring-border-button-active"
            >
              <option value="SEMUA">
                Semua Wilayah Cakupan ({scopedWilayah.length} Dasawisma)
              </option>
              {scopedWilayah.map((w) => (
                <option key={w.id} value={w.id}>
                  Dasawisma {w.namaDasawisma} — RT {w.rt}/RW {w.rw} ({w.dusun})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-tahun-dash" className="sr-only">
              Tahun Pendataan
            </label>
            <select
              id="filter-tahun-dash"
              aria-label="Tahun Pendataan"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="h-9 rounded-2lg border border-border-button-default bg-background-primary-default px-2.5 py-1.5 text-body-medium tabular-nums text-text-primary shadow-xs outline-none focus:ring-2 focus:ring-border-button-active"
            >
              <option value={2026}>Tahun 2026</option>
              <option value={2025}>Tahun 2025</option>
              <option value={2024}>Tahun 2024</option>
            </select>
          </div>

          {/* Local Search input if not provided by globalSearch */}
          {!propSearch && (
            <div className="relative flex items-center rounded-2lg border border-border-button-default bg-background-primary-default px-2.5 py-1.5 h-9 shadow-xs focus-within:ring-2 focus-within:ring-border-button-active">
              <Search className="size-4 text-foreground-icon-tertiary shrink-0 mr-1.5" />
              <input
                type="search"
                aria-label="Cari data keluarga"
                placeholder="Cari kepala keluarga / No. KK..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-36 sm:w-44 bg-transparent text-body-medium text-text-primary placeholder:text-text-tertiary outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BoardButton
            variant="secondary"
            size="md"
            icon={<Eye className="size-4" />}
            onClick={() => setIs31SheetModalOpen(true)}
          >
            Live Preview 31 Sheet
          </BoardButton>

          <BoardButton
            variant="primary"
            size="md"
            icon={<FileSpreadsheet className="size-4" />}
            onClick={handleExportExcel}
          >
            Unduh Excel 31 Sheet
          </BoardButton>

          <BoardButton
            variant="secondary"
            size="md"
            icon={<Download className="size-4" />}
            onClick={handleExportPdf}
          >
            Unduh PDF Resmi
          </BoardButton>
        </div>
      </div>

      {exportFeedback && (
        <BoardCallout
          tone="success"
          title="Ekspor Dokumen Resmi Berhasil"
          description={exportFeedback}
          action={
            <BoardButton
              variant="secondary"
              size="sm"
              onClick={() => setExportFeedback(null)}
            >
              Tutup
            </BoardButton>
          }
        />
      )}

      {/* Banner Peringatan Berkas Masuk (Draft Queue Alert) */}
      {agg.totalDraftAntrean > 0 && (
        <BoardCallout
          tone="warning"
          title={`Terdapat ${agg.totalDraftAntrean} Pengajuan Mandiri Warga Menunggu Verifikasi Kader`}
          description="Berkas berstatus DRAFT belum dihitung ke dalam Rekapitulasi 31 Sheet Buku Dasawisma sebelum divalidasi oleh Kader RT atau Admin Desa."
          action={
            perms.canVerifyDraft ? (
              <BoardButton
                variant="primary"
                size="sm"
                icon={<CheckSquare className="size-4" />}
                onClick={() => handleNav('/dashboard/verifikasi')}
              >
                Periksa &amp; Verifikasi ({agg.totalDraftAntrean})
              </BoardButton>
            ) : (
              <BoardChip variant="bold" color="yellow">
                Menunggu Validasi Kader RT
              </BoardChip>
            )
          }
        />
      )}

      {/* 1:1 SIMPATIK 4 StatCards Row */}
      <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <BoardStatCard
          label="Total KK Terverifikasi"
          value={`${agg.totalKKTerverifikasi} KK`}
          subtext={`${agg.totalKKTerverifikasi} KK Terverifikasi · 100% Aktif`}
          deltaLabel="+100% Aktif"
          accentTone="default"
          icon={<Users className="size-5" />}
        />

        <BoardStatCard
          label="Total Jiwa Warga"
          value={`${agg.totalJiwa} Jiwa`}
          subtext={`${agg.totalLakiLaki} L · ${agg.totalPerempuan} P (${agg.totalBalita} Balita, ${agg.totalLansia} Lansia)`}
          deltaLabel={`${agg.totalBalita + agg.totalLansia + agg.totalIbuHamil} Rentan`}
          accentTone="amber"
          icon={<HeartPulse className="size-5" />}
        />

        <BoardStatCard
          label="Kelompok RT & Dasawisma"
          value={`${scopedWilayah.length} Dasawisma`}
          subtext={`${agg.rumahSehat} Rumah Sehat · ${agg.persenJamban}% Jamban`}
          deltaLabel={`${agg.persenJamban}% Sehat`}
          accentTone="teal"
          icon={<Droplets className="size-5" />}
        />

        <BoardStatCard
          label="Digitalisasi Buku Dasawisma"
          value="31 / 31 Sheet"
          subtext={`${agg.kkUp2kAktif} UP2K · ${agg.kkToga} TOGA · ${agg.kkSayuran} Sayur`}
          deltaLabel="100% Digital"
          accentTone="crimson"
          icon={<Sprout className="size-5" />}
        />
      </div>

      {/* 1:1 SIMPATIK Two-Column Chart Cards Row */}
      <div className="flex w-full flex-col items-stretch gap-4 xl:flex-row">
        {/* Left Chart Card: Distribusi Cakupan Dusun & Indikator Pokja */}
        <section className="flex min-w-0 flex-1 flex-col justify-between gap-5 rounded-2xl bg-background-secondary-default px-4 pt-4 pb-3">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-medium text-text-secondary">
                Cakupan Keluarga &amp; Rumah Sehat per Dusun
              </p>
              <div className="flex items-center gap-2">
                <p className="text-title-1-medium text-text-primary tabular-nums">
                  {agg.persenJamban}% Sanitasi Layak
                </p>
                <BoardChip variant="bold" color="lime">
                  +31 Sheet
                </BoardChip>
              </div>
              <p className="text-body-2-medium text-text-tertiary tabular-nums">
                {agg.rumahSehat} Rumah Sehat dari {agg.totalKKTerverifikasi} KK Terverifikasi
              </p>
            </div>

            <dl className="flex shrink-0 items-center gap-4 text-body-2-medium text-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-2-active" aria-hidden />
                <dt>Total KK</dt>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-9-active" aria-hidden />
                <dt>Rumah Sehat</dt>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dusunBreakdown.map((item) => {
              const pct = item.kk > 0 ? Math.round((item.sehat / item.kk) * 100) : 0;
              return (
                <div
                  key={item.dusun}
                  className="flex flex-col gap-2 rounded-2lg bg-background-inner-default p-3 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium text-text-primary">{`Dusun ${item.dusun}`}</span>
                    <BoardChip variant="caption" color={pct >= 75 ? 'lime' : 'yellow'}>
                      {pct}% Sehat
                    </BoardChip>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background-tertiary-default">
                    <div
                      className="h-full rounded-full bg-chart-2-active transition-all"
                      style={{ width: `${Math.max(12, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-caption-1-regular text-text-tertiary tabular-nums">
                    <span>{item.kk} KK Terdata</span>
                    <span>{item.jiwa} Jiwa Warga</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Chart Card: Rincian Pokja I-IV & Peta Kerentanan GIS */}
        <section className="flex min-w-0 flex-1 flex-col justify-between gap-5 rounded-2xl bg-background-secondary-default px-4 pt-4 pb-3">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-medium text-text-secondary">
                Pemetaan Spasial GIS &amp; Indikator Pokja PKK
              </p>
              <div className="flex items-center gap-2">
                <p className="text-title-1-medium whitespace-nowrap text-text-primary tabular-nums">
                  {agg.pinHijau + agg.pinKuning + agg.pinMerah} Titik Rumah GIS
                </p>
                <BoardChip variant="bold" color={agg.pinMerah > 0 ? 'rose' : 'lime'}>
                  {agg.pinMerah} Prioritas
                </BoardChip>
              </div>
              <p className="text-body-2-medium text-text-tertiary tabular-nums">
                {agg.kkStikerP4k} KK Stiker P4K · {agg.totalButaAksara} Buta Aksara · {agg.totalDisabilitas} Disabilitas
              </p>
            </div>

            <BoardButton
              variant="secondary"
              size="sm"
              onClick={() => handleNav('/dashboard/peta')}
            >
              Buka Peta GIS →
            </BoardButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex flex-col justify-between gap-2 rounded-2lg bg-background-inner-default p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-caption-1-medium text-text-secondary">Pin Merah (Kritis)</span>
                <BoardChip variant="caption" color="rose">
                  Kritis
                </BoardChip>
              </div>
              <p className="text-title-2-semibold text-text-primary tabular-nums">
                {agg.pinMerah} Rumah
              </p>
              <span className="text-caption-1-regular text-text-tertiary">
                Sanitasi darurat / Bumil tanpa P4K
              </span>
            </div>

            <div className="flex flex-col justify-between gap-2 rounded-2lg bg-background-inner-default p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-caption-1-medium text-text-secondary">Pin Kuning (Pantau)</span>
                <BoardChip variant="caption" color="yellow">
                  Pantau
                </BoardChip>
              </div>
              <p className="text-title-2-semibold text-text-primary tabular-nums">
                {agg.pinKuning} Rumah
              </p>
              <span className="text-caption-1-regular text-text-tertiary">
                Balita / Lansia / Ibu Hamil P4K
              </span>
            </div>

            <div className="flex flex-col justify-between gap-2 rounded-2lg bg-background-inner-default p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-caption-1-medium text-text-secondary">Pin Hijau (Normal)</span>
                <BoardChip variant="caption" color="lime">
                  Normal
                </BoardChip>
              </div>
              <p className="text-title-2-semibold text-text-primary tabular-nums">
                {agg.pinHijau} Rumah
              </p>
              <span className="text-caption-1-regular text-text-tertiary">
                Kriteria rumah sehat &amp; layak
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 1:1 SIMPATIK Verified Families DataTable */}
      <section className="flex w-full flex-col rounded-2xl border border-border-table bg-background-primary-default pt-2 pb-3">
        {/* Table Toolbar */}
        <div className="flex w-full flex-col items-start gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col justify-center">
            <p className="text-body-medium whitespace-nowrap text-text-tertiary">Total Results</p>
            <p className="text-body-medium whitespace-nowrap text-text-primary tabular-nums">
              {verifiedFamilies.length} kepala keluarga terverifikasi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BoardChip variant="subtle" color="gray">
              Lampiran 4.15 Siap Cetak
            </BoardChip>
            {perms.canSubmitFormulir && (
              <BoardButton
                variant="secondary"
                size="sm"
                onClick={() => handleNav('/formulir')}
              >
                + Tambah Keluarga
              </BoardButton>
            )}
          </div>
        </div>

        {verifiedFamilies.length === 0 ? (
          <div className="p-6">
            <BoardEmptyState
              title="Belum Ada Data Keluarga Terverifikasi pada Filter Ini"
              description="Ubah filter wilayah/tahun atau setujui berkas warga pada halaman Verifikasi Draft."
              action={
                perms.canSubmitFormulir ? (
                  <BoardButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleNav('/formulir')}
                  >
                    + Input Data Keluarga
                  </BoardButton>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="bui-table">
              <thead>
                <tr>
                  <th>No KK &amp; Kepala Keluarga</th>
                  <th>RT/RW &amp; Dusun</th>
                  <th>Jiwa</th>
                  <th>Status Sanitasi</th>
                  <th>Severity Pill</th>
                  <th>Status Chip</th>
                  <th>Pembaruan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {verifiedFamilies.slice(0, 15).map((fam, idx) => {
                  const living = fam.anggota.filter((a) => a.statusHidup === 'HIDUP');
                  const sev = computeHouseholdSeverity(fam);
                  const severityLabel =
                    sev.severity === 'HIJAU'
                      ? 'Normal'
                      : sev.severity === 'KUNING'
                        ? 'Pantau'
                        : 'Kritis';
                  const initials = fam.namaKepalaKeluarga
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={fam.id} className="hover:bg-background-secondary-default/60">
                      <td>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <BoardAvatar
                            size="sm"
                            color={idx % 2 === 0 ? 'blue' : 'neutral'}
                            initials={initials}
                          />
                          <div>
                            <div className="text-body-medium font-semibold text-text-primary">
                              {fam.namaKepalaKeluarga}
                            </div>
                            <div className="font-mono tabular-nums text-caption-1-regular text-text-tertiary">
                              No. KK: {fam.noKK}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-body-medium text-text-primary">
                          RT {fam.rt}/RW {fam.rw}
                        </div>
                        <div className="text-caption-1-regular text-text-tertiary">
                          Dusun {fam.dusun} ({fam.namaDasawisma})
                        </div>
                      </td>
                      <td>
                        <BoardChip variant="subtle" color="gray">
                          {living.length} Jiwa
                        </BoardChip>
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <BoardStatusLabel
                            tone={
                              fam.sanitasi.kriteriaRumah === 'SEHAT'
                                ? 'nominal'
                                : fam.sanitasi.kriteriaRumah === 'KURANG_SEHAT'
                                  ? 'warning'
                                  : 'danger'
                            }
                            label={fam.sanitasi.kriteriaRumah.replace('_', ' ')}
                          />
                          <span className="text-caption-1-regular text-text-tertiary">
                            {fam.sanitasi.sumberAir} ·{' '}
                            {fam.sanitasi.punyaJamban ? 'Jamban Layak' : 'Tanpa Jamban'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <BoardStatusLabel
                          tone={
                            sev.severity === 'HIJAU'
                              ? 'nominal'
                              : sev.severity === 'KUNING'
                                ? 'warning'
                                : 'danger'
                          }
                          label={severityLabel}
                        />
                      </td>
                      <td>
                        <BoardChip variant="bold" color="lime">
                          {fam.status}
                        </BoardChip>
                      </td>
                      <td className="font-mono tabular-nums text-caption-1-regular text-text-secondary">
                        {fam.tanggalUpdate}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/dashboard/laporan/cetak/${fam.id}`}
                          onClick={(e) => {
                            if (onNavigate) {
                              e.preventDefault();
                              onNavigate('/dashboard/laporan/cetak', { cetakId: fam.id });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border-button-default bg-background-primary-default px-2.5 py-1 text-caption-1-medium text-text-primary hover:bg-background-secondary-hover shadow-2xs transition-colors"
                        >
                          <Printer className="size-3.5 text-text-secondary" />
                          <span>Cetak Catatan Keluarga</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Interactive 31-Sheet Buku Dasawisma Inspector Modal */}
      <BoardModal
        isOpen={is31SheetModalOpen}
        onClose={() => setIs31SheetModalOpen(false)}
        title="Inspeksi Langsung Buku Dasawisma 31 Sheet TP PKK Desa Grudo"
        subtitle={`Pratinjau struktur injeksi otomatis 31 lembar kerja sebelum diunduh ke Excel (.xls) — Tahun ${selectedTahun}`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-secondary-default p-3.5 rounded-2xl">
            <div className="flex-1">
              <label
                htmlFor="select-31-sheet"
                className="block text-caption-1-semibold text-text-primary mb-1"
              >
                Pilih Lembar Kerja (Sheet 01 – Sheet 31):
              </label>
              <select
                id="select-31-sheet"
                aria-label="Pilih Lembar Kerja (Sheet 01 – Sheet 31)"
                value={activeSheetNumber}
                onChange={(e) => setActiveSheetNumber(Number(e.target.value))}
                className="w-full h-9 px-3 py-1.5 text-body-2-medium font-mono bg-background-primary-default border border-border-button-default rounded-2lg text-text-primary shadow-2xs"
              >
                {all31Sheets.map((s) => (
                  <option key={s.sheetNumber} value={s.sheetNumber}>
                    Sheet {String(s.sheetNumber).padStart(2, '0')} [{s.sheetCode}] — {s.sheetTitle}{' '}
                    ({s.lampiranRef})
                  </option>
                ))}
              </select>
            </div>
            <BoardButton
              variant="primary"
              size="md"
              icon={<FileSpreadsheet className="size-4" />}
              onClick={handleExportExcel}
            >
              Unduh Seluruh 31 Sheet (.xls)
            </BoardButton>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-body-medium text-text-primary font-semibold">
                {currentPreviewSheet.sheetTitle}
              </span>
              <BoardChip variant="caption" color="blue">
                Standar: {currentPreviewSheet.lampiranRef}
              </BoardChip>
            </div>

            <div className="overflow-x-auto border border-border-table rounded-2xl max-h-80">
              <table className="bui-table bui-table-sm">
                <thead>
                  <tr>
                    {currentPreviewSheet.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentPreviewSheet.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={currentPreviewSheet.headers.length || 1}
                        className="text-center text-text-tertiary py-4"
                      >
                        Belum ada baris data pada lembar ini.
                      </td>
                    </tr>
                  ) : (
                    currentPreviewSheet.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="font-mono tabular-nums whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </BoardModal>
    </div>
  );
}
