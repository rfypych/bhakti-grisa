# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## SIMPATIK: Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga
**Inisiatif Program Inovasi:** Bhakti Grisa  
**Versi:** 1.0 (Final Draft)  
**Tanggal:** 22 Oktober 2026  
**Status:** Disetujui (Approved)  
**Dokumen Rujukan:** `docs/kolom dasawisma.xlsx`, Rekaman Percakapan Kebutuhan Lapangan (`docs/PTT-20261022-WA0008.opus`)

---

## 1. Executive Summary & Latar Belakang Masalah

### 1.1 Latar Belakang
Dasawisma adalah unit terkecil dari Gerakan PKK (Pemberdayaan dan Kesejahteraan Keluarga) di tingkat rukun tetangga (RT), biasanya membina 10–20 kepala keluarga (KK). Selama ini, administrasi pendataan Dasawisma di desa dilakukan secara manual menggunakan buku fisik atau berkas spreadsheet yang sangat terfragmentasi.

Berdasarkan analisis terhadap format baku pada berkas `docs/kolom dasawisma.xlsx`, ditemukan terdapat **31 sheet terpisah** yang membagi data warga, kegiatan warga, data keluarga, pemanfaatan pekarangan (*Hatinya PKK*), industri rumah tangga, catatan keluarga, hingga lembar rekapitulasi berjenjang (Dasawisma &rarr; RT &rarr; RW &rarr; Dusun &rarr; Desa) dan rekapitulasi catatan ibu hamil/melahirkan/kematian balita.

### 1.2 Masalah Utama (Pain Points)
1. **Redundansi dan Duplikasi Input**: Kader Dasawisma harus mengetikkan atau menuliskan nama warga, nomor KK, dan NIK yang sama berulang kali di berbagai sheet/buku yang berbeda (sheet data warga, catatan keluarga, rekap RT, rekap bumil).
2. **Beban Kerja Tinggi & Human Error**: Proses penghitungan agregat berjenjang (menjumlahkan balita, PUS, WUS, lansia, rumah sehat, jamban, dll.) dilakukan secara manual di tabel Excel terpisah, sehingga sangat rentan salah hitung (*miscalculation*).
3. **Pembaruan Data Lambat**: Data cepat kedaluwarsa karena peristiwa vital harian (warga melahirkan, bayi bertambah, kematian, atau kepindahan) tidak langsung memperbarui tabel rekapitulasi.
4. **Keterbatasan Format Fisik**: Jika kantor desa atau kecamatan meminta laporan fisik resmi (Lampiran 4.14 s/d 4.19), kader harus menyalin ulang atau mengatur tata letak cetak secara manual satu per satu.

### 1.3 Visi & Solusi: Sistem SIMPATIK
SIMPATIK hadir sebagai solusi **"Satu Pintu" (*Single Entry System*)** terintegrasi:
- Menggantikan puluhan sheet terpisah menjadi **1 formulir digital terpadu** berbasis keluarga.
- Menerapkan **Agregasi Otomatis Berjenjang** secara *real-time* dari tingkat Dasawisma hingga tingkat Desa.
- Mengadopsi inspirasi dari **Portal Buku Induk / PPDB Pak Slamet**: antarmuka terpusat di mana pemangku kepentingan (kader, ketua RT, pengurus PKK, pihak desa) dapat melihat profil lengkap keluarga secara visual, termasuk titik koordinat spasial rumah di peta (*GIS Map*).
- Menyediakan fleksibilitas akses **Hybrid**: pengisian mandiri oleh warga via tautan publik RT dengan verifikasi No KK, serta input langsung dan validasi oleh kader.
- Menyediakan **Ekspor Ganda Resmi**: unduhan Excel otomatis yang sesuai 100% dengan format baku 31 sheet desa, serta PDF siap cetak dengan layout resmi kop PKK.

---

## 2. Tujuan Sistem & Indikator Keberhasilan (Success Metrics)

