'use client';

import React, { useState } from 'react';
import { approveSubmissionAction, rejectSubmissionAction } from '@/actions/verifikasiActions';
import { Check, X, Users, Home, Droplets, AlertTriangle, Loader2 } from 'lucide-react';

interface VerificationCardProps {
  submission: any;
  onActionComplete?: () => void;
}

export function VerificationCard({ submission, onActionComplete }: VerificationCardProps) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirm(`Setujui data keluarga ${submission.namaKepalaRumahTangga}?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await approveSubmissionAction(submission.id);
      if (res.success) {
        onActionComplete?.();
      } else {
        setError(res.error || 'Gagal menyetujui pengajuan.');
      }
    } catch (e: any) {
      setError(e.message || 'Kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await rejectSubmissionAction(submission.id, rejectReason);
      if (res.success) {
        setRejecting(false);
        onActionComplete?.();
      } else {
        setError(res.error || 'Gagal menolak pengajuan.');
      }
    } catch (e: any) {
      setError(e.message || 'Kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
          {error}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
              Menunggu Verifikasi
            </span>
            <span className="text-xs text-stone-500 font-mono">
              KK: {submission.noKk}
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 mt-1">
            {submission.namaKepalaRumahTangga}
          </h3>
          <p className="text-xs text-stone-500">
            {submission.alamat} &bull; Dasawisma {submission.wilayah?.namaDasawisma || '-'} (RT {submission.wilayah?.rt || '-'} / RW {submission.wilayah?.rw || '-'})
          </p>
        </div>

        {/* Action Buttons */}
        {!rejecting ? (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => setRejecting(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Tolak
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Setujui & Verifikasi
            </button>
          </div>
        ) : (
          <div className="w-full sm:w-auto p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-2 text-xs">
            <p className="font-semibold text-rose-900">Alasan Penolakan Data:</p>
            <input
              type="text"
              placeholder="Contoh: No KK tidak cocok / salah Dasawisma"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded border border-rose-300 px-2 py-1 text-xs focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 rounded"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleReject}
                className="px-3 py-1 bg-rose-700 text-white font-semibold rounded hover:bg-rose-800"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roster & Snapshot Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 space-y-1 text-stone-700">
          <p className="font-semibold text-stone-900 flex items-center gap-1 mb-1">
            <Home className="w-3.5 h-3.5 text-emerald-700" /> Sanitasi & PHBS
          </p>
          <p><span className="text-stone-500">Kriteria Rumah:</span> {submission.kriteriaRumah}</p>
          <p><span className="text-stone-500">Jamban:</span> {submission.jambanKeluarga ? `Ada (${submission.jumlahJamban} buah)` : 'Tidak Ada'}</p>
          <p><span className="text-stone-500">Sumber Air:</span> {submission.sumberAir}</p>
          <p><span className="text-stone-500">Sampah / SPAL:</span> {submission.tempatSampah ? 'Ada' : 'Tidak'} / {submission.spal ? 'Ada' : 'Tidak'}</p>
        </div>

        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 space-y-1 text-stone-700">
          <p className="font-semibold text-stone-900 flex items-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-emerald-700" /> Anggota Keluarga ({submission.anggota?.length || 0} Jiwa)
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {submission.anggota?.map((m: any, i: number) => (
              <p key={i} className="truncate">
                {i + 1}. <span className="font-medium text-stone-900">{m.nama}</span> ({m.hubunganKeluarga}) - {m.nik}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
