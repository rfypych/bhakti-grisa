import { describe, it, expect } from 'vitest';
import { extractUniqueDusun, generateVirtualNik, isVirtualNik } from '../src/lib/domain';

describe('Task 2: Dynamic Dusun Extraction & Virtual NIK', () => {
  describe('extractUniqueDusun', () => {
    it('extracts unique, sorted dusun names from actual wilayah list', () => {
      const mockWilayah = [
        { id: 'w1', dusun: 'Tegalsari', rw: '01', rt: '01', namaDasawisma: 'Kenanga 1' },
        { id: 'w2', dusun: 'Krajan', rw: '01', rt: '01', namaDasawisma: 'Melati 1' },
        { id: 'w3', dusun: 'Tegalsari', rw: '01', rt: '02', namaDasawisma: 'Kenanga 2' },
        { id: 'w4', dusun: 'Krajan', rw: '02', rt: '01', namaDasawisma: 'Mawar 2' },
      ] as any[];

      const dusuns = extractUniqueDusun(mockWilayah);
      expect(dusuns).toEqual(['Krajan', 'Tegalsari']);
      expect(dusuns).not.toContain('Mojorejo');
      expect(dusuns).not.toContain('Nglarangan');
    });

    it('handles empty or whitespace-laden dusun entries gracefully', () => {
      const mockWilayah = [
        { id: 'w1', dusun: ' Krajan ', rw: '01', rt: '01', namaDasawisma: 'M1' },
        { id: 'w2', dusun: '', rw: '01', rt: '02', namaDasawisma: 'M2' },
        { id: 'w3', dusun: 'Tegalsari', rw: '01', rt: '03', namaDasawisma: 'T1' },
      ] as any[];

      const dusuns = extractUniqueDusun(mockWilayah);
      expect(dusuns).toEqual(['Krajan', 'Tegalsari']);
    });
  });

  describe('generateVirtualNik in domain.ts', () => {
    it('generates TEMP-YYYYMMDD-XXXX format with isVirtualNik = true', () => {
      const vNik = generateVirtualNik('2026-10-28', 'P', 1);
      expect(vNik).toMatch(/^TEMP-20261028-[A-Z0-9]{4}$/);
      expect(isVirtualNik(vNik)).toBe(true);
    });

    it('never produces fake 16-digit Dukcapil-looking NIK', () => {
      const vNik = generateVirtualNik('2026-10-28', 'L', 1);
      expect(vNik.startsWith('352109')).toBe(false);
      expect(vNik.length).not.toBe(16);
    });
  });
});
