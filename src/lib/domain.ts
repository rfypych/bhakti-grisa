/**
 * SIMPATIK Desa Grudo (Bhakti Grisa) — Pure Domain Logic & Data Models
 * Covers RBAC Matrix, Virtual NIK Generator, GIS Severity Classifier,
 * Dashboard Aggregations, Wilayah Safety Guard, Vital Event Automation,
 * and 31-Sheet Buku Dasawisma PKK Generator.
 */

export type UserRole =
  | 'WARGA'
  | 'KADER_RT'
  | 'PENGURUS_RW'
  | 'PENGURUS_DUSUN'
  | 'ADMIN_DESA';

export type AppRoute =
  | '/'
  | '/formulir'
  | '/login'
  | '/tentang'
  | '/dashboard'
  | '/dashboard/verifikasi'
  | '/dashboard/lapor-peristiwa'
  | '/dashboard/peta'
  | '/dashboard/wilayah'
  | '/dashboard/pengguna'
  | '/dashboard/laporan/cetak';

export type KriteriaRumah = 'SEHAT' | 'KURANG_SEHAT' | 'TIDAK_SEHAT';
export type SumberAir = 'PDAM' | 'SUMUR_GALI' | 'SUMUR_POMPA' | 'SUNGAI' | 'MATA_AIR';
export type MakananPokok = 'BERAS' | 'NON_BERAS';
export type StatusVerifikasi = 'DRAFT' | 'VERIFIKASI' | 'DITOLAK';
export type SeverityPin = 'MERAH' | 'KUNING' | 'HIJAU';

export interface Wilayah {
  id: string;
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
  aktif: boolean;
  ketuaDasawisma: string;
  targetKK: number;
}

export interface OfficerAccount {
  id: string;
  nama: string;
  username: string;
  passwordPlain: string; // For local auth simulation
  role: Exclude<UserRole, 'WARGA'>;
  aktif: boolean;
  scopeDusun?: string;
  scopeRw?: string;
  scopeRt?: string;
  wilayahId?: string;
  terakhirMasuk: string;
}

export interface AnggotaKeluarga {
  id: string;
  nama: string;
  nik: string;
  isVirtualNik: boolean;
  hubungan: 'KEPALA_KELUARGA' | 'ISTRI' | 'ANAK' | 'ORANG_TUA' | 'FAMILI_LAIN';
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  umur: number;
  statusKawin: 'BELUM_KAWIN' | 'KAWIN' | 'CERAI_HIDUP' | 'CERAI_MATI';
  agama: 'ISLAM' | 'KRISTEN' | 'KATOLIK' | 'HINDU' | 'BUDDHA' | 'KONGHUCU';
  pendidikan: 'TIDAK_SEKOLAH' | 'SD' | 'SMP' | 'SMA' | 'DIPLOMA' | 'S1_S2_S3';
  pekerjaan: string;
  // Indikator khusus PKK
  isBalita: boolean;
  isLansia: boolean;
  isIbuHamil: boolean;
  isIbuMenyusui: boolean;
  isButaAksara: boolean;
  isDisabilitas: boolean;
  statusHidup: 'HIDUP' | 'MENINGGAL' | 'PINDAH';
  akseptorKb?: boolean;
}

export interface SanitasiLingkungan {
  kriteriaRumah: KriteriaRumah;
  punyaJamban: boolean;
  jumlahJamban: number;
  sumberAir: SumberAir;
  punyaSpal: boolean;
  punyaTempatSampah: boolean;
  tempelStikerP4k: boolean;
}

export interface PekaranganUp2k {
  tanamanKeras: boolean;
  toga: boolean;
  sayuran: boolean;
  perikanan: boolean;
  peternakan: boolean;
  industriRumahTangga: ('PANGAN' | 'SANDANG' | 'KERAJINAN' | 'JASA')[];
  ikutUp2k: boolean;
  jenisUsahaUp2k?: string;
  makananPokok: MakananPokok;
}

export interface KeluargaRecord {
  id: string;
  noKK: string;
  namaKepalaKeluarga: string;
  wilayahId: string;
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
  alamat: string;
  latitude: number;
  longitude: number;
  tahunPendataan: number;
  status: StatusVerifikasi;
  catatanRevisi?: string;
  diinputOleh: 'WARGA_MANDIRI' | 'KADER_RT' | 'ADMIN_DESA';
  tanggalInput: string;
  tanggalUpdate: string;
  sanitasi: SanitasiLingkungan;
  pekarangan: PekaranganUp2k;
  anggota: AnggotaKeluarga[];
}

export type JenisPeristiwa = 'KELAHIRAN' | 'KEMATIAN' | 'KEHAMILAN' | 'NIFAS' | 'MUTASI_KELUAR';

export interface PeristiwaRecord {
  id: string;
  jenis: JenisPeristiwa;
  keluargaId: string;
  noKK: string;
  namaKepalaKeluarga: string;
  wilayahId: string;
  rt: string;
  rw: string;
  dusun: string;
  namaSubjek: string;
  jenisKelamin: 'L' | 'P';
  tanggalPeristiwa: string;
  keterangan: string;
  // Khusus Kelahiran
  namaIbu?: string;
  beratBadanKg?: number;
  lingkarKepalaCm?: number;
  nikBayi?: string;
  // Khusus Kematian
  kategoriKematian?: 'IBU_HAMIL_MELAHIRKAN' | 'BAYI' | 'BALITA' | 'WARGA_UMUM';
  penyebabKematian?: string;
  dicatatOleh: string;
}

// ============================================================================
// 1. RBAC MATRIX (Section 2 of Specification)
// ============================================================================