| Parameter | Kondisi Saat Ini (Manual / Spreadsheet Lama) | Target SIMPATIK (Sistem Baru) |
|---|---|---|
| **Waktu Pengisian per Keluarga** | 30–45 menit (pindah-pindah 5–8 sheet terpisah) | 5–10 menit (Formulir Multi-Step Wizard terpadu) |
| **Penyusunan Rekap Berjenjang** | Berhari-hari menjelang rapat evaluasi bulanan | 0 menit (*Real-time automated calculation*) |
| **Akurasi Perhitungan Agregat** | Rawan selisih antar-tingkatan RT/RW/Desa | 100% akurat berbasis kalkulasi database otomatis |
| **Keterkinian Data (Data Freshness)** | Diperbarui per semester / tahunan | Selalu mutakhir dengan modul "Lapor Peristiwa" |
| **Aksesibilitas Kader di Lapangan** | Membawa buku tebal / laptop berat | Cukup menggunakan *smartphone* (tampilan mobile-friendly) |

---

## 3. Struktur Pengguna & Hak Akses (User Personas & RBAC)

Sistem SIMPATIK menerapkan kontrol akses berbasis peran (*Role-Based Access Control*):

```
+--------------------------------------------------------------------------+
|                               PUBLIK / WARGA                             |
|  - Mengisi mandiri via Tautan RT (/rt/:id/form)                          |
|  - Cek Nomor KK & NIK Kepala Keluarga                                    |
|  - Input berstatus DRAFT (Menunggu Verifikasi Kader)                     |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+------------------------------------+-------------------------------------+
|                       KADER DASAWISMA / IBU RT                           |
|  - Login akun RT / Dasawisma                                             |
|  - Verifikasi, edit, dan setujui input mandiri warga                     |
|  - Input langsung data keluarga baru di lapangan (door-to-door)          |
|  - Akses cepat tombol "Lapor Peristiwa" (Lahir, Hamil, Wafat, Pindah)    |
|  - Melihat & mencetak Rekap Tingkat RT & Dasawisma                       |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+------------------------------------+-------------------------------------+
|                      PENGURUS PKK RW & DUSUN                             |
|  - Login akun RW / Kepala Dusun                                          |
|  - Memantau progres pendataan tiap RT di lingkungannya                   |
|  - Melihat visualisasi Peta GIS Rumah Warga per wilayah                  |
|  - Mengunduh rekapitulasi Lampiran 4.16c (RW) dan 4.16d (Dusun)          |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+------------------------------------+-------------------------------------+
|              TP PKK DESA / KELURAHAN & ADMIN DESA                        |
|  - Kontrol penuh seluruh wilayah Desa                                    |
|  - Dashboard Statistik Eksekutif (Stunting, Rumah Sehat, Sanitasi, UP2K) |
|  - Ekspor seluruh format resmi (Excel 31 sheet & PDF Cetak)              |
|  - Manajemen Akun Wilayah (Dusun, RW, RT, Dasawisma)                     |
+--------------------------------------------------------------------------+
```

---

## 4. Normalisasi Data & Pemetaan Lengkap 31 Sheet Excel

Seluruh 31 sheet di berkas `docs/kolom dasawisma.xlsx` dipetakan ke dalam skema database relasional terstruktur:

### 4.1 Entitas `WilayahAdministrasi`
Mencakup hirarki: `Dusun` &rarr; `RW` &rarr; `RT` &rarr; `KelompokDasawisma`.
- Menyimpan nama wilayah, nomor identifikasi, dan nama penanggung jawab / Ketua Dasawisma.

### 4.2 Entitas `Keluarga` (Profil Rumah Tangga & Lingkungan)
*Menggantikan: Sheet `data keluarga` (Lampiran 4.14.2a), Header `catatan keluarga` (Lampiran 4.15).*
- **Identitas**: `no_kk` (PK), `nama_kepala_rumah_tangga`, `alamat`, `wilayah_rt_id`, `dasawisma_id`, `latitude`, `longitude`.
- **Kondisi Rumah & Sanitasi Fisik**:
  - `kriteria_rumah`: Enum (`SEHAT`, `KURANG_SEHAT`, `TIDAK_SEHAT_LAYAK_HUNI`).
  - `jamban_keluarga`: Boolean (`true` = Ada / `false` = Tidak ada).
  - `jumlah_jamban`: Integer.
  - `sumber_air`: Enum (`PDAM`, `SUMUR`, `SUNGAI`, `LAINNYA`).
  - `tempat_sampah`: Boolean (`true` = Ada / `false` = Tidak ada).
  - `spal`: Boolean (Saluran Pembuangan Air Limbah & Penyerapan Air).
  - `stiker_p4k`: Boolean (Menempelkan stiker P4K).
  - `makanan_pokok`: Enum (`BERAS`, `NON_BERAS`), `jenis_non_beras` (string opsional).
