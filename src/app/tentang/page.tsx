'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppRoute, UserRole } from '@/lib/domain';
import {
  BoardButton,
  BoardChip,
  BoardSurface,
  BoardStatusLabel,
  BoardLogo,
} from '@/components/simpatik';
import { PublicLayout } from '@/components/layout/PublicLayout';

export interface PublicTentangProps {
  currentRole?: UserRole;
  onNavigate?: (route: AppRoute) => void;
}

export const RBAC_MATRIX_ROWS = [
  {
    fitur: '/ (Beranda)',
    warga: 'Akses Penuh',
    kaderRt: 'Tampilan Petugas',
    pengurusRw: 'Tampilan Petugas',
    pengurusDusun: 'Tampilan Petugas',
    adminDesa: 'Tampilan Petugas',
  },
  {
    fitur: '/formulir (Pendataan)',
    warga: 'Draft Mandiri',
    kaderRt: 'Input Resmi RT',
    pengurusRw: 'Tidak Diizinkan',
    pengurusDusun: 'Tidak Diizinkan',
    adminDesa: 'Input Terpusat',
  },
  {
    fitur: '/dashboard (Statistik)',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Scope RT Sendiri',
    pengurusRw: 'Scope RW Sendiri',
    pengurusDusun: 'Scope Dusun Sendiri',
    adminDesa: 'Seluruh Desa',
  },
  {
    fitur: '/dashboard/verifikasi',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Verifikasi RT',
    pengurusRw: 'Tidak Diizinkan',
    pengurusDusun: 'Tidak Diizinkan',
    adminDesa: 'Verifikasi Seluruh Desa',
  },
  {
    fitur: '/dashboard/lapor-peristiwa',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Input & Lihat',
    pengurusRw: 'Lihat Log Saja',
    pengurusDusun: 'Lihat Log Saja',
    adminDesa: 'Input & Kelola Semua',
  },
  {
    fitur: '/dashboard/peta (GIS)',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Peta RT Sendiri',
    pengurusRw: 'Peta RW Sendiri',
    pengurusDusun: 'Peta Dusun Sendiri',
    adminDesa: 'Peta Seluruh Desa',
  },
  {
    fitur: '/dashboard/wilayah',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Tidak Diizinkan',
    pengurusRw: 'Tidak Diizinkan',
    pengurusDusun: 'Tidak Diizinkan',
    adminDesa: 'Kelola Penuh (Safety Guard)',
  },
  {
    fitur: '/dashboard/pengguna',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Tidak Diizinkan',
    pengurusRw: 'Tidak Diizinkan',
    pengurusDusun: 'Tidak Diizinkan',
    adminDesa: 'Kelola Penuh',
  },
  {
    fitur: '/dashboard/laporan/cetak/[id]',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Cetak Warga RT',
    pengurusRw: 'Cetak Warga RW',
    pengurusDusun: 'Cetak Warga Dusun',
    adminDesa: 'Cetak Bebas (Lampiran 4.15)',
  },
  {
    fitur: '/api/export/excel & pdf',
    warga: 'Tidak Diizinkan',
    kaderRt: 'Unduh Buku RT',
    pengurusRw: 'Unduh Buku RW',
    pengurusDusun: 'Unduh Buku Dusun',
    adminDesa: 'Unduh 31 Sheet Desa',
  },
];

