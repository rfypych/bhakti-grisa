'use client';

import React, { useState } from 'react';
import { laporKematianAction } from '@/actions/peristiwaActions';
import { HeartCrack, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface MemberOption {
  id: string;
  nama: string;
  nik: string;
  jenisKelamin: string;
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

interface LaporKematianModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  onSuccess?: () => void;
}

export function LaporKematianModal({ isOpen, onClose, members, onSuccess }: LaporKematianModalProps) {
  const [anggotaId, setAnggotaId] = useState('');
  const [namaAlmarhum, setNamaAlmarhum] = useState('');
  const [tanggalKematian, setTanggalKematian] = useState(new Date().toISOString().split('T')[0]);
  const [statusAlmarhum, setStatusAlmarhum] = useState<'IBU_HAMIL_MELAHIRKAN_NIFAS' | 'BAYI' | 'BALITA' | 'LAINNYA'>('LAINNYA');
  const [sebabKematian, setSebabKematian] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMemberChange = (id: string) => {
    setAnggotaId(id);
    const m = members.find((item) => item.id === id);
    if (m) {
      setNamaAlmarhum(m.nama);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anggotaId) {
      setError('Harap pilih data warga almarhum/almarhumah.');
      return;
    }
    if (!sebabKematian.trim()) {
      setError('Harap isi penyebab kematian.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await laporKematianAction({
        anggotaId,
        namaAlmarhum: namaAlmarhum.trim(),
        tanggalKematian: new Date(tanggalKematian),
        sebabKematian: sebabKematian.trim(),
        statusAlmarhum,
        keterangan: keterangan.trim() ? keterangan.trim() : undefined,
      });

      if (res.success) {
        setSuccessResult('Peristiwa kematian berhasil dicatat pada buku catatan kependudukan.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessResult(null);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat data kematian.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-rose-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-700 text-white flex items-center justify-center shadow-sm">
              <HeartCrack className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Lapor Kematian Warga</h2>
              <p className="text-xs text-stone-600">Catat peristiwa kematian ke Lampiran 4.18 PKK</p>
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

          {/* Select Member */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Pilih Warga Almarhum / Almarhumah <span className="text-red-500">*</span>
            </label>
            <select
              value={anggotaId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              required
            >
              <option value="">-- Pilih Warga --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama} (NIK: {m.nik}) — KK: {m.keluarga.namaKepalaRumahTangga} [RT {m.keluarga.wilayah?.rt || '-'}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tanggal Kematian */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Wafat <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalKematian}
                onChange={(e) => setTanggalKematian(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            {/* Kategori Status */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kategori Khusus PKK
              </label>
              <select
                value={statusAlmarhum}
                onChange={(e) => setStatusAlmarhum(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="LAINNYA">Warga Umum / Lansia</option>
                <option value="IBU_HAMIL_MELAHIRKAN_NIFAS">Ibu Hamil / Melahirkan / Nifas</option>
                <option value="BAYI">Bayi (&lt; 1 tahun)</option>
                <option value="BALITA">Balita (1 - 5 tahun)</option>
              </select>
            </div>
          </div>

          {/* Sebab Kematian */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Penyebab Kematian <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sebabKematian}
              onChange={(e) => setSebabKematian(e.target.value)}
              placeholder="Contoh: Sakit komplikasi, usia lanjut, dll."
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan pelengkap bila ada..."
              rows={2}
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Menyimpan...' : 'Simpan Data Kematian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
