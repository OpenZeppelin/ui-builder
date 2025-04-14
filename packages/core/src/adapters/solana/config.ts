import type { AdapterConfig } from '../../core/types/AdapterTypes';

/**
 * Configuration for the Solana adapter
 *
 * This file defines the dependencies required by the Solana adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
export const solanaAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the Solana adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // TODO: Review and update with real, verified dependencies and versions before production release

    // Runtime dependencies
    runtime: {
      // Core Solana libraries
      '@solana/web3.js': '^1.78.5',
      '@solana/spl-token': '^0.3.8',

      // Wallet adapters
      '@solana/wallet-adapter-react': '^0.15.35',
      '@solana/wallet-adapter-base': '^0.9.23',

      // Utilities for working with Solana
      bs58: '^5.0.0',
      '@project-serum/anchor': '^0.26.0',
    },

    // Development dependencies
    dev: {
      // Testing utilities for Solana
      '@solana/spl-token-registry': '^0.2.4574',

      // CLI tools for development
      '@solana/cli': '^1.1.0',
    },
  },
};
