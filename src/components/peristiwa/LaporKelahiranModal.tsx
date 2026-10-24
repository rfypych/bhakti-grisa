'use client';

import React, { useState } from 'react';
import { laporKelahiranAction } from '@/actions/peristiwaActions';
import { Baby, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface MotherOption {
  id: string;
  nama: string;
  nik: string;
  keluarga: {
    namaKepalaRumahTangga: string;
    alamat: string;
    wilayah?: {
      namaDasawisma: string;
      rt: string;
      rw: string;
    };
  };
}

interface LaporKelahiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  mothers: MotherOption[];
  onSuccess?: () => void;
}

export function LaporKelahiranModal({ isOpen, onClose, mothers, onSuccess }: LaporKelahiranModalProps) {
  const [ibuId, setIbuId] = useState('');
  const [namaBayi, setNamaBayi] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState(new Date().toISOString().split('T')[0]);
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L');
  const [nik, setNik] = useState('');
  const [akteKelahiran, setAkteKelahiran] = useState(false);
  const [beratBadanKg, setBeratBadanKg] = useState('');
  const [panjangBadanCm, setPanjangBadanCm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibuId) {
      setError('Harap pilih nama ibu.');
      return;
    }
    if (!namaBayi.trim()) {
      setError('Harap isi nama bayi.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await laporKelahiranAction({
        ibuId,
        namaBayi: namaBayi.trim(),
        tanggalLahir: new Date(tanggalLahir),
        jenisKelamin,
        akteKelahiran,
        nik: nik.trim() ? nik.trim() : undefined,
        beratBadanKg: beratBadanKg ? parseFloat(beratBadanKg) : undefined,
        panjangBadanCm: panjangBadanCm ? parseFloat(panjangBadanCm) : undefined,
      });

      if (res.success) {
        setSuccessResult('Data kelahiran berhasil dicatat dan bayi telah ditambahkan ke Kartu Keluarga.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessResult(null);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat data kelahiran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Lapor Kelahiran Bayi</h2>
              <p className="text-xs text-stone-600">Catat kelahiran baru ke Kartu Keluarga & Lampiran 4.18</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successResult && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successResult}</span>
            </div>
          )}

          {/* Select Mother */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Pilih Ibu Kandung <span className="text-red-500">*</span>
            </label>
            <select
              value={ibuId}
              onChange={(e) => setIbuId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            >
              <option value="">-- Pilih Ibu --</option>
              {mothers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama} (NIK: {m.nik}) — KK: {m.keluarga.namaKepalaRumahTangga} [RT {m.keluarga.wilayah?.rt || '-'}]
                </option>
              ))}
            </select>
          </div>

          {/* Baby's Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Lengkap Bayi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={namaBayi}
              onChange={(e) => setNamaBayi(e.target.value)}
              placeholder="Contoh: Muhammad Rizky Al-Fatih"
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="radio"
                    name="jenisKelamin"
                    checked={jenisKelamin === 'L'}
                    onChange={() => setJenisKelamin('L')}
                    className="accent-emerald-600"
                  />
                  Laki-laki
                </label>
                <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="radio"
                    name="jenisKelamin"
                    checked={jenisKelamin === 'P'}
                    onChange={() => setJenisKelamin('P')}
                    className="accent-emerald-600"
                  />
                  Perempuan
                </label>
              </div>
            </div>
          </div>

          {/* NIK Input / Virtual info */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nomor Induk Kependudukan (NIK)
            </label>
            <input
              type="text"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="Kosongkan jika belum terbit dari Dukcapil"
              maxLength={16}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              *Jika belum memiliki NIK resmi, sistem akan otomatis menghasilkan <span className="font-mono text-emerald-700 font-semibold">TEMP-YYYYMMDD-XXXX</span>.
            </p>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Berat Lahir (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={beratBadanKg}
                onChange={(e) => setBeratBadanKg(e.target.value)}
                placeholder="3.2"
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Panjang Lahir (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={panjangBadanCm}
                onChange={(e) => setPanjangBadanCm(e.target.value)}
                placeholder="49"
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Akte Kelahiran Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="akteKelahiran"
              checked={akteKelahiran}
              onChange={(e) => setAkteKelahiran(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
            />
            <label htmlFor="akteKelahiran" className="text-xs text-stone-700 cursor-pointer">
              Sudah memiliki Akte Kelahiran resmi
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Menyimpan...' : 'Simpan Data Kelahiran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