export interface RbacPermission {
  canViewPublic: boolean;
  canSubmitFormulir: boolean;
  formulirAutoVerified: boolean;
  canAccessDashboard: boolean;
  canVerifyDraft: boolean;
  canViewPeristiwa: boolean;
  canInputPeristiwa: boolean;
  canViewPeta: boolean;
  canManageWilayah: boolean;
  canManagePengguna: boolean;
  canPrintCatatanKeluarga: boolean;
  canExportExcel31Sheet: boolean;
  canExportPdf: boolean;
  scopeLabel: string;
}

export function getRbacPermissions(role: UserRole, user?: OfficerAccount | null): RbacPermission {
  switch (role) {
    case 'WARGA':
      return {
        canViewPublic: true,
        canSubmitFormulir: true,
        formulirAutoVerified: false,
        canAccessDashboard: false,
        canVerifyDraft: false,
        canViewPeristiwa: false,
        canInputPeristiwa: false,
        canViewPeta: false,
        canManageWilayah: false,
        canManagePengguna: false,
        canPrintCatatanKeluarga: false,
        canExportExcel31Sheet: false,
        canExportPdf: false,
        scopeLabel: 'Warga / Guest (Draft Mandiri)',
      };
    case 'KADER_RT':
      return {
        canViewPublic: true,
        canSubmitFormulir: true,
        formulirAutoVerified: true,
        canAccessDashboard: true,
        canVerifyDraft: true,
        canViewPeristiwa: true,
        canInputPeristiwa: true,
        canViewPeta: true,
        canManageWilayah: false,
        canManagePengguna: false,
        canPrintCatatanKeluarga: true,
        canExportExcel31Sheet: true,
        canExportPdf: true,
        scopeLabel: user?.scopeRt
          ? `Scope RT ${user.scopeRt} / RW ${user.scopeRw} (${user.scopeDusun})`
          : 'Scope RT Sendiri',
      };
    case 'PENGURUS_RW':
      return {
        canViewPublic: true,
        canSubmitFormulir: false,
        formulirAutoVerified: false,
        canAccessDashboard: true,
        canVerifyDraft: false,
        canViewPeristiwa: true,
        canInputPeristiwa: false, // Lihat Log Saja per RBAC Matrix
        canViewPeta: true,
        canManageWilayah: false,
        canManagePengguna: false,
        canPrintCatatanKeluarga: true,
        canExportExcel31Sheet: true,
        canExportPdf: true,
        scopeLabel: user?.scopeRw
          ? `Scope RW ${user.scopeRw} (${user.scopeDusun})`
          : 'Scope RW Sendiri',
      };
    case 'PENGURUS_DUSUN':
      return {
        canViewPublic: true,
        canSubmitFormulir: false,
        formulirAutoVerified: false,
        canAccessDashboard: true,
        canVerifyDraft: false,
        canViewPeristiwa: true,
        canInputPeristiwa: false, // Lihat Log Saja per RBAC Matrix
        canViewPeta: true,
        canManageWilayah: false,
        canManagePengguna: false,
        canPrintCatatanKeluarga: true,
        canExportExcel31Sheet: true,
        canExportPdf: true,
        scopeLabel: user?.scopeDusun ? `Scope Dusun ${user.scopeDusun}` : 'Scope Dusun Sendiri',
      };
    case 'ADMIN_DESA':
      return {
        canViewPublic: true,
        canSubmitFormulir: true,
        formulirAutoVerified: true,
        canAccessDashboard: true,
        canVerifyDraft: true,
        canViewPeristiwa: true,
        canInputPeristiwa: true,
        canViewPeta: true,
        canManageWilayah: true,
        canManagePengguna: true,
        canPrintCatatanKeluarga: true,
        canExportExcel31Sheet: true,
        canExportPdf: true,
        scopeLabel: 'Cakupan Seluruh Desa Grudo',
      };
  }
}

export function canAccessRoute(role: UserRole, route: AppRoute): boolean {
  const perm = getRbacPermissions(role);
  switch (route) {
    case '/':
    case '/login':
    case '/tentang':
      return true;
    case '/formulir':
      return perm.canSubmitFormulir;
    case '/dashboard':
      return perm.canAccessDashboard;
    case '/dashboard/verifikasi':
      return perm.canVerifyDraft;
    case '/dashboard/lapor-peristiwa':
      return perm.canViewPeristiwa;
    case '/dashboard/peta':
      return perm.canViewPeta;
    case '/dashboard/wilayah':
      return perm.canManageWilayah;
    case '/dashboard/pengguna':
      return perm.canManagePengguna;
    case '/dashboard/laporan/cetak':
      return perm.canPrintCatatanKeluarga;
    default:
      return false;
  }
}

export function filterFamiliesByRoleScope(
  families: KeluargaRecord[],
  role: UserRole,
  officer?: OfficerAccount | null
): KeluargaRecord[] {
  if (role === 'ADMIN_DESA' || role === 'WARGA' || !officer) {
    return families;
  }
  if (role === 'KADER_RT') {
    if (officer.wilayahId) {
      return families.filter((f) => f.wilayahId === officer.wilayahId);
    }
    return families.filter(
      (f) => f.rt === officer.scopeRt && f.rw === officer.scopeRw
    );
  }
  if (role === 'PENGURUS_RW') {
    return families.filter(
      (f) => f.rw === officer.scopeRw && (!officer.scopeDusun || f.dusun === officer.scopeDusun)
    );
  }
  if (role === 'PENGURUS_DUSUN') {
    return families.filter((f) => f.dusun === officer.scopeDusun);
  }
  return families;
}

