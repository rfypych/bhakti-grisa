'use client';

import React, { useState } from 'react';
import { approveSubmissionAction, rejectSubmissionAction } from '@/actions/verifikasiActions';
import { Check, X, Users, Home, Droplets, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VerificationCardProps {
  submission: any;
  onActionComplete?: () => void;
}

export function VerificationCard({ submission, onActionComplete }: VerificationCardProps) {
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
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
      setError(e.message || 'Terjadi gangguan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await rejectSubmissionAction(submission.id, rejectReason.trim());
      if (res.success) {
        setRejectDialogOpen(false);
        setRejectReason('');
        onActionComplete?.();
      } else {
        setError(res.error || 'Gagal menolak pengajuan.');
      }
    } catch (e: any) {
      setError(e.message || 'Terjadi gangguan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      {error && (
        <div
          role="alert"
          className="m-4 p-3.5 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2.5 text-destructive text-sm font-medium"
        >
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Info */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">
              <Clock className="size-3" />
              <span>Menunggu Verifikasi</span>
            </Badge>
            <span className="text-xs font-mono font-medium text-muted-foreground">
              No. KK: {submission.noKk}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {submission.namaKepalaRumahTangga}
          </h3>

          <p className="text-sm text-muted-foreground">
            {submission.alamat} &bull; Dasawisma {submission.wilayah?.namaDasawisma || '-'} (RT {submission.wilayah?.rt || '-'} / RW {submission.wilayah?.rw || '-'})
          </p>
        </div>

        {/* Action Buttons using shadcn AlertDialogs */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          {/* Tolak Dialog */}
          <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={loading}
                className="flex-1 sm:flex-initial min-h-touch text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
              >
                <X className="size-4" data-icon="inline-start" />
                <span>Tolak</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tolak Pengajuan Data Keluarga</AlertDialogTitle>
                <AlertDialogDescription>
                  Pengajuan data keluarga ini akan ditolak dan dikembalikan ke warga dengan catatan alasan penolakan tanpa masuk ke buku rekapitulasi desa.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex flex-col gap-2 py-2">
                <Label htmlFor="alasanPenolakan">Alasan Penolakan Data</Label>
                <Input
                  id="alasanPenolakan"
                  type="text"
                  placeholder="Contoh: Nomor KK tidak cocok dengan domisili RT"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-touch text-base"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  size="default"
                  disabled={!rejectReason.trim() || loading}
                  onClick={handleReject}
                  className="min-h-touch"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Tolak Pengajuan</span>
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Setujui Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="default"
                disabled={loading}
                className="flex-1 sm:flex-initial min-h-touch text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4" data-icon="inline-start" />
                    <span>Setujui Data</span>
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Setujui Data Keluarga</AlertDialogTitle>
                <AlertDialogDescription>
                  Data keluarga {submission.namaKepalaRumahTangga} akan disetujui, berstatus terverifikasi, dan langsung masuk ke buku rekapitulasi resmi desa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove} className="min-h-touch">
                  Setujui Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      {/* Roster & Details */}
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
        <div className="p-4 rounded-lg border border-border bg-muted/40 flex flex-col gap-1.5 text-sm">
          <p className="font-semibold text-foreground flex items-center gap-2 mb-1">
            <Home className="size-4 text-primary" />
            <span>Sanitasi &amp; Lingkungan Rumah</span>
          </p>
          <div className="flex justify-between border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground">Kriteria:</span>
            <span className="font-medium text-foreground">{submission.kriteriaRumah || 'SEHAT'}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground">Jamban Keluarga:</span>
            <span className="text-foreground">{submission.jambanKeluarga ? `Ada (${submission.jumlahJamban} buah)` : 'Tidak Ada'}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground">Sumber Air Minum:</span>
            <span className="text-foreground">{submission.sumberAir}</span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span className="text-muted-foreground">Sampah / SPAL:</span>
            <span className="text-foreground">
              {submission.tempatSampah ? 'Ada' : 'Tidak'} / {submission.spal ? 'Ada' : 'Tidak'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-muted/40 flex flex-col gap-1.5 text-sm">
          <p className="font-semibold text-foreground flex items-center gap-2 mb-1">
            <Users className="size-4 text-primary" />
            <span>Anggota Keluarga ({submission.anggota?.length || 0} Jiwa)</span>
          </p>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {submission.anggota?.map((m: any, i: number) => (
              <div key={i} className="text-xs flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                <span className="font-medium text-foreground">
                  {i + 1}. {m.nama}
                </span>
                <span className="text-muted-foreground font-mono">
                  {m.hubunganKeluarga}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
