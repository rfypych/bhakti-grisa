'use client';

import React, { useState } from 'react';
import { laporMutasiAction } from '@/actions/peristiwaActions';
import { Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

interface LaporMutasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  onSuccess?: () => void;
}

export function LaporMutasiModal({
  isOpen,
  onClose,
  members,
  onSuccess,
}: LaporMutasiModalProps) {
  const [anggotaId, setAnggotaId] = useState('');
  const [tanggalMutasi, setTanggalMutasi] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [keterangan, setKeterangan] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anggotaId) {
      setError('Harap pilih data warga yang pindah/mutasi.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await laporMutasiAction({
        anggotaId,
        tanggalMutasi: new Date(tanggalMutasi),
        keterangan: keterangan.trim() ? keterangan.trim() : undefined,
      });

      if (res.success) {
        setSuccessResult('Peristiwa mutasi pindah berhasil dicatat pada buku catatan kependudukan.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessResult(null);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat mutasi warga.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.id === anggotaId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Truck className="size-5 text-primary" />
            <span>Lapor Mutasi Pindah Warga</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pencatatan perpindahan domisili warga keluar dari lingkungan Dasawisma / RT binaan.
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
              <Label htmlFor="wargaIdMutasi">
                Pilih Nama Warga <span className="text-destructive">*</span>
              </Label>
              <select
                id="wargaIdMutasi"
                value={anggotaId}
                onChange={(e) => setAnggotaId(e.target.value)}
                required
                className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Pilih Warga yang Pindah --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} (NIK: {m.nik}) : {m.keluarga.namaKepalaRumahTangga} (RT {m.keluarga.wilayah?.rt || '-'})
                  </option>
                ))}
              </select>
            </div>

            {selectedMember && (
              <div className="p-3.5 bg-muted/50 rounded-lg border border-border text-xs flex flex-col gap-1 text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedMember.nama}</span>
                <span>NIK: {selectedMember.nik} &bull; KK: {selectedMember.keluarga.namaKepalaRumahTangga}</span>
                <span>Alamat: {selectedMember.keluarga.alamat} (Dasawisma: {selectedMember.keluarga.wilayah?.namaDasawisma || '-'})</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="tglMutasi">
                Tanggal Mutasi / Pindah <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tglMutasi"
                type="date"
                required
                value={tanggalMutasi}
                onChange={(e) => setTanggalMutasi(e.target.value)}
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ketMutasi">Tujuan Pindah / Keterangan</Label>
              <Input
                id="ketMutasi"
                type="text"
                placeholder="Contoh: Pindah ke Desa Beran / Ikut Suami"
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
                    <span>Menyimpan Mutasi...</span>
                  </>
                ) : (
                  <span>Simpan Laporan Mutasi</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
