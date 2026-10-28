'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  Users,
  Home,
  CheckCircle2,
  Sparkles,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import {
  AppRoute,
  KeluargaRecord,
  OfficerAccount,
  UserRole,
  Wilayah,
  computeDashboardAggregates,
  getRbacPermissions,
} from '@/lib/domain';
import { INITIAL_WILAYAH, INITIAL_FAMILIES } from '@/lib/seedData';
import {
  BoardButton,
  BoardChip,
  BoardSurface,
  BoardStatCard,
  BoardSegmentedControl,
  BoardStatusLabel,
  BoardLogo,
} from '@/components/boardui';
import { PublicLayout } from '@/components/layout/PublicLayout';

export interface PublicBerandaProps {
  wilayahList?: Wilayah[];
  families?: KeluargaRecord[];
  currentUser?: OfficerAccount | null;
  currentRole?: UserRole;
  onNavigate?: (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => void;
}

export const FAQ_ITEMS = [
  {
    q: 'Bagaimana jika bayi baru lahir belum memiliki NIK atau Akta Kelahiran?',
    a: 'Pada Langkah 3 Formulir Mandiri, tersedia fitur Virtual NIK Generator otomatis. Sistem akan menerbitkan kode identitas sementara 16 digit sesuai standar wilayah Desa Grudo (352109...99xx) sehingga bayi tetap tercatat dalam Buku Catatan Kelahiran dan Posyandu Balita.',
  },
  {
    q: 'Apakah data Kartu Keluarga (KK) dan NIK warga dijamin kerahasiaannya?',
    a: 'Ya. SIMPATIK Desa Grudo menerapkan isolasi hak akses berjenjang (Role-Based Access Control). Warga publik hanya dapat melihat statistik agregat desa, sedangkan rincian anggota keluarga hanya dapat diakses oleh Kader Dasawisma RT setempat dan Admin Resmi TP PKK Desa.',
  },
  {
    q: 'Bagaimana jika koneksi internet terputus saat sedang mengisi formulir 5 langkah?',
    a: 'Formulir Pendataan Mandiri dilengkapi fitur Auto-Save Draft berbasis penyimpanan lokal perangkat (localStorage). Setiap isian Anda pada Langkah 1 hingga Langkah 4 tersimpan otomatis dan dapat dilanjutkan kembali kapan saja tanpa kehilangan data.',
  },
  {
    q: 'Apa yang terjadi setelah saya mengirim Formulir Keluarga Mandiri?',
    a: 'Data yang dikirim oleh warga akan masuk ke Antrean Verifikasi Kader RT dengan status DRAFT. Ibu Kader Dasawisma di RT domisili Anda akan memeriksa kesesuaian data sebelum menyetujuinya menjadi status VERIFIKASI untuk masuk ke Rekapitulasi 31 Sheet Buku Dasawisma.',
  },
];

export function PublicBeranda({
  wilayahList = INITIAL_WILAYAH,
  families = INITIAL_FAMILIES,
  currentUser = null,
  currentRole = 'WARGA',
  onNavigate,
}: PublicBerandaProps) {
  let router: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback when outside Next.js Router context (e.g. tests)
  }

  const [selectedDusun, setSelectedDusun] = useState<string>('SEMUA');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const agg = computeDashboardAggregates(families);
  const perms = getRbacPermissions(currentRole, currentUser);

  const activeWilayahCount = wilayahList.filter((w) => w.aktif).length;
  const digitalisasiPercent = wilayahList.length
    ? Math.round((activeWilayahCount / wilayahList.length) * 100)
    : 100;

  const uniqueDusuns = Array.from(new Set(wilayahList.map((w) => w.dusun))).sort();
  const dusunOptions = [
    { value: 'SEMUA', label: 'Semua Dusun', count: wilayahList.length },
    ...uniqueDusuns.map((dusun) => ({
      value: dusun,
      label: dusun,
      count: wilayahList.filter((w) => w.dusun === dusun).length,
    })),
  ];

  const filteredWilayah =
    selectedDusun === 'SEMUA'
      ? wilayahList
      : wilayahList.filter((w) => w.dusun === selectedDusun);