- **Aktivitas Ekonomi & Usaha**:
  - `aktivitas_up2k`: Boolean, `jenis_usaha_up2k` (string).
  - `usaha_kesehatan_lingkungan`: Boolean.
- **Status Data**: Enum (`DRAFT`, `VERIFIED`, `ARCHIVED`).

### 4.3 Entitas `AnggotaKeluarga` (Data Warga Individu)
*Menggantikan: Sheet `data warga` (Lampiran 4.14.1a), `kegiatan warga` (Lampiran 4.14.1b), Baris `catatan keluarga` (Lampiran 4.15).*
- **Identitas Pribadi**:
  - `nik`: String (16 digit) (PK).
  - `is_nik_sementara`: Boolean (Default: `false`). Flag jika NIK resmi Dukcapil belum terbit (bayi baru lahir / warga menumpang); sistem otomatis men-generate ID virtual sementara (format: `TEMP-YYYYMMDD-XXXX`).
  - `no_registrasi`: String (kode wilayah + thn + no urut).
  - `nama`: String.
  - `keluarga_id`: Foreign Key ke `Keluarga`.
  - `hubungan_keluarga`: Enum (`KEPALA_KELUARGA`, `ISTRI`, `ANAK`, `ORANG_TUA`, `MENANTU`, `CUCU`, `FAMILI_LAIN`, `PEMBANTU`).
  - `jenis_kelamin`: Enum (`L`, `P`).
  - `tempat_lahir`: String.
  - `tanggal_lahir`: Date (Sistem menghitung dinamis: umur saat ini, status balita &le;5 th, lansia &ge;60 th, WUS 14–50 th).
  - `status_perkawinan`: Enum (`BELUM_KAWIN`, `KAWIN`, `JANDA`, `DUDA`).
  - `agama`: Enum (`ISLAM`, `KRISTEN`, `KATHOLIK`, `HINDU`, `BUDHA`, `KHONGHUCU`, `KEPERCAYAAN_LAIN`).
  - `pendidikan`: Enum (`TIDAK_TAMAT_SD`, `SD_MI`, `SMP_SEDERAJAT`, `SMA_SMK_SEDERAJAT`, `DIPLOMA`, `S1`, `S2`, `S3`).
  - `pekerjaan`: Enum (`PETANI`, `PEDAGANG`, `SWASTA`, `WIRAUSAHA`, `PNS`, `TNI_POLRI`, `TIDAK_BEKERJA`, `LAINNYA`).
  - `jabatan_pkk`: String (Jabatan struktural di TP PKK).
  - `disabilitas`: Boolean, `jenis_disabilitas` (string).
  - `tiga_buta`: Boolean (Buta baca, tulis, hitung untuk usia >13 tahun).
- **Keikutsertaan Program Sosial**:
  - `akseptor_kb`: Boolean, `jenis_kb` (`IUD`, `PIL`, `SUNTIK`, `IMPLAN`, `MOW`, `MOP`, `KONDOM`).
  - `posyandu_aktif`: Boolean, `frekuensi_posyandu` (kali/tahun).
  - `bina_keluarga_balita`: Boolean.
  - `memiliki_tabungan`: Boolean (Tabungan uang, hewan ternak, tanaman keras, tanah).
  - `kelompok_belajar`: Enum (`TIDAK`, `PAKET_A`, `PAKET_B`, `PAKET_C`, `KF`).
  - `paud_sejenis`: Boolean.
  - `kegiatan_koperasi`: Boolean, `jenis_koperasi` (string).
- **10 Program Pokok PKK (Partisipasi Aktivitas Y/T & Keterangan)**:
  - `keg_pancasila`, `keg_gotong_royong`, `keg_rukun_kematian`, `keg_keagamaan`, `keg_jimpitan`, `keg_arisan`, `keg_pendidikan_keterampilan`, `keg_koperasi`, `keg_pangan`, `keg_sandang`, `keg_kesehatan`, `keg_perencanaan_sehat`.

