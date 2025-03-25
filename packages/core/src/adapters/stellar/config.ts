import type { AdapterConfig } from '../../core/types/AdapterTypes';

/**
 * Configuration for the Stellar adapter
 *
 * This file defines the dependencies required by the Stellar adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
export const stellarAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the Stellar adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // TODO: Review and update with real, verified dependencies and versions before production release

    // Runtime dependencies
    runtime: {
      // Core Stellar libraries
      'stellar-sdk': '^10.4.1',
      '@stellar/freighter-api': '^1.5.1',

      // Stellar wallet integration
      '@stellar/design-system': '^0.5.1',
      '@stellar/wallet-sdk': '^0.6.0',

      // Utilities for Stellar development
      'bignumber.js': '^9.1.1',
      'js-xdr': '^1.3.0',
    },

    // Development dependencies
    dev: {
      // Testing utilities for Stellar
      '@stellar/typescript-wallet-sdk': '^0.2.0',

      // Soroban contract SDK for Stellar
      '@stellar/soroban-sdk': '^0.7.0',
    },
  },
};
