import { describe, it, expect, beforeEach } from 'vitest';
import { saveKeluargaAction } from '../src/actions/keluargaActions';
import { approveSubmissionAction } from '../src/actions/verifikasiActions';
import { laporKelahiranAction } from '../src/actions/peristiwaActions';
import { getAggregationDasawisma } from '../src/lib/aggregation';
import { generateOfficialExcelWorkbook } from '../src/lib/excelTemplate';
import { prisma } from '../src/lib/prisma';
import ExcelJS from 'exceljs';

describe('SIMPATIK Full End-to-End Workflow', () => {
  let wilayahId: string;

  beforeEach(async () => {
    // Clean all related test data
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();

    const w = await prisma.wilayah.create({
      data: {
        id: 'wil-e2e-kudus',
        dusun: 'Krajan',
        rw: '01',
        rt: '02',
        namaDasawisma: 'Melati Indah',
      },
    });
    wilayahId = w.id;
  });

  it('completes resident draft -> verification -> birth event -> aggregation -> excel export', async () => {
    // 1. Resident draft submission (public self-service portal)
    const saveResult = await saveKeluargaAction(
      {
        noKk: '3319019999990001',
        namaKepalaRumahTangga: 'Bapak Santoso',
        alamat: 'Jl. Melati RT 02/01 Desa Demaan',
        wilayahId,
        latitude: -6.8041,
        longitude: 110.8405,
        kriteriaRumah: 'SEHAT',
        jambanKeluarga: true,
        jumlahJamban: 1,
        sumberAir: 'SUMUR',
        tempatSampah: true,
        spal: true,
        stikerP4k: true,
        makananPokok: 'BERAS',
        aktivitasUp2k: false,
        kegiatanKesling: true,
        anggota: [
          {
            nik: '3319011111110001',
            nama: 'Bapak Santoso',
            hubunganKeluarga: 'KEPALA_KELUARGA',
            jenisKelamin: 'L',
            tempatLahir: 'Kudus',
            tanggalLahir: '1988-02-10',
            agama: 'ISLAM',
            pendidikan: 'SMA_SMK_SEDERAJAT',
            pekerjaan: 'WIRAUSAHA',
            statusPerkawinan: 'KAWIN',
          },
          {
            nik: '3319012222220002',
            nama: 'Ibu Aminah',
            hubunganKeluarga: 'ISTRI',
            jenisKelamin: 'P',
            tempatLahir: 'Kudus',
            tanggalLahir: '1992-08-14',
            agama: 'ISLAM',
            pendidikan: 'S1',
            pekerjaan: 'SWASTA',
            statusPerkawinan: 'KAWIN',
          },
        ],
        hatinyaPkk: [],
        industriRumahTangga: [],
      },
      true // isPublicResident = true -> creates DRAFT status
    );

    expect(saveResult.success).toBe(true);
    expect(saveResult.data?.id).toBeDefined();
    const familyId = saveResult.data!.id;

    // Verify initial state is DRAFT
    const draftFamily = await prisma.keluarga.findUnique({
      where: { id: familyId },
      include: { anggota: true },
    });
    expect(draftFamily?.statusData).toBe('DRAFT');
    expect(draftFamily?.anggota.length).toBe(2);

    const mother = draftFamily!.anggota.find((m) => m.nama === 'Ibu Aminah')!;
    expect(mother).toBeDefined();

    // 2. Cadre verification & approval
    const approveResult = await approveSubmissionAction(familyId);
    expect(approveResult.success).toBe(true);

    const approvedFamily = await prisma.keluarga.findUnique({
      where: { id: familyId },
    });
    expect(approvedFamily?.statusData).toBe('VERIFIKASI');

    // 3. Birth event: "Lapor Kelahiran"
    const birthResult = await laporKelahiranAction({
      ibuId: mother.id,
      namaBayi: 'Bayi Rahmat Pratama',
      tanggalLahir: new Date('2026-10-24'),
      jenisKelamin: 'L',
      akteKelahiran: false,
      beratBadanKg: 3.4,
      panjangBadanCm: 50,
    });

    expect(birthResult.success).toBe(true);
    expect(birthResult.childId).toBeDefined();

    // Newborn should have virtual NIK
    const newborn = await prisma.anggotaKeluarga.findUnique({
      where: { id: birthResult.childId },
    });
    expect(newborn).toBeDefined();
    expect(newborn?.isNikSementara).toBe(true);
    expect(newborn?.nik).toMatch(/^TEMP-20261024-[A-Z0-9]{4}$/);

    // 4. Verify Realtime Aggregation at Dasawisma level
    const aggResult = await getAggregationDasawisma(wilayahId, {
      period: 'TAHUNAN',
      year: 2026,
    });

    expect(aggResult.totalKeluarga).toBe(1);
    expect(aggResult.totalAnggota).toBe(3); // Father + Mother + Newborn
    expect(aggResult.totalBalita).toBe(1); // Newborn is balita
    expect(aggResult.totalRumahSehat).toBe(1);
    expect(aggResult.totalJamban).toBe(1);

    // 5. Generate Official Excel Workbook (Master Template Injection)
    const excelBuffer = await generateOfficialExcelWorkbook({
      tahun: 2026,
      semester: 'TAHUNAN',
      dasawismaId: wilayahId,
    });

    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(10000);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(excelBuffer as any);

    // Assert that the workbook contains exactly 31 sheets as per master inventory
    expect(wb.worksheets.length).toBe(31);

    // Verify data sheet injection retains structure
    const dataWargaSheet = wb.getWorksheet('data warga ');
    expect(dataWargaSheet).toBeDefined();
  });
});