### 4.4 Entitas `HatinyaPkk` (Pemanfaatan Pekarangan)
*Menggantikan: Sheet `hatinya pkk` (Lampiran 4.14.2b).*
- `id`: PK, `keluarga_id`: FK.
- `kategori`: Enum (`PETERNAKAN`, `PERIKANAN`, `WARUNG_HIDUP`, `TOGA`, `TANAMAN_KERAS`, `LAINNYA`).
- `komoditi`: String (misal: "Ayam Kampung", "Lele Dumbo", "Jahe Merah", "Pohon Mangga").
- `jumlah_volume`: String (misal: "15 ekor", "2 kolam", "10 pot", "3 pohon").

### 4.5 Entitas `IndustriRumahTangga` (UP2K)
*Menggantikan: Sheet `industri rumah tangga` (Lampiran 4.14.2c).*
- `id`: PK, `keluarga_id`: FK.
- `kategori`: Enum (`PANGAN`, `SANDANG`, `KONVEKSI`, `JASA`, `LAIN_LAIN`).
- `komoditi`: String (misal: "Keripik Singkong", "Jahit Pakaian", "Catering Rumahan").
- `volume`: String (misal: "50 kg/bulan", "20 potong/minggu").

### 4.6 Entitas `PeristiwaVital` (Buku Catatan Bumil & Kematian)
*Menggantikan: Sheet `rekap bumil` (Lampiran 4.18a).*
- `id`: PK, `anggota_keluarga_id`: FK (Ibu atau warga terkait).
- `jenis_peristiwa`: Enum (`KEHAMILAN`, `PERSALINAN_MELAHIRKAN`, `NIFAS`, `KEMATIAN_IBU`, `KELAHIRAN_BAYI`, `KEMATIAN_BAYI`, `KEMATIAN_BALITA`, `MUTASI_KELUAR`).
- `tanggal_peristiwa`: Date.
- `detail_kelahiran`:
  - `nama_bayi`: String.
  - `jenis_kelamin_bayi`: Enum (`L`, `P`).
  - `memiliki_akte_kelahiran`: Boolean.
- `detail_kematian`:
  - `nama_almarhum`: String.
  - `status_almarhum`: Enum (`IBU_HAMIL_MELAHIRKAN_NIFAS`, `BAYI`, `BALITA`, `WARGA_UMUM`).
  - `sebab_kematian`: String.
  - `keterangan_tambahan`: String.

---

## 5. Spesifikasi Fungsional & Alur Pengguna (Feature Specifications)

### Fitur 1: Formulir Satu Pintu Bertahap (*Multi-Step Wizard Form*)
- **Deskripsi**: Formulir tunggal yang memandu pengisian data secara bertahap tanpa membingungkan warga atau kader.
- **Langkah Formulir**:
  1. *Langkah 1 (Wilayah & Rumah)*: Pilih Dasawisma/RT, No. KK, Alamat, Pinpoint peta koordinat GPS.
  2. *Langkah 2 (Sanitasi & Lingkungan)*: Kriteria rumah sehat, jamban, sumber air, sampah, SPAL, stiker P4K.
  3. *Langkah 3 (Anggota Keluarga)*: Penambahan anggota keluarga dinamis. Umur dihitung otomatis dari tanggal lahir. Centang status partisipasi sosial dan 10 program pokok PKK. Opsi flag *"NIK Sementara / Belum Terbit"* untuk bayi baru lahir / warga menumpang.
  4. *Langkah 4 (Pekarangan & Industri Rumah Tangga)*: Bersifat opsional, pengisian Hatinya PKK dan UP2K.
  5. *Langkah 5 (Review & Konfirmasi)*: Pratinjau rangkuman data sebelum disimpan.
- **Validasi Cerdas & Ketahanan Sinyal (Offline-Resilience)**:
  - *Local Draft Auto-Save*: Sistem menyimpan draft isian form secara otomatis ke *LocalStorage / IndexedDB* di perangkat. Jika ponsel kader kehabisan baterai atau sinyal seluler terputus saat *door-to-door*, data isian tidak hilang dan langsung dapat dilanjutkan saat online.
  - Peringatan jika No. KK kurang dari 16 digit.
  - Opsi *Generate Virtual NIK* (`TEMP-YYYYMMDD-XXXX`) jika NIK bayi belum terbit di Disdukcapil.
  - Peringatan jika Kepala Keluarga belum ditentukan.
  - Otomatis mengisi alamat anggota keluarga mengikuti alamat rumah.

