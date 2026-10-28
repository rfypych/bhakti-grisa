import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PublicLayout } from '../src/components/layout/PublicLayout';
import TentangPage, { PublicTentang, RBAC_MATRIX_ROWS } from '../src/app/tentang/page';
import { OfficerAccount } from '../src/lib/domain';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/tentang',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('PublicLayout & Tentang Inisiatif Suite', () => {
  describe('PublicLayout Component', () => {
    it('renders the brand logo, SIMPATIK Grudo title, and version chip', () => {
      const html = renderToString(
        <PublicLayout>
          <div>Konten Utama</div>
        </PublicLayout>
      );

      expect(html).toContain('SIMPATIK Grudo');
      expect(html).toContain('v1.0.1');
      expect(html).toContain('Konten Utama');
      expect(html).toContain('data-boardui-layout="public"');
    });

    it('renders all public navigation links in navbar', () => {
      const html = renderToString(
        <PublicLayout currentRoute="/">
          <div>Beranda</div>
        </PublicLayout>
      );

      expect(html).toContain('Beranda');
      expect(html).toContain('Formulir Mandiri');
      expect(html).toContain('Tentang Inisiatif');
      expect(html).toContain('Masuk Petugas');
    });

    it('highlights the active route properly', () => {
      const html = renderToString(
        <PublicLayout currentRoute="/tentang">
          <div>Tentang</div>
        </PublicLayout>
      );

      // Tentang should have the active pill class
      expect(html).toContain('bg-background-primary-default text-text-primary shadow-2xs');
    });

    it('renders guest action buttons when user is not logged in', () => {
      const html = renderToString(
        <PublicLayout currentRole="WARGA">
          <div>Guest View</div>
        </PublicLayout>
      );

      expect(html).toContain('Portal Kader');
      expect(html).toContain('Isi Formulir Mandiri');
      expect(html).not.toContain('Buka Dashboard Petugas');
    });

    it('renders officer dashboard button and username when logged in', () => {
      const mockOfficer: OfficerAccount = {
        id: 'user-kader-1',
        nama: 'Ibu Kader Sri',
        username: 'kader_rt01',
        passwordPlain: 'password',
        role: 'KADER_RT',
        aktif: true,
        scopeRt: '01',
        scopeRw: '01',
        scopeDusun: 'Grudo',
        terakhirMasuk: '2026-10-28',
      };

      const html = renderToString(
        <PublicLayout
          currentUser={mockOfficer}
          currentRole="KADER_RT"
        >
          <div>Officer View</div>
        </PublicLayout>
      );

      expect(html).toContain('Buka Dashboard Petugas');
      expect(html).toContain('Petugas (kader_rt01)');
    });

    it('renders mobile navigation toggle and mobile quick nav bar', () => {
      const html = renderToString(
        <PublicLayout currentRoute="/formulir">
          <div>Mobile Test</div>
        </PublicLayout>
      );

      expect(html).toContain('aria-label="Menu navigasi mobile"');
      expect(html).toContain('Formulir');
      expect(html).toContain('Tentang');
      expect(html).toContain('Petugas');
    });

    it('renders official TP PKK Desa Grudo footer with office hours & copyright', () => {
      const html = renderToString(
        <PublicLayout>
          <div>Footer Test</div>
        </PublicLayout>
      );

      expect(html).toContain('SIMPATIK Desa Grudo (Bhakti Grisa)');
      expect(html).toContain('Pemerintah Desa Grudo');
      expect(html).toContain('Tim Penggerak PKK');
      expect(html).toContain('Ruang Publik Warga');
      expect(html).toContain('Portal Pengelola PKK');
      expect(html).toContain('Pelayanan Kantor Desa Grudo:');
      expect(html).toContain('Senin – Jumat: 08.00 – 15.00 WIB');
      expect(html).toContain('Standar Lampiran 4.14 – 4.19 TP PKK Pusat');
      expect(html).toContain('Kabupaten Ngawi, Jawa Timur');
    });
  });

  describe('PublicTentang Component & TentangPage', () => {
    it('renders hero section with headline and bui-hero-rays', () => {
      const html = renderToString(<PublicTentang />);

      expect(html).toContain('bui-hero-rays');
      expect(html).toContain('BoardUI v1.0.1 Documentation');
      expect(html).toContain('Bhakti Grisa × TP PKK Desa Grudo');
      expect(html).toContain(
        'Transformasi Tertib Administrasi Keluarga dari 31 Lembar Manual Menuju Single Entry Digital'
      );
    });

    it('renders Before vs After Transformation Matrix', () => {
      const html = renderToString(<PublicTentang />);

      expect(html).toContain('Kondisi Sebelumnya (Konvensional)');
      expect(html).toContain('Beban Pengelolaan 31 Lembar Sheet Manual');
      expect(html).toContain('Transformasi SIMPATIK Desa Grudo (Bhakti Grisa)');
      expect(html).toContain('Arsitektur Single Entry Terintegrasi 31 Sheet Otomatis');
      expect(html).toContain('Virtual NIK Generator');
      expect(html).toContain('Otomasi Dinamika Penduduk (Lampiran 4.18)');
      expect(html).toContain('Pemetaan Spasial GIS');
    });

    it('renders Layout Isolation and Scope Architecture diagrams', () => {
      const html = renderToString(<PublicTentang />);

      expect(html).toContain('Arsitektur Pemisahan Ruang Lingkup (Layout Isolation) &amp; Alur Data');
      expect(html).toContain('Ruang Publik Warga &amp; Guest');
      expect(html).toContain('Ruang Kerja Petugas PKK');
      expect(html).toContain('(public)/layout.tsx');
      expect(html).toContain('dashboard/layout.tsx');
    });

    it('renders complete RBAC Matrix table with all 10 features', () => {
      const html = renderToString(<PublicTentang currentRole="WARGA" />);

      expect(html).toContain('Matriks Hak Akses &amp; Peran Pengguna (RBAC Matrix)');
      expect(html).toContain('Peran Anda saat ini: WARGA');
      expect(html).toContain('Halaman / Fitur');
      expect(html).toContain('Warga / Guest');
      expect(html).toContain('Kader RT');
      expect(html).toContain('Pengurus RW');
      expect(html).toContain('Pengurus Dusun');
      expect(html).toContain('Admin Desa');

      // Verify all features are rendered
      expect(RBAC_MATRIX_ROWS.length).toBe(10);
      RBAC_MATRIX_ROWS.forEach((row) => {
        expect(html).toContain(row.fitur.replace('&', '&amp;'));
      });

      // Verify locked / allowed status indicators
      expect(html).toContain('Terkunci');
      expect(html).toContain('Akses Penuh');
    });

    it('renders Landasan Hukum and Regulations section', () => {
      const html = renderToString(<PublicTentang />);

      expect(html).toContain('Landasan Hukum &amp; Standar Operasional TP PKK');
      expect(html).toContain('Permendagri No. 36 Tahun 2020');
      expect(html).toContain('UU No. 6 Tahun 2014');
      expect(html).toContain('Standar Baku Lampiran 4.14 – 4.19 TP PKK Pusat');
      expect(html).toContain('Kabupaten Ngawi');
    });

    it('renders Modern Tech Stack showcase', () => {
      const html = renderToString(<PublicTentang />);

      expect(html).toContain('Modern Tech Stack Inisiatif Bhakti Grisa');
      expect(html).toContain('Next.js 16 &amp; React 19');
      expect(html).toContain('BoardUI Tokens');
      expect(html).toContain('Prisma &amp; SQLite');
      expect(html).toContain('ExcelJS &amp; PDF');
    });

    it('renders CTA Section with interactive action buttons', () => {
      const html = renderToString(<PublicTentang />);

      expect(html).toContain('Siap berpartisipasi dalam tertib administrasi keluarga Desa Grudo?');
      expect(html).toContain('Isi Formulir Mandiri');
      expect(html).toContain('Login Petugas PKK');
    });

    it('renders full TentangPage wrapped in PublicLayout', () => {
      const html = renderToString(<TentangPage />);

      // Must be wrapped in PublicLayout
      expect(html).toContain('data-boardui-layout="public"');
      expect(html).toContain('SIMPATIK Grudo');
      expect(html).toContain('Transformasi Tertib Administrasi Keluarga');
      expect(html).toContain('Pelayanan Kantor Desa Grudo:');
    });
  });
});
