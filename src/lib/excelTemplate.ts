import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import {
  getAggregationDasawisma,
  getAggregationRT,
  getAggregationRW,
  getAggregationDusun,
  getAggregationDesa,
  getActivePregnantMothers,
} from './aggregation';
import { classifyDemographics } from './demographics';
import { DESA_IDENTITY } from './siteConfig';

export interface ExportOptions {
  tahun: number;
  semester?: 'SEMESTER_1' | 'SEMESTER_2' | 'TAHUNAN' | string;
  rtId?: string;
  dasawismaId?: string;
  keluargaId?: string;
  templatePath?: string;
}

// Display labels for database enum values, following the master sheet's own
// placeholder vocabulary (e.g. kriteria rumah is "Layak huni/Tidak layak
// huni", sumber air is "PDAM/Sumur/lainnya") and the wizard's option labels.
// Raw enum values (SEHAT, BELUM_KAWIN, ...) must never leak into official
// documents.
const KRITERIA_RUMAH_LABELS: Record<string, string> = {
  SEHAT: 'Layak huni',
  KURANG_SEHAT: 'Tidak layak huni',
  TIDAK_SEHAT_LAYAK_HUNI: 'Tidak layak huni',
};
const SUMBER_AIR_LABELS: Record<string, string> = {
  PDAM: 'PDAM',
  SUMUR: 'Sumur',
  SUNGAI: 'Sungai',
  LAINNYA: 'Lainnya',
};
const STATUS_PERKAWINAN_LABELS: Record<string, string> = {
  BELUM_KAWIN: 'Belum Kawin',
  KAWIN: 'Kawin',
  JANDA: 'Janda',
  DUDA: 'Duda',
};
const PENDIDIKAN_LABELS: Record<string, string> = {
  TIDAK_TAMAT_SD: 'Tidak Tamat SD',
  SD_MI: 'SD/MI',
  SMP_SEDERAJAT: 'SMP Sederajat',
  SMA_SMK_SEDERAJAT: 'SMA/SMK Sederajat',
  DIPLOMA: 'Diploma',
  S1: 'S1',
  S2: 'S2',
  S3: 'S3',
};
const PEKERJAAN_LABELS: Record<string, string> = {
  PETANI: 'Petani',
  PEDAGANG: 'Pedagang',
  SWASTA: 'Swasta',
  WIRAUSAHA: 'Wirausaha',
  PNS: 'PNS',
  TNI_POLRI: 'TNI/POLRI',
  TIDAK_BEKERJA: 'Tidak Bekerja',
  LAINNYA: 'Lainnya',
};
const AGAMA_LABELS: Record<string, string> = {
  ISLAM: 'Islam',
  KRISTEN: 'Kristen',
  KATHOLIK: 'Katholik',
  HINDU: 'Hindu',
  BUDHA: 'Budha',
  KHONGHUCU: 'Khonghucu',
  KEPERCAYAAN_LAIN: 'Kepercayaan Lain',
};
const HUBUNGAN_LABELS: Record<string, string> = {
  KEPALA_KELUARGA: 'Kepala Keluarga',
  ISTRI: 'Istri',
  ANAK: 'Anak',
  ORANG_TUA: 'Orang Tua',
  MENANTU: 'Menantu',
  CUCU: 'Cucu',
  FAMILI_LAIN: 'Famili Lain',
  PEMBANTU: 'Pembantu',
};

function enumLabel(map: Record<string, string>, value?: string | null): string {
  if (!value) return '';
  return map[value] ?? value.replace(/_/g, ' ');
}

/**
 * Injects realtime family, member, and aggregation data into the official
 * 31-sheet master workbook template (docs/kolom dasawisma.xlsx)
 * and returns the populated spreadsheet as a binary buffer.
 */
