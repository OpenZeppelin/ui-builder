import type { AdapterConfig } from '../../core/types/AdapterTypes';

/**
 * Configuration for the EVM adapter
 *
 * This file defines the dependencies required by the EVM adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
export const evmAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the EVM adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // TODO: Review and update with real, verified dependencies and versions before production release

    // Runtime dependencies
    runtime: {
      // Core EVM libraries
      ethers: '^6.13.5',
      // Utility library
      lodash: '^4.17.21',
    },

    // Development dependencies
    dev: {
      '@types/lodash': '^4.17.16',
    },
  },
};
