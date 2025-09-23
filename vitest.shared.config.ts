import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export const sharedVitestConfig = defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@openzeppelin/ui-builder-renderer', '@openzeppelin/ui-builder-types'],
  },
  ssr: {
    noExternal: ['@openzeppelin/ui-builder-renderer', '@openzeppelin/ui-builder-types'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './test/setup.ts')],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: ['**/node_modules/**', '**/dist/**', '**/src/test/**'],
    },
  },
});
