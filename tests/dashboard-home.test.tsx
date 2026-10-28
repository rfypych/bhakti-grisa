import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DashboardLayout, Collapsible } from '../src/components/layout/DashboardLayout';
import { DashboardHome } from '../src/components/dashboard/DashboardHome';
import {
  INITIAL_WILAYAH,
  INITIAL_FAMILIES,
  INITIAL_EVENTS,
  INITIAL_OFFICERS,
} from '../src/lib/seedData';
import { OfficerAccount } from '../src/lib/domain';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'q' ? null : null),
  }),
}));

// Mock authActions
vi.mock('../src/actions/authActions', () => ({
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
}));

describe('Dashboard Layout & Overview Home Suite (Task 5)', () => {
  describe('Collapsible Component', () => {
    it('interpolates max-width, opacity, and blur on collapsed state', () => {
      const openHtml = renderToString(
        <Collapsible collapsed={false}>
          <span>Expanded Text</span>
        </Collapsible>
      );
      expect(openHtml).toContain('max-w-[220px]');
      expect(openHtml).toContain('opacity-100');
      expect(openHtml).toContain('Expanded Text');

      const collapsedHtml = renderToString(
        <Collapsible collapsed={true}>
          <span>Hidden Text</span>
        </Collapsible>
      );
      expect(collapsedHtml).toContain('max-w-0');
      expect(collapsedHtml).toContain('opacity-0');
      expect(collapsedHtml).toContain('blur-[2px]');
      expect(collapsedHtml).toContain('pointer-events-none');
    });
  });

  describe('DashboardLayout Component', () => {
    it('renders sidebar with brand section, SIMPATIK Grudo, and version badge', () => {
      const html = renderToString(
        <DashboardLayout currentUser={INITIAL_OFFICERS[0]}>
          <div>Konten Dashboard</div>
        </DashboardLayout>
      );

      expect(html).toContain('data-simpatik-layout="dashboard"');
      expect(html).toContain('SIMPATIK Grudo');
      expect(html).toContain('TP PKK Bhakti Grisa');
      expect(html).toContain('v1.0');
      expect(html).toContain('Konten Dashboard');
    });

    it('renders all required dashboard navigation links with icons', () => {
      const html = renderToString(
        <DashboardLayout currentUser={INITIAL_OFFICERS[0]}>
          <div>Nav Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('Statistik Agregat');
      expect(html).toContain('Verifikasi Draft');
      expect(html).toContain('Lapor Peristiwa');
      expect(html).toContain('Peta GIS Spasial');
      expect(html).toContain('Manajemen Wilayah');
      expect(html).toContain('Manajemen Akun');
      expect(html).toContain('Cetak Buku Dasawisma');
    });

    it('displays dynamic badge for pending draft verification count', () => {
      const html = renderToString(
        <DashboardLayout currentUser={INITIAL_OFFICERS[0]} pendingDraftCount={7}>
          <div>Badge Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('7');
    });

    it('renders breadcrumbs reflecting active page and officer identity', () => {
      const html = renderToString(
        <DashboardLayout
          currentUser={INITIAL_OFFICERS[0]}
          currentRoute="/dashboard"
        >
          <div>Breadcrumb Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('SIMPATIK Grudo');
      expect(html).toContain('Hj. Kartika Sari, S.Sos');
      expect(html).toContain('Dashboard');
    });

    it('renders quick search input with shortcut hint ⌘L', () => {
      const html = renderToString(
        <DashboardLayout currentUser={INITIAL_OFFICERS[0]}>
          <div>Search Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('Quick Search...');
      expect(html).toContain('⌘L');
    });

    it('renders officer profile and scope information', () => {
      const html = renderToString(
        <DashboardLayout
          currentUser={INITIAL_OFFICERS[0]}
          allOfficers={INITIAL_OFFICERS}
        >
          <div>Officer Scope Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('Hj. Kartika Sari, S.Sos');
      expect(html).toContain('@admin_desa');
      expect(html).toContain('Wilayah Tugas:');
      expect(html).toContain('ADMIN_DESA');
      expect(html).toContain('Cakupan Seluruh Desa Grudo');
    });

    it('renders secondary nav, public portal link, theme toggle, and logout button', () => {
      const html = renderToString(
        <DashboardLayout currentUser={INITIAL_OFFICERS[0]}>
          <div>Utility Nav Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('Formulir Pendataan');
      expect(html).toContain('Portal Publik Warga');
      expect(html).toContain('Keluar');
      expect(html).toContain('Mode terang');
    });

    it('renders mobile navigation bar for viewports under lg', () => {
      const html = renderToString(
        <DashboardLayout currentUser={INITIAL_OFFICERS[0]}>
          <div>Mobile Nav Check</div>
        </DashboardLayout>
      );

      expect(html).toContain('aria-label="Navigasi Bawah Petugas Mobile"');
      expect(html).toContain('Statistik');
      expect(html).toContain('Verifikasi');
    });
  });

  describe('DashboardHome Component', () => {
    it('renders filter toolbar with RT/Dasawisma selector, Tahun selector, and search', () => {
      const html = renderToString(
        <DashboardHome
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Filter Wilayah RT/Dasawisma');
      expect(html).toContain('Semua Wilayah Cakupan');
      expect(html).toContain('Tahun Pendataan');
      expect(html).toContain('Tahun 2026');
      expect(html).toContain('Tahun 2025');
      expect(html).toContain('Cari data keluarga');
    });

    it('renders all 4 BoardStatCard widgets pulling live aggregates', () => {
      const html = renderToString(
        <DashboardHome
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Total KK Terverifikasi');
      expect(html).toContain('Total Jiwa Warga');
      expect(html).toContain('Kelompok RT &amp; Dasawisma');
      expect(html).toContain('Digitalisasi Buku Dasawisma');
      expect(html).toContain('31 / 31 Sheet');
      expect(html).toContain('100% Digital');
    });

    it('renders official export and preview action buttons', () => {
      const html = renderToString(
        <DashboardHome
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Live Preview 31 Sheet');
      expect(html).toContain('Unduh Excel 31 Sheet');
      expect(html).toContain('Unduh PDF Resmi');
    });

    it('renders Dusun breakdown cards and GIS spatial indicators', () => {
      const html = renderToString(
        <DashboardHome
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Cakupan Keluarga &amp; Rumah Sehat per Dusun');
      expect(html).toContain('Dusun Grudo');
      expect(html).toContain('Dusun Krajan');
      expect(html).toContain('Dusun Mojorejo');
      expect(html).toContain('Dusun Nglarangan');

      expect(html).toContain('Pemetaan Spasial GIS &amp; Indikator Pokja PKK');
      expect(html).toContain('Pin Merah (Kritis)');
      expect(html).toContain('Pin Kuning (Pantau)');
      expect(html).toContain('Pin Hijau (Normal)');
      expect(html).toContain('Buka Peta GIS →');
    });

    it('renders Verified Families Table with severity pills and Cetak Catatan Keluarga action', () => {
      const html = renderToString(
        <DashboardHome
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Total Results');
      expect(html).toContain('kepala keluarga terverifikasi');
      expect(html).toContain('No KK &amp; Kepala Keluarga');
      expect(html).toContain('RT/RW &amp; Dusun');
      expect(html).toContain('Jiwa');
      expect(html).toContain('Status Sanitasi');
      expect(html).toContain('Severity Pill');
      expect(html).toContain('Status Chip');
      expect(html).toContain('Cetak Catatan Keluarga');

      // Check first family rendered
      const firstFam = INITIAL_FAMILIES.find((f) => f.status === 'VERIFIKASI');
      if (firstFam) {
        expect(html).toContain(firstFam.namaKepalaKeluarga);
        expect(html).toContain(firstFam.noKK);
      }
    });

    it('renders Draft Queue alert banner when there are pending draft submissions', () => {
      const draftFamilies = [
        ...INITIAL_FAMILIES,
        {
          ...INITIAL_FAMILIES[0],
          id: 'draft-fam-test-1',
          noKK: '3521099999990001',
          status: 'DRAFT' as const,
        },
      ];

      const html = renderToString(
        <DashboardHome
          families={draftFamilies}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Pengajuan Mandiri Warga Menunggu Verifikasi Kader');
      expect(html).toContain('Periksa &amp; Verifikasi');
    });

    it('renders empty state when filtered families list is empty', () => {
      const html = renderToString(
        <DashboardHome
          families={[]}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
        />
      );

      expect(html).toContain('Belum Ada Data Keluarga Terverifikasi pada Filter Ini');
    });

    it('renders Live Preview 31 Sheet Modal with selector and worksheet table', () => {
      const html = renderToString(
        <DashboardHome
          families={INITIAL_FAMILIES}
          wilayahList={INITIAL_WILAYAH}
          events={INITIAL_EVENTS}
          currentUser={INITIAL_OFFICERS[0]}
          defaultModalOpen={true}
        />
      );

      expect(html).toContain('Inspeksi Langsung Buku Dasawisma 31 Sheet TP PKK Desa Grudo');
      expect(html).toContain('Pilih Lembar Kerja (Sheet 01 – Sheet 31)');
      expect(html).toContain('Sheet 01');
      expect(html).toContain('Unduh Seluruh 31 Sheet (.xls)');
    });
  });
});
