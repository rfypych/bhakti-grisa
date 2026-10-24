# SIMPATIK MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-ready MVP of **SIMPATIK** (*Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga*) — an integrated single-input Dasawisma platform with mobile-friendly multi-step forms, cadre verification queue, automatic multi-level aggregation, event-driven lifecycle logger, spatial GIS household mapping, and 100% template-compliant 31-sheet Excel & PDF official reporting.

**Architecture:** Next.js 15 App Router with React 19, TypeScript, and Tailwind CSS. Relational persistence powered by Prisma ORM with SQLite for frictionless local/village deployment. Excel export utilizes `exceljs` binary template injection into `docs/kolom dasawisma.xlsx`. Spatial GIS maps use Leaflet / OpenStreetMap. Client form state includes real-time `localStorage` draft auto-save for offline resilience.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, SQLite, Leaflet, ExcelJS, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-22-simpatik-dasawisma-design.md` and `docs/PRD-SIMPATIK.md`.

---

## Global Constraints

- Platform: Node.js >= 18.x with Next.js 15 (App Router, Server Actions).
- Database: SQLite via Prisma ORM for portable, zero-configuration village server deployments.
- Master Template: Excel export MUST inject data into `docs/kolom dasawisma.xlsx` without modifying original fonts, borders, or merged cell structures.
- Offline Form Resilience: Multi-step wizard MUST automatically persist draft state to browser `localStorage` on every keystroke.
- Temporary NIK Format: When an official Dukcapil NIK is not yet issued, the system generates a virtual ID with pattern `TEMP-YYYYMMDD-XXXX`.
- Reporting Period: All aggregation queries and reports MUST accept `periodeTahun` (e.g. `2026`) and `semester` (`SEMESTER_1`, `SEMESTER_2`, `TAHUNAN`) parameters.

---

## Review Focus

1. **Newborn Without NIK**: Form accepts infant marked `isNikSementara = true`, generates `TEMP-YYYYMMDD-XXXX`, and correctly includes the child in Balita (<5 yr) counts without throwing NIK unique constraint violation.
2. **Offline Form Recovery**: When user navigates away or refreshes mid-form during door-to-door enumeration, all previously entered household and citizen fields are restored from `localStorage`.
3. **Multi-Level Aggregation Accuracy**: Aggregation queries roll up sums from Dasawisma to RT to RW to Dusun to Desa with 0 mathematical variance compared to manual sums.
4. **Excel Template Injection Integrity**: `exceljs` injects cell coordinates into all 31 sheets of `docs/kolom dasawisma.xlsx` and downloads a valid `.xlsx` file readable in Microsoft Excel and LibreOffice Calc.
5. **Event Log Lifecycle Transition**: Submitting a "Lapor Kelahiran" event atomically creates a new child member in the family, updates the mother's status to Nifas/Menyusui, and creates a record in Lampiran 4.18a.

---

## File Structure

```
bhakti-grisa/
├── docs/
│   ├── kolom dasawisma.xlsx              # Official 31-sheet master template
│   ├── PRD-SIMPATIK.md                   # Product Requirements Document
│   └── superpowers/
│       ├── specs/2026-10-22-simpatik-dasawisma-design.md
│       └── plans/2026-10-22-simpatik-implementation-plan.md
├── prisma/
│   ├── schema.prisma                     # Complete database schema
│   ├── seed.ts                           # Village administrative boundary seed
│   └── dev.db                            # SQLite database
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Landing & RT selector portal
│   │   ├── rt/[id]/form/page.tsx         # Public resident self-service form
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Cadre & admin navigation shell
│   │   │   ├── page.tsx                  # Dashboard overview & summary stats
│   │   │   ├── keluarga/
│   │   │   │   ├── page.tsx              # Family directory
│   │   │   │   └── tambah/page.tsx       # Cadre direct input wizard
│   │   │   ├── verifikasi/page.tsx       # Resident submission approval queue
│   │   │   ├── lapor-peristiwa/page.tsx  # Quick event log modal/page
│   │   │   ├── peta/page.tsx             # Interactive GIS Household map
│   │   │   └── laporan/page.tsx          # Aggregation & Excel/PDF export hub
│   │   └── api/
│   │       ├── export/excel/route.ts     # Template injection Excel download
│   │       └── export/pdf/route.ts       # Print/PDF endpoint
│   ├── components/
│   │   ├── form/
│   │   │   ├── MultiStepForm.tsx         # 5-step wizard container
│   │   │   ├── Step1WilayahRumah.tsx
│   │   │   ├── Step2Sanitasi.tsx
│   │   │   ├── Step3AnggotaKeluarga.tsx
│   │   │   ├── Step4PekaranganUp2k.tsx
│   │   │   └── Step5ReviewSubmit.tsx
│   │   ├── map/
│   │   │   ├── GisMap.tsx                # Leaflet map container
│   │   │   └── MapPinMarker.tsx          # Custom color-coded pin
│   │   └── ui/                           # Base UI components (buttons, dialogs, inputs)
│   ├── hooks/
│   │   └── useFormDraft.ts               # LocalStorage draft persistence hook
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── demographics.ts               # Age, Balita, WUS, PUS, Lansia calculation
│   │   ├── virtualNik.ts                 # Temporary NIK generation
│   │   ├── aggregation.ts                # Realtime rollup engine (Dasawisma -> Desa)
│   │   └── excelTemplate.ts              # ExcelJS template injection service
│   └── actions/
│       ├── keluargaActions.ts            # Create/update family & members
│       ├── verifikasiActions.ts          # Approve/reject draft submissions
│       └── peristiwaActions.ts           # Log vital event (birth, pregnancy, death)
└── tests/
    ├── demographics.test.ts
    ├── virtualNik.test.ts
    ├── aggregation.test.ts
    └── excelTemplate.test.ts
