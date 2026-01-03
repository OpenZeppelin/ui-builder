import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '../../vitest.shared.config';

export default defineConfig(
  mergeConfig(sharedVitestConfig, {
    // Package-specific overrides for adapter-evm
    resolve: {
      alias: {
        // Alias for @openzeppelin/ui-builder-utils if needed by tests
        // Add other package-specific aliases here if necessary
      },
    },
    // Add other evm-adapter specific test configurations if needed
  })
);
