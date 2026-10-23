export interface DemographicInput {
  tanggalLahir: Date | string;
  jenisKelamin: 'L' | 'P';
  statusPerkawinan?: string;
  tigaButa?: boolean;
}

export interface DemographicFlags {
  age: number;
  isBalita: boolean;
  isLansia: boolean;
  isWus: boolean;
  isPus: boolean;
  isTigaButa: boolean;
}

/**
 * Calculates exact age in completed years from date of birth.
 */
export function calculateAge(dob: Date | string, referenceDate: Date = new Date()): number {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  const ref = referenceDate;

  let age = ref.getFullYear() - birthDate.getFullYear();
  const monthDiff = ref.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Classifies a citizen into PKK demographic groups:
 * - Balita: age <= 5 years
 * - Lansia: age >= 60 years
 * - WUS (Wanita Usia Subur): female aged 14 to 50 years
 * - PUS (Pasangan Usia Subur): married individual where wife is in reproductive age (14-50)
 */
export function classifyDemographics(
  member: DemographicInput,
  referenceDate: Date = new Date()
): DemographicFlags {
  const birthDate = typeof member.tanggalLahir === 'string' ? new Date(member.tanggalLahir) : member.tanggalLahir;
  const age = calculateAge(birthDate, referenceDate);

  const isBalita = age <= 5;
  const isLansia = age >= 60;
  const isWus = member.jenisKelamin === 'P' && age >= 14 && age <= 50;
  const isPus = member.statusPerkawinan === 'KAWIN' && (
    member.jenisKelamin === 'P' ? (age >= 14 && age <= 50) : true
  );
  const isTigaButa = Boolean(member.tigaButa && age > 13);

  return {
    age,
    isBalita,
    isLansia,
    isWus,
    isPus,
    isTigaButa,
  };
}
