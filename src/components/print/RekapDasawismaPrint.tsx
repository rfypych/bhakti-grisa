import React from 'react';
import { DasawismaAggregationResult } from '@/lib/aggregation';

interface RekapDasawismaPrintProps {
  data: DasawismaAggregationResult;
}

export function RekapDasawismaPrint({ data }: RekapDasawismaPrintProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white text-black p-6 font-sans text-xs leading-relaxed print:p-0 print:text-[10px]">
      {/* Header Kop */}
      <div className="text-right font-bold text-xs uppercase tracking-wider mb-2">
        LAMPIRAN 4.16a
      </div>
      <div className="text-center font-bold space-y-1 border-b-2 border-black pb-3 mb-4">
        <h1 className="text-base font-extrabold uppercase tracking-wide">
          REKAPITULASI CATATAN DATA DAN KEGIATAN WARGA
        </h1>
        <h2 className="text-sm font-bold uppercase tracking-wider">
          KELOMPOK DASA WISMA &bull; TP PKK DESA GRUDO
        </h2>
      </div>

      {/* Wilayah Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-medium">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-36">DASA WISMA</span>
            <span>: <b>{data.namaDasawisma || '-'}</b></span>
          </div>
          <div className="flex">
            <span className="w-36">RT / RW</span>
            <span>: RT {data.rt || '-'} / RW {data.rw || '-'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex">
            <span className="w-36">DUSUN / DESA</span>
            <span>: {data.dusun || 'Krajan'} / Grudo</span>
          </div>
          <div className="flex">
            <span className="w-36">TAHUN PELAPORAN</span>
            <span>: {currentYear}</span>
          </div>
        </div>
      </div>

      {/* Rekapitulasi Summary Table */}
      <table className="w-full border-collapse border border-black text-center text-xs mb-6">
        <thead>
          <tr className="bg-stone-100 font-bold border-b border-black">
            <th className="border border-black px-2 py-1.5 w-10">NO</th>
            <th className="border border-black px-3 py-1.5 text-left">INDIKATOR POKOK ADMINISTRASI</th>
            <th className="border border-black px-3 py-1.5 w-28">JUMLAH</th>
            <th className="border border-black px-3 py-1.5 w-32">SATUAN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black">
          <tr>
            <td className="border border-black py-1">1</td>
            <td className="border border-black py-1 px-3 text-left">Jumlah Kepala Keluarga (KK)</td>
            <td className="border border-black py-1 font-bold">{data.totalKeluarga}</td>
            <td className="border border-black py-1">KK</td>
          </tr>
          <tr>
            <td className="border border-black py-1">2</td>
            <td className="border border-black py-1 px-3 text-left">Total Jumlah Jiwa / Warga</td>
            <td className="border border-black py-1 font-bold">{data.totalAnggota}</td>
            <td className="border border-black py-1">Jiwa</td>
          </tr>
          <tr>
            <td className="border border-black py-1">3</td>
            <td className="border border-black py-1 px-3 text-left">Balita (Usia 0 - 5 Tahun)</td>
            <td className="border border-black py-1 font-bold">{data.totalBalita}</td>
            <td className="border border-black py-1">Anak</td>
          </tr>
          <tr>
            <td className="border border-black py-1">4</td>
            <td className="border border-black py-1 px-3 text-left">Lanjut Usia (Lansia &ge; 60 Tahun)</td>
            <td className="border border-black py-1 font-bold">{data.totalLansia}</td>
            <td className="border border-black py-1">Jiwa</td>
          </tr>
          <tr>
            <td className="border border-black py-1">5</td>
            <td className="border border-black py-1 px-3 text-left">Wanita Usia Subur (WUS)</td>
            <td className="border border-black py-1 font-bold">{data.totalWus}</td>
            <td className="border border-black py-1">Orang</td>
          </tr>
          <tr>
            <td className="border border-black py-1">6</td>
            <td className="border border-black py-1 px-3 text-left">Pasangan Usia Subur (PUS)</td>
            <td className="border border-black py-1 font-bold">{data.totalPus}</td>
            <td className="border border-black py-1">Pasang</td>
          </tr>
          <tr>
            <td className="border border-black py-1">7</td>
            <td className="border border-black py-1 px-3 text-left">Ibu Hamil Aktif</td>
            <td className="border border-black py-1 font-bold">{data.totalIbuHamil}</td>
            <td className="border border-black py-1">Orang</td>
          </tr>
          <tr>
            <td className="border border-black py-1">8</td>
            <td className="border border-black py-1 px-3 text-left">Ibu Menyusui (Nifas)</td>
            <td className="border border-black py-1 font-bold">{data.totalIbuMenyusui}</td>
            <td className="border border-black py-1">Orang</td>
          </tr>
          <tr>
            <td className="border border-black py-1">9</td>
            <td className="border border-black py-1 px-3 text-left">Rumah Layak Huni (Kriteria Sehat)</td>
            <td className="border border-black py-1 font-bold">{data.totalRumahSehat}</td>
            <td className="border border-black py-1">Rumah</td>
          </tr>
          <tr>
            <td className="border border-black py-1">10</td>
            <td className="border border-black py-1 px-3 text-left">Rumah Kurang Sehat</td>
            <td className="border border-black py-1 font-bold">{data.totalRumahKurangSehat}</td>
            <td className="border border-black py-1">Rumah</td>
          </tr>
          <tr>
            <td className="border border-black py-1">11</td>
            <td className="border border-black py-1 px-3 text-left">Kepemilikan Jamban Keluarga</td>
            <td className="border border-black py-1 font-bold">{data.totalJamban}</td>
            <td className="border border-black py-1">Keluarga</td>
          </tr>
          <tr>
            <td className="border border-black py-1">12</td>
            <td className="border border-black py-1 px-3 text-left">Warga Buta Huruf (3 Buta)</td>
            <td className="border border-black py-1 font-bold">{data.totalTigaButa}</td>
            <td className="border border-black py-1">Orang</td>
          </tr>
          <tr>
            <td className="border border-black py-1">13</td>
            <td className="border border-black py-1 px-3 text-left">Penyandang Disabilitas</td>
            <td className="border border-black py-1 font-bold">{data.totalDisabilitas}</td>
            <td className="border border-black py-1">Orang</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 mt-8 text-xs text-center break-inside-avoid">
        <div>
          <p className="font-medium">Mengetahui,</p>
          <p className="font-semibold">Ketua Tim Penggerak PKK Desa Grudo</p>
          <div className="h-16" />
          <p className="font-bold underline uppercase">( ............................................ )</p>
        </div>

        <div>
          <p className="font-medium">Ngawi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-semibold">Ketua Kelompok Dasa Wisma {data.namaDasawisma || ''}</p>
          <div className="h-16" />
          <p className="font-bold underline uppercase">( ............................................ )</p>
        </div>
      </div>
    </div>
  );
}
