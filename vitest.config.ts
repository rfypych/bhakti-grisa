import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  oxc: false,
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    globalSetup: ['./tests/setup.global.ts'],
    setupFiles: ['./tests/setup.env.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
