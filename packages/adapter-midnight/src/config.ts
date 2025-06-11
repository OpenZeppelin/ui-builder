/**
 * Configuration for the Midnight adapter
 *
 * This file defines the dependencies required by the Midnight adapter
 * when generating exported projects. It follows the AdapterConfig
 * interface to provide a structured approach to dependency management.
 */
export const midnightAdapterConfig = {
  /**
   * Default app name to display in the wallet connection UI.
   */
  appName: 'OpenZeppelin Transaction Form Builder',

  /**
   * Dependencies required by the Midnight adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // TODO: Review and update with real, verified dependencies and versions before production release

    // Runtime dependencies
    runtime: {
      // Core Midnight protocol libraries
      '@midnight-protocol/sdk': '^0.8.2',
      '@midnight-protocol/client': '^0.7.0',

      // Encryption and privacy utilities
      'libsodium-wrappers': '^0.7.11',
      '@openzeppelin/contracts-upgradeable': '^4.9.3',

      // Additional utilities for Midnight
      'js-sha256': '^0.9.0',
      'bn.js': '^5.2.1',

      '@midnight-ntwrk/dapp-connector-api': '^3.0.0',
    },

    // Development dependencies
    dev: {
      // Testing utilities for Midnight
      '@midnight-protocol/testing': '^0.5.0',

      // Type definitions
      '@types/libsodium-wrappers': '^0.7.10',
      '@types/bn.js': '^5.1.1',
    },
  },
};
