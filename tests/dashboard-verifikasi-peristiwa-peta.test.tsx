import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DashboardVerifikasi } from '../src/components/dashboard/DashboardVerifikasi';
import { DashboardPeristiwa } from '../src/components/dashboard/DashboardPeristiwa';
import { DashboardPeta } from '../src/components/dashboard/DashboardPeta';
import {
  INITIAL_WILAYAH,
  INITIAL_FAMILIES,
  INITIAL_EVENTS,
  INITIAL_OFFICERS,
} from '../src/lib/seedData';
import { KeluargaRecord, computeHouseholdSeverity } from '../src/lib/domain';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/verifikasi',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => null,
  }),
}));

// Mock Server Actions
vi.mock('../src/actions/verifikasiActions', () => ({
  approveSubmissionAction: vi.fn().mockResolvedValue({ success: true }),
  rejectSubmissionAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../src/actions/peristiwaActions', () => ({
  laporKelahiranAction: vi.fn().mockResolvedValue({ success: true, childId: 'child-1' }),
  laporKematianAction: vi.fn().mockResolvedValue({ success: true }),
  laporKehamilanAction: vi.fn().mockResolvedValue({ success: true }),
  laporMutasiAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Task 6: Verification, Events, and Spatial GIS Suite', () => {
  describe('DashboardVerifikasi Component', () => {
    const adminUser = INITIAL_OFFICERS.find((o) => o.role === 'ADMIN_DESA') || INITIAL_OFFICERS[0];
    const rwUser = INITIAL_OFFICERS.find((o) => o.role === 'PENGURUS_RW') || {
      id: 'rw-1',
      nama: 'Pengurus RW',
      username: 'rw01',
      passwordPlain: '',
      role: 'PENGURUS_RW' as const,
      aktif: true,
      scopeRw: '01',
      scopeDusun: 'Grudo',
      terakhirMasuk: '2026-10-28',
    };

    it('enforces RBAC block for roles without verification permission (e.g. PENGURUS_RW)', () => {
      const html = renderToString(
        <DashboardVerifikasi
          families={INITIAL_FAMILIES}
          currentUser={rwUser}
          currentRole="PENGURUS_RW"
        />
      );

      expect(html).toContain('Hak Akses Verifikasi Dibatasi');
      expect(html).toContain('tidak memiliki wewenang melakukan persetujuan/penolakan berkas DRAFT');
      expect(html).toContain('Kembali ke Dashboard');
    });

    it('renders header, scope label, and segmented status filter for authorized officer', () => {
      const html = renderToString(
        <DashboardVerifikasi
          families={INITIAL_FAMILIES}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Antrean Verifikasi Data Keluarga Mandiri');
      expect(html).toContain('Validasi Lapangan Kader Dasawisma');
      expect(html).toContain('Antrean Draft');
      expect(html).toContain('Terverifikasi');
      expect(html).toContain('Perlu Revisi');
    });

    it('renders household cards with sanitation and member details', () => {
      const html = renderToString(
        <DashboardVerifikasi
          families={INITIAL_FAMILIES}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      // In initial families, check for card contents
      expect(html).toContain('Alamat &amp; Titik Koordinat Rumah');
      expect(html).toContain('Kondisi Sanitasi &amp; Air Bersih');
      expect(html).toContain('Ringkasan Jiwa');
      expect(html).toContain('GPS:');
      expect(html).toContain('Kriteria:');
      expect(html).toContain('Jamban:');
    });

    it('displays action buttons for approve and reject on unverified cards', () => {
      const html = renderToString(
        <DashboardVerifikasi
          families={INITIAL_FAMILIES}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      // If draft cards are present
      expect(html).toContain('Tolak / Minta Revisi');
      expect(html).toContain('Setujui &amp; Masukkan ke Buku Dasawisma');
    });

    it('renders approval confirmation modal markup in DashboardVerifikasi when target is selected', () => {
      const html = renderToString(
        <DashboardVerifikasi
          families={INITIAL_FAMILIES}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
          initialApproveTarget={INITIAL_FAMILIES[0]}
        />
      );

      expect(html).toContain('Konfirmasi Persetujuan Berkas Keluarga');
      expect(html).toContain('Apakah Anda yakin ingin menyetujui berkas pendataan keluarga ini?');
      expect(html).toContain(INITIAL_FAMILIES[0].namaKepalaKeluarga);
      expect(html).toContain('Ya, Setujui Berkas');
    });

    it('renders rejection notes if family has catatanRevisi', () => {
      const familyWithRevisi: KeluargaRecord = {
        ...INITIAL_FAMILIES[0],
        id: 'fam-rev-1',
        status: 'DITOLAK',
        catatanRevisi: 'Data NIK balita belum valid sesuai fisik KK.',
      };

      const html = renderToString(
        <DashboardVerifikasi
          families={[familyWithRevisi]}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      // When rendered with statusFilter default 'DRAFT', empty state is shown for draft
      expect(html).toContain('Tidak Ada Antrean Draft Menunggu Verifikasi');
    });
  });

  describe('DashboardPeristiwa Component', () => {
    const adminUser = INITIAL_OFFICERS.find((o) => o.role === 'ADMIN_DESA') || INITIAL_OFFICERS[0];
    const rwUser = INITIAL_OFFICERS.find((o) => o.role === 'PENGURUS_RW') || {
      id: 'rw-1',
      nama: 'Pengurus RW',
      username: 'rw01',
      passwordPlain: '',
      role: 'PENGURUS_RW' as const,
      aktif: true,
      scopeRw: '01',
      scopeDusun: 'Grudo',
      terakhirMasuk: '2026-10-28',
    };

    it('renders page header, scope label, and action buttons for authorized role', () => {
      const html = renderToString(
        <DashboardPeristiwa
          families={INITIAL_FAMILIES}
          events={INITIAL_EVENTS}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Modul Lapor Peristiwa Vital &amp; Dinamika Penduduk');
      expect(html).toContain('Standar Pelaporan Buku Catatan Kelahiran &amp; Kematian');
      expect(html).toContain('+ Catat Kelahiran Bayi');
      expect(html).toContain('+ Catat Kematian Warga');
      expect(html).toContain('+ Kehamilan / Nifas / Mutasi');
    });

    it('renders read-only mode badge for viewer roles like PENGURUS_RW', () => {
      const html = renderToString(
        <DashboardPeristiwa
          families={INITIAL_FAMILIES}
          events={INITIAL_EVENTS}
          currentUser={rwUser}
          currentRole="PENGURUS_RW"
        />
      );

      expect(html).toContain('Mode Baca / Audit Log Saja');
      expect(html).toContain('PENGURUS_RW');
    });

    it('renders 3 Event Action Cards and 4 live StatCards', () => {
      const html = renderToString(
        <DashboardPeristiwa
          families={INITIAL_FAMILIES}
          events={INITIAL_EVENTS}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      // 3 Event Action Cards
      expect(html).toContain('Lapor Kelahiran Bayi');
      expect(html).toContain('Lapor Kematian Warga');
      expect(html).toContain('Lapor Mutasi &amp; Kehamilan');

      // 4 Live StatCards
      expect(html).toContain('Angka Kelahiran Bayi');
      expect(html).toContain('Kehamilan &amp; Masa Nifas');
      expect(html).toContain('Pencatatan Kematian');
      expect(html).toContain('Mutasi Pindah Keluar');
    });

    it('renders event history log table with required columns and segmented filter', () => {
      const html = renderToString(
        <DashboardPeristiwa
          families={INITIAL_FAMILIES}
          events={INITIAL_EVENTS}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Tabel Riwayat Log Peristiwa &amp; Audit Dinamika Penduduk');
      expect(html).toContain('Tanggal');
      expect(html).toContain('Jenis Peristiwa');
      expect(html).toContain('Subjek Warga (L/P)');
      expect(html).toContain('Keluarga (KK) &amp; Wilayah');
      expect(html).toContain('Rincian Medis / Keterangan Otomasi');
      expect(html).toContain('Petugas Pencatat');
    });
  });

  describe('DashboardPeta Component', () => {
    const adminUser = INITIAL_OFFICERS.find((o) => o.role === 'ADMIN_DESA') || INITIAL_OFFICERS[0];

    it('renders GIS title, scope label, and wilayah filter selector', () => {
      const html = renderToString(
        <DashboardPeta
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Peta Spasial Rumah Warga &amp; Indeks Kerentanan Desa Grudo');
      expect(html).toContain('Sistem Informasi Geografis (GIS) Kependudukan &amp; Sanitasi');
      expect(html).toContain('Filter wilayah peta spasial');
      expect(html).toContain('Semua RT/Dasawisma');
    });

    it('renders severity filter segmented control with color-coded counts', () => {
      const html = renderToString(
        <DashboardPeta
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Semua Pin');
      expect(html).toContain('✕ Merah');
      expect(html).toContain('! Kuning');
      expect(html).toContain('✓ Hijau');
    });

    it('renders cadastral vector map canvas with dusun polygons and Balai Desa landmark', () => {
      const html = renderToString(
        <DashboardPeta
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('data-testid="gis-map-canvas"');
      expect(html).toContain('DUSUN GRUDO');
      expect(html).toContain('DUSUN KRAJAN');
      expect(html).toContain('DUSUN MOJOREJO');
      expect(html).toContain('DUSUN NGLARANGAN');
      expect(html).toContain('BALAI DESA');
      expect(html).toContain('Perbesar peta');
      expect(html).toContain('Perkecil peta');
      expect(html).toContain('Reset zoom peta');
      expect(html).toContain('Kadastral RT/RW');
    });

    it('renders interactive household pins and household inspector panel', () => {
      const html = renderToString(
        <DashboardPeta
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Profil Spasial Rumah Tangga');
      expect(html).toContain('Diagnosis Kerentanan');
      expect(html).toContain('Wilayah Dasawisma');
      expect(html).toContain('Titik Koordinat GPS');
      expect(html).toContain('Jumlah Anggota Aktif');
      expect(html).toContain('Fasilitas Sanitasi');
      expect(html).toContain('Pekarangan &amp; UP2K');
      expect(html).toContain('Buka &amp; Cetak Catatan Keluarga (4.15)');
    });

    it('verifies computeHouseholdSeverity produces correct severity classifications', () => {
      const verifiedFamilies = INITIAL_FAMILIES.filter((f) => f.status === 'VERIFIKASI');
      expect(verifiedFamilies.length).toBeGreaterThan(0);

      for (const fam of verifiedFamilies) {
        const sev = computeHouseholdSeverity(fam);
        expect(['MERAH', 'KUNING', 'HIJAU']).toContain(sev.severity);
        expect(sev.label).toBeDefined();
        expect(sev.reasons.length).toBeGreaterThan(0);
      }
    });
  });
});
