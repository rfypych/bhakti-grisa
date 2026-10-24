# SIMPATIK
> **Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga**  
> Inisiatif Program Inovasi & Pengabdian Masyarakat **Bhakti Grisa**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

---

## 📌 Tentang Proyek

**SIMPATIK** adalah platform web modern berbasis *"Satu Pintu"* (*Single-Entry System*) yang dirancang untuk mengatasi fragmentasi administrasi pendataan Dasawisma dan TP PKK di tingkat desa/kelurahan. 

Sistem ini mentransformasikan berkas manual spreadsheet yang terdiri dari **31 sheet terpisah** (`docs/kolom dasawisma.xlsx`) menjadi satu kesatuan alur kerja digital yang cepat, akurat, dan ramah pengguna bagi ibu-ibu kader di lapangan.

---

## 🚀 Fitur Utama

1. **Formulir Terpadu Satu Pintu (*Multi-Step Wizard*)**:
   - Menggabungkan profil keluarga, kondisi hunian/sanitasi (jamban, air, sampah, SPAL), data individu warga, keikutsertaan program sosial (KB, Posyandu, Tabungan, Koperasi), pemanfaatan pekarangan (*Aku Hatinya PKK*), dan industri rumah tangga (*UP2K*).
   - **Offline-Resilient**: Dilengkapi fitur *Local Draft Auto-Save* (*LocalStorage / IndexedDB*) agar isian formulir tetap aman jika koneksi seluler terputus saat pendataan *door-to-door*.
   - **Virtual Temporary NIK**: Dukungan penomoran sementara (`TEMP-YYYYMMDD-XXXX`) untuk bayi baru lahir atau warga menumpang yang NIK resminya belum terbit.

2. **Alur Verifikasi Dua Arah (*Hybrid Ingestion*)**:
   - Warga dapat mengisi secara mandiri melalui tautan publik RT (`/rt/[id]/form`) dengan verifikasi No. KK/NIK.
   - Data warga masuk ke antrean draft untuk diverifikasi dan disetujui (*approve*) oleh kader Dasawisma/RT sebelum masuk ke agregasi resmi desa.

3. **Mesin Rekapitulasi Berjenjang Otomatis (*Realtime Rollup Engine*)**:
   - Perhitungan otomatis dari tingkat **Dasawisma &rarr; RT &rarr; RW &rarr; Dusun &rarr; Desa** secara *real-time*.
   - Mendukung filter **Periode Pelaporan** (Semesteran / Tahunan) untuk pengarsipan data historis.

4. **Modul Cepat "Lapor Peristiwa" (*Event-Driven Lifecycle Tracker*)**:
   - Menu aksi kilat untuk mencatat kelahiran, kehamilan, nifas, kematian, dan mutasi tanpa perlu menyunting ulang seluruh profil keluarga.

5. **Peta Sebaran Spasial Rumah Warga (*Interactive GIS Map*)**:
   - Visualisasi persebaran rumah warga menggunakan OpenStreetMap / Leaflet dengan indikator pin berkode warna (Rumah Sehat, Perhatian Khusus Balita/Bumil, atau Kurang Sehat).

6. **Mesin Ekspor Ganda Resmi (*Dual Export Engine*)**:
   - **Excel (.xlsx)**: Menggunakan metode *Template Injection* langsung ke berkas asli `docs/kolom dasawisma.xlsx` via `exceljs`, menjamin 100% kesesuaian format dan formula dinas di seluruh 31 sheet.
   - **PDF Siap Cetak**: Tata letak cetak resmi (Lampiran 4.14 s/d 4.19) sesuai standar TP PKK lengkap dengan kop surat dan kolom tanda tangan.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Frontend & Fullstack**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Shadcn/UI Component Library + Lucide React
