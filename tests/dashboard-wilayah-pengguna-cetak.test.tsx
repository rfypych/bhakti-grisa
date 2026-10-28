import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DashboardWilayah } from '../src/components/dashboard/DashboardWilayah';
import { DashboardPengguna } from '../src/components/dashboard/DashboardPengguna';
import { DashboardCetak } from '../src/components/dashboard/DashboardCetak';
import {
  INITIAL_WILAYAH,
  INITIAL_FAMILIES,
  INITIAL_OFFICERS,
} from '../src/lib/seedData';
import {
  Wilayah,
  KeluargaRecord,
  OfficerAccount,
  validateWilayahDeletion,
  filterFamiliesByRoleScope,
} from '../src/lib/domain';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/wilayah',
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
vi.mock('../src/actions/wilayahActions', () => ({
  createWilayahAction: vi.fn().mockResolvedValue({ success: true }),
  tambahWilayahAction: vi.fn().mockResolvedValue({ success: true }),
  updateWilayahAction: vi.fn().mockResolvedValue({ success: true }),
  deleteWilayahAction: vi.fn().mockResolvedValue({ success: true }),
  hapusWilayahAction: vi.fn().mockResolvedValue({ success: true }),
  getWilayahListWithCounts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/actions/penggunaActions', () => ({
  createPenggunaAction: vi.fn().mockResolvedValue({ success: true }),
  tambahPenggunaAction: vi.fn().mockResolvedValue({ success: true }),
  toggleStatusPenggunaAction: vi.fn().mockResolvedValue({ success: true, aktif: false }),
  resetPasswordAction: vi.fn().mockResolvedValue({ success: true }),
  resetPasswordPenggunaAction: vi.fn().mockResolvedValue({ success: true }),
  getPenggunaList: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/lib/exportUtils', () => ({
  downloadOfficialPdfReport: vi.fn().mockReturnValue('mock-file.html'),
  downloadExcel31SheetWorkbook: vi.fn().mockReturnValue('mock-file.xls'),
}));

