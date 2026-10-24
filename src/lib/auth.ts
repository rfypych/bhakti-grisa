import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { PeranPengguna, Pengguna, Wilayah } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'simpatik_session';

const AUTH_SECRET =
  process.env.AUTH_SECRET || 'simpatik-dev-secret-key-change-in-production-min32char';

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn(
    '[PERINGATAN KEAMANAN] process.env.AUTH_SECRET belum diset di production! Menggunakan kunci default pengembangan.'
  );
}

export type PenggunaWithWilayah = Pengguna & {
  wilayah: Wilayah | null;
};

export interface SessionPayload {
  userId: string;
  peran: PeranPengguna;
  wilayahId: string | null;
  exp: number; // Unix timestamp ms
}

/**
 * Hashes a plaintext password securely using bcryptjs.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generates an HMAC-SHA256 signed session token.
 */
export function createSessionToken(
  payload: {
    userId: string;
    peran: PeranPengguna;
    wilayahId?: string | null;
  },
  maxAgeDays: number = 7
): string {
  const exp = Date.now() + maxAgeDays * 24 * 60 * 60 * 1000;
  const fullPayload: SessionPayload = {
    userId: payload.userId,
    peran: payload.peran,
    wilayahId: payload.wilayahId ?? null,
    exp,
  };

  const dataStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(dataStr)
    .digest('base64url');

  return `${dataStr}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token and checks its expiration.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataStr, signature] = parts;

  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(dataStr)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payloadJson = Buffer.from(dataStr, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated active user from the session cookie.
 */
export async function getSessionUser(): Promise<PenggunaWithWilayah | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const payload = verifySessionToken(sessionCookie.value);
    if (!payload?.userId) return null;

    const user = await prisma.pengguna.findUnique({
      where: {
        id: payload.userId,
        aktif: true,
      },
      include: {
        wilayah: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * Sets the httpOnly signed session cookie in the response.
 */
export async function setSessionCookie(token: string, maxAgeDays: number = 7) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60,
  });
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Calculates the array of Wilayah IDs that fall into the given user's role scope:
 * - ADMIN_DESA: null (unrestricted, all village wilayah)
 * - KADER_RT: [user.wilayahId]
 * - PENGURUS_RW: all wilayah within the same Dusun and RW as user's anchor wilayah
 * - PENGURUS_DUSUN: all wilayah within the same Dusun as user's anchor wilayah
 */
export async function getScopeWilayahIds(
  user: {
    peran: PeranPengguna;
    wilayahId: string | null;
    wilayah?: Wilayah | null;
  } | null
): Promise<string[] | null> {
  if (!user) return [];

  if (user.peran === 'ADMIN_DESA') {
    return null;
  }

  if (user.peran === 'KADER_RT') {
    return user.wilayahId ? [user.wilayahId] : [];
  }

  // For PENGURUS_RW and PENGURUS_DUSUN, find anchor wilayah
  let anchor = user.wilayah;
  if (!anchor && user.wilayahId) {
    anchor = await prisma.wilayah.findUnique({ where: { id: user.wilayahId } });
  }

  if (!anchor) return [];

  if (user.peran === 'PENGURUS_RW') {
    const list = await prisma.wilayah.findMany({
      where: {
        dusun: anchor.dusun,
        rw: anchor.rw,
      },
      select: { id: true },
    });
    return list.map((w) => w.id);
  }

  if (user.peran === 'PENGURUS_DUSUN') {
    const list = await prisma.wilayah.findMany({
      where: {
        dusun: anchor.dusun,
      },
      select: { id: true },
    });
    return list.map((w) => w.id);
  }

  return [];
}

/**
 * Guard utility for server actions: requires user to be logged in with one of the allowed roles.
 */
export async function requireRole(allowedRoles: PeranPengguna[]): Promise<PenggunaWithWilayah> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Sesi berakhir atau Anda belum masuk. Silakan login terlebih dahulu.');
  }

  if (!allowedRoles.includes(user.peran)) {
    throw new Error(
      `Akses ditolak: Peran Anda (${user.peran}) tidak memiliki izin untuk tindakan ini.`
    );
  }

  return user;
}
