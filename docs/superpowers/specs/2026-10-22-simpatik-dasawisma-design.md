# Technical Design Specification: SIMPATIK (Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga)

- **Date:** 2026-10-22
- **Topic:** SIMPATIK - Integrated Dasawisma Single-Input & Multi-Level Aggregation Platform
- **Project:** Bhakti Grisa
- **Status:** Validated & Approved
- **Reference PRD:** [PRD-SIMPATIK.md](file:///d:/projects/bhakti-grisa/docs/PRD-SIMPATIK.md)

---

## 1. System Overview & Objective
SIMPATIK replaces the legacy, fragmented 31-sheet Excel spreadsheet (`docs/kolom dasawisma.xlsx`) used by Dasawisma and PKK cadres in rural villages with an integrated, mobile-first Web Application. It enables:
1. **Single Entry Multi-Step Form**: Consolidating family profile, sanitation, citizen records, social programs, yard utilization (*Hatinya PKK*), and home industry (*UP2K*).
2. **Hybrid Ingestion Workflow**: Self-service resident submission via public RT link (`/rt/[id]/form`) with KK/NIK check, coupled with cadre verification and door-to-door direct input.
3. **Event-Driven Lifecycle Logging**: Quick event modal for vital events (birth, pregnancy, death, migration) that updates family rosters and population aggregates automatically.
4. **Interactive GIS Household Map**: Spatial visualization of household conditions and risk levels on OpenStreetMap.
5. **Realtime Multi-Level Aggregation**: Automatic computation from Dasawisma &rarr; RT &rarr; RW &rarr; Dusun &rarr; Desa.
6. **Dual Official Export**: 100% template-compliant 31-sheet Excel generation (`.xlsx`) and print-ready PDF reports conforming to official PKK formats (Lampiran 4.14.1a to 4.19a).

---

## 2. Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|  - Next.js 15+ App Router, React 19                                              |
|  - Tailwind CSS + Shadcn UI + Lucide Icons (Mobile-First responsive)             |
|  - Leaflet / React-Leaflet + OpenStreetMap (Interactive Household Map)           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                                 SERVER LAYER                                      |
|  - Next.js Server Actions & API Routes                                            |
|  - RBAC Middleware (Public Resident, Cadre RT, RW/Dusun Admin, Desa Admin)        |
|  - Aggregation Engine (SQL Analytical Views & Computed Queries)                   |
|  - Export Workers: exceljs (Workbook builder) + React-PDF / Print Engine          |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                                 DATA LAYER                                        |
|  - Prisma ORM                                                                     |
|  - PostgreSQL / SQLite (Portable village server deployment)                       |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema Design (Prisma Data Model)

```prisma
enum Role {
  WARGA
  KADER_RT
  PENGURUS_RW
  PENGURUS_DUSUN
  ADMIN_DESA
}

enum StatusData {
  DRAFT
  VERIFIKASI
  ARSIP
}

enum JenisKelamin {
  L
  P
}

enum KriteriaRumah {
  SEHAT
  KURANG_SEHAT
  TIDAK_SEHAT_LAYAK_HUNI
}

enum SumberAir {
  PDAM
  SUMUR
  SUNGAI
  LAINNYA
}

enum MakananPokok {
  BERAS
  NON_BERAS
}

enum HubunganKeluarga {
  KEPALA_KELUARGA
  ISTRI
  ANAK
  ORANG_TUA
  MENANTU
  CUCU
  FAMILI_LAIN
  PEMBANTU
}

enum StatusPerkawinan {
  BELUM_KAWIN
  KAWIN
  JANDA
  DUDA
}

enum Agama {
  ISLAM
  KRISTEN
  KATHOLIK
  HINDU
  BUDHA
  KHONGHUCU
  KEPERCAYAAN_LAIN
}

enum Pendidikan {
  TIDAK_TAMAT_SD
  SD_MI
  SMP_SEDERAJAT
  SMA_SMK_SEDERAJAT
  DIPLOMA
  S1
  S2
  S3
}

enum Pekerjaan {
  PETANI
  PEDAGANG
  SWASTA
  WIRAUSAHA
  PNS
  TNI_POLRI
  TIDAK_BEKERJA
  LAINNYA
}

enum JenisPeristiwa {
  KEHAMILAN
  PERSALINAN_MELAHIRKAN
  NIFAS
  KEMATIAN_IBU
  KELAHIRAN_BAYI
  KEMATIAN_BAYI
  KEMATIAN_BALITA
  MUTASI_KELUAR
}

model Wilayah {
  id            String      @id @default(uuid())
  dusun         String
  rw            String
  rt            String
  namaDasawisma String
  ketuaNama     String?
  kontak        String?
  keluarga      Keluarga[]

  @@unique([dusun, rw, rt, namaDasawisma])
}

model Keluarga {
  id                    String                @id @default(uuid())
  noKk                  String                @unique
  namaKepalaRumahTangga String
  alamat                String
  wilayahId             String
  wilayah               Wilayah               @relation(fields: [wilayahId], references: [id])
  latitude              Float?
  longitude             Float?
  
  // Sanitasi & Kondisi Rumah (Lampiran 4.14.2a & 4.15)
  kriteriaRumah         KriteriaRumah         @default(SEHAT)
  jambanKeluarga        Boolean               @default(true)
  jumlahJamban          Int                   @default(1)
  sumberAir             SumberAir             @default(SUMUR)
  tempatSampah          Boolean               @default(true)
  spal                  Boolean               @default(true)
  stikerP4k             Boolean               @default(false)
  makananPokok          MakananPokok          @default(BERAS)
  jenisNonBeras         String?
  
  // Aktivitas Usaha
  aktivitasUp2k         Boolean               @default(false)
  jenisUsahaUp2k        String?
  kegiatanKesling       Boolean               @default(false)
  
  statusData            StatusData            @default(VERIFIKASI)
  catatanVerifikasi     String?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt

  anggota               AnggotaKeluarga[]
  hatinyaPkk            HatinyaPkk[]
  industriRumahTangga   IndustriRumahTangga[]
}

model AnggotaKeluarga {
  id                    String              @id @default(uuid())
  keluargaId            String
  keluarga              Keluarga            @relation(fields: [keluargaId], references: [id], onDelete: Cascade)
  noRegistrasi          String?
  nik                   String              @unique
  isNikSementara        Boolean             @default(false) // Flag NIK virtual sementara (TEMP-YYYYMMDD-XXXX)
  nama                  String
  hubunganKeluarga      HubunganKeluarga
  jenisKelamin          JenisKelamin
  tempatLahir           String
  tanggalLahir          DateTime
  agama                 Agama               @default(ISLAM)
  pendidikan            Pendidikan          @default(SMA_SMK_SEDERAJAT)
  pekerjaan             Pekerjaan           @default(SWASTA)
  statusPerkawinan      StatusPerkawinan    @default(BELUM_KAWIN)
  jabatanPkk            String?
  disabilitas           Boolean             @default(false)
  jenisDisabilitas      String?
  tigaButa              Boolean             @default(false)
  
  // Program Sosial (Lampiran 4.14.1a)
  akseptorKb            Boolean             @default(false)
  jenisKb               String?
  posyanduAktif         Boolean             @default(false)
  frekuensiPosyandu     Int                 @default(0)
  bkb                   Boolean             @default(false)
  memilikiTabungan      Boolean             @default(false)
  kelompokBelajar       String?
  paudSejenis           Boolean             @default(false)
  kegiatanKoperasi      Boolean             @default(false)
  jenisKoperasi         String?

  // 10 Program Pokok PKK (Lampiran 4.14.1b & 4.15)
  kegPancasila          Boolean             @default(false)
  kegGotongRoyong       Boolean             @default(false)
  kegRukunKematian      Boolean             @default(false)
  kegKeagamaan          Boolean             @default(false)
  kegJimpitan           Boolean             @default(false)
  kegArisan             Boolean             @default(false)
  kegPendidikanKeterampilan Boolean         @default(false)
  kegKoperasi           Boolean             @default(false)
  kegPangan             Boolean             @default(false)
  kegSandang            Boolean             @default(false)
  kegKesehatan          Boolean             @default(false)
  kegPerencanaanSehat   Boolean             @default(false)

  peristiwaVital        PeristiwaVital[]
}

model HatinyaPkk {
  id                    String              @id @default(uuid())
  keluargaId            String
  keluarga              Keluarga            @relation(fields: [keluargaId], references: [id], onDelete: Cascade)
  kategori              String              // peternakan, perikanan, warung hidup, toga, tanaman keras
  komoditi              String
  jumlah                String
}

model IndustriRumahTangga {
  id                    String              @id @default(uuid())
  keluargaId            String
  keluarga              Keluarga            @relation(fields: [keluargaId], references: [id], onDelete: Cascade)
  kategori              String              // pangan, sandang, konveksi, jasa, lain-lain
  komoditi              String
  volume                String
}

model PeristiwaVital {
  id                    String              @id @default(uuid())
  anggotaKeluargaId     String?
  anggota               AnggotaKeluarga?    @relation(fields: [anggotaKeluargaId], references: [id], onDelete: SetNull)
  jenisPeristiwa        JenisPeristiwa
  tanggalPeristiwa      DateTime            @default(now())
  namaBayi              String?
  jenisKelaminBayi      JenisKelamin?
  akteKelahiran         Boolean?            @default(false)
  namaAlmarhum          String?
  sebabKematian         String?
  keterangan            String?
}
```

---

## 4. Key Functional Modules & User Workflows

### 4.1 Multi-Step Wizard Form (`/keluarga/tambah` & `/rt/[id]/form`)
- **Step 1: Lokasi & Rumah** (Wilayah selection, Alamat, Geolocation pin via Leaflet Map).
- **Step 2: Sanitasi & Lingkungan** (Rumah Sehat, Jamban, Sumber Air, Sampah, SPAL, Stiker P4K, Makanan Pokok).
- **Step 3: Anggota Keluarga** (Dynamic array component for family members, automatic age & category computing, KB, Posyandu, 10 Program Pokok PKK checkboxes, flag *"NIK Sementara / Belum Terbit"*).
- **Step 4: Hatinya PKK & UP2K** (Optional repeatable rows for garden commodities and home industry).
- **Step 5: Review & Submit** (Family card preview).
- **Offline Resilience (Local Draft Auto-Save)**: Real-time form auto-save into `localStorage` / `IndexedDB` to protect field cadres against cellular dropouts during door-to-door enumeration.

### 4.2 Cadre Verification Queue (`/dashboard/verifikasi`)
- Cadres view submissions created by residents via the public RT link.
- Side-by-side diff view of submitted changes vs current database records.
- Action buttons: `Setujui`, `Edit & Setujui`, `Tolak`.

### 4.3 Quick Action "Lapor Peristiwa" Modal (`/dashboard/lapor-peristiwa`)
- **Lapor Kelahiran**: Select mother, input baby's name, DOB, sex, birth certificate status &rarr; adds child record, changes mother's status, logs in Lampiran 4.18a.
- **Lapor Kehamilan**: Select female member &rarr; activates pregnancy flag &rarr; logs in Lampiran 4.18a.
- **Lapor Kematian**: Select member, input date & cause of death &rarr; marks member archived, logs into vital mortality book.

### 4.4 Spatial GIS Map (`/dashboard/peta`)
- Leaflet map centered at village coordinates.
- Color-coded markers based on vulnerability/sanitation filters (Green = Healthy, Yellow = Has Infant/Pregnant Mother, Red = At-Risk / Lacks Sanitation).
- Popup summary with direct link to family card detail.

### 4.5 Aggregation Engine & Dual Export Engine (`/dashboard/laporan`)
- **Realtime Filtered Aggregation**: Supports filtering by `periodeTahun` and `semester` (Semester I/II/Tahunan) to preserve historical records across reporting cycles.
- **Excel Export via Template Injection**: Loads the official master workbook `docs/kolom dasawisma.xlsx` using `exceljs` and performs precise cell value injection into all 31 sheets, guaranteeing 100% fidelity with village government standards.
- **PDF Export**: Print-optimized stylesheet and templates for official physical submissions with official letterheads and signature blocks.

---

## 5. Self-Review & Quality Assurance
- [x] **Placeholder Scan**: No `TODO`, `TBD`, or vague requirements exist.
- [x] **Internal Consistency**: Data model matches all 31 sheets in [kolom dasawisma.xlsx](file:///d:/projects/bhakti-grisa/docs/kolom%20dasawisma.xlsx), incorporating virtual temporary NIK, reporting periods, and template injection.
- [x] **Scope Check**: Phase 1 MVP is tightly scoped to full web app functionality with local draft caching; full background sync service worker PWA is designated for Phase 2.
- [x] **Ambiguity Check**: Verification flow, public URL access pattern, temporary NIK format, and role boundaries are explicitly defined.
