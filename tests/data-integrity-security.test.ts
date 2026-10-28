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
        passwordHash: 'hash',
        nomorHp: '08123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
        terakhirMasuk: null,
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
        passwordHash: 'hash',
        nomorHp: '08123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
        terakhirMasuk: null,
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
        passwordHash: 'hash',
        nomorHp: '08123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
        terakhirMasuk: null,
        wilayah: wilayah1,
      });

      const req = new NextRequest('http://localhost:3000/api/export/excel?rtId=all');
      const res = await getExcelExport(req);

      expect(res.status).toBe(403);
    });
  });
});
