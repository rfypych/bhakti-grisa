# SIMPATIK
> **Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga**  
> Inisiatif Program Inovasi & Pengabdian Masyarakat **Bhakti Grisa**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Planning & Specification](https://img.shields.io/badge/Status-Planning%20%26%20Spec%20Ready-success.svg)]()

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

## 📚 Dokumentasi & Spesifikasi

Seluruh perancangan produk dan arsitektur teknis terdokumentasi lengkap di folder `docs/`:

- 📄 [PRD-SIMPATIK.md](docs/PRD-SIMPATIK.md) — Dokumen Kebutuhan Produk (*Product Requirements Document*)
- 📐 [2026-10-22-simpatik-dasawisma-design.md](docs/superpowers/specs/2026-10-22-simpatik-dasawisma-design.md) — Spesifikasi Desain Arsitektur & Skema Database Prisma
- 📋 [2026-10-22-simpatik-implementation-plan.md](docs/superpowers/plans/2026-10-22-simpatik-implementation-plan.md) — Rencana Kerja Implementasi Bertahap (TDD)
- 📊 [kolom dasawisma.xlsx](docs/kolom%20dasawisma.xlsx) — Berkas Master Template Resmi 31 Sheet Dasawisma

---

## 👥 Pengembang & Kontributor

Dikembangkan di bawah inisiatif program **Bhakti Grisa** untuk digitalisasi tata kelola administrasi masyarakat desa yang tertib, transparan, dan berdaya saing.
