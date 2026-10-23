import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/prisma';

describe('Database Setup', () => {
  it('connects to SQLite and reads Wilayah', async () => {
    const count = await prisma.wilayah.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