  const handleNav = (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => {
    if (onNavigate) {
      onNavigate(route, params);
      return;
    }
    let url = route as string;
    if (params?.wilayahId) {
      url += `?wilayahId=${encodeURIComponent(params.wilayahId)}`;
    }
    if (router?.push) {
      router.push(url);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  const scrollToRtDirectory = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('direktori-rt-domisili');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyCli = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('npx shadcn@latest add @boardui/dashboard');
    }
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <PublicLayout
      currentRoute="/"
      currentUser={currentUser}
      currentRole={currentRole}
      onNavigate={handleNav}
    >
      <div className="space-y-16 sm:space-y-20 pb-8">
        {/* 1. 1:1 BoardUI Hero Section with Vertical Pastel Light Rays (`bui-hero-rays`) */}
        <section className="relative overflow-hidden border-b border-separator-border">
          <div
            aria-hidden="true"
            className="bui-hero-rays pointer-events-none absolute inset-x-0 top-0 h-[540px]"
          />

          <div className="relative max-w-[1300px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12">
            {/* Centered BoardUI Hero Header */}
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center gap-5">
              {/* BoardUI Announcement Pill (`bg-badge-new-background text-badge-new-text`) */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border-button-default bg-background-primary-default/90 backdrop-blur-xs py-1 ps-1.5 pe-3 shadow-2xs">
                <span className="inline-flex items-center justify-center rounded-full bg-badge-new-background px-2 py-0.5 text-caption-1-semibold text-badge-new-text">
                  SIMPATIK 1.0
                </span>
                <span className="text-caption-1-medium text-text-secondary">
                  Pemerintah Desa Grudo · TP PKK Dasawisma (Bhakti Grisa)
                </span>
                <ArrowRight className="size-3.5 text-text-tertiary" />
              </div>

              <h1 className="text-display-3-semibold sm:text-display-2-semibold text-text-primary tracking-tight">
                Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Keluarga
              </h1>

              <p className="text-body-regular sm:text-subheadline-regular text-text-secondary max-w-2xl">
                Portal pendataan keluarga satu pintu (<em>Single Entry</em>) Desa Grudo, Kecamatan
                Ngawi berbasis <strong>BoardUI Design System</strong>. Mengintegrasikan pendataan
                mandiri warga, verifikasi Kader RT, peta GIS, dan otomatisasi{' '}
                <strong>31 Sheet Buku Dasawisma PKK</strong>.
              </p>

              {/* Primary Blue Gradient Button (`bg-button-primary`) + Secondary Button */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <BoardButton
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="size-4" />}
                  onClick={() => handleNav('/formulir')}
                >
                  Isi Formulir Keluarga Mandiri
                </BoardButton>

                <BoardButton
                  variant="secondary"
                  size="lg"
                  onClick={scrollToRtDirectory}
                >
                  Pilih RT Tempat Tinggal
                </BoardButton>

                <BoardButton
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    handleNav(perms.canAccessDashboard ? '/dashboard' : '/login')
                  }
                >
                  {perms.canAccessDashboard ? 'Buka Dashboard Petugas' : 'Portal Petugas PKK'}
                </BoardButton>
              </div>

              {/* BoardUI Tech Stack & Standards Strip */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-caption-1-medium text-text-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Tailwind CSS v4
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-teal-500" />
                  React 19 &amp; BoardUI Tokens
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-lime-500" />
                  Lampiran 4.14 – 4.19 TP PKK
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  31 Sheet Excel Otomatis
                </span>
              </div>
            </div>

            {/* 2. Transparency Ledger — 1:1 BoardUI `FooterStatCard` 4-Column Showcase */}
            <div className="mt-10 rounded-3xl border border-border-button-default bg-background-primary-default p-4 sm:p-5 shadow-sidebar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 px-1">
                <div className="flex items-center gap-2.5">
                  <BoardLogo size={26} rounded="circle" />
                  <div>
                    <h2 className="text-body-medium text-text-primary">
                      Transparency Ledger — Indikator Kunci Real-Time Desa Grudo
                    </h2>
                    <p className="text-caption-1-regular text-text-tertiary">
                      Data teragregasi otomatis dari berkas keluarga berstatus VERIFIKASI · Tahun 2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BoardChip variant="bold" color="lime">
                    31 / 31 Sheet Aktif
                  </BoardChip>
                  <BoardChip variant="bold" color="gray">
                    {`Peran: ${currentRole}`}
                  </BoardChip>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <BoardStatCard
                  label="Total Kepala Keluarga Terdata"
                  value={agg.totalKKTerverifikasi}
                  subtext={`${agg.totalDraftAntrean} berkas draft antrean`}
                  deltaLabel={`+${agg.kkUp2kAktif} UP2K`}
                  accentTone="default"
                  icon={<Home className="size-5" />}
                />
                <BoardStatCard
                  label="Total Jiwa Warga Tercatat"
                  value={agg.totalJiwa}
                  subtext={`${agg.totalLakiLaki} L · ${agg.totalPerempuan} P`}
                  deltaLabel={`${agg.totalBalita} Balita`}
                  accentTone="amber"
                  icon={<Users className="size-5" />}
                />
                <BoardStatCard
                  label="Kelompok RT & Dasawisma"
                  value={activeWilayahCount}
                  subtext={`${uniqueDusuns.length} Dusun aktif terintegrasi`}
                  deltaLabel="100% Aktif"
                  accentTone="teal"
                  icon={<MapPin className="size-5" />}
                />
                <BoardStatCard
                  label="Digitalisasi Buku Dasawisma"
                  value={`${digitalisasiPercent}%`}
                  subtext={`${agg.persenJamban}% Jamban · ${agg.persenSpal}% SPAL`}
                  deltaLabel="31 Sheet"
                  accentTone="crimson"
                  icon={<FileSpreadsheet className="size-5" />}
                />
              </div>

              {/* BoardUI Getting Started / Quick Access Bar inside Showcase Frame */}
              <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl bg-background-secondary-default p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-inner-default shadow-card text-accent-600">
                    <Terminal className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-body-2-medium text-text-primary truncate">
                      BoardUI Open-Source Registry &amp; SIMPATIK Single-Entry Engine
                    </div>
                    <div className="text-caption-1-regular text-text-tertiary truncate">
                      Komponen dibangun dengan React 19, Tailwind CSS v4 (`styles/theme.css` &amp; `typography.css`), dan standar TP PKK.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCli}
                    className="inline-flex items-center gap-2 rounded-2lg border border-border-button-default bg-background-inner-default px-3 py-1.5 font-mono text-caption-1-medium text-text-secondary shadow-2xs hover:border-border-button-hover cursor-pointer"
                  >
                    <span className="text-accent-600">npx</span>
                    <span>shadcn@latest add @boardui/dashboard</span>
                    {copiedCmd ? (
                      <Check className="size-3.5 text-lime-600" />
                    ) : (
                      <Copy className="size-3.5 text-text-tertiary" />
                    )}
                  </button>
                  <BoardButton
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleNav(perms.canAccessDashboard ? '/dashboard' : '/login')
                    }
                  >
                    {perms.canAccessDashboard ? 'Masuk Ruang Kerja' : 'Login Petugas'}
                  </BoardButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Direktori Kelompok RT Domisili */}
        <section id="direktori-rt-domisili" className="max-w-[1300px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-caption-1-semibold text-accent-600 mb-1">
                <Sparkles className="size-3.5" />
                <span>Direktori Wilayah Domisili</span>
              </div>
              <h2 className="text-title-2-semibold text-text-primary tracking-tight">
                Pilih Kelompok RT &amp; Dasawisma Tempat Tinggal Anda
              </h2>
              <p className="text-body-regular text-text-secondary mt-1">
                Klik pada kartu Dasawisma Anda untuk membuka formulir mandiri dengan wilayah RT/RW
                yang langsung terpilih otomatis.
              </p>
            </div>

