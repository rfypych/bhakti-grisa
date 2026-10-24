import crypto from 'crypto';
import { PeranPengguna } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'simpatik_session';

const AUTH_SECRET =
  process.env.AUTH_SECRET || 'simpatik-dev-secret-key-change-in-production-min32char';

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn(
    '[PERINGATAN KEAMANAN] process.env.AUTH_SECRET belum diset di production! Menggunakan kunci default pengembangan.'
  );
}

export interface SessionPayload {
  userId: string;
  peran: PeranPengguna;
  wilayahId: string | null;
  exp: number; // Unix timestamp ms
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
