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
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';

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
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Dasawisma, RT, RW, ketua..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>

          <select
            value={filterDusun}
            onChange={(e) => setFilterDusun(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="">Semua Dusun</option>
            {dusunOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Wilayah Baru</span>
        </button>
      </div>

      {/* Wilayah Data Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <span className="text-xs font-semibold text-stone-700">
            Daftar Wilayah Administrasi ({filteredList.length} Unit)
          </span>
          <span className="text-[11px] text-stone-500">
            Terdiri atas Dusun, RW, RT, dan Kelompok Dasawisma
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Tidak ada wilayah yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Nama Dasawisma</th>
                  <th className="px-4 py-3">Dusun / Lingkungan</th>
                  <th className="px-4 py-3">RW / RT</th>
                  <th className="px-4 py-3">Ketua & Kontak</th>
                  <th className="px-4 py-3">Data Keluarga</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredList.map((item) => {
                  const hasFamilies = item._count.keluarga > 0;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900">{item.namaDasawisma}</div>
                        <div className="text-[11px] text-stone-400 font-mono">ID: {item.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {item.dusun}
                      </td>
                      <td className="px-4 py-3 text-stone-700 font-medium">
                        RT {item.rt} / RW {item.rw}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        <div className="font-medium text-stone-800">{item.ketuaNama || '-'}</div>
                        <div className="text-[11px] text-stone-400">{item.kontak || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            hasFamilies
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-200'
                          }`}
                        >
                          <Users className="w-3 h-3" />
                          <span>{item._count.keluarga} KK</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                            title="Ubah Wilayah"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(item);
                              setDeleteError(null);
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                            title={
                              hasFamilies
                                ? 'Wilayah tidak dapat dihapus karena masih ada keluarga'
                                : 'Hapus Wilayah'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Wilayah */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full overflow-hidden transition-all my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {editingId ? 'Ubah Data Wilayah' : 'Tambah Wilayah Baru'}
                  </h3>
                  <p className="text-[11px] text-stone-600">
                    Konfigurasi wilayah administratif kelompok Dasawisma
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Dusun / Lingkungan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.dusun}
                  onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                  placeholder="Contoh: Dusun Krajan"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    RW <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rw}
                    onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                    placeholder="Contoh: 01"
                    className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    RT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rt}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    placeholder="Contoh: 01"
                    className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Kelompok Dasawisma <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaDasawisma}
                  onChange={(e) => setFormData({ ...formData, namaDasawisma: e.target.value })}
                  placeholder="Contoh: Melati 1"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Ketua Dasawisma (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.ketuaNama || ''}
                  onChange={(e) => setFormData({ ...formData, ketuaNama: e.target.value })}
                  placeholder="Nama ketua kelompok"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kontak / No. Telepon (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.kontak || ''}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-normal"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors"
                >
                  {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-sm w-full overflow-hidden transition-all my-8 p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900">Hapus Wilayah?</h3>
              <p className="text-xs text-stone-600 mt-1">
                Anda akan menghapus kelompok Dasawisma <b>{deleteTarget.namaDasawisma}</b> (RT {deleteTarget.rt} / RW {deleteTarget.rw}, {deleteTarget.dusun}).
              </p>
            </div>

            {deleteTarget._count.keluarga > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <b>Peringatan:</b> Wilayah ini masih memiliki {deleteTarget._count.keluarga} keluarga. Penghapusan akan ditolak oleh sistem demi menjaga integritas data kependudukan.
              </div>
            )}

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-sm transition-colors"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
