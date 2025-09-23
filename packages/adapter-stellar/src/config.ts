/**
 * Configuration for the Stellar adapter
 *
 * This file defines the dependencies required by the Stellar adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
import type { AdapterConfig } from '@openzeppelin/ui-builder-types';

export const stellarAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the Stellar adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // Runtime dependencies
    runtime: {
      // Core Stellar libraries
      '@stellar/stellar-sdk': '^14.1.1',

      // Wallet connection and integration
      '@creit.tech/stellar-wallets-kit': '^1.9.5',

      // OpenZeppelin Relayer integration (optional, for gasless transactions)
      '@openzeppelin/relayer-sdk': '1.1.0',

      // React integration for wallet components
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