export function filterWilayahByRoleScope(
  wilayahList: Wilayah[],
  role: UserRole,
  officer?: OfficerAccount | null
): Wilayah[] {
  if (role === 'ADMIN_DESA' || role === 'WARGA' || !officer) {
    return wilayahList;
  }
  if (role === 'KADER_RT') {
    if (officer.wilayahId) {
      return wilayahList.filter((w) => w.id === officer.wilayahId);
    }
    return wilayahList.filter((w) => w.rt === officer.scopeRt && w.rw === officer.scopeRw);
  }
  if (role === 'PENGURUS_RW') {
    return wilayahList.filter(
      (w) => w.rw === officer.scopeRw && (!officer.scopeDusun || w.dusun === officer.scopeDusun)
    );
  }
  if (role === 'PENGURUS_DUSUN') {
    return wilayahList.filter((w) => w.dusun === officer.scopeDusun);
  }
  return wilayahList;
}

// ============================================================================
// 2. VIRTUAL NIK GENERATOR & DEMOGRAPHIC HELPERS (Section 3.2 Step 3)
// ============================================================================

/**
 * Generates a deterministic 16-digit Virtual NIK for newborn babies in Desa Grudo
 * who do not yet have an official Dukcapil NIK.
 * Format: 352109 (Kode Kec Ngawi/Grudo) + DDMMYY (+40 on DD for female) + 99 + 2-digit seq
 */
export function generateVirtualNik(
  tanggalLahir: string,
  jenisKelamin: 'L' | 'P',
  sequence: number = 1
): string {
  const prefix = '352109'; // Kab. Ngawi (35.21), Kec. Ngawi (09)
  let dd = 1;
  let mm = 1;
  let yy = 26;

  if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
    const parts = tanggalLahir.split('-');
    yy = parseInt(parts[0].slice(-2), 10);
    mm = parseInt(parts[1], 10);
    dd = parseInt(parts[2], 10);
  }

  if (jenisKelamin === 'P') {
    dd += 40;
  }

  const ddStr = String(dd).padStart(2, '0');
  const mmStr = String(mm).padStart(2, '0');
  const yyStr = String(yy).padStart(2, '0');
  const seqStr = String(Math.max(1, sequence % 100)).padStart(2, '0');

  // '99' marks temporary Virtual NIK SIMPATIK Desa Grudo
  return `${prefix}${ddStr}${mmStr}${yyStr}99${seqStr}`;
}

export function calculateAge(tanggalLahir: string, referenceDate: string = '2026-10-27'): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) return 0;
  const birth = new Date(tanggalLahir + 'T00:00:00Z');
  const ref = new Date(referenceDate + 'T00:00:00Z');
  let age = ref.getUTCFullYear() - birth.getUTCFullYear();
  const m = ref.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return Math.max(0, age);
}

// ============================================================================
// 3. GIS SPATIAL SEVERITY PIN CLASSIFIER (Section 4.4)
// ============================================================================

export interface HouseholdSeverityResult {
  severity: SeverityPin;
  label: string;
  reasons: string[];
}

export function computeHouseholdSeverity(family: KeluargaRecord): HouseholdSeverityResult {
  const reasons: string[] = [];
  const livingMembers = family.anggota.filter((a) => a.statusHidup === 'HIDUP');
  const hasIbuHamil = livingMembers.some((a) => a.isIbuHamil);
  const hasBalita = livingMembers.some((a) => a.isBalita || a.umur < 5);
  const hasLansia = livingMembers.some((a) => a.isLansia || a.umur >= 60);
  const hasDisabilitas = livingMembers.some((a) => a.isDisabilitas);

  // MERAH: Indikator kerentanan tinggi
  if (family.sanitasi.kriteriaRumah === 'TIDAK_SEHAT') {
    reasons.push('Kriteria rumah Tidak Sehat');
  }
  if (!family.sanitasi.punyaJamban) {
    reasons.push('Belum memiliki jamban keluarga layak');
  }
  if (hasIbuHamil && !family.sanitasi.tempelStikerP4k) {
    reasons.push('Ibu Hamil berisiko (Belum terpasang Stiker P4K)');
  }
  if (reasons.length > 0) {
    return {
      severity: 'MERAH',
      label: 'Kerentanan Tinggi (Prioritas Intervensi)',
      reasons,
    };
  }

  // KUNING: Kurang sehat atau punya kelompok rentan gizi (Balita/Lansia/Ibu Hamil)
  if (family.sanitasi.kriteriaRumah === 'KURANG_SEHAT') {
    reasons.push('Kriteria rumah Kurang Sehat');
  }
  if (!family.sanitasi.punyaSpal) {
    reasons.push('Belum memiliki SPAL standar');
  }
  if (hasIbuHamil) {
    reasons.push('Pemantauan berkala Ibu Hamil (P4K Aktif)');
  }
  if (hasBalita) {
    reasons.push('Terdapat Balita (Pemantauan Gizi & Stunting Posyandu)');
  }
  if (hasLansia) {
    reasons.push('Terdapat Lansia (Posyandu Lansia)');
  }
  if (hasDisabilitas) {
    reasons.push('Pendampingan Anggota Disabilitas');
  }

  if (reasons.length > 0) {
    return {
      severity: 'KUNING',
      label: 'Pemantauan Gizi & Sanitasi Berkala',
      reasons,
    };
  }

  return {
    severity: 'HIJAU',
    label: 'Rumah Sehat & Mandiri (HATINYA PKK Aktif)',
    reasons: ['Sanitasi lengkap (Jamban, SPAL, Tempat Sampah)', 'Pekarangan & PHBS Terpenuhi'],
  };
}

