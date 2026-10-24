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
  ShieldAlert,
  Power,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';

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

  const ROLE_LABELS: Record<PeranPengguna, { label: string; badge: string }> = {
    ADMIN_DESA: {
      label: 'Admin Desa',
      badge: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    PENGURUS_DUSUN: {
      label: 'Pengurus Dusun',
      badge: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    PENGURUS_RW: {
      label: 'Pengurus RW',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    KADER_RT: {
      label: 'Kader RT',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  };

  return (
    <div className="space-y-4">
      {actionNotice && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Filters + Add Button */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, username, wilayah..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>

          <select
            value={filterPeran}
            onChange={(e) => setFilterPeran(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="">Semua Peran</option>
            <option value="ADMIN_DESA">Admin Desa</option>
            <option value="PENGURUS_DUSUN">Pengurus Dusun</option>
            <option value="PENGURUS_RW">Pengurus RW</option>
            <option value="KADER_RT">Kader RT</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Pengguna Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <span className="text-xs font-semibold text-stone-700">
            Daftar Akun Pengelola ({filteredUsers.length} Pengguna)
          </span>
          <span className="text-[11px] text-stone-500">
            Hanya Admin Desa yang dapat mengelola akun ini
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Tidak ada akun pengguna yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Nama & Username</th>
                  <th className="px-4 py-3">Peran Akses</th>
                  <th className="px-4 py-3">Cakupan Wilayah</th>
                  <th className="px-4 py-3">Status Akun</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.peran] || {
                    label: u.peran,
                    badge: 'bg-stone-100 text-stone-700',
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
                    <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900">{u.nama}</div>
                        <div className="text-[11px] text-stone-500 font-mono">@{u.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleMeta.badge}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-700 font-medium">
                        {cakupanLabel}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            u.aktif
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {u.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword('');
                              setResetError(null);
                              setResetSuccess(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                            title="Atur Ulang Kata Sandi"
                          >
                            <KeyRound className="w-3 h-3 text-stone-500" />
                            <span>Reset Sandi</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                              u.aktif
                                ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title={u.aktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power className="w-3 h-3" />
                            <span>{u.aktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
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

      {/* Modal Add Pengguna */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full overflow-hidden transition-all my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Tambah Akun Pengelola</h3>
                  <p className="text-[11px] text-stone-600">
                    Akun resmi dibuat oleh Admin Desa (tanpa registrasi mandiri)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-3.5">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{addSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Siti Rahayu"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Pengguna (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: siti_kader_rt01"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kata Sandi Awal <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.kataSandi}
                  onChange={(e) => setFormData({ ...formData, kataSandi: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Peran Akses <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.peran}
                  onChange={(e) => {
                    const nextPeran = e.target.value as PeranPengguna;
                    setFormData({
                      ...formData,
                      peran: nextPeran,
                      wilayahId: nextPeran === 'ADMIN_DESA' ? null : formData.wilayahId || wilayahList[0]?.id || null,
                    });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                >
                  <option value="KADER_RT">Kader RT (Dasawisma Tertentu)</option>
                  <option value="PENGURUS_RW">Pengurus RW (Cakupan 1 RW)</option>
                  <option value="PENGURUS_DUSUN">Pengurus Dusun (Cakupan 1 Dusun)</option>
                  <option value="ADMIN_DESA">Admin Desa (Akses Seluruh Desa & Kelola Akun)</option>
                </select>
              </div>

              {formData.peran !== 'ADMIN_DESA' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Wilayah Jangkar Cakupan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.wilayahId || ''}
                    onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  >
                    <option value="">-- Pilih Wilayah Jangkar --</option>
                    {wilayahList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.dusun} &bull; RW {w.rw} &bull; RT {w.rt} ({w.namaDasawisma})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {formData.peran === 'KADER_RT'
                      ? 'Kader hanya akan mengelola Dasawisma ini.'
                      : formData.peran === 'PENGURUS_RW'
                      ? 'Cakupan akan mencakup seluruh RT pada RW dari wilayah ini.'
                      : 'Cakupan akan mencakup seluruh RW/RT pada Dusun dari wilayah ini.'}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  disabled={addLoading}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors"
                >
                  {addLoading ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-sm w-full overflow-hidden transition-all my-8 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-stone-900">Atur Ulang Kata Sandi</h3>
              </div>
              <button
                onClick={() => setResetTarget(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Setel kata sandi baru untuk akun <b>{resetTarget.nama}</b> (@{resetTarget.username}).
            </p>

            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  disabled={resetLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors"
                >
                  {resetLoading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
