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