// ============================================================================
// 4. DASHBOARD AGGREGATE ENGINE (Section 4.1)
// ============================================================================

export interface DashboardAggregates {
  totalKKTerverifikasi: number;
  totalDraftAntrean: number;
  totalDitolak: number;
  totalJiwa: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  // Kelompok Rentan
  totalBalita: number;
  totalLansia: number;
  totalIbuHamil: number;
  totalIbuMenyusui: number;
  totalButaAksara: number;
  totalDisabilitas: number;
  // Sanitasi
  rumahSehat: number;
  rumahKurangSehat: number;
  rumahTidakSehat: number;
  kkPunyaJamban: number;
  persenJamban: number;
  kkPunyaSpal: number;
  persenSpal: number;
  kkPunyaTempatSampah: number;
  persenTempatSampah: number;
  kkStikerP4k: number;
  // Ekonomi & Pekarangan (HATINYA PKK)
  kkUp2kAktif: number;
  kkToga: number;
  kkSayuran: number;
  kkPerikanan: number;
  kkPeternakan: number;
  kkIndustriRT: number;
  // GIS Severity Breakdown
  pinMerah: number;
  pinKuning: number;
  pinHijau: number;
}

export function computeDashboardAggregates(families: KeluargaRecord[]): DashboardAggregates {
  const verified = families.filter((f) => f.status === 'VERIFIKASI');
  const drafts = families.filter((f) => f.status === 'DRAFT');
  const rejected = families.filter((f) => f.status === 'DITOLAK');

  let totalJiwa = 0;
  let totalLakiLaki = 0;
  let totalPerempuan = 0;
  let totalBalita = 0;
  let totalLansia = 0;
  let totalIbuHamil = 0;
  let totalIbuMenyusui = 0;
  let totalButaAksara = 0;
  let totalDisabilitas = 0;

  let rumahSehat = 0;
  let rumahKurangSehat = 0;
  let rumahTidakSehat = 0;
  let kkPunyaJamban = 0;
  let kkPunyaSpal = 0;
  let kkPunyaTempatSampah = 0;
  let kkStikerP4k = 0;

  let kkUp2kAktif = 0;
  let kkToga = 0;
  let kkSayuran = 0;
  let kkPerikanan = 0;
  let kkPeternakan = 0;
  let kkIndustriRT = 0;

  let pinMerah = 0;
  let pinKuning = 0;
  let pinHijau = 0;

  for (const fam of verified) {
    const living = fam.anggota.filter((a) => a.statusHidup === 'HIDUP');
    for (const m of living) {
      totalJiwa++;
      if (m.jenisKelamin === 'L') totalLakiLaki++;
      else totalPerempuan++;

      if (m.isBalita || m.umur < 5) totalBalita++;
      if (m.isLansia || m.umur >= 60) totalLansia++;
      if (m.isIbuHamil) totalIbuHamil++;
      if (m.isIbuMenyusui) totalIbuMenyusui++;
      if (m.isButaAksara) totalButaAksara++;
      if (m.isDisabilitas) totalDisabilitas++;
    }

    if (fam.sanitasi.kriteriaRumah === 'SEHAT') rumahSehat++;
    else if (fam.sanitasi.kriteriaRumah === 'KURANG_SEHAT') rumahKurangSehat++;
    else rumahTidakSehat++;

    if (fam.sanitasi.punyaJamban) kkPunyaJamban++;
    if (fam.sanitasi.punyaSpal) kkPunyaSpal++;
    if (fam.sanitasi.punyaTempatSampah) kkPunyaTempatSampah++;
    if (fam.sanitasi.tempelStikerP4k) kkStikerP4k++;

    if (fam.pekarangan.ikutUp2k) kkUp2kAktif++;
    if (fam.pekarangan.toga) kkToga++;
    if (fam.pekarangan.sayuran) kkSayuran++;
    if (fam.pekarangan.perikanan) kkPerikanan++;
    if (fam.pekarangan.peternakan) kkPeternakan++;
    if (fam.pekarangan.industriRumahTangga.length > 0) kkIndustriRT++;

    const sev = computeHouseholdSeverity(fam).severity;
    if (sev === 'MERAH') pinMerah++;
    else if (sev === 'KUNING') pinKuning++;
    else pinHijau++;
  }

  const count = verified.length || 1;

  return {
    totalKKTerverifikasi: verified.length,
    totalDraftAntrean: drafts.length,
    totalDitolak: rejected.length,
    totalJiwa,
    totalLakiLaki,
    totalPerempuan,
    totalBalita,
    totalLansia,
    totalIbuHamil,
    totalIbuMenyusui,
    totalButaAksara,
    totalDisabilitas,
    rumahSehat,
    rumahKurangSehat,
    rumahTidakSehat,
    kkPunyaJamban,
    persenJamban: verified.length ? Math.round((kkPunyaJamban / count) * 100) : 0,
    kkPunyaSpal,
    persenSpal: verified.length ? Math.round((kkPunyaSpal / count) * 100) : 0,
    kkPunyaTempatSampah,
    persenTempatSampah: verified.length ? Math.round((kkPunyaTempatSampah / count) * 100) : 0,
    kkStikerP4k,
    kkUp2kAktif,
    kkToga,
    kkSayuran,
    kkPerikanan,
    kkPeternakan,
    kkIndustriRT,
    pinMerah,
    pinKuning,
    pinHijau,
  };
}

// ============================================================================
// 5. WILAYAH SAFETY GUARD (Section 4.5 Proteksi Integritas Data)
// ============================================================================

export interface WilayahDeletionCheck {
  allowed: boolean;
  reason?: string;
  linkedFamiliesCount: number;
  linkedOfficersCount: number;
}

