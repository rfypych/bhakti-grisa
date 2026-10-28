'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Baby,
  HeartCrack,
  Activity,
  Plus,
  Eye,
  Truck,
} from 'lucide-react';
import {
  BirthEventInput,
  JenisPeristiwa,
  KeluargaRecord,
  MortalityEventInput,
  OfficerAccount,
  PeristiwaRecord,
  UserRole,
  filterFamiliesByRoleScope,
  generateVirtualNik,
  getRbacPermissions,
} from '@/lib/domain';
import {
  BoardButton,
  BoardSurface,
  BoardStatCard,
  BoardCallout,
  BoardModal,
  BoardSegmentedControl,
  BoardStatusLabel,
  BoardEmptyState,
} from '@/components/simpatik';
import {
  laporKelahiranAction,
  laporKematianAction,
  laporKehamilanAction,
  laporMutasiAction,
} from '@/actions/peristiwaActions';

export interface DashboardPeristiwaProps {
  families: KeluargaRecord[];
  events: PeristiwaRecord[];
  currentUser: OfficerAccount | null;
  currentRole: UserRole;
  onRecordBirth?: (input: BirthEventInput) => Promise<void> | void;
  onRecordMortality?: (input: MortalityEventInput) => Promise<void> | void;
  onRecordGeneralEvent?: (event: PeristiwaRecord) => Promise<void> | void;
}