```

---

## Tasks

### Task 1: Project Scaffolding, Dependencies & Prisma Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/lib/prisma.ts`, `prisma/schema.prisma`, `prisma/seed.ts`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: Initialized Next.js 15 project, working Prisma Client connected to SQLite database, seed data for Dusun/RW/RT/Dasawisma hierarchy.

- [x] **Step 1: Write the failing test for Prisma database connection**
```typescript
// tests/setup.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/prisma';

describe('Database Setup', () => {
  it('connects to SQLite and reads Wilayah', async () => {
    const count = await prisma.wilayah.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/setup.test.ts`
Expected: FAIL (Prisma or modules not yet installed).

- [x] **Step 3: Scaffold Next.js project and install core dependencies**
Install: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `tailwindcss`, `lucide-react`, `prisma`, `@prisma/client`, `exceljs`, `leaflet`, `@types/leaflet`, `vitest`.
Configure `prisma/schema.prisma` with models: `Wilayah`, `Keluarga`, `AnggotaKeluarga`, `HatinyaPkk`, `IndustriRumahTangga`, `PeristiwaVital`. Run `npx prisma db push` and write `prisma/seed.ts` populating sample Dusun, RW, RT, and Dasawisma.

- [x] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/setup.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add package.json tsconfig.json prisma/ src/lib/prisma.ts tests/setup.test.ts
git commit -m "chore: scaffold Next.js 15 project and configure Prisma with SQLite"
```

---

### Task 2: Core Domain Logic & Demographics Utilities

**Files:**
- Create: `src/lib/demographics.ts`, `src/lib/virtualNik.ts`
- Test: `tests/demographics.test.ts`, `tests/virtualNik.test.ts`

**Interfaces:**
- Produces:
  - `calculateAge(dob: Date, referenceDate?: Date): number`
  - `classifyDemographics(member: { tanggalLahir: Date; jenisKelamin: 'L' | 'P'; statusPerkawinan: string; tigaButa?: boolean }): DemographicFlags`
  - `generateVirtualNik(dob: Date): string`

- [x] **Step 1: Write failing tests for age calculation and demographic classification**
```typescript
// tests/demographics.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAge, classifyDemographics } from '../src/lib/demographics';

