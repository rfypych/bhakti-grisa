import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { PeranPengguna, Pengguna, Wilayah } from '@prisma/client';
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  createSessionToken,
  verifySessionToken,
} from './token';

export {
  SESSION_COOKIE_NAME,
  type SessionPayload,
  createSessionToken,
  verifySessionToken,
};

export type PenggunaWithWilayah = Pengguna & {
  wilayah: Wilayah | null;
};

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
 * Retrieves the currently authenticated active user from the session cookie.
 */
export async function getSessionUser(): Promise<PenggunaWithWilayah | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const payload = await verifySessionToken(sessionCookie.value);
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
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeDays * 24 * 60 * 60,
    });
  } catch {
    // Outside active request context (e.g. unit tests)
  }
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Outside active request context
  }
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
