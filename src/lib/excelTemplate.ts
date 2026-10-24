import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { getAggregationDasawisma, getAggregationRT, getAggregationDesa } from './aggregation';
import { classifyDemographics } from './demographics';

export interface ExportOptions {
  tahun: number;
  semester?: 'SEMESTER_1' | 'SEMESTER_2' | 'TAHUNAN' | string;
  rtId?: string;
  dasawismaId?: string;
  keluargaId?: string;
  templatePath?: string;
}

/**
 * Injects realtime family, member, and aggregation data into the official
 * 31-sheet master workbook template (docs/kolom dasawisma.xlsx)
 * and returns the populated spreadsheet as a binary buffer.
 */
export async function generateOfficialExcelWorkbook(options: ExportOptions): Promise<Buffer> {
  const templateFile = path.resolve(process.cwd(), options.templatePath || 'docs/kolom dasawisma.xlsx');
  
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

  const whereFamily: any = {
    statusData: { not: 'ARSIP' },
  };

  if (options.keluargaId) {
    whereFamily.id = options.keluargaId;
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

    // Populate Anggota Table starting at row 23
    let rIdx = 23;
    for (let i = 0; i < primaryFamily.anggota.length; i++) {
      const m = primaryFamily.anggota[i];
      const row = wsDataKeluarga.getRow(rIdx + i);
      row.getCell(1).value = i + 1; // NO
      row.getCell(2).value = m.noRegistrasi || '-';
      row.getCell(3).value = m.nama;
      row.getCell(4).value = m.hubunganKeluarga;
      row.getCell(5).value = m.statusPerkawinan;
      row.getCell(6).value = m.jenisKelamin === 'L' ? 'L' : '';
      row.getCell(7).value = m.jenisKelamin === 'P' ? 'P' : '';
      row.getCell(8).value = m.tanggalLahir ? new Date(m.tanggalLahir).toLocaleDateString('id-ID') : '';
      row.getCell(9).value = m.pendidikan;
      row.getCell(10).value = m.pekerjaan;
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
    wsCatatanKeluarga.getCell('N7').value = `: ${primaryFamily.kriteriaRumah}`;
    wsCatatanKeluarga.getCell('N8').value = `: ${primaryFamily.jambanKeluarga ? 'Ada' : 'Tidak'}`;
    wsCatatanKeluarga.getCell('P8').value = primaryFamily.jumlahJamban;
    wsCatatanKeluarga.getCell('N9').value = `: ${primaryFamily.sumberAir}`;
    wsCatatanKeluarga.getCell('N10').value = `: ${primaryFamily.tempatSampah ? 'Ada' : 'Tidak'}`;

    let rIdx = 14;
    primaryFamily.anggota.forEach((m, idx) => {
      const row = wsCatatanKeluarga.getRow(rIdx + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = m.nama;
      row.getCell(3).value = m.statusPerkawinan;
      row.getCell(4).value = m.jenisKelamin;
      row.getCell(5).value = m.tempatLahir;
      row.getCell(6).value = m.tanggalLahir ? new Date(m.tanggalLahir).toLocaleDateString('id-ID') : '';
      row.getCell(7).value = m.agama;
      row.getCell(8).value = m.pendidikan;
      row.getCell(9).value = m.pekerjaan;
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

      let rIdx = 14;
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

  // --- SHEET 20: "rekap cat data &keg.warga desa" (Desa Rekap) ---
  const wsRekapDesa = workbook.getWorksheet('rekap cat data &keg.warga desa');
  if (wsRekapDesa) {
    wsRekapDesa.getCell('D5').value = 'Desa Bhakti Grisa';
    wsRekapDesa.getCell('D6').value = 'Kecamatan Cerdas';
    wsRekapDesa.getCell('D7').value = 'Kabupaten Mandiri';
    wsRekapDesa.getCell('D8').value = 'Jawa Tengah';

    const sumRowDesa = wsRekapDesa.getRow(27);
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
      sumRowDesa.getCell(18).value = desaAgg.totalDisabilitas;
      sumRowDesa.getCell(19).value = desaAgg.totalRumahSehat;
      sumRowDesa.getCell(20).value = desaAgg.totalRumahKurangSehat + desaAgg.totalRumahTidakSehat;
      sumRowDesa.getCell(26).value = desaAgg.totalJamban;
    }
  }

  // Export populated workbook into binary buffer
  const uint8 = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8);
}
