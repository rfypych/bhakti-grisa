import React from 'react';
import { calculateAge } from '@/lib/demographics';

export interface PrintMemberData {
  id: string;
  nama: string;
  statusPerkawinan?: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir?: string;
  tanggalLahir: Date | string;
  agama?: string;
  pendidikan?: string;
  pekerjaan?: string;
  disabilitas?: boolean;
  jenisDisabilitas?: string | null;
  jabatanPkk?: string | null;
  kegPancasila?: boolean;
  kegGotongRoyong?: boolean;
  kegPendidikanKeterampilan?: boolean;
  kegKoperasi?: boolean;
  kegPangan?: boolean;
  kegSandang?: boolean;
  kegKesehatan?: boolean;
  kegPerencanaanSehat?: boolean;
}

export interface PrintFamilyData {
  id: string;
  noKk: string;
  namaKepalaRumahTangga: string;
  alamat: string;
  kriteriaRumah: string;
  jambanKeluarga: boolean;
  jumlahJamban?: number;
  sumberAir?: string;
  tempatSampah?: boolean;
  spal?: boolean;
  stikerP4k?: boolean;
  makananPokok?: string;
  aktivitasUp2k?: boolean;
  wilayah?: {
    namaDasawisma?: string;
    rt?: string;
    rw?: string;
    dusun?: string;
  } | null;
  anggota: PrintMemberData[];
}

export const CATATAN_KELUARGA_COLUMNS = [
  'NAMA ANGGOTA KELUARGA',
  'STATUS PERKAWINAN',
  'JENIS KELAMIN (L/P)',
  'TEMPAT LAHIR',
  'TGL / BLN / THN LAHIR / UMUR',
  'AGAMA',
  'PENDIDIKAN',
  'PEKERJAAN',
  'BERKEBUTUHAN KHUSUS',
  'PENGHAYATAN & PENGAMALAN PANCASILA',
  'GOTONG ROYONG',
  'PENDIDIKAN & KETRAMPILAN',
  'PENGEMBANGAN KEHIDUPAN BERKOPERASI',
  'PANGAN',
  'SANDANG',
  'KESEHATAN',
  'PERENCANAAN SEHAT',
  'KETERANGAN',
];

export function formatCatatanKeluargaPrintData(family: PrintFamilyData) {
  const kriteriaRumahLabel = family.kriteriaRumah === 'SEHAT' ? 'Layak Huni' : 'Tidak Layak Huni';
  const now = new Date();

  const rows = family.anggota.map((m, idx) => {
    const bDate = typeof m.tanggalLahir === 'string' ? new Date(m.tanggalLahir) : m.tanggalLahir;
    const age = calculateAge(bDate, now);
    const dateFormatted = bDate ? bDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

    const cells: (string | number)[] = [
      m.nama,
      m.statusPerkawinan ? m.statusPerkawinan.replace(/_/g, ' ') : 'BELUM KAWIN',
      m.jenisKelamin,
      m.tempatLahir || '-',
      `${dateFormatted} / ${age} Th`,
      m.agama ? m.agama.replace(/_/g, ' ') : 'ISLAM',
      m.pendidikan ? m.pendidikan.replace(/_/g, ' ') : '-',
      m.pekerjaan ? m.pekerjaan.replace(/_/g, ' ') : '-',
      m.disabilitas ? (m.jenisDisabilitas || 'YA') : 'TIDAK',
      m.kegPancasila ? 'V' : '-',
      m.kegGotongRoyong ? 'V' : '-',
      m.kegPendidikanKeterampilan ? 'V' : '-',
      m.kegKoperasi ? 'V' : '-',
      m.kegPangan ? 'V' : '-',
      m.kegSandang ? 'V' : '-',
      m.kegKesehatan ? 'V' : '-',
      m.kegPerencanaanSehat ? 'V' : '-',
      m.jabatanPkk || '-',
    ];

    return {
      no: idx + 1,
      cells,
    };
  });

  return {
    columns: CATATAN_KELUARGA_COLUMNS,
    kriteriaRumahLabel,
    header: {
      namaKrt: family.namaKepalaRumahTangga,
      dasawisma: family.wilayah?.namaDasawisma || '-',
      rt: family.wilayah?.rt || '-',
      rw: family.wilayah?.rw || '-',
      dusun: family.wilayah?.dusun || '-',
      tahun: now.getFullYear().toString(),
      kriteriaRumah: kriteriaRumahLabel,
      jambanKeluarga: family.jambanKeluarga ? 'Ada' : 'Tidak',
      jumlahJamban: family.jumlahJamban ?? (family.jambanKeluarga ? 1 : 0),
      sumberAir: family.sumberAir || 'SUMUR',
      tempatSampah: family.tempatSampah ? 'Ada' : 'Tidak',
      spal: family.spal ? 'Ada' : 'Tidak',
      stikerP4k: family.stikerP4k ? 'Ada' : 'Tidak',
      makananPokok: family.makananPokok || 'BERAS',
      aktivitasUp2k: family.aktivitasUp2k ? 'Ada' : 'Tidak',
    },
    rows,
  };
}

