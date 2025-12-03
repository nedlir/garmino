import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Run integration tests sequentially to avoid database conflicts
    fileParallelism: false,
    // Global setup starts containers once for all tests
    globalSetup: ['./tests/integration/globalSetup.ts'],
    // Reasonable timeout for individual hooks (containers already running)
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules/', 'dist/', 'tests/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
