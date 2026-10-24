import { prisma } from './prisma';
import { classifyDemographics } from './demographics';

export interface AggregationFilter {
  tahun?: number;
  year?: number;
  semester?: 'SEMESTER_1' | 'SEMESTER_2' | 'TAHUNAN' | string;
  period?: 'SEMESTER_1' | 'SEMESTER_2' | 'TAHUNAN' | string;
}

export interface AggregationResult {
  totalKeluarga: number;
  totalAnggota: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalBalitaL: number;
  totalBalitaP: number;
  totalBalita: number;
  totalPus: number;
  totalWus: number;
  totalIbuHamil: number;
  totalIbuMenyusui: number;
  totalLansia: number;
  totalTigaButa: number;
  totalTigaButaL: number;
  totalTigaButaP: number;
  totalDisabilitas: number;
  totalRumahSehat: number;
  totalRumahKurangSehat: number;
  totalRumahTidakSehat: number;
  totalJamban: number;
  totalTempatSampah: number;
  totalSpal: number;
  totalStikerP4k: number;
  sumberAir: {
    pdam: number;
    sumur: number;
    sungai: number;
    lainnya: number;
  };
  makananPokok: {
    beras: number;
    nonBeras: number;
  };
  totalUp2k: number;
  totalHatinyaPkk: number;
  totalKematianIbu: number;
  totalKematianBayi: number;
  totalKematianBalita: number;
}

export interface DasawismaAggregationResult extends AggregationResult {
  dasawismaId: string;
  namaDasawisma?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
}

export interface RTAggregationResult extends AggregationResult {
  rt: string;
  rw?: string;
  dusun?: string;
}

export interface RWAggregationResult extends AggregationResult {
  rw: string;
  dusun?: string;
}

export interface DusunAggregationResult extends AggregationResult {
  dusun: string;
}

export interface DesaAggregationResult extends AggregationResult {}

function getReferenceDate(filter: AggregationFilter): Date {
  const y = filter.tahun || filter.year || new Date().getFullYear();
  const s = filter.semester || filter.period;
  if (s === 'SEMESTER_1') {
    return new Date(`${y}-06-30T23:59:59.999Z`);
  }
  return new Date(`${y}-12-31T23:59:59.999Z`);
}

