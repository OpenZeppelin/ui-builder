import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';

import { sharedVitestConfig } from '../../vitest.shared.config';

export default defineConfig(
  mergeConfig(sharedVitestConfig as ViteUserConfig, {
    // Package-specific overrides for adapter-evm-core can be added here
  })
);
