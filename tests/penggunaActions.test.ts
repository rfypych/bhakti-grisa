import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPenggunaAction,
  toggleStatusPenggunaAction,
  resetPasswordAction,
} from '../src/actions/penggunaActions';
import { verifyPassword } from '../src/lib/auth';
import * as authModule from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';

describe('Pengguna Management Actions', () => {
  beforeEach(async () => {
    await prisma.pengguna.deleteMany();
    await prisma.peristiwaVital.deleteMany();
    await prisma.hatinyaPkk.deleteMany();
    await prisma.industriRumahTangga.deleteMany();
    await prisma.anggotaKeluarga.deleteMany();
    await prisma.keluarga.deleteMany();
    await prisma.wilayah.deleteMany();
    vi.restoreAllMocks();
  });

  it('allows ADMIN_DESA to create a new user account', async () => {
    // Mock session as ADMIN_DESA
    vi.spyOn(authModule, 'getSessionUser').mockResolvedValue({
      id: 'admin-id-1',
      nama: 'Pak Kades',
      username: 'admin_desa',
      kataSandiHash: 'hash',
      peran: 'ADMIN_DESA',
      wilayahId: null,
      aktif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      wilayah: null,
    });

    const res = await createPenggunaAction({
      nama: 'Ibu Kader Melati',
      username: 'kader_melati1',
      kataSandi: 'KaderPass123!',
      peran: 'KADER_RT',
    });

    expect(res.success).toBe(true);
    expect(res.pengguna).toBeDefined();
    expect(res.pengguna?.username).toBe('kader_melati1');

    const inDb = await prisma.pengguna.findUnique({ where: { username: 'kader_melati1' } });
    expect(inDb).not.toBeNull();
    expect(inDb?.nama).toBe('Ibu Kader Melati');
  });

  it('rejects duplicate username when creating an account', async () => {
    vi.spyOn(authModule, 'getSessionUser').mockResolvedValue({
      id: 'admin-id-1',
      nama: 'Pak Kades',
      username: 'admin_desa',
      kataSandiHash: 'hash',
      peran: 'ADMIN_DESA',
      wilayahId: null,
      aktif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      wilayah: null,
    });

    // First user
    await createPenggunaAction({
      nama: 'User Pertama',
      username: 'duplikat_user',
      kataSandi: 'Password123!',
      peran: 'KADER_RT',
    });

    // Second user with same username
    const res2 = await createPenggunaAction({
      nama: 'User Kedua',
      username: 'duplikat_user',
      kataSandi: 'Password456!',
      peran: 'PENGURUS_RW',
    });

    expect(res2.success).toBe(false);
    expect(res2.error).toContain('sudah digunakan');
  });

  it('rejects account creation by non-admin users', async () => {
    // Mock session as KADER_RT
    vi.spyOn(authModule, 'getSessionUser').mockResolvedValue({
      id: 'kader-id-1',
      nama: 'Ibu Kader',
      username: 'kader_rt',
      kataSandiHash: 'hash',
      peran: 'KADER_RT',
      wilayahId: 'some-wil',
      aktif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      wilayah: null,
    });

    const res = await createPenggunaAction({
      nama: 'Akun Ilegal',
      username: 'user_ilegal',
      kataSandi: 'Password123!',
      peran: 'KADER_RT',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Akses ditolak');
  });

  it('toggles account status and resets password', async () => {
    vi.spyOn(authModule, 'getSessionUser').mockResolvedValue({
      id: 'admin-id-1',
      nama: 'Pak Kades',
      username: 'admin_desa',
      kataSandiHash: 'hash',
      peran: 'ADMIN_DESA',
      wilayahId: null,
      aktif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      wilayah: null,
    });

    const createRes = await createPenggunaAction({
      nama: 'Budi Santoso',
      username: 'budi_rw01',
      kataSandi: 'PasswordLama123',
      peran: 'PENGURUS_RW',
    });

    const userId = createRes.pengguna!.id;

    // Toggle active -> false
    const toggle1 = await toggleStatusPenggunaAction(userId);
    expect(toggle1.success).toBe(true);
    expect(toggle1.aktif).toBe(false);

    let check = await prisma.pengguna.findUnique({ where: { id: userId } });
    expect(check?.aktif).toBe(false);

    // Reset password
    const resetRes = await resetPasswordAction(userId, 'PasswordBaru2026!');
    expect(resetRes.success).toBe(true);

    check = await prisma.pengguna.findUnique({ where: { id: userId } });
    const isNewValid = await verifyPassword('PasswordBaru2026!', check!.kataSandiHash);
    expect(isNewValid).toBe(true);
  });
});
