'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  XCircle,
  MapPin,
  Users,
  Droplets,
  ShieldAlert,
} from 'lucide-react';
import {
  AppRoute,
  KeluargaRecord,
  OfficerAccount,
  UserRole,
  filterFamiliesByRoleScope,
  getRbacPermissions,
} from '@/lib/domain';
import {
  BoardButton,
  BoardSurface,
  BoardCallout,
  BoardModal,
  BoardSegmentedControl,
  BoardStatusLabel,
  BoardEmptyState,
} from '@/components/simpatik';
import {
  approveSubmissionAction,
  rejectSubmissionAction,
} from '@/actions/verifikasiActions';

export interface DashboardVerifikasiProps {
  families: KeluargaRecord[];
  currentUser: OfficerAccount | null;
  currentRole: UserRole;
  onApproveFamily?: (familyId: string) => Promise<void> | void;
  onRejectFamily?: (familyId: string, catatanRevisi: string) => Promise<void> | void;
  onNavigate?: (route: AppRoute) => void;
  initialApproveTarget?: KeluargaRecord | null;
  initialRejectTarget?: KeluargaRecord | null;
}

export function DashboardVerifikasi({
  families: initialFamilies,
  currentUser,
  currentRole,
  onApproveFamily,
  onRejectFamily,
  onNavigate,
  initialApproveTarget = null,
  initialRejectTarget = null,
}: DashboardVerifikasiProps) {
  const router = useRouter();
  const [families, setFamilies] = useState<KeluargaRecord[]>(initialFamilies);
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'VERIFIKASI' | 'DITOLAK'>('DRAFT');
  const [rejectTarget, setRejectTarget] = useState<KeluargaRecord | null>(initialRejectTarget);
  const [approveTarget, setApproveTarget] = useState<KeluargaRecord | null>(initialApproveTarget);
  const [catatanRevisi, setCatatanRevisi] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = onNavigate || ((route: string) => router.push(route));
  const perms = getRbacPermissions(currentRole, currentUser);

  if (!perms.canVerifyDraft) {
    return (
      <BoardCallout
        tone="warning"
        title="Hak Akses Verifikasi Dibatasi"
        description={`Peran Anda (${currentRole}) tidak memiliki wewenang melakukan persetujuan/penolakan berkas DRAFT. Sesuai Matriks Hak Akses SIMPATIK Desa Grudo, verifikasi data warga hanya dapat dilakukan oleh Kader RT setempat atau Admin Desa.`}
        action={
          <BoardButton variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </BoardButton>
        }
      />
    );
  }

  const scopedFamilies = filterFamiliesByRoleScope(families, currentRole, currentUser);
  const draftCount = scopedFamilies.filter((f) => f.status === 'DRAFT').length;
  const verifiedCount = scopedFamilies.filter((f) => f.status === 'VERIFIKASI').length;
  const rejectedCount = scopedFamilies.filter((f) => f.status === 'DITOLAK').length;

  const displayedList = scopedFamilies.filter((f) => f.status === statusFilter);

  const handleConfirmApprove = async (fam: KeluargaRecord) => {
    setIsLoading(true);
    try {
      if (onApproveFamily) {
        await onApproveFamily(fam.id);
      } else {
        const res = await approveSubmissionAction(fam.id);
        if (!res.success) {
          alert(res.error || 'Gagal memverifikasi berkas.');
          setIsLoading(false);
          return;
        }
      }

      setFamilies((prev) =>
        prev.map((f) =>
          f.id === fam.id
            ? { ...f, status: 'VERIFIKASI', catatanRevisi: undefined }
            : f
        )
      );
      setActionMessage(
        `Data keluarga "${fam.namaKepalaKeluarga}" (No. KK: ${fam.noKK}) berhasil disetujui menjadi VERIFIKASI dan langsung masuk ke Rekapitulasi 31 Sheet Buku Dasawisma.`
      );
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan sistem saat menyetujui berkas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    const reason =
      catatanRevisi.trim() ||
      'Data belum sesuai dengan kondisi riil di lapangan. Mohon periksa kembali nomor KK/NIK atau fasilitas sanitasi.';

    setIsLoading(true);
    try {
      if (onRejectFamily) {
        await onRejectFamily(rejectTarget.id, reason);
      } else {
        const res = await rejectSubmissionAction(rejectTarget.id, reason);
        if (!res.success) {
          alert(res.error || 'Gagal menolak berkas.');
          setIsLoading(false);
          return;
        }
      }

      setFamilies((prev) =>
        prev.map((f) =>
          f.id === rejectTarget.id
            ? { ...f, status: 'DITOLAK', catatanRevisi: reason }
            : f
        )
      );
      setActionMessage(
        `Pengajuan keluarga "${rejectTarget.namaKepalaKeluarga}" telah ditolak dengan catatan revisi.`
      );
      setRejectTarget(null);
      setCatatanRevisi('');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan sistem saat menolak berkas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-default border border-separator-border rounded-xl p-5">
        <div>
          <div className="text-xs font-medium text-accent-600 dark:text-accent-400">
            Validasi Lapangan Kader Dasawisma · {perms.scopeLabel}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Antrean Verifikasi Data Keluarga Mandiri
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Periksa kesesuaian data yang dikirim mandiri oleh warga sebelum masuk ke buku rekap
            resmi TP PKK.
          </p>
        </div>

        <BoardSegmentedControl
          ariaLabel="Filter status berkas verifikasi"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'DRAFT', label: 'Antrean Draft', count: draftCount },
            { value: 'VERIFIKASI', label: 'Terverifikasi', count: verifiedCount },
            { value: 'DITOLAK', label: 'Perlu Revisi', count: rejectedCount },
          ]}
        />
      </div>

      {actionMessage && (
        <BoardCallout
          tone="success"
          title="Status Verifikasi Diperbarui"
          description={actionMessage}
          action={
            <BoardButton variant="outline" size="sm" onClick={() => setActionMessage(null)}>
              Tutup
            </BoardButton>
          }
        />
      )}

      {displayedList.length === 0 ? (
        <BoardEmptyState
          title={
            statusFilter === 'DRAFT'
              ? 'Tidak Ada Antrean Draft Menunggu Verifikasi'
              : `Tidak Ada Berkas dengan Status ${statusFilter}`
          }
          description="Seluruh pengajuan mandiri warga pada wilayah penugasan Anda telah selesai diperiksa."
          action={
            <BoardButton variant="outline" size="sm" onClick={() => navigate('/formulir')}>
              + Tambah Data Keluarga Baru
            </BoardButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedList.map((fam) => {
            const living = fam.anggota.filter((a) => a.statusHidup === 'HIDUP');
            return (
              <BoardSurface key={fam.id} padding="md" className="space-y-4">
                {/* VerificationCard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-separator-border pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted font-mono tabular-nums">
                      <span>No. KK: {fam.noKK}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Dasawisma {fam.namaDasawisma} (RT {fam.rt}/RW {fam.rw}, Dusun {fam.dusun})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Tgl Pengajuan: {fam.tanggalInput}</span>
                    </div>
                    <h2 className="text-lg font-bold text-text-primary mt-1">
                      KK: {fam.namaKepalaKeluarga}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <BoardStatusLabel
                      tone={
                        fam.status === 'VERIFIKASI'
                          ? 'nominal'
                          : fam.status === 'DRAFT'
                          ? 'warning'
                          : 'danger'
                      }
                      label={`Status: ${fam.status}`}
                    />
                  </div>
                </div>

                {/* Summary Grid: Lokasi, Sanitasi, Anggota */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-surface-subtle border border-separator-border space-y-1.5">
                    <div className="font-semibold text-text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent-600" />
                      <span>Alamat &amp; Titik Koordinat Rumah</span>
                    </div>
                    <p className="text-text-secondary">{fam.alamat}</p>
                    <p className="font-mono tabular-nums text-text-muted">
                      GPS: {fam.latitude}, {fam.longitude}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-subtle border border-separator-border space-y-1.5">
                    <div className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-accent-600" />
                      <span>Kondisi Sanitasi &amp; Air Bersih</span>
                    </div>
                    <p className="text-text-secondary">
                      Kriteria: <strong>{fam.sanitasi.kriteriaRumah}</strong> · Air:{' '}
                      <strong>{fam.sanitasi.sumberAir}</strong>
                    </p>
                    <p className="text-text-muted">
                      Jamban: {fam.sanitasi.punyaJamban ? `Ya (${fam.sanitasi.jumlahJamban})` : 'Tidak'}{' '}
                      · SPAL: {fam.sanitasi.punyaSpal ? 'Ada' : 'Tidak'} · P4K:{' '}
                      {fam.sanitasi.tempelStikerP4k ? 'Terpasang' : 'Belum'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-subtle border border-separator-border space-y-1.5">
                    <div className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-accent-600" />
                      <span>Ringkasan Jiwa ({living.length} Anggota)</span>
                    </div>
                    <ul className="space-y-1 text-text-secondary">
                      {living.map((m) => (
                        <li key={m.id} className="truncate">
                          • <strong>{m.nama}</strong> ({m.hubungan}, {m.umur} th)
                          {m.isVirtualNik ? ' [Virtual NIK]' : ''}
                          {m.isIbuHamil ? ' [Ibu Hamil]' : ''}
                          {m.isBalita ? ' [Balita]' : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {fam.catatanRevisi && (
                  <div className="p-3 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Catatan Revisi Penolakan:</strong> {fam.catatanRevisi}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-separator-border">
                  <div className="text-xs text-text-muted">
                    Sumber Input: <strong>{fam.diinputOleh}</strong>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {fam.status !== 'DITOLAK' && (
                      <BoardButton
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        icon={<XCircle className="w-3.5 h-3.5 text-red-600" />}
                        onClick={() => {
                          setRejectTarget(fam);
                          setCatatanRevisi('');
                        }}
                      >
                        Tolak / Minta Revisi
                      </BoardButton>
                    )}

                    {fam.status !== 'VERIFIKASI' && (
                      <BoardButton
                        variant="primary"
                        size="sm"
                        disabled={isLoading}
                        icon={<Check className="w-3.5 h-3.5" />}
                        onClick={() => setApproveTarget(fam)}
                      >
                        Setujui &amp; Masukkan ke Buku Dasawisma
                      </BoardButton>
                    )}
                  </div>
                </div>
              </BoardSurface>
            );
          })}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <BoardModal
        isOpen={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Konfirmasi Persetujuan Berkas Keluarga"
        subtitle="Pastikan data fisik dan kondisi sanitasi telah diverifikasi secara faktual oleh Kader Dasawisma."
      >
        {approveTarget && (
          <div className="space-y-4 text-xs">
            <p className="text-text-secondary leading-relaxed">
              Apakah Anda yakin ingin menyetujui berkas pendataan keluarga ini? Setelah disetujui, data akan berstatus <strong className="text-emerald-600 dark:text-emerald-400">VERIFIKASI</strong> dan langsung diintegrasikan ke dalam rekapitulasi 31 Sheet Buku Dasawisma TP PKK Desa Grudo.
            </p>

            <div className="p-3.5 rounded-2lg bg-surface-subtle border border-separator-border space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Kepala Keluarga:</span>
                <span className="font-semibold text-text-primary">{approveTarget.namaKepalaKeluarga}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Nomor KK:</span>
                <span className="font-mono text-text-primary">{approveTarget.noKK}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Dasawisma / Wilayah:</span>
                <span className="font-medium text-text-primary">{approveTarget.namaDasawisma} (RT {approveTarget.rt}/RW {approveTarget.rw} &middot; Dusun {approveTarget.dusun})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Jumlah Anggota Jiwa:</span>
                <span className="font-semibold text-text-primary">{approveTarget.anggota.filter((a) => a.statusHidup === 'HIDUP').length} Jiwa</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-separator-border">
              <BoardButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setApproveTarget(null)}
                disabled={isLoading}
              >
                Batal
              </BoardButton>
              <BoardButton
                type="button"
                variant="primary"
                size="sm"
                disabled={isLoading}
                icon={<Check className="w-3.5 h-3.5" />}
                onClick={async () => {
                  const target = approveTarget;
                  setApproveTarget(null);
                  if (target) {
                    await handleConfirmApprove(target);
                  }
                }}
              >
                {isLoading ? 'Memproses...' : 'Ya, Setujui Berkas'}
              </BoardButton>
            </div>
          </div>
        )}
      </BoardModal>

      {/* Reject Revision Modal */}
      <BoardModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={`Tolak / Minta Revisi Berkas: ${rejectTarget?.namaKepalaKeluarga || ''}`}
        subtitle="Masukkan alasan ketidaksesuaian lapangan agar warga atau kader dapat memperbaiki isian."
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div>
            <label
              htmlFor="input-catatan-revisi"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Catatan Perbaikan / Alasan Revisi Lapangan
            </label>
            <textarea
              id="input-catatan-revisi"
              rows={4}
              required
              value={catatanRevisi}
              onChange={(e) => setCatatanRevisi(e.target.value)}
              placeholder="Contoh: Nomor KK kurang sesuai dengan fisik kartu keluarga atau status kepemilikan SPAL perlu diperbaiki..."
              className="w-full p-3 text-xs sm:text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <BoardButton variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Batal
            </BoardButton>
            <BoardButton type="submit" variant="danger" size="sm" disabled={isLoading}>
              Konfirmasi Penolakan Berkas
            </BoardButton>
          </div>
        </form>
      </BoardModal>
    </div>
  );
}
