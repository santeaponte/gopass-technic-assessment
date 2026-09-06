import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/integration/**/*.test.ts'],
    setupFiles: ['./src/integration/test-setup.ts'],
    fileParallelism: false,
  },
});