export function CatatanKeluargaPrint({ family }: { family: PrintFamilyData }) {
  const data = formatCatatanKeluargaPrintData(family);

  return (
    <div className="bg-white text-black p-6 font-sans text-[11px] leading-snug print:p-0 print:text-[10px]">
      {/* Header Kop Surat */}
      <div className="text-right font-bold text-xs uppercase tracking-wider mb-2">
        LAMPIRAN 4.15
      </div>
      <div className="text-center font-bold space-y-0.5 border-b-2 border-black pb-3 mb-4">
        <h1 className="text-base font-extrabold uppercase tracking-wide">
          CATATAN KELUARGA
        </h1>
        <p className="text-xs uppercase font-medium">
          TIM PENGGERAK PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (TP PKK)
        </p>
      </div>

      {/* Info Block (Metadata) */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-xs">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-48 font-medium">CATATAN KELUARGA DARI</span>
            <span>: <b className="uppercase">{data.header.namaKrt}</b></span>
          </div>
          <div className="flex">
            <span className="w-48 font-medium">ANGGOTA KELOMPOK DASA WISMA</span>
            <span>: {data.header.dasawisma}</span>
          </div>
          <div className="flex">
            <span className="w-48 font-medium">RT / RW / DUSUN</span>
            <span>: RT {data.header.rt} / RW {data.header.rw} / {data.header.dusun}</span>
          </div>
          <div className="flex">
            <span className="w-48 font-medium">TAHUN</span>
            <span>: {data.header.tahun}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-40 font-medium">KRITERIA RUMAH</span>
            <span>: <b>{data.header.kriteriaRumah}</b></span>
          </div>
          <div className="flex">
            <span className="w-40 font-medium">JAMBAN KELUARGA</span>
            <span>: {data.header.jambanKeluarga} (Jumlah: {data.header.jumlahJamban} buah)</span>
          </div>
          <div className="flex">
            <span className="w-40 font-medium">SUMBER AIR</span>
            <span>: {data.header.sumberAir}</span>
          </div>
          <div className="flex">
            <span className="w-40 font-medium">TEMPAT SAMPAH / SPAL</span>
            <span>: {data.header.tempatSampah} / {data.header.spal}</span>
          </div>
        </div>
      </div>

      {/* 19-Column Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-center text-[10px]">
          <thead>
            <tr className="bg-stone-100 font-bold border-b border-black">
              <th rowSpan={2} className="border border-black px-1.5 py-1 w-6">NO</th>
              <th rowSpan={2} className="border border-black px-2 py-1 min-w-[120px]">NAMA ANGGOTA KELUARGA</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">STATUS PERKAWINAN</th>
              <th rowSpan={2} className="border border-black px-1 py-1">L/P</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">TEMPAT LAHIR</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">TGL LAHIR / UMUR</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">AGAMA</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">PENDIDIKAN</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">PEKERJAAN</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1">BERKEBUTUHAN KHUSUS</th>
              <th colSpan={8} className="border border-black px-1.5 py-0.5">KEGIATAN PKK YANG DIIKUTI</th>
              <th rowSpan={2} className="border border-black px-1.5 py-1 min-w-[60px]">KET</th>
            </tr>
            <tr className="bg-stone-50 font-semibold border-b border-black text-[9px]">
              <th className="border border-black px-1 py-0.5">PANCASILA</th>
              <th className="border border-black px-1 py-0.5">GOTONG ROYONG</th>
              <th className="border border-black px-1 py-0.5">PEND & KETR</th>
              <th className="border border-black px-1 py-0.5">KOPERASI</th>
              <th className="border border-black px-1 py-0.5">PANGAN</th>
              <th className="border border-black px-1 py-0.5">SANDANG</th>
              <th className="border border-black px-1 py-0.5">KESEHATAN</th>
              <th className="border border-black px-1 py-0.5">RENC SEHAT</th>
            </tr>
            <tr className="bg-stone-100 font-bold text-[8px] border-b border-black text-stone-500">
              {Array.from({ length: 19 }).map((_, i) => (
                <th key={i} className="border border-black py-0.5">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.no} className="border-b border-black">
                <td className="border border-black py-1 px-1">{row.no}</td>
                <td className="border border-black py-1 px-1.5 text-left font-semibold">{row.cells[0]}</td>
                <td className="border border-black py-1 px-1">{row.cells[1]}</td>
                <td className="border border-black py-1 px-1">{row.cells[2]}</td>
                <td className="border border-black py-1 px-1">{row.cells[3]}</td>
                <td className="border border-black py-1 px-1">{row.cells[4]}</td>
                <td className="border border-black py-1 px-1">{row.cells[5]}</td>
                <td className="border border-black py-1 px-1">{row.cells[6]}</td>
                <td className="border border-black py-1 px-1">{row.cells[7]}</td>
                <td className="border border-black py-1 px-1">{row.cells[8]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[9]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[10]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[11]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[12]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[13]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[14]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[15]}</td>
                <td className="border border-black py-1 px-1 font-bold">{row.cells[16]}</td>
                <td className="border border-black py-1 px-1 text-left">{row.cells[17]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature Blocks */}
      <div className="grid grid-cols-2 mt-8 pt-4 text-xs text-center break-inside-avoid">
        <div>
          <p className="font-medium">Mengetahui,</p>
          <p className="font-semibold">Ketua Tim Penggerak PKK Desa / RT</p>
          <div className="h-16" />
          <p className="font-bold underline uppercase">( ............................................ )</p>
        </div>

        <div>
          <p className="font-medium">Kudus, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-semibold">Ketua Kelompok Dasa Wisma</p>
          <div className="h-16" />
          <p className="font-bold underline uppercase">( ............................................ )</p>
        </div>
      </div>
    </div>
  );
}
