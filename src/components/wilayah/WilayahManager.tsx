'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createWilayahAction,
  updateWilayahAction,
  deleteWilayahAction,
  WilayahInput,
} from '@/actions/wilayahActions';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface WilayahWithCount {
  id: string;
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
  ketuaNama: string | null;
  kontak: string | null;
  _count: {
    keluarga: number;
  };
}

interface WilayahManagerProps {
  initialList: WilayahWithCount[];
}

export function WilayahManager({ initialList }: WilayahManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterDusun, setFilterDusun] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<WilayahInput>({
    dusun: '',
    rw: '',
    rt: '',
    namaDasawisma: '',
    ketuaNama: '',
    kontak: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<WilayahWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dusunOptions = Array.from(new Set(initialList.map((w) => w.dusun))).sort();

  const filteredList = initialList.filter((item) => {
    const matchSearch =
      search === '' ||
      item.namaDasawisma.toLowerCase().includes(search.toLowerCase()) ||
      item.dusun.toLowerCase().includes(search.toLowerCase()) ||
      item.rt.includes(search) ||
      item.rw.includes(search) ||
      (item.ketuaNama && item.ketuaNama.toLowerCase().includes(search.toLowerCase()));

    const matchDusun = filterDusun === '' || item.dusun === filterDusun;

    return matchSearch && matchDusun;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      dusun: dusunOptions[0] || 'Dusun Krajan',
      rw: '01',
      rt: '01',
      namaDasawisma: '',
      ketuaNama: '',
      kontak: '',
    });
    setError(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: WilayahWithCount) => {
    setEditingId(item.id);
    setFormData({
      dusun: item.dusun,
      rw: item.rw,
      rt: item.rt,
      namaDasawisma: item.namaDasawisma,
      ketuaNama: item.ketuaNama || '',
      kontak: item.kontak || '',
    });
    setError(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editingId) {
        const res = await updateWilayahAction(editingId, formData);
        if (!res.success) {
          setError(res.error || 'Gagal mengubah data wilayah.');
          return;
        }
        setSuccessMsg('Wilayah berhasil diperbarui.');
      } else {
        const res = await createWilayahAction(formData);
        if (!res.success) {
          setError(res.error || 'Gagal menambahkan data wilayah.');
          return;
        }
        setSuccessMsg('Wilayah baru berhasil ditambahkan.');
      }

      router.refresh();
      setTimeout(() => {
        setSuccessMsg(null);
        setModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      const res = await deleteWilayahAction(deleteTarget.id);
      if (!res.success) {
        setDeleteError(res.error || 'Gagal menghapus wilayah.');
        return;
      }

      router.refresh();
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
                placeholder="Cari Dasawisma, RT, RW, ketua..."
                className="pl-9 min-h-touch text-sm"
              />
            </div>

            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              className="flex min-h-touch rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
            >
              <option value="">Semua Dusun</option>
              {dusunOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="min-h-touch gap-2 font-semibold shrink-0"
          >
            <Plus className="size-4" data-icon="inline-start" />
            <span>Tambah Wilayah Baru</span>
          </Button>
        </div>
      </Card>

      {/* Wilayah Data Table */}
      <Card>
        <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Daftar Wilayah Administrasi ({filteredList.length} Unit)
          </CardTitle>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Terdiri atas Dusun, RW, RT, dan Kelompok Dasawisma
          </span>
        </CardHeader>

        {filteredList.length === 0 ? (
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Tidak ada wilayah yang sesuai dengan filter pencarian.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Nama Dasawisma</TableHead>
                  <TableHead className="whitespace-nowrap">Dusun / Lingkungan</TableHead>
                  <TableHead className="whitespace-nowrap">RW / RT</TableHead>
                  <TableHead className="whitespace-nowrap">Ketua &amp; Kontak</TableHead>
                  <TableHead className="whitespace-nowrap">Data Keluarga</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.map((item) => {
                  const hasFamilies = item._count.keluarga > 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-bold text-foreground">{item.namaDasawisma}</div>
                        <div className="text-xs text-muted-foreground font-mono">ID: {item.id.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {item.dusun}
                      </TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        RT {item.rt} / RW {item.rw}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.ketuaNama || '-'}</div>
                        <div className="text-xs text-muted-foreground">{item.kontak || '-'}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={hasFamilies ? 'default' : 'secondary'}
                          className="gap-1 font-semibold"
                        >
                          <Users className="size-3" />
                          <span>{item._count.keluarga} KK</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="min-h-touch min-w-touch"
                            title="Ubah Data Wilayah"
                          >
                            <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Ubah</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTarget(item);
                              setDeleteError(null);
                            }}
                            className="min-h-touch min-w-touch text-destructive hover:text-destructive hover:bg-destructive/10"
                            title={
                              hasFamilies
                                ? 'Wilayah tidak dapat dihapus karena masih ada keluarga terdaftar'
                                : 'Hapus Wilayah'
                            }
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Hapus</span>
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

      {/* Dialog Add / Edit Wilayah */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="size-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editingId ? 'Ubah Data Wilayah' : 'Tambah Wilayah Baru'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Konfigurasi hierarki wilayah administratif kelompok Dasawisma Desa Grudo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            {error && (
              <div
                role="alert"
                className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive text-sm font-medium"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-md flex items-center gap-2 text-primary text-sm font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="wilayahDusunInput">
                Nama Dusun / Lingkungan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wilayahDusunInput"
                type="text"
                required
                value={formData.dusun}
                onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                placeholder="Contoh: Dusun Krajan"
                className="min-h-touch text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="wilayahRwInput">
                  RW <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="wilayahRwInput"
                  type="text"
                  required
                  value={formData.rw}
                  onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                  placeholder="Contoh: 01"
                  className="min-h-touch text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wilayahRtInput">
                  RT <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="wilayahRtInput"
                  type="text"
                  required
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  placeholder="Contoh: 01"
                  className="min-h-touch text-base"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="wilayahDasawismaInput">
                Nama Kelompok Dasawisma <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wilayahDasawismaInput"
                type="text"
                required
                value={formData.namaDasawisma}
                onChange={(e) => setFormData({ ...formData, namaDasawisma: e.target.value })}
                placeholder="Contoh: Melati 1"
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="wilayahKetuaInput">
                Nama Ketua Dasawisma (Opsional)
              </Label>
              <Input
                id="wilayahKetuaInput"
                type="text"
                value={formData.ketuaNama || ''}
                onChange={(e) => setFormData({ ...formData, ketuaNama: e.target.value })}
                placeholder="Nama ketua kelompok"
                className="min-h-touch text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="wilayahKontakInput">
                Kontak / No. Telepon (Opsional)
              </Label>
              <Input
                id="wilayahKontakInput"
                type="text"
                value={formData.kontak || ''}
                onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                placeholder="Contoh: 08123456789"
                className="min-h-touch text-base"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="min-h-touch"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-h-touch font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : editingId ? (
                  'Simpan Perubahan Wilayah'
                ) : (
                  'Simpan Wilayah Baru'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Hapus Wilayah dengan konsekuensi 1 kalimat polos */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Wilayah Administrasi</AlertDialogTitle>
            <AlertDialogDescription>
              Wilayah {deleteTarget?.namaDasawisma} (RT {deleteTarget?.rt} / RW {deleteTarget?.rw}, {deleteTarget?.dusun}) akan dihapus secara permanen dari sistem beserta seluruh keterkaitan data administrasinya.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget && deleteTarget._count.keluarga > 0 && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-amber-900 text-xs font-medium">
              Peringatan: Wilayah ini masih memiliki {deleteTarget._count.keluarga} keluarga terdaftar. Penghapusan akan ditolak demi menjaga integritas data kependudukan.
            </div>
          )}

          {deleteError && (
            <div
              role="alert"
              className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive text-xs font-medium"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Batal</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading || (deleteTarget?._count.keluarga ?? 0) > 0}
              onClick={handleDelete}
              className="min-h-touch"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus Wilayah'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
