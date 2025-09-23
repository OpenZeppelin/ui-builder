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
        '@openzeppelin/ui-builder-react-core': path.resolve(
          __dirname,
          '../react-core/dist/index.js'
        ),
        '@openzeppelin/ui-builder-types': path.resolve(__dirname, '../types/dist/index.js'),
        '@openzeppelin/ui-builder-ui': path.resolve(__dirname, '../ui/dist/index.js'),
        '@openzeppelin/ui-builder-utils': path.resolve(__dirname, '../utils/src/index.ts'),
      },
    },
  })
);
