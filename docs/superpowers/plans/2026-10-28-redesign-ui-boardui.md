# Redesain UI Bhakti-Grisa 1:1 Sesuai Referensi BoardUI (`simpatik-frontend`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Merombak tampilan UI proyek Bhakti-Grisa agar 100% identik secara visual, token desain, dan pengalaman pengguna dengan repositori referensi `rfypych/simpatik-frontend` (BoardUI Design System) tanpa merusak user flow dan menjaga integritas Server Actions, Prisma ORM, dan SQLite backend.

**Architecture:** Memindahkan seluruh fondasi token BoardUI (tema, tipografi, warna aksen emerald/green, efek `bui-hero-rays`, dan utility class) ke dalam Next.js + Tailwind CSS, menyediakan komponen dasar BoardUI 1:1 di `src/components/boardui/index.tsx`, mengadopsi tata letak PublicLayout dan DashboardLayout cerdas (collapsible sidebar 36px icon grid, dynamic breadcrumbs, `⌘L` search), serta merombak seluruh halaman publik dan dashboard agar identik dengan referensi seraya tetap terhubung ke live Prisma DB & Server Actions.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide React, BoardUI Design System tokens, Prisma ORM, SQLite.

**Spec:** `spec-ui-redesign-simpatik-boardui.md`

## Global Constraints

- Integritas Flow User: Seluruh alur (pengisian formulir mandiri, verifikasi kader, pencatatan peristiwa vital, ekspor 31 sheet, dan peta GIS) harus tetap berfungsi normal.
- Preservasi Server Actions: Jangan menghapus atau mengubah interface `authActions`, `keluargaActions`, `peristiwaActions`, `verifikasiActions`, `wilayahActions`, dan `penggunaActions`.
- Kemiripan Visual 1:1: Semua token warna, tipografi, padding, border radius (`rounded-2lg`, `rounded-2-5xl`), dan efek visual (`bui-hero-rays`, `shadow-sidebar`) harus sesuai dengan `simpatik-ref`.
- Responsif & Aksesibel: Layout harus reflow secara rapi di layar mobile (hamburger/bottom bar & drawer) dan desktop.

## Review Focus

- Formulir Mandiri (`/formulir`): Penyimpanan draft ke `localStorage` dan submit data keluarga ke `saveKeluargaAction` harus menghasilkan data berstatus `DRAFT`.
- Login Petugas (`/login`): Autentikasi dengan kredensial kader/admin harus berhasil mengeset sesi cookie dan me-redirect ke `/dashboard`.
- Dashboard Verifikasi (`/dashboard/verifikasi`): Kader RT hanya memverifikasi RT miliknya, admin desa dapat memverifikasi seluruh desa; tombol tolak harus membuka modal catatan revisi.
- Peta GIS (`/dashboard/peta`): Pin indikator severity (Hijau, Kuning, Merah) harus muncul sesuai data sanitasi/kerentanan keluarga.
- Ekspor 31 Sheet (`/dashboard`): Tombol ekspor Excel dan PDF serta modal live preview 31 Sheet harus dapat dibuka tanpa runtime error.

---

### Task 1: Fondasi Desain & Komponen BoardUI

**Files:**
- Create: `public/brand/boardui_logo_circle.webp`
- Create: `src/styles/theme.css`
- Create: `src/styles/typography.css`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `src/components/boardui/index.tsx`
- Create: `tests/boardui.test.tsx`

- [x] **Step 1: Copy brand logo asset**
  Copy `simpatik-ref/public/brand/boardui_logo_circle.webp` ke `public/brand/boardui_logo_circle.webp`.
- [x] **Step 2: Setup CSS theme and typography tokens**
  Salin dan sesuaikan `src/styles/theme.css` dan `src/styles/typography.css` dari `simpatik-ref` ke `src/styles/`, pastikan token warna semantik (`--color-background-primary-default`, `--color-accent-500`, `--color-text-primary`, dll.) dan efek `bui-hero-rays` didefinisikan secara lengkap.
