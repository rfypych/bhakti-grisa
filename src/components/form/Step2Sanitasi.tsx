'use client';

import React from 'react';

interface Step2Props {
  formData: any;
  updateField: (key: string, val: any) => void;
}

export function Step2Sanitasi({ formData, updateField }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-950">Langkah 2: Sanitasi & Lingkungan Fisik Rumah</h2>
        <p className="text-sm text-stone-600 mt-1">
          Kondisi sanitasi, jamban keluarga, sumber air minum, dan indikator PHBS (Lampiran 4.14.2a & 4.15).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-800 mb-1">
            Kriteria Kelayakan Rumah
          </label>
          <select
            value={formData.kriteriaRumah || 'SEHAT'}
            onChange={(e) => updateField('kriteriaRumah', e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="SEHAT">Sehat Layak Huni</option>
            <option value="KURANG_SEHAT">Kurang Sehat</option>
            <option value="TIDAK_SEHAT_LAYAK_HUNI">Tidak Sehat / Perlu Bedah Rumah</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-800 mb-1">
            Sumber Air Utama Keluarga
          </label>
          <select
            value={formData.sumberAir || 'SUMUR'}
            onChange={(e) => updateField('sumberAir', e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="PDAM">PDAM / Air Perpipaan</option>
            <option value="SUMUR">Sumur Gali / Pompa</option>
            <option value="SUNGAI">Sungai / Mata Air Alam</option>
            <option value="LAINNYA">Lainnya (Air Hujan / Tangki)</option>
          </select>
        </div>

        <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-800">Jamban Keluarga</span>
            <input
              type="checkbox"
              checked={formData.jambanKeluarga ?? true}
              onChange={(e) => updateField('jambanKeluarga', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          {formData.jambanKeluarga && (
            <div>
              <label className="block text-xs text-stone-600 mb-1">Jumlah Jamban / Kloset (buah)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.jumlahJamban || 1}
                onChange={(e) => updateField('jumlahJamban', parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm"
              />
            </div>
          )}
        </div>

        <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-800">Tempat Pembuangan Sampah</span>
            <input
              type="checkbox"
              checked={formData.tempatSampah ?? true}
              onChange={(e) => updateField('tempatSampah', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-stone-500">Memiliki tempat sampah tertutup atau terpisah di rumah.</p>
        </div>

        <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-800">Saluran Pembuangan Air Limbah (SPAL)</span>
            <input
              type="checkbox"
              checked={formData.spal ?? true}
              onChange={(e) => updateField('spal', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-stone-500">Air limbah dapur/kamar mandi mengalir ke saluran/resapan tertutup.</p>
        </div>

        <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-800">Menempelkan Stiker P4K</span>
            <input
              type="checkbox"
              checked={formData.stikerP4k ?? false}
              onChange={(e) => updateField('stikerP4k', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-stone-500">Program Perencanaan Persalinan dan Pencegahan Komplikasi.</p>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1">Makanan Pokok Utama</label>
            <select
              value={formData.makananPokok || 'BERAS'}
              onChange={(e) => updateField('makananPokok', e.target.value)}
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="BERAS">Beras</option>
              <option value="NON_BERAS">Non Beras (Jagung, Singkong, dll.)</option>
            </select>
          </div>
          {formData.makananPokok === 'NON_BERAS' && (
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1">Jenis Non Beras</label>
              <input
                type="text"
                placeholder="misal: Jagung, Tiwul, Umbi-umbian"
                value={formData.jenisNonBeras || ''}
                onChange={(e) => updateField('jenisNonBeras', e.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