export function validateWilayahDeletion(
  wilayahId: string,
  families: KeluargaRecord[],
  officers: OfficerAccount[]
): WilayahDeletionCheck {
  const linkedFamiliesCount = families.filter((f) => f.wilayahId === wilayahId).length;
  const linkedOfficersCount = officers.filter(
    (o) => o.wilayahId === wilayahId && o.aktif
  ).length;

  if (linkedFamiliesCount > 0 || linkedOfficersCount > 0) {
    return {
      allowed: false,
      linkedFamiliesCount,
      linkedOfficersCount,
      reason: `Proteksi Integritas Data Aktif: Wilayah ini tidak dapat dihapus karena masih menaungi ${linkedFamiliesCount} Kepala Keluarga terdaftar dan ${linkedOfficersCount} Kader aktif.`,
    };
  }

  return {
    allowed: true,
    linkedFamiliesCount: 0,
    linkedOfficersCount: 0,
  };
}

// ============================================================================
// 6. VITAL EVENT AUTOMATION (Section 4.3 Kelahiran & Kematian)
// ============================================================================

export interface BirthEventInput {
  keluargaId: string;
  namaIbu: string;
  namaBayi: string;
  jenisKelamin: 'L' | 'P';
  tanggalLahir: string;
  beratBadanKg: number;
  lingkarKepalaCm: number;
  useVirtualNik: boolean;
  nikManual?: string;
  dicatatOleh: string;
}

export function applyBirthEvent(
  families: KeluargaRecord[],
  events: PeristiwaRecord[],
  input: BirthEventInput
): { updatedFamilies: KeluargaRecord[]; newEvent: PeristiwaRecord } {
  const targetFam = families.find((f) => f.id === input.keluargaId);
  if (!targetFam) {
    throw new Error('Keluarga tujuan tidak ditemukan');
  }

  const babyNik = input.useVirtualNik
    ? generateVirtualNik(input.tanggalLahir, input.jenisKelamin, targetFam.anggota.length + 1)
    : input.nikManual || generateVirtualNik(input.tanggalLahir, input.jenisKelamin, 1);

  const newMember: AnggotaKeluarga = {
    id: `ang-${Date.now()}`,
    nama: input.namaBayi,
    nik: babyNik,
    isVirtualNik: input.useVirtualNik,
    hubungan: 'ANAK',
    jenisKelamin: input.jenisKelamin,
    tempatLahir: 'Ngawi',
    tanggalLahir: input.tanggalLahir,
    umur: 0,
    statusKawin: 'BELUM_KAWIN',
    agama: targetFam.anggota[0]?.agama || 'ISLAM',
    pendidikan: 'TIDAK_SEKOLAH',
    pekerjaan: 'Belum/Tidak Bekerja',
    isBalita: true,
    isLansia: false,
    isIbuHamil: false,
    isIbuMenyusui: false,
    isButaAksara: false,
    isDisabilitas: false,
    statusHidup: 'HIDUP',
  };

  const updatedFamilies = families.map((f) => {
    if (f.id !== input.keluargaId) return f;
    return {
      ...f,
      tanggalUpdate: input.tanggalLahir,
      anggota: [...f.anggota, newMember],
    };
  });

  const newEvent: PeristiwaRecord = {
    id: `evt-${Date.now()}`,
    jenis: 'KELAHIRAN',
    keluargaId: targetFam.id,
    noKK: targetFam.noKK,
    namaKepalaKeluarga: targetFam.namaKepalaKeluarga,
    wilayahId: targetFam.wilayahId,
    rt: targetFam.rt,
    rw: targetFam.rw,
    dusun: targetFam.dusun,
    namaSubjek: input.namaBayi,
    jenisKelamin: input.jenisKelamin,
    tanggalPeristiwa: input.tanggalLahir,
    namaIbu: input.namaIbu,
    beratBadanKg: input.beratBadanKg,
    lingkarKepalaCm: input.lingkarKepalaCm,
    nikBayi: babyNik,
    keterangan: `Kelahiran bayi (${input.beratBadanKg} kg, LK ${input.lingkarKepalaCm} cm) dari Ibu ${input.namaIbu}. Otomatis masuk daftar jiwa KK.`,
    dicatatOleh: input.dicatatOleh,
  };

  return { updatedFamilies, newEvent };
}

export interface MortalityEventInput {
  keluargaId: string;
  anggotaId: string;
  tanggalKematian: string;
  kategoriKematian: 'IBU_HAMIL_MELAHIRKAN' | 'BAYI' | 'BALITA' | 'WARGA_UMUM';
  penyebabKematian: string;
  dicatatOleh: string;
}

export function applyMortalityEvent(
  families: KeluargaRecord[],
  input: MortalityEventInput
): { updatedFamilies: KeluargaRecord[]; newEvent: PeristiwaRecord } {
  const targetFam = families.find((f) => f.id === input.keluargaId);
  if (!targetFam) {
    throw new Error('Keluarga tidak ditemukan');
  }
  const member = targetFam.anggota.find((a) => a.id === input.anggotaId);
  if (!member) {
    throw new Error('Anggota keluarga tidak ditemukan');
  }

  const updatedFamilies = families.map((f) => {
    if (f.id !== input.keluargaId) return f;
    return {
      ...f,
      tanggalUpdate: input.tanggalKematian,
      anggota: f.anggota.map((a) =>
        a.id === input.anggotaId ? { ...a, statusHidup: 'MENINGGAL' as const } : a
      ),
    };
  });

  const newEvent: PeristiwaRecord = {
    id: `evt-${Date.now()}`,
    jenis: 'KEMATIAN',
    keluargaId: targetFam.id,
    noKK: targetFam.noKK,
    namaKepalaKeluarga: targetFam.namaKepalaKeluarga,
    wilayahId: targetFam.wilayahId,
    rt: targetFam.rt,
    rw: targetFam.rw,
    dusun: targetFam.dusun,
    namaSubjek: member.nama,
    jenisKelamin: member.jenisKelamin,
    tanggalPeristiwa: input.tanggalKematian,
    kategoriKematian: input.kategoriKematian,
    penyebabKematian: input.penyebabKematian,
    keterangan: `Wafat (${input.kategoriKematian.replace(/_/g, ' ')}) — Penyebab: ${input.penyebabKematian}. Status jiwa diarsipkan otomatis.`,
    dicatatOleh: input.dicatatOleh,
  };

  return { updatedFamilies, newEvent };
}

