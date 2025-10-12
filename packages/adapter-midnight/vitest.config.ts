import path from 'path';
import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '../../vitest.shared.config';

export default defineConfig(
  mergeConfig(sharedVitestConfig, {
    resolve: {
      alias: {
        '@openzeppelin/ui-builder-utils': path.resolve(__dirname, '../utils/src/index.ts'),
      },
    },
  })
);
