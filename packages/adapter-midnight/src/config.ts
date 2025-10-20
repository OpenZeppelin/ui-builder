/**
 * Configuration for the Midnight adapter
 *
 * This file defines the dependencies required by the Midnight adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
import type { AdapterConfig } from '@openzeppelin/ui-builder-types';

export const midnightAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the Midnight adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // Runtime dependencies
    runtime: {
      // Core Midnight libraries
      '@midnight-ntwrk/dapp-connector-api': '^3.0.0',
      '@midnight-ntwrk/midnight-js-types': '^2.0.2',
      '@midnight-ntwrk/midnight-js-utils': '^2.0.2',

      // Reactive state management
      rxjs: '^7.8.1',

      // Cryptographic utilities
      '@scure/base': '^2.0.0',

      // UI framework
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },

    // Development dependencies
    dev: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
    },
  },
};
