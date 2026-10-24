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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
