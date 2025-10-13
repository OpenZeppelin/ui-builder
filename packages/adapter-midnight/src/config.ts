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
  appName: 'OpenZeppelin UI Builder',

  /**
   * Dependencies required by the Midnight adapter
   * These will be included in exported projects that use this adapter
   */
  dependencies: {
    // FR-017: For v1, adapter export dependencies must match the export manifest.
    // Only include runtime deps required by exported apps using the Midnight adapter.
    runtime: {
      '@midnight-ntwrk/dapp-connector-api': '^3.0.0',
    },
    dev: {},
  },
};