- **Peta GIS**: [Leaflet](https://leafletjs.com/) / React-Leaflet + OpenStreetMap
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) + SQLite (Portabel untuk server lokal desa) / PostgreSQL
- **Excel Processing**: [ExcelJS](https://github.com/exceljs/exceljs) (Master Template Injection)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 🚀 Menjalankan di Produksi (Runbook)

### Prasyarat
- Node.js 20 atau lebih baru + npm, dengan akses internet saat `npm install` (mengunduh paket dan engine Prisma)
- **LibreOffice** terpasang di server (dipakai route PDF resmi `/api/export/pdf` untuk merender sheet Excel asli menjadi PDF; tanpa LibreOffice fitur PDF gagal tetapi ekspor Excel tetap bekerja)
- Git

### Langkah pemasangan
```bash
git clone https://github.com/rfypych/bhakti-grisa.git
cd bhakti-grisa
npm install
npx prisma db push        # membuat database SQLite baru di prisma/dev.db
npm run seed              # membuat akun Admin Desa pertama (idempoten)
npm run build
npm run start             # http://localhost:3000
```

### Akun pertama & keamanan
- Seed membuat pengguna `admin` dengan kata sandi dari environment `SEED_ADMIN_PASSWORD`, atau default `admin123` bila variabel itu tidak diisi (konsol mencetak peringatan keras). **Segera ganti kata sandi default** lewat menu Pengguna di dashboard, atau jalankan seed dengan `SEED_ADMIN_PASSWORD` terisi sejak awal.
- Atur `AUTH_SECRET` di environment dengan nilai acak yang panjang untuk menandatangani cookie sesi (bila tidak diisi, aplikasi memakai nilai bawaan pengembangan yang TIDAK aman untuk produksi).
- Akun pengelola lain (Kader RT, Pengurus RW, Pengurus Dusun) dibuat oleh Admin Desa dari menu **Pengguna**; tidak ada pendaftaran mandiri. Warga tidak memerlukan akun: mereka mengisi lewat tautan publik per RT `/formulir?wilayahId=...`.

### Konfigurasi identitas desa
Nama desa, kecamatan, kabupaten, dan provinsi pada dokumen ekspor diatur lewat environment (default di `src/lib/siteConfig.ts`):
`DESA_NAMA`, `DESA_KECAMATAN`, `DESA_KABUPATEN`, `DESA_PROVINSI`.

### Catatan operasional
- Database adalah file SQLite (`prisma/dev.db`, tidak ikut ter-commit). Cadangkan file ini secara berkala; seluruh data warga ada di dalamnya.
- File master `docs/kolom dasawisma.xlsx` adalah template resmi dinas dan tidak pernah diubah aplikasi; ekspor selalu bekerja pada salinannya.
- Pengembangan lokal: `npm run dev`. Pemeriksaan kualitas: `npx vitest run` dan `npm run build`.

---

## 📚 Dokumentasi & Spesifikasi

Seluruh perancangan produk dan arsitektur teknis terdokumentasi lengkap di folder `docs/`:

- 📄 [PRD-SIMPATIK.md](docs/PRD-SIMPATIK.md) — Dokumen Kebutuhan Produk (*Product Requirements Document*)
- 📐 [2026-10-22-simpatik-dasawisma-design.md](docs/superpowers/specs/2026-10-22-simpatik-dasawisma-design.md) — Spesifikasi Desain Arsitektur & Skema Database Prisma
- 📋 [2026-10-22-simpatik-implementation-plan.md](docs/superpowers/plans/2026-10-22-simpatik-implementation-plan.md) — Rencana Kerja Implementasi Bertahap (TDD)
- 📊 [kolom dasawisma.xlsx](docs/kolom%20dasawisma.xlsx) — Berkas Master Template Resmi 31 Sheet Dasawisma

---

## 👥 Pengembang & Kontributor

Dikembangkan di bawah inisiatif program **Bhakti Grisa** untuk digitalisasi tata kelola administrasi masyarakat desa yang tertib, transparan, dan berdaya saing.