### Fitur 2: Alur Akses Mandiri Warga & Antrean Verifikasi Kader
- **Akses Warga**:
  - Warga mengakses URL khusus wilayahnya: `https://simpatik-desa.id/rt/{kode_rt}`.
  - Warga memasukkan No. KK dan NIK Kepala Keluarga.
  - Jika data belum terdaftar, form baru terbuka. Jika sudah ada, sistem menampilkan data terkini untuk diperbarui.
  - Setelah dikirim (*submit*), data masuk antrean dengan status `DRAFT / MENUNGGU VERIFIKASI`.
- **Verifikasi Kader**:
  - Kader RT melihat notifikasi *"3 Pengajuan Data Warga Baru"*.
  - Kader dapat membandingkan data lama vs data baru (*diff view*), melakukan penyesuaian jika ada salah ketik, lalu menekan tombol **"Setujui (Approve)"** atau **"Tolak dengan Catatan"**.

### Fitur 3: Modul Cepat "Lapor Peristiwa" (*Event-Driven Tracker*)
- Tombol aksi cepat di dashboard kader/desa:
  - **Lapor Kelahiran**: Pilih nama ibu &rarr; input data bayi &rarr; sistem otomatis menambahkan bayi ke daftar anggota keluarga, mengubah status ibu menjadi nifas/menyusui, dan mencatatnya ke Buku Catatan Kelahiran.
  - **Lapor Kehamilan**: Pilih nama ibu di keluarga &rarr; status bumil aktif &rarr; tercatat di Lampiran 4.18a.
  - **Lapor Kematian**: Pilih anggota keluarga &rarr; masukkan tanggal & penyebab wafat &rarr; sistem mengarsipkan anggota keluarga dan memasukkan data ke Lampiran 4.18a (kematian ibu/bayi/balita).

### Fitur 4: Peta Sebaran Spasial Rumah Warga (*Interactive GIS Map*)
- Mengadopsi keunggulan rujukan portal buku induk/PPDB Pak Slamet.
- Menggunakan OpenStreetMap / Leaflet yang ringan dan cepat diakses.
- Menampilkan seluruh rumah warga dalam bentuk pin interaktif:
  - Warna Hijau: Rumah Sehat Layak Huni.
  - Warna Kuning: Rumah dengan Balita / Ibu Hamil (Perhatian Posyandu).
  - Warna Merah: Rumah Kurang Sehat / Memerlukan Intervensi Sanitasi.
- Klik pada pin menampilkan *Card Ringkas Profil Rumah*: Foto/Identitas KRT, Jumlah Anggota, Status Air & Jamban, serta tombol *Detail Lengkap*.

### Fitur 5: Mesin Agregasi Otomatis Berjenjang (*Realtime Aggregation Engine*)
- Mengeliminasi kebutuhan rumus Excel manual di sheet:
  - `rekap cat data &keg.warga` (Dasawisma - Lampiran 4.16a)
  - `rekap cat data &keg.warga rt` (RT - Lampiran 4.16b)
  - `rekap cat data &keg.warga rw` (RW - Lampiran 4.16c)
  - `rekap cat data &keg.warga dsn` (Dusun - Lampiran 4.16d)
  - `rekap cat data &keg.warga desa` (Desa - Lampiran 4.17a)
  - Serta seri rekap bumil berjenjang (Lampiran 4.18a s/d 4.19a).
- Dihitung secara komputasional (*database aggregation query*) setiap kali data di-approve, sehingga rekapitulasi selalu 100% sinkron dan bebas selisih.
- **Filter Periode Pelaporan (Semesteran / Tahunan)**: Agregasi mendukung parameter `periode_tahun` dan `semester` (Semester I / Semester II / Tahunan). Fitur ini memastikan arsip rekapitulasi tahun-tahun sebelumnya tetap tersimpan rapi sebagai data historis dan tidak tertimpa oleh mutasi data tahun berjalan.

### Fitur 6: Mesin Ekspor Ganda Resmi (*Dual Export Engine*)
1. **Ekspor Excel (.xlsx) dengan Template Injection**:
   - Alih-alih membuat workbook dari nol yang rawan merusak rumus dan tata letak dinas, sistem menggunakan berkas resmi asli `docs/kolom dasawisma.xlsx` sebagai **Master Template**.
   - Melalui pustaka `exceljs`, sistem melakukan *direct cell value injection* pada sel-sel data dan tabel rekapitulasi di seluruh 31 sheet, mempertahankan 100% format kop surat, ukuran font, border, dan formula resmi pemerintah.
