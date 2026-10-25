'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPenggunaAction,
  toggleStatusPenggunaAction,
  resetPasswordAction,
  CreatePenggunaInput,
} from '@/actions/penggunaActions';
import { PeranPengguna } from '@prisma/client';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  ShieldCheck,
  Power,
  AlertCircle,
  CheckCircle2,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PenggunaItem {
  id: string;
  nama: string;
  username: string;
  peran: PeranPengguna;
  wilayahId: string | null;
  aktif: boolean;
  createdAt: Date;
  wilayah?: {
    dusun: string;
    rw: string;
    rt: string;
    namaDasawisma: string;
  } | null;
}

export interface WilayahOption {
  id: string;
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
}

interface PenggunaManagerProps {
  initialUsers: PenggunaItem[];
  wilayahList: WilayahOption[];
}

export function PenggunaManager({ initialUsers, wilayahList }: PenggunaManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterPeran, setFilterPeran] = useState<string>('');

  // Add User Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePenggunaInput>({
    nama: '',
    username: '',
    kataSandi: '',
    peran: 'KADER_RT',
    wilayahId: wilayahList[0]?.id || null,
  });

  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetTarget, setResetTarget] = useState<PenggunaItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Action feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredUsers = initialUsers.filter((u) => {
    const matchSearch =
      search === '' ||
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.wilayah &&
        (u.wilayah.namaDasawisma.toLowerCase().includes(search.toLowerCase()) ||
          u.wilayah.dusun.toLowerCase().includes(search.toLowerCase())));

    const matchPeran = filterPeran === '' || u.peran === filterPeran;

    return matchSearch && matchPeran;
  });

  const handleOpenAdd = () => {
    setFormData({
      nama: '',
      username: '',
      kataSandi: '',
      peran: 'KADER_RT',
      wilayahId: wilayahList[0]?.id || null,
    });
    setAddError(null);
    setAddSuccess(null);
    setAddModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      const res = await createPenggunaAction(formData);
      if (!res.success) {
        setAddError(res.error || 'Gagal membuat akun.');
        return;
      }

      setAddSuccess('Akun pengelola berhasil dibuat.');
      router.refresh();
      setTimeout(() => {
        setAddSuccess(null);
        setAddModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setAddError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (user: PenggunaItem) => {
    setActionNotice(null);
    try {
      const res = await toggleStatusPenggunaAction(user.id);
      if (!res.success) {
        setActionNotice(res.error || 'Gagal mengubah status.');
        return;
      }
      router.refresh();
    } catch (err: any) {
      setActionNotice(err?.message || 'Gagal mengubah status.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    setResetError(null);
    setResetLoading(true);

    try {
      const res = await resetPasswordAction(resetTarget.id, newPassword);
      if (!res.success) {
        setResetError(res.error || 'Gagal mengatur ulang kata sandi.');
        return;
      }

      setResetSuccess(`Kata sandi untuk ${resetTarget.username} berhasil diatur ulang.`);
      setTimeout(() => {
        setResetSuccess(null);
        setResetTarget(null);
        setNewPassword('');
      }, 1200);
    } catch (err: any) {
      setResetError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setResetLoading(false);
    }
  };

  const ROLE_LABELS: Record<PeranPengguna, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    ADMIN_DESA: {
      label: 'Admin Desa',
      variant: 'default',
    },
    PENGURUS_DUSUN: {
      label: 'Pengurus Dusun',
      variant: 'secondary',
    },
    PENGURUS_RW: {
      label: 'Pengurus RW',
      variant: 'secondary',
    },
    KADER_RT: {
      label: 'Kader RT',
      variant: 'outline',
    },
  };

  return (
    <div className="space-y-4">
      {actionNotice && (
        <div
          role="alert"
          className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm font-medium flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-destructive font-bold text-lg leading-none p-1"
            aria-label="Tutup notifikasi"
          >
            &times;
          </button>
        </div>
      )}

      {/* Control Bar: Filters + Add Button */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, username, wilayah..."
                className="pl-9 min-h-touch text-sm"
              />
            </div>

            <select
              value={filterPeran}
              onChange={(e) => setFilterPeran(e.target.value)}
              className="flex min-h-touch rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
            >
              <option value="">Semua Peran</option>
              <option value="ADMIN_DESA">Admin Desa</option>
              <option value="PENGURUS_DUSUN">Pengurus Dusun</option>
              <option value="PENGURUS_RW">Pengurus RW</option>
              <option value="KADER_RT">Kader RT</option>
            </select>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="min-h-touch gap-2 font-semibold shrink-0"
          >
            <UserPlus className="size-4" data-icon="inline-start" />
            <span>Tambah Pengguna Baru</span>
          </Button>
        </div>
      </Card>

      {/* Pengguna Table */}
      <Card>
        <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Daftar Akun Pengelola ({filteredUsers.length} Pengguna)
          </CardTitle>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Hanya Admin Desa yang dapat mengelola hak akses akun
          </span>
        </CardHeader>

        {filteredUsers.length === 0 ? (
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Tidak ada akun pengguna yang sesuai dengan filter.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Nama &amp; Username</TableHead>
                  <TableHead className="whitespace-nowrap">Peran Akses</TableHead>
                  <TableHead className="whitespace-nowrap">Cakupan Wilayah</TableHead>
                  <TableHead className="whitespace-nowrap">Status Akun</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.peran] || {
                    label: u.peran,
                    variant: 'secondary' as const,
                  };

                  let cakupanLabel = 'Seluruh Desa';
                  if (u.peran === 'KADER_RT') {
                    cakupanLabel = u.wilayah
                      ? `RT ${u.wilayah.rt} / RW ${u.wilayah.rw} (${u.wilayah.namaDasawisma})`
                      : 'Belum Terikat';
                  } else if (u.peran === 'PENGURUS_RW') {
                    cakupanLabel = u.wilayah
                      ? `Seluruh RW ${u.wilayah.rw} (${u.wilayah.dusun})`
                      : 'Belum Terikat';
                  } else if (u.peran === 'PENGURUS_DUSUN') {
                    cakupanLabel = u.wilayah
                      ? `Seluruh ${u.wilayah.dusun}`
                      : 'Belum Terikat';
                  }

                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-bold text-foreground">{u.nama}</div>
                        <div className="text-xs text-muted-foreground font-mono">@{u.username}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={roleMeta.variant} className="font-semibold">
                          {roleMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {cakupanLabel}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={u.aktif ? 'default' : 'destructive'}
                          className="gap-1 font-semibold"
                        >
                          {u.aktif ? (
                            <>
                              <ShieldCheck className="size-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <Power className="size-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword('');
                              setResetError(null);
                              setResetSuccess(null);
                            }}
                            className="min-h-touch text-xs gap-1.5"
                            title="Atur Ulang Kata Sandi"
                          >
                            <KeyRound className="size-3.5 text-muted-foreground" data-icon="inline-start" />
                            <span>Reset Sandi</span>
                          </Button>

                          <Button
                            variant={u.aktif ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            className={`min-h-touch text-xs gap-1.5 font-semibold ${
                              u.aktif
                                ? 'text-amber-800 border-amber-600/40 hover:bg-amber-50'
                                : ''
                            }`}
                            title={u.aktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power className="size-3.5" data-icon="inline-start" />
                            <span>{u.aktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Dialog Add Pengguna */}
      <Dialog open={addModalOpen} onOpenChange={(open) => !open && setAddModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UserPlus className="size-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Tambah Akun Pengelola
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Akun resmi dibuat oleh Admin Desa untuk petugas atau kader PKK.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 py-2">
            {addError && (
              <div
                role="alert"
                className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive text-sm font-medium"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-md flex items-center gap-2 text-primary text-sm font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{addSuccess}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="penggunaNamaInput">
                Nama Lengkap Pengguna <span className="text-destructive">*</span>
              </Label>
              <Input
                id="penggunaNamaInput"
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Siti Rahayu"
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="penggunaUsernameInput">
                Nama Pengguna (Username) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="penggunaUsernameInput"
                type="text"
                required
                autoCapitalize="none"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Contoh: siti_kader_rt01"
                className="min-h-touch text-base font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="penggunaPasswordInput">
                Kata Sandi Awal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="penggunaPasswordInput"
                type="password"
                required
                value={formData.kataSandi}
                onChange={(e) => setFormData({ ...formData, kataSandi: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="penggunaPeranSelect">
                Peran Akses <span className="text-destructive">*</span>
              </Label>
              <select
                id="penggunaPeranSelect"
                value={formData.peran}
                onChange={(e) => {
                  const nextPeran = e.target.value as PeranPengguna;
                  setFormData({
                    ...formData,
                    peran: nextPeran,
                    wilayahId: nextPeran === 'ADMIN_DESA' ? null : formData.wilayahId || wilayahList[0]?.id || null,
                  });
                }}
                className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              >
                <option value="KADER_RT">Kader RT (Dasawisma Tertentu)</option>
                <option value="PENGURUS_RW">Pengurus RW (Cakupan 1 RW)</option>
                <option value="PENGURUS_DUSUN">Pengurus Dusun (Cakupan 1 Dusun)</option>
                <option value="ADMIN_DESA">Admin Desa (Akses Seluruh Desa &amp; Kelola Akun)</option>
              </select>
            </div>

            {formData.peran !== 'ADMIN_DESA' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="penggunaWilayahSelect">
                  Wilayah Jangkar Cakupan <span className="text-destructive">*</span>
                </Label>
                <select
                  id="penggunaWilayahSelect"
                  value={formData.wilayahId || ''}
                  onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value })}
                  required
                  className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
                >
                  <option value="">-- Pilih Wilayah Jangkar --</option>
                  {wilayahList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.dusun} : RW {w.rw} : RT {w.rt} ({w.namaDasawisma})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {formData.peran === 'KADER_RT'
                    ? 'Kader hanya akan mengelola Dasawisma ini.'
                    : formData.peran === 'PENGURUS_RW'
                    ? 'Cakupan akan mencakup seluruh RT pada RW dari wilayah ini.'
                    : 'Cakupan akan mencakup seluruh RW/RT pada Dusun dari wilayah ini.'}
                </p>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={addLoading}
                className="min-h-touch"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={addLoading}
                className="min-h-touch font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {addLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Buat Akun Pengelola'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Reset Password */}
      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              <DialogTitle className="text-base font-bold text-foreground">
                Atur Ulang Kata Sandi
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Setel kata sandi baru untuk akun {resetTarget?.nama} (@{resetTarget?.username}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4 py-2">
            {resetError && (
              <div
                role="alert"
                className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive text-xs font-medium"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-md flex items-center gap-2 text-primary text-xs font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="newPasswordInput">
                Kata Sandi Baru <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPasswordInput"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="min-h-touch text-base"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTarget(null)}
                disabled={resetLoading}
                className="min-h-touch"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="min-h-touch font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Sandi Baru'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
