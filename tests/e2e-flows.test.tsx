import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { prisma } from '../src/lib/prisma';
import { saveKeluargaAction } from '../src/actions/keluargaActions';
import { approveSubmissionAction } from '../src/actions/verifikasiActions';
import { laporKelahiranAction } from '../src/actions/peristiwaActions';
import { getAggregationDasawisma } from '../src/lib/aggregation';
import { generateOfficialExcelWorkbook } from '../src/lib/excelTemplate';
import { downloadOfficialPdfReport } from '../src/lib/exportUtils';
import {
  KeluargaRecord,
  PeristiwaRecord,
  OfficerAccount,
  computeHouseholdSeverity,
} from '../src/lib/domain';
import { INITIAL_OFFICERS } from '../src/lib/seedData';
import { PublicFormulir } from '../src/app/formulir/page';
import { DashboardVerifikasi } from '../src/components/dashboard/DashboardVerifikasi';
import { DashboardPeristiwa } from '../src/components/dashboard/DashboardPeristiwa';
import { DashboardCetak } from '../src/components/dashboard/DashboardCetak';
import ExcelJS from 'exceljs';

// Mock Next.js navigation hooks
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
    get: (key: string) => null,
  }),
}));

describe('Task 8: End-to-End User Flow Integration Suite', () => {
  let testWilayahId: string;
  const adminOfficer = INITIAL_OFFICERS.find((o) => o.role === 'ADMIN_DESA') || INITIAL_OFFICERS[0];
  const kaderOfficer: OfficerAccount = {
    id: 'kader-e2e',
    nama: 'Ibu Sulastri',
    username: 'kader_sulastri',
    passwordPlain: 'pkkgrudo2026',
    role: 'KADER_RT',
    aktif: true,
    scopeDusun: 'Grudo',
    scopeRw: '01',
    scopeRt: '01',
    wilayahId: 'wil-e2e-flow',
    terakhirMasuk: '2026-10-28',
  };

  beforeEach(async () => {
    // Clean test database for reliable end-to-end assertions
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();

    const createdWilayah = await prisma.wilayah.create({
      data: {
        id: 'wil-e2e-flow',
        dusun: 'Grudo',
        rw: '01',
        rt: '01',
        namaDasawisma: 'Dahlia Mandiri',
        ketuaNama: 'Ibu Sulastri',
      },
    });
    testWilayahId = createdWilayah.id;
  });

  it('completes the complete lifecycle: Public Form Submission -> Verification Approval -> Vital Event Recording -> Official Report Print', async () => {
    // =========================================================================
    // STEP 1: Warga Mandiri fills and submits 5-step Formulir
    // =========================================================================
    const submissionPayload = {
      noKk: '3521092810260099',
      namaKepalaRumahTangga: 'Bapak Hartono Santoso',
      alamat: 'Jl. Merpati No. 12 RT 01/RW 01 Dusun Grudo',
      wilayahId: testWilayahId,
      latitude: -7.4065,
      longitude: 111.4398,
      kriteriaRumah: 'SEHAT' as const,
      jambanKeluarga: true,
      jumlahJamban: 1,
      sumberAir: 'PDAM' as const,
      tempatSampah: true,
      spal: true,
      stikerP4k: true,
      makananPokok: 'BERAS' as const,
      aktivitasUp2k: true,
      kegiatanKesling: true,
      anggota: [
        {
          nik: '3521091505850001',
          nama: 'Bapak Hartono Santoso',
          hubunganKeluarga: 'KEPALA_KELUARGA' as const,
          jenisKelamin: 'L' as const,
          tempatLahir: 'Ngawi',
          tanggalLahir: '1985-05-15',
          agama: 'ISLAM' as const,
          pendidikan: 'S1' as const,
          pekerjaan: 'WIRAUSAHA' as const,
          statusPerkawinan: 'KAWIN' as const,
        },
        {
          nik: '3521095208900002',
          nama: 'Ibu Siti Rahayu',
          hubunganKeluarga: 'ISTRI' as const,
          jenisKelamin: 'P' as const,
          tempatLahir: 'Ngawi',
          tanggalLahir: '1990-08-12',
          agama: 'ISLAM' as const,
          pendidikan: 'S1' as const,
          pekerjaan: 'SWASTA' as const,
          statusPerkawinan: 'KAWIN' as const,
        },
      ],
      hatinyaPkk: [
        { kategori: 'TOGA', komoditi: 'Jahe Merah, Kunyit', jumlah: '10 Polybag' },
        { kategori: 'SAYURAN', komoditi: 'Cabai Rawit, Terong', jumlah: '15 Pot' },
      ],
      industriRumahTangga: [
        { kategori: 'PANGAN', komoditi: 'Kue Basah Tradisional', volume: '100 pcs/hari' },
      ],
    };

    // Submit as resident (isPublicResident = true)
    const saveResponse = await saveKeluargaAction(submissionPayload, true);
    expect(saveResponse.success).toBe(true);
    expect(saveResponse.data?.id).toBeDefined();
    const familyDbId = saveResponse.data!.id;

    // Verify record in SQLite database is created in DRAFT status
    const createdFamilyDb = await prisma.keluarga.findUnique({
      where: { id: familyDbId },
      include: { anggota: true, hatinyaPkk: true, industriRumahTangga: true },
    });
    expect(createdFamilyDb).not.toBeNull();
    expect(createdFamilyDb?.statusData).toBe('DRAFT');
    expect(createdFamilyDb?.anggota.length).toBe(2);
    expect(createdFamilyDb?.noKk).toBe('3521092810260099');

    const motherMember = createdFamilyDb!.anggota.find((m) => m.hubunganKeluarga === 'ISTRI')!;
    expect(motherMember).toBeDefined();

    // Verify Public Confirmation Receipt Screen matches submitted record
    const draftDomainRecord: KeluargaRecord = {
      id: createdFamilyDb!.id,
      noKK: createdFamilyDb!.noKk,
      namaKepalaKeluarga: createdFamilyDb!.namaKepalaRumahTangga,
      wilayahId: testWilayahId,
      dusun: 'Grudo',
      rw: '01',
      rt: '01',
      namaDasawisma: 'Dahlia Mandiri',
      alamat: createdFamilyDb!.alamat,
      latitude: createdFamilyDb!.latitude || -7.4065,
      longitude: createdFamilyDb!.longitude || 111.4398,
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
        toga: true,
        sayuran: true,
        perikanan: false,
        peternakan: false,
        industriRumahTangga: ['PANGAN'],
        ikutUp2k: true,
        makananPokok: 'BERAS',
      },
      anggota: createdFamilyDb!.anggota.map((a) => ({
        id: a.id,
        nama: a.nama,
        nik: a.nik,
        isVirtualNik: Boolean(a.isNikSementara),
        hubungan: a.hubunganKeluarga as any,
        jenisKelamin: a.jenisKelamin as any,
        tempatLahir: a.tempatLahir || 'Ngawi',
        tanggalLahir: a.tanggalLahir ? a.tanggalLahir.toISOString().slice(0, 10) : '1990-01-01',
        umur: 36,
        statusKawin: a.statusPerkawinan as any,
        agama: a.agama as any,
        pendidikan: a.pendidikan as any,
        pekerjaan: a.pekerjaan || 'WIRAUSAHA',
        isBalita: false,
        isLansia: false,
        isIbuHamil: false,
        isIbuMenyusui: false,
        isButaAksara: false,
        isDisabilitas: false,
        statusHidup: 'HIDUP',
      })),
    };

    const receiptHtml = renderToString(
      <PublicFormulir initialSubmittedRecord={draftDomainRecord} />
    );
    expect(receiptHtml).toContain('Bukti Penerimaan Berkas SIMPATIK Desa Grudo');
    expect(receiptHtml).toContain('Status: DRAFT (Menunggu Verifikasi Kader RT)');
    expect(receiptHtml).toContain('Bapak Hartono Santoso');
    expect(receiptHtml).toContain('3521092810260099');

    // =========================================================================
    // STEP 2: Kader RT or Admin accesses Antrean Verifikasi and approves draft
    // =========================================================================
    // Render DashboardVerifikasi with the draft family
    const verificationQueueHtml = renderToString(
      <DashboardVerifikasi
        families={[draftDomainRecord]}
        currentUser={adminOfficer}
        currentRole="ADMIN_DESA"
      />
    );
    expect(verificationQueueHtml).toContain('Antrean Verifikasi Data Keluarga Mandiri');
    expect(verificationQueueHtml).toContain('Bapak Hartono Santoso');
    expect(verificationQueueHtml).toContain('3521092810260099');
    expect(verificationQueueHtml).toContain('Setujui &amp; Masukkan ke Buku Dasawisma');
    expect(verificationQueueHtml).toContain('Tolak / Minta Revisi');

    // Execute approval server action
    const approveResult = await approveSubmissionAction(familyDbId);
    expect(approveResult.success).toBe(true);

    // Verify DB transition from DRAFT -> VERIFIKASI
    const approvedFamilyDb = await prisma.keluarga.findUnique({
      where: { id: familyDbId },
    });
    expect(approvedFamilyDb?.statusData).toBe('VERIFIKASI');

    // Update domain record to VERIFIKASI
    const verifiedDomainRecord: KeluargaRecord = {
      ...draftDomainRecord,
      status: 'VERIFIKASI',
    };

    // =========================================================================
    // STEP 3: Cadre logs Vital Event (Kelahiran Bayi) with Virtual NIK
    // =========================================================================
    // Render DashboardPeristiwa
    const initialEventsList: PeristiwaRecord[] = [];
    const peristiwaPageHtml = renderToString(
      <DashboardPeristiwa
        families={[verifiedDomainRecord]}
        events={initialEventsList}
        currentUser={kaderOfficer}
        currentRole="KADER_RT"
      />
    );
    expect(peristiwaPageHtml).toContain('Modul Lapor Peristiwa Vital &amp; Dinamika Penduduk');
    expect(peristiwaPageHtml).toContain('+ Catat Kelahiran Bayi');

    // Execute birth reporting action
    const birthEventResult = await laporKelahiranAction({
      ibuId: motherMember.id,
      namaBayi: 'Bayi Kencono Santoso',
      tanggalLahir: new Date('2026-10-25'),
      jenisKelamin: 'L',
      akteKelahiran: false,
      beratBadanKg: 3.3,
      panjangBadanCm: 49,
    });

    expect(birthEventResult.success).toBe(true);
    expect(birthEventResult.childId).toBeDefined();

    // Verify newborn has Virtual NIK in DB
    const newbornDb = await prisma.anggotaKeluarga.findUnique({
      where: { id: birthEventResult.childId },
    });
    expect(newbornDb).not.toBeNull();
    expect(newbornDb?.isNikSementara).toBe(true);
    expect(newbornDb?.nik).toMatch(/^TEMP-20261025-[A-Z0-9]{4}$/);

    // Verify PeristiwaVital record in DB
    const eventDb = await prisma.peristiwaVital.findFirst({
      where: { namaBayi: 'Bayi Kencono Santoso' },
    });
    expect(eventDb).not.toBeNull();
    expect(eventDb?.jenisPeristiwa).toBe('KELAHIRAN_BAYI');

    // Build updated domain structures with newborn & birth event
    const newbornDomainMember = {
      id: newbornDb!.id,
      nama: newbornDb!.nama,
      nik: newbornDb!.nik,
      isVirtualNik: true,
      hubungan: 'ANAK' as const,
      jenisKelamin: 'L' as const,
      tempatLahir: 'Ngawi',
      tanggalLahir: '2026-10-25',
      umur: 0,
      statusKawin: 'BELUM_KAWIN' as const,
      agama: 'ISLAM' as const,
      pendidikan: 'TIDAK_SEKOLAH' as const,
      pekerjaan: 'Belum/Tidak Bekerja',
      isBalita: true,
      isLansia: false,
      isIbuHamil: false,
      isIbuMenyusui: false,
      isButaAksara: false,
      isDisabilitas: false,
      statusHidup: 'HIDUP' as const,
    };

    const updatedVerifiedFamily: KeluargaRecord = {
      ...verifiedDomainRecord,
      anggota: [...verifiedDomainRecord.anggota, newbornDomainMember],
    };

    const recordedEvent: PeristiwaRecord = {
      id: eventDb!.id,
      jenis: 'KELAHIRAN',
      keluargaId: familyDbId,
      noKK: verifiedDomainRecord.noKK,
      namaKepalaKeluarga: verifiedDomainRecord.namaKepalaKeluarga,
      wilayahId: testWilayahId,
      rt: '01',
      rw: '01',
      dusun: 'Grudo',
      namaSubjek: 'Bayi Kencono Santoso',
      jenisKelamin: 'L',
      tanggalPeristiwa: '2026-10-25',
      namaIbu: 'Ibu Siti Rahayu',
      beratBadanKg: 3.3,
      lingkarKepalaCm: 34,
      nikBayi: newbornDb!.nik,
      keterangan: 'Kelahiran bayi laki-laki di bidan desa. NIK sementara otomatis di-generate.',
      dicatatOleh: 'Ibu Sulastri (Kader RT)',
    };

    // Render DashboardPeristiwa with the recorded event
    const updatedPeristiwaHtml = renderToString(
      <DashboardPeristiwa
        families={[updatedVerifiedFamily]}
        events={[recordedEvent]}
        currentUser={kaderOfficer}
        currentRole="KADER_RT"
      />
    );
    expect(updatedPeristiwaHtml).toContain('Bayi Kencono Santoso');
    expect(updatedPeristiwaHtml).toContain('KELAHIRAN');
    expect(updatedPeristiwaHtml).toContain('Ibu Sulastri (Kader RT)');

    // =========================================================================
    // STEP 4: Official Report Print (DashboardCetak Lampiran 4.15)
    // =========================================================================
    const cetakHtml = renderToString(
      <DashboardCetak
        families={[updatedVerifiedFamily]}
        selectedCetakId={updatedVerifiedFamily.id}
        currentUser={adminOfficer}
        currentRole="ADMIN_DESA"
      />
    );

    // Verify Official Identification Banner
    expect(cetakHtml).toContain('TIM PENGGERAK PKK DESA GRUDO · KECAMATAN NGAWI · KABUPATEN NGAWI');
    expect(cetakHtml).toContain('CATATAN KELUARGA');
    expect(cetakHtml).toContain('LAMPIRAN 4.15');
    expect(cetakHtml).toContain('3521092810260099');
    expect(cetakHtml).toContain('Bapak Hartono Santoso');
    expect(cetakHtml).toContain('Dahlia Mandiri');

    // Verify Table I contains all members including newborn with Virtual NIK
    expect(cetakHtml).toContain('I. Tabel Data Anggota Keluarga');
    expect(cetakHtml).toContain('Bapak Hartono Santoso');
    expect(cetakHtml).toContain('Ibu Siti Rahayu');
    expect(cetakHtml).toContain('Bayi Kencono Santoso');
    expect(cetakHtml).toContain('Virtual'); // Virtual NIK indicator tag

    // Verify Table II HATINYA PKK & UP2K
    expect(cetakHtml).toContain('II. Pemanfaatan Tanah Pekarangan (HATINYA PKK) &amp; Industri Rumah Tangga');
    expect(cetakHtml).toContain('Tanaman Obat (TOGA)');
    expect(cetakHtml).toContain('Sayuran / Warung Hidup');
    expect(cetakHtml).toContain('Industri RT');

    // Verify Official Signatures
    expect(cetakHtml).toContain('Ketua Kelompok Dasawisma Dahlia Mandiri');
    expect(cetakHtml).toContain('( Kader RT 01 / RW 01 )');
    expect(cetakHtml).toContain('Kepala Keluarga Bersangkutan');
    expect(cetakHtml).toContain('( Bapak Hartono Santoso )');

    // Verify Print UI actions & print-sheet styling
    expect(cetakHtml).toContain('print-sheet');
    expect(cetakHtml).toContain('no-print');
    expect(cetakHtml).toContain('Unduh PDF / HTML');
    expect(cetakHtml).toContain('Cetak Lampiran 4.15');

    // =========================================================================
    // STEP 5: Aggregation & Multi-worksheet Master Workbook Export
    // =========================================================================
    // 5.1 Realtime Dasawisma Aggregation
    const aggResult = await getAggregationDasawisma(testWilayahId, {
      period: 'TAHUNAN',
      year: 2026,
    });
    expect(aggResult.totalKeluarga).toBe(1);
    expect(aggResult.totalAnggota).toBe(3); // Father + Mother + Newborn
    expect(aggResult.totalBalita).toBe(1); // Newborn is balita
    expect(aggResult.totalRumahSehat).toBe(1);
    expect(aggResult.totalJamban).toBe(1);

    // 5.2 Standalone Official HTML-PDF generator
    const pdfFilename = downloadOfficialPdfReport(
      [updatedVerifiedFamily],
      2026,
      'RT 01/RW 01 Dusun Grudo',
      updatedVerifiedFamily
    );
    expect(pdfFilename).toContain('Bapak_Hartono_Santoso');

    // 5.3 Master 31-sheet Excel template injection
    const excelBuffer = await generateOfficialExcelWorkbook({
      tahun: 2026,
      semester: 'TAHUNAN',
      dasawismaId: testWilayahId,
    });
    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(10000);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(excelBuffer as any);
    expect(wb.worksheets.length).toBe(31);

    // Verify household severity evaluation for the updated family
    const severity = computeHouseholdSeverity(updatedVerifiedFamily);
    expect(['HIJAU', 'KUNING']).toContain(severity.severity);
  });
});