describe('Task 7: Wilayah, Pengguna & Lampiran 4.15 Cetak Laporan Suite', () => {
  const adminUser = INITIAL_OFFICERS.find((o) => o.role === 'ADMIN_DESA') || INITIAL_OFFICERS[0];
  const kaderUser = INITIAL_OFFICERS.find((o) => o.role === 'KADER_RT') || {
    id: 'kader-1',
    nama: 'Ibu Mulyani',
    username: 'kader_rt01',
    passwordPlain: 'pkkgrudo2026',
    role: 'KADER_RT' as const,
    aktif: true,
    wilayahId: 'wil-rt01-rw01',
    scopeDusun: 'Grudo',
    scopeRw: '01',
    scopeRt: '01',
    terakhirMasuk: '2026-10-28',
  };

  describe('1. DashboardWilayah Component', () => {
    it('enforces RBAC block for non-admin users (e.g. KADER_RT)', () => {
      const html = renderToString(
        <DashboardWilayah
          wilayahList={INITIAL_WILAYAH}
          families={INITIAL_FAMILIES}
          officers={INITIAL_OFFICERS}
          currentUser={kaderUser}
          currentRole="KADER_RT"
        />
      );

      expect(html).toContain('Akses Manajemen Wilayah Terkunci (Khusus Admin Desa)');
      expect(html).toContain('tidak memiliki izin mengelola struktur hierarki Dusun/RW/RT');
      expect(html).toContain('Kembali ke Dashboard');
      expect(html).not.toContain('+ Tambah Unit Wilayah Baru');
    });

    it('renders admin view with Dusun StatCards, Search bar, and Wilayah Table', () => {
      const html = renderToString(
        <DashboardWilayah
          wilayahList={INITIAL_WILAYAH}
          families={INITIAL_FAMILIES}
          officers={INITIAL_OFFICERS}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Manajemen Wilayah Administrasi (Dusun, RW, RT &amp; Dasawisma)');
      expect(html).toContain('Proteksi Integritas Data (Safety Guard)');
      expect(html).toContain('+ Tambah Unit Wilayah Baru');

      // StatCards
      expect(html).toContain('Jumlah Dusun');
      expect(html).toContain('Jumlah Rukun Warga (RW)');
      expect(html).toContain('Kelompok RT &amp; Dasawisma');
      expect(html).toContain('Total KK Dinaungi');

      // Search bar
      expect(html).toContain('Cari Dasawisma / RT / Dusun...');

      // Table columns
      expect(html).toContain('Kelompok Dasawisma');
      expect(html).toContain('Dusun');
      expect(html).toContain('RT / RW');
      expect(html).toContain('Ketua / Kader Dasawisma');
      expect(html).toContain('KK Terdaftar');
      expect(html).toContain('Kader Tertaut');
      expect(html).toContain('Status Proteksi');
      expect(html).toContain('Aksi');
    });

    it('displays Safety Guard Aktif for wilayah with linked families or active cadres', () => {
      // Create test data with one occupied wilayah and one empty wilayah
      const occupiedWil: Wilayah = {
        id: 'wil-occupied',
        dusun: 'Grudo',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Mawar Occupied',
        aktif: true,
        ketuaDasawisma: 'Ibu Mawar',
        targetKK: 25,
      };

      const emptyWil: Wilayah = {
        id: 'wil-empty',
        dusun: 'Krajan',
        rw: '02',
        rt: '03',
        namaDasawisma: 'Melati Empty',
        aktif: true,
        ketuaDasawisma: 'Ibu Melati',
        targetKK: 20,
      };

      const testFamilies: KeluargaRecord[] = [
        {
          ...INITIAL_FAMILIES[0],
          wilayahId: 'wil-occupied',
        },
      ];

      const html = renderToString(
        <DashboardWilayah
          wilayahList={[occupiedWil, emptyWil]}
          families={testFamilies}
          officers={INITIAL_OFFICERS}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Dasawisma Mawar Occupied');
      expect(html).toContain('Safety Guard Aktif');
      expect(html).toContain('Dasawisma Melati Empty');
      expect(html).toContain('Kosong (Dapat Dihapus)');
    });

    it('validateWilayahDeletion prevents deletion of wilayah with active families or officers', () => {
      const wilId = 'wil-test-123';
      const linkedFam: KeluargaRecord[] = [
        {
          ...INITIAL_FAMILIES[0],
          wilayahId: wilId,
        },
      ];
      const emptyOfficers: OfficerAccount[] = [];

      const checkOccupied = validateWilayahDeletion(wilId, linkedFam, emptyOfficers);
      expect(checkOccupied.allowed).toBe(false);
      expect(checkOccupied.linkedFamiliesCount).toBe(1);
      expect(checkOccupied.reason).toContain('Proteksi Integritas Data Aktif');

      const checkEmpty = validateWilayahDeletion('wil-unlinked', linkedFam, emptyOfficers);
      expect(checkEmpty.allowed).toBe(true);
      expect(checkEmpty.linkedFamiliesCount).toBe(0);
      expect(checkEmpty.linkedOfficersCount).toBe(0);
    });
  });

  describe('2. DashboardPengguna Component', () => {
    it('enforces RBAC block for non-admin users (e.g. KADER_RT)', () => {
      const html = renderToString(
        <DashboardPengguna
          officers={INITIAL_OFFICERS}
          wilayahList={INITIAL_WILAYAH}
          currentUser={kaderUser}
          currentRole="KADER_RT"
        />
      );

      expect(html).toContain('Akses Manajemen Pengguna Terkunci (Khusus Admin Desa)');
      expect(html).toContain('tidak memiliki wewenang mengelola akun petugas');
      expect(html).toContain('Kembali ke Dashboard');
      expect(html).not.toContain('+ Buat Akun Petugas Baru');
    });

    it('renders admin officer directory with roles, scopes, and active badges', () => {
      const html = renderToString(
        <DashboardPengguna
          officers={INITIAL_OFFICERS}
          wilayahList={INITIAL_WILAYAH}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Manajemen Akun Pengelola &amp; Kader TP PKK');
      expect(html).toContain('+ Buat Akun Petugas Baru');
      expect(html).toContain('Direktori Akun Pengelola &amp; Kader Terdaftar');

      // Table columns
      expect(html).toContain('Nama Petugas / Kader');
      expect(html).toContain('Username');
      expect(html).toContain('Peran RBAC');
      expect(html).toContain('Cakupan Wilayah Tugas (Scope)');
      expect(html).toContain('Status Akun');
      expect(html).toContain('Terakhir Masuk');
      expect(html).toContain('Pemeliharaan');

      // Action buttons
      expect(html).toContain('Reset Sandi');
      expect(html).toContain('Nonaktifkan');
    });

    it('renders scope descriptions accurately according to officer role', () => {
      const customOfficers: OfficerAccount[] = [
        {
          id: 'adm-1',
          nama: 'Admin Desa Grudo',
          username: 'admin_desa',
          passwordPlain: 'admin123',
          role: 'ADMIN_DESA',
          aktif: true,
          terakhirMasuk: 'Hari ini',
        },
        {
          id: 'dus-1',
          nama: 'Koordinator Dusun',
          username: 'dus_grudo',
          passwordPlain: 'dusun123',
          role: 'PENGURUS_DUSUN',
          scopeDusun: 'Krajan',
          aktif: true,
          terakhirMasuk: 'Kemarin',
        },
        {
          id: 'rw-1',
          nama: 'Ketua RW 02',
          username: 'rw02_krajan',
          passwordPlain: 'rw123',
          role: 'PENGURUS_RW',
          scopeDusun: 'Krajan',
          scopeRw: '02',
          aktif: true,
          terakhirMasuk: '2 hari lalu',
        },
        {
          id: 'rt-1',
          nama: 'Kader RT 01',
          username: 'kader_rt01',
          passwordPlain: 'rt123',
          role: 'KADER_RT',
          scopeDusun: 'Krajan',
          scopeRw: '02',
          scopeRt: '01',
          aktif: false,
          terakhirMasuk: 'Minggu lalu',
        },
      ];

      const html = renderToString(
        <DashboardPengguna
          officers={customOfficers}
          wilayahList={INITIAL_WILAYAH}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('Seluruh Wilayah Desa Grudo');
      expect(html).toContain('Dusun Krajan');
      expect(html).toContain('RW 02 (Dusun Krajan)');
      expect(html).toContain('RT 01/RW 02 (Dusun Krajan)');
      expect(html).toContain('Aktif Bertugas');
      expect(html).toContain('Purnatugas / Nonaktif');
      expect(html).toContain('Aktifkan'); // For the inactive user
    });
  });

  describe('3. DashboardCetak Component (Lampiran 4.15)', () => {
    const verifiedFamilies = INITIAL_FAMILIES.filter((f) => f.status === 'VERIFIKASI');
    const firstFamily = verifiedFamilies[0];

    it('renders control toolbar with back button, family select, print, and download actions', () => {
      const html = renderToString(
        <DashboardCetak
          families={verifiedFamilies}
          selectedCetakId={firstFamily.id}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      // Toolbar is styled with no-print
      expect(html).toContain('no-print');
      expect(html).toContain('Kembali');
      expect(html).toContain('Pilih Keluarga untuk Dicetak');
      expect(html).toContain(firstFamily.namaKepalaKeluarga);
      expect(html).toContain(firstFamily.noKK);
      expect(html).toContain('Unduh PDF / HTML');
      expect(html).toContain('Cetak Lampiran 4.15');
    });

    it('renders the official Lampiran 4.15 header, identification banner, and family metadata', () => {
      const html = renderToString(
        <DashboardCetak
          families={verifiedFamilies}
          selectedCetakId={firstFamily.id}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('print-sheet');
      expect(html).toContain('TIM PENGGERAK PKK DESA GRUDO · KECAMATAN NGAWI · KABUPATEN NGAWI');
      expect(html).toContain('CATATAN KELUARGA');
      expect(html).toContain('LAMPIRAN 4.15');
      expect(html).toContain(`No. KK: ${firstFamily.noKK}`);

      // Two-column metadata
      expect(html).toContain('Catatan Keluarga dari');
      expect(html).toContain(firstFamily.namaKepalaKeluarga);
      expect(html).toContain('Anggota Kelompok Dasawisma');
      expect(html).toContain(firstFamily.namaDasawisma);
      expect(html).toContain(`RT ${firstFamily.rt} / RW ${firstFamily.rw} · Dusun ${firstFamily.dusun}`);
      expect(html).toContain('Desa Grudo / Kec. Ngawi, Kab. Ngawi');

      // Sanitation & criteria
      expect(html).toContain('Kriteria Rumah');
      expect(html).toContain('Jamban Keluarga &amp; Air');
      expect(html).toContain('Tempat Sampah &amp; SPAL');
      expect(html).toContain('Stiker P4K &amp; Makanan Pokok');
      expect(html).toContain('Aktivitas UP2K PKK');
    });

    it('renders Table I with all demographic columns and member data', () => {
      const html = renderToString(
        <DashboardCetak
          families={verifiedFamilies}
          selectedCetakId={firstFamily.id}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('I. Tabel Data Anggota Keluarga');
      expect(html).toContain('Nama Anggota Keluarga');
      expect(html).toContain('NIK / Virtual NIK');
      expect(html).toContain('Status Dlm Keluarga');
      expect(html).toContain('Status Kawin');
      expect(html).toContain('L/P');
      expect(html).toContain('Tgl Lahir / Umur');
      expect(html).toContain('Pendidikan');
      expect(html).toContain('Pekerjaan');
      expect(html).toContain('Indikator Khusus &amp; Status');

      // Check first member's presence
      const firstMember = firstFamily.anggota[0];
      expect(html).toContain(firstMember.nama);
      expect(html).toContain(firstMember.nik);
    });

    it('renders Table II (HATINYA PKK & UP2K) and official signatures', () => {
      const html = renderToString(
        <DashboardCetak
          families={verifiedFamilies}
          selectedCetakId={firstFamily.id}
          currentUser={adminUser}
          currentRole="ADMIN_DESA"
        />
      );

      expect(html).toContain('II. Pemanfaatan Tanah Pekarangan (HATINYA PKK) &amp; Industri Rumah Tangga');
      expect(html).toContain('Tanaman Obat (TOGA)');
      expect(html).toContain('Sayuran / Warung Hidup');
      expect(html).toContain('Tanaman Keras');
      expect(html).toContain('Perikanan Kolam');
      expect(html).toContain('Peternakan');
      expect(html).toContain('Industri RT');

      // Signatures
      expect(html).toContain('Mengetahui,');
      expect(html).toContain(`Ketua Kelompok Dasawisma ${firstFamily.namaDasawisma}`);
      expect(html).toContain(`( Kader RT ${firstFamily.rt} / RW ${firstFamily.rw} )`);
      expect(html).toContain(`Desa Grudo, Oktober ${firstFamily.tahunPendataan}`);
      expect(html).toContain('Kepala Keluarga Bersangkutan');
      expect(html).toContain(`( ${firstFamily.namaKepalaKeluarga} )`);
    });

    it('respects role scoping filter when selecting printable families', () => {
      const scoped = filterFamiliesByRoleScope(INITIAL_FAMILIES, 'KADER_RT', kaderUser);
      // Kader user has scope RT 01 RW 01
      expect(scoped.every((f) => f.rt === kaderUser.scopeRt || f.wilayahId === kaderUser.wilayahId)).toBe(true);

      const html = renderToString(
        <DashboardCetak
          families={scoped}
          currentUser={kaderUser}
          currentRole="KADER_RT"
        />
      );

      expect(html).toContain('CATATAN KELUARGA');
    });

    it('renders empty notice when no family matches current scope', () => {
      const html = renderToString(
        <DashboardCetak
          families={[]}
          currentUser={kaderUser}
          currentRole="KADER_RT"
        />
      );

      expect(html).toContain('Tidak ditemukan data keluarga untuk dicetak pada wilayah cakupan ini.');
    });
  });
});
