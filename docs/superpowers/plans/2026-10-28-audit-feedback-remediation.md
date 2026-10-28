# SIMPATIK Audit Feedback Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Resolve all P0, P1, P2, and P3 findings from the comprehensive multi-device QA audit report (`SIMPATIK-Feedback-BoardUI-2026-10-28.md`) so that `feature/ui-redesign-boardui` achieves complete data integrity, security, regulatory compliance, and village usability before merging into `main`.

**Architecture:** Enforce server-side invariants in Prisma actions (duplicate KK guards, minimum member checks, event validation, export API RBAC scoping), replace hardcoded territorial constants with dynamic database queries, restore direct cadre submission mode, sanitize public pages of developer artifacts, polish mobile UX, and humanize document print formatting.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM (SQLite WAL), Vitest, Leaflet OpenStreetMap.

**Spec:** `c:\Users\rfkl\Downloads\SIMPATIK-Feedback-BoardUI-2026-10-28.md`

## Global Constraints

- Never compromise the SQLite database integrity or allow silent data loss / unauthorized overwrites.
- Territory data (Dusun, RW, RT, Dasawisma) must strictly derive from the database; no fake hardcoded lists.
- Virtual temporary NIKs must use format `TEMP-YYYYMMDD-XXXX` with `isNikSementara = true`.
- All public user-facing copy must use official, citizen-friendly Indonesian without tech vanity or English UI jargon.
- Minimum mobile touch targets must be >= 44-48px.
- All existing and new Vitest tests must pass (163+ tests).

## Review Focus

1. Duplicate KK submission in public form: must be rejected with a polite message if already verified, never overwrite an existing verified family.
2. Vital event creation on family with 0 members: must reject cleanly and return error to the UI, never show a false success banner.
3. Cadre exporting PDF of family outside their assigned RT/RW: export API must reject with HTTP 403 Forbidden.
4. Cadre authenticated session on `/formulir`: must auto-select "Mode Kader (Verifikasi Langsung)" and save directly as `VERIFIKASI`.
5. Mobile viewport 390px on formulir and receipt: no clipped step chips or overflowing status badges.

---

### Task 1: P0 Core Data Integrity & Security Guards

**Files:**
- Modify: `src/actions/formulirActions.ts`
- Modify: `src/actions/verifikasiActions.ts`
- Modify: `src/actions/peristiwaActions.ts`
- Modify: `src/app/api/export/pdf/route.ts`
- Modify: `src/app/api/export/excel/route.ts`
- Test: `tests/data-integrity-security.test.ts`

**Interfaces:**
- Consumes: Prisma client (`@/lib/prisma`), Auth helper (`getSessionUser`, `getScopeWilayahIds` in `@/lib/auth`).
- Produces: Guarded Server Actions returning `{ success: boolean, error?: string, keluargaId?: string }` with strict validation.

- [x] **Step 1: Write failing tests for duplicate KK guard, minimum member guard, vital event validation, and export API RBAC**

Create `tests/data-integrity-security.test.ts` testing:
1. `submitFormulirAction` rejects duplicate KK if existing record is `VERIFIKASI`.
2. `submitFormulirAction` rejects submissions with 0 members.
3. `approveSubmissionAction` rejects verifying a family with 0 members.
4. `laporKehamilanAction` and `laporMutasiAction` return `{ success: false, error: ... }` when the target family has 0 members or no matching member.
5. Export APIs enforce scope checking for `KADER_RT`.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/data-integrity-security.test.ts`
Expected: FAIL on duplicate KK, 0-member validation, and vital event guards.

- [x] **Step 3: Implement data integrity guards in Server Actions and export routes**

1. In `src/actions/formulirActions.ts`:
   - Check if `noKk` exists in `Keluarga`:
     - If existing family status is `VERIFIKASI`: return `{ success: false, error: 'Nomor KK sudah terdaftar dan terverifikasi di sistem Desa Grudo. Silakan hubungi Kader Dasawisma setempat.' }`.
     - Validate `input.anggota && input.anggota.length >= 1`. If empty, return `{ success: false, error: 'Formulir wajib memiliki minimal 1 anggota keluarga (Kepala Keluarga).' }`.
2. In `src/actions/verifikasiActions.ts`:
   - In `approveSubmissionAction`: verify that `keluarga.anggota.length >= 1`. If 0, return `{ success: false, error: 'Berkas tidak dapat disetujui karena tidak memiliki anggota keluarga.' }`.
3. In `src/actions/peristiwaActions.ts`:
   - In `laporKehamilanAction`, `laporKematianAction`, `laporMutasiAction`: verify target family exists and has valid members. If no member matches, return `{ success: false, error: 'Anggota keluarga yang bersangkutan tidak ditemukan.' }`.
4. In `src/app/api/export/pdf/route.ts` & `src/app/api/export/excel/route.ts`:
   - Get session user: if `user.peran === 'KADER_RT'`, enforce that requested `keluargaId` or `wilayahId` matches `user.wilayahId`. If not, return HTTP 403 Forbidden.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/data-integrity-security.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/actions/ src/app/api/export/ tests/data-integrity-security.test.ts
git commit -m "fix(security): enforce duplicate KK guard, minimum member check, event validation, and export rbac scoping"
```

