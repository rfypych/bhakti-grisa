'use client';

import React, { useState } from 'react';
import { laporKematianAction } from '@/actions/peristiwaActions';
import { HeartCrack, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

interface LaporKematianModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  onSuccess?: () => void;
}

export function LaporKematianModal({
  isOpen,
  onClose,
  members,
  onSuccess,
}: LaporKematianModalProps) {
  const [anggotaId, setAnggotaId] = useState('');
  const [namaAlmarhum, setNamaAlmarhum] = useState('');
  const [tanggalKematian, setTanggalKematian] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [statusAlmarhum, setStatusAlmarhum] = useState<
    'IBU_HAMIL_MELAHIRKAN_NIFAS' | 'BAYI' | 'BALITA' | 'LAINNYA'
  >('LAINNYA');
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
      setError('Harap pilih data warga almarhum atau almarhumah.');
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

  const selectedMember = members.find((m) => m.id === anggotaId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <HeartCrack className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Lapor Peristiwa Kematian Warga
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Catat peristiwa kematian ke Lampiran 4.18 PKK untuk memperbarui status kependudukan.
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
              <Label htmlFor="anggotaKematianSelect">
                Pilih Warga Almarhum / Almarhumah <span className="text-destructive">*</span>
              </Label>
              <select
                id="anggotaKematianSelect"
                value={anggotaId}
                onChange={(e) => handleMemberChange(e.target.value)}
                required
                className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Pilih Warga Terdaftar --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} (NIK: {m.nik}) : KK {m.keluarga.namaKepalaRumahTangga} (RT {m.keluarga.wilayah?.rt || '-'})
                  </option>
                ))}
              </select>
            </div>

            {selectedMember && (
              <div className="p-3.5 bg-secondary/70 rounded-md border border-border text-xs flex flex-col gap-1 text-muted-foreground">
                <span className="font-bold text-foreground">Almarhum/ah: {selectedMember.nama}</span>
                <span>Kepala RT: {selectedMember.keluarga.namaKepalaRumahTangga}</span>
                <span>Alamat: {selectedMember.keluarga.alamat} (Dasawisma: {selectedMember.keluarga.wilayah?.namaDasawisma || '-'})</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tanggalWafat">
                  Tanggal Wafat <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalWafat"
                  type="date"
                  required
                  value={tanggalKematian}
                  onChange={(e) => setTanggalKematian(e.target.value)}
                  className="min-h-touch text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="statusAlmarhumSelect">
                  Kategori Khusus PKK
                </Label>
                <select
                  id="statusAlmarhumSelect"
                  value={statusAlmarhum}
                  onChange={(e) => setStatusAlmarhum(e.target.value as any)}
                  className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="LAINNYA">Warga Umum / Lansia</option>
                  <option value="IBU_HAMIL_MELAHIRKAN_NIFAS">Ibu Hamil / Melahirkan / Nifas</option>
                  <option value="BAYI">Bayi (&lt; 1 tahun)</option>
                  <option value="BALITA">Balita (1 - 5 tahun)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sebabKematianInput">
                Penyebab Kematian <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sebabKematianInput"
                type="text"
                required
                placeholder="Contoh: Sakit komplikasi, usia lanjut, dll."
                value={sebabKematian}
                onChange={(e) => setSebabKematian(e.target.value)}
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="keteranganKematianInput">
                Keterangan Tambahan (Opsional)
              </Label>
              <textarea
                id="keteranganKematianInput"
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan pelengkap bila ada..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="min-h-touch sm:w-auto w-full"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={loading}
                className="min-h-touch sm:w-auto w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Data Kematian'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