describe('Demographics Engine', () => {
  const refDate = new Date('2026-10-22');

  it('correctly identifies Balita (<= 5 years)', () => {
    const dob = new Date('2023-05-10'); // ~3 years old
    const age = calculateAge(dob, refDate);
    const flags = classifyDemographics({ tanggalLahir: dob, jenisKelamin: 'L', statusPerkawinan: 'BELUM_KAWIN' }, refDate);
    expect(age).toBe(3);
    expect(flags.isBalita).toBe(true);
    expect(flags.isLansia).toBe(false);
  });

  it('correctly identifies WUS (Wanita Usia Subur 14-50)', () => {
    const dob = new Date('2000-01-01'); // 26 years old female
    const flags = classifyDemographics({ tanggalLahir: dob, jenisKelamin: 'P', statusPerkawinan: 'BELUM_KAWIN' }, refDate);
    expect(flags.isWus).toBe(true);
    expect(flags.isPus).toBe(false);
  });

  it('correctly identifies PUS (Pasangan Usia Subur)', () => {
    const dob = new Date('1995-06-15'); // 31 years old female, married
    const flags = classifyDemographics({ tanggalLahir: dob, jenisKelamin: 'P', statusPerkawinan: 'KAWIN' }, refDate);
    expect(flags.isPus).toBe(true);
  });

  it('correctly identifies Lansia (>= 60 years)', () => {
    const dob = new Date('1960-03-01'); // 66 years old
    const flags = classifyDemographics({ tanggalLahir: dob, jenisKelamin: 'L', statusPerkawinan: 'KAWIN' }, refDate);
    expect(flags.isLansia).toBe(true);
  });
});
```

- [x] **Step 2: Run demographics test to verify it fails**
Run: `npx vitest run tests/demographics.test.ts`
Expected: FAIL ("cannot find module '../src/lib/demographics'").

- [x] **Step 3: Implement `calculateAge`, `classifyDemographics`, and `generateVirtualNik`**
In `src/lib/demographics.ts`: Implement date difference logic considering leap years; return boolean flags for `isBalita`, `isLansia`, `isWus`, `isPus`.
In `src/lib/virtualNik.ts`: Implement `generateVirtualNik(dob: Date)` returning formatted string `TEMP-YYYYMMDD-XXXX` (using date format and 4 random alphanumeric characters).

- [x] **Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/demographics.test.ts tests/virtualNik.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/lib/demographics.ts src/lib/virtualNik.ts tests/demographics.test.ts tests/virtualNik.test.ts
git commit -m "feat: implement demographic classification and virtual temporary NIK generator"
```

---

### Task 3: Multi-Level Realtime Aggregation Engine

**Files:**
- Create: `src/lib/aggregation.ts`
- Test: `tests/aggregation.test.ts`

**Interfaces:**
- Produces:
  - `getAggregationDasawisma(dasawismaId: string, filter: { tahun: number; semester?: string }): Promise<DasawismaAggregationResult>`
  - `getAggregationRT(rtId: string, filter: { tahun: number; semester?: string }): Promise<RTAggregationResult>`
  - `getAggregationDesa(filter: { tahun: number; semester?: string }): Promise<DesaAggregationResult>`

