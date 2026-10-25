'use client';

import React, { useState, useEffect } from 'react';
import { laporKehamilanAction } from '@/actions/peristiwaActions';
import { Activity, Heart, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [tanggalCatat, setTanggalCatat] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [keterangan, setKeterangan] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus, isOpen]);

  if (!isOpen) return null;

  const isNifas = status === 'NIFAS';

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
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat status kehamilan/nifas.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMother = mothers.find((m) => m.id === anggotaId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            {isNifas ? <Heart className="size-5 text-primary" /> : <Activity className="size-5 text-primary" />}
            <span>{isNifas ? 'Lapor Status Nifas / Menyusui' : 'Lapor Peristiwa Kehamilan Warga'}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isNifas
              ? 'Pencatatan ibu dalam masa nifas dan menyusui untuk pemutakhiran indikator kesehatan balita (Lampiran 4.18).'
              : 'Pencatatan ibu hamil untuk pemantauan kesehatan ibu dan janin serta rekapitulasi bumil desa (Lampiran 4.18).'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive text-sm font-medium"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successResult ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="size-12 text-primary animate-bounce" />
            <p className="text-base font-bold text-foreground">{successResult}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ibuStatusSelect">
                Pilih Nama Ibu <span className="text-destructive">*</span>
              </Label>
              <select
                id="ibuStatusSelect"
                value={anggotaId}
                onChange={(e) => setAnggotaId(e.target.value)}
                required
                className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Pilih Ibu Terdaftar di Wilayah --</option>
                {mothers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} (NIK: {m.nik}) : KK {m.keluarga.namaKepalaRumahTangga} (RT {m.keluarga.wilayah?.rt || '-'})
                  </option>
                ))}
              </select>
            </div>

            {selectedMother && (
              <div className="p-3.5 bg-muted/50 rounded-lg border border-border text-xs flex flex-col gap-1 text-muted-foreground">
                <span className="font-semibold text-foreground">Nama: {selectedMother.nama}</span>
                <span>NIK: {selectedMother.nik} &bull; KK: {selectedMother.keluarga.namaKepalaRumahTangga}</span>
                <span>Alamat: {selectedMother.keluarga.alamat} (Dasawisma: {selectedMother.keluarga.wilayah?.namaDasawisma || '-'})</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Jenis Status</Label>
              <div className="grid grid-cols-2 gap-2 min-h-touch items-center">
                <label className="flex items-center gap-2 p-2.5 rounded-md border border-input bg-background cursor-pointer select-none text-sm font-semibold">
                  <input
                    type="radio"
                    name="status_kondisi"
                    checked={status === 'KEHAMILAN'}
                    onChange={() => setStatus('KEHAMILAN')}
                    className="size-4 text-primary focus:ring-ring"
                  />
                  <span>Ibu Hamil</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-md border border-input bg-background cursor-pointer select-none text-sm font-semibold">
                  <input
                    type="radio"
                    name="status_kondisi"
                    checked={status === 'NIFAS'}
                    onChange={() => setStatus('NIFAS')}
                    className="size-4 text-primary focus:ring-ring"
                  />
                  <span>Nifas / Menyusui</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tglCatat">
                Tanggal Pencatatan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tglCatat"
                type="date"
                required
                value={tanggalCatat}
                onChange={(e) => setTanggalCatat(e.target.value)}
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ketStatus">Keterangan Tambahan</Label>
              <Input
                id="ketStatus"
                type="text"
                placeholder={isNifas ? 'Contoh: Masa nifas hari ke-10, ASI eksklusif' : 'Contoh: Usia kandungan trimester 2, HPL November 2026'}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="min-h-touch text-base"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onClose}
                disabled={loading}
                className="min-h-touch"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="default"
                disabled={loading}
                className="min-h-touch font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Laporan {isNifas ? 'Nifas' : 'Kehamilan'}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
