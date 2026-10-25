'use client';

import React, { useState } from 'react';
import { laporKelahiranAction } from '@/actions/peristiwaActions';
import { Baby, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

interface LaporKelahiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  mothers: MotherOption[];
  onSuccess?: () => void;
}

export function LaporKelahiranModal({
  isOpen,
  onClose,
  mothers,
  onSuccess,
}: LaporKelahiranModalProps) {
  const [ibuId, setIbuId] = useState('');
  const [namaBayi, setNamaBayi] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState(
    new Date().toISOString().split('T')[0]
  );
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
      setError('Harap pilih nama ibu kandung.');
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

  const selectedMother = mothers.find((m) => m.id === ibuId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Baby className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Lapor Peristiwa Kelahiran Bayi
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Pencatatan kelahiran baru yang otomatis memasukkan bayi ke Kartu Keluarga (Lampiran 4.18).
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
              <Label htmlFor="ibuIdSelect">
                Pilih Nama Ibu Kandung <span className="text-destructive">*</span>
              </Label>
              <select
                id="ibuIdSelect"
                value={ibuId}
                onChange={(e) => setIbuId(e.target.value)}
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
              <div className="p-3.5 bg-secondary/70 rounded-md border border-border text-xs flex flex-col gap-1 text-muted-foreground">
                <span className="font-bold text-foreground">Ibu: {selectedMother.nama}</span>
                <span>Kepala RT: {selectedMother.keluarga.namaKepalaRumahTangga}</span>
                <span>Alamat: {selectedMother.keluarga.alamat} (Dasawisma: {selectedMother.keluarga.wilayah?.namaDasawisma || '-'})</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="namaBayiInput">
                Nama Lengkap Bayi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="namaBayiInput"
                type="text"
                required
                placeholder="Nama bayi yang baru lahir"
                value={namaBayi}
                onChange={(e) => setNamaBayi(e.target.value)}
                className="min-h-touch text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tglLahirBayi">
                  Tanggal Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tglLahirBayi"
                  type="date"
                  required
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="min-h-touch text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>
                  Jenis Kelamin Bayi <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 min-h-touch items-center">
                  <label className="flex items-center gap-2 p-2 rounded-md border border-input bg-background cursor-pointer select-none text-sm font-semibold">
                    <input
                      type="radio"
                      name="jk_bayi"
                      checked={jenisKelamin === 'L'}
                      onChange={() => setJenisKelamin('L')}
                      className="size-4 text-primary focus:ring-ring"
                    />
                    <span>Laki-Laki</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-md border border-input bg-background cursor-pointer select-none text-sm font-semibold">
                    <input
                      type="radio"
                      name="jk_bayi"
                      checked={jenisKelamin === 'P'}
                      onChange={() => setJenisKelamin('P')}
                      className="size-4 text-primary focus:ring-ring"
                    />
                    <span>Perempuan</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nikBayiInput">
                NIK Bayi (Opsional, kosongkan jika belum ada)
              </Label>
              <Input
                id="nikBayiInput"
                type="text"
                placeholder="16 digit NIK atau kosongkan untuk NIK virtual otomatis"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                maxLength={16}
                className="min-h-touch text-base font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bbInput">Berat Badan Lahir (kg)</Label>
                <Input
                  id="bbInput"
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 3.2"
                  value={beratBadanKg}
                  onChange={(e) => setBeratBadanKg(e.target.value)}
                  className="min-h-touch text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pbInput">Panjang Badan Lahir (cm)</Label>
                <Input
                  id="pbInput"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 49.5"
                  value={panjangBadanCm}
                  onChange={(e) => setPanjangBadanCm(e.target.value)}
                  className="min-h-touch text-base"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-md border border-border bg-card">
              <label className="flex items-center justify-between min-h-touch cursor-pointer select-none">
                <span className="text-sm font-bold text-foreground">Sudah Memiliki Akte Kelahiran</span>
                <input
                  type="checkbox"
                  checked={akteKelahiran}
                  onChange={(e) => setAkteKelahiran(e.target.checked)}
                  className="size-5 rounded border-input text-primary focus:ring-ring"
                />
              </label>
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
                    <span>Menyimpan Kelahiran...</span>
                  </>
                ) : (
                  <span>Simpan Laporan Kelahiran</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
