'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  Save,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Send,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import {
  AppRoute,
  AnggotaKeluarga,
  KeluargaRecord,
  KriteriaRumah,
  MakananPokok,
  OfficerAccount,
  SumberAir,
  UserRole,
  Wilayah,
  calculateAge,
  computeHouseholdSeverity,
  extractUniqueDusun,
  generateVirtualNik,
  getRbacPermissions,
} from '@/lib/domain';
import {
  BoardButton,
  BoardSurface,
  BoardCallout,
  BoardStatusLabel,
  BoardChip,
} from '@/components/simpatik';
import { PublicLayout } from '@/components/layout/PublicLayout';
import {
  saveKeluargaAction,
  KeluargaInputData,
  AnggotaInputData,
  HatinyaPkkInput,
  IndustriRumahTanggaInput,
} from '@/actions/keluargaActions';
import { getWilayahListWithCounts } from '@/actions/wilayahActions';
import { getCurrentSessionUserAction } from '@/actions/authActions';

export const STORAGE_KEY = 'simpatik_grudo_formulir_draft_v1';

export interface DraftFormState {
  step: number;
  wilayahId: string;
  noKK: string;
  namaKepalaKeluarga: string;
  alamat: string;
  latitude: number;
  longitude: number;
  // Step 2: Sanitasi
  kriteriaRumah: KriteriaRumah;
  punyaJamban: boolean;
  jumlahJamban: number;
  sumberAir: SumberAir;
  punyaSpal: boolean;
  punyaTempatSampah: boolean;
  tempelStikerP4k: boolean;
  // Step 3: Anggota
  anggota: AnggotaKeluarga[];
  // Step 4: Pekarangan & UP2K
  tanamanKeras: boolean;
  toga: boolean;
  sayuran: boolean;
  perikanan: boolean;
  peternakan: boolean;
  industriRumahTangga: ('PANGAN' | 'SANDANG' | 'KERAJINAN' | 'JASA')[];
  ikutUp2k: boolean;
  jenisUsahaUp2k: string;
  makananPokok: MakananPokok;
}

export function createDefaultFormState(defaultWilayahId: string): DraftFormState {
  return {
    step: 1,
    wilayahId: defaultWilayahId,
    noKK: '',
    namaKepalaKeluarga: '',
    alamat: '',
    latitude: -7.4066,
    longitude: 111.4395,
    kriteriaRumah: 'SEHAT',
    punyaJamban: true,
    jumlahJamban: 1,
    sumberAir: 'PDAM',
    punyaSpal: true,
    punyaTempatSampah: true,
    tempelStikerP4k: true,
    anggota: [
      {
        id: 'ang-init-1',
        nama: '',
        nik: '',
        isVirtualNik: false,
        hubungan: 'KEPALA_KELUARGA',
        jenisKelamin: 'L',
        tempatLahir: '',
        tanggalLahir: '',
        umur: 0,
        statusKawin: 'KAWIN',
        agama: 'ISLAM',
        pendidikan: 'SMA',
        pekerjaan: '',
        isBalita: false,
        isLansia: false,
        isIbuHamil: false,
        isIbuMenyusui: false,
        isButaAksara: false,
        isDisabilitas: false,
        statusHidup: 'HIDUP',
        akseptorKb: false,
      },
    ],
    tanamanKeras: true,
    toga: true,
    sayuran: true,
    perikanan: false,
    peternakan: false,
    industriRumahTangga: ['PANGAN'],
    ikutUp2k: false,
    jenisUsahaUp2k: '',
    makananPokok: 'BERAS',
  };
}

function mapKriteriaRumah(kr: string): string {
  if (kr === 'TIDAK_SEHAT') return 'TIDAK_SEHAT_LAYAK_HUNI';
  return kr;
}

function mapSumberAir(sa: string): string {
  if (sa === 'SUMUR_GALI' || sa === 'SUMUR_POMPA') return 'SUMUR';
  if (sa === 'MATA_AIR') return 'LAINNYA';
  if (sa === 'PDAM' || sa === 'SUNGAI') return sa;
  return 'SUMUR';
}

function mapPendidikan(pend: string): string {
  switch (pend) {
    case 'TIDAK_SEKOLAH':
      return 'TIDAK_TAMAT_SD';
    case 'SD':
      return 'SD_MI';
    case 'SMP':
      return 'SMP_SEDERAJAT';
    case 'SMA':
      return 'SMA_SMK_SEDERAJAT';
    case 'DIPLOMA':
      return 'DIPLOMA';
    case 'S1_S2_S3':
      return 'S1';
    default:
      return 'SMA_SMK_SEDERAJAT';
  }
}

function mapPekerjaan(pek: string): string {
  const lower = (pek || '').toLowerCase();
  if (lower.includes('petani')) return 'PETANI';
  if (lower.includes('dagang')) return 'PEDAGANG';
  if (lower.includes('pns') || lower.includes('pegawai negeri')) return 'PNS';
  if (lower.includes('tni') || lower.includes('polri') || lower.includes('polisi')) return 'TNI_POLRI';
  if (lower.includes('wirausaha') || lower.includes('wiraswasta')) return 'WIRAUSAHA';
  if (
    lower.includes('tidak') ||
    lower.includes('belum') ||
    lower.includes('pelajar') ||
    lower.includes('ibu rumah')
  ) {
    return 'TIDAK_BEKERJA';
  }
  if (lower.includes('swasta')) return 'SWASTA';
  return 'SWASTA';
}

function mapStatusKawin(sk: string, jk: 'L' | 'P'): string {
  if (sk === 'KAWIN') return 'KAWIN';
  if (sk === 'BELUM_KAWIN') return 'BELUM_KAWIN';
  if (sk === 'CERAI_HIDUP' || sk === 'CERAI_MATI') {
    return jk === 'P' ? 'JANDA' : 'DUDA';
  }
  return 'BELUM_KAWIN';
}

export function validateFormStep(
  stepToCheck: number,
  form: Pick<DraftFormState, 'noKK' | 'namaKepalaKeluarga' | 'alamat' | 'anggota'>
): { valid: boolean; error?: string } {
  if (stepToCheck === 1) {
    if (!form.noKK || form.noKK.trim().length !== 16 || !/^\d{16}$/.test(form.noKK.trim())) {
      return { valid: false, error: 'Nomor Kartu Keluarga (KK) wajib terdiri dari 16 digit angka.' };
    }
    if (!form.namaKepalaKeluarga.trim()) {
      return { valid: false, error: 'Nama Kepala Rumah Tangga wajib diisi.' };
    }
    if (!form.alamat.trim()) {
      return { valid: false, error: 'Alamat rumah lengkap wajib diisi.' };
    }
  }
  if (stepToCheck === 3) {
    if (form.anggota.length === 0) {
      return { valid: false, error: 'Minimal terdapat 1 anggota keluarga (Kepala Keluarga).' };
    }
    for (let i = 0; i < form.anggota.length; i++) {
      const m = form.anggota[i];
      if (!m.nama.trim()) {
        return { valid: false, error: `Nama lengkap anggota keluarga ke-${i + 1} wajib diisi.` };
      }
      const trimmedNik = m.nik ? m.nik.trim() : '';
      const isVirtual = Boolean(m.isVirtualNik) || trimmedNik.startsWith('TEMP-');
      const isValidNik = isVirtual ? trimmedNik.startsWith('TEMP-') : trimmedNik.length === 16;
      if (!isValidNik) {
        return {
          valid: false,
          error: `NIK anggota keluarga "${m.nama || i + 1}" wajib 16 digit (atau gunakan tombol Generate NIK Virtual Otomatis).`,
        };
      }
    }
  }
  return { valid: true };
}

