'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Download,
  ArrowLeft,
} from 'lucide-react';
import {
  AppRoute,
  KeluargaRecord,
  OfficerAccount,
  UserRole,
  filterFamiliesByRoleScope,
  getRbacPermissions,
} from '@/lib/domain';
import { downloadOfficialPdfReport } from '@/lib/exportUtils';
import {
  BoardButton,
  BoardSurface,
} from '@/components/simpatik';

export interface DashboardCetakProps {
  families: KeluargaRecord[];
  selectedCetakId?: string;
  currentUser: OfficerAccount | null;
  currentRole: UserRole;
  onSelectCetakId?: (id: string) => void;
  onNavigate?: (route: AppRoute) => void;
}

export function DashboardCetak({
  families,
  selectedCetakId,
  currentUser,
  currentRole,
  onSelectCetakId,
  onNavigate,
}: DashboardCetakProps) {
  const router = useRouter();
  const perms = getRbacPermissions(currentRole, currentUser);
  const scopedFamilies = filterFamiliesByRoleScope(families, currentRole, currentUser);
  const activeFam =
    scopedFamilies.find((f) => f.id === selectedCetakId) || scopedFamilies[0];

  const handleNavigate = (route: AppRoute) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      router.push(route);
    }
  };

  const handleSelectCetakId = (id: string) => {
    if (onSelectCetakId) {
      onSelectCetakId(id);
    } else {
      router.push(`/dashboard/laporan/cetak/${id}`);
    }
  };

  if (!activeFam) {
    return (
      <BoardSurface padding="lg" className="text-center py-12 space-y-3">
        <Printer className="size-10 mx-auto text-text-tertiary" />
        <h2 className="text-body-medium font-bold text-text-primary">
          Belum Ada Catatan Keluarga (Lampiran 4.15) Siap Cetak
        </h2>
        <p className="text-caption-1-regular text-text-secondary max-w-md mx-auto">
          Tidak ditemukan data keluarga untuk dicetak pada wilayah cakupan ini. Verifikasi berkas warga terlebih dahulu melalui menu Verifikasi Draft.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <BoardButton variant="secondary" size="sm" onClick={() => handleNavigate('/dashboard')}>
            Ke Dashboard
          </BoardButton>
          <BoardButton variant="primary" size="sm" onClick={() => handleNavigate('/dashboard/verifikasi')}>
            Buka Verifikasi Draft
          </BoardButton>
        </div>
      </BoardSurface>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-surface-default border border-separator-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <BoardButton
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => handleNavigate('/dashboard')}
          >
            Kembali
          </BoardButton>

          <div className="min-w-0">
            <label htmlFor="select-cetak-fam" className="sr-only">
              Pilih Keluarga untuk Dicetak
            </label>
            <select
              id="select-cetak-fam"
              aria-label="Pilih Keluarga untuk Dicetak"
              value={activeFam.id}
              onChange={(e) => handleSelectCetakId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-surface-subtle border border-separator-border rounded-lg text-text-primary max-w-xs sm:max-w-sm truncate"
            >
              {scopedFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  {`KK ${f.namaKepalaKeluarga} (${f.noKK}) · ${f.namaDasawisma}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BoardButton
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() =>
              downloadOfficialPdfReport(
                [activeFam],
                activeFam.tahunPendataan,
                perms.scopeLabel,
                activeFam
              )
            }
          >
            Unduh PDF / HTML
          </BoardButton>

          <BoardButton
            variant="primary"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Cetak Lampiran 4.15
          </BoardButton>
        </div>
      </div>

      {/* Official Lampiran 4.15 Catatan Keluarga Physical Sheet */}
      <BoardSurface padding="lg" className="print-sheet space-y-6 bg-white text-slate-900">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-600">
              TIM PENGGERAK PKK DESA GRUDO · KECAMATAN NGAWI · KABUPATEN NGAWI
            </div>
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-900 mt-1">
              CATATAN KELUARGA
            </h1>
            <div className="text-xs text-slate-600 mt-0.5">
              {`Format Baku Buku Fisik Dasawisma PKK — Tahun Pendataan ${activeFam.tahunPendataan}`}
            </div>
          </div>

          <div className="text-right font-mono text-xs border border-slate-900 px-3 py-1.5 rounded">
            <div className="font-bold">LAMPIRAN 4.15</div>
            <div>{`No. KK: ${activeFam.noKK}`}</div>
          </div>
        </div>

        {/* Two-Column Official Family Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Catatan Keluarga dari</span>
              <span className="col-span-2 font-bold">{`: ${activeFam.namaKepalaKeluarga}`}</span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Anggota Kelompok Dasawisma</span>
              <span className="col-span-2 font-semibold">{`: ${activeFam.namaDasawisma}`}</span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">RT / RW / Dusun</span>
              <span className="col-span-2 font-mono">
                {`: RT ${activeFam.rt} / RW ${activeFam.rw} · Dusun ${activeFam.dusun}`}
              </span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Desa / Kecamatan</span>
              <span className="col-span-2">: Desa Grudo / Kec. Ngawi, Kab. Ngawi</span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Alamat &amp; Koordinat</span>
              <span className="col-span-2">
                {`: ${activeFam.alamat} (${activeFam.latitude}, ${activeFam.longitude})`}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Kriteria Rumah</span>
              <span className="col-span-2 font-semibold">
                {`: ${activeFam.sanitasi.kriteriaRumah.replace('_', ' ')}`}
              </span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Jamban Keluarga &amp; Air</span>
              <span className="col-span-2">
                {`: ${activeFam.sanitasi.punyaJamban ? `Ada (${activeFam.sanitasi.jumlahJamban} unit)` : 'Tidak Ada'} · Air ${activeFam.sanitasi.sumberAir}`}
              </span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Tempat Sampah &amp; SPAL</span>
              <span className="col-span-2">
                {`: Sampah (${activeFam.sanitasi.punyaTempatSampah ? 'Ya' : 'Tidak'}) · SPAL (${activeFam.sanitasi.punyaSpal ? 'Ya' : 'Tidak'})`}
              </span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Stiker P4K &amp; Makanan Pokok</span>
              <span className="col-span-2">
                {`: Stiker P4K (${activeFam.sanitasi.tempelStikerP4k ? 'Ya' : 'Tidak'}) · Makanan Pokok (${activeFam.pekarangan.makananPokok})`}
              </span>
            </div>
            <div className="grid grid-cols-3 py-1 border-b border-slate-200">
              <span className="text-slate-600">Aktivitas UP2K PKK</span>
              <span className="col-span-2 font-semibold">
                {`: ${activeFam.pekarangan.ikutUp2k ? `Ya (${activeFam.pekarangan.jenisUsahaUp2k || 'UP2K'})` : 'Tidak'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Table I: Demographic Members (Lampiran 4.15 Standard Table) */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-900">
            {`I. Tabel Data Anggota Keluarga (${activeFam.anggota.length} Tercatat)`}
          </div>
          <div className="overflow-x-auto border border-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900">
                  <th className="border-r border-slate-900 py-2 px-2.5">No</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">Nama Anggota Keluarga</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">NIK / Virtual NIK</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">Status Dlm Keluarga</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">Status Kawin</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">L/P</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">Tgl Lahir / Umur</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">Pendidikan</th>
                  <th className="border-r border-slate-900 py-2 px-2.5">Pekerjaan</th>
                  <th className="py-2 px-2.5">Indikator Khusus &amp; Status</th>
                </tr>
              </thead>
              <tbody>
                {activeFam.anggota.map((m, idx) => (
                  <tr key={m.id} className="border-b border-slate-400">
                    <td className="border-r border-slate-400 py-2 px-2.5 font-mono tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5 font-semibold">
                      {m.nama}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5 font-mono tabular-nums">
                      {`${m.nik}${m.isVirtualNik ? ' (Virtual)' : ''}`}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5">
                      {m.hubungan.replace('_', ' ')}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5">
                      {m.statusKawin.replace('_', ' ')}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5 font-mono">
                      {m.jenisKelamin}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5 font-mono tabular-nums">
                      {`${m.tanggalLahir} (${m.umur} th)`}
                    </td>
                    <td className="border-r border-slate-400 py-2 px-2.5">{m.pendidikan}</td>
                    <td className="border-r border-slate-400 py-2 px-2.5">{m.pekerjaan}</td>
                    <td className="py-2 px-2.5">
                      {[
                        m.statusHidup !== 'HIDUP' ? `[${m.statusHidup}]` : '',
                        m.isBalita ? 'Balita' : '',
                        m.isLansia ? 'Lansia' : '',
                        m.isIbuHamil ? 'Ibu Hamil' : '',
                        m.isIbuMenyusui ? 'Ibu Menyusui' : '',
                        m.isButaAksara ? '3 Buta' : '',
                        m.isDisabilitas ? 'Disabilitas' : '',
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Aktif / Umum'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table II: Pemanfaatan Tanah Pekarangan (HATINYA PKK) & Industri RT */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-900">
            II. Pemanfaatan Tanah Pekarangan (HATINYA PKK) &amp; Industri Rumah Tangga
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs border border-slate-900 p-3">
            <div>
              <span className="text-slate-500 block">Tanaman Obat (TOGA)</span>
              <span className="font-bold">{activeFam.pekarangan.toga ? 'Ya / Ada' : 'Tidak'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Sayuran / Warung Hidup</span>
              <span className="font-bold">{activeFam.pekarangan.sayuran ? 'Ya / Ada' : 'Tidak'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tanaman Keras</span>
              <span className="font-bold">
                {activeFam.pekarangan.tanamanKeras ? 'Ya / Ada' : 'Tidak'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Perikanan Kolam</span>
              <span className="font-bold">
                {activeFam.pekarangan.perikanan ? 'Ya / Ada' : 'Tidak'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Peternakan</span>
              <span className="font-bold">
                {activeFam.pekarangan.peternakan ? 'Ya / Ada' : 'Tidak'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Industri RT</span>
              <span className="font-bold">
                {activeFam.pekarangan.industriRumahTangga.join(', ') || 'Tidak Ada'}
              </span>
            </div>
          </div>
        </div>

        {/* Official Signature Block */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-900">
          <div>
            <div>Mengetahui,</div>
            <div className="font-bold">{`Ketua Kelompok Dasawisma ${activeFam.namaDasawisma}`}</div>
            <div className="h-16" />
            <div className="font-semibold underline">
              {`( Kader RT ${activeFam.rt} / RW ${activeFam.rw} )`}
            </div>
          </div>
          <div className="text-right">
            <div>{`Desa Grudo, Oktober ${activeFam.tahunPendataan}`}</div>
            <div className="font-bold">Kepala Keluarga Bersangkutan</div>
            <div className="h-16" />
            <div className="font-semibold underline">{`( ${activeFam.namaKepalaKeluarga} )`}</div>
          </div>
        </div>
      </BoardSurface>
    </div>
  );
}