export async function generateOfficialExcelWorkbook(options: ExportOptions): Promise<Buffer> {
  const templateFile = options.templatePath ? path.resolve(/*turbopackIgnore: true*/ process.cwd(), options.templatePath) : path.join(process.cwd(), 'docs', 'kolom dasawisma.xlsx');
  
  // Safely read template file into buffer so the master file is never written or locked
  const templateBuffer = fs.readFileSync(templateFile);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as any); // Buffer generic differs between @types/node 26 and exceljs typings

  const filter = {
    tahun: options.tahun,
    semester: options.semester,
  };

  // 1. Fetch relevant data
  const desaAgg = await getAggregationDesa(filter);

  // Official exports contain VERIFIKASI families only; an explicit keluargaId
  // export is a deliberate single-family request and bypasses the status filter.
  const whereFamily: any = options.keluargaId
    ? { id: options.keluargaId }
    : { statusData: 'VERIFIKASI' };

  if (options.keluargaId) {
    // single-family export, whereFamily already targets the id
  } else if (options.dasawismaId) {
    whereFamily.wilayahId = options.dasawismaId;
  } else if (options.rtId && options.rtId !== 'all') {
    whereFamily.wilayah = { rt: options.rtId };
  }

  const families = await prisma.keluarga.findMany({
    where: whereFamily,
    include: {
      anggota: {
        include: {
          peristiwaVital: true,
        },
      },
      hatinyaPkk: true,
      industriRumahTangga: true,
      wilayah: true,
    },
    take: 50,
  });

  const primaryFamily = families[0];
  const primaryMember = primaryFamily?.anggota[0];

  // --- SHEET 1: "data warga " (Vertikal Label-Nilai Form) ---
  const wsDataWarga = workbook.getWorksheet('data warga ');
  if (wsDataWarga && primaryMember && primaryFamily) {
    wsDataWarga.getCell('B5').value = `: ${primaryFamily.wilayah.namaDasawisma || '-'}`;
    wsDataWarga.getCell('B6').value = `: ${primaryFamily.namaKepalaRumahTangga || '-'}`;
    wsDataWarga.getCell('B7').value = `: ${primaryMember.noRegistrasi || '-'}`;
    wsDataWarga.getCell('B8').value = `: ${primaryMember.nik || '-'}`;
    wsDataWarga.getCell('B9').value = `: ${primaryMember.nama || '-'}`;
    wsDataWarga.getCell('B10').value = `: ${primaryMember.jabatanPkk || '-'}`;
    if (primaryMember.jenisKelamin === 'L') {
      wsDataWarga.getCell('B11').value = ': [x] Laki Laki';
      wsDataWarga.getCell('C11').value = '[ ] Perempuan';
    } else {
      wsDataWarga.getCell('B11').value = ': [ ] Laki Laki';
      wsDataWarga.getCell('C11').value = '[x] Perempuan';
    }
    wsDataWarga.getCell('B12').value = `: ${primaryMember.tempatLahir || '-'}`;
    const tgl = primaryMember.tanggalLahir ? new Date(primaryMember.tanggalLahir).toLocaleDateString('id-ID') : '-';
    wsDataWarga.getCell('B13').value = `: ${tgl}`;
  }

  // --- SHEET 5: "data keluarga" (Form Header + Tabel Anggota) ---
  const wsDataKeluarga = workbook.getWorksheet('data keluarga');
  if (wsDataKeluarga && primaryFamily) {
    wsDataKeluarga.getCell('D11').value = primaryFamily.namaKepalaRumahTangga;
    wsDataKeluarga.getCell('D12').value = primaryFamily.anggota.length;
    const countL = primaryFamily.anggota.filter((a) => a.jenisKelamin === 'L').length;
    const countP = primaryFamily.anggota.filter((a) => a.jenisKelamin === 'P').length;
    wsDataKeluarga.getCell('E13').value = countL;
    wsDataKeluarga.getCell('E14').value = countP;
    wsDataKeluarga.getCell('D16').value = 1;

    // Populate Anggota Table starting at row 24 (row 23 is the printed
    // column-number row 1-10 and must stay intact, same as row 14 on
    // the catatan keluarga sheet)
    let rIdx = 24;
    for (let i = 0; i < primaryFamily.anggota.length; i++) {
      const m = primaryFamily.anggota[i];
      const row = wsDataKeluarga.getRow(rIdx + i);
      row.getCell(1).value = i + 1; // NO
      row.getCell(2).value = m.noRegistrasi || '-';
      row.getCell(3).value = m.nama;
      row.getCell(4).value = enumLabel(HUBUNGAN_LABELS, m.hubunganKeluarga);
      row.getCell(5).value = enumLabel(STATUS_PERKAWINAN_LABELS, m.statusPerkawinan);
      row.getCell(6).value = m.jenisKelamin === 'L' ? 'L' : '';
      row.getCell(7).value = m.jenisKelamin === 'P' ? 'P' : '';
      row.getCell(8).value = m.tanggalLahir ? new Date(m.tanggalLahir).toLocaleDateString('id-ID') : '';
      row.getCell(9).value = enumLabel(PENDIDIKAN_LABELS, m.pendidikan);
      row.getCell(10).value = enumLabel(PEKERJAAN_LABELS, m.pekerjaan);
      // Same fixed-width protection as the catatan keluarga member table
      [3, 4, 5, 8, 9, 10].forEach((c) => {
        row.getCell(c).alignment = { shrinkToFit: true };
      });
    }
  }

  // --- SHEET 7: "hatinya pkk" ---
  const wsHatinya = workbook.getWorksheet('hatinya pkk');
  if (wsHatinya && primaryFamily && primaryFamily.hatinyaPkk.length > 0) {
    let rIdx = 7;
    primaryFamily.hatinyaPkk.forEach((item, idx) => {
      const row = wsHatinya.getRow(rIdx + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = item.kategori;
      row.getCell(3).value = item.komoditi;
      row.getCell(4).value = item.jumlah;
    });
  }

  // --- SHEET 9: "industri rumah tangga" ---
  const wsIndustri = workbook.getWorksheet('industri rumah tangga');
  if (wsIndustri && primaryFamily && primaryFamily.industriRumahTangga.length > 0) {
    let rIdx = 7;
    primaryFamily.industriRumahTangga.forEach((item, idx) => {
      const row = wsIndustri.getRow(rIdx + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = item.kategori;
      row.getCell(3).value = item.komoditi;
      row.getCell(4).value = item.volume;
    });
  }

  // --- SHEET 11: "catatan keluarga" ---
  const wsCatatanKeluarga = workbook.getWorksheet('catatan keluarga');
  if (wsCatatanKeluarga && primaryFamily) {
    wsCatatanKeluarga.getCell('D7').value = `: ${primaryFamily.namaKepalaRumahTangga}`;
    wsCatatanKeluarga.getCell('D8').value = `: ${primaryFamily.wilayah.namaDasawisma}`;
    wsCatatanKeluarga.getCell('D9').value = `: ${options.tahun}`;
    wsCatatanKeluarga.getCell('N7').value = `: ${enumLabel(KRITERIA_RUMAH_LABELS, primaryFamily.kriteriaRumah)}`;
    wsCatatanKeluarga.getCell('N8').value = `: ${primaryFamily.jambanKeluarga ? 'Ada' : 'Tidak'}`;
    wsCatatanKeluarga.getCell('P8').value = primaryFamily.jumlahJamban;
    wsCatatanKeluarga.getCell('N9').value = `: ${enumLabel(SUMBER_AIR_LABELS, primaryFamily.sumberAir)}`;
    wsCatatanKeluarga.getCell('N10').value = `: ${primaryFamily.tempatSampah ? 'Ada' : 'Tidak'}`;

    // Member rows start at row 15: rows 12-13 are the two-tier header and
    // row 14 is the column-number row (1..19) of the official form.
    let rIdx = 15;
    primaryFamily.anggota.forEach((m, idx) => {
      const row = wsCatatanKeluarga.getRow(rIdx + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = m.nama;
      row.getCell(3).value = enumLabel(STATUS_PERKAWINAN_LABELS, m.statusPerkawinan);
      row.getCell(4).value = m.jenisKelamin;
      row.getCell(5).value = m.tempatLahir;
      if (m.tanggalLahir) {
        const bDate = new Date(m.tanggalLahir);
        const ref = new Date();
        let age = ref.getFullYear() - bDate.getFullYear();
        if (ref.getMonth() < bDate.getMonth() || (ref.getMonth() === bDate.getMonth() && ref.getDate() < bDate.getDate())) age--;
        row.getCell(6).value = `${bDate.toLocaleDateString('id-ID')} / ${age} Th`;
      } else {
        row.getCell(6).value = '';
      }
      row.getCell(7).value = enumLabel(AGAMA_LABELS, m.agama);
      row.getCell(8).value = enumLabel(PENDIDIKAN_LABELS, m.pendidikan);
      row.getCell(9).value = enumLabel(PEKERJAAN_LABELS, m.pekerjaan);
      row.getCell(10).value = m.disabilitas ? m.jenisDisabilitas || 'Ya' : 'Tidak';
      // 10 Program PKK checkboxes
      row.getCell(11).value = m.kegPancasila ? 'V' : '-';
      row.getCell(12).value = m.kegGotongRoyong ? 'V' : '-';
      row.getCell(13).value = m.kegPendidikanKeterampilan ? 'V' : '-';
      row.getCell(14).value = m.kegKoperasi ? 'V' : '-';
      row.getCell(15).value = m.kegPangan ? 'V' : '-';
      row.getCell(16).value = m.kegSandang ? 'V' : '-';
      row.getCell(17).value = m.kegKesehatan ? 'V' : '-';
      row.getCell(18).value = m.kegPerencanaanSehat ? 'V' : '-';
      // The master sheet's column widths are fixed and some official labels
      // are long ("SMA/SMK Sederajat", "Tidak Bekerja"); shrink-to-fit keeps
      // them fully inside their column instead of being clipped in print.
      [2, 3, 5, 6, 7, 8, 9].forEach((c) => {
        row.getCell(c).alignment = { shrinkToFit: true };
      });
    });
  }

  // --- SHEET 13: "rekap cat data &keg.warga" (Dasawisma Rekap) ---
  const wsRekapDasawisma = workbook.getWorksheet('rekap cat data &keg.warga');
  if (wsRekapDasawisma) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      wsRekapDasawisma.getCell('X6').value = firstWilayah.namaDasawisma;
      wsRekapDasawisma.getCell('X7').value = `${firstWilayah.rt} / ${firstWilayah.rw}`;
      wsRekapDasawisma.getCell('X8').value = firstWilayah.dusun;
      wsRekapDasawisma.getCell('X9').value = options.tahun;

      const dasaAgg = await getAggregationDasawisma(firstWilayah.id, filter);

      // Recap rows start at row 15: this sheet has a three-tier header
      // (rows 11-13) and row 14 is the printed column-number row (1-29).
      let rIdx = 15;
      families.slice(0, 10).forEach((fam, idx) => {
        const row = wsRekapDasawisma.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1; // NO
        row.getCell(2).value = fam.namaKepalaRumahTangga;
        row.getCell(3).value = 1; // Jml KK
        const totalL = fam.anggota.filter((a) => a.jenisKelamin === 'L').length;
        const totalP = fam.anggota.filter((a) => a.jenisKelamin === 'P').length;
        row.getCell(4).value = totalL;
        row.getCell(5).value = totalP;
        // Balita
        const balitaL = fam.anggota.filter((a) => a.jenisKelamin === 'L' && classifyDemographics(a).isBalita).length;
        const balitaP = fam.anggota.filter((a) => a.jenisKelamin === 'P' && classifyDemographics(a).isBalita).length;
        row.getCell(6).value = balitaL;
        row.getCell(7).value = balitaP;
        // PUS & WUS
        row.getCell(8).value = fam.anggota.filter((a) => classifyDemographics(a).isPus).length;
        row.getCell(9).value = fam.anggota.filter((a) => classifyDemographics(a).isWus).length;
        // Sanitasi
        row.getCell(15).value = fam.kriteriaRumah === 'SEHAT' ? 1 : 0;
        row.getCell(16).value = fam.kriteriaRumah !== 'SEHAT' ? 1 : 0;
        row.getCell(17).value = fam.tempatSampah ? 1 : 0;
        row.getCell(18).value = fam.spal ? 1 : 0;
        row.getCell(19).value = fam.jambanKeluarga ? 1 : 0;
      });

      // Bottom sum row (Row 27 in template)
      const sumRow = wsRekapDasawisma.getRow(27);
      if (sumRow) {
        sumRow.getCell(3).value = dasaAgg.totalKeluarga;
        sumRow.getCell(4).value = dasaAgg.totalLakiLaki;
        sumRow.getCell(5).value = dasaAgg.totalPerempuan;
        sumRow.getCell(6).value = dasaAgg.totalBalitaL;
        sumRow.getCell(7).value = dasaAgg.totalBalitaP;
        sumRow.getCell(8).value = dasaAgg.totalPus;
        sumRow.getCell(9).value = dasaAgg.totalWus;
        sumRow.getCell(10).value = dasaAgg.totalIbuHamil;
        sumRow.getCell(11).value = dasaAgg.totalIbuMenyusui;
        sumRow.getCell(12).value = dasaAgg.totalLansia;
        sumRow.getCell(13).value = dasaAgg.totalTigaButa;
        sumRow.getCell(14).value = dasaAgg.totalDisabilitas;
        sumRow.getCell(15).value = dasaAgg.totalRumahSehat;
        sumRow.getCell(16).value = dasaAgg.totalRumahKurangSehat + dasaAgg.totalRumahTidakSehat;
        sumRow.getCell(17).value = dasaAgg.totalTempatSampah;
        sumRow.getCell(18).value = dasaAgg.totalSpal;
        sumRow.getCell(19).value = dasaAgg.totalJamban;
      }
    }
  }

  // --- SHEET 15: "rekap cat data &keg.warga rt" (RT Rekap) ---
  const wsRekapRT = workbook.getWorksheet('rekap cat data &keg.warga rt');
  if (wsRekapRT) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      wsRekapRT.getCell('Y6').value = firstWilayah.namaDasawisma || `RT ${firstWilayah.rt}`;
      wsRekapRT.getCell('Y7').value = `${firstWilayah.rt} / ${firstWilayah.rw}`;
      wsRekapRT.getCell('Y8').value = DESA_IDENTITY.nama;
      wsRekapRT.getCell('Y9').value = options.tahun;

      const rtAgg = await getAggregationRT(firstWilayah.rt, filter, {
        rw: firstWilayah.rw,
        dusun: firstWilayah.dusun,
      });

      const dasawismaList = await prisma.wilayah.findMany({
        where: { rt: firstWilayah.rt, rw: firstWilayah.rw },
        orderBy: { namaDasawisma: 'asc' },
      });

      let rIdx = 15;
      for (let idx = 0; idx < dasawismaList.length && idx < 24; idx++) {
        const dasa = dasawismaList[idx];
        const dAgg = await getAggregationDasawisma(dasa.id, filter);
        const row = wsRekapRT.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = dasa.namaDasawisma;
        row.getCell(2).alignment = { shrinkToFit: true };
        row.getCell(3).value = dAgg.totalKeluarga;
        row.getCell(4).value = dAgg.totalKeluarga;
        row.getCell(5).value = dAgg.totalLakiLaki;
        row.getCell(6).value = dAgg.totalPerempuan;
        row.getCell(7).value = dAgg.totalBalitaL;
        row.getCell(8).value = dAgg.totalBalitaP;
        row.getCell(9).value = dAgg.totalPus;
        row.getCell(10).value = dAgg.totalWus;
        row.getCell(11).value = dAgg.totalIbuHamil;
        row.getCell(12).value = dAgg.totalIbuMenyusui;
        row.getCell(13).value = dAgg.totalLansia;
        row.getCell(14).value = dAgg.totalTigaButa;
        row.getCell(15).value = dAgg.totalDisabilitas;
        row.getCell(16).value = dAgg.totalRumahSehat;
        row.getCell(17).value = dAgg.totalRumahKurangSehat + dAgg.totalRumahTidakSehat;
        row.getCell(18).value = dAgg.totalTempatSampah;
        row.getCell(19).value = dAgg.totalSpal;
        row.getCell(20).value = dAgg.totalJamban;
        row.getCell(21).value = dAgg.sumberAir.pdam;
        row.getCell(22).value = dAgg.sumberAir.sumur;
        row.getCell(23).value = dAgg.sumberAir.sungai + dAgg.sumberAir.lainnya;
        row.getCell(24).value = dAgg.makananPokok.beras;
        row.getCell(25).value = dAgg.makananPokok.nonBeras;
        row.getCell(26).value = dAgg.totalUp2k;
        row.getCell(27).value = dAgg.totalHatinyaPkk;
        row.getCell(28).value = dAgg.totalUp2k;
        row.getCell(29).value = dAgg.totalKeluarga;
      }

      // Bottom sum row (Row 40 in template)
      const sumRowRT = wsRekapRT.getRow(40);
      if (sumRowRT) {
        sumRowRT.getCell(3).value = rtAgg.totalKeluarga;
        sumRowRT.getCell(4).value = rtAgg.totalKeluarga;
        sumRowRT.getCell(5).value = rtAgg.totalLakiLaki;
        sumRowRT.getCell(6).value = rtAgg.totalPerempuan;
        sumRowRT.getCell(7).value = rtAgg.totalBalitaL;
        sumRowRT.getCell(8).value = rtAgg.totalBalitaP;
        sumRowRT.getCell(9).value = rtAgg.totalPus;
        sumRowRT.getCell(10).value = rtAgg.totalWus;
        sumRowRT.getCell(11).value = rtAgg.totalIbuHamil;
        sumRowRT.getCell(12).value = rtAgg.totalIbuMenyusui;
        sumRowRT.getCell(13).value = rtAgg.totalLansia;
        sumRowRT.getCell(14).value = rtAgg.totalTigaButa;
        sumRowRT.getCell(15).value = rtAgg.totalDisabilitas;
        sumRowRT.getCell(16).value = rtAgg.totalRumahSehat;
        sumRowRT.getCell(17).value = rtAgg.totalRumahKurangSehat + rtAgg.totalRumahTidakSehat;
        sumRowRT.getCell(18).value = rtAgg.totalTempatSampah;
        sumRowRT.getCell(19).value = rtAgg.totalSpal;
        sumRowRT.getCell(20).value = rtAgg.totalJamban;
        sumRowRT.getCell(21).value = rtAgg.sumberAir.pdam;
        sumRowRT.getCell(22).value = rtAgg.sumberAir.sumur;
        sumRowRT.getCell(23).value = rtAgg.sumberAir.sungai + rtAgg.sumberAir.lainnya;
        sumRowRT.getCell(24).value = rtAgg.makananPokok.beras;
        sumRowRT.getCell(25).value = rtAgg.makananPokok.nonBeras;
        sumRowRT.getCell(26).value = rtAgg.totalUp2k;
        sumRowRT.getCell(27).value = rtAgg.totalHatinyaPkk;
        sumRowRT.getCell(28).value = rtAgg.totalUp2k;
        sumRowRT.getCell(29).value = rtAgg.totalKeluarga;
      }
    }
  }

  // --- SHEET 17: "rekap cat data &keg.warga rw" (RW Rekap) ---
  const wsRekapRW = workbook.getWorksheet('rekap cat data &keg.warga rw');
  if (wsRekapRW) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      wsRekapRW.getCell('AA6').value = `RW ${firstWilayah.rw}`;
      wsRekapRW.getCell('AA7').value = firstWilayah.rw;
      wsRekapRW.getCell('AA8').value = DESA_IDENTITY.nama;
      wsRekapRW.getCell('AA9').value = options.tahun;

      const rwAgg = await getAggregationRW(firstWilayah.rw, filter, {
        dusun: firstWilayah.dusun,
      });

      const rtList = await prisma.wilayah.findMany({
        where: { rw: firstWilayah.rw },
        select: { rt: true },
        distinct: ['rt'],
        orderBy: { rt: 'asc' },
      });

      let rIdx = 15;
      for (let idx = 0; idx < rtList.length && idx < 24; idx++) {
        const rtItem = rtList[idx];
        const rAgg = await getAggregationRT(rtItem.rt, filter, {
          rw: firstWilayah.rw,
          dusun: firstWilayah.dusun,
        });
        const dasaCount = await prisma.wilayah.count({
          where: { rt: rtItem.rt, rw: firstWilayah.rw },
        });

        const row = wsRekapRW.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = rtItem.rt;
        row.getCell(3).value = dasaCount;
        row.getCell(4).value = rAgg.totalKeluarga;
        row.getCell(5).value = rAgg.totalKeluarga;
        row.getCell(6).value = rAgg.totalLakiLaki;
        row.getCell(7).value = rAgg.totalPerempuan;
        row.getCell(8).value = rAgg.totalBalitaL;
        row.getCell(9).value = rAgg.totalBalitaP;
        row.getCell(10).value = rAgg.totalPus;
        row.getCell(11).value = rAgg.totalWus;
        row.getCell(12).value = rAgg.totalIbuHamil;
        row.getCell(13).value = rAgg.totalIbuMenyusui;
        row.getCell(14).value = rAgg.totalLansia;
        row.getCell(15).value = rAgg.totalTigaButaL;
        row.getCell(16).value = rAgg.totalTigaButaP;
        row.getCell(17).value = rAgg.totalDisabilitas;
        row.getCell(18).value = rAgg.totalRumahSehat;
        row.getCell(19).value = rAgg.totalRumahKurangSehat + rAgg.totalRumahTidakSehat;
        row.getCell(20).value = rAgg.totalTempatSampah;
        row.getCell(21).value = rAgg.totalSpal;
        row.getCell(22).value = rAgg.totalJamban;
        row.getCell(23).value = rAgg.sumberAir.pdam;
        row.getCell(24).value = rAgg.sumberAir.sumur;
        row.getCell(25).value = rAgg.sumberAir.sungai + rAgg.sumberAir.lainnya;
        row.getCell(26).value = rAgg.makananPokok.beras;
        row.getCell(27).value = rAgg.makananPokok.nonBeras;
        row.getCell(28).value = rAgg.totalUp2k;
        row.getCell(29).value = rAgg.totalHatinyaPkk;
        row.getCell(30).value = rAgg.totalUp2k;
        row.getCell(31).value = rAgg.totalKeluarga;
      }

      // Bottom sum row (Row 40 in template)
      const sumRowRW = wsRekapRW.getRow(40);
      if (sumRowRW) {
        const totalDasa = await prisma.wilayah.count({ where: { rw: firstWilayah.rw } });
        sumRowRW.getCell(3).value = totalDasa;
        sumRowRW.getCell(4).value = rwAgg.totalKeluarga;
        sumRowRW.getCell(6).value = rwAgg.totalLakiLaki;
        sumRowRW.getCell(7).value = rwAgg.totalPerempuan;
        sumRowRW.getCell(8).value = rwAgg.totalBalitaL;
        sumRowRW.getCell(9).value = rwAgg.totalBalitaP;
        sumRowRW.getCell(10).value = rwAgg.totalPus;
        sumRowRW.getCell(11).value = rwAgg.totalWus;
        sumRowRW.getCell(12).value = rwAgg.totalIbuHamil;
        sumRowRW.getCell(13).value = rwAgg.totalIbuMenyusui;
        sumRowRW.getCell(14).value = rwAgg.totalLansia;
        sumRowRW.getCell(15).value = rwAgg.totalTigaButaL;
        sumRowRW.getCell(16).value = rwAgg.totalTigaButaP;
        sumRowRW.getCell(17).value = rwAgg.totalDisabilitas;
        sumRowRW.getCell(18).value = rwAgg.totalRumahSehat;
        sumRowRW.getCell(19).value = rwAgg.totalRumahKurangSehat + rwAgg.totalRumahTidakSehat;
        sumRowRW.getCell(20).value = rwAgg.totalTempatSampah;
        sumRowRW.getCell(21).value = rwAgg.totalSpal;
        sumRowRW.getCell(22).value = rwAgg.totalJamban;
        sumRowRW.getCell(23).value = rwAgg.sumberAir.pdam;
        sumRowRW.getCell(24).value = rwAgg.sumberAir.sumur;
        sumRowRW.getCell(25).value = rwAgg.sumberAir.sungai + rwAgg.sumberAir.lainnya;
        sumRowRW.getCell(26).value = rwAgg.makananPokok.beras;
        sumRowRW.getCell(27).value = rwAgg.makananPokok.nonBeras;
        sumRowRW.getCell(28).value = rwAgg.totalUp2k;
        sumRowRW.getCell(29).value = rwAgg.totalHatinyaPkk;
        sumRowRW.getCell(30).value = rwAgg.totalUp2k;
        sumRowRW.getCell(31).value = rwAgg.totalKeluarga;
      }
    }
  }

  // --- SHEET 19: "rekap cat data &keg.warga dsn" (Dusun Rekap) ---
  const wsRekapDsn = workbook.getWorksheet('rekap cat data &keg.warga dsn');
  if (wsRekapDsn) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      wsRekapDsn.getCell('AB6').value = `Dusun ${firstWilayah.dusun}`;
      wsRekapDsn.getCell('AB7').value = firstWilayah.rw;
      wsRekapDsn.getCell('AB8').value = DESA_IDENTITY.nama;
      wsRekapDsn.getCell('AB9').value = options.tahun;

      const dsnAgg = await getAggregationDusun(firstWilayah.dusun, filter);

      const rwList = await prisma.wilayah.findMany({
        where: { dusun: firstWilayah.dusun },
        select: { rw: true },
        distinct: ['rw'],
        orderBy: { rw: 'asc' },
      });

      let rIdx = 15;
      for (let idx = 0; idx < rwList.length && idx < 24; idx++) {
        const rwItem = rwList[idx];
        const rwItemAgg = await getAggregationRW(rwItem.rw, filter, {
          dusun: firstWilayah.dusun,
        });
        const rtCount = (
          await prisma.wilayah.findMany({
            where: { dusun: firstWilayah.dusun, rw: rwItem.rw },
            select: { rt: true },
            distinct: ['rt'],
          })
        ).length;
        const dasaCount = await prisma.wilayah.count({
          where: { dusun: firstWilayah.dusun, rw: rwItem.rw },
        });

        const row = wsRekapDsn.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = rwItem.rw;
        row.getCell(3).value = rtCount;
        row.getCell(4).value = dasaCount;
        row.getCell(5).value = rwItemAgg.totalKeluarga;
        row.getCell(6).value = rwItemAgg.totalKeluarga;
        row.getCell(7).value = rwItemAgg.totalLakiLaki;
        row.getCell(8).value = rwItemAgg.totalPerempuan;
        row.getCell(9).value = rwItemAgg.totalBalitaL;
        row.getCell(10).value = rwItemAgg.totalBalitaP;
        row.getCell(11).value = rwItemAgg.totalPus;
        row.getCell(12).value = rwItemAgg.totalWus;
        row.getCell(13).value = rwItemAgg.totalIbuHamil;
        row.getCell(14).value = rwItemAgg.totalIbuMenyusui;
        row.getCell(15).value = rwItemAgg.totalLansia;
        row.getCell(16).value = rwItemAgg.totalTigaButaL;
        row.getCell(17).value = rwItemAgg.totalTigaButaP;
        row.getCell(18).value = rwItemAgg.totalDisabilitas;
        row.getCell(19).value = rwItemAgg.totalRumahSehat;
        row.getCell(20).value = rwItemAgg.totalRumahKurangSehat + rwItemAgg.totalRumahTidakSehat;
        row.getCell(21).value = rwItemAgg.totalTempatSampah;
        row.getCell(22).value = rwItemAgg.totalSpal;
        row.getCell(23).value = rwItemAgg.totalJamban;
        row.getCell(24).value = rwItemAgg.sumberAir.pdam;
        row.getCell(25).value = rwItemAgg.sumberAir.sumur;
        row.getCell(26).value = rwItemAgg.sumberAir.sungai + rwItemAgg.sumberAir.lainnya;
        row.getCell(27).value = rwItemAgg.makananPokok.beras;
        row.getCell(28).value = rwItemAgg.makananPokok.nonBeras;
        row.getCell(29).value = rwItemAgg.totalUp2k;
        row.getCell(30).value = rwItemAgg.totalHatinyaPkk;
        row.getCell(31).value = rwItemAgg.totalUp2k;
        row.getCell(32).value = rwItemAgg.totalKeluarga;
      }

      // Bottom sum row (Row 40 in template)
      const sumRowDsn = wsRekapDsn.getRow(40);
      if (sumRowDsn) {
        const totalRT = (
          await prisma.wilayah.findMany({
            where: { dusun: firstWilayah.dusun },
            select: { rt: true },
            distinct: ['rt'],
          })
        ).length;
        const totalDasa = await prisma.wilayah.count({
          where: { dusun: firstWilayah.dusun },
        });
        sumRowDsn.getCell(3).value = totalRT;
        sumRowDsn.getCell(4).value = totalDasa;
        sumRowDsn.getCell(5).value = dsnAgg.totalKeluarga;
        sumRowDsn.getCell(7).value = dsnAgg.totalLakiLaki;
        sumRowDsn.getCell(8).value = dsnAgg.totalPerempuan;
        sumRowDsn.getCell(9).value = dsnAgg.totalBalitaL;
        sumRowDsn.getCell(10).value = dsnAgg.totalBalitaP;
        sumRowDsn.getCell(11).value = dsnAgg.totalPus;
        sumRowDsn.getCell(12).value = dsnAgg.totalWus;
        sumRowDsn.getCell(13).value = dsnAgg.totalIbuHamil;
        sumRowDsn.getCell(14).value = dsnAgg.totalIbuMenyusui;
        sumRowDsn.getCell(15).value = dsnAgg.totalLansia;
        sumRowDsn.getCell(16).value = dsnAgg.totalTigaButaL;
        sumRowDsn.getCell(17).value = dsnAgg.totalTigaButaP;
        sumRowDsn.getCell(18).value = dsnAgg.totalDisabilitas;
        sumRowDsn.getCell(19).value = dsnAgg.totalRumahSehat;
        sumRowDsn.getCell(20).value = dsnAgg.totalRumahKurangSehat + dsnAgg.totalRumahTidakSehat;
        sumRowDsn.getCell(21).value = dsnAgg.totalTempatSampah;
        sumRowDsn.getCell(22).value = dsnAgg.totalSpal;
        sumRowDsn.getCell(23).value = dsnAgg.totalJamban;
        sumRowDsn.getCell(24).value = dsnAgg.sumberAir.pdam;
        sumRowDsn.getCell(25).value = dsnAgg.sumberAir.sumur;
        sumRowDsn.getCell(26).value = dsnAgg.sumberAir.sungai + dsnAgg.sumberAir.lainnya;
        sumRowDsn.getCell(27).value = dsnAgg.makananPokok.beras;
        sumRowDsn.getCell(28).value = dsnAgg.makananPokok.nonBeras;
        sumRowDsn.getCell(29).value = dsnAgg.totalUp2k;
        sumRowDsn.getCell(30).value = dsnAgg.totalHatinyaPkk;
        sumRowDsn.getCell(31).value = dsnAgg.totalUp2k;
        sumRowDsn.getCell(32).value = dsnAgg.totalKeluarga;
      }
    }
  }

  // --- SHEET 20: "rekap cat data &keg.warga desa" (Desa Rekap) ---
  const wsRekapDesa = workbook.getWorksheet('rekap cat data &keg.warga desa');
  if (wsRekapDesa) {
    wsRekapDesa.getCell('D5').value = DESA_IDENTITY.nama;
    wsRekapDesa.getCell('D6').value = DESA_IDENTITY.kecamatan;
    wsRekapDesa.getCell('D7').value = DESA_IDENTITY.kabupaten;
    wsRekapDesa.getCell('D8').value = DESA_IDENTITY.provinsi;

    const dusunList = await prisma.wilayah.findMany({
      select: { dusun: true },
      distinct: ['dusun'],
      orderBy: { dusun: 'asc' },
    });

    let rIdx = 15;
    for (let idx = 0; idx < dusunList.length && idx < 24; idx++) {
      const d = dusunList[idx];
      const dsnItemAgg = await getAggregationDusun(d.dusun, filter);
      const rwCount = (
        await prisma.wilayah.findMany({
          where: { dusun: d.dusun },
          select: { rw: true },
          distinct: ['rw'],
        })
      ).length;
      const rtCount = (
        await prisma.wilayah.findMany({
          where: { dusun: d.dusun },
          select: { rt: true },
          distinct: ['rt'],
        })
      ).length;
      const dasaCount = await prisma.wilayah.count({ where: { dusun: d.dusun } });

      const row = wsRekapDesa.getRow(rIdx + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = d.dusun;
      row.getCell(2).alignment = { shrinkToFit: true };
      row.getCell(3).value = rwCount;
      row.getCell(4).value = rtCount;
      row.getCell(5).value = dasaCount;
      row.getCell(6).value = dsnItemAgg.totalKeluarga;
      row.getCell(7).value = dsnItemAgg.totalKeluarga;
      row.getCell(8).value = dsnItemAgg.totalLakiLaki;
      row.getCell(9).value = dsnItemAgg.totalPerempuan;
      row.getCell(10).value = dsnItemAgg.totalBalitaL;
      row.getCell(11).value = dsnItemAgg.totalBalitaP;
      row.getCell(12).value = dsnItemAgg.totalPus;
      row.getCell(13).value = dsnItemAgg.totalWus;
      row.getCell(14).value = dsnItemAgg.totalIbuHamil;
      row.getCell(15).value = dsnItemAgg.totalIbuMenyusui;
      row.getCell(16).value = dsnItemAgg.totalLansia;
      row.getCell(17).value = dsnItemAgg.totalTigaButa;
      row.getCell(18).value = dsnItemAgg.totalRumahSehat;
      row.getCell(19).value = dsnItemAgg.totalRumahKurangSehat + dsnItemAgg.totalRumahTidakSehat;
      row.getCell(20).value = dsnItemAgg.totalTempatSampah;
      row.getCell(21).value = dsnItemAgg.totalSpal;
      row.getCell(22).value = dsnItemAgg.sumberAir.pdam;
      row.getCell(23).value = dsnItemAgg.sumberAir.sumur;
      row.getCell(24).value = dsnItemAgg.sumberAir.sungai;
      row.getCell(25).value = dsnItemAgg.sumberAir.lainnya;
      row.getCell(26).value = dsnItemAgg.totalJamban;
      row.getCell(27).value = dsnItemAgg.makananPokok.beras;
      row.getCell(28).value = dsnItemAgg.makananPokok.nonBeras;
      row.getCell(29).value = dsnItemAgg.totalUp2k;
      row.getCell(30).value = dsnItemAgg.totalHatinyaPkk;
      row.getCell(31).value = dsnItemAgg.totalUp2k;
      row.getCell(32).value = dsnItemAgg.totalKeluarga;
    }

    [27, 40].forEach((rNum) => {
      const sumRowDesa = wsRekapDesa.getRow(rNum);
      if (sumRowDesa) {
        sumRowDesa.getCell(6).value = desaAgg.totalKeluarga;
        sumRowDesa.getCell(7).value = desaAgg.totalKeluarga;
        sumRowDesa.getCell(8).value = desaAgg.totalLakiLaki;
        sumRowDesa.getCell(9).value = desaAgg.totalPerempuan;
        sumRowDesa.getCell(10).value = desaAgg.totalBalitaL;
        sumRowDesa.getCell(11).value = desaAgg.totalBalitaP;
        sumRowDesa.getCell(12).value = desaAgg.totalPus;
        sumRowDesa.getCell(13).value = desaAgg.totalWus;
        sumRowDesa.getCell(14).value = desaAgg.totalIbuHamil;
        sumRowDesa.getCell(15).value = desaAgg.totalIbuMenyusui;
        sumRowDesa.getCell(16).value = desaAgg.totalLansia;
        sumRowDesa.getCell(17).value = desaAgg.totalTigaButa;
        sumRowDesa.getCell(18).value = desaAgg.totalRumahSehat;
        sumRowDesa.getCell(19).value = desaAgg.totalRumahKurangSehat + desaAgg.totalRumahTidakSehat;
        sumRowDesa.getCell(20).value = desaAgg.totalTempatSampah;
        sumRowDesa.getCell(21).value = desaAgg.totalSpal;
        sumRowDesa.getCell(22).value = desaAgg.sumberAir.pdam;
        sumRowDesa.getCell(23).value = desaAgg.sumberAir.sumur;
        sumRowDesa.getCell(24).value = desaAgg.sumberAir.sungai;
        sumRowDesa.getCell(25).value = desaAgg.sumberAir.lainnya;
        sumRowDesa.getCell(26).value = desaAgg.totalJamban;
        sumRowDesa.getCell(27).value = desaAgg.makananPokok.beras;
        sumRowDesa.getCell(28).value = desaAgg.makananPokok.nonBeras;
        sumRowDesa.getCell(29).value = desaAgg.totalUp2k;
        sumRowDesa.getCell(30).value = desaAgg.totalHatinyaPkk;
        sumRowDesa.getCell(31).value = desaAgg.totalUp2k;
        sumRowDesa.getCell(32).value = desaAgg.totalKeluarga;
      }
    });
  }

  // --- SHEET 22: "rekap bumil" (Dasawisma Bumil Rekap) ---
  const wsRekapBumil = workbook.getWorksheet('rekap bumil');
  if (wsRekapBumil) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      let targetWil = firstWilayah;
      let bumilList = await getActivePregnantMothers({ wilayahId: firstWilayah.id });
      if (bumilList.length === 0 && !options.dasawismaId) {
        const anyBumil = await getActivePregnantMothers(
          options.rtId && options.rtId !== 'all' ? { rt: options.rtId } : undefined
        );
        if (anyBumil.length > 0) {
          targetWil = anyBumil[0].wilayah;
          bumilList = anyBumil.filter((b) => b.wilayah?.id === targetWil.id);
        }
      }

      wsRekapBumil.getCell('F9').value = targetWil.namaDasawisma;
      wsRekapBumil.getCell('F10').value = `: RT ${targetWil.rt}`;
      wsRekapBumil.getCell('F11').value = `: RW ${targetWil.rw}`;
      wsRekapBumil.getCell('F12').value = `: ${targetWil.dusun}`;
      wsRekapBumil.getCell('F13').value = `: ${DESA_IDENTITY.nama}`;
      wsRekapBumil.getCell('B15').value = `: ${options.semester || 'Semester 1'}`;
      wsRekapBumil.getCell('B16').value = `: ${options.tahun}`;

      let rIdx = 23;
      // In Sheet 22, data rows run from row 23 to 29 (7 rows max), before JUMLAH at row 30
      bumilList.slice(0, 7).forEach((m, idx) => {
        const row = wsRekapBumil.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = m.namaIbu;
        row.getCell(3).value = m.namaSuami;
        row.getCell(4).value = 'Hamil';
        row.getCell(17).value = m.tanggalKehamilan
          ? `HPHT: ${new Date(m.tanggalKehamilan).toLocaleDateString('id-ID')}`
          : 'Hamil Aktif';
      });

      // Bottom sum row for table data is Row 30 (Row 33-39 is the CATATAN area where D39 contains "Orang")
      const sumRowBumil = wsRekapBumil.getRow(30);
      if (sumRowBumil) {
        sumRowBumil.getCell(4).value = bumilList.length;
      }
    }
  }

  // --- SHEET 24: "rekap bumil rt" (RT Bumil Rekap) ---
  const wsRekapBumilRT = workbook.getWorksheet('rekap bumil rt');
  if (wsRekapBumilRT) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      wsRekapBumilRT.getCell('C9').value = `: RT ${firstWilayah.rt} / RW ${firstWilayah.rw} / ${firstWilayah.dusun}`;
      wsRekapBumilRT.getCell('C10').value = `: ${DESA_IDENTITY.nama}`;
      wsRekapBumilRT.getCell('C11').value = `: ${DESA_IDENTITY.kecamatan}`;
      wsRekapBumilRT.getCell('C12').value = `: ${DESA_IDENTITY.kabupaten}`;
      wsRekapBumilRT.getCell('C13').value = `: ${DESA_IDENTITY.provinsi}`;
      wsRekapBumilRT.getCell('N8').value = options.semester || 'Semester 1';
      wsRekapBumilRT.getCell('N9').value = String(options.tahun);

      const dasawismaList = await prisma.wilayah.findMany({
        where: { rt: firstWilayah.rt, rw: firstWilayah.rw },
        orderBy: { namaDasawisma: 'asc' },
      });

      let rIdx = 23;
      for (let idx = 0; idx < dasawismaList.length && idx < 7; idx++) {
        const dasa = dasawismaList[idx];
        const dAgg = await getAggregationDasawisma(dasa.id, filter);
        const row = wsRekapBumilRT.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = dasa.namaDasawisma;
        row.getCell(3).value = dAgg.totalIbuHamil;
        row.getCell(4).value = 0;
        row.getCell(5).value = dAgg.totalIbuMenyusui;
        row.getCell(6).value = dAgg.totalKematianIbu;
        row.getCell(11).value = dAgg.totalKematianBayi;
        row.getCell(13).value = dAgg.totalKematianBalita;
      }

      const sumRowRTBumil = wsRekapBumilRT.getRow(30);
      if (sumRowRTBumil) {
        const rtAgg = await getAggregationRT(firstWilayah.rt, filter, {
          rw: firstWilayah.rw,
          dusun: firstWilayah.dusun,
        });
        sumRowRTBumil.getCell(3).value = rtAgg.totalIbuHamil;
        sumRowRTBumil.getCell(5).value = rtAgg.totalIbuMenyusui;
        sumRowRTBumil.getCell(6).value = rtAgg.totalKematianIbu;
        sumRowRTBumil.getCell(11).value = rtAgg.totalKematianBayi;
        sumRowRTBumil.getCell(13).value = rtAgg.totalKematianBalita;
      }
    }
  }

  // --- SHEET 26: "rekap bumil rw" (RW Bumil Rekap) ---
  const wsRekapBumilRW = workbook.getWorksheet('rekap bumil rw');
  if (wsRekapBumilRW) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      wsRekapBumilRW.getCell('D9').value = `: ${DESA_IDENTITY.provinsi}`;

      const rtList = await prisma.wilayah.findMany({
        where: { rw: firstWilayah.rw },
        select: { rt: true },
        distinct: ['rt'],
        orderBy: { rt: 'asc' },
      });

      let rIdx = 15;
      for (let idx = 0; idx < rtList.length && idx < 7; idx++) {
        const rtItem = rtList[idx];
        const rAgg = await getAggregationRT(rtItem.rt, filter, {
          rw: firstWilayah.rw,
          dusun: firstWilayah.dusun,
        });
        const dasaCount = await prisma.wilayah.count({
          where: { rt: rtItem.rt, rw: firstWilayah.rw },
        });

        const row = wsRekapBumilRW.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = rtItem.rt;
        row.getCell(3).value = dasaCount;
        row.getCell(4).value = rAgg.totalIbuHamil;
        row.getCell(5).value = 0;
        row.getCell(6).value = rAgg.totalIbuMenyusui;
        row.getCell(7).value = rAgg.totalKematianIbu;
        row.getCell(12).value = rAgg.totalKematianBayi;
        row.getCell(14).value = rAgg.totalKematianBalita;
      }

      const sumRowRWBumil = wsRekapBumilRW.getRow(22);
      if (sumRowRWBumil) {
        const rwAgg = await getAggregationRW(firstWilayah.rw, filter, {
          dusun: firstWilayah.dusun,
        });
        const dasaTotal = await prisma.wilayah.count({ where: { rw: firstWilayah.rw } });
        sumRowRWBumil.getCell(3).value = dasaTotal;
        sumRowRWBumil.getCell(4).value = rwAgg.totalIbuHamil;
        sumRowRWBumil.getCell(6).value = rwAgg.totalIbuMenyusui;
        sumRowRWBumil.getCell(7).value = rwAgg.totalKematianIbu;
        sumRowRWBumil.getCell(12).value = rwAgg.totalKematianBayi;
        sumRowRWBumil.getCell(14).value = rwAgg.totalKematianBalita;
      }
    }
  }

  // --- SHEET 28: "rekap bumil dsn" (Dusun Bumil Rekap) ---
  const wsRekapBumilDsn = workbook.getWorksheet('rekap bumil dsn');
  if (wsRekapBumilDsn) {
    const firstWilayah = families[0]?.wilayah;
    if (firstWilayah) {
      const rwList = await prisma.wilayah.findMany({
        where: { dusun: firstWilayah.dusun },
        select: { rw: true },
        distinct: ['rw'],
        orderBy: { rw: 'asc' },
      });

      let rIdx = 15;
      for (let idx = 0; idx < rwList.length && idx < 7; idx++) {
        const rwItem = rwList[idx];
        const rwItemAgg = await getAggregationRW(rwItem.rw, filter, {
          dusun: firstWilayah.dusun,
        });
        const rtCount = (
          await prisma.wilayah.findMany({
            where: { dusun: firstWilayah.dusun, rw: rwItem.rw },
            select: { rt: true },
            distinct: ['rt'],
          })
        ).length;
        const dasaCount = await prisma.wilayah.count({
          where: { dusun: firstWilayah.dusun, rw: rwItem.rw },
        });

        const row = wsRekapBumilDsn.getRow(rIdx + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = rwItem.rw;
        row.getCell(3).value = rtCount;
        row.getCell(4).value = dasaCount;
        row.getCell(5).value = rwItemAgg.totalIbuHamil;
        row.getCell(6).value = 0;
        row.getCell(7).value = rwItemAgg.totalIbuMenyusui;
        row.getCell(8).value = rwItemAgg.totalKematianIbu;
        row.getCell(13).value = rwItemAgg.totalKematianBayi;
        row.getCell(15).value = rwItemAgg.totalKematianBalita;
      }

      const sumRowDsnBumil = wsRekapBumilDsn.getRow(22);
      if (sumRowDsnBumil) {
        const dsnAgg = await getAggregationDusun(firstWilayah.dusun, filter);
        const totalRT = (
          await prisma.wilayah.findMany({
            where: { dusun: firstWilayah.dusun },
            select: { rt: true },
            distinct: ['rt'],
          })
        ).length;
        const totalDasa = await prisma.wilayah.count({
          where: { dusun: firstWilayah.dusun },
        });
        sumRowDsnBumil.getCell(3).value = totalRT;
        sumRowDsnBumil.getCell(4).value = totalDasa;
        sumRowDsnBumil.getCell(5).value = dsnAgg.totalIbuHamil;
        sumRowDsnBumil.getCell(7).value = dsnAgg.totalIbuMenyusui;
        sumRowDsnBumil.getCell(8).value = dsnAgg.totalKematianIbu;
        sumRowDsnBumil.getCell(13).value = dsnAgg.totalKematianBayi;
        sumRowDsnBumil.getCell(15).value = dsnAgg.totalKematianBalita;
      }
    }
  }

  // --- SHEET 30: "rekap bumil desakelurahan" (Desa Bumil Rekap) ---
  const wsRekapBumilDesa = workbook.getWorksheet('rekap bumil desakelurahan');
  if (wsRekapBumilDesa) {
    wsRekapBumilDesa.getCell('E10').value = DESA_IDENTITY.nama;
    wsRekapBumilDesa.getCell('E11').value = DESA_IDENTITY.kecamatan;
    wsRekapBumilDesa.getCell('E12').value = DESA_IDENTITY.kabupaten;
    wsRekapBumilDesa.getCell('E13').value = DESA_IDENTITY.provinsi;
    wsRekapBumilDesa.getCell('Q8').value = options.semester || 'Semester 1';
    wsRekapBumilDesa.getCell('Q9').value = String(options.tahun);

    const dusunList = await prisma.wilayah.findMany({
      select: { dusun: true },
      distinct: ['dusun'],
      orderBy: { dusun: 'asc' },
    });

    let rIdx = 20;
    for (let idx = 0; idx < dusunList.length && idx < 7; idx++) {
      const d = dusunList[idx];
      const dsnItemAgg = await getAggregationDusun(d.dusun, filter);
      const rwCount = (
        await prisma.wilayah.findMany({
          where: { dusun: d.dusun },
          select: { rw: true },
          distinct: ['rw'],
        })
      ).length;
      const rtCount = (
        await prisma.wilayah.findMany({
          where: { dusun: d.dusun },
          select: { rt: true },
          distinct: ['rt'],
        })
      ).length;
      const dasaCount = await prisma.wilayah.count({ where: { dusun: d.dusun } });

      const row = wsRekapBumilDesa.getRow(rIdx + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = d.dusun;
      row.getCell(2).alignment = { shrinkToFit: true };
      row.getCell(3).value = rwCount;
      row.getCell(4).value = rtCount;
      row.getCell(5).value = dasaCount;
      row.getCell(6).value = dsnItemAgg.totalIbuHamil;
      row.getCell(7).value = 0;
      row.getCell(8).value = dsnItemAgg.totalIbuMenyusui;
      row.getCell(9).value = dsnItemAgg.totalKematianIbu;
      row.getCell(14).value = dsnItemAgg.totalKematianBayi;
      row.getCell(16).value = dsnItemAgg.totalKematianBalita;
    }

    const sumRowDesaBumil = wsRekapBumilDesa.getRow(27);
    if (sumRowDesaBumil) {
      const rwTotal = (
        await prisma.wilayah.findMany({
          select: { rw: true, dusun: true },
          distinct: ['rw', 'dusun'],
        })
      ).length;
      const rtTotal = (
        await prisma.wilayah.findMany({
          select: { rt: true, rw: true, dusun: true },
          distinct: ['rt', 'rw', 'dusun'],
        })
      ).length;
      const dasaTotal = await prisma.wilayah.count();

      sumRowDesaBumil.getCell(3).value = rwTotal;
      sumRowDesaBumil.getCell(4).value = rtTotal;
      sumRowDesaBumil.getCell(5).value = dasaTotal;
      sumRowDesaBumil.getCell(6).value = desaAgg.totalIbuHamil;
      sumRowDesaBumil.getCell(7).value = 0;
      sumRowDesaBumil.getCell(8).value = desaAgg.totalIbuMenyusui;
      sumRowDesaBumil.getCell(9).value = desaAgg.totalKematianIbu;
      sumRowDesaBumil.getCell(14).value = desaAgg.totalKematianBayi;
      sumRowDesaBumil.getCell(16).value = desaAgg.totalKematianBalita;
    }
  }

  // Export populated workbook into binary buffer
  const uint8 = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8);
}