async function aggregateFamilies(
  whereClause: any,
  filter: AggregationFilter
): Promise<AggregationResult> {
  const refDate = getReferenceDate(filter);

  const families = await prisma.keluarga.findMany({
    where: {
      ...whereClause,
      // Official recaps count VERIFIKASI families only: resident self-submissions
      // stay DRAFT and enter village recaps only after cadre verification.
      statusData: 'VERIFIKASI',
      createdAt: { lte: refDate },
    },
    include: {
      anggota: {
        include: {
          peristiwaVital: {
            where: {
              tanggalPeristiwa: { lte: refDate },
            },
          },
        },
      },
      hatinyaPkk: true,
      industriRumahTangga: true,
    },
  });

  const res: AggregationResult = {
    totalKeluarga: families.length,
    totalAnggota: 0,
    totalLakiLaki: 0,
    totalPerempuan: 0,
    totalBalitaL: 0,
    totalBalitaP: 0,
    totalBalita: 0,
    totalPus: 0,
    totalWus: 0,
    totalIbuHamil: 0,
    totalIbuMenyusui: 0,
    totalLansia: 0,
    totalTigaButa: 0,
    totalTigaButaL: 0,
    totalTigaButaP: 0,
    totalDisabilitas: 0,
    totalRumahSehat: 0,
    totalRumahKurangSehat: 0,
    totalRumahTidakSehat: 0,
    totalJamban: 0,
    totalTempatSampah: 0,
    totalSpal: 0,
    totalStikerP4k: 0,
    sumberAir: {
      pdam: 0,
      sumur: 0,
      sungai: 0,
      lainnya: 0,
    },
    makananPokok: {
      beras: 0,
      nonBeras: 0,
    },
    totalUp2k: 0,
    totalHatinyaPkk: 0,
    totalKematianIbu: 0,
    totalKematianBayi: 0,
    totalKematianBalita: 0,
  };

  for (const fam of families) {
    if (fam.kriteriaRumah === 'SEHAT') res.totalRumahSehat++;
    else if (fam.kriteriaRumah === 'KURANG_SEHAT') res.totalRumahKurangSehat++;
    else if (fam.kriteriaRumah === 'TIDAK_SEHAT_LAYAK_HUNI') res.totalRumahTidakSehat++;

    if (fam.jambanKeluarga) res.totalJamban += fam.jumlahJamban || 1;
    if (fam.tempatSampah) res.totalTempatSampah++;
    if (fam.spal) res.totalSpal++;
    if (fam.stikerP4k) res.totalStikerP4k++;

    if (fam.sumberAir === 'PDAM') res.sumberAir.pdam++;
    else if (fam.sumberAir === 'SUMUR') res.sumberAir.sumur++;
    else if (fam.sumberAir === 'SUNGAI') res.sumberAir.sungai++;
    else res.sumberAir.lainnya++;

    if (fam.makananPokok === 'BERAS') res.makananPokok.beras++;
    else res.makananPokok.nonBeras++;

    if (fam.aktivitasUp2k || fam.industriRumahTangga.length > 0) res.totalUp2k++;
    if (fam.hatinyaPkk.length > 0) res.totalHatinyaPkk++;

    for (const member of fam.anggota) {
      // Population counters cover living residents only: a member recorded
      // as deceased (statusKehidupan MENINGGAL) no longer counts as jiwa.
      // Their vital events further below still count, because maternal and
      // infant mortality are measured from the events of deceased members.
      if (member.statusKehidupan === 'HIDUP') {
        res.totalAnggota++;
        if (member.jenisKelamin === 'L') res.totalLakiLaki++;
        else res.totalPerempuan++;

        const flags = classifyDemographics(
          {
            tanggalLahir: member.tanggalLahir,
            jenisKelamin: member.jenisKelamin,
            statusPerkawinan: member.statusPerkawinan,
            tigaButa: member.tigaButa,
          },
          refDate
        );

        if (flags.isBalita) {
          res.totalBalita++;
          if (member.jenisKelamin === 'L') res.totalBalitaL++;
          else res.totalBalitaP++;
        }

        if (flags.isLansia) res.totalLansia++;
        if (flags.isWus) res.totalWus++;
        if (flags.isPus && member.jenisKelamin === 'P') res.totalPus++;
        if (flags.isTigaButa) {
          res.totalTigaButa++;
          if (member.jenisKelamin === 'L') res.totalTigaButaL++;
          else res.totalTigaButaP++;
        }
        if (member.disabilitas) res.totalDisabilitas++;
      }

      for (const pv of member.peristiwaVital) {
        if (pv.jenisPeristiwa === 'KEHAMILAN') res.totalIbuHamil++;
        if (pv.jenisPeristiwa === 'NIFAS') res.totalIbuMenyusui++;
        if (pv.jenisPeristiwa === 'KEMATIAN_IBU') res.totalKematianIbu++;
        if (pv.jenisPeristiwa === 'KEMATIAN_BAYI') res.totalKematianBayi++;
        if (pv.jenisPeristiwa === 'KEMATIAN_BALITA') res.totalKematianBalita++;
      }
    }
  }

  return res;
}

/**
 * Aggregates statistics for a specific Dasawisma (Wilayah ID).
 */
export async function getAggregationDasawisma(
  dasawismaId: string,
  filter: AggregationFilter
): Promise<DasawismaAggregationResult> {
  const wilayah = await prisma.wilayah.findUnique({
    where: { id: dasawismaId },
  });

  const base = await aggregateFamilies({ wilayahId: dasawismaId }, filter);

  return {
    ...base,
    dasawismaId,
    namaDasawisma: wilayah?.namaDasawisma,
    rt: wilayah?.rt,
    rw: wilayah?.rw,
    dusun: wilayah?.dusun,
  };
}

/**
 * Aggregates statistics for an RT (Rukun Tetangga).
 */
export async function getAggregationRT(
  rtId: string,
  filter: AggregationFilter,
  extra?: { rw?: string; dusun?: string }
): Promise<RTAggregationResult> {
  const wilayahCondition: any = { rt: rtId };
  if (extra?.rw) wilayahCondition.rw = extra.rw;
  if (extra?.dusun) wilayahCondition.dusun = extra.dusun;

  const base = await aggregateFamilies({ wilayah: wilayahCondition }, filter);

  return {
    ...base,
    rt: rtId,
    rw: extra?.rw,
    dusun: extra?.dusun,
  };
}