            <BoardSegmentedControl
              ariaLabel="Saring berdasarkan Dusun"
              value={selectedDusun}
              onChange={setSelectedDusun}
              options={dusunOptions}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredWilayah.map((w) => {
              const kkVerifiedCount = families.filter(
                (f) => f.wilayahId === w.id && f.status === 'VERIFIKASI'
              ).length;
              const kkDraftCount = families.filter(
                (f) => f.wilayahId === w.id && f.status === 'DRAFT'
              ).length;

              return (
                <div
                  key={w.id}
                  className="flex flex-col justify-between gap-3.5 rounded-2xl bg-background-secondary-default p-2 transition-shadow hover:shadow-card"
                >
                  <div className="flex flex-col gap-2.5 px-2.5 pt-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-caption-1-medium text-text-tertiary tabular-nums">
                        {`Dusun ${w.dusun} · RT ${w.rt}/RW ${w.rw}`}
                      </span>
                      <BoardStatusLabel
                        tone={w.aktif ? 'nominal' : 'muted'}
                        label={w.aktif ? 'Aktif' : 'Nonaktif'}
                      />
                    </div>

                    <div>
                      <h3 className="text-headline-semibold text-text-primary">
                        {`Dasawisma ${w.namaDasawisma}`}
                      </h3>
                      <p className="text-body-2-regular text-text-secondary mt-0.5">
                        Kader: <span className="text-text-primary font-medium">{w.ketuaDasawisma}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-2lg bg-background-inner-default p-2.5 shadow-card">
                    <div className="flex items-center justify-between text-caption-1-medium text-text-secondary tabular-nums">
                      <span>{`${kkVerifiedCount} KK Terverifikasi`}</span>
                      <BoardChip variant="caption" color={kkDraftCount > 0 ? 'yellow' : 'gray'}>
                        {`${kkDraftCount} Draft`}
                      </BoardChip>
                    </div>

                    <BoardButton
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleNav('/formulir', { wilayahId: w.id })}
                    >
                      {`Isi Formulir RT ${w.rt}/RW ${w.rw}`}
                    </BoardButton>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Panduan Alur 3 Tahap Pengisian Mandiri */}
        <section className="max-w-[1300px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-background-secondary-default p-6 sm:p-8">
            <div className="max-w-2xl mb-6">
              <div className="text-caption-1-semibold text-accent-600 mb-1">
                Prosedur Tertib Administrasi Keluarga
              </div>
              <h2 className="text-title-2-semibold text-text-primary tracking-tight">
                Panduan Alur 3 Tahap Pengisian Mandiri Warga
              </h2>
              <p className="text-body-regular text-text-secondary mt-1">
                Dirancang agar mudah diisi melalui ponsel pintar dari rumah masing-masing dalam waktu
                kurang dari 5 menit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: '01',
                  tag: 'Langkah Pertama',
                  title: 'Identitas Rumah Tangga & Titik Lokasi',
                  desc: 'Pilih Dusun, RW, RT, serta kelompok Dasawisma tempat tinggal Anda. Masukkan 16 digit Nomor Kartu Keluarga (KK) dan tandai koordinat rumah untuk pemetaan kesehatan desa.',
                },
                {
                  step: '02',
                  tag: 'Auto-Save Draft',
                  title: 'Sanitasi, Jiwa Keluarga & HATINYA PKK',
                  desc: 'Lengkapi kondisi jamban dan air bersih, daftar anggota keluarga (tersedia Virtual NIK otomatis bagi bayi baru lahir), serta pemanfaatan tanah pekarangan & UP2K.',
                },
                {
                  step: '03',
                  tag: 'Validasi Lapangan',
                  title: 'Verifikasi Kader RT & Rekap 31 Sheet',
                  desc: 'Pengajuan mandiri warga berstatus DRAFT dan langsung diperiksa oleh Kader Dasawisma RT setempat. Setelah disetujui, data otomatis teragregasi ke buku induk desa.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col justify-between gap-3 rounded-2xl bg-background-inner-default p-5 shadow-card"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-linear-to-b from-blue-500 to-blue-600 text-caption-1-semibold text-white">
                        {item.step}
                      </span>
                      <BoardChip variant="caption" color="blue">
                        {item.tag}
                      </BoardChip>
                    </div>
                    <h3 className="text-headline-semibold text-text-primary pt-1">{item.title}</h3>
                    <p className="text-body-2-regular text-text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Tanya Jawab Warga (FAQ Interaktif) & 6. Callout Portal Petugas */}
        <section className="max-w-[1300px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* FAQ Accordion */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <div className="text-caption-1-semibold text-accent-600 mb-1">
                  Pusat Bantuan Warga
                </div>
                <h2 className="text-title-2-semibold text-text-primary tracking-tight">
                  Tanya Jawab Seputar Pendataan SIMPATIK
                </h2>
              </div>

              <div className="divide-y divide-separator-border border border-border-table rounded-2xl bg-background-primary-default overflow-hidden">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="p-4 sm:p-5">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 text-left text-body-medium text-text-primary cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`size-4 text-text-tertiary shrink-0 transition-transform duration-150 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2.5 text-body-2-regular text-text-secondary leading-relaxed">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Callout Portal Petugas */}
            <div className="lg:col-span-5">
              <BoardSurface variant="secondary" padding="lg" className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-2lg bg-linear-to-b from-blue-500 to-blue-600 text-white">
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="text-caption-1-semibold text-accent-600">
                    Portal Khusus Pengelola &amp; Kader PKK
                  </span>
                </div>

                <h3 className="text-title-3-semibold text-text-primary tracking-tight">
                  Bertugas sebagai Kader Dasawisma, Pengurus RW/Dusun, atau Admin Desa?
                </h3>

                <p className="text-body-2-regular text-text-secondary leading-relaxed">
                  Masuk ke ruang kerja operasional untuk memverifikasi pengajuan mandiri warga,
                  mencatat peristiwa kelahiran/kematian (Lampiran 4.18), memantau peta kerentanan
                  rumah warga, dan mencetak dokumen resmi Catatan Keluarga (Lampiran 4.15).
                </p>

                <div className="rounded-2lg bg-background-inner-default p-3.5 shadow-card space-y-2 text-body-2-regular text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-accent-600 shrink-0" />
                    <span>Ekspor otomatis Buku Dasawisma 31 Sheet Excel (.xls)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-accent-600 shrink-0" />
                    <span>Scoping hak akses sesuai RT, RW, Dusun, atau Seluruh Desa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-accent-600 shrink-0" />
                    <span>Cetak langsung Lampiran 4.15 siap tanda tangan</span>
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <BoardButton
                    variant="primary"
                    onClick={() =>
                      handleNav(perms.canAccessDashboard ? '/dashboard' : '/login')
                    }
                  >
                    {perms.canAccessDashboard
                      ? 'Buka Dashboard Operasional'
                      : 'Masuk Akun Petugas PKK'}
                  </BoardButton>
                  <BoardButton
                    variant="secondary"
                    onClick={() => handleNav('/tentang')}
                  >
                    Lihat Matriks RBAC
                  </BoardButton>
                </div>
              </BoardSurface>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
