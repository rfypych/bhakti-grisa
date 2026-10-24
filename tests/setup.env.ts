// Runs in every test worker before the test file (and therefore before
// src/lib/prisma.ts constructs its client): point all Prisma access in
// tests at the isolated test database so the suite can never wipe or
// mutate the development database (prisma/dev.db).
process.env.DATABASE_URL = 'file:./test.db';
