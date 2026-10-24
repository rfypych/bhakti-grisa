'use client';

import React from 'react';
import { CheckCircle2, Home, Users, Droplets, Sprout, Store } from 'lucide-react';

interface Step5Props {
  formData: any;
  isPublicResident?: boolean;
}

export function Step5ReviewSubmit({ formData, isPublicResident = false }: Step5Props) {
  const anggota = formData.anggota || [];
  const hatinya = formData.hatinyaPkk || [];
  const industri = formData.industriRumahTangga || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-950">Langkah 5: Ringkasan & Konfirmasi Akhir</h2>
        <p className="text-sm text-stone-600 mt-1">
          Periksa kembali kebenaran seluruh isian formulir sebelum data dikirimkan ke pangkalan data SIMPATIK.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-semibold">
            Status Pengiriman: {isPublicResident ? 'DRAFT (Menunggu Verifikasi Kader RT)' : 'VERIFIKASI (Input Langsung Kader)'}
          </p>
          <p className="text-emerald-800">
            {isPublicResident
              ? 'Data yang dikirim mandiri oleh warga akan masuk ke antrean verifikasi kader Dasawisma setempat sebelum terhitung dalam rekapitulasi desa.'
              : 'Data yang diinput langsung oleh kader akan otomatis masuk ke database resmi dan memperbarui rekapitulasi berjenjang secara real-time.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Identitas Rumah */}
        <div className="p-4 rounded-lg border border-stone-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Home className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Profil Rumah Tangga</h3>
          </div>
          <div className="text-xs space-y-1 text-stone-700">
            <p><span className="text-stone-500">No. KK:</span> <span className="font-mono font-semibold">{formData.noKk || '-'}</span></p>
            <p><span className="text-stone-500">Nama Kepala RT:</span> <span className="font-semibold">{formData.namaKepalaRumahTangga || '-'}</span></p>
            <p><span className="text-stone-500">Alamat:</span> {formData.alamat || '-'}</p>
            {formData.latitude && formData.longitude && (
              <p><span className="text-stone-500">Koordinat:</span> {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}</p>
            )}
          </div>
        </div>

        {/* Card 2: Sanitasi */}
        <div className="p-4 rounded-lg border border-stone-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Droplets className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Sanitasi & Lingkungan</h3>
          </div>
          <div className="text-xs space-y-1 text-stone-700">
            <p><span className="text-stone-500">Kriteria Rumah:</span> <span className="font-semibold">{formData.kriteriaRumah || 'SEHAT'}</span></p>
            <p><span className="text-stone-500">Jamban Keluarga:</span> {formData.jambanKeluarga ? `Ada (${formData.jumlahJamban || 1} buah)` : 'Tidak Ada'}</p>
            <p><span className="text-stone-500">Sumber Air:</span> {formData.sumberAir || '-'}</p>
            <p><span className="text-stone-500">Tempat Sampah / SPAL:</span> {formData.tempatSampah ? 'Ada' : 'Tidak'} / {formData.spal ? 'Ada' : 'Tidak'}</p>
            <p><span className="text-stone-500">Makanan Pokok:</span> {formData.makananPokok || 'BERAS'}</p>
          </div>
        </div>
      </div>

      {/* Card 3: Anggota Keluarga */}
      <div className="p-4 rounded-lg border border-stone-200 bg-white shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
          <Users className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
            Anggota Keluarga ({anggota.length} Jiwa)
          </h3>
        </div>
        {anggota.length === 0 ? (
          <p className="text-xs text-rose-600">Belum ada anggota keluarga yang dicatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="py-2 px-2.5">No</th>
                  <th className="py-2 px-2.5">Nama</th>
                  <th className="py-2 px-2.5">NIK</th>
                  <th className="py-2 px-2.5">Hubungan</th>
                  <th className="py-2 px-2.5">L/P</th>
                  <th className="py-2 px-2.5">Tgl Lahir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {anggota.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="py-1.5 px-2.5">{idx + 1}</td>
                    <td className="py-1.5 px-2.5 font-medium">{m.nama || '-'}</td>
                    <td className="py-1.5 px-2.5 font-mono">{m.nik || (m.isNikSementara ? '(Virtual NIK)' : '-')}</td>
                    <td className="py-1.5 px-2.5">{m.hubunganKeluarga}</td>
                    <td className="py-1.5 px-2.5">{m.jenisKelamin}</td>
                    <td className="py-1.5 px-2.5">
                      {m.tanggalLahir ? new Date(m.tanggalLahir).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 4: Pekarangan & UP2K */}
      {(hatinya.length > 0 || industri.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hatinya.length > 0 && (
            <div className="p-4 rounded-lg border border-stone-200 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Pekarangan (Hatinya PKK)</h3>
              </div>
              <ul className="text-xs space-y-1 text-stone-700 list-disc list-inside">
                {hatinya.map((h: any, i: number) => (
                  <li key={i}>{h.komoditi} ({h.kategori}) - {h.jumlah}</li>
                ))}
              </ul>
            </div>
          )}

          {industri.length > 0 && (
            <div className="p-4 rounded-lg border border-stone-200 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <Store className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Industri Rumah Tangga (UP2K)</h3>
              </div>
              <ul className="text-xs space-y-1 text-stone-700 list-disc list-inside">
                {industri.map((ind: any, i: number) => (
                  <li key={i}>{ind.komoditi} ({ind.kategori}) - {ind.volume}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
