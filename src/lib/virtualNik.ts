/**
 * Generates a virtual temporary NIK for newborns or residents without an official Dukcapil NIK.
 * Format: TEMP-YYYYMMDD-XXXX
 * - YYYYMMDD: date of birth
 * - XXXX: 4 random uppercase alphanumeric characters
 */
export function generateVirtualNik(dob: Date | string): string {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;

  const year = birthDate.getFullYear().toString().padStart(4, '0');
  const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
  const day = birthDate.getDate().toString().padStart(2, '0');

  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomSuffix = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomSuffix += chars[randomIndex];
  }

  return `TEMP-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Checks whether a given NIK string is a virtual temporary NIK.
 */
export function isVirtualNik(nik: string): boolean {
  if (!nik) return false;
  return /^TEMP-\d{8}-[A-Z0-9]{4}$/.test(nik);
}