- [x] **Step 3: Update `src/app/globals.css` & `tailwind.config.ts`**
  Impor `theme.css` dan `typography.css` pada `src/app/globals.css`. Konfigurasi `tailwind.config.ts` untuk memetakan utility class BoardUI (`bg-background-*`, `text-text-*`, `border-border-*`, `shadow-sidebar`, `rounded-2lg`, dll.) sehingga Tailwind v3 dapat mengenali seluruh utility class BoardUI.
- [x] **Step 4: Create `src/components/boardui/index.tsx`**
  Implementasikan seluruh komponen BoardUI 1:1 dari `simpatik-ref/src/components/boardui/index.tsx`:
  `BoardLogo`, `BoardAvatar`, `BoardBadge`, `BoardChip`, `BoardKbd`, `BoardBreadcrumb`, `BoardBreadcrumbItem`, `BoardSurface`, `BoardStatCard`, `BoardButton`, `BoardSegmentedControl`, `BoardCallout`, `BoardModal`, `BoardStatusLabel`, `BoardEmptyState`.
- [x] **Step 5: Write unit test to verify BoardUI components**
  Buat `tests/boardui.test.tsx` untuk memverifikasi rendering `BoardButton`, `BoardStatCard`, dan `BoardChip`.
- [x] **Step 6: Run tests and verify**
  Jalankan `npm run test` untuk memastikan Task 1 berfungsi.

---

### Task 2: Tata Letak Publik & Halaman Tentang Inisiatif

**Files:**
- Create: `src/components/layout/PublicLayout.tsx`
- Create: `src/app/tentang/page.tsx`
- Test: Build / typecheck via `npx tsc --noEmit`

- [x] **Step 1: Create `src/components/layout/PublicLayout.tsx`**
  Bangun layout publik identik dengan `simpatik-ref/src/components/layout/PublicLayout.tsx`:
  - Header navigasi sticky glassmorphic dengan logo bulat `BoardLogo`, nama sistem `SIMPATIK Grudo`, badge versi `v1.0.1`, pil navigasi rute (`/`, `/formulir`, `/tentang`, `/login`), dan tombol aksi header (`Portal Kader` / `Buka Dashboard Petugas`).
  - Mobile menu drawer untuk layar sentuh/ponsel.
  - Footer resmi TP PKK Desa Grudo dengan informasi kontak, jam pelayanan kantor desa, tautan kebijakan, dan hak cipta.
- [x] **Step 2: Create `src/app/tentang/page.tsx`**
  Bangun halaman Tentang Inisiatif identik dengan `simpatik-ref/src/pages/PublicTentang.tsx`:
  - Profil inisiatif Bhakti Grisa & TP PKK Desa Grudo.
  - Tabel Matriks RBAC berjenjang (Warga, Kader RT, Pengurus RW, Dusun, Admin Desa).
  - Rincian dasar hukum TP PKK dan stack teknologi modern.
- [x] **Step 3: Verify TypeScript compilation**
  Jalankan `npx tsc --noEmit` untuk memastikan tidak ada error.

---

