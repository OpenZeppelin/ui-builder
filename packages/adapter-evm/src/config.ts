// import type { AdapterConfig } from '@openzeppelin/transaction-form-types/configs'; // Removed import

/**
 * Configuration for the EVM adapter
 *
 * This file defines the dependencies required by the EVM adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
export const evmAdapterConfig = {
  /**
   * Dependencies required by the EVM adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // TODO: Review and update with real, verified dependencies and versions before production release

    // Runtime dependencies
    runtime: {
      // Core EVM libraries
      ethers: '^6.13.5', // TODO: Replace with viem?
      // Wallet connection libraries
      wagmi: '^2.15.0',
      viem: '^2.28.0',
      // Utility library
      lodash: '^4.17.21',
    },

    // Development dependencies
    dev: {
      '@types/lodash': '^4.17.16',
    },
  },
};
