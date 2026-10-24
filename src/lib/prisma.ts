import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // DATABASE_URL override exists so the test suite can run against an
    // isolated test.db (see tests/setup.env.ts); unset in normal app runs,
    // which keep using the schema default file:./dev.db.
    datasources: {
      db: { url: process.env.DATABASE_URL ?? 'file:./dev.db' },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