### Task 3: Redesain Halaman Beranda (Landing) & Login Petugas

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`
- Test: Typecheck & run dev verification

- [x] **Step 1: Redesign `src/app/page.tsx` (Beranda Publik)**
  Implementasikan tampilan identik `simpatik-ref/src/pages/PublicBeranda.tsx`:
  - BoardUI Hero Section dengan efek `bui-hero-rays`, Announcement Pill "SIMPATIK 1.0", headline berkelas, dan tombol CTA utama "Isi Formulir Keluarga Mandiri".
  - Transparency Ledger: 4 `BoardStatCard` interaktif yang menampilkan agregasi data nyata dari database Prisma (`totalKK`, `totalJiwa`, `activeWilayah`, `digitalisasiPercent`).
  - BoardUI Quick Access Bar dengan perintah salin CLI.
  - Direktori Kelompok RT Domisili dengan filter dusun cepat dan tombol klik untuk langsung mengisi form berdasarkan RT yang dipilih.
  - FAQ Accordion interaktif berisi pertanyaan umum warga (NIK sementara bayi, kerahasiaan data, auto-save draft, alur verifikasi).
- [x] **Step 2: Redesign `src/app/login/page.tsx` (Login Petugas)**
  Implementasikan tampilan identik `simpatik-ref/src/pages/PublicLogin.tsx`:
  - Split `AuthCard` layout: sisi kanan kartu inovasi TP PKK, sisi kiri form masuk kredensial.
  - Demo quick test account switcher untuk mempermudah pengujian berbagai peran (Kader RT, Pengurus RW, Dusun, Admin Desa).
  - Terintegrasi penuh dengan Server Action `loginAction` untuk membuat sesi cookie `session_token` dan redirect ke `/dashboard`.
- [x] **Step 3: Verify build & flow**
  Jalankan `npx tsc --noEmit` untuk memastikan tidak ada sintaks error.

---

### Task 4: Redesain Formulir Mandiri 5 Langkah

**Files:**
- Modify: `src/app/formulir/page.tsx`
- Modify: `src/components/form/MultiStepForm.tsx` (atau komponen langkah terkait)
- Test: Form state & submission validation

- [x] **Step 1: Update Formulir Layout & Stepper**
  Sesuaikan tata letak halaman formulir sesuai `simpatik-ref/src/pages/PublicFormulir.tsx`:
  - Header ringkas dengan info wilayah terpilih dan pill progres 5 langkah:
    1. Wilayah & Bangunan
    2. Sanitasi & Lingkungan
    3. Anggota Keluarga (dengan Virtual NIK Generator otomatis)
    4. Pemanfaatan Pekarangan & UP2K
    5. Konfirmasi & Pengiriman
  - Indikator status penyimpanan draft otomatis (`localStorage`).
  - Indikator live household severity calculation (Normal, Pantau, Kritis).
- [x] **Step 2: Connect Form to `saveKeluargaAction`**
  Pastikan ketika warga menekan "Kirim Formulir Keluarga", data dikirimkan ke `saveKeluargaAction(formData, true)` sehingga tersimpan ke SQLite via Prisma dengan status `DRAFT`.
  Setelah berhasil, tampilkan konfirmasi sukses dengan nomor KK dan tombol cetak bukti draft / kembali ke beranda.
- [x] **Step 3: Verify build**
  Jalankan `npx tsc --noEmit` untuk memverifikasi tipe form data.

---

### Task 5: Redesain Layout Dashboard & Halaman Overview (Home)

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Test: Dashboard page render and interactive modal

- [x] **Step 1: Redesign `src/app/dashboard/layout.tsx`**
  Implementasikan layout dashboard identik dengan `simpatik-ref/src/components/layout/DashboardLayout.tsx`:
  - Smart Collapsible Sidebar: transisi halus lebar sidebar (220px ke collapsed icon mode) mengunci ikon pada grid 36px, menu navigasi lengkap dengan badge counter untuk antrean verifikasi DRAFT.
  - Top header: breadcrumb dinamis, shortcut input pencarian global `Ctrl/Cmd + L`, badge peran pengguna (RBAC), info nama kader & wilayah, tombol keluar (`logoutAction`), dan toggle dark mode.
- [x] **Step 2: Redesign `src/app/dashboard/page.tsx` (Dashboard Overview)**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardHome.tsx`:
  - 4 `BoardStatCard` indikator utama (Total KK Terverifikasi, Total Jiwa, Wilayah Aktif, Persentase Digitalisasi).
  - Filter Wilayah RT & Tahun Pendataan.
  - Tombol aksi cepat: "Unduh Excel 31 Sheet" (memanggil `/api/export/excel`), "Unduh PDF Resmi" (memanggil `/api/export/pdf`), dan "Live Preview 31 Sheet".
  - Modal Live Preview 31 Sheet Buku Dasawisma dengan tab pemilihan sheet 1-31 dan pratinjau tabel matriks data.
  - Tabel data keluarga terverifikasi dengan chip status keparahan rumah tangga dan aksi detail.
- [x] **Step 3: Verify build**
  Jalankan `npx tsc --noEmit`.

---

### Task 6: Redesain Halaman Verifikasi, Lapor Peristiwa & Peta Spasial GIS

**Files:**
- Modify: `src/app/dashboard/verifikasi/page.tsx`
- Modify: `src/app/dashboard/lapor-peristiwa/page.tsx`
- Modify: `src/app/dashboard/peta/page.tsx`
- Test: Server actions integration

