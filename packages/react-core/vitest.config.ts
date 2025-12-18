import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '../../vitest.shared.config';

export default defineConfig(
  mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    resolve: {
      alias: {
        '@openzeppelin/ui-builder-utils': path.resolve(__dirname, '../utils/dist/index.js'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [path.resolve(__dirname, '../../test/setup.ts')],
      passWithNoTests: true,
    },
  })
);