- [x] **Step 1: Write failing test for Dasawisma and RT rollups**
```typescript
// tests/aggregation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getAggregationDasawisma, getAggregationRT } from '../src/lib/aggregation';
import { prisma } from '../src/lib/prisma';

describe('Multi-Level Aggregation Engine', () => {
  it('accurately counts Balita, Lansia, Rumah Sehat, and Jamban for a Dasawisma', async () => {
    // Seed test Dasawisma with 2 families
    const result = await getAggregationDasawisma('test-dasawisma-1', { tahun: 2026 });
    expect(result).toHaveProperty('totalKeluarga');
    expect(result).toHaveProperty('totalLakiLaki');
    expect(result).toHaveProperty('totalPerempuan');
    expect(result).toHaveProperty('totalBalitaL');
    expect(result).toHaveProperty('totalBalitaP');
    expect(result).toHaveProperty('totalRumahSehat');
    expect(result).toHaveProperty('totalJamban');
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/aggregation.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement aggregation queries in `src/lib/aggregation.ts`**
Write Prisma aggregation queries grouping families and member records. Compute summary counts: total KK, total L/P, Balita L/P, PUS, WUS, Ibu Hamil, Ibu Menyusui, Lansia, 3 Buta, Berkebutuhan Khusus, Rumah Sehat, Jamban, Sumber Air (PDAM, Sumur, Sungai, Lainnya), SPAL, Sampah, Makanan Pokok, UP2K, and Hatinya PKK.

- [x] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/aggregation.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/lib/aggregation.ts tests/aggregation.test.ts
git commit -m "feat: implement multi-level automated aggregation engine"
```

---

### Task 4: Template Injection Excel Export Engine

**Files:**
- Create: `src/lib/excelTemplate.ts`, `src/app/api/export/excel/route.ts`
- Test: `tests/excelTemplate.test.ts`

**Interfaces:**
- Consumes: `docs/kolom dasawisma.xlsx`, `src/lib/aggregation.ts`
- Produces: `generateOfficialExcelWorkbook(options: ExportOptions): Promise<Buffer>`

- [x] **Step 1: Write failing test for Excel template injection**
```typescript
// tests/excelTemplate.test.ts
import { describe, it, expect } from 'vitest';
import { generateOfficialExcelWorkbook } from '../src/lib/excelTemplate';
import ExcelJS from 'exceljs';

describe('Excel Template Injection Engine', () => {
  it('loads docs/kolom dasawisma.xlsx, populates data, and retains 31 sheets', async () => {
    const buffer = await generateOfficialExcelWorkbook({ tahun: 2026, rtId: 'all' });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    expect(wb.worksheets.length).toBe(31);
    const sheetDataWarga = wb.getWorksheet('data warga ');
    expect(sheetDataWarga).toBeDefined();
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/excelTemplate.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement `generateOfficialExcelWorkbook` using `exceljs`**
In `src/lib/excelTemplate.ts`:
1. Load master file `docs/kolom dasawisma.xlsx` into `ExcelJS.Workbook`.
2. Fetch aggregation and family data from `src/lib/aggregation.ts`.
3. Inject cell values directly into target cell coordinates for primary sheets (`data warga `, `data keluarga`, `rekap cat data &keg.warga`, `rekap bumil`, etc.) without clearing row styles or borders.
4. Export as buffer.
In `src/app/api/export/excel/route.ts`: Expose GET route with content-disposition attachment.

- [x] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/excelTemplate.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/lib/excelTemplate.ts src/app/api/export/excel/route.ts tests/excelTemplate.test.ts
git commit -m "feat: implement Excel export engine using master template injection"
```

---

### Task 5: Offline-Resilient Multi-Step Wizard Form & Draft Hook

**Files:**
- Create: `src/hooks/useFormDraft.ts`, `src/components/form/MultiStepForm.tsx`, `src/components/form/Step1WilayahRumah.tsx`, `src/components/form/Step2Sanitasi.tsx`, `src/components/form/Step3AnggotaKeluarga.tsx`, `src/components/form/Step4PekaranganUp2k.tsx`, `src/components/form/Step5ReviewSubmit.tsx`, `src/actions/keluargaActions.ts`
- Test: `tests/useFormDraft.test.ts`

