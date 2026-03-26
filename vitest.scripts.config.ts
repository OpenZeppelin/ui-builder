import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'scripts',
    environment: 'node',
    globals: true,
    include: [path.join(__dirname, 'scripts/**/*.test.ts')],
  },
});