/**
 * Aggregates statistics for an RW (Rukun Warga).
 */
export async function getAggregationRW(
  rwId: string,
  filter: AggregationFilter,
  extra?: { dusun?: string }
): Promise<RWAggregationResult> {
  const wilayahCondition: any = { rw: rwId };
  if (extra?.dusun) wilayahCondition.dusun = extra.dusun;

  const base = await aggregateFamilies({ wilayah: wilayahCondition }, filter);

  return {
    ...base,
    rw: rwId,
    dusun: extra?.dusun,
  };
}

/**
 * Aggregates statistics for a Dusun (Hamlet/Lingkungan).
 */
export async function getAggregationDusun(
  dusunName: string,
  filter: AggregationFilter
): Promise<DusunAggregationResult> {
  const base = await aggregateFamilies({ wilayah: { dusun: dusunName } }, filter);

  return {
    ...base,
    dusun: dusunName,
  };
}

/**
 * Aggregates statistics for the whole Desa (Village).
 */
export async function getAggregationDesa(
  filter: AggregationFilter
): Promise<DesaAggregationResult> {
  return aggregateFamilies({}, filter);
}

export interface ActivePregnantMother {
  ibu: any;
  keluarga: any;
  wilayah: any;
  namaIbu: string;
  namaSuami: string;
  tanggalKehamilan: Date;
}

/**
 * Retrieves living female members from VERIFIKASI families who currently have
 * an active pregnancy (a KEHAMILAN event not followed by childbirth, nifas, or death).
 */
export async function getActivePregnantMothers(filterCondition?: {
  wilayahId?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
}): Promise<ActivePregnantMother[]> {
  const families = await prisma.keluarga.findMany({
    where: {
      statusData: 'VERIFIKASI',
      ...(filterCondition?.wilayahId ? { wilayahId: filterCondition.wilayahId } : {}),
      ...(filterCondition?.rt || filterCondition?.rw || filterCondition?.dusun
        ? {
            wilayah: {
              ...(filterCondition.rt ? { rt: filterCondition.rt } : {}),
              ...(filterCondition.rw ? { rw: filterCondition.rw } : {}),
              ...(filterCondition.dusun ? { dusun: filterCondition.dusun } : {}),
            },
          }
        : {}),
    },
    include: {
      wilayah: true,
      anggota: {
        where: {
          statusKehidupan: 'HIDUP',
        },
        include: {
          peristiwaVital: {
            orderBy: { tanggalPeristiwa: 'asc' },
          },
        },
      },
    },
  });

  const pregnantMothers: ActivePregnantMother[] = [];

  for (const fam of families) {
    const husband = fam.anggota.find(
      (m) => (m.hubunganKeluarga === 'KEPALA_KELUARGA' || (m as any).hubunganKeluarga === 'SUAMI') && m.jenisKelamin === 'L'
    );
    const husbandName = husband?.nama || fam.namaKepalaRumahTangga;

    for (const member of fam.anggota) {
      if (member.jenisKelamin !== 'P') continue;

      const events = member.peristiwaVital;
      let lastPregnancyDate: Date | null = null;
      let concluded = false;

      for (const ev of events) {
        if (ev.jenisPeristiwa === 'KEHAMILAN') {
          lastPregnancyDate = ev.tanggalPeristiwa;
          concluded = false;
        } else if (
          lastPregnancyDate &&
          (ev.jenisPeristiwa === 'PERSALINAN_MELAHIRKAN' ||
            ev.jenisPeristiwa === 'NIFAS' ||
            ev.jenisPeristiwa === 'KELAHIRAN_BAYI' ||
            ev.jenisPeristiwa === 'KEMATIAN_IBU')
        ) {
          concluded = true;
        }
      }

      if (lastPregnancyDate && !concluded) {
        pregnantMothers.push({
          ibu: member,
          keluarga: fam,
          wilayah: fam.wilayah,
          namaIbu: member.nama,
          namaSuami: husbandName,
          tanggalKehamilan: lastPregnancyDate,
        });
      }
    }
  }

  return pregnantMothers;
}
