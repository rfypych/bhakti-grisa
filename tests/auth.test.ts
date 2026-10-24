import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  getScopeWilayahIds,
} from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { PeranPengguna } from '@prisma/client';

describe('Auth & Role-Based Scope Engine', () => {
  describe('Password Hashing & Verification', () => {
    it('hashes passwords securely and verifies correctly', async () => {
      const raw = 'RahasiaKader123!';
      const hash = await hashPassword(raw);

      expect(hash).not.toBe(raw);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await verifyPassword(raw, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('SalahPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('HMAC-SHA256 Signed Session Tokens', () => {
    it('creates and verifies valid session tokens', () => {
      const payload = {
        userId: 'user-123',
        peran: 'KADER_RT' as PeranPengguna,
        wilayahId: 'wil-456',
      };

      const token = createSessionToken(payload);
      expect(token).toBeTruthy();
      expect(token.split('.').length).toBe(2); // data.signature

      const decoded = verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.peran).toBe('KADER_RT');
      expect(decoded?.wilayahId).toBe('wil-456');
    });

    it('rejects tampered or forged session tokens', () => {
      const payload = {
        userId: 'user-123',
        peran: 'KADER_RT' as PeranPengguna,
        wilayahId: 'wil-456',
      };

      const token = createSessionToken(payload);
      const [data, sig] = token.split('.');

      // Tamper data payload
      const tamperedData = Buffer.from(
        JSON.stringify({ ...payload, peran: 'ADMIN_DESA' })
      ).toString('base64url');
      const forgedToken = `${tamperedData}.${sig}`;

      expect(verifySessionToken(forgedToken)).toBeNull();

      // Tamper signature
      const corruptedSigToken = `${data}.invalidsignaturexyz`;
      expect(verifySessionToken(corruptedSigToken)).toBeNull();
    });
  });

  describe('Scope Wilayah IDs Calculation', () => {
    let wil1: any;
    let wil2: any;
    let wil3: any;

    beforeEach(async () => {
      await prisma.pengguna.deleteMany();
      await prisma.peristiwaVital.deleteMany();
      await prisma.hatinyaPkk.deleteMany();
      await prisma.industriRumahTangga.deleteMany();
      await prisma.anggotaKeluarga.deleteMany();
      await prisma.keluarga.deleteMany();
      await prisma.wilayah.deleteMany();

      wil1 = await prisma.wilayah.create({
        data: { dusun: 'Dusun Timur', rw: '01', rt: '01', namaDasawisma: 'Mawar 1' },
      });
      wil2 = await prisma.wilayah.create({
        data: { dusun: 'Dusun Timur', rw: '01', rt: '02', namaDasawisma: 'Mawar 2' },
      });
      wil3 = await prisma.wilayah.create({
        data: { dusun: 'Dusun Barat', rw: '02', rt: '01', namaDasawisma: 'Melati 1' },
      });
    });

    it('returns null for ADMIN_DESA (unrestricted village-wide access)', async () => {
      const adminUser: any = {
        id: 'admin-1',
        peran: 'ADMIN_DESA',
        wilayahId: null,
      };

      const scope = await getScopeWilayahIds(adminUser);
      expect(scope).toBeNull();
    });

    it('returns single wilayahId for KADER_RT', async () => {
      const kaderUser: any = {
        id: 'kader-1',
        peran: 'KADER_RT',
        wilayahId: wil1.id,
        wilayah: wil1,
      };

      const scope = await getScopeWilayahIds(kaderUser);
      expect(scope).toEqual([wil1.id]);
    });

    it('returns all wilayah IDs within the same Dusun & RW for PENGURUS_RW', async () => {
      const rwUser: any = {
        id: 'rw-1',
        peran: 'PENGURUS_RW',
        wilayahId: wil1.id,
        wilayah: wil1,
      };

      const scope = await getScopeWilayahIds(rwUser);
      expect(scope).not.toBeNull();
      expect(scope).toHaveLength(2);
      expect(scope).toContain(wil1.id);
      expect(scope).toContain(wil2.id);
      expect(scope).not.toContain(wil3.id);
    });

    it('returns all wilayah IDs within the same Dusun for PENGURUS_DUSUN', async () => {
      // Add another RW in Dusun Timur
      const wil4 = await prisma.wilayah.create({
        data: { dusun: 'Dusun Timur', rw: '02', rt: '01', namaDasawisma: 'Anggrek 1' },
      });

      const dusunUser: any = {
        id: 'dusun-1',
        peran: 'PENGURUS_DUSUN',
        wilayahId: wil1.id,
        wilayah: wil1,
      };

      const scope = await getScopeWilayahIds(dusunUser);
      expect(scope).not.toBeNull();
      expect(scope).toHaveLength(3);
      expect(scope).toContain(wil1.id);
      expect(scope).toContain(wil2.id);
      expect(scope).toContain(wil4.id);
      expect(scope).not.toContain(wil3.id);
    });
  });
});
