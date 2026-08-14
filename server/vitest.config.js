import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    hookTimeout: 60000,
    testTimeout: 30000,
  },
});
