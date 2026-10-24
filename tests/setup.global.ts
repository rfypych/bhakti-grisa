import { copyFileSync, existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Prepare an isolated test database (prisma/test.db) with the same schema
// as the development database. Tests wipe and reseed it freely; dev.db is
// only ever read here (as the schema source), never written by tests.
export default function globalSetup() {
  const prismaDir = path.resolve(__dirname, '../prisma');
  const devDb = path.join(prismaDir, 'dev.db');
  const testDb = path.join(prismaDir, 'test.db');

  if (!existsSync(devDb)) {
    execSync('npx prisma db push --skip-generate', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  }

  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    rmSync(testDb + suffix, { force: true });
  }
  copyFileSync(devDb, testDb);
}
