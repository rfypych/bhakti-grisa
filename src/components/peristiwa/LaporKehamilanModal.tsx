'use client';

import React, { useState, useEffect } from 'react';
import { laporKehamilanAction } from '@/actions/peristiwaActions';
import { Activity, Heart, X, CheckCircle2, AlertCircle } from 'lucide-react';

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

interface LaporKehamilanModalProps {
  isOpen: boolean;
  onClose: () => void;
  mothers: MotherOption[];
  defaultStatus?: 'KEHAMILAN' | 'NIFAS';
  onSuccess?: () => void;
}

export function LaporKehamilanModal({
  isOpen,
  onClose,
  mothers,
  defaultStatus = 'KEHAMILAN',
  onSuccess,
}: LaporKehamilanModalProps) {
  const [anggotaId, setAnggotaId] = useState('');
  const [status, setStatus] = useState<'KEHAMILAN' | 'NIFAS'>(defaultStatus);
  const [tanggalCatat, setTanggalCatat] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus, isOpen]);

  if (!isOpen) return null;

  const isNifas = status === 'NIFAS';
  const themeBg = isNifas ? 'bg-teal-50' : 'bg-amber-50';
  const themeBtn = isNifas ? 'bg-teal-700 hover:bg-teal-800' : 'bg-amber-600 hover:bg-amber-700';
  const themeIconBg = isNifas ? 'bg-teal-600' : 'bg-amber-600';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anggotaId) {
      setError('Harap pilih nama ibu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await laporKehamilanAction({
        anggotaId,
        tanggalCatat: new Date(tanggalCatat),
        status,
        keterangan: keterangan.trim() ? keterangan.trim() : undefined,
      });

      if (res.success) {
        setSuccessResult(
          isNifas
            ? 'Status masa nifas/menyusui berhasil dicatat pada buku catatan kependudukan.'
            : 'Peristiwa kehamilan aktif berhasil dicatat pada buku catatan kependudukan.'
        );
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessResult(null);
          setAnggotaId('');
          setKeterangan('');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat status kehamilan/nifas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden transition-all my-8">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-stone-100 ${themeBg}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${themeIconBg} text-white flex items-center justify-center shadow-sm`}>
              {isNifas ? <Heart className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {isNifas ? 'Lapor Nifas / Menyusui' : 'Lapor Kehamilan'}
              </h2>
              <p className="text-xs text-stone-600">
                {isNifas
                  ? 'Catat masa nifas dan pemberian ASI (Lampiran 4.18 & Rekap Bumil)'
                  : 'Catat kehamilan ibu warga pada Dasawisma (Lampiran 4.18 & Rekap Bumil)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successResult}</span>
            </div>
          )}

          {/* Status Selection Switch */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Kategori Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('KEHAMILAN')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                  status === 'KEHAMILAN'
                    ? 'bg-amber-50 border-amber-500 text-amber-900'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Kehamilan
              </button>
              <button
                type="button"
                onClick={() => setStatus('NIFAS')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                  status === 'NIFAS'
                    ? 'bg-teal-50 border-teal-500 text-teal-900'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Nifas / Menyusui
              </button>
            </div>
          </div>

          {/* Select Ibu */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Ibu Warga <span className="text-red-500">*</span>
            </label>
            <select
              value={anggotaId}
              onChange={(e) => setAnggotaId(e.target.value)}
              required
              className="w-full text-xs px-3 py-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="">-- Pilih Ibu Warga Terverifikasi --</option>
              {mothers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama} (NIK: {m.nik}) &bull; KRT: {m.keluarga?.namaKepalaRumahTangga} (RT {m.keluarga?.wilayah?.rt || '-'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              Hanya menampilkan anggota perempuan hidup dari keluarga berstatus VERIFIKASI.
            </p>
          </div>

          {/* Tanggal Pencatatan / HPHT */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isNifas ? 'Tanggal Mulai Nifas / Pencatatan' : 'Tanggal Mulai Kehamilan / HPHT / Pencatatan'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalCatat}
              onChange={(e) => setTanggalCatat(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>

          {/* Keterangan / Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Catatan / Keterangan Medis
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder={
                isNifas
                  ? 'Contoh: ASI eksklusif lancar, nifas hari ke-14, rujukan bidan desa'
                  : 'Contoh: Trimester 1, HPHT 15 Januari 2026, kehamilan kedua'
              }
              className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-normal resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs font-semibold text-white ${themeBtn} rounded-xl shadow-sm transition-colors flex items-center gap-1.5`}
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <span>{isNifas ? 'Simpan Data Nifas' : 'Simpan Data Kehamilan'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
