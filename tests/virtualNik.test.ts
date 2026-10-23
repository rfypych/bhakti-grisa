import { describe, it, expect } from 'vitest';
import { generateVirtualNik, isVirtualNik } from '../src/lib/virtualNik';

describe('Virtual NIK Generator', () => {
  it('generates virtual NIK with TEMP-YYYYMMDD-XXXX format', () => {
    const dob = new Date('2026-05-12');
    const vNik = generateVirtualNik(dob);
    expect(vNik).toMatch(/^TEMP-20260512-[A-Z0-9]{4}$/);
    expect(isVirtualNik(vNik)).toBe(true);
  });

  it('identifies non-virtual standard 16 digit NIK', () => {
    expect(isVirtualNik('3319011234560001')).toBe(false);
  });
});