---

### Task 2: P1 Dusun Dynamic Hierarchy & Temporary Virtual NIK

**Files:**
- Modify: `src/lib/domain.ts`
- Modify: `src/actions/peristiwaActions.ts`
- Modify: `src/components/dashboard/DashboardHome.tsx`
- Modify: `src/components/dashboard/DashboardWilayah.tsx`
- Modify: `src/components/dashboard/DashboardPeta.tsx`
- Modify: `src/app/formulir/page.tsx`
- Test: `tests/virtualNik.test.ts`
- Test: `tests/dusun-dynamic.test.ts`

**Interfaces:**
- Consumes: `Wilayah` records from database.
- Produces: `extractUniqueDusun(wilayahList: Wilayah[]): string[]` and `generateVirtualNik(sequence: number, birthDate?: string): string`.

- [x] **Step 1: Write failing tests for dynamic Dusun extraction and TEMP virtual NIK format**

Update `tests/virtualNik.test.ts` and create `tests/dusun-dynamic.test.ts`:
1. `generateVirtualNik` returns `TEMP-YYYYMMDD-XXXX` format (e.g. `TEMP-20261028-0001`).
2. Verify Dusun list in dashboard and wilayah is derived dynamically from `wilayahList` (yielding `Krajan` and `Tegalsari`), not hardcoded `['Grudo', 'Krajan', 'Mojorejo', 'Nglarangan']`.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/virtualNik.test.ts tests/dusun-dynamic.test.ts`
Expected: FAIL on virtual NIK format and dusun extraction.

- [x] **Step 3: Implement dynamic Dusun extraction and temporary virtual NIK**

1. In `src/lib/domain.ts`:
   - Update `generateVirtualNik` to return `TEMP-${dateStr}-${paddedSeq}`.
   - Add helper `export function extractUniqueDusun(wilayahList: Wilayah[]): string[]` that returns sorted unique Dusun names from the actual data.
2. In `src/actions/peristiwaActions.ts`:
   - Ensure baby created via `laporKelahiranAction` stores virtual NIK with `isVirtualNik = true` and in Prisma `isNikSementara = 1`.
3. In `src/components/dashboard/DashboardHome.tsx`:
   - Derive dusun breakdown cards dynamically using `extractUniqueDusun(scopedWilayah)`. If a dusun has families in DB (e.g., Tegalsari, Krajan), show its actual stats.
4. In `src/components/dashboard/DashboardWilayah.tsx`:
   - In "Tambah Wilayah" and "Tambah Akun", use dynamic dusun list from `wilayahList`, plus allow entering a custom Dusun if adding a new one.
5. In `src/components/dashboard/DashboardPeta.tsx` & `src/app/formulir/page.tsx`:
   - Replace hardcoded fake dusun labels with dynamic list from `wilayahList`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/virtualNik.test.ts tests/dusun-dynamic.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/domain.ts src/actions/peristiwaActions.ts src/components/dashboard/ src/app/formulir/page.tsx tests/
git commit -m "fix(domain): dynamic dusun hierarchy from database and standard TEMP virtual NIK format"
```

---

### Task 3: P1 Direct Cadre Verification Mode, Public Artifact Cleanup, & Verification Confirmation

**Files:**
- Modify: `src/app/formulir/page.tsx`
- Modify: `src/components/public/PublicBeranda.tsx`
- Modify: `src/app/tentang/page.tsx`
- Modify: `src/components/dashboard/DashboardVerifikasi.tsx`
- Test: `tests/public-pages.test.tsx`
- Test: `tests/dashboard-verifikasi-peristiwa-peta.test.tsx`

