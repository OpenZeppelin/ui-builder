
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'scripts',
    environment: 'node'
    globals: true
    include: [untitled -2 ( __dirname, 'scripts/**/*.test.ts')],
  },
});