- [x] **Step 1: Redesign `src/app/dashboard/verifikasi/page.tsx`**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardVerifikasi.tsx`:
  - Segmented control filter (DRAFT, VERIFIKASI, DITOLAK).
  - Kartu berkas keluarga dengan ringkasan sanitasi, anggota, dan koordinat.
  - Tombol Verifikasi Instan (memanggil `approveSubmissionAction`).
  - Modal Penolakan Berkas dengan input catatan revisi (memanggil `rejectSubmissionAction`).
- [x] **Step 2: Redesign `src/app/dashboard/lapor-peristiwa/page.tsx`**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardPeristiwa.tsx`:
  - 3 Kartu Aksi Peristiwa: Lapor Kelahiran, Lapor Kematian, Lapor Mutasi/Kehamilan.
  - Modal Lapor Kelahiran dengan auto-generate NIK bayi sementara (memanggil `laporKelahiranAction`).
  - Modal Lapor Kematian (memanggil `laporKematianAction`).
  - Tabel log histori peristiwa vital dengan filter jenis peristiwa.
- [x] **Step 3: Redesign `src/app/dashboard/peta/page.tsx`**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardPeta.tsx`:
  - Peta spasial GIS interaktif dengan styling kadaster desa.
  - Kontrol filter tingkat kerentanan keluarga (Semua, Normal, Pantau, Kritis).
  - Pin penanda rumah tangga dengan warna status; klik pin membuka panel detail keluarga di samping peta.
- [x] **Step 4: Verify build**
  Jalankan `npx tsc --noEmit`.

---

### Task 7: Redesain Wilayah, Pengguna & Cetak Laporan (Lampiran 4.15)

**Files:**
- Modify: `src/app/dashboard/wilayah/page.tsx`
- Modify: `src/app/dashboard/pengguna/page.tsx`
- Modify: `src/app/dashboard/laporan/cetak/[id]/page.tsx`
- Test: Verification of safety guard & print layout

- [x] **Step 1: Redesign `src/app/dashboard/wilayah/page.tsx`**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardWilayah.tsx`:
  - Ringkasan wilayah per Dusun, RW, dan RT.
  - Modal tambah & edit wilayah RT.
  - Proteksi *Safety Guard* yang mengecek apakah ada KK aktif sebelum mengizinkan penghapusan wilayah (terhubung ke `hapusWilayahAction`).
- [x] **Step 2: Redesign `src/app/dashboard/pengguna/page.tsx`**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardPengguna.tsx`:
  - Tabel daftar petugas dan kader PKK dengan badge peran RBAC.
  - Modal pembuatan akun kader/petugas baru.
  - Modal reset kata sandi petugas.
  - Toggle status aktif/nonaktif akun.
- [x] **Step 3: Redesign `src/app/dashboard/laporan/cetak/[id]/page.tsx`**
  Implementasikan tampilan identik `simpatik-ref/src/pages/DashboardCetak.tsx`:
  - Toolbar kontrol dengan tombol kembali, pilih KK, dan tombol Cetak Dokumen (`window.print()`).
  - Tampilan format resmi Lampiran 4.15 Catatan Keluarga TP PKK dengan tabel anggota, sanitasi, dan kriteria rumah.
  - Print stylesheet khusus media print agar cetakan presisi pada kertas F4/A4 tanpa elemen dashboard.
- [x] **Step 4: Verify build**
  Jalankan `npx tsc --noEmit`.

---

### Task 8: Pengujian Menyeluruh (End-to-End Build & Functional Verification)

**Files:**
- All modified files
- Tests

- [x] **Step 1: Run comprehensive tests**
  Jalankan `npm run test` untuk memastikan semua test unit dan integrasi lolos.
- [x] **Step 2: Run production build**
  Jalankan `npm run build` untuk memverifikasi proses kompilasi Next.js berhasil 100% tanpa error SSR, dynamic routing, atau linting.
- [x] **Step 3: End-to-end user flow check**
  Pastikan alur warga (isi form mandiri), alur verifikasi kader, alur lapor peristiwa, ekspor Excel/PDF, dan navigasi dashboard berjalan sempurna sesuai desain referensi.