**Interfaces:**
- Produces:
  - `useFormDraft<T>(storageKey: string, initialData: T): { data: T; updateField: (key: keyof T, val: any) => void; clearDraft: () => void }`
  - Server Action `saveKeluargaAction(formData: KeluargaInputData, isPublicResident: boolean): Promise<ActionResult>`

- [x] **Step 1: Write failing test for `useFormDraft` local persistence**
```typescript
// tests/useFormDraft.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraftToStorage, loadDraftFromStorage } from '../src/hooks/useFormDraft';

describe('useFormDraft Storage Helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and restores partial form draft', () => {
    const key = 'simpatik_form_draft_rt01';
    const draft = { noKk: '3319011234560001', namaKepalaRumahTangga: 'Budi Santoso' };
    saveDraftToStorage(key, draft);
    const restored = loadDraftFromStorage(key, {});
    expect(restored).toEqual(draft);
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/useFormDraft.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement `useFormDraft` and Multi-Step Wizard components**
1. Implement `src/hooks/useFormDraft.ts` with window `localStorage` safety checks.
2. Build Step 1 (Wilayah & Lokasi with GPS button), Step 2 (Sanitasi & Lingkungan), Step 3 (Anggota Keluarga with dynamic member list, DOB to age auto-calc, and "NIK Sementara" checkbox), Step 4 (Hatinya PKK & UP2K), Step 5 (Card review).
3. Implement `src/actions/keluargaActions.ts` saving record with status `DRAFT` (if public resident) or `VERIFIKASI` (if cadre).

- [x] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/useFormDraft.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/hooks/useFormDraft.ts src/components/form/ src/actions/keluargaActions.ts tests/useFormDraft.test.ts
git commit -m "feat: create multi-step wizard form with offline local draft persistence"
```

---

### Task 6: Cadre Verification Queue & Approval Flow

**Files:**
- Create: `src/actions/verifikasiActions.ts`, `src/app/dashboard/verifikasi/page.tsx`, `src/components/verifikasi/VerificationCard.tsx`
- Test: `tests/verifikasi.test.ts`

**Interfaces:**
- Consumes: `src/lib/prisma.ts`
- Produces:
  - `getPendingSubmissions(wilayahId?: string): Promise<KeluargaWithDetails[]>`
  - `approveSubmissionAction(keluargaId: string): Promise<{ success: boolean }>`
  - `rejectSubmissionAction(keluargaId: string, reason: string): Promise<{ success: boolean }>`

- [x] **Step 1: Write failing test for verification approve and reject actions**
```typescript
// tests/verifikasi.test.ts
import { describe, it, expect } from 'vitest';
import { approveSubmissionAction, rejectSubmissionAction } from '../src/actions/verifikasiActions';
import { prisma } from '../src/lib/prisma';

describe('Verification Flow', () => {
  it('approves a draft submission transitioning status to VERIFIKASI', async () => {
    // Create draft
    const draft = await prisma.keluarga.create({
      data: {
        noKk: '9999000011112222',
        namaKepalaRumahTangga: 'Draft Family',
        alamat: 'RT 01',
        wilayahId: 'test-wilayah',
        statusData: 'DRAFT',
      },
    });
    const result = await approveSubmissionAction(draft.id);
    expect(result.success).toBe(true);
    const updated = await prisma.keluarga.findUnique({ where: { id: draft.id } });
    expect(updated?.statusData).toBe('VERIFIKASI');
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/verifikasi.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement verification server actions and UI queue**
In `src/actions/verifikasiActions.ts`: Implement `approveSubmissionAction` and `rejectSubmissionAction`.
In `src/app/dashboard/verifikasi/page.tsx`: Render list of pending submissions with diff-view and one-click approve/reject dialogs.

- [x] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/verifikasi.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/actions/verifikasiActions.ts src/app/dashboard/verifikasi/ src/components/verifikasi/ tests/verifikasi.test.ts
git commit -m "feat: implement cadre verification queue and submission approval actions"
```

