import type { PeranPengguna } from '@prisma/client';

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
 * Standard Web Base64URL helpers (Edge & Node compatible without Buffer).
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return uint8ArrayToBase64Url(bytes);
}

function base64UrlToString(b64url: string): string {
  const bytes = base64UrlToUint8Array(b64url);
  return new TextDecoder().decode(bytes);
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return await globalThis.crypto.subtle.importKey(
    'raw',
    keyData as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Generates an HMAC-SHA256 signed session token using WebCrypto API (Edge runtime safe).
 */
export async function createSessionToken(
  payload: {
    userId: string;
    peran: PeranPengguna;
    wilayahId?: string | null;
  },
  maxAgeDays: number = 7
): Promise<string> {
  const exp = Date.now() + maxAgeDays * 24 * 60 * 60 * 1000;
  const fullPayload: SessionPayload = {
    userId: payload.userId,
    peran: payload.peran,
    wilayahId: payload.wilayahId ?? null,
    exp,
  };

  const dataStr = stringToBase64Url(JSON.stringify(fullPayload));
  const key = await getCryptoKey(AUTH_SECRET);
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataStr) as unknown as BufferSource
  );
  const signatureStr = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));

  return `${dataStr}.${signatureStr}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token using WebCrypto API (Edge runtime safe).
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataStr, signatureStr] = parts;

  try {
    const key = await getCryptoKey(AUTH_SECRET);
    const sigBytes = base64UrlToUint8Array(signatureStr);
    const dataBytes = new TextEncoder().encode(dataStr);

    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = base64UrlToString(dataStr);
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