export function PublicTentang({ currentRole = 'WARGA', onNavigate }: PublicTentangProps) {
  const router = useRouter();

  const handleNav = (route: AppRoute) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      router.push(route);
    }
  };

  const renderRbacCell = (val: string) => {
    if (val === 'Tidak Diizinkan') {
      return <BoardStatusLabel tone="danger" label="Terkunci" />;
    }
    if (val.includes('Lihat Log Saja')) {
      return <BoardStatusLabel tone="warning" label={val} />;
    }
    return <BoardStatusLabel tone="nominal" label={val} />;
  };

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-14">
      {/* 1. Header & Background with SIMPATIK Getting-Started Styling */}
      <section className="relative overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="bui-hero-rays pointer-events-none absolute inset-x-0 top-0 h-full"
        />
        <div className="relative max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <BoardLogo size={22} rounded="circle" />
            <BoardChip variant="caption" color="lime">
              SIMPATIK v1.0.1 Documentation
            </BoardChip>
            <BoardChip variant="caption" color="cyan">
              Bhakti Grisa × TP PKK Desa Grudo
            </BoardChip>
          </div>
          <h1 className="text-display-4-semibold sm:text-display-3-semibold text-text-primary tracking-tight">
            Transformasi Tertib Administrasi Keluarga dari 31 Lembar Manual Menuju Single Entry Digital
          </h1>
          <p className="text-body-regular sm:text-subheadline-regular text-text-secondary">
            Inisiatif <strong>Bhakti Grisa</strong> berkolaborasi dengan Pemerintah Desa Grudo dan
            Tim Penggerak PKK menggunakan <strong>Sistem Informasi Terpadu SIMPATIK</strong> untuk memangkas
            beban administrasi berulang Ibu-ibu Kader Dasawisma tanpa mengubah format baku buku
            laporan fisik TP PKK Pusat.
          </p>
        </div>
      </section>

      {/* 2. Before vs After Transformation Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BoardSurface variant="secondary" padding="lg" className="space-y-4">
          <BoardChip variant="bold" color="rose">
            Kondisi Sebelumnya (Konvensional)
          </BoardChip>
          <h2 className="text-title-3-semibold text-text-primary">
            Beban Pengelolaan 31 Lembar Sheet Manual
          </h2>
          <div className="rounded-2lg bg-background-inner-default p-4 shadow-card">
            <ul className="space-y-2.5 text-body-2-regular text-text-secondary">
              <li>
                &bull; Kader Dasawisma harus menyalin data anggota keluarga yang sama berulang kali ke
                dalam buku Catatan Keluarga, Rekap RT, Rekap RW, Dusun, hingga Rekap Desa.
              </li>
              <li>
                &bull; Rentan kesalahan hitung jumlah Balita, Ibu Hamil, Lansia, dan persentase sanitasi
                ketika terjadi kelahiran atau kematian warga.
              </li>
              <li>
                &bull; Bayi baru lahir sering tertunda pencatatannya karena menunggu penerbitan NIK resmi
                Dukcapil.
              </li>
              <li>
                &bull; Tidak tersedia visualisasi spasial (GIS) untuk mendeteksi klaster rumah kurang
                sehat atau ibu hamil berisiko tinggi.
              </li>
            </ul>
          </div>
        </BoardSurface>

        <BoardSurface variant="secondary" padding="lg" className="space-y-4">
          <BoardChip variant="bold" color="lime">
            Transformasi SIMPATIK Desa Grudo (Bhakti Grisa)
          </BoardChip>
          <h2 className="text-title-3-semibold text-text-primary">
            Arsitektur Single Entry Terintegrasi 31 Sheet Otomatis
          </h2>
          <div className="rounded-2lg bg-background-inner-default p-4 shadow-card">
            <ul className="space-y-2.5 text-body-2-regular text-text-secondary">
              <li>
                &bull; <strong>Single Entry 5 Langkah</strong>: Warga atau kader cukup menginput data KK
                satu kali; sistem otomatis mengisi seluruh 31 Sheet Buku Dasawisma PKK.
              </li>
              <li>
                &bull; <strong>Virtual NIK Generator</strong>: Penerbitan kode identitas sementara 16
                digit otomatis bagi bayi baru lahir agar langsung terpantau Posyandu.
              </li>
              <li>
                &bull; <strong>Otomasi Dinamika Penduduk (Lampiran 4.18)</strong>: Pencatatan kelahiran
                otomatis menambah anggota KK, dan pencatatan kematian otomatis mengarsipkan jiwa.
              </li>
              <li>
                &bull; <strong>Pemetaan Spasial GIS</strong>: Indikator kode warna pin (Merah, Kuning,
                Hijau) untuk memprioritaskan intervensi gizi dan sanitasi rumah warga.
              </li>
            </ul>
          </div>
        </BoardSurface>
      </section>

      {/* 3. Arsitektur Tata Letak & Pemisahan Ruang Lingkup */}
      <section className="space-y-4">
        <div>
          <div className="text-caption-1-semibold text-accent-600 mb-1">
            Bagian 1 &amp; 6 Spesifikasi Arsitektur
          </div>
          <h2 className="text-title-2-semibold text-text-primary tracking-tight">
            Arsitektur Pemisahan Ruang Lingkup (Layout Isolation) &amp; Alur Data
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BoardSurface variant="secondary" padding="md" className="space-y-3">
            <h3 className="text-body-medium text-text-primary px-1">
              1. Ruang Publik Warga &amp; Guest &mdash; <code>(public)/layout.tsx</code>
            </h3>
            <div className="p-4 rounded-2lg bg-background-inner-default shadow-card space-y-2 text-caption-1-regular font-mono">
              <div className="font-semibold text-accent-600">
                [PublicNavbar] Header Navigation
              </div>
              <div className="pl-3 border-l border-separator-border space-y-1 text-text-secondary">
                <div>&boxv;&minus; / (Beranda &amp; Transparency Ledger)</div>
                <div>&boxv;&minus; /formulir (Formulir Mandiri 5 Langkah + LocalStorage Draft)</div>
                <div>&boxv;&minus; /login (Otentikasi Petugas PKK)</div>
                <div>&boxur;&minus; /tentang (Profil Inisiatif Bhakti Grisa &amp; Dokumentasi)</div>
              </div>
              <div className="font-semibold text-accent-600">
                [PublicFooter] Informasi Resmi Pemdes Grudo
              </div>
            </div>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-3">
            <h3 className="text-body-medium text-text-primary px-1">
              2. Ruang Kerja Petugas PKK &mdash; <code>dashboard/layout.tsx</code>
            </h3>
            <div className="p-4 rounded-2lg bg-background-inner-default shadow-card space-y-2 text-caption-1-regular font-mono">
              <div className="font-semibold text-accent-600">
                [SIMPATIK AppShell + Floating DashboardSidebar + Breadcrumb]
              </div>
              <div className="pl-3 border-l border-separator-border space-y-1 text-text-secondary">
                <div>&boxv;&minus; /dashboard (Statistik Agregat &amp; Unduh 31 Sheet Excel)</div>
                <div>&boxv;&minus; /dashboard/verifikasi (Validasi Draft Warga oleh Kader RT)</div>
                <div>&boxv;&minus; /dashboard/lapor-peristiwa (Dinamika Penduduk Lampiran 4.18)</div>
                <div>&boxv;&minus; /dashboard/peta (Peta Spasial GIS Severity Pin)</div>
                <div>&boxv;&minus; /dashboard/wilayah (Hierarki RT/RW + Safety Guard)</div>
                <div>&boxv;&minus; /dashboard/pengguna (Manajemen Akun &amp; Scoping Wilayah)</div>
                <div>&boxur;&minus; /dashboard/laporan/cetak/[id] (Cetak Lampiran 4.15)</div>
              </div>
            </div>
          </BoardSurface>
        </div>
      </section>

      {/* 4. Matriks Hak Akses & Peran Pengguna (RBAC Matrix) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-caption-1-semibold text-accent-600 mb-1">
              Bagian 2 Spesifikasi Keamanan
            </div>
            <h2 className="text-title-2-semibold text-text-primary tracking-tight">
              Matriks Hak Akses &amp; Peran Pengguna (RBAC Matrix)
            </h2>
          </div>
          <BoardChip variant="bold" color="blue">
            {`Peran Anda saat ini: ${currentRole}`}
          </BoardChip>
        </div>

        <div className="rounded-2xl border border-border-table bg-background-primary-default overflow-hidden">
          <div className="overflow-x-auto">
            <table className="bui-table">
              <thead>
                <tr>
                  <th>Halaman / Fitur</th>
                  <th>Warga / Guest</th>
                  <th>Kader RT</th>
                  <th>Pengurus RW</th>
                  <th>Pengurus Dusun</th>
                  <th>Admin Desa</th>
                </tr>
              </thead>
              <tbody>
                {RBAC_MATRIX_ROWS.map((row, i) => (
                  <tr key={i}>
                    <td className="font-mono text-caption-1-medium text-text-primary">
                      {row.fitur}
                    </td>
                    <td>{renderRbacCell(row.warga)}</td>
                    <td>{renderRbacCell(row.kaderRt)}</td>
                    <td>{renderRbacCell(row.pengurusRw)}</td>
                    <td>{renderRbacCell(row.pengurusDusun)}</td>
                    <td>{renderRbacCell(row.adminDesa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Landasan Hukum & Regulasi */}
      <section className="space-y-4">
        <div>
          <div className="text-caption-1-semibold text-accent-600 mb-1">
            Kerangka Regulasi &amp; Kepatuhan
          </div>
          <h2 className="text-title-2-semibold text-text-primary tracking-tight">
            Landasan Hukum &amp; Standar Operasional TP PKK
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <div className="flex items-center gap-2">
              <BoardChip variant="caption" color="blue">
                Regulasi Nasional
              </BoardChip>
              <span className="text-caption-1-medium text-text-secondary">
                Permendagri No. 36 Tahun 2020
              </span>
            </div>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Peraturan Pelaksanaan Perpres No. 99 Tahun 2017 tentang Gerakan Pemberdayaan dan Kesejahteraan Keluarga
            </h3>
            <p className="text-body-2-regular text-text-secondary">
              Mengatur tugas pokok, fungsi, kelembagaan, serta tertib administrasi TP PKK dari tingkat
              Pusat hingga kelompok Dasawisma di tingkat RT sebagai garda terdepan pendataan keluarga.
            </p>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <div className="flex items-center gap-2">
              <BoardChip variant="caption" color="lime">
                Undang-Undang Republik Indonesia
              </BoardChip>
              <span className="text-caption-1-medium text-text-secondary">
                UU No. 6 Tahun 2014
              </span>
            </div>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Undang-Undang tentang Desa &amp; Tata Kelola Pemerintahan Desa
            </h3>
            <p className="text-body-2-regular text-text-secondary">
              Penyelenggaraan tata kelola data desa yang akuntabel, transparan, dan partisipatif berbasis
              sistem informasi desa untuk mendukung perencanaan pembangunan desa berkeadilan.
            </p>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <div className="flex items-center gap-2">
              <BoardChip variant="caption" color="purple">
                Pedoman Buku Laporan
              </BoardChip>
              <span className="text-caption-1-medium text-text-secondary">
                Rakernas IX PKK 2021
              </span>
            </div>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Standar Baku Lampiran 4.14 &ndash; 4.19 TP PKK Pusat
            </h3>
            <p className="text-body-2-regular text-text-secondary">
              Format baku Catatan Data Keluarga, Rekapitulasi Tingkat Dasawisma, RT, RW, Dusun, dan Desa
              yang dipetakan secara presisi dan otomatis tanpa mengurangi legalitas format fisik.
            </p>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <div className="flex items-center gap-2">
              <BoardChip variant="caption" color="cyan">
                Pemerintah Daerah
              </BoardChip>
              <span className="text-caption-1-medium text-text-secondary">
                Kabupaten Ngawi
              </span>
            </div>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Kebijakan Tata Kelola Administrasi Kependudukan Desa Grudo
            </h3>
            <p className="text-body-2-regular text-text-secondary">
              Pedoman integrasi data Posyandu, pemantauan stunting/gizi buruk Balita, serta percepatan
              layanan tertib administrasi kependudukan keluarga warga Desa Grudo.
            </p>
          </BoardSurface>
        </div>
      </section>

      {/* 6. Modern Tech Stack Showcase */}
      <section className="space-y-4">
        <div>
          <div className="text-caption-1-semibold text-accent-600 mb-1">
            Arsitektur Rekayasa Perangkat Lunak
          </div>
          <h2 className="text-title-2-semibold text-text-primary tracking-tight">
            Modern Tech Stack Inisiatif Bhakti Grisa
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <BoardChip variant="caption" color="lime">
              Frontend &amp; SSR
            </BoardChip>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Next.js 16 &amp; React 19
            </h3>
            <p className="text-caption-1-regular text-text-secondary">
              App Router modern dengan streaming Server Components, Server Actions zero-API latency, dan Turbopack bundling.
            </p>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <BoardChip variant="caption" color="cyan">
              Design System
            </BoardChip>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Design Tokens
            </h3>
            <p className="text-caption-1-regular text-text-secondary">
              Precision UI tokens, glassmorphic headers, accessible contrast ratios, dan styling khusus buku registrasi fisik.
            </p>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <BoardChip variant="caption" color="blue">
              Data &amp; Persistence
            </BoardChip>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Prisma &amp; SQLite
            </h3>
            <p className="text-caption-1-regular text-text-secondary">
              Skema database relasional type-safe dengan ACID compliance, relasi satu pintu (Single Entry), dan safety guards.
            </p>
          </BoardSurface>

          <BoardSurface variant="secondary" padding="md" className="space-y-2">
            <BoardChip variant="caption" color="purple">
              Export Engine
            </BoardChip>
            <h3 className="text-body-medium font-semibold text-text-primary">
              ExcelJS &amp; PDF
            </h3>
            <p className="text-caption-1-regular text-text-secondary">
              Injeksi otomatis 31 sheet buku Dasawisma ke format Excel resmi dan pencetakan Lampiran 4.15 Catatan Keluarga.
            </p>
          </BoardSurface>
        </div>
      </section>

      {/* 7. CTA Section */}
      <section className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-background-secondary-default">
        <div>
          <h3 className="text-headline-semibold text-text-primary">
            Siap berpartisipasi dalam tertib administrasi keluarga Desa Grudo?
          </h3>
          <p className="text-body-2-regular text-text-secondary mt-0.5">
            Mulai pengisian mandiri 5 langkah atau masuk ke dashboard petugas untuk menguji seluruh
            fitur.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BoardButton variant="primary" onClick={() => handleNav('/formulir')}>
            Isi Formulir Mandiri
          </BoardButton>
          <BoardButton variant="secondary" onClick={() => handleNav('/login')}>
            Login Petugas PKK
          </BoardButton>
        </div>
      </section>
    </div>
  );
}

export default function TentangPage() {
  const router = useRouter();

  return (
    <PublicLayout currentRoute="/tentang">
      <PublicTentang onNavigate={(route) => router.push(route)} />
    </PublicLayout>
  );
}