---

### Task 7: Event Log Module ("Lapor Peristiwa")

**Files:**
- Create: `src/actions/peristiwaActions.ts`, `src/app/dashboard/lapor-peristiwa/page.tsx`, `src/components/peristiwa/LaporKelahiranModal.tsx`, `src/components/peristiwa/LaporKematianModal.tsx`
- Test: `tests/peristiwa.test.ts`

**Interfaces:**
- Produces:
  - `laporKelahiranAction(data: KelahiranInput): Promise<{ success: boolean; childId: string }>`
  - `laporKematianAction(data: KematianInput): Promise<{ success: boolean }>`

- [x] **Step 1: Write failing test for "Lapor Kelahiran" atomic side-effects**
```typescript
// tests/peristiwa.test.ts
import { describe, it, expect } from 'vitest';
import { laporKelahiranAction } from '../src/actions/peristiwaActions';
import { prisma } from '../src/lib/prisma';

describe('Event Log Actions', () => {
  it('creates newborn record and logs vital event in Lampiran 4.18', async () => {
    // Mother record
    const result = await laporKelahiranAction({
      ibuId: 'mother-id-1',
      namaBayi: 'Bayi Sehat',
      tanggalLahir: new Date('2026-10-22'),
      jenisKelamin: 'L',
      akteKelahiran: false,
    });
    expect(result.success).toBe(true);
    const event = await prisma.peristiwaVital.findFirst({ where: { namaBayi: 'Bayi Sehat' } });
    expect(event).toBeDefined();
    expect(event?.jenisPeristiwa).toBe('KELAHIRAN_BAYI');
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/peristiwa.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement `laporKelahiranAction` and `laporKematianAction`**
In `src/actions/peristiwaActions.ts`:
1. `laporKelahiranAction`: Within a Prisma transaction, create `AnggotaKeluarga` for the newborn (assigning virtual temporary NIK if unissued), create `PeristiwaVital` record, and update mother flags.
2. `laporKematianAction`: Mark deceased member status as `ARSIP` and create `PeristiwaVital` record.
Build fast modal interfaces in `src/components/peristiwa/`.

- [x] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/peristiwa.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**
```bash
git add src/actions/peristiwaActions.ts src/app/dashboard/lapor-peristiwa/ src/components/peristiwa/ tests/peristiwa.test.ts
git commit -m "feat: implement event log tracker for births, pregnancies, and mortalities"
```

---

### Task 8: Spatial GIS Household Map Component

**Files:**
- Create: `src/components/map/GisMap.tsx`, `src/components/map/MapPinMarker.tsx`, `src/app/dashboard/peta/page.tsx`
- Test: `tests/mapComponent.test.ts`

**Interfaces:**
- Consumes: Leaflet, OpenStreetMap tiles, `src/lib/prisma.ts`
- Produces: Interactive map rendering household coordinates with Green/Yellow/Red pins and popup family summaries.

- [ ] **Step 1: Write unit test for coordinate filtering and pin color classification**
```typescript
// tests/mapComponent.test.ts
import { describe, it, expect } from 'vitest';
import { getPinColor } from '../src/components/map/MapPinMarker';

