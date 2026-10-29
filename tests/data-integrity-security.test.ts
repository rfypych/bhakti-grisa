import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { saveKeluargaAction, KeluargaInputData } from '../src/actions/keluargaActions';
import { approveSubmissionAction } from '../src/actions/verifikasiActions';
import {
  laporKehamilanAction,
  laporMutasiAction,
  laporKematianAction,
} from '../src/actions/peristiwaActions';
import { GET as getPdfExport } from '../src/app/api/export/pdf/route';
import { GET as getExcelExport } from '../src/app/api/export/excel/route';
import { NextRequest } from 'next/server';
import * as auth from '../src/lib/auth';

describe('P0 Data Integrity & Security Invariants', () => {
  let wilayah1: any;
  let wilayah2: any;
  let verifiedFam1: any;

  beforeEach(async () => {
    vi.restoreAllMocks();

    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();
    await prisma.pengguna.deleteMany();

    wilayah1 = await prisma.wilayah.create({
      data: {
        id: 'wil-p0-rt01',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Mawar 1',
      },
    });

    wilayah2 = await prisma.wilayah.create({
      data: {
        id: 'wil-p0-rt02',
        dusun: 'Krajan',
        rw: '01',
        rt: '02',
        namaDasawisma: 'Melati 2',
      },
    });

    verifiedFam1 = await prisma.keluarga.create({
      data: {
        id: 'fam-verified-1',
        noKk: '3521090101010001',
        namaKepalaRumahTangga: 'Bapak Asli Terverifikasi',
        alamat: 'RT 01 RW 01',
        wilayahId: wilayah1.id,
        statusData: 'VERIFIKASI',
      },
    });

    await prisma.anggotaKeluarga.create({
      data: {
        id: 'ang-kepala-1',
        nik: '3521091501800001',
        nama: 'Bapak Asli Terverifikasi',
        hubunganKeluarga: 'KEPALA_KELUARGA',
        jenisKelamin: 'L',
        tempatLahir: 'Ngawi',
        tanggalLahir: new Date('1980-01-15'),
        keluargaId: verifiedFam1.id,
      },
    });
  });

  describe('1. Duplicate KK Guard & Minimum Member Check (B2-1, B2-3)', () => {
    it('rejects public submission with duplicate KK when record is already VERIFIKASI', async () => {
      const duplicateInput: KeluargaInputData = {
        noKk: '3521090101010001', // Same KK as verifiedFam1
        namaKepalaRumahTangga: 'Bapak Penyerobot Data',
        alamat: 'Alamat Baru Palsu',
        wilayahId: wilayah1.id,
        anggota: [
          {
            nama: 'Bapak Penyerobot Data',
            hubunganKeluarga: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Ngawi',
            tanggalLahir: '1985-05-05',
          },
        ],
      };

      const result = await saveKeluargaAction(duplicateInput, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nomor KK sudah terdaftar dan terverifikasi');

      // Invariant: original verified family must remain pristine
      const pristine = await prisma.keluarga.findUnique({
        where: { id: verifiedFam1.id },
      });
      expect(pristine?.namaKepalaRumahTangga).toBe('Bapak Asli Terverifikasi');
      expect(pristine?.statusData).toBe('VERIFIKASI');
    });

    it('rejects submission when family has 0 members', async () => {
      const zeroMemberInput: KeluargaInputData = {
        noKk: '3521090101019999',
        namaKepalaRumahTangga: 'Keluarga Tanpa Anggota',
        alamat: 'RT 01',
        wilayahId: wilayah1.id,
        anggota: [], // 0 members
      };

      const result = await saveKeluargaAction(zeroMemberInput, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('minimal 1 anggota keluarga');

      // Database should not have created the record
      const check = await prisma.keluarga.findUnique({
        where: { noKk: '3521090101019999' },
      });
      expect(check).toBeNull();
    });

    it('rejects submission when member real NIK belongs to another family (B3-1 member hijacking)', async () => {
      const hijackingInput: KeluargaInputData = {
        noKk: '3521090101017777', // New KK
        namaKepalaRumahTangga: 'Bapak Pembajak',
        alamat: 'RT 01 RW 01',
        wilayahId: wilayah1.id,
        anggota: [
          {
            nik: '3521091501800001', // Belongs to verifiedFam1 (ang-kepala-1)
            nama: 'Bapak Terverifikasi Terbajak',
            hubunganKeluarga: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Ngawi',
            tanggalLahir: '1980-01-15',
          },
        ],
      };

      const result = await saveKeluargaAction(hijackingInput, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah terdaftar pada keluarga lain');

      // Original member must STILL belong to verifiedFam1!
      const member = await prisma.anggotaKeluarga.findUnique({
        where: { nik: '3521091501800001' },
      });
      expect(member?.keluargaId).toBe(verifiedFam1.id);
    });

    it('rejects approval of a draft family with 0 members', async () => {
      const draftZeroMember = await prisma.keluarga.create({
        data: {
          id: 'fam-draft-zero',
          noKk: '3521090101018888',
          namaKepalaRumahTangga: 'Keluarga Hantu',
          alamat: 'RT 01',
          wilayahId: wilayah1.id,
          statusData: 'DRAFT',
        },
      });

      const result = await approveSubmissionAction(draftZeroMember.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak memiliki anggota keluarga');

      // Record must NOT be upgraded to VERIFIKASI
      const check = await prisma.keluarga.findUnique({
        where: { id: draftZeroMember.id },
      });
      expect(check?.statusData).toBe('DRAFT');
    });
  });

  describe('2. Vital Event Validation & False Success Prevention (B2-2)', () => {
    it('returns error when reporting pregnancy for non-existent or empty-member target', async () => {
      const result = await laporKehamilanAction({
        anggotaId: 'non-existent-member-id',
        status: 'KEHAMILAN',
        keterangan: 'Uji Kehamilan Hantu',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    it('returns error when reporting mutation for non-existent member', async () => {
      const result = await laporMutasiAction({
        anggotaId: 'non-existent-member-id',
        tanggalMutasi: new Date(),
        keterangan: 'Pindah ke luar desa',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    it('returns error when reporting mortality for non-existent member', async () => {
      const result = await laporKematianAction({
        anggotaId: 'non-existent-member-id',
        namaAlmarhum: 'Nama Hantu',
        tanggalKematian: new Date(),
        sebabKematian: 'Sakit',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });

  describe('3. Export API RBAC Scoping (B2-4)', () => {
    it('enforces 403 Forbidden when KADER_RT exports PDF of a family in a different wilayah', async () => {
      // Create family in wilayah 2
      const famInWilayah2 = await prisma.keluarga.create({
        data: {
          id: 'fam-wilayah-2',
          noKk: '3521090101020002',
          namaKepalaRumahTangga: 'Bapak RT 02',
          alamat: 'RT 02',
          wilayahId: wilayah2.id,
          statusData: 'VERIFIKASI',
        },
      });

      // Mock session user as KADER_RT in wilayah 1
      vi.spyOn(auth, 'getSessionUser').mockResolvedValue({
        id: 'usr-kader-rt01',
        username: 'kader_rt01',
        nama: 'Kader RT 01',
        peran: 'KADER_RT',
        wilayahId: wilayah1.id,
        aktif: true,
        kataSandiHash: 'hash',
        
        createdAt: new Date(),
        updatedAt: new Date(),
        
        wilayah: wilayah1,
      });

      // Request export of family in wilayah 2
      const req = new NextRequest(
        `http://localhost:3000/api/export/pdf?jenis=catatan-keluarga&keluargaId=${famInWilayah2.id}`
      );
      const res = await getPdfExport(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Akses ditolak');
    });

    it('enforces 403 Forbidden when KADER_RT attempts village-wide PDF export', async () => {
      vi.spyOn(auth, 'getSessionUser').mockResolvedValue({
        id: 'usr-kader-rt01',
        username: 'kader_rt01',
        nama: 'Kader RT 01',
        peran: 'KADER_RT',
        wilayahId: wilayah1.id,
        aktif: true,
        kataSandiHash: 'hash',
        
        createdAt: new Date(),
        updatedAt: new Date(),
        
        wilayah: wilayah1,
      });

      const req = new NextRequest(
        'http://localhost:3000/api/export/pdf?jenis=rekap-desa'
      );
      const res = await getPdfExport(req);

      expect(res.status).toBe(403);
    });

    it('enforces 403 Forbidden when KADER_RT attempts village-wide Excel export', async () => {
      vi.spyOn(auth, 'getSessionUser').mockResolvedValue({
        id: 'usr-kader-rt01',
        username: 'kader_rt01',
        nama: 'Kader RT 01',
        peran: 'KADER_RT',
        wilayahId: wilayah1.id,
        aktif: true,
        kataSandiHash: 'hash',
        
        createdAt: new Date(),
        updatedAt: new Date(),
        
        wilayah: wilayah1,
      });

      const req = new NextRequest('http://localhost:3000/api/export/excel?rtId=all');
      const res = await getExcelExport(req);

      expect(res.status).toBe(403);
    });

    it('enforces 403 Forbidden when PENGURUS_DUSUN Krajan exports PDF of family in Tegalsari (B6-1)', async () => {
      const wilTegalsari = await prisma.wilayah.create({
        data: {
          id: 'wil-tegalsari-01',
          dusun: 'Tegalsari',
          rw: '02',
          rt: '01',
          namaDasawisma: 'Kenanga 1',
        },
      });

      const famTegalsari = await prisma.keluarga.create({
        data: {
          id: 'fam-tegalsari-1',
          noKk: '3521090202010001',
          namaKepalaRumahTangga: 'Bapak Tegalsari',
          alamat: 'Tegalsari RT 01',
          wilayahId: wilTegalsari.id,
          statusData: 'VERIFIKASI',
        },
      });

      // Officer: Pengurus Dusun Krajan (anchor to wilayah1)
      vi.spyOn(auth, 'getSessionUser').mockResolvedValue({
        id: 'usr-pengurus-dusun',
        username: 'pengurus_krajan',
        nama: 'Pengurus Dusun Krajan',
        peran: 'PENGURUS_DUSUN',
        wilayahId: wilayah1.id,
        aktif: true,
        kataSandiHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        wilayah: wilayah1,
      });

      const req = new NextRequest(
        `http://localhost:3000/api/export/pdf?jenis=catatan-keluarga&keluargaId=${famTegalsari.id}`
      );
      const res = await getPdfExport(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Akses ditolak');
    });

    it('enforces 403 Forbidden when PENGURUS_RW 01 exports PDF of family in RW 02 or different dusun (B6-1)', async () => {
      const wilRw2 = await prisma.wilayah.create({
        data: {
          id: 'wil-krajan-rw02',
          dusun: 'Krajan',
          rw: '02',
          rt: '01',
          namaDasawisma: 'Flamboyan 2',
        },
      });

      const famRw2 = await prisma.keluarga.create({
        data: {
          id: 'fam-rw2-1',
          noKk: '3521090102010001',
          namaKepalaRumahTangga: 'Bapak RW 02',
          alamat: 'Krajan RW 02',
          wilayahId: wilRw2.id,
          statusData: 'VERIFIKASI',
        },
      });

      // Officer: Pengurus RW 01 (anchor to wilayah1)
      vi.spyOn(auth, 'getSessionUser').mockResolvedValue({
        id: 'usr-pengurus-rw01',
        username: 'pengurus_rw01',
        nama: 'Pengurus RW 01 Krajan',
        peran: 'PENGURUS_RW',
        wilayahId: wilayah1.id,
        aktif: true,
        kataSandiHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        wilayah: wilayah1,
      });

      const req = new NextRequest(
        `http://localhost:3000/api/export/pdf?jenis=catatan-keluarga&keluargaId=${famRw2.id}`
      );
      const res = await getPdfExport(req);
      expect(res.status).toBe(403);
    });

    it('enforces 403 Forbidden when PENGURUS_DUSUN or PENGURUS_RW attempts village-wide Excel export (B6-1)', async () => {
      // Officer: Pengurus RW 01
      vi.spyOn(auth, 'getSessionUser').mockResolvedValue({
        id: 'usr-pengurus-rw01',
        username: 'pengurus_rw01',
        nama: 'Pengurus RW 01',
        peran: 'PENGURUS_RW',
        wilayahId: wilayah1.id,
        aktif: true,
        kataSandiHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        wilayah: wilayah1,
      });

      const req = new NextRequest('http://localhost:3000/api/export/excel?rtId=all');
      const res = await getExcelExport(req);
      expect(res.status).toBe(403);
    });
  });

  describe('4. Pregnancy Mapping & Severity Calculation (B6-2)', () => {
    it('accurately identifies active pregnancy from PeristiwaVital and elevates severity to MERAH/KUNING', async () => {
      const famWithPregnancy = await prisma.keluarga.create({
        data: {
          id: 'fam-bumil-test',
          noKk: '3521091212120001',
          namaKepalaRumahTangga: 'Bapak Bukti Fix',
          alamat: 'Krajan RT 01',
          wilayahId: wilayah1.id,
          statusData: 'VERIFIKASI',
          kriteriaRumah: 'SEHAT',
          jambanKeluarga: true,
          spal: true,
          tempatSampah: true,
          stikerP4k: false, // without P4K sticker -> MERAH
        },
      });

      const mother = await prisma.anggotaKeluarga.create({
        data: {
          id: 'mother-01',
          keluargaId: famWithPregnancy.id,
          nama: 'Ibu Hamil Uji',
          nik: '3521095505950001',
          jenisKelamin: 'P',
          tempatLahir: 'Ngawi',
          tanggalLahir: new Date('1995-05-15'),
          statusKehidupan: 'HIDUP',
          hubunganKeluarga: 'ISTRI',
        },
      });

      await prisma.peristiwaVital.create({
        data: {
          anggotaKeluargaId: mother.id,
          jenisPeristiwa: 'KEHAMILAN',
          tanggalPeristiwa: new Date('2026-09-01'),
          keterangan: 'Pemeriksaan Trimester 2',
        },
      });

      // Fetch family with anggota and peristiwaVital
      const dbKeluarga = await prisma.keluarga.findUnique({
        where: { id: famWithPregnancy.id },
        include: {
          wilayah: true,
          anggota: {
            include: { peristiwaVital: true },
          },
          hatinyaPkk: true,
          industriRumahTangga: true,
        },
      });

      const { mapDbKeluargaToDomain } = await import('../src/lib/dbMappers');
      const domainFam = mapDbKeluargaToDomain(dbKeluarga);

      const momDomain = domainFam.anggota.find((a) => a.id === 'mother-01');
      expect(momDomain?.isIbuHamil).toBe(true);

      const { computeHouseholdSeverity } = await import('../src/lib/domain');
      const severity = computeHouseholdSeverity(domainFam);
      expect(severity.severity).toBe('MERAH'); // Ibu Hamil without stiker P4K
      expect(severity.reasons).toContain('Ibu Hamil berisiko (Belum terpasang Stiker P4K)');
    });
  });

  describe('5. HTML Document Humanized Enums (B6-3)', () => {
    it('renders humanized descriptions instead of raw enums in printable HTML report', async () => {
      const { downloadOfficialPdfReport, humanizeSumberAir, humanizePendidikan, humanizeHubungan } = await import('../src/lib/exportUtils');
      
      expect(humanizeSumberAir('SUMUR_GALI')).toBe('Sumur Gali');
      expect(humanizePendidikan('SMA_SMK_SEDERAJAT')).toBe('SMA / SMK Sederajat');
      expect(humanizePendidikan('TIDAK_TAMAT_SD')).toBe('Tidak Tamat SD');
      expect(humanizeHubungan('KEPALA_KELUARGA')).toBe('Kepala Keluarga');

      const mockFam = {
        id: 'fam-print-test',
        noKK: '3521091122334455',
        namaKepalaKeluarga: 'Bapak Cetak',
        wilayahId: 'wil-1',
        dusun: 'Krajan',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Mawar 1',
        alamat: 'Jl. Desa',
        latitude: -7.4,
        longitude: 111.4,
        tahunPendataan: 2026,
        status: 'VERIFIKASI' as const,
        diinputOleh: 'KADER_RT' as const,
        tanggalInput: '2026-10-28',
        tanggalUpdate: '2026-10-28',
        sanitasi: {
          kriteriaRumah: 'TIDAK_SEHAT_LAYAK_HUNI' as any,
          punyaJamban: true,
          jumlahJamban: 1,
          sumberAir: 'SUMUR_GALI' as any,
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
          makananPokok: 'BERAS' as const,
        },
        anggota: [
          {
            id: 'm1',
            nama: 'Bapak Cetak',
            nik: '3521090101800001',
            isVirtualNik: false,
            hubungan: 'KEPALA_KELUARGA' as any,
            jenisKelamin: 'L' as const,
            tempatLahir: 'Ngawi',
            tanggalLahir: '1980-01-01',
            umur: 46,
            statusKawin: 'KAWIN' as any,
            agama: 'ISLAM' as any,
            pendidikan: 'SMA_SMK_SEDERAJAT' as any,
            pekerjaan: 'TIDAK_BEKERJA' as any,
            isBalita: false,
            isLansia: false,
            isIbuHamil: false,
            isIbuMenyusui: false,
            isButaAksara: false,
            isDisabilitas: false,
            statusHidup: 'HIDUP' as const,
            akseptorKb: false,
          },
        ],
      };

      const filename = downloadOfficialPdfReport([mockFam], 2026, 'Scope RT 01', mockFam);
      expect(filename).toContain('Lampiran_4_15');
    });
  });
});
