import path from 'path';
import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '../../vitest.shared.config';

export default defineConfig(
  mergeConfig(sharedVitestConfig, {
    // Package-specific overrides
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@styles': path.resolve(__dirname, '../styles'),
        '@openzeppelin/contracts-ui-builder-utils': path.resolve(
          __dirname,
          '../utils/src/index.ts'
        ),
      },
    },
  })
);
