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

// SQLite tuning for concurrent data entry (several cadres may submit at the
// same time): WAL mode lets readers and a writer work without blocking each
// other, and busy_timeout makes a writer queue briefly instead of failing
// with "database is locked". WAL persists in the database file once set;
// busy_timeout applies to this client's connection. journal_mode returns a
// result row, so it must go through $queryRawUnsafe ($executeRawUnsafe
// rejects statements that return rows and would silently no-op here).
// Fire-and-forget on purpose: if a pragma ever fails, SQLite defaults
// still work correctly.
prisma
  .$queryRawUnsafe('PRAGMA journal_mode = WAL;')
  .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;'))
  .catch(() => {});
