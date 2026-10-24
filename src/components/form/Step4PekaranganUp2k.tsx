'use client';

import React from 'react';
import { Plus, Trash2, Sprout, Store } from 'lucide-react';

interface Step4Props {
  formData: any;
  updateField: (key: string, val: any) => void;
}

export function Step4PekaranganUp2k({ formData, updateField }: Step4Props) {
  const hatinyaList = formData.hatinyaPkk || [];
  const industriList = formData.industriRumahTangga || [];

  const handleAddHatinya = () => {
    updateField('hatinyaPkk', [
      ...hatinyaList,
      { kategori: 'WARUNG_HIDUP', komoditi: '', jumlah: '' },
    ]);
  };

  const handleRemoveHatinya = (idx: number) => {
    updateField(
      'hatinyaPkk',
      hatinyaList.filter((_: any, i: number) => i !== idx)
    );
  };

  const handleUpdateHatinya = (idx: number, field: string, val: string) => {
    const next = hatinyaList.map((item: any, i: number) =>
      i === idx ? { ...item, [field]: val } : item
    );
    updateField('hatinyaPkk', next);
  };

  const handleAddIndustri = () => {
    updateField('industriRumahTangga', [
      ...industriList,
      { kategori: 'PANGAN', komoditi: '', volume: '' },
    ]);
  };

  const handleRemoveIndustri = (idx: number) => {
    updateField(
      'industriRumahTangga',
      industriList.filter((_: any, i: number) => i !== idx)
    );
  };

  const handleUpdateIndustri = (idx: number, field: string, val: string) => {
    const next = industriList.map((item: any, i: number) =>
      i === idx ? { ...item, [field]: val } : item
    );
    updateField('industriRumahTangga', next);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-emerald-950">Langkah 4: Hatinya PKK & Industri Rumah Tangga (UP2K)</h2>
        <p className="text-sm text-stone-600 mt-1">
          Pemanfaatan pekarangan rumah tangga dan aktivitas usaha peningkatan pendapatan keluarga (opsional).
        </p>
      </div>

      {/* Bagian 1: Hatinya PKK */}
      <div className="p-5 rounded-lg border border-emerald-100 bg-emerald-50/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">Pemanfaatan Pekarangan (AKU HATINYA PKK)</h3>
          </div>
          <button
            type="button"
            onClick={handleAddHatinya}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Komoditi
          </button>
        </div>

        {hatinyaList.length === 0 ? (
          <p className="text-xs text-stone-500 italic">Belum ada komoditi pekarangan yang dicatat.</p>
        ) : (
          <div className="space-y-2">
            {hatinyaList.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded border border-stone-200 text-xs">
                <select
                  value={item.kategori}
                  onChange={(e) => handleUpdateHatinya(idx, 'kategori', e.target.value)}
                  className="rounded border border-stone-300 px-2 py-1 w-full sm:w-40"
                >
                  <option value="PETERNAKAN">Peternakan (Ayam, Bebek, dll)</option>
                  <option value="PERIKANAN">Perikanan (Lele, Nila, dll)</option>
                  <option value="WARUNG_HIDUP">Warung Hidup (Sayur, Cabai)</option>
                  <option value="TOGA">TOGA (Jahe, Kunyit, Kencur)</option>
                  <option value="TANAMAN_KERAS">Tanaman Keras (Mangga, Kelapa)</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
                <input
                  type="text"
                  placeholder="Nama Komoditi (misal: Jahe Merah)"
                  value={item.komoditi}
                  onChange={(e) => handleUpdateHatinya(idx, 'komoditi', e.target.value)}
                  className="rounded border border-stone-300 px-2 py-1 flex-1 w-full"
                />
                <input
                  type="text"
                  placeholder="Jumlah (misal: 10 pot / 5 ekor)"
                  value={item.jumlah}
                  onChange={(e) => handleUpdateHatinya(idx, 'jumlah', e.target.value)}
                  className="rounded border border-stone-300 px-2 py-1 w-full sm:w-36"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHatinya(idx)}
                  className="text-stone-400 hover:text-rose-600 p-1 self-end sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bagian 2: Industri Rumah Tangga (UP2K) */}
      <div className="p-5 rounded-lg border border-stone-200 bg-stone-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold text-stone-900">Industri Rumah Tangga (UP2K PKK)</h3>
          </div>
          <button
            type="button"
            onClick={handleAddIndustri}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-200 hover:bg-stone-300 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Usaha
          </button>
        </div>

        {industriList.length === 0 ? (
          <p className="text-xs text-stone-500 italic">Belum ada usaha industri rumah tangga yang dicatat.</p>
        ) : (
          <div className="space-y-2">
            {industriList.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded border border-stone-200 text-xs">
                <select
                  value={item.kategori}
                  onChange={(e) => handleUpdateIndustri(idx, 'kategori', e.target.value)}
                  className="rounded border border-stone-300 px-2 py-1 w-full sm:w-40"
                >
                  <option value="PANGAN">Pangan / Olahan Makanan</option>
                  <option value="SANDANG">Sandang / Busana</option>
                  <option value="KONVEKSI">Konveksi / Jahit</option>
                  <option value="JASA">Jasa</option>
                  <option value="LAIN_LAIN">Lain-lain</option>
                </select>
                <input
                  type="text"
                  placeholder="Komoditi (misal: Keripik Tempe)"
                  value={item.komoditi}
                  onChange={(e) => handleUpdateIndustri(idx, 'komoditi', e.target.value)}
                  className="rounded border border-stone-300 px-2 py-1 flex-1 w-full"
                />
                <input
                  type="text"
                  placeholder="Volume (misal: 20 kg/bln)"
                  value={item.volume}
                  onChange={(e) => handleUpdateIndustri(idx, 'volume', e.target.value)}
                  className="rounded border border-stone-300 px-2 py-1 w-full sm:w-36"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveIndustri(idx)}
                  className="text-stone-400 hover:text-rose-600 p-1 self-end sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
