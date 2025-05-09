/**
 * Types related to blockchain adapters configuration
 */

/**
 * Configuration for blockchain adapters
 * This interface defines the structure for adapter-specific configuration
 * including dependencies required by the adapter.
 */
export interface AdapterConfig {
  /**
   * Dependencies configuration for this adapter
   */
  dependencies: {
    /**
     * Runtime dependencies required by this adapter
     * These dependencies will be included in the package.json of exported projects
     * that use this adapter.
     *
     * Format: { packageName: versionRange }
     * Example: { "viem": "^2.28.0" }
     */
    runtime: Record<string, string>;

    /**
     * Development dependencies for the adapter
     * These are typically type definitions and development tools
     * that are not needed at runtime but help with development.
     * They will be added to devDependencies in the exported package.json.
     *
     * Format: { packageName: versionRange }
     * Example: { "@types/viem": "^2.28.0" }
     */
    dev?: Record<string, string>;
  };

  // Additional configuration properties can be added in the future
  // as the adapter system evolves, without breaking existing implementations
}
