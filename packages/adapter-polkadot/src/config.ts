/**
 * Configuration for the Polkadot adapter
 *
 * This file defines the dependencies required by the Polkadot adapter
 * when generating exported projects. Since Polkadot EVM networks use
 * the same wallet infrastructure as EVM, the dependencies are similar.
 */
import type { AdapterConfig } from '@openzeppelin/ui-types';

export const polkadotAdapterConfig: AdapterConfig = {
  /**
   * Dependencies required by the Polkadot adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // Runtime dependencies
    runtime: {
      // Core EVM libraries (same as EVM adapter for EVM-compatible networks)
      wagmi: '^2.15.0',
      '@wagmi/core': '^2.20.3',
      viem: '^2.28.0',
      '@tanstack/react-query': '^5.0.0',
    },

    // Development dependencies
    dev: {
      '@types/lodash': '^4.17.5',
    },
  },
  overrides: {
    'use-sync-external-store': '^1.2.0',
    valtio: '^1.13.2',
  },
  uiKits: {
    rainbowkit: {
      dependencies: {
        runtime: {
          '@rainbow-me/rainbowkit': '^2.2.8',
        },
      },
      overrides: {
        '@paulmillr/qr': 'npm:qr@^0.5.0',
        '@walletconnect/modal': '^2.7.1',
      },
    },
  },
};
