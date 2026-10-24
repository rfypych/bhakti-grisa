'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface WilayahOption {
  id: string;
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
}

interface Step1Props {
  formData: any;
  updateField: (key: string, val: any) => void;
  wilayahList?: WilayahOption[];
}

export function Step1WilayahRumah({ formData, updateField, wilayahList = [] }: Step1Props) {
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateField('latitude', pos.coords.latitude);
          updateField('longitude', pos.coords.longitude);
        },
        (err) => {
          alert('Tidak dapat mendeteksi lokasi GPS: ' + err.message);
        }
      );
    } else {
      alert('Fitur Geolocation tidak didukung di perangkat ini.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-950">Langkah 1: Wilayah & Lokasi Rumah</h2>
        <p className="text-sm text-stone-600 mt-1">
          Tentukan Dasawisma binaan, identitas kepala rumah tangga, dan koordinat tempat tinggal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-800 mb-1">
            Kelompok Dasawisma / Wilayah <span className="text-rose-600">*</span>
          </label>
          <select
            value={formData.wilayahId || ''}
            onChange={(e) => updateField('wilayahId', e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="">-- Pilih Kelompok Dasawisma --</option>
            {wilayahList.map((w) => (
              <option key={w.id} value={w.id}>
                {w.namaDasawisma} (RT {w.rt} / RW {w.rw} - Dusun {w.dusun})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-800 mb-1">
            Nomor Kartu Keluarga (No. KK) <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            maxLength={16}
            placeholder="16 digit nomor KK"
            value={formData.noKk || ''}
            onChange={(e) => updateField('noKk', e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          {formData.noKk && formData.noKk.length !== 16 && (
            <span className="text-xs text-amber-600 mt-1 block">
              Panjang No. KK saat ini {formData.noKk.length} digit (standar Dukcapil 16 digit).
            </span>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-stone-800 mb-1">
            Nama Kepala Rumah Tangga (KRT) <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            placeholder="Nama lengkap kepala rumah tangga"
            value={formData.namaKepalaRumahTangga || ''}
            onChange={(e) => updateField('namaKepalaRumahTangga', e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-stone-800 mb-1">
            Alamat Lengkap Rumah
          </label>
          <textarea
            rows={2}
            placeholder="Nama jalan, nomor rumah, RT/RW, gang atau patokan lingkungan"
            value={formData.alamat || ''}
            onChange={(e) => updateField('alamat', e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="md:col-span-2 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-700" />
            <div>
              <p className="text-sm font-medium text-stone-900">Titik Koordinat Spasial Rumah</p>
              <p className="text-xs text-stone-600">
                {formData.latitude && formData.longitude
                  ? `Lat: ${formData.latitude.toFixed(6)}, Long: ${formData.longitude.toFixed(6)}`
                  : 'Belum terdeteksi (Gunakan tombol GPS saat berada di depan rumah warga)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGetLocation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            Ambil Lokasi GPS Saat Ini
          </button>
        </div>
      </div>
    </div>
  );
}
