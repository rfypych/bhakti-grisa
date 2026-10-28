# Audit Babak 3 Feedback Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all remaining findings from Babak 3 QA audit (`SIMPATIK-Feedback-BoardUI-LENGKAP-Babak-1-3.md`), specifically preventing member transfer via NIK upsert (B3-1), removing pre-filled dummy NIK/KK/member data from the citizen form, activating the `isNikSementara` flag for TEMP NIKs, purging developer tech-stack vanity sections from `/tentang`, connecting dashboard header search and year filter, recording full baby measurements (BB, LK, PB), auto-suggesting death categories based on age, and cleaning form defaults.

**Architecture:** 
1. **Form State & Database Invariants:** Blank out default KK, NIK, birthdate, and member fields in `createDefaultFormState` and `addMember`. Enforce family boundary validation in `saveKeluargaAction`: reject submissions where a real NIK belongs to another family, and auto-generate fresh unique virtual NIKs for temporary records.
2. **Virtual NIK Invariant:** Detect `TEMP-` prefix or `isNikSementara` flag on both client and server (`keluargaActions.ts` and `peristiwaActions.ts`) and ensure `isNikSementara: 1` (`true`) is persisted in SQLite.
3. **Dashboard Real-Time Search & Year Sync:** Wire `DashboardLayout` header/sidebar search events to `DashboardHome` via `simpatik:search` custom event and `?q=`, and bind URL `?tahun=` and select dropdown to filter aggregates and table data.
4. **Vital Events & UX Polish:** Add `lingkarKepalaCm` and `panjangBadanCm` to `KelahiranInput` server action and format `keterangan` with full metrics (`BB`, `LK`, `PB`). Auto-detect age category (`BAYI`, `BALITA`, `WARGA_UMUM`) on modal open. Remove developer vanity content from `/tentang` and replace with village citizen data principles.

**Tech Stack:** Next.js 16.4.3 (App Router, Server Actions), React 19, Prisma ORM, SQLite WAL, Vitest, BoardUI tokens.

**Spec:** `c:\Users\rfkl\Downloads\SIMPATIK-Feedback-BoardUI-LENGKAP-Babak-1-3.md`

## Global Constraints
- Do not break existing verification tests (all 181 tests must pass).
- Strict data integrity: no duplicate KK on verified families, no 0-member families, no silent stealing of members across families.
- Preserve BoardUI emerald `#10b981` styling and indonesianized terminology.

---

### Task 1: Fix B3-1 Member Hijacking & Purge Dummy Defaults from Formulir

**Files:**
- Modify: `src/app/formulir/page.tsx`
- Modify: `src/actions/keluargaActions.ts`
- Test: `tests/data-integrity-security.test.ts`
- Test: `tests/formulir.test.tsx`

**Steps:**
- [ ] In `src/app/formulir/page.tsx`:
  - In `createDefaultFormState`, set `noKK: ''` (remove `'3521092710260009'`).
  - In initial member (`ang-init-1`), set `nik: ''`, `tempatLahir: ''`, `tanggalLahir: ''`, `umur: 0`, `pekerjaan: ''`.
  - In `addMember`, blank out `nik: ''`, `tempatLahir: ''`, `tanggalLahir: ''`, `umur: 0`, `pekerjaan: ''` (remove sequence `'352109550492000...'` and mock birth dates).
  - Ensure NIK text input allows alphanumeric and hyphens (up to 20 chars for `TEMP-YYYYMMDD-XXXX`).
- [ ] In `src/actions/keluargaActions.ts`:
  - When iterating `formData.anggota`:
    - Determine `const isTemp = Boolean(m.isNikSementara) || !finalNik || finalNik.startsWith('TEMP-');`
    - If `isTemp && (!finalNik || !finalNik.startsWith('TEMP-'))`, call `generateVirtualNik(birthDate)`.
    - Check if member with `nik: finalNik` already exists:
      - If `existingMember && existingMember.keluargaId !== keluargaRecord.id`:
        - If not temp, throw `Error('NIK ' + finalNik + ' sudah terdaftar pada keluarga lain.')`.
        - If temp, re-generate a unique `finalNik = generateVirtualNik(birthDate)`.
    - Set `isNikSementara: isTemp` in both `update` and `create`.
- [ ] Update `tests/formulir.test.tsx` and `tests/data-integrity-security.test.ts` to assert that initial form state has empty `noKK` and `nik`, and that submitting an existing NIK from another family throws an error.
- [ ] Run vitest to verify Task 1.

---

### Task 2: Fix Virtual NIK Flag in Birth Events & Complete Newborn Measurements

**Files:**
- Modify: `src/actions/peristiwaActions.ts`
- Modify: `src/components/dashboard/DashboardPeristiwa.tsx`
- Test: `tests/peristiwa.test.ts`
- Test: `tests/data-integrity-security.test.ts`

