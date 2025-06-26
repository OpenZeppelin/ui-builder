/**
 * Types related to blockchain adapters configuration.
 * @packageDocumentation
 */

/**
 * Configuration for blockchain adapters.
 * This interface defines the structure for adapter-specific configuration
 * including dependencies required by the adapter for exported projects.
 */
export interface AdapterConfig {
  /**
   * Dependencies configuration for this adapter.
   */
  dependencies: {
    /**
     * Runtime dependencies required by this adapter for an exported project.
     * These will be included in the `dependencies` section of the exported `package.json`.
     *
     * @example { "viem": "^2.0.0" }
     */
    runtime: Record<string, string>;

    /**
     * Development dependencies for the adapter, usually type definitions.
     * These will be included in the `devDependencies` of the exported `package.json`.
     *
     * @example { "@types/react": "^18.0.0" }
     */
    dev?: Record<string, string>;
  };
  /**
   * Overrides for transitive dependencies.
   * These will be included in the `overrides` section of the exported `package.json`.
   * This is useful for resolving peer dependency conflicts (e.g., with React 19).
   *
   * @example { "use-sync-external-store": "^1.2.0" }
   */
  overrides?: Record<string, string>;
  uiKits?: Record<
    string,
    {
      dependencies: {
        runtime: Record<string, string>;
        dev?: Record<string, string>;
      };
      /**
       * UI Kit-specific overrides for transitive dependencies.
       */
      overrides?: Record<string, string>;
    }
  >;
  // Future properties might include things like:
  // recommendedNodeVersion?: string;
  // setupScripts?: { name: string; script: string }[];
}