export interface PublicFormulirProps {
  wilayahList?: Wilayah[];
  initialWilayahId?: string;
  initialStep?: number;
  initialDraft?: Partial<DraftFormState>;
  initialSubmittedRecord?: KeluargaRecord | null;
  currentUser?: OfficerAccount | null;
  currentRole?: UserRole;
  onSubmitFamily?: (record: KeluargaRecord) => void;
  onNavigate?: (route: AppRoute) => void;
}

export function PublicFormulir({
  wilayahList: initialWilayahProp,
  initialWilayahId: propInitialWilayahId,
  initialStep,
  initialDraft,
  initialSubmittedRecord = null,
  currentUser: propCurrentUser = null,
  currentRole: propCurrentRole = 'WARGA',
  onSubmitFamily,
  onNavigate,
}: PublicFormulirProps = {}) {
  let router: any = null;
  let searchParams: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    // Fallback when outside Next.js Router context (e.g. tests)
  }

  const queryWilayahId = searchParams?.get?.('wilayahId') || undefined;
  const initialWilayahId = propInitialWilayahId || queryWilayahId;

  const [wilayahList, setWilayahList] = useState<Wilayah[]>(() => {
    return initialWilayahProp && initialWilayahProp.length > 0
      ? initialWilayahProp
      : [];
  });

  const [currentUser, setCurrentUser] = useState<OfficerAccount | null>(propCurrentUser);
  const [currentRole, setCurrentRole] = useState<UserRole>(propCurrentRole);

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
      setCurrentRole(propCurrentRole);
      return;
    }
    let isMounted = true;
    getCurrentSessionUserAction().then((sessionUser) => {
      if (!isMounted || !sessionUser) return;
      const role = sessionUser.peran as UserRole;
      setCurrentUser(sessionUser as any);
      setCurrentRole(role);
      if (sessionUser.wilayahId && !propInitialWilayahId) {
        setForm((prev) => ({
          ...prev,
          wilayahId: sessionUser.wilayahId || prev.wilayahId,
        }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [propCurrentUser, propCurrentRole, propInitialWilayahId]);

  const perms = getRbacPermissions(currentRole, currentUser);
  const defaultWilId =
    initialWilayahId || currentUser?.wilayahId || wilayahList[0]?.id || 'wil-rt01-rw01';

  const [form, setForm] = useState<DraftFormState>(() => {
    let savedData: any = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          savedData = JSON.parse(saved);
        }
      } catch {
        // ignore storage errors
      }
    }
    const base = createDefaultFormState(defaultWilId);
    return {
      ...base,
      ...(savedData || {}),
      ...(initialDraft || {}),
      step: initialStep || initialDraft?.step || savedData?.step || 1,
      wilayahId: initialWilayahId || initialDraft?.wilayahId || savedData?.wilayahId || defaultWilId,
    };
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>('Tersimpan di Perangkat');
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        return Boolean(localStorage.getItem(STORAGE_KEY));
      } catch { return false; }
    }
    return false;
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<KeluargaRecord | null>(
    initialSubmittedRecord
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAgreed, setIsAgreed] = useState<boolean>(true);

  // Sync wilayah from database if not provided via props
  useEffect(() => {
    let isMounted = true;
    if (!initialWilayahProp || initialWilayahProp.length === 0) {
      getWilayahListWithCounts()
        .then((list) => {
          if (isMounted && list && list.length > 0) {
            setWilayahList(
              list.map((w: any) => ({
                id: w.id,
                dusun: w.dusun,
                rw: w.rw,
                rt: w.rt,
                namaDasawisma: w.namaDasawisma,
                aktif: true,
                ketuaDasawisma: w.ketuaNama || `Ibu RT ${w.rt}`,
                targetKK: 25,
              }))
            );
          }
        })
        .catch(() => {
          // Fallback to INITIAL_WILAYAH
        });
    }
    return () => {
      isMounted = false;
    };
  }, [initialWilayahProp]);

  // Sync initialWilayahId if changed from outside
  useEffect(() => {
    if (initialWilayahId) {
      setForm((prev) => ({ ...prev, wilayahId: initialWilayahId }));
    }
  }, [initialWilayahId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      const now = new Date();
      setLastSavedTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    } catch {
      // ignore
    }
  }, [form]);

  const handleNav = (route: AppRoute) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }
    if (router?.push) {
      router.push(route);
    } else if (typeof window !== 'undefined') {
      window.location.href = route;
    }
  };

  // RBAC check: Pengurus RW & Pengurus Dusun cannot submit form per RBAC Matrix
  if (!perms.canSubmitFormulir) {
    return (
      <PublicLayout
        currentRoute="/formulir"
        currentUser={currentUser}
        currentRole={currentRole}
        onNavigate={handleNav}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <BoardCallout
            tone="warning"
            title="Akses Input Formulir Dibatasi"
            description={`Peran aktif Anda (${currentRole}) memiliki wewenang Monitoring & Rekapitulasi Wilayah, namun tidak melakukan input formulir keluarga. Input formulir hanya dilakukan oleh Warga Mandiri, Kader RT, atau Admin Desa.`}
            action={
              <BoardButton variant="primary" size="sm" onClick={() => handleNav('/dashboard')}>
                Kembali ke Dashboard
              </BoardButton>
            }
          />
        </div>
      </PublicLayout>
    );
  }

  const defaultSafeWilayah: Wilayah = {
    id: 'default',
    dusun: 'Grudo',
    rw: '01',
    rt: '01',
    namaDasawisma: 'Melati',
    aktif: true,
    ketuaDasawisma: 'Kader Dasawisma',
    targetKK: 25,
  };

  const selectedWilayah =
    wilayahList.find((w) => w.id === form.wilayahId) || wilayahList[0] || defaultSafeWilayah;

  const handleResetDraft = () => {
    const fresh = createDefaultFormState(defaultWilId);
    setForm(fresh);
    setValidationError(null);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const validateCurrentStep = (stepToCheck: number): boolean => {
    setValidationError(null);
    const result = validateFormStep(stepToCheck, form);
    if (!result.valid) {
      setValidationError(result.error || 'Isian formulir belum lengkap.');
      return false;
    }
    return true;
  };

    const goNextStep = () => {
    if (!validateCurrentStep(form.step)) return;
    setForm((prev) => ({ ...prev, step: Math.min(5, prev.step + 1) }));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrevStep = () => {
    setValidationError(null);
    setForm((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Member manipulation
  const updateMember = (index: number, patch: Partial<AnggotaKeluarga>) => {
    setForm((prev) => {
      const next = [...prev.anggota];
      const updated = { ...next[index], ...patch };
      if (patch.tanggalLahir !== undefined) {
        const computedAge = calculateAge(patch.tanggalLahir);
        updated.umur = computedAge;
        updated.isBalita = computedAge < 5;
        updated.isLansia = computedAge >= 60;
      }
      next[index] = updated;
      return { ...prev, anggota: next };
    });
  };

  const addMember = (isNewbornPreset: boolean = false) => {
    const today = new Date().toISOString().slice(0, 10);
    const seq = form.anggota.length + 1;
    const virtualNik = generateVirtualNik(today, 'P', seq);

    const newMember: AnggotaKeluarga = isNewbornPreset
      ? {
          id: `ang-${Date.now()}`,
          nama: '',
          nik: virtualNik,
          isVirtualNik: true,
          hubungan: 'ANAK',
          jenisKelamin: 'P',
          tempatLahir: 'Ngawi',
          tanggalLahir: today,
          umur: 0,
          statusKawin: 'BELUM_KAWIN',
          agama: 'ISLAM',
          pendidikan: 'TIDAK_SEKOLAH',
          pekerjaan: 'Belum Bekerja',
          isBalita: true,
          isLansia: false,
          isIbuHamil: false,
          isIbuMenyusui: false,
          isButaAksara: false,
          isDisabilitas: false,
          statusHidup: 'HIDUP',
          akseptorKb: false,
        }
      : {
          id: `ang-${Date.now()}`,
          nama: '',
          nik: '',
          isVirtualNik: false,
          hubungan: seq === 2 ? 'ISTRI' : 'ANAK',
          jenisKelamin: seq === 2 ? 'P' : 'L',
          tempatLahir: '',
          tanggalLahir: '',
          umur: 0,
          statusKawin: seq === 2 ? 'KAWIN' : 'BELUM_KAWIN',
          agama: 'ISLAM',
          pendidikan: seq === 2 ? 'SMA' : 'SD',
          pekerjaan: '',
          isBalita: false,
          isLansia: false,
          isIbuHamil: false,
          isIbuMenyusui: false,
          isButaAksara: false,
          isDisabilitas: false,
          statusHidup: 'HIDUP',
          akseptorKb: false,
        };

    setForm((prev) => ({ ...prev, anggota: [...prev.anggota, newMember] }));
  };

  const removeMember = (index: number) => {
    if (form.anggota.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      anggota: prev.anggota.filter((_, i) => i !== index),
    }));
  };

  const toggleIndustri = (item: 'PANGAN' | 'SANDANG' | 'KERAJINAN' | 'JASA') => {
    setForm((prev) => {
      const exists = prev.industriRumahTangga.includes(item);
      return {
        ...prev,
        industriRumahTangga: exists
          ? prev.industriRumahTangga.filter((i) => i !== item)
          : [...prev.industriRumahTangga, item],
      };
    });
  };

  const handleFinalSubmit = async () => {
    if (!validateCurrentStep(1) || !validateCurrentStep(3)) return;

    if (!isAgreed) {
      setValidationError('Silakan centang pernyataan kebenaran data keluarga sebelum mengirim.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const isAutoVerified = perms.formulirAutoVerified;
    const newRecord: KeluargaRecord = {
      id: `fam-${Date.now()}`,
      noKK: form.noKK.trim(),
      namaKepalaKeluarga: form.namaKepalaKeluarga.trim(),
      wilayahId: selectedWilayah.id,
      dusun: selectedWilayah.dusun,
      rw: selectedWilayah.rw,
      rt: selectedWilayah.rt,
      namaDasawisma: selectedWilayah.namaDasawisma,
      alamat: form.alamat.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      tahunPendataan: 2026,
      status: isAutoVerified ? 'VERIFIKASI' : 'DRAFT',
      diinputOleh:
        currentRole === 'ADMIN_DESA'
          ? 'ADMIN_DESA'
          : currentRole === 'KADER_RT'
          ? 'KADER_RT'
          : 'WARGA_MANDIRI',
      tanggalInput: new Date().toISOString().slice(0, 10),
      tanggalUpdate: new Date().toISOString().slice(0, 10),
      sanitasi: {
        kriteriaRumah: form.kriteriaRumah,
        punyaJamban: form.punyaJamban,
        jumlahJamban: form.punyaJamban ? Math.max(1, form.jumlahJamban) : 0,
        sumberAir: form.sumberAir,
        punyaSpal: form.punyaSpal,
        punyaTempatSampah: form.punyaTempatSampah,
        tempelStikerP4k: form.tempelStikerP4k,
      },
      pekarangan: {
        tanamanKeras: form.tanamanKeras,
        toga: form.toga,
        sayuran: form.sayuran,
        perikanan: form.perikanan,
        peternakan: form.peternakan,
        industriRumahTangga: form.industriRumahTangga,
        ikutUp2k: form.ikutUp2k,
        jenisUsahaUp2k: form.ikutUp2k ? form.jenisUsahaUp2k || 'Usaha Mandiri PKK' : undefined,
        makananPokok: form.makananPokok,
      },
      anggota: form.anggota.map((a, idx) => ({
        ...a,
        nama: a.nama.trim() || (idx === 0 ? form.namaKepalaKeluarga.trim() : `Anggota ${idx + 1}`),
      })),
    };

    try {
      const hatinyaPkkList: HatinyaPkkInput[] = [];
      if (form.toga) {
        hatinyaPkkList.push({ kategori: 'TOGA', komoditi: 'Tanaman Obat Keluarga', jumlah: '1' });
      }
      if (form.sayuran) {
        hatinyaPkkList.push({ kategori: 'WARUNG_HIDUP', komoditi: 'Sayuran', jumlah: '1' });
      }
      if (form.tanamanKeras) {
        hatinyaPkkList.push({ kategori: 'LUMBUNG_HIDUP', komoditi: 'Tanaman Keras / Buah', jumlah: '1' });
      }
      if (form.perikanan) {
        hatinyaPkkList.push({ kategori: 'PERIKANAN', komoditi: 'Perikanan Air Tawar', jumlah: '1' });
      }
      if (form.peternakan) {
        hatinyaPkkList.push({ kategori: 'PETERNAKAN', komoditi: 'Peternakan', jumlah: '1' });
      }

      const industriList: IndustriRumahTanggaInput[] = form.industriRumahTangga.map((kat) => ({
        kategori: kat,
        komoditi: `Industri Rumah Tangga ${kat}`,
        volume: '1',
      }));

      const anggotaPayload: AnggotaInputData[] = form.anggota.map((a, idx) => ({
        id: a.id,
        nama: a.nama.trim() || (idx === 0 ? form.namaKepalaKeluarga.trim() : `Anggota ${idx + 1}`),
        nik: a.nik.trim(),
        isNikSementara: Boolean(a.isVirtualNik || a.nik.trim().startsWith('TEMP-') || !a.nik.trim()),
        isIbuHamil: Boolean(a.isIbuHamil),
        hubunganKeluarga: a.hubungan,
        jenisKelamin: a.jenisKelamin,
        tempatLahir: a.tempatLahir || 'Ngawi',
        tanggalLahir: a.tanggalLahir,
        statusPerkawinan: mapStatusKawin(a.statusKawin, a.jenisKelamin),
        agama: a.agama || 'ISLAM',
        pendidikan: mapPendidikan(a.pendidikan),
        pekerjaan: mapPekerjaan(a.pekerjaan),
        disabilitas: a.isDisabilitas,
        tigaButa: a.isButaAksara,
        akseptorKb: Boolean(a.akseptorKb),
      }));

      const payload: KeluargaInputData = {
        noKk: form.noKK.trim(),
        namaKepalaRumahTangga: form.namaKepalaKeluarga.trim(),
        alamat: form.alamat.trim(),
        wilayahId: selectedWilayah.id,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        kriteriaRumah: mapKriteriaRumah(form.kriteriaRumah),
        jambanKeluarga: form.punyaJamban,
        jumlahJamban: form.punyaJamban ? Math.max(1, form.jumlahJamban) : 0,
        sumberAir: mapSumberAir(form.sumberAir),
        spal: form.punyaSpal,
        tempatSampah: form.punyaTempatSampah,
        stikerP4k: form.tempelStikerP4k,
        makananPokok: form.makananPokok,
        aktivitasUp2k: form.ikutUp2k,
        jenisUsahaUp2k: form.ikutUp2k ? form.jenisUsahaUp2k || 'Usaha Mandiri PKK' : null,
        statusData: isAutoVerified ? 'VERIFIKASI' : 'DRAFT',
        anggota: anggotaPayload,
        hatinyaPkk: hatinyaPkkList,
        industriRumahTangga: industriList,
      };

      const res = await saveKeluargaAction(payload, !isAutoVerified);
      if (!res.success) {
        setValidationError(res.error || 'Gagal menyimpan data keluarga ke sistem.');
        setIsSubmitting(false);
        return;
      }

      if (onSubmitFamily) {
        onSubmitFamily(newRecord);
      }

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }

      setSubmittedRecord(newRecord);
    } catch (err: any) {
      setValidationError(err.message || 'Terjadi kesalahan sistem saat mengirim formulir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1:1 Confirmation Screen on Submit Success
  if (submittedRecord) {
    return (
      <PublicLayout
        currentRoute="/formulir"
        currentUser={currentUser}
        currentRole={currentRole}
        onNavigate={handleNav}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <BoardSurface padding="lg" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-separator-border pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-accent-600 dark:text-accent-400">
                    Bukti Penerimaan Berkas SIMPATIK Desa Grudo
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary mt-0.5">
                    Data Keluarga Berhasil Dikirim
                  </h1>
                </div>
              </div>
              <BoardStatusLabel
                tone={submittedRecord.status === 'VERIFIKASI' ? 'nominal' : 'warning'}
                label={
                  submittedRecord.status === 'VERIFIKASI'
                    ? 'Langsung Terverifikasi (Input Petugas)'
                    : 'Status: DRAFT (Menunggu Verifikasi Kader RT)'
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-subtle p-4 rounded-xl border border-separator-border">
              <div>
                <span className="text-text-muted block">Kepala Rumah Tangga</span>
                <span className="font-semibold text-text-primary text-sm">
                  {submittedRecord.namaKepalaKeluarga}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Nomor Kartu Keluarga (KK)</span>
                <span className="font-mono tabular-nums font-semibold text-text-primary text-sm">
                  {submittedRecord.noKK}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Kelompok Dasawisma &amp; Wilayah</span>
                <span className="font-medium text-text-primary">
                  {`Dasawisma ${submittedRecord.namaDasawisma} · RT ${submittedRecord.rt}/RW ${submittedRecord.rw} (Dusun ${submittedRecord.dusun})`}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Jumlah Anggota Keluarga Tercatat</span>
                <span className="font-mono tabular-nums font-medium text-text-primary">
                  {`${submittedRecord.anggota.length} Jiwa`}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {submittedRecord.status === 'DRAFT'
                ? 'Data keluarga Anda telah masuk ke Antrean Verifikasi Kader RT setempat. Ibu Kader Dasawisma akan memvalidasi berkas ini agar terdata dalam Rekapitulasi 31 Sheet Buku Dasawisma Desa Grudo.'
                : 'Karena Anda login sebagai Petugas Resmi (Kader RT / Admin Desa), data ini otomatis berstatus VERIFIKASI dan langsung masuk ke dalam agregasi Buku Dasawisma.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <BoardButton
                variant="primary"
                onClick={() => {
                  setSubmittedRecord(null);
                  handleResetDraft();
                }}
              >
                Isi Formulir Keluarga Lainnya
              </BoardButton>
              <BoardButton
                variant="outline"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.print();
                  }
                }}
              >
                Cetak Bukti Registrasi
              </BoardButton>
              {perms.canAccessDashboard ? (
                <BoardButton variant="secondary" onClick={() => handleNav('/dashboard')}>
                  Buka Dashboard Petugas
                </BoardButton>
              ) : (
                <BoardButton variant="outline" onClick={() => handleNav('/')}>
                  Kembali ke Beranda
                </BoardButton>
              )}
            </div>
          </BoardSurface>
        </div>
      </PublicLayout>
    );
  }

  const steps = [
    { num: 1, title: 'Wilayah & Bangunan' },
    { num: 2, title: 'Sanitasi & Lingkungan' },
    { num: 3, title: 'Anggota Keluarga' },
    { num: 4, title: 'Pekarangan & UP2K' },
    { num: 5, title: 'Konfirmasi & Pengiriman' },
  ];

  // Build preview record for Step 5 severity calculation
  const previewRecord: KeluargaRecord = {
    id: 'preview',
    noKK: form.noKK,
    namaKepalaKeluarga: form.namaKepalaKeluarga || 'Belum Diisi',
    wilayahId: selectedWilayah.id,
    dusun: selectedWilayah.dusun,
    rw: selectedWilayah.rw,
    rt: selectedWilayah.rt,
    namaDasawisma: selectedWilayah.namaDasawisma,
    alamat: form.alamat,
    latitude: form.latitude,
    longitude: form.longitude,
    tahunPendataan: 2026,
    status: perms.formulirAutoVerified ? 'VERIFIKASI' : 'DRAFT',
    diinputOleh: perms.formulirAutoVerified ? 'KADER_RT' : 'WARGA_MANDIRI',
    tanggalInput: new Date().toISOString().slice(0, 10),
    tanggalUpdate: new Date().toISOString().slice(0, 10),
    sanitasi: {
      kriteriaRumah: form.kriteriaRumah,
      punyaJamban: form.punyaJamban,
      jumlahJamban: form.jumlahJamban,
      sumberAir: form.sumberAir,
      punyaSpal: form.punyaSpal,
      punyaTempatSampah: form.punyaTempatSampah,
      tempelStikerP4k: form.tempelStikerP4k,
    },
    pekarangan: {
      tanamanKeras: form.tanamanKeras,
      toga: form.toga,
      sayuran: form.sayuran,
      perikanan: form.perikanan,
      peternakan: form.peternakan,
      industriRumahTangga: form.industriRumahTangga,
      ikutUp2k: form.ikutUp2k,
      jenisUsahaUp2k: form.jenisUsahaUp2k,
      makananPokok: form.makananPokok,
    },
    anggota: form.anggota,
  };
  const previewSeverity = computeHouseholdSeverity(previewRecord);

  const severityPillLabel =
    previewSeverity.severity === 'HIJAU'
      ? 'Normal'
      : previewSeverity.severity === 'KUNING'
      ? 'Pantau'
      : 'Kritis';

  return (
    <PublicLayout
      currentRoute="/formulir"
      currentUser={currentUser}
      currentRole={currentRole}
      onNavigate={handleNav}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header & Auto-Save Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator-border pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-accent-600 dark:text-accent-400 font-medium">
              <span>Engine Single Entry 5 Tahapan</span>
              <span aria-hidden="true">·</span>
              <span>
                {perms.formulirAutoVerified
                  ? 'Mode Pengisian Resmi Petugas/Kader (Status: Langsung Terverifikasi)'
                  : 'Mode Pengisian Mandiri Warga (Status: DRAFT)'}
              </span>
              {selectedWilayah && (
                <>
                  <span aria-hidden="true">·</span>
                  <BoardChip variant="caption" color="lime" className="font-semibold">
                    {`RT ${selectedWilayah.rt} / RW ${selectedWilayah.rw} — Dasawisma ${selectedWilayah.namaDasawisma}`}
                  </BoardChip>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
              Formulir Pendataan Keluarga TP PKK Desa Grudo
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span
              className="inline-flex items-center gap-1.5 text-xs text-text-muted font-mono"
              title="Draft tersimpan otomatis di perangkat"
            >
              <Save className="w-3.5 h-3.5 text-accent-600" />
              <span>
                {lastSavedTime && lastSavedTime !== 'Tersimpan di Perangkat'
                  ? `Tersimpan di Perangkat (${lastSavedTime})`
                  : 'Tersimpan di Perangkat'}
              </span>
            </span>
            <BoardButton
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetDraft}
            >
              Reset Draft
            </BoardButton>
          </div>
        </div>

        {/* Mobile Stepper (sm:hidden) */}
        <div className="block sm:hidden bg-surface-default border border-separator-border rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary mb-2">
            <span>
              Langkah {form.step} dari 5: <strong className="text-text-primary">{steps[form.step - 1]?.title}</strong>
            </span>
            <span className="font-mono text-accent-600 font-bold">{Math.round((form.step / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
            <div
              className="bg-accent-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(form.step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* 5-Step Progress Indicator (Desktop) */}
        <nav aria-label="Tahapan pengisian formulir" className="hidden sm:grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const isCurrent = form.step === s.num;
            const isCompleted = form.step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < form.step || validateCurrentStep(form.step)) {
                    setForm((prev) => ({ ...prev, step: s.num }));
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-surface-default border-accent-500 ring-1 ring-accent-500'
                    : isCompleted
                    ? 'bg-surface-subtle/80 border-separator-border text-text-primary'
                    : 'bg-surface-subtle/30 border-separator-border text-text-muted'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={isCurrent ? 'text-accent-600 font-bold' : ''}>
                    {`Langkah 0${s.num}`}
                  </span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-accent-600" />}
                </div>
                <div className="text-xs font-semibold text-text-primary truncate mt-1">
                  {s.title}
                </div>
              </button>
            );
          })}
        </nav>

                {isDraftRestored && (
          <BoardCallout
            tone="info"
            title="Ditemukan Draft Isian Sebelumnya dari Perangkat Anda"
            description="Formulir telah otomatis memulihkan data keluarga yang belum selesai dikirim. Anda dapat melanjutkan pengisian atau memulai formulir baru yang bersih."
            action={
              <BoardButton
                variant="outline"
                size="sm"
                onClick={() => {
                  handleResetDraft();
                  setIsDraftRestored(false);
                }}
              >
                Mulai Isian Baru
              </BoardButton>
            }
          />
        )}

        {validationError && (
          <BoardCallout
            tone="danger"
            title="Periksa Kembali Isian Formulir"
            description={validationError}
          />
        )}

        {/* STEP 1: WILAYAH & BANGUNAN */}
        {form.step === 1 && (
          <BoardSurface padding="lg" className="space-y-6">
            <div className="border-b border-separator-border pb-4">
              <h2 className="text-lg font-bold text-text-primary">
                01. Wilayah Administrasi &amp; Identitas Bangunan Rumah
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Pilih RT/RW, Dusun tempat tinggal Anda dan lengkapi identitas Kartu Keluarga (KK) 16 digit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="input-wilayah"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Kelompok Dasawisma / RT / RW / Dusun
                </label>
                <select
                  id="input-wilayah"
                  value={form.wilayahId}
                  onChange={(e) => setForm({ ...form, wilayahId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary focus:outline-none focus:ring-2 focus:ring-border-button-active"
                >
                  {wilayahList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {`Dasawisma ${w.namaDasawisma} — RT ${w.rt}/RW ${w.rw} (Dusun ${w.dusun})`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted mt-1">
                  {`Kader Pendamping: ${selectedWilayah?.ketuaDasawisma}`}
                </p>
              </div>

              <div>
                <label
                  htmlFor="input-nokk"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Nomor Kartu Keluarga (KK - 16 Digit)
                </label>
                <input
                  id="input-nokk"
                  type="text"
                  maxLength={16}
                  value={form.noKK}
                  onChange={(e) =>
                    setForm({ ...form, noKK: e.target.value.replace(/\D/g, '').slice(0, 16) })
                  }
                  placeholder="352109xxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary focus:outline-none focus:ring-2 focus:ring-border-button-active"
                />
                <p className="text-[11px] text-text-muted mt-1 font-mono tabular-nums">
                  {`Panjang saat ini: ${form.noKK.length} / 16 digit`}
                </p>
              </div>

              <div>
                <label
                  htmlFor="input-kepala-keluarga"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Nama Lengkap Kepala Rumah Tangga
                </label>
                <input
                  id="input-kepala-keluarga"
                  type="text"
                  value={form.namaKepalaKeluarga}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => {
                      const updatedAnggota = [...prev.anggota];
                      if (
                        updatedAnggota.length > 0 &&
                        updatedAnggota[0].hubungan === 'KEPALA_KELUARGA'
                      ) {
                        updatedAnggota[0] = { ...updatedAnggota[0], nama: val };
                      }
                      return { ...prev, namaKepalaKeluarga: val, anggota: updatedAnggota };
                    });
                  }}
                  placeholder="Contoh: Hendra Kusuma"
                  className="w-full px-3 py-2 text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary focus:outline-none focus:ring-2 focus:ring-border-button-active"
                />
              </div>

              <div>
                <label
                  htmlFor="input-alamat"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Alamat Lengkap Rumah Tinggal
                </label>
                <input
                  id="input-alamat"
                  type="text"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Raya Grudo Gang III No. 12"
                  className="w-full px-3 py-2 text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary focus:outline-none focus:ring-2 focus:ring-border-button-active"
                />
              </div>
            </div>

            {/* GPS Coordinate Tagging */}
            <div className="pt-4 border-t border-separator-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent-600" />
                    <span>Penandaan Koordinat GPS Rumah (Pemetaan Spasial GIS Desa Grudo)</span>
                  </h3>
                  <p className="text-xs text-text-muted">
                    Digunakan untuk memetakan sebaran kesehatan lingkungan dan ibu hamil/balita pada peta desa.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(extractUniqueDusun(wilayahList).length > 0
                    ? extractUniqueDusun(wilayahList)
                    : ['Krajan', 'Tegalsari']
                  ).map((dusun, idx) => {
                    const offsets: Record<string, [number, number]> = {
                      Krajan: [-7.4053, 111.4428],
                      Tegalsari: [-7.4072, 111.4398],
                      Grudo: [-7.4064, 111.4388],
                    };
                    const coords = offsets[dusun] || [-7.4064 + idx * 0.001, 111.4388 + idx * 0.001];
                    return (
                      <BoardButton
                        key={dusun}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setForm({ ...form, latitude: coords[0], longitude: coords[1] })
                        }
                      >
                        {`Titik Dusun ${dusun}`}
                      </BoardButton>
                    );
                  })}
                  <BoardButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({ ...form, latitude: -7.4064, longitude: 111.4388 })
                    }
                  >
                    Balai Desa Grudo
                  </BoardButton>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="input-lat"
                    className="block text-xs font-medium text-text-secondary mb-1"
                  >
                    Latitude (Lintang Selatan)
                  </label>
                  <input
                    id="input-lat"
                    type="number"
                    step="0.0001"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: parseFloat(e.target.value) || -7.4065 })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-subtle border border-separator-border rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-lng"
                    className="block text-xs font-medium text-text-secondary mb-1"
                  >
                    Longitude (Bujur Timur)
                  </label>
                  <input
                    id="input-lng"
                    type="number"
                    step="0.0001"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: parseFloat(e.target.value) || 111.4395 })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-subtle border border-separator-border rounded-lg text-text-primary"
                  />
                </div>
              </div>
            </div>
          </BoardSurface>
        )}

        {/* STEP 2: SANITASI & LINGKUNGAN */}
        {form.step === 2 && (
          <BoardSurface padding="lg" className="space-y-6">
            <div className="border-b border-separator-border pb-4">
              <h2 className="text-lg font-bold text-text-primary">
                02. Sanitasi &amp; Kondisi Kesehatan Lingkungan Rumah
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Pencatatan fasilitas sanitasi keluarga sesuai instrumen Pokja IV TP PKK.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="select-kriteria-rumah"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Kriteria Kesehatan Rumah
                </label>
                <select
                  id="select-kriteria-rumah"
                  value={form.kriteriaRumah}
                  onChange={(e) =>
                    setForm({ ...form, kriteriaRumah: e.target.value as KriteriaRumah })
                  }
                  className="w-full px-3 py-2 text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                >
                  <option value="SEHAT">Rumah Sehat (Ventilasi, Cahaya &amp; Sanitasi Layak)</option>
                  <option value="KURANG_SEHAT">
                    Kurang Sehat (Sebagian Indikator Belum Terpenuhi)
                  </option>
                  <option value="TIDAK_SEHAT">Tidak Sehat (Prioritas Intervensi Sanitasi)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="select-sumber-air"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Sumber Air Bersih Utama Keluarga
                </label>
                <select
                  id="select-sumber-air"
                  value={form.sumberAir}
                  onChange={(e) => setForm({ ...form, sumberAir: e.target.value as SumberAir })}
                  className="w-full px-3 py-2 text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                >
                  <option value="PDAM">PDAM / Perpipaan Resmi</option>
                  <option value="SUMUR_POMPA">Sumur Pompa / Bor</option>
                  <option value="SUMUR_GALI">Sumur Gali Terlindung</option>
                  <option value="MATA_AIR">Mata Air</option>
                  <option value="SUNGAI">Sungai / Lainnya</option>
                </select>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-surface-subtle border border-separator-border">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs font-semibold text-text-primary">
                    Memiliki Jamban Keluarga Sendiri
                  </span>
                  <input
                    type="checkbox"
                    checked={form.punyaJamban}
                    onChange={(e) => setForm({ ...form, punyaJamban: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </label>
                {form.punyaJamban && (
                  <div>
                    <label
                      htmlFor="input-jml-jamban"
                      className="block text-xs text-text-secondary mb-1"
                    >
                      Jumlah Kamar Mandi / Jamban
                    </label>
                    <input
                      id="input-jml-jamban"
                      type="number"
                      min={1}
                      max={10}
                      value={form.jumlahJamban}
                      onChange={(e) =>
                        setForm({ ...form, jumlahJamban: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-28 px-3 py-1.5 text-xs font-mono tabular-nums bg-background-tertiary-default border border-border-button-default rounded-2lg"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-surface-subtle border border-separator-border">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs font-semibold text-text-primary">
                    Saluran Pembuangan Air Limbah (SPAL) Tertutup
                  </span>
                  <input
                    type="checkbox"
                    checked={form.punyaSpal}
                    onChange={(e) => setForm({ ...form, punyaSpal: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer pt-2 border-t border-separator-border">
                  <span className="text-xs font-semibold text-text-primary">
                    Memiliki Tempat Pembuangan Sampah Layak
                  </span>
                  <input
                    type="checkbox"
                    checked={form.punyaTempatSampah}
                    onChange={(e) => setForm({ ...form, punyaTempatSampah: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer pt-2 border-t border-separator-border">
                  <span className="text-xs font-semibold text-text-primary">
                    Menempel Stiker P4K (Perencanaan Persalinan &amp; Pencegahan Komplikasi)
                  </span>
                  <input
                    type="checkbox"
                    checked={form.tempelStikerP4k}
                    onChange={(e) => setForm({ ...form, tempelStikerP4k: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </label>
              </div>
            </div>
          </BoardSurface>
        )}

        {/* STEP 3: ANGGOTA KELUARGA + VIRTUAL NIK GENERATOR */}
        {form.step === 3 && (
          <BoardSurface padding="lg" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  03. Pendataan Anggota Keluarga (Jiwa) &amp; Virtual NIK Bayi
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Tambahkan seluruh anggota keluarga dalam KK. Bagi bayi baru lahir yang belum terbit
                  NIK Dukcapil, gunakan fitur <strong>Virtual NIK Generator</strong>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <BoardButton
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => addMember(false)}
                >
                  Tambah Anggota
                </BoardButton>
                <BoardButton
                  variant="primary"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => addMember(true)}
                >
                  + Tambah Bayi Baru Lahir (Virtual NIK)
                </BoardButton>
              </div>
            </div>

            <div className="space-y-5">
              {form.anggota.map((member, idx) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 rounded-xl bg-surface-subtle/60 border border-separator-border space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-separator-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-accent-600 dark:text-accent-400">
                        {`Jiwa #${idx + 1}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-xs font-semibold text-text-primary">
                        {member.hubungan.replace(/_/g, ' ')}
                      </span>
                      {member.isVirtualNik && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-xs font-mono text-amber-700 dark:text-amber-400">
                            Virtual NIK Sementara Aktif
                          </span>
                        </>
                      )}
                    </div>

                    {form.anggota.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        aria-label={`Hapus anggota keluarga ke-${idx + 1}`}
                        className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Nama Lengkap Sesuai KK / Akta
                      </label>
                      <input
                        type="text"
                        value={member.nama}
                        onChange={(e) => updateMember(idx, { nama: e.target.value })}
                        placeholder="Masukkan nama lengkap..."
                        className="w-full px-3 py-1.5 text-xs sm:text-sm bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-text-secondary">
                          NIK (16 Digit) / Virtual NIK Bayi
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const vNik = generateVirtualNik(
                              member.tanggalLahir,
                              member.jenisKelamin,
                              idx + 1
                            );
                            updateMember(idx, { nik: vNik, isVirtualNik: true });
                          }}
                          className="text-[11px] font-medium text-accent-600 dark:text-accent-400 hover:underline cursor-pointer"
                        >
                          Generate NIK Virtual Otomatis
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={20}
                        value={member.nik}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const isVirtual = val.startsWith('TEMP-');
                          const cleaned = isVirtual
                            ? val.toUpperCase().slice(0, 20)
                            : val.replace(/\D/g, '').slice(0, 16);
                          updateMember(idx, {
                            nik: cleaned,
                            isVirtualNik: isVirtual,
                          });
                        }}
                        placeholder="16 Digit NIK Dukcapil atau klik generate"
                        className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono tabular-nums bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Hubungan Keluarga
                      </label>
                      <select
                        value={member.hubungan}
                        onChange={(e) =>
                          updateMember(idx, {
                            hubungan: e.target.value as AnggotaKeluarga['hubungan'],
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      >
                        <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
                        <option value="ISTRI">Istri</option>
                        <option value="ANAK">Anak</option>
                        <option value="ORANG_TUA">Orang Tua / Mertua</option>
                        <option value="FAMILI_LAIN">Famili Lain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={member.jenisKelamin}
                        onChange={(e) => {
                          const jk = e.target.value as 'L' | 'P';
                          const patch: Partial<AnggotaKeluarga> = { jenisKelamin: jk };
                          if (member.isVirtualNik) {
                            patch.nik = generateVirtualNik(member.tanggalLahir, jk, idx + 1);
                          }
                          updateMember(idx, patch);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        {`Tanggal Lahir (Usia: ${member.umur} th)`}
                      </label>
                      <input
                        type="date"
                        value={member.tanggalLahir}
                        onChange={(e) => {
                          const tgl = e.target.value;
                          const patch: Partial<AnggotaKeluarga> = { tanggalLahir: tgl };
                          if (member.isVirtualNik) {
                            patch.nik = generateVirtualNik(tgl, member.jenisKelamin, idx + 1);
                          }
                          updateMember(idx, patch);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Pendidikan Terakhir
                      </label>
                      <select
                        value={member.pendidikan}
                        onChange={(e) =>
                          updateMember(idx, {
                            pendidikan: e.target.value as AnggotaKeluarga['pendidikan'],
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      >
                        <option value="TIDAK_SEKOLAH">Belum / Tidak Sekolah</option>
                        <option value="SD">SD / Sederajat</option>
                        <option value="SMP">SMP / Sederajat</option>
                        <option value="SMA">SMA / SMK / Sederajat</option>
                        <option value="DIPLOMA">Diploma (D1-D3)</option>
                        <option value="S1_S2_S3">Perguruan Tinggi (S1-S3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Status Perkawinan
                      </label>
                      <select
                        value={member.statusKawin}
                        onChange={(e) =>
                          updateMember(idx, {
                            statusKawin: e.target.value as AnggotaKeluarga['statusKawin'],
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      >
                        <option value="BELUM_KAWIN">Belum Kawin</option>
                        <option value="KAWIN">Kawin</option>
                        <option value="CERAI_HIDUP">Cerai Hidup (Janda/Duda)</option>
                        <option value="CERAI_MATI">Cerai Mati (Janda/Duda)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Pekerjaan
                      </label>
                      <input
                        type="text"
                        value={member.pekerjaan}
                        onChange={(e) => updateMember(idx, { pekerjaan: e.target.value })}
                        placeholder="Contoh: Wiraswasta, Petani, IRT"
                        className="w-full px-2.5 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg text-text-primary"
                      />
                    </div>
                  </div>

                  {/* Indikator Khusus PKK */}
                  <div className="pt-2 border-t border-separator-border flex flex-wrap items-center gap-4 text-xs">
                    <span className="font-semibold text-text-muted">Indikator Khusus:</span>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isBalita}
                        onChange={(e) => updateMember(idx, { isBalita: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Balita (&lt;5 th)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isLansia}
                        onChange={(e) => updateMember(idx, { isLansia: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Lansia (≥60 th)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isIbuHamil}
                        onChange={(e) => updateMember(idx, { isIbuHamil: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Ibu Hamil</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isIbuMenyusui}
                        onChange={(e) => updateMember(idx, { isIbuMenyusui: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Ibu Menyusui</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isButaAksara}
                        onChange={(e) => updateMember(idx, { isButaAksara: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Buta Aksara (3 Buta)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isDisabilitas}
                        onChange={(e) => updateMember(idx, { isDisabilitas: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Penyandang Disabilitas</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(member.akseptorKb)}
                        onChange={(e) => updateMember(idx, { akseptorKb: e.target.checked })}
                        className="accent-blue-600"
                      />
                      <span>Akseptor KB</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </BoardSurface>
        )}

        {/* STEP 4: PEKARANGAN & UP2K (HATINYA PKK) */}
        {form.step === 4 && (
          <BoardSurface padding="lg" className="space-y-6">
            <div className="border-b border-separator-border pb-4">
              <h2 className="text-lg font-bold text-text-primary">
                04. Pemanfaatan Tanah Pekarangan (HATINYA PKK) &amp; Ekonomi UP2K
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Instrumen Pokja II &amp; Pokja III TP PKK: Halaman Asri, Teratur, Indah, dan Nyaman
                serta Usaha Peningkatan Pendapatan Keluarga.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pemanfaatan Tanah Pekarangan */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border space-y-3">
                <h3 className="text-xs font-bold text-text-primary">
                  Pemanfaatan Lahan Pekarangan Rumah (HATINYA PKK)
                </h3>
                <label className="flex items-center justify-between text-xs cursor-pointer py-1">
                  <span>Tanaman Obat Keluarga (TOGA / Apotek Hidup)</span>
                  <input
                    type="checkbox"
                    checked={form.toga}
                    onChange={(e) => setForm({ ...form, toga: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer py-1 border-t border-separator-border">
                  <span>Tanaman Sayuran &amp; Warung Hidup</span>
                  <input
                    type="checkbox"
                    checked={form.sayuran}
                    onChange={(e) => setForm({ ...form, sayuran: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer py-1 border-t border-separator-border">
                  <span>Tanaman Keras / Buah &amp; Penghijauan</span>
                  <input
                    type="checkbox"
                    checked={form.tanamanKeras}
                    onChange={(e) => setForm({ ...form, tanamanKeras: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer py-1 border-t border-separator-border">
                  <span>Perikanan Air Tawar (Kolam Lele / Nila / Bioflok)</span>
                  <input
                    type="checkbox"
                    checked={form.perikanan}
                    onChange={(e) => setForm({ ...form, perikanan: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer py-1 border-t border-separator-border">
                  <span>Peternakan Unggas / Kambing / Sapi</span>
                  <input
                    type="checkbox"
                    checked={form.peternakan}
                    onChange={(e) => setForm({ ...form, peternakan: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>

              {/* UP2K & Industri Rumah Tangga */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border space-y-3">
                  <label className="flex items-center justify-between text-xs font-bold text-text-primary cursor-pointer">
                    <span>Keikutsertaan Kelompok UP2K PKK</span>
                    <input
                      type="checkbox"
                      checked={form.ikutUp2k}
                      onChange={(e) => setForm({ ...form, ikutUp2k: e.target.checked })}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </label>
                  {form.ikutUp2k && (
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        Nama / Jenis Usaha UP2K Keluarga
                      </label>
                      <input
                        type="text"
                        value={form.jenisUsahaUp2k}
                        onChange={(e) => setForm({ ...form, jenisUsahaUp2k: e.target.value })}
                        placeholder="Contoh: Keripik Singkong &amp; Katering PKK"
                        className="w-full px-3 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border space-y-2.5">
                  <div className="text-xs font-bold text-text-primary">
                    Kategori Industri Rumah Tangga
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['PANGAN', 'SANDANG', 'KERAJINAN', 'JASA'] as const).map((kat) => (
                      <label key={kat} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.industriRumahTangga.includes(kat)}
                          onChange={() => toggleIndustri(kat)}
                          className="accent-blue-600"
                        />
                        <span>{`Bidang ${kat}`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border">
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    Konsumsi Makanan Pokok Harian
                  </label>
                  <select
                    value={form.makananPokok}
                    onChange={(e) =>
                      setForm({ ...form, makananPokok: e.target.value as MakananPokok })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-background-tertiary-default border border-border-button-default rounded-2lg"
                  >
                    <option value="BERAS">Beras</option>
                    <option value="NON_BERAS">Non-Beras (Jagung, Singkong, Umbi, dll.)</option>
                  </select>
                </div>
              </div>
            </div>
          </BoardSurface>
        )}

        {/* STEP 5: RINGKASAN & KONFIRMASI PENGIRIMAN */}
        {form.step === 5 && (
          <BoardSurface padding="lg" className="space-y-6">
            <div className="border-b border-separator-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  05. Ringkasan Komprehensif &amp; Konfirmasi Pengiriman
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Periksa kembali seluruh data keluarga Anda sebelum dikirim ke sistem SIMPATIK Desa Grudo.
                </p>
              </div>
              <BoardStatusLabel
                tone={
                  previewSeverity.severity === 'HIJAU'
                    ? 'nominal'
                    : previewSeverity.severity === 'KUNING'
                    ? 'warning'
                    : 'danger'
                }
                label={`Status Lingkungan: ${severityPillLabel} (Pin ${previewSeverity.severity})`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border space-y-2">
                <div className="font-bold text-text-primary border-b border-separator-border pb-1.5">
                  A. Identitas Wilayah &amp; Rumah Tangga
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Wilayah Dasawisma:</span>
                  <span className="font-medium">
                    {`${selectedWilayah.namaDasawisma} (RT ${selectedWilayah.rt}/RW ${selectedWilayah.rw}, Dusun ${selectedWilayah.dusun})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Nomor KK:</span>
                  <span className="font-mono tabular-nums font-semibold">{form.noKK}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Kepala Keluarga:</span>
                  <span className="font-semibold">{form.namaKepalaKeluarga || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Koordinat Spasial:</span>
                  <span className="font-mono tabular-nums">
                    {`${form.latitude}, ${form.longitude}`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border space-y-2">
                <div className="font-bold text-text-primary border-b border-separator-border pb-1.5">
                  B. Sanitasi &amp; Pekarangan HATINYA PKK
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Kriteria Rumah &amp; Air:</span>
                  <span className="font-medium">
                    {`${form.kriteriaRumah} · ${form.sumberAir}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Jamban / SPAL / P4K:</span>
                  <span className="font-medium">
                    {`Jamban: ${form.punyaJamban ? `Ya (${form.jumlahJamban})` : 'Tidak'} · SPAL: ${form.punyaSpal ? 'Ada' : 'Tidak'} · P4K: ${form.tempelStikerP4k ? 'Terpasang' : 'Belum'}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Pekarangan Aktif:</span>
                  <span className="font-medium">
                    {[
                      form.toga ? 'TOGA' : '',
                      form.sayuran ? 'Sayur' : '',
                      form.tanamanKeras ? 'Tanaman Keras' : '',
                      form.perikanan ? 'Perikanan' : '',
                      form.peternakan ? 'Ternak' : '',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Belum ada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Status UP2K:</span>
                  <span className="font-medium">
                    {form.ikutUp2k ? `Aktif (${form.jenisUsahaUp2k || 'UP2K'})` : 'Tidak Mengikuti'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-text-primary">
                {`C. Daftar Anggota Keluarga (${form.anggota.length} Jiwa)`}
              </div>
              <div className="overflow-x-auto border border-separator-border rounded-xl">
                <table className="bui-table">
                  <thead className="bg-surface-subtle border-b border-separator-border text-text-secondary">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">NIK / Virtual NIK</th>
                      <th className="py-2.5 px-3">Hubungan</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">Umur</th>
                      <th className="py-2.5 px-3">Indikator Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator-border">
                    {form.anggota.map((a, i) => (
                      <tr key={a.id}>
                        <td className="py-2 px-3 font-mono tabular-nums">{i + 1}</td>
                        <td className="py-2 px-3 font-medium">
                          {a.nama || (i === 0 ? form.namaKepalaKeluarga : '(Belum diisi)')}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums">
                          {`${a.nik}${a.isVirtualNik ? ' (Virtual)' : ''}`}
                        </td>
                        <td className="py-2 px-3">{a.hubungan.replace(/_/g, ' ')}</td>
                        <td className="py-2 px-3 font-mono">{a.jenisKelamin}</td>
                        <td className="py-2 px-3 font-mono tabular-nums">{`${a.umur} th`}</td>
                        <td className="py-2 px-3 text-text-secondary">
                          {[
                            a.isBalita ? 'Balita' : '',
                            a.isLansia ? 'Lansia' : '',
                            a.isIbuHamil ? 'Ibu Hamil' : '',
                            a.isIbuMenyusui ? 'Ibu Menyusui' : '',
                            a.isDisabilitas ? 'Disabilitas' : '',
                            a.akseptorKb ? 'Akseptor KB' : '',
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Warga Umum'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pernyataan Kebenaran Data */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-separator-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-xs text-text-secondary leading-relaxed">
                  Saya menyatakan dengan sebenarnya bahwa seluruh data keluarga dan kondisi lingkungan rumah tangga
                  yang diisi di atas adalah benar dan dapat dipertanggungjawabkan untuk keperluan tertib administrasi
                  Buku Dasawisma TP PKK Desa Grudo.
                </span>
              </label>
            </div>

            <BoardCallout
              tone={perms.formulirAutoVerified ? 'success' : 'info'}
              title={
                perms.formulirAutoVerified
                  ? 'Pengiriman Petugas Resmi: Langsung Berstatus VERIFIKASI'
                  : 'Pengiriman Mandiri Warga: Masuk Antrean DRAFT Kader RT'
              }
              description={
                perms.formulirAutoVerified
                  ? 'Anda sedang login sebagai petugas berwenang. Data keluarga ini akan langsung masuk ke rekapitulasi resmi 31 Sheet Buku Dasawisma Desa Grudo.'
                  : 'Setelah dikirim, data ini akan berstatus DRAFT dan diverifikasi terlebih dahulu oleh Ibu Kader Dasawisma RT setempat sebelum masuk ke buku rekapitulasi desa.'
              }
            />
          </BoardSurface>
        )}

        {/* Step Navigation Footer */}
        <div className="flex items-center justify-between pt-2">
          <BoardButton
            variant="outline"
            disabled={form.step === 1 || isSubmitting}
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={goPrevStep}
          >
            Langkah Sebelumnya
          </BoardButton>

          {form.step < 5 ? (
            <BoardButton
              variant="primary"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={goNextStep}
            >
              {`Lanjut ke Langkah 0${form.step + 1}`}
            </BoardButton>
          ) : (
            <BoardButton
              variant="primary"
              size="lg"
              disabled={isSubmitting || !isAgreed}
              icon={<Send className="w-4 h-4" />}
              onClick={handleFinalSubmit}
            >
              {isSubmitting
                ? 'Mengirim Berkas...'
                : perms.formulirAutoVerified
                ? 'Simpan & Verifikasi Resmi KK'
                : 'Kirim Formulir Keluarga Mandiri'}
            </BoardButton>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

export default function FormulirPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-full flex items-center justify-center p-8 text-text-secondary">
          Memuat Formulir Pendataan Keluarga...
        </div>
      }
    >
      <PublicFormulir />
    </Suspense>
  );
}