**Steps:**
- [ ] In `src/actions/peristiwaActions.ts`:
  - Add `lingkarKepalaCm?: number;` to `KelahiranInput`.
  - Update `const isTemporary = !data.nik || data.nik.trim() === '' || data.nik.startsWith('TEMP-');`.
  - In `peristiwaVital.create`, construct `keterangan` with `BB: ${data.beratBadanKg} kg`, `LK: ${data.lingkarKepalaCm} cm`, and `PB: ${data.panjangBadanCm} cm`.
  - In `child` member creation, ensure `isNikSementara: isTemporary`.
- [ ] In `src/components/dashboard/DashboardPeristiwa.tsx`:
  - In `handleSubmitBirth`, pass `lingkarKepalaCm: numLk` and `panjangBadanCm: numPb` to `laporKelahiranAction`.
  - In `handleOpenMortalityModal` and family change, automatically set `kategoriKematian` based on `firstLiving.umur` (`< 1` $\rightarrow$ `BAYI`, `<= 5` $\rightarrow$ `BALITA`, `isIbuHamil` $\rightarrow$ `IBU_HAMIL_MELAHIRKAN`, else `WARGA_UMUM`).
- [ ] Update `tests/peristiwa.test.ts` to test `isNikSementara: true` on birth with `TEMP-` NIK and full `BB`, `LK`, `PB` in `keterangan`.
- [ ] Run vitest to verify Task 2.

---

### Task 3: Purge Developer Tech-Stack Vanity from `/tentang`

**Files:**
- Modify: `src/app/tentang/page.tsx`
- Test: `tests/public-pages.test.tsx`

**Steps:**
- [ ] In `src/app/tentang/page.tsx`:
  - Replace Section 6 ("Modern Tech Stack Inisiatif Bhakti Grisa" featuring Next.js 16, React 19, glassmorphic headers, Turbopack, Server Actions zero-API latency) with **"Prinsip Layanan & Tata Kelola Data Warga Desa Grudo"**:
    - **Keamanan Data Keluarga:** Data warga disimpan dalam sistem terproteksi dan hanya dapat diakses oleh kader serta pengurus sesuai wilayah tugas.
    - **Validasi Terpadu Berjenjang:** Setiap pengisian mandiri warga diverifikasi secara langsung oleh Kader Dasawisma sebelum disahkan ke buku resmi desa.
    - **Kepatuhan Standar PKK Nasional:** Format pencatatan dan rekapitulasi mengacu pada pedoman baku 31 Lembar Buku Dasawisma dan dokumen Lampiran 4.15.
    - **Kesiapan Layanan Lapangan:** Sistem dirancang ringan, responsif, dan mudah digunakan di perangkat ponsel kader saat bertugas di lingkungan RT.
- [ ] Update `tests/public-pages.test.tsx` to assert the absence of developer tech bragging and presence of village data governance principles.
- [ ] Run vitest to verify Task 3.

---

### Task 4: Connect Dashboard Search & Year Filter

**Files:**
- Modify: `src/components/layout/DashboardLayout.tsx`
- Modify: `src/components/dashboard/DashboardHome.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Test: `tests/dashboard-home.test.tsx`

**Steps:**
- [ ] In `src/components/layout/DashboardLayout.tsx`:
  - When `globalSearch` changes, dispatch `window.dispatchEvent(new CustomEvent('simpatik:search', { detail: val }))`.
- [ ] In `src/components/dashboard/DashboardHome.tsx`:
  - Add `useEffect` listener for `simpatik:search` event, updating `localSearch`.
  - Accept `initialTahun?: number` prop (defaulting to 2026).
  - When `selectedTahun` changes, update `selectedTahun` state and sync router search parameter if desired.
- [ ] In `src/app/dashboard/page.tsx`:
  - Derive `tahunPendataan` from `k.createdAt ? new Date(k.createdAt).getFullYear() : 2026`.
  - Pass `initialTahun={resolvedParams.tahun ? Number(resolvedParams.tahun) : 2026}` to `DashboardHome`.
- [ ] Update `tests/dashboard-home.test.tsx` to assert that changing year filters families and search event updates filtering.
- [ ] Run vitest to verify Task 4.

---

### Task 5: Polish Form Defaults (DashboardWilayah & DashboardPengguna) & Full Verification

**Files:**
- Modify: `src/components/dashboard/DashboardWilayah.tsx`
- Modify: `src/components/dashboard/DashboardPengguna.tsx`
- Test: `tests/dashboard-wilayah-pengguna-cetak.test.tsx`

**Steps:**
- [ ] In `src/components/dashboard/DashboardWilayah.tsx`:
  - Initialize `dusun: ''`, `rw: ''`, `rt: ''`, `namaDasawisma: ''` (remove pre-filled `'Grudo'`, `'01'`, `'03'`).
  - Provide clear placeholders (`Contoh: Krajan atau Tegalsari`, `01`, `01`, `Contoh: Mawar 1`).
- [ ] In `src/components/dashboard/DashboardPengguna.tsx`:
  - Change label `Peran Hak Akses (RBAC Role)` to `Peran & Hak Akses Petugas`.
- [ ] Run full test suite (`npx vitest run`).
- [ ] Run production build (`npm run build`).
- [ ] Commit and push to `feature/ui-redesign-boardui`.