**Interfaces:**
- Consumes: Session user role (`KADER_RT` / `ADMIN_DESA`).
- Produces: Direct `VERIFIKASI` submission mode for cadres, clean citizen-facing `/` and `/tentang`, and confirmation modal for draft approval.

- [x] **Step 1: Write failing tests for cadre mode, cleanup of developer artifacts, and verification approval modal**

1. In `tests/public-pages.test.tsx`:
   - Verify `PublicBeranda` does NOT contain `npx npm run dev`, `Tailwind CSS v4`, or `React 19`.
   - Verify `/tentang` contains public village initiative information and does NOT contain file paths like `(public)/layout.tsx` or developer layout isolation docs.
2. In `tests/formulir.test.tsx`:
   - Verify cadre mode sets `statusData: 'VERIFIKASI'` directly.
3. In `tests/dashboard-verifikasi-peristiwa-peta.test.tsx`:
   - Verify approval button triggers a confirmation dialog before completing approval.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/public-pages.test.tsx tests/dashboard-verifikasi-peristiwa-peta.test.tsx`
Expected: FAIL on developer artifact assertions and confirmation modal.

- [x] **Step 3: Implement cadre mode, public cleanup, and approval confirmation modal**

1. In `src/app/formulir/page.tsx`:
   - Read session user or query param `?mode=kader`.
   - If user is authenticated as `KADER_RT` or `ADMIN_DESA`: render header banner "Mode Pengisian Resmi Petugas/Kader (Status: Langsung Terverifikasi)", auto-select cadre's assigned wilayah, and submit with `statusData: 'VERIFIKASI'`.
2. In `src/components/public/PublicBeranda.tsx`:
   - Remove the `npx npm run dev` command block and copy button completely.
   - Remove the "Tailwind CSS v4" and "React 19 & Design Tokens" vanity chips.
3. In `src/app/tentang/page.tsx`:
   - Replace internal developer architecture sections (file paths, layout isolation docs) with official, citizen-friendly information about TP PKK Desa Grudo, the Bhakti Grisa innovation initiative, and resident services.
4. In `src/components/dashboard/DashboardVerifikasi.tsx`:
   - Add state `approveTarget: KeluargaRecord | null`.
   - Clicking "Setujui & Masukkan ke Buku Dasawisma" opens a `BoardModal` confirmation with summary (Nama Kepala, No KK, Jumlah Jiwa, Dasawisma) and buttons "Batal" and "Ya, Setujui Berkas".

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/public-pages.test.tsx tests/dashboard-verifikasi-peristiwa-peta.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/app/formulir/page.tsx src/components/public/PublicBeranda.tsx src/app/tentang/page.tsx src/components/dashboard/DashboardVerifikasi.tsx tests/
git commit -m "feat: restore direct cadre verification mode, clean developer artifacts, and add approval confirmation"
```

---

### Task 4: P2 Usability, Mobile Responsiveness, & Form Refinements

**Files:**
- Modify: `src/components/layout/DashboardLayout.tsx`
- Modify: `src/components/dashboard/DashboardHome.tsx`
- Modify: `src/components/dashboard/DashboardPengguna.tsx`
- Modify: `src/components/dashboard/DashboardWilayah.tsx`
- Modify: `src/components/dashboard/DashboardPeristiwa.tsx`
- Modify: `src/components/dashboard/DashboardCetak.tsx`
- Modify: `src/app/formulir/page.tsx`
- Test: `tests/dashboard-home.test.tsx`
- Test: `tests/dashboard-wilayah-pengguna-cetak.test.tsx`

**Interfaces:**
- Consumes: Domain enums, UI event handlers.
- Produces: Unified search binding, Indonesianized table headers, non-truncated mobile steps, empty newborn measurement fields, and confirmation dialogs for delete/deactivate.

- [x] **Step 1: Write failing tests for search binding, Indonesian labels, and confirmation modals**

1. In `tests/dashboard-home.test.tsx`:
   - Verify table column headers use "Tingkat Kerawanan" and "Status" (not "Severity Pill" / "Status Chip").
   - Verify search input binds to table results.
