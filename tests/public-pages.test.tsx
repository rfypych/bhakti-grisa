import TentangPage from '../src/app/tentang/page';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import HomePage, { PublicBeranda, FAQ_ITEMS } from '../src/app/page';
import LoginPage, { PublicLogin } from '../src/app/login/page';
import {
  INITIAL_WILAYAH,
  INITIAL_FAMILIES,
  INITIAL_OFFICERS,
} from '../src/lib/seedData';
import { OfficerAccount } from '../src/lib/domain';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'callbackUrl' ? '/dashboard' : null),
  }),
}));

// Mock authActions
vi.mock('../src/actions/authActions', () => ({
  loginAction: vi.fn().mockImplementation(async ({ username, kataSandi }) => {
    if (username === 'admin' && kataSandi === 'admin123') {
      return { success: true };
    }
    if (username === 'kader_rt01' && kataSandi === 'dahlia01') {
      return { success: true };
    }
    return { success: false, error: 'Kredensial tidak sesuai.' };
  }),
  logoutAction: vi.fn(),
}));

describe('Public Pages Suite (Landing & Login Petugas)', () => {
  describe('PublicBeranda Component', () => {
    it('renders hero section with bui-hero-rays, announcement pill, and main headline', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('bui-hero-rays');
      expect(html).toContain('SIMPATIK 1.0');
      expect(html).toContain('Pemerintah Desa Grudo · TP PKK Dasawisma (Bhakti Grisa)');
      expect(html).toContain('Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Keluarga');
      expect(html).toContain('Isi Formulir Keluarga Mandiri');
      expect(html).toContain('Pilih RT Tempat Tinggal');
      expect(html).toContain('Portal Petugas PKK');
    });

    it('renders official standards badges in hero section without vanity tech chips', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('Standar Lampiran 4.14 – 4.19 TP PKK');
      expect(html).toContain('Digitalisasi 31 Sheet Dasawisma');
      expect(html).not.toContain('Tailwind CSS v4');
      expect(html).not.toContain('React 19 &amp; Design Tokens');
    });

    it('renders Transparency Ledger with 4 BoardStatCard widgets', () => {
      const html = renderToString(
        <PublicBeranda wilayahList={INITIAL_WILAYAH} families={INITIAL_FAMILIES} />
      );

      expect(html).toContain('Transparency Ledger — Indikator Kunci Real-Time Desa Grudo');
      expect(html).toContain('31 / 31 Sheet Aktif');
      expect(html).toContain('Total Kepala Keluarga Terdata');
      expect(html).toContain('Total Jiwa Warga Tercatat');
      expect(html).toContain('Kelompok RT &amp; Dasawisma');
      expect(html).toContain('Digitalisasi Buku Dasawisma');
    });

    it('renders Quick Access Bar without developer CLI command or tech vanity', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('Sistem Informasi Manajemen PKK Terpadu (SIMPATIK)');
      expect(html).not.toContain('npx');
      expect(html).not.toContain('npm run dev');
      expect(html).toContain('Login Petugas');
    });

    it('renders Direktori Kelompok RT Domisili with Dusun filter chips', () => {
      const html = renderToString(
        <PublicBeranda wilayahList={INITIAL_WILAYAH} families={INITIAL_FAMILIES} />
      );

      expect(html).toContain('Direktori Wilayah Domisili');
      expect(html).toContain('Pilih Kelompok RT &amp; Dasawisma Tempat Tinggal Anda');
      expect(html).toContain('Semua Dusun');
      expect(html).toContain('Grudo');
      expect(html).toContain('Krajan');
      expect(html).toContain('Mojorejo');
      expect(html).toContain('Nglarangan');

      // Verify RT cards rendering
      expect(html).toContain('Dasawisma Dahlia 1');
      expect(html).toContain('Ibu Siti Aminah');
      expect(html).toContain('Isi Formulir Dasawisma Dahlia 1 (RT 01/RW 01)');
    });

    it('renders 3-step guide procedure cards', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('Prosedur Tertib Administrasi Keluarga');
      expect(html).toContain('Panduan Alur 3 Tahap Pengisian Mandiri Warga');
      expect(html).toContain('Identitas Rumah Tangga &amp; Titik Lokasi');
      expect(html).toContain('Sanitasi, Jiwa Keluarga &amp; HATINYA PKK');
      expect(html).toContain('Verifikasi Kader RT &amp; Rekap 31 Sheet');
    });

    it('renders interactive FAQ Accordion with 4 questions and expanded initial item', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('Pusat Bantuan Warga');
      expect(html).toContain('Tanya Jawab Seputar Pendataan SIMPATIK');

      for (const item of FAQ_ITEMS) {
        expect(html).toContain(item.q);
      }
      // First FAQ answer should be expanded by default
      expect(html).toContain(FAQ_ITEMS[0].a);
    });

    it('renders Callout Portal Petugas with RBAC link', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('Portal Khusus Pengelola &amp; Kader PKK');
      expect(html).toContain('Bertugas sebagai Kader Dasawisma, Pengurus RW/Dusun, atau Admin Desa?');
      expect(html).toContain('Ekspor otomatis Buku Dasawisma 31 Sheet Excel (.xls)');
      expect(html).toContain('Masuk Akun Petugas PKK');
      expect(html).toContain('Lihat Matriks RBAC');
    });

    it('renders officer dashboard button when user is logged in', () => {
      const mockOfficer: OfficerAccount = {
        id: 'usr-kader-01',
        nama: 'Ibu Siti Aminah',
        username: 'kader_rt01',
        passwordPlain: 'dahlia01',
        role: 'KADER_RT',
        aktif: true,
        scopeDusun: 'Grudo',
        scopeRw: '01',
        scopeRt: '01',
        terakhirMasuk: '2026-10-28',
      };

      const html = renderToString(
        <PublicBeranda
          currentUser={mockOfficer}
          currentRole="KADER_RT"
        />
      );

      expect(html).toContain('Buka Dashboard Petugas');
      expect(html).toContain('Peran: KADER_RT');
      expect(html).toContain('Buka Dashboard Operasional');
    });

    it('is wrapped in PublicLayout with brand header and footer', () => {
      const html = renderToString(<PublicBeranda />);

      expect(html).toContain('data-simpatik-layout="public"');
      expect(html).toContain('SIMPATIK Grudo');
      expect(html).toContain('v1.0.1');
      expect(html).toContain('Pemerintah Desa Grudo &amp; Inisiatif Bhakti Grisa');
    });
  });

  describe('TentangPage Component', () => {
    it('renders citizen-grade initiative documentation without internal file path artifacts', () => {
      const html = renderToString(<TentangPage />);

      expect(html).toContain('Layanan Publik Warga &amp; Tata Kerja TP PKK Desa Grudo');
      expect(html).toContain('Verifikasi Faktual Kader Dasawisma Lapangan');
      expect(html).not.toContain('(public)/layout.tsx');
      expect(html).not.toContain('dashboard/layout.tsx');
    });
  });

  describe('PublicLogin Component', () => {
    it('renders SIMPATIK Split AuthCard layout', () => {
      const html = renderToString(<PublicLogin />);

      expect(html).toContain('data-simpatik-layout="public"');
      expect(html).toContain('SIMPATIK Desa Grudo');
      expect(html).toContain('Portal Pengelola &amp; Kader PKK');
      expect(html).toContain('Masuk Akun Pengelola PKK');
      expect(html).toContain('Khusus Kader Dasawisma RT, Pengurus RW, Pengurus Dusun, dan Admin Desa Grudo.');
    });

    it('renders username and password input fields with labels', () => {
      const html = renderToString(<PublicLogin />);

      expect(html).toContain('login-username');
      expect(html).toContain('Username Petugas');
      expect(html).toContain('login-password');
      expect(html).toContain('Kata Sandi');
      expect(html).toContain('Masuk ke Ruang Kerja Petugas');
      expect(html).toContain('Otentikasi RBAC Berjenjang');
    });

    it('renders initiative key pillars in the right column', () => {
      const html = renderToString(<PublicLogin />);

      expect(html).toContain('Verifikasi Berkas 1-Klik');
      expect(html).toContain('Mutasi Peristiwa Vital');
      expect(html).toContain('Peta Spasial GIS');
      expect(html).toContain('Otomasi 31 Sheet');
    });

    it('renders resident notice and link to public self-reporting form', () => {
      const html = renderToString(<PublicLogin />);

      expect(html).toContain('Informasi bagi Warga Masyarakat:');
      expect(html).toContain('tidak memerlukan akun login petugas');
      expect(html).toContain('Buka Formulir Mandiri Warga');
    });

    it('renders active session callout if currentUser is provided', () => {
      const mockOfficer: OfficerAccount = {
        id: 'usr-admin-01',
        nama: 'Hj. Kartika Sari, S.Sos',
        username: 'admin_desa',
        passwordPlain: 'simpatik2026',
        role: 'ADMIN_DESA',
        aktif: true,
        terakhirMasuk: '2026-10-28',
      };

      const html = renderToString(
        <PublicLogin currentUser={mockOfficer} />
      );

      expect(html).toContain('Sesi Aktif: Hj. Kartika Sari, S.Sos');
      expect(html).toContain('Anda sedang masuk sebagai @admin_desa (ADMIN_DESA).');
      expect(html).toContain('Ke Dashboard');
    });
  });

  describe('Server Component HomePage resolution', () => {
    it('executes HomePage() async function and resolves to a valid React element', async () => {
      const pageElement = await HomePage();
      expect(React.isValidElement(pageElement)).toBe(true);

      const html = renderToString(pageElement);
      expect(html).toContain('Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Keluarga');
      expect(html).toContain('Transparency Ledger');
    });
  });

  describe('LoginPage default wrapper resolution', () => {
    it('renders LoginPage with Suspense boundary', () => {
      const html = renderToString(<LoginPage />);
      expect(html).toContain('Masuk Akun Pengelola PKK');
    });
  });
});
