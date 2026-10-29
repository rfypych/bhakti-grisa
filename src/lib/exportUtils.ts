import {
  KeluargaRecord,
  Wilayah,
  PeristiwaRecord,
  generate31SheetsBukuDasawisma,
  computeDashboardAggregates,
} from './domain';

/**
 * Generates and downloads an authentic multi-worksheet Excel (.xls SpreadsheetML) file
 * containing all 31 official sheets of Buku Dasawisma TP PKK Desa Grudo.
 * Simulates the `/api/export/excel` endpoint directly in the browser with zero external dependencies.
 */
export function downloadExcel31SheetWorkbook(
  families: KeluargaRecord[],
  wilayahList: Wilayah[],
  events: PeristiwaRecord[],
  tahun: number,
  scopeLabel: string
): string {
  const sheets = generate31SheetsBukuDasawisma(families, wilayahList, events, tahun);

  const escapeXml = (val: string | number) =>
    String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const worksheetsXml = sheets
    .map((sheet) => {
      const sheetName = escapeXml(sheet.sheetCode.slice(0, 31));
      const headerCells = sheet.headers
        .map(
          (h) =>
            `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
        )
        .join('');

      const dataRows = sheet.rows
        .map((row) => {
          const cells = row
            .map((cell) => {
              const type = typeof cell === 'number' ? 'Number' : 'String';
              return `<Cell ss:StyleID="Cell"><Data ss:Type="${type}">${escapeXml(
                cell
              )}</Data></Cell>`;
            })
            .join('');
          return `<Row>${cells}</Row>`;
        })
        .join('\n');

      return `
      <Worksheet ss:Name="${sheetName}">
        <Table>
          <Row>
            <Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(
              `${sheet.sheetTitle} (${sheet.lampiranRef})`
            )}</Data></Cell>
          </Row>
          <Row>
            <Cell ss:StyleID="Subtitle"><Data ss:Type="String">${escapeXml(
              `Pemerintah Desa Grudo • TP PKK Dasawisma • Tahun ${tahun} • ${scopeLabel}`
            )}</Data></Cell>
          </Row>
          <Row>${headerCells}</Row>
          ${dataRows}
        </Table>
      </Worksheet>`;
    })
    .join('\n');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="12"/>
    </Style>
    <Style ss:ID="Subtitle">
      <Font ss:Italic="1" ss:Size="10" ss:Color="#475569"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Cell">
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
  </Styles>
  ${worksheetsXml}
</Workbook>`;

  const filename = `SIMPATIK_Laporan_${tahun}.xls`;

  if (typeof document !== 'undefined') {
    const blob = new Blob([workbookXml], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return filename;
}

/**
 * Generates and downloads an official printable HTML-PDF document for Lampiran 4.15 Catatan Keluarga
 * or Aggregate Village Report (`/api/export/pdf`).
 */

export function humanizeSumberAir(val: string): string {
  switch (val) {
    case 'PDAM': return 'PDAM';
    case 'SUMUR_GALI': return 'Sumur Gali';
    case 'SUMUR_POMPA': return 'Sumur Pompa';
    case 'MATA_AIR': return 'Mata Air';
    case 'SUNGAI': return 'Sungai';
    case 'LAINNYA': return 'Lainnya';
    default: return (val || '').replace(/_/g, ' ');
  }
}

export function humanizePendidikan(val: string): string {
  switch (val) {
    case 'TIDAK_SEKOLAH':
    case 'TIDAK_TAMAT_SD': return 'Tidak Tamat SD';
    case 'SD':
    case 'SD_MI': return 'SD / Sederajat';
    case 'SMP':
    case 'SMP_SEDERAJAT': return 'SMP / Sederajat';
    case 'SMA':
    case 'SMA_SMK_SEDERAJAT': return 'SMA / SMK Sederajat';
    case 'DIPLOMA': return 'Diploma';
    case 'S1':
    case 'S1_S2_S3': return 'S1 / Sarjana';
    case 'S2': return 'S2 / Magister';
    case 'S3': return 'S3 / Doktor';
    default: return (val || '').replace(/_/g, ' ');
  }
}

export function humanizeStatusKawin(val: string): string {
  switch (val) {
    case 'BELUM_KAWIN': return 'Belum Kawin';
    case 'KAWIN': return 'Kawin';
    case 'CERAI_HIDUP': return 'Cerai Hidup';
    case 'CERAI_MATI': return 'Cerai Mati';
    case 'JANDA': return 'Janda';
    case 'DUDA': return 'Duda';
    default: return (val || '').replace(/_/g, ' ');
  }
}

export function humanizeKriteriaRumah(val: string): string {
  switch (val) {
    case 'SEHAT': return 'Sehat';
    case 'KURANG_SEHAT': return 'Kurang Sehat';
    case 'TIDAK_SEHAT':
    case 'TIDAK_SEHAT_LAYAK_HUNI': return 'Tidak Sehat';
    default: return (val || '').replace(/_/g, ' ');
  }
}

export function humanizePekerjaan(val: string): string {
  switch (val) {
    case 'TIDAK_BEKERJA':
    case 'BELUM_BEKERJA':
      return 'Tidak / Belum Bekerja';
    case 'IBU_RUMAH_TANGGA':
      return 'Mengurus Rumah Tangga';
    case 'PELAJAR_MAHASISWA':
      return 'Pelajar / Mahasiswa';
    case 'PNS':
      return 'Pegawai Negeri Sipil (PNS)';
    case 'TNI_POLRI':
      return 'TNI / POLRI';
    case 'SWASTA':
    case 'KARYAWAN_SWASTA':
      return 'Karyawan Swasta';
    case 'WIRASWASTA':
    case 'PEDAGANG':
      return 'Wiraswasta / Pedagang';
    case 'PETANI':
    case 'PETANI_PETERNAK':
      return 'Petani / Peternak';
    case 'BURUH':
      return 'Buruh / Pekerja Kasar';
    case 'PENSIUNAN':
      return 'Pensiunan';
    case 'LAINNYA':
      return 'Lainnya';
    default:
      return (val || '').replace(/_/g, ' ');
  }
}

export function humanizeHubungan(val: string): string {
  switch (val) {
    case 'KEPALA_KELUARGA':
      return 'Kepala Keluarga';
    case 'ISTRI':
      return 'Istri';
    case 'SUAMI':
      return 'Suami';
    case 'ANAK':
      return 'Anak';
    case 'MENANTU':
      return 'Menantu';
    case 'CUCU':
      return 'Cucu';
    case 'ORANG_TUA':
      return 'Orang Tua';
    case 'MERTUA':
      return 'Mertua';
    case 'FAMILI_LAIN':
      return 'Famili Lain';
    case 'PEMBANTU':
      return 'Pembantu';
    default:
      return (val || '').replace(/_/g, ' ');
  }
}

export function humanizeStatusHidup(val: string): string {
  switch (val) {
    case 'HIDUP':
      return 'Hidup';
    case 'MENINGGAL':
      return 'Meninggal';
    case 'PINDAH':
      return 'Pindah';
    default:
      return (val || '').replace(/_/g, ' ');
  }
}

export function downloadOfficialPdfReport(
  families: KeluargaRecord[],
  tahun: number,
  scopeLabel: string,
  singleFamily?: KeluargaRecord
): string {
  const agg = computeDashboardAggregates(families);
  const targetList = singleFamily ? [singleFamily] : families.filter((f) => f.status === 'VERIFIKASI');

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>SIMPATIK Desa Grudo - Dokumen Resmi PKK (${tahun})</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
    h1 { font-size: 16px; margin: 0 0 4px 0; text-transform: uppercase; }
    h2 { font-size: 13px; margin: 0 0 16px 0; color: #334155; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; }
    th, td { border: 1px solid #334155; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .footer-sign { margin-top: 32px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h1>TIM PENGGERAK PKK DESA GRUDO — KECAMATAN NGAWI</h1>
  <h2>Lampiran 4.15 Catatan Keluarga & Rekapitulasi Dasawisma • Tahun ${tahun} • ${scopeLabel}</h2>
  <p>Ringkasan Cakupan: <strong>${agg.totalKKTerverifikasi} KK Terverifikasi</strong> · <strong>${agg.totalJiwa} Jiwa Warga</strong> (${agg.totalLakiLaki} L / ${agg.totalPerempuan} P) · <strong>${agg.rumahSehat} Rumah Sehat</strong></p>
  ${targetList
    .map(
      (f) => `
    <div style="page-break-inside: avoid; margin-bottom: 28px;">
      <h3>KK: ${f.namaKepalaKeluarga} (No. KK: ${f.noKK}) — Dasawisma ${f.namaDasawisma} (RT ${f.rt}/RW ${f.rw}, Dusun ${f.dusun})</h3>
      <p>Alamat: ${f.alamat} | Sanitasi: ${humanizeKriteriaRumah(f.sanitasi.kriteriaRumah)}, Air: ${humanizeSumberAir(f.sanitasi.sumberAir)}, Jamban: ${
        f.sanitasi.punyaJamban ? 'Ada' : 'Tidak'
      }, SPAL: ${f.sanitasi.punyaSpal ? 'Ada' : 'Tidak'}, UP2K: ${
        f.pekarangan.ikutUp2k ? f.pekarangan.jenisUsahaUp2k || 'Ya' : 'Tidak'
      }</p>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Lengkap</th>
            <th>NIK</th>
            <th>Hubungan</th>
            <th>L/P</th>
            <th>Tgl Lahir / Umur</th>
            <th>Pendidikan</th>
            <th>Pekerjaan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${f.anggota
            .map(
              (a, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${a.nama}</td>
              <td>${a.nik}${a.isVirtualNik ? ' (Virtual)' : ''}</td>
              <td>${humanizeHubungan(a.hubungan)}</td>
              <td>${a.jenisKelamin}</td>
              <td>${a.tanggalLahir} (${a.umur} th)</td>
              <td>${humanizePendidikan(a.pendidikan)}</td>
              <td>${humanizePekerjaan(a.pekerjaan)}</td>
              <td>${humanizeStatusHidup(a.statusHidup)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>`
    )
    .join('')}
  <div class="footer-sign">
    <div>Mengetahui,<br/><strong>Ketua TP PKK Desa Grudo</strong><br/><br/><br/>Hj. Kartika Sari, S.Sos</div>
    <div>Ngawi, Oktober ${tahun}<br/><strong>Ketua Kelompok Dasawisma / Kader RT</strong><br/><br/><br/>(_______________________)</div>
  </div>
</body>
</html>`;

  const filename = singleFamily
    ? `Lampiran_4_15_Catatan_Keluarga_${singleFamily.namaKepalaKeluarga.replace(/\s+/g, '_')}.html`
    : `SIMPATIK_Rekap_Resmi_PKK_${tahun}.html`;

  if (typeof document !== 'undefined') {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return filename;
}