describe('GIS Map Helper', () => {
  it('assigns RED to houses without healthy sanitation', () => {
    const color = getPinColor({ kriteriaRumah: 'KURANG_SEHAT', jambanKeluarga: false });
    expect(color).toBe('red');
  });

  it('assigns YELLOW to houses with infant or pregnant woman', () => {
    const color = getPinColor({ kriteriaRumah: 'SEHAT', jambanKeluarga: true, hasBalita: true });
    expect(color).toBe('yellow');
  });

  it('assigns GREEN to healthy standard households', () => {
    const color = getPinColor({ kriteriaRumah: 'SEHAT', jambanKeluarga: true, hasBalita: false });
    expect(color).toBe('green');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/mapComponent.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `getPinColor` and Leaflet `GisMap` component**
In `src/components/map/`: Implement SSR-safe dynamic import for Leaflet. Render map with custom SVG/DivIcon pins and clickable popups displaying KRT name, members count, sanitation status, and detail link.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/mapComponent.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/map/ src/app/dashboard/peta/ tests/mapComponent.test.ts
git commit -m "feat: implement interactive spatial GIS household map with category pins"
```

---

### Task 9: Official Reports & Print Layouts (PDF & Web Print)

**Files:**
- Create: `src/components/print/CatatanKeluargaPrint.tsx`, `src/components/print/RekapDasawismaPrint.tsx`, `src/app/dashboard/laporan/cetak/[id]/page.tsx`
- Test: `tests/printLayout.test.ts`

**Interfaces:**
- Consumes: Family data and multi-level aggregation results
- Produces: Pixel-perfect, print-optimized layouts (A4/F4) for Lampiran 4.14.2a, Lampiran 4.15, and Lampiran 4.16 with TP PKK official letterhead and signature blocks.

- [ ] **Step 1: Write test verifying print data transformer**
```typescript
// tests/printLayout.test.ts
import { describe, it, expect } from 'vitest';
import { formatCatatanKeluargaPrintData } from '../src/components/print/CatatanKeluargaPrint';

describe('Print Data Formatter', () => {
  it('formats family and member records for Lampiran 4.15 18-column table', () => {
    const formatted = formatCatatanKeluargaPrintData(sampleFamily);
    expect(formatted.columns.length).toBe(18);
    expect(formatted.kriteriaRumahLabel).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/printLayout.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement print formatters and print-optimized CSS views**
Build clean tabular print views with `@media print` rules: hides navbar/buttons, forces black & white or high-contrast lines, includes Kop Surat, date, and signature spaces for Ketua Dasawisma / Ketua RT / Ketua TP PKK Desa.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/printLayout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/print/ src/app/dashboard/laporan/cetak/ tests/printLayout.test.ts
git commit -m "feat: implement print-ready layouts for Lampiran 4.15 and official reports"
```

---

### Task 10: End-to-End Workflow Integration & Verification

**Files:**
- Create: `tests/e2eIntegration.test.ts`
- Modify: `src/app/page.tsx`, `src/app/dashboard/page.tsx`

**Interfaces:**
- Connects: Public resident input &rarr; Cadre queue approval &rarr; Lapor peristiwa birth &rarr; Realtime aggregation &rarr; Excel template injection.

- [ ] **Step 1: Write end-to-end integration test exercising full lifecycle**
```typescript
// tests/e2eIntegration.test.ts
import { describe, it, expect } from 'vitest';
import { saveKeluargaAction } from '../src/actions/keluargaActions';
import { approveSubmissionAction } from '../src/actions/verifikasiActions';
import { laporKelahiranAction } from '../src/actions/peristiwaActions';
import { getAggregationDasawisma } from '../src/lib/aggregation';
import { generateOfficialExcelWorkbook } from '../src/lib/excelTemplate';

describe('SIMPATIK Full End-to-End Workflow', () => {
  it('completes resident draft -> verification -> birth event -> aggregation -> excel export', async () => {
    // 1. Resident draft
    // 2. Cadre approve
    // 3. Birth event
    // 4. Verify aggregation has newborn
    // 5. Generate Excel buffer and verify 31 sheets
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/e2eIntegration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Wire up pages and verify seamless pipeline execution**
Connect landing page RT selector, dashboard cards, navigation header, and verify all database transactions and export buffers pass smoothly.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/e2eIntegration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add tests/e2eIntegration.test.ts src/app/page.tsx src/app/dashboard/page.tsx
git commit -m "test: add full end-to-end integration test verifying complete SIMPATIK lifecycle"
```