2. In `tests/dashboard-wilayah-pengguna-cetak.test.tsx`:
   - Verify deactivating user and deleting empty wilayah open confirmation dialogs.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dashboard-home.test.tsx tests/dashboard-wilayah-pengguna-cetak.test.tsx`
Expected: FAIL on label checks.

- [x] **Step 3: Implement P2 usability fixes**

1. Search integration:
   - In `DashboardLayout.tsx`, connect header and quick search `globalSearch` to `DashboardHome` family filtering.
2. Indonesianize labels:
   - In `DashboardHome.tsx`: replace "Severity Pill" with "Tingkat Kerawanan", "Status Chip" with "Status", "Quick Search ⌘L" with "Cari KK / Nama (Ctrl+L)", "Single-Entry Engine" with "Pencatatan Mandiri & Terpadu".
3. Mobile formulir steps & receipt:
   - In `src/app/formulir/page.tsx`: display step text as "Langkah X dari 5: [Judul]" without truncated chips.
   - On receipt card: ensure status chip wraps gracefully on narrow screens.
4. Account password creation:
   - In `DashboardPengguna.tsx`: leave password field empty (`placeholder="Masukkan kata sandi baru..."`), required before submit.
5. Enum humanization in print:
   - In `DashboardCetak.tsx`: map enums (`SUMUR_GALI` -> "Sumur Gali", `SMA_SMK_SEDERAJAT` -> "SMA/SMK Sederajat", `BELUM_KAWIN` -> "Belum Kawin"). Align signature block with Dasawisma & RT.
6. Newborn dialog measurements:
   - In `DashboardPeristiwa.tsx`: clear default weight and head circumference; use placeholders (`Contoh: 3.2`, `Contoh: 34`). Save circumference as `LK: XX cm`.
7. Beranda dasawisma buttons:
   - In `PublicBeranda.tsx`: include dasawisma name in buttons: "Isi Formulir Dasawisma [Nama] (RT [rt]/RW [rw])".
8. Confirmation dialogs:
   - In `DashboardWilayah.tsx`: add confirmation before deleting empty wilayah.
   - In `DashboardPengguna.tsx`: add confirmation before deactivating officer account.
9. Dashboard Year Filter:
   - Wire `tahun` selector to update state/URL and filter `tahunPendataan`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/dashboard-home.test.tsx tests/dashboard-wilayah-pengguna-cetak.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/components/ src/app/formulir/page.tsx tests/
git commit -m "fix(ux): unify dashboard search, indonesianize jargon, polish mobile steps, and add action confirmations"
```

---

### Task 5: P3 Polish & Final Whole-Branch Verification

**Files:**
- Modify: `src/components/dashboard/DashboardPengguna.tsx`
- Modify: `src/components/layout/DashboardLayout.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/dashboard/DashboardPeta.tsx`
- Modify: `src/app/formulir/page.tsx`
- Test: Full test suite (23 test files)

**Interfaces:**
- Consumes: All updated components and server actions.
- Produces: 100% green test suite, production build with 0 errors, and seamless user experience.

- [x] **Step 1: Write tests for P3 polish items**

Update tests to verify:
1. `DashboardPengguna` formats `terakhirMasuk` to Indonesian date format.
2. Login placeholder uses generic text.
3. Sidebar for RW/Dusun roles cleanly displays officer profile without text clipping.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dashboard-wilayah-pengguna-cetak.test.tsx`
Expected: FAIL on date formatting assertion.

- [x] **Step 3: Implement P3 polish items**

1. In `DashboardPengguna.tsx`: format `terakhirMasuk` using `Intl.DateTimeFormat('id-ID')`.
2. In `src/app/login/page.tsx`: change placeholder from `kader_rt01` to `admin atau nama_petugas`.
3. In `DashboardLayout.tsx`: for non-admin roles, ensure sidebar user card handles long role/names gracefully with tooltip or text wrapping.
4. In `src/app/formulir/page.tsx`: add notice if existing draft is restored from localStorage with a "Mulai Isian Baru" button to clear.
5. In `DashboardPeta.tsx`: add a "Tampilkan Semua Titik" button that fits all household bounds in Leaflet.

- [x] **Step 4: Run complete test suite and production build**

Run: `npx vitest run`
Expected: 23 passed (23), 163+ passed (163+)
Run: `npm run build`
Expected: Compiled successfully with 0 errors.

- [x] **Step 5: Commit**

```bash
git add src/ tests/
git commit -m "chore(polish): format timestamps, clean login placeholders, refine draft restore alert, and verify full build"
```
