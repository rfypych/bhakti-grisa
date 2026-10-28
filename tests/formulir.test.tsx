import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  PublicFormulir,
  createDefaultFormState,
  STORAGE_KEY,
  DraftFormState,
} from '../src/app/formulir/page';
import {
  generateVirtualNik,
  calculateAge,
  computeHouseholdSeverity,
  KeluargaRecord,
} from '../src/lib/domain';
import { INITIAL_WILAYAH } from '../src/lib/seedData';
import { saveKeluargaAction, KeluargaInputData } from '../src/actions/keluargaActions';
import { prisma } from '../src/lib/prisma';

// Polyfill in-memory localStorage for node test runner
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => {
    storageMap.set(key, String(val));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] || null,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
}

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/formulir',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'wilayahId' ? 'wil-rt01-rw01' : null),
  }),
}));

describe('Redesigned Formulir Mandiri 5 Langkah (Task 4)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. 5-Step Stepper Progression & View Rendering', () => {
    it('renders Step 1: Wilayah Administrasi & Identitas Bangunan Rumah with 5 navigation pills', () => {
      const html = renderToString(<PublicFormulir initialStep={1} />);

      // Header, badge, draft status, reset button
      expect(html).toContain('Engine Single Entry 5 Tahapan');
      expect(html).toContain('Mode Pengisian Mandiri Warga (Status: DRAFT)');
      expect(html).toContain('Tersimpan di Perangkat');
      expect(html).toContain('Reset Draft');

      // 5-Step pills
      expect(html).toContain('Langkah 01');
      expect(html).toContain('Wilayah &amp; Bangunan');
      expect(html).toContain('Langkah 02');
      expect(html).toContain('Sanitasi &amp; Lingkungan');
      expect(html).toContain('Langkah 03');
      expect(html).toContain('Anggota Keluarga');
      expect(html).toContain('Langkah 04');
      expect(html).toContain('Pekarangan &amp; UP2K');
      expect(html).toContain('Langkah 05');
      expect(html).toContain('Konfirmasi &amp; Pengiriman');

      // Step 1 contents
      expect(html).toContain('01. Wilayah Administrasi &amp; Identitas Bangunan Rumah');
      expect(html).toContain('Nomor Kartu Keluarga (KK - 16 Digit)');
      expect(html).toContain('Nama Lengkap Kepala Rumah Tangga');
      expect(html).toContain('Alamat Lengkap Rumah Tinggal');
      expect(html).toContain('Penandaan Koordinat GPS Rumah');
      expect(html).toContain('Titik Dusun Krajan');
      expect(html).toContain('Titik Dusun Tegalsari');
      expect(html).toContain('Balai Desa Grudo');
      expect(html).toContain('Lanjut ke Langkah 02');
    });

    it('renders Step 2: Sanitasi & Lingkungan with Kriteria, Sumber Air, and Checklist', () => {
      const html = renderToString(<PublicFormulir initialStep={2} />);

      expect(html).toContain('02. Sanitasi &amp; Kondisi Kesehatan Lingkungan Rumah');
      expect(html).toContain('Kriteria Kesehatan Rumah');
      expect(html).toContain('Rumah Sehat (Ventilasi, Cahaya &amp; Sanitasi Layak)');
      expect(html).toContain('Sumber Air Bersih Utama Keluarga');
      expect(html).toContain('PDAM / Perpipaan Resmi');
      expect(html).toContain('Memiliki Jamban Keluarga Sendiri');
      expect(html).toContain('Saluran Pembuangan Air Limbah (SPAL) Tertutup');
      expect(html).toContain('Memiliki Tempat Pembuangan Sampah Layak');
      expect(html).toContain('Menempel Stiker P4K');
      expect(html).toContain('Langkah Sebelumnya');
      expect(html).toContain('Lanjut ke Langkah 03');
    });

    it('renders Step 3: Anggota Keluarga with Member Rows, Indicators, and Virtual NIK CTA', () => {
      const html = renderToString(<PublicFormulir initialStep={3} />);

      expect(html).toContain('03. Pendataan Anggota Keluarga (Jiwa) &amp; Virtual NIK Bayi');
      expect(html).toContain('Tambah Anggota');
      expect(html).toContain('+ Tambah Bayi Baru Lahir (Virtual NIK)');
      expect(html).toContain('Generate NIK Virtual Otomatis');
      expect(html).toContain('Nama Lengkap Sesuai KK / Akta');
      expect(html).toContain('Hubungan Keluarga');
      expect(html).toContain('Jenis Kelamin');
      expect(html).toContain('Pendidikan Terakhir');
      expect(html).toContain('Status Perkawinan');
      expect(html).toContain('Pekerjaan');
      expect(html).toContain('Balita (&lt;5 th)');
      expect(html).toContain('Lansia (≥60 th)');
      expect(html).toContain('Ibu Hamil');
      expect(html).toContain('Ibu Menyusui');
      expect(html).toContain('Buta Aksara (3 Buta)');
      expect(html).toContain('Penyandang Disabilitas');
      expect(html).toContain('Akseptor KB');
    });

    it('renders Step 4: Pekarangan & UP2K (HATINYA PKK)', () => {
      const html = renderToString(<PublicFormulir initialStep={4} />);

      expect(html).toContain('04. Pemanfaatan Tanah Pekarangan (HATINYA PKK) &amp; Ekonomi UP2K');
      expect(html).toContain('Pemanfaatan Lahan Pekarangan Rumah (HATINYA PKK)');
      expect(html).toContain('Tanaman Obat Keluarga (TOGA / Apotek Hidup)');
      expect(html).toContain('Tanaman Sayuran &amp; Warung Hidup');
      expect(html).toContain('Tanaman Keras / Buah &amp; Penghijauan');
      expect(html).toContain('Perikanan Air Tawar');
      expect(html).toContain('Peternakan Unggas / Kambing / Sapi');
      expect(html).toContain('Keikutsertaan Kelompok UP2K PKK');
      expect(html).toContain('Kategori Industri Rumah Tangga');
      expect(html).toContain('Bidang PANGAN');
      expect(html).toContain('Konsumsi Makanan Pokok Harian');
    });

    it('renders Step 5: Ringkasan & Konfirmasi Pengiriman with live severity level score pill', () => {
      const html = renderToString(<PublicFormulir initialStep={5} />);

      expect(html).toContain('05. Ringkasan Komprehensif &amp; Konfirmasi Pengiriman');
      expect(html).toContain('A. Identitas Wilayah &amp; Rumah Tangga');
      expect(html).toContain('B. Sanitasi &amp; Pekarangan HATINYA PKK');
      expect(html).toContain('C. Daftar Anggota Keluarga');
      expect(html).toContain('Status Lingkungan:');
      expect(html).toContain('Saya menyatakan dengan sebenarnya');
      expect(html).toContain('Kirim Formulir Keluarga Mandiri');
    });
  });

  describe('2. Virtual NIK Generator for Infants / Balita', () => {
    it('generates a standard TEMP-YYYYMMDD-XXXX temporary virtual NIK', () => {
      const maleNik = generateVirtualNik('2026-10-20', 'L', 1);
      expect(maleNik).toMatch(/^TEMP-20261020-[A-Z0-9]{4}$/);
      expect(maleNik.startsWith('352109')).toBe(false);

      const femaleNik = generateVirtualNik('2026-10-20', 'P', 2);
      expect(femaleNik).toMatch(/^TEMP-20261020-[A-Z0-9]{4}$/);
      expect(femaleNik.startsWith('352109')).toBe(false);
    });

    it('renders member row with active Virtual NIK indicator badge', () => {
      const draftWithVirtualBaby: Partial<DraftFormState> = {
        step: 3,
        anggota: [
          {
            id: 'baby-01',
            nama: 'Bayi Ananda',
            nik: generateVirtualNik('2026-10-01', 'P', 1),
            isVirtualNik: true,
            hubungan: 'ANAK',
            jenisKelamin: 'P',
            tempatLahir: 'Ngawi',
            tanggalLahir: '2026-10-01',
            umur: 0,
            statusKawin: 'BELUM_KAWIN',
            agama: 'ISLAM',
            pendidikan: 'TIDAK_SEKOLAH',
            pekerjaan: 'Belum Bekerja',
            isBalita: true,
            isLansia: false,
            isIbuHamil: false,
            isIbuMenyusui: false,
            isButaAksara: false,
            isDisabilitas: false,
            statusHidup: 'HIDUP',
            akseptorKb: false,
          },
        ],
      };

      const html = renderToString(<PublicFormulir initialDraft={draftWithVirtualBaby} />);
      expect(html).toContain('Virtual NIK Sementara Aktif');
      expect(html).toContain('Bayi Ananda');
      expect(html).toContain('TEMP-20261001-');
    });
  });

  describe('3. Auto-Save Draft Loading & Restoration', () => {
    it('initializes default form state with required fields', () => {
      const defaultState = createDefaultFormState('wil-rt01-rw01');
      expect(defaultState.step).toBe(1);
      expect(defaultState.wilayahId).toBe('wil-rt01-rw01');
      expect(defaultState.noKK).toBe('3521092710260009');
      expect(defaultState.kriteriaRumah).toBe('SEHAT');
      expect(defaultState.anggota).toHaveLength(1);
      expect(defaultState.anggota[0].hubungan).toBe('KEPALA_KELUARGA');
    });

    it('restores draft state saved in localStorage', () => {
      const customDraft = {
        step: 2,
        wilayahId: 'wil-rt02-rw01',
        noKK: '3521091122334455',
        namaKepalaKeluarga: 'Bapak Sugeng Riyadi',
        alamat: 'Jl. Merak No. 42 Grudo',
      };
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(customDraft));

      const html = renderToString(<PublicFormulir />);
      // Should restore into Step 2 and have populated fields
      expect(html).toContain('02. Sanitasi &amp; Kondisi Kesehatan Lingkungan Rumah');
      expect(mockLocalStorage.getItem(STORAGE_KEY)).toContain('3521091122334455');
    });
  });

  describe('4. Household Severity Index (Normal / Pantau / Kritis)', () => {
    it('computes HIJAU (Normal) for healthy household with sanitation', () => {
      const testFam: KeluargaRecord = {
        id: 'fam-normal',
        noKK: '3521091234567890',
        namaKepalaKeluarga: 'Budi Santoso',
        wilayahId: 'wil-01',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Dahlia 1',
        alamat: 'RT 01',
        latitude: -7.4,
        longitude: 111.4,
        tahunPendataan: 2026,
        status: 'DRAFT',
        diinputOleh: 'WARGA_MANDIRI',
        tanggalInput: '2026-10-28',
        tanggalUpdate: '2026-10-28',
        sanitasi: {
          kriteriaRumah: 'SEHAT',
          punyaJamban: true,
          jumlahJamban: 1,
          sumberAir: 'PDAM',
          punyaSpal: true,
          punyaTempatSampah: true,
          tempelStikerP4k: true,
        },
        pekarangan: {
          tanamanKeras: true,
          toga: true,
          sayuran: true,
          perikanan: false,
          peternakan: false,
          industriRumahTangga: ['PANGAN'],
          ikutUp2k: false,
          makananPokok: 'BERAS',
        },
        anggota: [
          {
            id: 'ang-1',
            nama: 'Budi Santoso',
            nik: '3521091206880001',
            isVirtualNik: false,
            hubungan: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Ngawi',
            tanggalLahir: '1988-06-12',
            umur: 38,
            statusKawin: 'KAWIN',
            agama: 'ISLAM',
            pendidikan: 'SMA',
            pekerjaan: 'Wiraswasta',
            isBalita: false,
            isLansia: false,
            isIbuHamil: false,
            isIbuMenyusui: false,
            isButaAksara: false,
            isDisabilitas: false,
            statusHidup: 'HIDUP',
          },
        ],
      };

      const result = computeHouseholdSeverity(testFam);
      expect(result.severity).toBe('HIJAU');
      expect(result.label).toContain('Rumah Sehat & Mandiri');
    });

    it('computes KUNING (Pantau) for household with balita or lansia', () => {
      const testFam: KeluargaRecord = {
        id: 'fam-pantau',
        noKK: '3521091234567891',
        namaKepalaKeluarga: 'Hasan',
        wilayahId: 'wil-01',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Dahlia 1',
        alamat: 'RT 01',
        latitude: -7.4,
        longitude: 111.4,
        tahunPendataan: 2026,
        status: 'DRAFT',
        diinputOleh: 'WARGA_MANDIRI',
        tanggalInput: '2026-10-28',
        tanggalUpdate: '2026-10-28',
        sanitasi: {
          kriteriaRumah: 'SEHAT',
          punyaJamban: true,
          jumlahJamban: 1,
          sumberAir: 'PDAM',
          punyaSpal: true,
          punyaTempatSampah: true,
          tempelStikerP4k: true,
        },
        pekarangan: {
          tanamanKeras: false,
          toga: false,
          sayuran: false,
          perikanan: false,
          peternakan: false,
          industriRumahTangga: [],
          ikutUp2k: false,
          makananPokok: 'BERAS',
        },
        anggota: [
          {
            id: 'ang-balita',
            nama: 'Balita Cilik',
            nik: '3521092010240001',
            isVirtualNik: false,
            hubungan: 'ANAK',
            jenisKelamin: 'L',
            tempatLahir: 'Ngawi',
            tanggalLahir: '2024-10-20',
            umur: 2,
            statusKawin: 'BELUM_KAWIN',
            agama: 'ISLAM',
            pendidikan: 'TIDAK_SEKOLAH',
            pekerjaan: 'Belum Bekerja',
            isBalita: true,
            isLansia: false,
            isIbuHamil: false,
            isIbuMenyusui: false,
            isButaAksara: false,
            isDisabilitas: false,
            statusHidup: 'HIDUP',
          },
        ],
      };

      const result = computeHouseholdSeverity(testFam);
      expect(result.severity).toBe('KUNING');
      expect(result.label).toContain('Pemantauan');
    });

    it('computes MERAH (Kritis) for household with TIDAK_SEHAT or without latrine', () => {
      const testFam: KeluargaRecord = {
        id: 'fam-kritis',
        noKK: '3521091234567892',
        namaKepalaKeluarga: 'Pak Sarmin',
        wilayahId: 'wil-01',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Dahlia 1',
        alamat: 'RT 01',
        latitude: -7.4,
        longitude: 111.4,
        tahunPendataan: 2026,
        status: 'DRAFT',
        diinputOleh: 'WARGA_MANDIRI',
        tanggalInput: '2026-10-28',
        tanggalUpdate: '2026-10-28',
        sanitasi: {
          kriteriaRumah: 'TIDAK_SEHAT',
          punyaJamban: false,
          jumlahJamban: 0,
          sumberAir: 'SUNGAI',
          punyaSpal: false,
          punyaTempatSampah: false,
          tempelStikerP4k: false,
        },
        pekarangan: {
          tanamanKeras: false,
          toga: false,
          sayuran: false,
          perikanan: false,
          peternakan: false,
          industriRumahTangga: [],
          ikutUp2k: false,
          makananPokok: 'NON_BERAS',
        },
        anggota: [],
      };

      const result = computeHouseholdSeverity(testFam);
      expect(result.severity).toBe('MERAH');
      expect(result.label).toContain('Kerentanan Tinggi');
    });
  });

  describe('5. Submission Handling, Prisma Action & Success Receipt Screen', () => {
    it('executes saveKeluargaAction with isPublicResident=true creating a DRAFT record', async () => {
      // Create test wilayah first
      const testWil = await prisma.wilayah.upsert({
        where: {
          dusun_rw_rt_namaDasawisma: {
            dusun: 'Grudo',
            rw: '01',
            rt: '01',
            namaDasawisma: 'Dahlia 01 Test',
          },
        },
        update: {},
        create: {
          id: 'wil-test-formulir-4',
          dusun: 'Grudo',
          rw: '01',
          rt: '01',
          namaDasawisma: 'Dahlia 01 Test',
          ketuaNama: 'Ibu Ketua RT',
        },
      });

      const payload: KeluargaInputData = {
        noKk: '3521092810260088',
        namaKepalaRumahTangga: 'Joko Widodo Grudo',
        alamat: 'Jl. Ahmad Yani No. 88 RT 01/RW 01',
        wilayahId: testWil.id,
        latitude: -7.4066,
        longitude: 111.4395,
        kriteriaRumah: 'SEHAT',
        jambanKeluarga: true,
        jumlahJamban: 1,
        sumberAir: 'PDAM',
        tempatSampah: true,
        spal: true,
        stikerP4k: true,
        makananPokok: 'BERAS',
        anggota: [
          {
            nama: 'Joko Widodo Grudo',
            nik: '3521091206880088',
            hubunganKeluarga: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Ngawi',
            tanggalLahir: '1988-06-12',
            agama: 'ISLAM',
            pendidikan: 'SMA_SMK_SEDERAJAT',
            pekerjaan: 'SWASTA',
            statusPerkawinan: 'KAWIN',
          },
        ],
      };

      const res = await saveKeluargaAction(payload, true);
      expect(res.success).toBe(true);

      // Verify in DB that status is DRAFT (per isPublicResident = true)
      const savedKeluarga = await prisma.keluarga.findUnique({
        where: { noKk: '3521092810260088' },
        include: { anggota: true },
      });

      expect(savedKeluarga).not.toBeNull();
      expect(savedKeluarga?.statusData).toBe('DRAFT');
      expect(savedKeluarga?.namaKepalaRumahTangga).toBe('Joko Widodo Grudo');
      expect(savedKeluarga?.anggota).toHaveLength(1);
    });

    it('renders Success Confirmation Receipt Screen matching simpatik-ref with receipt details', () => {
      const mockSubmitted: KeluargaRecord = {
        id: 'fam-submitted-test',
        noKK: '3521092810260088',
        namaKepalaKeluarga: 'Joko Widodo Grudo',
        wilayahId: 'wil-rt01-rw01',
        dusun: 'Grudo',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Dahlia 1',
        alamat: 'Jl. Ahmad Yani No. 88',
        latitude: -7.4066,
        longitude: 111.4395,
        tahunPendataan: 2026,
        status: 'DRAFT',
        diinputOleh: 'WARGA_MANDIRI',
        tanggalInput: '2026-10-28',
        tanggalUpdate: '2026-10-28',
        sanitasi: {
          kriteriaRumah: 'SEHAT',
          punyaJamban: true,
          jumlahJamban: 1,
          sumberAir: 'PDAM',
          punyaSpal: true,
          punyaTempatSampah: true,
          tempelStikerP4k: true,
        },
        pekarangan: {
          tanamanKeras: true,
          toga: true,
          sayuran: true,
          perikanan: false,
          peternakan: false,
          industriRumahTangga: ['PANGAN'],
          ikutUp2k: false,
          makananPokok: 'BERAS',
        },
        anggota: [
          {
            id: 'a-1',
            nama: 'Joko Widodo Grudo',
            nik: '3521091206880088',
            isVirtualNik: false,
            hubungan: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Ngawi',
            tanggalLahir: '1988-06-12',
            umur: 38,
            statusKawin: 'KAWIN',
            agama: 'ISLAM',
            pendidikan: 'SMA',
            pekerjaan: 'Wiraswasta',
            isBalita: false,
            isLansia: false,
            isIbuHamil: false,
            isIbuMenyusui: false,
            isButaAksara: false,
            isDisabilitas: false,
            statusHidup: 'HIDUP',
          },
        ],
      };

      const html = renderToString(<PublicFormulir initialSubmittedRecord={mockSubmitted} />);

      // Bukti penerimaan header
      expect(html).toContain('Bukti Penerimaan Berkas SIMPATIK Desa Grudo');
      expect(html).toContain('Data Keluarga Berhasil Dikirim');
      expect(html).toContain('Status: DRAFT (Menunggu Verifikasi Kader RT)');

      // Summary grid
      expect(html).toContain('Joko Widodo Grudo');
      expect(html).toContain('3521092810260088');
      expect(html).toContain('Dasawisma Dahlia 1 · RT 01/RW 01 (Dusun Grudo)');
      expect(html).toContain('1 Jiwa');

      // Explanation message
      expect(html).toContain('Data keluarga Anda telah masuk ke Antrean Verifikasi Kader RT setempat.');

      // Action buttons
      expect(html).toContain('Isi Formulir Keluarga Lainnya');
      expect(html).toContain('Cetak Bukti Registrasi');
      expect(html).toContain('Kembali ke Beranda');
    });
  });
});