export function DashboardPeristiwa({
  families: initialFamilies,
  events: initialEvents,
  currentUser,
  currentRole,
  onRecordBirth,
  onRecordMortality,
  onRecordGeneralEvent,
}: DashboardPeristiwaProps) {
  const router = useRouter();
  const [families, setFamilies] = useState<KeluargaRecord[]>(initialFamilies);
  const [events, setEvents] = useState<PeristiwaRecord[]>(initialEvents);
  const [jenisFilter, setJenisFilter] = useState<'SEMUA' | JenisPeristiwa>('SEMUA');
  const [isBirthModalOpen, setIsBirthModalOpen] = useState(false);
  const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const perms = getRbacPermissions(currentRole, currentUser);
  const scopedFamilies = filterFamiliesByRoleScope(families, currentRole, currentUser).filter(
    (f) => f.status === 'VERIFIKASI'
  );

  // Scope events
  const scopedEvents = events.filter((e) => {
    if (currentRole === 'ADMIN_DESA') return true;
    if (currentRole === 'KADER_RT' && currentUser?.wilayahId) {
      return e.wilayahId === currentUser.wilayahId;
    }
    if (currentRole === 'PENGURUS_RW' && currentUser?.scopeRw) {
      return e.rw === currentUser.scopeRw;
    }
    if (currentRole === 'PENGURUS_DUSUN' && currentUser?.scopeDusun) {
      return e.dusun === currentUser.scopeDusun;
    }
    return true;
  });

  const filteredEvents =
    jenisFilter === 'SEMUA'
      ? scopedEvents
      : scopedEvents.filter((e) => e.jenis === jenisFilter);

  // Birth Modal Form State
  const [birthFamId, setBirthFamId] = useState<string>(scopedFamilies[0]?.id || '');
  const [namaIbu, setNamaIbu] = useState<string>('');
  const [namaBayi, setNamaBayi] = useState<string>('');
  const [jkBayi, setJkBayi] = useState<'L' | 'P'>('P');
  const [tglLahirBayi, setTglLahirBayi] = useState<string>('2026-10-28');
  const [beratBadan, setBeratBadan] = useState<string>('');
  const [lingkarKepala, setLingkarKepala] = useState<string>('');
  const [panjangBadan, setPanjangBadan] = useState<string>('');
  const [useVirtualNik, setUseVirtualNik] = useState<boolean>(true);

  // Mortality Modal Form State
  const [mortFamId, setMortFamId] = useState<string>(scopedFamilies[0]?.id || '');
  const [mortAnggotaId, setMortAnggotaId] = useState<string>('');
  const [tglKematian, setTglKematian] = useState<string>('2026-10-28');
  const [kategoriKematian, setKategoriKematian] = useState<
    'IBU_HAMIL_MELAHIRKAN' | 'BAYI' | 'BALITA' | 'WARGA_UMUM'
  >('WARGA_UMUM');
  const [penyebabKematian, setPenyebabKematian] = useState<string>('');

  // General Event Modal State (Kehamilan / Nifas / Mutasi)
  const [genJenis, setGenJenis] = useState<'KEHAMILAN' | 'NIFAS' | 'MUTASI_KELUAR'>('KEHAMILAN');
  const [genFamId, setGenFamId] = useState<string>(scopedFamilies[0]?.id || '');
  const [genNamaSubjek, setGenNamaSubjek] = useState<string>('');
  const [genKeterangan, setGenKeterangan] = useState<string>('');

  const selectedBirthFam =
    scopedFamilies.find((f) => f.id === birthFamId) || scopedFamilies[0];
  const selectedMortFam =
    scopedFamilies.find((f) => f.id === mortFamId) || scopedFamilies[0];
  const livingMortMembers =
    selectedMortFam?.anggota.filter((a) => a.statusHidup === 'HIDUP') || [];

  const handleOpenBirthModal = () => {
    const firstFam = scopedFamilies[0];
    if (firstFam) {
      setBirthFamId(firstFam.id);
      const mother = firstFam.anggota.find(
        (a) => a.hubungan === 'ISTRI' || a.jenisKelamin === 'P'
      );
      setNamaIbu(mother?.nama || firstFam.namaKepalaKeluarga);
    }
    setNamaBayi('');
    setIsBirthModalOpen(true);
  };

  const handleOpenMortalityModal = () => {
    const firstFam = scopedFamilies[0];
    if (firstFam) {
      setMortFamId(firstFam.id);
      const firstLiving = firstFam.anggota.find((a) => a.statusHidup === 'HIDUP');
      setMortAnggotaId(firstLiving?.id || '');
    }
    setPenyebabKematian('');
    setIsMortalityModalOpen(true);
  };

  const handleOpenGeneralModal = (type: 'KEHAMILAN' | 'NIFAS' | 'MUTASI_KELUAR' = 'KEHAMILAN') => {
    setGenJenis(type);
    const firstFam = scopedFamilies[0];
    if (firstFam) {
      setGenFamId(firstFam.id);
      const member = firstFam.anggota.find((a) => a.statusHidup === 'HIDUP');
      setGenNamaSubjek(member?.nama || '');
    }
    setGenKeterangan('');
    setIsGeneralModalOpen(true);
  };

  const handleSubmitBirth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBirthFam || !namaBayi.trim()) return;

    setIsLoading(true);
    try {
      const mother =
        selectedBirthFam.anggota.find((a) => a.hubungan === 'ISTRI' || a.jenisKelamin === 'P') ||
        selectedBirthFam.anggota[0];

      const generatedNik = generateVirtualNik(
        tglLahirBayi,
        jkBayi,
        (selectedBirthFam.anggota.length || 1) + 1
      );

      const numBb = parseFloat(beratBadan) || 3.2;
      const numLk = parseFloat(lingkarKepala) || 34;
      const numPb = parseFloat(panjangBadan) || 49;

      if (onRecordBirth) {
        await onRecordBirth({
          keluargaId: selectedBirthFam.id,
          namaIbu: namaIbu.trim() || selectedBirthFam.namaKepalaKeluarga,
          namaBayi: namaBayi.trim(),
          jenisKelamin: jkBayi,
          tanggalLahir: tglLahirBayi,
          beratBadanKg: numBb,
          lingkarKepalaCm: numLk,
          useVirtualNik,
          dicatatOleh: currentUser?.nama || `Petugas ${currentRole}`,
        });
      } else {
        await laporKelahiranAction({
          ibuId: mother?.id || '',
          namaBayi: namaBayi.trim(),
          tanggalLahir: tglLahirBayi,
          jenisKelamin: jkBayi,
          beratBadanKg: numBb,
            nik: useVirtualNik ? generatedNik : undefined,
        });
      }

      const newEvent: PeristiwaRecord = {
        id: `evt-${Date.now()}`,
        jenis: 'KELAHIRAN',
        keluargaId: selectedBirthFam.id,
        noKK: selectedBirthFam.noKK,
        namaKepalaKeluarga: selectedBirthFam.namaKepalaKeluarga,
        wilayahId: selectedBirthFam.wilayahId,
        rt: selectedBirthFam.rt,
        rw: selectedBirthFam.rw,
        dusun: selectedBirthFam.dusun,
        namaSubjek: namaBayi.trim(),
        jenisKelamin: jkBayi,
        tanggalPeristiwa: tglLahirBayi,
        keterangan: `Ibu: ${namaIbu.trim() || selectedBirthFam.namaKepalaKeluarga}, BB: ${numBb} kg, LK: ${numLk} cm, PB: ${numPb} cm`,
        namaIbu: namaIbu.trim() || selectedBirthFam.namaKepalaKeluarga,
        beratBadanKg: numBb,
        lingkarKepalaCm: numLk,
        nikBayi: useVirtualNik ? generatedNik : undefined,
        dicatatOleh: currentUser?.nama || `Petugas ${currentRole}`,
      };

      setEvents((prev) => [newEvent, ...prev]);

      // Add baby to family
      setFamilies((prev) =>
        prev.map((f) =>
          f.id === selectedBirthFam.id
            ? {
                ...f,
                anggota: [
                  ...f.anggota,
                  {
                    id: `child-${Date.now()}`,
                    nama: namaBayi.trim(),
                    nik: useVirtualNik ? generatedNik : `352109-${Date.now()}`,
                    isVirtualNik: useVirtualNik,
                    hubungan: 'ANAK',
                    jenisKelamin: jkBayi,
                    tempatLahir: f.alamat.split(',')[0] || 'Ngawi',
                    tanggalLahir: tglLahirBayi,
                    umur: 0,
                    statusKawin: 'BELUM_KAWIN',
                    agama: 'ISLAM',
                    pendidikan: 'TIDAK_SEKOLAH' as any,
                    pekerjaan: 'TIDAK_BEKERJA',
                    isBalita: true,
                    isLansia: false,
                    isIbuHamil: false,
                    isIbuMenyusui: false,
                    isButaAksara: false,
                    isDisabilitas: false,
                    statusHidup: 'HIDUP',
                  },
                ],
              }
            : f
        )
      );

      setIsBirthModalOpen(false);
      setFeedbackMsg(
        `Otomasi Lampiran 4.18 Berhasil: Bayi "${namaBayi.trim()}" telah dicatat ke buku kelahiran DAN otomatis ditambahkan sebagai anggota keluarga baru pada KK ${selectedBirthFam.namaKepalaKeluarga}.`
      );
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mencatat kelahiran.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitMortality = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMemberId = mortAnggotaId || livingMortMembers[0]?.id;
    if (!selectedMortFam || !targetMemberId) return;
    const memberObj = selectedMortFam.anggota.find((a) => a.id === targetMemberId);

    setIsLoading(true);
    try {
      if (onRecordMortality) {
        await onRecordMortality({
          keluargaId: selectedMortFam.id,
          anggotaId: targetMemberId,
          tanggalKematian: tglKematian,
          kategoriKematian,
          penyebabKematian: penyebabKematian.trim() || 'Faktor Kesehatan / Usia',
          dicatatOleh: currentUser?.nama || `Petugas ${currentRole}`,
        });
      } else {
        const statusAlmarhum =
          kategoriKematian === 'IBU_HAMIL_MELAHIRKAN'
            ? 'IBU_HAMIL_MELAHIRKAN_NIFAS'
            : kategoriKematian === 'BAYI'
            ? 'BAYI'
            : kategoriKematian === 'BALITA'
            ? 'BALITA'
            : 'LAINNYA';

        await laporKematianAction({
          anggotaId: targetMemberId,
          namaAlmarhum: memberObj?.nama || 'Warga',
          tanggalKematian: tglKematian,
          sebabKematian: penyebabKematian.trim() || 'Faktor Kesehatan / Usia',
          statusAlmarhum,
          keterangan: penyebabKematian.trim(),
        });
      }

      const newEvent: PeristiwaRecord = {
        id: `evt-${Date.now()}`,
        jenis: 'KEMATIAN',
        keluargaId: selectedMortFam.id,
        noKK: selectedMortFam.noKK,
        namaKepalaKeluarga: selectedMortFam.namaKepalaKeluarga,
        wilayahId: selectedMortFam.wilayahId,
        rt: selectedMortFam.rt,
        rw: selectedMortFam.rw,
        dusun: selectedMortFam.dusun,
        namaSubjek: memberObj?.nama || 'Warga',
        jenisKelamin: memberObj?.jenisKelamin || 'L',
        tanggalPeristiwa: tglKematian,
        keterangan: `Penyebab: ${penyebabKematian.trim() || 'Usia Lanjut'} (${kategoriKematian})`,
        kategoriKematian,
        penyebabKematian: penyebabKematian.trim(),
        dicatatOleh: currentUser?.nama || `Petugas ${currentRole}`,
      };

      setEvents((prev) => [newEvent, ...prev]);

      // Mark member as deceased
      setFamilies((prev) =>
        prev.map((f) =>
          f.id === selectedMortFam.id
            ? {
                ...f,
                anggota: f.anggota.map((a) =>
                  a.id === targetMemberId ? { ...a, statusHidup: 'MENINGGAL' } : a
                ),
              }
            : f
        )
      );

      setIsMortalityModalOpen(false);
      setFeedbackMsg(
        `Otomasi Lampiran 4.18 Berhasil: Peristiwa wafatnya "${memberObj?.nama || 'Warga'}" telah dicatat ke buku rekap kematian PKK DAN status jiwa dalam KK ${selectedMortFam.namaKepalaKeluarga} otomatis diarsipkan.`
      );
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mencatat kematian.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const fam = scopedFamilies.find((f) => f.id === genFamId) || scopedFamilies[0];
    if (!fam || !genNamaSubjek.trim()) return;

    if (!fam.anggota || fam.anggota.length === 0) {
      alert('Keluarga yang dipilih tidak memiliki anggota keluarga yang terdaftar.');
      return;
    }

    setIsLoading(true);
    try {
      const memberObj =
        fam.anggota.find((a) => a.nama.toLowerCase().includes(genNamaSubjek.toLowerCase().trim())) ||
        fam.anggota.find((a) => a.nama.toLowerCase() === genNamaSubjek.toLowerCase().trim());

      if (!memberObj) {
        alert(`Anggota bernama "${genNamaSubjek}" tidak ditemukan dalam KK ${fam.namaKepalaKeluarga}. Silakan sesuaikan nama dengan data anggota keluarga.`);
        setIsLoading(false);
        return;
      }

      const newEvt: PeristiwaRecord = {
        id: `evt-${Date.now()}`,
        jenis: genJenis,
        keluargaId: fam.id,
        noKK: fam.noKK,
        namaKepalaKeluarga: fam.namaKepalaKeluarga,
        wilayahId: fam.wilayahId,
        rt: fam.rt,
        rw: fam.rw,
        dusun: fam.dusun,
        namaSubjek: memberObj.nama,
        jenisKelamin: memberObj.jenisKelamin || 'P',
        tanggalPeristiwa: new Date().toISOString().split('T')[0],
        keterangan: genKeterangan.trim() || `Pencatatan ${genJenis} resmi oleh petugas.`,
        dicatatOleh: currentUser?.nama || `Petugas ${currentRole}`,
      };

      if (onRecordGeneralEvent) {
        await onRecordGeneralEvent(newEvt);
      } else if (genJenis === 'MUTASI_KELUAR') {
        const res = await laporMutasiAction({
          anggotaId: memberObj.id,
          tanggalMutasi: new Date().toISOString().split('T')[0],
          keterangan: genKeterangan.trim() || 'Mutasi keluar wilayah',
        });
        if (!res.success) {
          throw new Error(res.error || 'Gagal mencatat mutasi keluar.');
        }
      } else {
        const res = await laporKehamilanAction({
          anggotaId: memberObj.id,
          tanggalCatat: new Date().toISOString().split('T')[0],
          status: genJenis === 'NIFAS' ? 'NIFAS' : 'KEHAMILAN',
          keterangan: genKeterangan.trim(),
        });
        if (!res.success) {
          throw new Error(res.error || 'Gagal mencatat kehamilan/nifas.');
        }
      }

      setEvents((prev) => [newEvt, ...prev]);

      if (genJenis === 'MUTASI_KELUAR' && memberObj) {
        setFamilies((prev) =>
          prev.map((f) =>
            f.id === fam.id
              ? {
                  ...f,
                  anggota: f.anggota.map((a) =>
                    a.id === memberObj.id ? { ...a, statusHidup: 'PINDAH' } : a
                  ),
                }
              : f
          )
        );
      }

      setIsGeneralModalOpen(false);
      setGenNamaSubjek('');
      setGenKeterangan('');
      setFeedbackMsg(
        `Peristiwa ${genJenis} untuk "${newEvt.namaSubjek}" berhasil ditambahkan ke Register Lampiran 4.18.`
      );
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal menyimpan catatan peristiwa.');
    } finally {
      setIsLoading(false);
    }
  };

  const countKelahiran = scopedEvents.filter((e) => e.jenis === 'KELAHIRAN').length;
  const countKehamilanNifas = scopedEvents.filter(
    (e) => e.jenis === 'KEHAMILAN' || e.jenis === 'NIFAS'
  ).length;
  const countKematian = scopedEvents.filter((e) => e.jenis === 'KEMATIAN').length;
  const countMutasi = scopedEvents.filter((e) => e.jenis === 'MUTASI_KELUAR').length;

  return (
    <div className="space-y-6">
      {/* Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-default border border-separator-border rounded-xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-accent-600 dark:text-accent-400">
            <span>Standar Pelaporan Buku Catatan Kelahiran &amp; Kematian (Lampiran 4.18 PKK)</span>
            <span aria-hidden="true">·</span>
            <span>{perms.scopeLabel}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-0.5">
            Modul Lapor Peristiwa Vital &amp; Dinamika Penduduk
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Pencatatan kelahiran otomatis menambah anggota keluarga pada KK, sedangkan pencatatan
            kematian otomatis mengarsipkan jiwa dari daftar hidup.
          </p>
        </div>

        {perms.canInputPeristiwa ? (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <BoardButton
              variant="primary"
              size="md"
              icon={<Baby className="w-4 h-4" />}
              onClick={handleOpenBirthModal}
            >
              + Catat Kelahiran Bayi
            </BoardButton>
            <BoardButton
              variant="danger"
              size="md"
              icon={<HeartCrack className="w-4 h-4" />}
              onClick={handleOpenMortalityModal}
            >
              + Catat Kematian Warga
            </BoardButton>
            <BoardButton
              variant="outline"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenGeneralModal('KEHAMILAN')}
            >
              + Kehamilan / Nifas / Mutasi
            </BoardButton>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-separator-border text-xs text-text-secondary">
            <Eye className="w-4 h-4 text-amber-700" />
            <span>Mode Baca / Audit Log Saja (Peran: {currentRole})</span>
          </div>
        )}
      </div>

      {feedbackMsg && (
        <BoardCallout
          tone="success"
          title="Sinkronisasi Buku Peristiwa & Anggota KK Berhasil"
          description={feedbackMsg}
          action={
            <BoardButton variant="outline" size="sm" onClick={() => setFeedbackMsg(null)}>
              Tutup
            </BoardButton>
          }
        />
      )}

      {/* 3 Event Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BoardSurface padding="md" className="flex flex-col justify-between space-y-3">
          <div>
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 mb-2">
              <Baby className="size-5" />
            </div>
            <h3 className="text-body-medium font-bold text-text-primary">Lapor Kelahiran Bayi</h3>
            <p className="text-body-2-regular text-text-secondary mt-1">
              Pencatatan kelahiran baru dengan opsi penerbitan Virtual NIK (16 digit) otomatis dan sinkronisasi ke buku KK.
            </p>
          </div>
          <BoardButton
            variant="primary"
            size="sm"
            icon={<Baby className="w-3.5 h-3.5" />}
            onClick={handleOpenBirthModal}
            disabled={!perms.canInputPeristiwa}
          >
            + Buka Formulir Kelahiran
          </BoardButton>
        </BoardSurface>

        <BoardSurface padding="md" className="flex flex-col justify-between space-y-3">
          <div>
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 mb-2">
              <HeartCrack className="size-5" />
            </div>
            <h3 className="text-body-medium font-bold text-text-primary">Lapor Kematian Warga</h3>
            <p className="text-body-2-regular text-text-secondary mt-1">
              Perekaman peristiwa wafat warga dengan klasifikasi Lampiran 4.18 PKK serta otomasi pengarsipan status jiwa KK.
            </p>
          </div>
          <BoardButton
            variant="danger"
            size="sm"
            icon={<HeartCrack className="w-3.5 h-3.5" />}
            onClick={handleOpenMortalityModal}
            disabled={!perms.canInputPeristiwa}
          >
            + Buka Formulir Kematian
          </BoardButton>
        </BoardSurface>

        <BoardSurface padding="md" className="flex flex-col justify-between space-y-3">
          <div>
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-2">
              <Activity className="size-5" />
            </div>
            <h3 className="text-body-medium font-bold text-text-primary">Lapor Mutasi &amp; Kehamilan</h3>
            <p className="text-body-2-regular text-text-secondary mt-1">
              Pencatatan kehamilan baru (P4K), masa nifas melahirkan, atau kepindahan warga keluar domisili Desa Grudo.
            </p>
          </div>
          <BoardButton
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => handleOpenGeneralModal('KEHAMILAN')}
            disabled={!perms.canInputPeristiwa}
          >
            + Buka Formulir Mutasi/Kehamilan
          </BoardButton>
        </BoardSurface>
      </div>

      {/* 4. Statistik Peristiwa Terkini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BoardStatCard
          label="Angka Kelahiran Bayi"
          value={countKelahiran}
          subtext="Otomatis masuk daftar jiwa KK"
          metaItems={['Lampiran 4.18 PKK', 'Virtual NIK Aktif']}
          accentTone="teal"
          icon={<Baby className="w-4 h-4" />}
        />
        <BoardStatCard
          label="Kehamilan & Masa Nifas"
          value={countKehamilanNifas}
          subtext="Ibu hamil (P4K) & nifas terpantau"
          metaItems={['Pendampingan Posyandu']}
          accentTone="amber"
          icon={<Activity className="w-4 h-4" />}
        />
        <BoardStatCard
          label="Pencatatan Kematian"
          value={countKematian}
          subtext="Ibu / Bayi / Balita / Warga Umum"
          metaItems={['Otomatis arsip jiwa KK']}
          accentTone="crimson"
        />
        <BoardStatCard
          label="Mutasi Pindah Keluar"
          value={countMutasi}
          subtext="Perpindahan domisili warga"
          metaItems={['Log Audit Kependudukan']}
        />
      </div>

      {/* Tabel Riwayat Log Peristiwa */}
      <BoardSurface padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-separator-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              Tabel Riwayat Log Peristiwa &amp; Audit Dinamika Penduduk
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Catatan kronologis seluruh peristiwa vital di wilayah penugasan Anda.
            </p>
          </div>

          <BoardSegmentedControl
            ariaLabel="Filter jenis peristiwa vital"
            value={jenisFilter}
            onChange={setJenisFilter}
            options={[
              { value: 'SEMUA', label: 'Semua', count: scopedEvents.length },
              { value: 'KELAHIRAN', label: 'Kelahiran', count: countKelahiran },
              { value: 'KEHAMILAN', label: 'Kehamilan' },
              { value: 'NIFAS', label: 'Nifas' },
              { value: 'KEMATIAN', label: 'Kematian', count: countKematian },
            ]}
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-6">
            <BoardEmptyState
              title="Belum Ada Catatan Peristiwa pada Kategori Ini"
              description="Gunakan tombol Catat Kelahiran Bayi atau Catat Kematian Warga di atas untuk merekam dinamika penduduk baru."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bui-table w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-separator-border text-text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Jenis Peristiwa</th>
                  <th className="py-3 px-4 font-semibold">Subjek Warga (L/P)</th>
                  <th className="py-3 px-4 font-semibold">Keluarga (KK) &amp; Wilayah</th>
                  <th className="py-3 px-4 font-semibold">Rincian Medis / Keterangan Otomasi</th>
                  <th className="py-3 px-4 font-semibold">Petugas Pencatat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator-border">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-surface-subtle/40">
                    <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                      {evt.tanggalPeristiwa}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <BoardStatusLabel
                        tone={
                          evt.jenis === 'KELAHIRAN'
                            ? 'nominal'
                            : evt.jenis === 'KEMATIAN'
                            ? 'danger'
                            : 'warning'
                        }
                        label={evt.jenis.replace('_', ' ')}
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {evt.namaSubjek} ({evt.jenisKelamin})
                      {evt.nikBayi && (
                        <div className="font-mono tabular-nums text-[11px] text-accent-600 dark:text-accent-400 font-normal">
                          NIK: {evt.nikBayi}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-text-primary">
                        KK {evt.namaKepalaKeluarga}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">
                        RT {evt.rt}/RW {evt.rw} · Dusun {evt.dusun}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary max-w-md leading-relaxed">
                      {evt.keterangan}
                    </td>
                    <td className="py-3 px-4 text-text-muted">{evt.dicatatOleh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BoardSurface>

      {/* Dialog Pencatatan Kelahiran Bayi */}
      <BoardModal
        isOpen={isBirthModalOpen}
        onClose={() => setIsBirthModalOpen(false)}
        title="Dialog Pencatatan Kelahiran Bayi (Lampiran 4.18 PKK)"
        subtitle="Otomasi Sistem: Bayi akan otomatis ditambahkan ke daftar anggota keluarga (Jiwa) pada KK yang dipilih."
      >
        <form onSubmit={handleSubmitBirth} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="birth-select-kk"
              className="block font-semibold text-text-primary mb-1"
            >
              Pilih Keluarga / Kepala Rumah Tangga Terdaftar
            </label>
            <select
              id="birth-select-kk"
              value={birthFamId}
              onChange={(e) => {
                const fId = e.target.value;
                setBirthFamId(fId);
                const fam = scopedFamilies.find((f) => f.id === fId);
                const mother = fam?.anggota.find(
                  (a) => a.hubungan === 'ISTRI' || a.jenisKelamin === 'P'
                );
                if (mother) setNamaIbu(mother.nama);
              }}
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
            >
              {scopedFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  KK {f.namaKepalaKeluarga} ({f.noKK}) — RT {f.rt}/RW {f.rw} ({f.namaDasawisma})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="birth-nama-ibu"
                className="block font-semibold text-text-primary mb-1"
              >
                Nama Ibu Melahirkan
              </label>
              <input
                id="birth-nama-ibu"
                type="text"
                required
                value={namaIbu}
                onChange={(e) => setNamaIbu(e.target.value)}
                className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
              />
            </div>

            <div>
              <label
                htmlFor="birth-nama-bayi"
                className="block font-semibold text-text-primary mb-1"
              >
                Nama Lengkap Bayi Baru Lahir
              </label>
              <input
                id="birth-nama-bayi"
                type="text"
                required
                placeholder="Contoh: Kirana Putri Santoso"
                value={namaBayi}
                onChange={(e) => setNamaBayi(e.target.value)}
                className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
              />
            </div>

            <div>
              <label htmlFor="birth-jk" className="block font-semibold text-text-primary mb-1">
                Jenis Kelamin Bayi
              </label>
              <select
                id="birth-jk"
                value={jkBayi}
                onChange={(e) => setJkBayi(e.target.value as 'L' | 'P')}
                className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label htmlFor="birth-tgl" className="block font-semibold text-text-primary mb-1">
                Tanggal Lahir
              </label>
              <input
                id="birth-tgl"
                type="date"
                required
                value={tglLahirBayi}
                onChange={(e) => setTglLahirBayi(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-background-tertiary-default border border-border-button-default rounded-2lg"
              />
            </div>

            <div>
              <label htmlFor="birth-bb" className="block font-semibold text-text-primary mb-1">
                Berat Badan Lahir (kg)
              </label>
              <input
                id="birth-bb"
                type="number"
                step="0.1"
                value={beratBadan}
                placeholder="Contoh: 3.2"
                onChange={(e) => setBeratBadan(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums bg-background-tertiary-default border border-border-button-default rounded-2lg"
              />
            </div>

            <div>
              <label htmlFor="birth-lk" className="block font-semibold text-text-primary mb-1">
                Lingkar Kepala (cm)
              </label>
              <input
                id="birth-lk"
                type="number"
                step="0.5"
                value={lingkarKepala}
                placeholder="Contoh: 34"
                onChange={(e) => setLingkarKepala(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums bg-background-tertiary-default border border-border-button-default rounded-2lg"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-subtle border border-separator-border space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer font-semibold">
              <span>Terbitkan Virtual NIK Sementara Otomatis (16 Digit)</span>
              <input
                type="checkbox"
                checked={useVirtualNik}
                onChange={(e) => setUseVirtualNik(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
            </label>
            {useVirtualNik && (
              <div className="font-mono tabular-nums text-accent-600 dark:text-accent-400">
                Pratinjau Virtual NIK:{' '}
                <strong>
                  {generateVirtualNik(
                    tglLahirBayi,
                    jkBayi,
                    (selectedBirthFam?.anggota.length || 1) + 1
                  )}
                </strong>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <BoardButton
              variant="outline"
              size="sm"
              onClick={() => setIsBirthModalOpen(false)}
            >
              Batal
            </BoardButton>
            <BoardButton type="submit" variant="primary" size="sm" disabled={isLoading}>
              Simpan Kelahiran &amp; Tambah ke KK
            </BoardButton>
          </div>
        </form>
      </BoardModal>

      {/* Dialog Pencatatan Kematian Warga */}
      <BoardModal
        isOpen={isMortalityModalOpen}
        onClose={() => setIsMortalityModalOpen(false)}
        title="Dialog Pencatatan Kematian Warga (Lampiran 4.18 PKK)"
        subtitle="Otomasi Sistem: Status anggota keluarga yang wafat akan otomatis diubah menjadi arsip (MENINGGAL)."
      >
        <form onSubmit={handleSubmitMortality} className="space-y-4 text-xs">
          <div>
            <label htmlFor="mort-select-kk" className="block font-semibold text-text-primary mb-1">
              Pilih Keluarga (KK)
            </label>
            <select
              id="mort-select-kk"
              value={mortFamId}
              onChange={(e) => {
                const fId = e.target.value;
                setMortFamId(fId);
                const fam = scopedFamilies.find((f) => f.id === fId);
                const firstLiving = fam?.anggota.find((a) => a.statusHidup === 'HIDUP');
                setMortAnggotaId(firstLiving?.id || '');
              }}
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            >
              {scopedFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  KK {f.namaKepalaKeluarga} ({f.noKK}) — RT {f.rt}/RW {f.rw}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mort-select-member"
              className="block font-semibold text-text-primary mb-1"
            >
              Pilih Anggota Keluarga yang Wafat
            </label>
            <select
              id="mort-select-member"
              value={mortAnggotaId || livingMortMembers[0]?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                setMortAnggotaId(val);
                const mem = livingMortMembers.find((m) => m.id === val);
                if (mem) {
                  if (mem.umur < 1) {
                    setKategoriKematian('BAYI');
                  } else if (mem.umur <= 5) {
                    setKategoriKematian('BALITA');
                  } else if (mem.isIbuHamil) {
                    setKategoriKematian('IBU_HAMIL_MELAHIRKAN');
                  } else {
                    setKategoriKematian('WARGA_UMUM');
                  }
                }
              }}
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            >
              {livingMortMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama} ({m.hubungan} — {m.umur} th, NIK: {m.nik})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mort-tgl" className="block font-semibold text-text-primary mb-1">
                Tanggal Peristiwa Wafat
              </label>
              <input
                id="mort-tgl"
                type="date"
                required
                value={tglKematian}
                onChange={(e) => setTglKematian(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-background-tertiary-default border border-border-button-default rounded-2lg"
              />
            </div>

            <div>
              <label htmlFor="mort-kat" className="block font-semibold text-text-primary mb-1">
                Kategori Buku Kematian PKK
              </label>
              <select
                id="mort-kat"
                value={kategoriKematian}
                onChange={(e) =>
                  setKategoriKematian(
                    e.target.value as MortalityEventInput['kategoriKematian']
                  )
                }
                className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
              >
                <option value="WARGA_UMUM">Warga Umum / Lansia</option>
                <option value="IBU_HAMIL_MELAHIRKAN">Ibu Hamil / Melahirkan / Nifas</option>
                <option value="BAYI">Bayi (&lt; 1 Tahun)</option>
                <option value="BALITA">Balita (1 – 5 Tahun)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mort-sebab" className="block font-semibold text-text-primary mb-1">
              Penyebab Kematian &amp; Keterangan
            </label>
            <input
              id="mort-sebab"
              type="text"
              required
              placeholder="Contoh: Sakit / Usia Lanjut di RSUD Ngawi"
              value={penyebabKematian}
              onChange={(e) => setPenyebabKematian(e.target.value)}
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <BoardButton
              variant="outline"
              size="sm"
              onClick={() => setIsMortalityModalOpen(false)}
            >
              Batal
            </BoardButton>
            <BoardButton type="submit" variant="danger" size="sm" disabled={isLoading}>
              Catat Kematian &amp; Arsipkan Jiwa
            </BoardButton>
          </div>
        </form>
      </BoardModal>

      {/* General Vital Event Modal */}
      <BoardModal
        isOpen={isGeneralModalOpen}
        onClose={() => setIsGeneralModalOpen(false)}
        title="Pencatatan Kehamilan Baru, Masa Nifas, atau Mutasi Warga"
      >
        <form onSubmit={handleSubmitGeneral} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Jenis Peristiwa
            </label>
            <select
              value={genJenis}
              onChange={(e) =>
                setGenJenis(e.target.value as 'KEHAMILAN' | 'NIFAS' | 'MUTASI_KELUAR')
              }
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            >
              <option value="KEHAMILAN">Kehamilan Ibu (Pemantauan P4K)</option>
              <option value="NIFAS">Masa Nifas Ibu Melahirkan</option>
              <option value="MUTASI_KELUAR">Mutasi Pindah Domisili Keluar</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Pilih Keluarga (KK)
            </label>
            <select
              value={genFamId}
              onChange={(e) => setGenFamId(e.target.value)}
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            >
              {scopedFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  KK {f.namaKepalaKeluarga} — RT {f.rt}/RW {f.rw} ({f.namaDasawisma})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Nama Subjek Warga
            </label>
            <input
              type="text"
              required
              value={genNamaSubjek}
              onChange={(e) => setGenNamaSubjek(e.target.value)}
              placeholder="Masukkan nama ibu hamil / warga..."
              className="w-full px-3 py-2 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Keterangan Pemeriksaan / Rincian
            </label>
            <textarea
              rows={3}
              required
              value={genKeterangan}
              onChange={(e) => setGenKeterangan(e.target.value)}
              placeholder="Contoh: Kehamilan trimester 2, telah dipasang Stiker P4K..."
              className="w-full p-3 bg-background-tertiary-default border border-border-button-default rounded-2lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <BoardButton
              variant="outline"
              size="sm"
              onClick={() => setIsGeneralModalOpen(false)}
            >
              Batal
            </BoardButton>
            <BoardButton type="submit" variant="primary" size="sm" disabled={isLoading}>
              Simpan Log Peristiwa
            </BoardButton>
          </div>
        </form>
      </BoardModal>
    </div>
  );
}
