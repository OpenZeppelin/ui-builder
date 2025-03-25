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
      ethers: '^6.7.1',
      viem: '^1.10.9',

      // Web3 integration utilities
      '@wagmi/core': '^1.4.7',

      // ABIs and contract handling
      '@openzeppelin/contracts-upgradeable': '^4.9.3',
    },

    // Development dependencies
    dev: {
      // Type definitions
      '@types/ethers': '^6.0.0',

      // Testing utilities for EVM
      hardhat: '^2.17.3',
    },
  },
};
