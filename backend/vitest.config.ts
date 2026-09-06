import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/integration/test-setup.ts'],
    fileParallelism: false,
  },
});