2. **Cetak / Ekspor PDF Resmi**:
   - Menyediakan tombol cetak per lembar kerja fisik:
     - Form Daftar Warga (Lampiran 4.14.1a)
     - Form Data Keluarga (Lampiran 4.14.2a)
     - Matriks Catatan Keluarga (Lampiran 4.15)
     - Lembar Rekapitulasi Wilayah (Lampiran 4.16 & 4.17)
     - Lembar Rekapitulasi Bumil & Balita (Lampiran 4.18 & 4.19)
   - Layout siap cetak di kertas ukuran F4/A4 standar pemerintahan, lengkap dengan Kop Surat PKK, tanggal pelaporan, dan kolom tanda tangan resmi.

---

## 6. Spesifikasi Arsitektur Teknologi & Teknis

### 6.1 Tech Stack Terpilih
- **Framework Utama**: Next.js 15+ (App Router, Server Actions, React 19).
- **Styling & UI**: Tailwind CSS + Shadcn/UI Component Library + Lucide React Icons (Ringan, estetis, dan modern).
- **GIS & Peta**: Leaflet / React-Leaflet + OpenStreetMap tiles.
- **Database & ORM**: Prisma ORM dengan PostgreSQL (atau SQLite untuk kemudahan instalasi lokal/offline di server desa).
- **Export Processing**:
  - `exceljs`: Untuk *template injection* berkas asli 31 sheet Excel.
  - CSS Print Media / React-PDF: Untuk *pixel-perfect print preview* berkas dinas.

### 6.2 Desain Non-Fungsional (Kinerja, Keamanan, & Kemudahan Penggunaan)
1. **Mobile-First & Offline Resilience**: 90% kader Dasawisma mengakses sistem melalui *smartphone* Android. Form dilengkapi penyimpanan draft lokal otomatis (*LocalStorage / IndexedDB*) agar kader tetap aman saat sinyal drop di dusun pelosok.
2. **Perlindungan Privasi Data**: Nomor KTP/NIK dan data kesehatan warga disamarkan (*masked*, misal: `331901******0001`) pada tampilan publik dan hanya terlihat lengkap oleh kader resmi RT bersangkutan.
3. **Penyimpanan Jejak Audit (Audit Trail)**: Setiap perubahan data mencatat waktu pembaruan dan nama kader yang menyetujui.

---

## 7. Rencana Rilis & Roadmap Pengembangan (Phased Roadmap)

### Fase 1: MVP Core (Fokus Utama)
- Skema database relasional lengkap memetakan 31 sheet (dengan dukungan Virtual Temporary NIK).
- Formulir "Satu Pintu" Multi-Step Wizard dengan **Local Draft Auto-Save** (tahan putus sinyal).
- Autentikasi dan Dashboard Kader Dasawisma / RT (Input & Verifikasi).
- Tautan pengisian mandiri warga berbasis RT & No KK.
- Mesin kalkulasi otomatis rekapitulasi berjenjang dengan filter **Periode Pelaporan (Semester/Tahunan)**.
- Fitur Peta Spasial Rumah Warga (*Interactive GIS Map*).
- Modul "Lapor Peristiwa" (Kelahiran, Kematian, Bumil).
- Mesin Ekspor Excel 31 sheet berbasis **Template Injection** pada `docs/kolom dasawisma.xlsx` & Cetak PDF Catatan Keluarga.

### Fase 2: Peningkatan Lanjutan (Future Enhancements)
- Full Service Worker Background Sync PWA untuk operasi offline tanpa browser refresh.
- Notifikasi WhatsApp Gateway otomatis ke nomor kader jika ada warga yang mengisi form mandiri.
- Grafik analitik kecenderungan gizi balita & deteksi dini risiko stunting terintegrasi data Posyandu.

---

## 8. Kesimpulan & Langkah Berikutnya
Dokumen PRD ini telah mencakup seluruh kebutuhan lapangan yang dirangkum dari percakapan dan berkas acuan `docs/kolom dasawisma.xlsx`. Dokumen ini menjadi pedoman baku tunggal (*single source of truth*) dalam tahap perancangan teknis dan rencana implementasi (*implementation plan*) proyek Bhakti Grisa.