// ============================================================================
// 7. 31-SHEET BUKU DASAWISMA PKK GENERATOR (Section 5.1)
// ============================================================================

export interface DasawismaSheetSpec {
  sheetNumber: number;
  sheetCode: string;
  sheetTitle: string;
  lampiranRef: string;
  category: 'KELUARGA_WARGA' | 'REKAP_DASAWISMA_RT' | 'REKAP_RW_DUSUN' | 'REKAP_DESA' | 'IBU_HAMIL_KELAHIRAN' | 'HATINYA_UP2K';
  headers: string[];
  rows: (string | number)[][];
}

export function generate31SheetsBukuDasawisma(
  families: KeluargaRecord[],
  wilayahList: Wilayah[],
  events: PeristiwaRecord[],
  tahun: number
): DasawismaSheetSpec[] {
  const verified = families.filter((f) => f.status === 'VERIFIKASI');
  const agg = computeDashboardAggregates(verified);

  const sheetDefinitions: Omit<DasawismaSheetSpec, 'headers' | 'rows'>[] = [
    { sheetNumber: 1, sheetCode: '01_COVER_IDENTITAS', sheetTitle: 'Identitas Buku Dasawisma & TP PKK Desa Grudo', lampiranRef: 'Lampiran 4.14a', category: 'KELUARGA_WARGA' },
    { sheetNumber: 2, sheetCode: '02_DATA_KELUARGA_A', sheetTitle: 'Buku Data Keluarga Dasawisma (Bagian I: Identitas & Sanitasi)', lampiranRef: 'Lampiran 4.14b', category: 'KELUARGA_WARGA' },
    { sheetNumber: 3, sheetCode: '03_DATA_KELUARGA_B', sheetTitle: 'Buku Data Keluarga Dasawisma (Bagian II: Pekarangan & UP2K)', lampiranRef: 'Lampiran 4.14c', category: 'KELUARGA_WARGA' },
    { sheetNumber: 4, sheetCode: '04_DATA_WARGA_DEMOGRAFI', sheetTitle: 'Buku Daftar Anggota Keluarga / Warga TP PKK', lampiranRef: 'Lampiran 4.14d', category: 'KELUARGA_WARGA' },
    { sheetNumber: 5, sheetCode: '05_CATATAN_KELUARGA', sheetTitle: 'Catatan Keluarga Per Kepala Rumah Tangga', lampiranRef: 'Lampiran 4.15', category: 'KELUARGA_WARGA' },
    { sheetNumber: 6, sheetCode: '06_REKAP_DASAWISMA_1', sheetTitle: 'Rekapitulasi Catatan Data & Kegiatan Warga Kelompok Dasawisma (Dahlia & Melati)', lampiranRef: 'Lampiran 4.16a', category: 'REKAP_DASAWISMA_RT' },
    { sheetNumber: 7, sheetCode: '07_REKAP_DASAWISMA_2', sheetTitle: 'Rekapitulasi Catatan Data & Kegiatan Warga Kelompok Dasawisma (Mawar & Anggrek)', lampiranRef: 'Lampiran 4.16a', category: 'REKAP_DASAWISMA_RT' },
    { sheetNumber: 8, sheetCode: '08_REKAP_DASAWISMA_3', sheetTitle: 'Rekapitulasi Catatan Data & Kegiatan Warga Kelompok Dasawisma (Kenanga & Bougenville)', lampiranRef: 'Lampiran 4.16a', category: 'REKAP_DASAWISMA_RT' },
    { sheetNumber: 9, sheetCode: '09_REKAP_DASAWISMA_4', sheetTitle: 'Rekapitulasi Catatan Data & Kegiatan Warga Kelompok Dasawisma (Cempaka & Flamboyan)', lampiranRef: 'Lampiran 4.16a', category: 'REKAP_DASAWISMA_RT' },
    { sheetNumber: 10, sheetCode: '10_REKAP_RT_01_02', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga Tingkat RT (RT 01 - RT 02)', lampiranRef: 'Lampiran 4.16b', category: 'REKAP_DASAWISMA_RT' },
    { sheetNumber: 11, sheetCode: '11_REKAP_RT_03_04', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga Tingkat RT (RT 03 - RT 04)', lampiranRef: 'Lampiran 4.16b', category: 'REKAP_DASAWISMA_RT' },
    { sheetNumber: 12, sheetCode: '12_REKAP_RW_01', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga Kelompok PKK RW 01', lampiranRef: 'Lampiran 4.16c', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 13, sheetCode: '13_REKAP_RW_02', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga Kelompok PKK RW 02', lampiranRef: 'Lampiran 4.16c', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 14, sheetCode: '14_REKAP_RW_03', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga Kelompok PKK RW 03', lampiranRef: 'Lampiran 4.16c', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 15, sheetCode: '15_REKAP_DUSUN_GRUDO', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga PKK Dusun Grudo', lampiranRef: 'Lampiran 4.16d', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 16, sheetCode: '16_REKAP_DUSUN_KRAJAN', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga PKK Dusun Krajan', lampiranRef: 'Lampiran 4.16d', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 17, sheetCode: '17_REKAP_DUSUN_MOJOREJO', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga PKK Dusun Mojorejo', lampiranRef: 'Lampiran 4.16d', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 18, sheetCode: '18_REKAP_DUSUN_NGLARANGAN', sheetTitle: 'Rekapitulasi Data & Kegiatan Warga PKK Dusun Nglarangan', lampiranRef: 'Lampiran 4.16d', category: 'REKAP_RW_DUSUN' },
    { sheetNumber: 19, sheetCode: '19_REKAP_DESA_INDUK', sheetTitle: 'Rekapitulasi Catatan Data & Kegiatan Warga TP PKK Desa Grudo', lampiranRef: 'Lampiran 4.17a', category: 'REKAP_DESA' },
    { sheetNumber: 20, sheetCode: '20_REKAP_SANITASI_DESA', sheetTitle: 'Matriks Indikator Kesehatan Lingkungan, Jamban, SPAL & P4K Desa Grudo', lampiranRef: 'Lampiran 4.17b', category: 'REKAP_DESA' },
    { sheetNumber: 21, sheetCode: '21_KELOMPOK_RENTAN_GIZI', sheetTitle: 'Pemantauan Kelompok Rentan (Balita Stunting, Lansia, Disabilitas & 3 Buta)', lampiranRef: 'Lampiran 4.17c', category: 'REKAP_DESA' },
    { sheetNumber: 22, sheetCode: '22_CATATAN_IBU_HAMIL_DASAWISMA', sheetTitle: 'Catatan Ibu Hamil, Melahirkan, Nifas, Ibu Meninggal, Kelahiran & Kematian Bayi/Balita (Dasawisma)', lampiranRef: 'Lampiran 4.18a', category: 'IBU_HAMIL_KELAHIRAN' },
    { sheetNumber: 23, sheetCode: '23_REKAP_BUMIL_RT_RW', sheetTitle: 'Rekapitulasi Ibu Hamil, Kelahiran & Kematian Bayi/Balita Tingkat RT/RW', lampiranRef: 'Lampiran 4.18b', category: 'IBU_HAMIL_KELAHIRAN' },
    { sheetNumber: 24, sheetCode: '24_REKAP_BUMIL_DUSUN', sheetTitle: 'Rekapitulasi Ibu Hamil, Kelahiran & Kematian Bayi/Balita Tingkat Dusun', lampiranRef: 'Lampiran 4.18c', category: 'IBU_HAMIL_KELAHIRAN' },
    { sheetNumber: 25, sheetCode: '25_REKAP_BUMIL_DESA', sheetTitle: 'Rekapitulasi Ibu Hamil, Kelahiran & Kematian Bayi/Balita Tingkat Desa Grudo', lampiranRef: 'Lampiran 4.18d', category: 'IBU_HAMIL_KELAHIRAN' },
    { sheetNumber: 26, sheetCode: '26_LOG_DINAMIKA_PENDUDUK', sheetTitle: 'Register Peristiwa Vital & Mutasi Kependudukan Warga', lampiranRef: 'Lampiran 4.18e', category: 'IBU_HAMIL_KELAHIRAN' },
    { sheetNumber: 27, sheetCode: '27_HATINYA_PKK_PEKARANGAN', sheetTitle: 'Data Pemanfaatan Tanah Pekarangan (TOGA, Sayuran, Tanaman Keras, Kolam, Ternak)', lampiranRef: 'Pokja III - 4.19a', category: 'HATINYA_UP2K' },
    { sheetNumber: 28, sheetCode: '28_UP2K_EKONOMI_KELUARGA', sheetTitle: 'Daftar Kelompok Usaha Peningkatan Pendapatan Keluarga (UP2K) PKK', lampiranRef: 'Pokja II - 4.19b', category: 'HATINYA_UP2K' },
    { sheetNumber: 29, sheetCode: '29_INDUSTRI_RUMAH_TANGGA', sheetTitle: 'Rekapitulasi Industri Rumah Tangga (Pangan, Sandang, Kerajinan & Jasa)', lampiranRef: 'Pokja III - 4.19c', category: 'HATINYA_UP2K' },
    { sheetNumber: 30, sheetCode: '30_KOORDINAT_SPASIAL_GIS', sheetTitle: 'Basis Data Spasial Titik Rumah Tangga & Indeks Kerentanan (GIS Desa Grudo)', lampiranRef: 'SIMPATIK GIS 1.0', category: 'REKAP_DESA' },
    { sheetNumber: 31, sheetCode: '31_AUDIT_VERIFIKASI_KADER', sheetTitle: 'Lembar Kendali Verifikasi Kader RT & Status Digitalisasi Dasawisma', lampiranRef: 'Bhakti Grisa Audit', category: 'REKAP_DESA' },
  ];

  return sheetDefinitions.map((def) => {
    if (def.sheetNumber === 2 || def.sheetNumber === 5) {
      return {
        ...def,
        headers: ['No', 'No. KK', 'Kepala Keluarga', 'Dasawisma', 'RT/RW', 'Dusun', 'Jiwa (L/P)', 'Kriteria Rumah', 'Sumber Air', 'Jamban', 'SPAL', 'Stiker P4K'],
        rows: verified.map((f, idx) => {
          const living = f.anggota.filter((a) => a.statusHidup === 'HIDUP');
          const lCount = living.filter((a) => a.jenisKelamin === 'L').length;
          const pCount = living.filter((a) => a.jenisKelamin === 'P').length;
          return [
            idx + 1,
            f.noKK,
            f.namaKepalaKeluarga,
            f.namaDasawisma,
            `${f.rt}/${f.rw}`,
            f.dusun,
            `${living.length} (${lCount}L/${pCount}P)`,
            f.sanitasi.kriteriaRumah,
            f.sanitasi.sumberAir,
            f.sanitasi.punyaJamban ? `Ya (${f.sanitasi.jumlahJamban})` : 'Tidak',
            f.sanitasi.punyaSpal ? 'Ada' : 'Tidak',
            f.sanitasi.tempelStikerP4k ? 'Terpasang' : 'Belum',
          ];
        }),
      };
    }

    if (def.sheetNumber === 4) {
      const allMembers = verified.flatMap((f) =>
        f.anggota
          .filter((a) => a.statusHidup === 'HIDUP')
          .map((a) => ({ fam: f, member: a }))
      );
      return {
        ...def,
        headers: ['No', 'NIK / Virtual NIK', 'Nama Lengkap', 'Hubungan', 'L/P', 'Tgl Lahir', 'Umur', 'Pendidikan', 'Pekerjaan', 'Indikator Khusus'],
        rows: allMembers.map(({ member }, idx) => {
          const flags = [
            member.isBalita ? 'Balita' : '',
            member.isLansia ? 'Lansia' : '',
            member.isIbuHamil ? 'Ibu Hamil' : '',
            member.isIbuMenyusui ? 'Ibu Menyusui' : '',
            member.isDisabilitas ? 'Disabilitas' : '',
          ]
            .filter(Boolean)
            .join(', ') || 'Warga Umum';
          return [
            idx + 1,
            member.isVirtualNik ? `${member.nik} (Virtual)` : member.nik,
            member.nama,
            member.hubungan,
            member.jenisKelamin,
            member.tanggalLahir,
            member.umur,
            member.pendidikan,
            member.pekerjaan,
            flags,
          ];
        }),
      };
    }

    if (def.category === 'IBU_HAMIL_KELAHIRAN') {
      return {
        ...def,
        headers: ['No', 'Tanggal', 'Jenis Peristiwa', 'Nama Subjek', 'L/P', 'Kepala Keluarga', 'RT/RW', 'Dusun', 'Rincian / Keterangan Medis', 'Petugas Pencatat'],
        rows: events.map((e, idx) => [
          idx + 1,
          e.tanggalPeristiwa,
          e.jenis,
          e.namaSubjek,
          e.jenisKelamin,
          e.namaKepalaKeluarga,
          `${e.rt}/${e.rw}`,
          e.dusun,
          e.keterangan,
          e.dicatatOleh,
        ]),
      };
    }

    if (def.category === 'HATINYA_UP2K' || def.sheetNumber === 3) {
      return {
        ...def,
        headers: ['No', 'Kepala Keluarga', 'Dasawisma', 'RT/RW', 'TOGA', 'Sayuran', 'Tanaman Keras', 'Perikanan', 'Peternakan', 'UP2K Aktif', 'Industri RT', 'Makanan Pokok'],
        rows: verified.map((f, idx) => [
          idx + 1,
          f.namaKepalaKeluarga,
          f.namaDasawisma,
          `${f.rt}/${f.rw}`,
          f.pekarangan.toga ? 'Ya' : 'Tidak',
          f.pekarangan.sayuran ? 'Ya' : 'Tidak',
          f.pekarangan.tanamanKeras ? 'Ya' : 'Tidak',
          f.pekarangan.perikanan ? 'Ya' : 'Tidak',
          f.pekarangan.peternakan ? 'Ya' : 'Tidak',
          f.pekarangan.ikutUp2k ? f.pekarangan.jenisUsahaUp2k || 'Aktif' : 'Tidak',
          f.pekarangan.industriRumahTangga.join(', ') || '-',
          f.pekarangan.makananPokok,
        ]),
      };
    }

    // Rekapitulasi per Wilayah (RT / RW / Dusun / Desa)
    return {
      ...def,
      headers: ['No', 'Kelompok Dasawisma', 'Dusun', 'RT/RW', 'Ketua Dasawisma', 'KK Terverifikasi', 'Total Jiwa', 'Balita', 'Lansia', 'Ibu Hamil', 'Rumah Sehat', 'UP2K Aktif'],
      rows: wilayahList.map((w, idx) => {
        const wFams = verified.filter((f) => f.wilayahId === w.id);
        const wAgg = computeDashboardAggregates(wFams);
        return [
          idx + 1,
          w.namaDasawisma,
          w.dusun,
          `${w.rt}/${w.rw}`,
          w.ketuaDasawisma,
          wAgg.totalKKTerverifikasi,
          wAgg.totalJiwa,
          wAgg.totalBalita,
          wAgg.totalLansia,
          wAgg.totalIbuHamil,
          wAgg.rumahSehat,
          wAgg.kkUp2kAktif,
        ];
      }).concat([
        [
          'TOTAL',
          `REKAPITULASI DESA GRUDO (${tahun})`,
          '4 Dusun',
          'Seluruh RT/RW',
          'TP PKK Desa Grudo',
          agg.totalKKTerverifikasi,
          agg.totalJiwa,
          agg.totalBalita,
          agg.totalLansia,
          agg.totalIbuHamil,
          agg.rumahSehat,
          agg.kkUp2kAktif,
        ],
      ]),
    };
  });
}
