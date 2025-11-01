/**
 * Types related to blockchain adapters configuration.
 * @packageDocumentation
 */

/**
 * Vite configuration fragments for adapters with special build requirements
 */
export interface ViteConfigInfo {
  /**
   * Import statements needed in vite.config.ts
   * @example ["import wasm from 'vite-plugin-wasm';", "import topLevelAwait from 'vite-plugin-top-level-await';"]
   */
  imports: string[];

  /**
   * Initialization code to run at the top of defineConfig
   * @example "const midnightConfig = getMidnightViteConfig({ wasm, topLevelAwait });"
   */
  configInit?: string;

  /**
   * Plugin entries to add to the plugins array
   * @example "...midnightConfig.plugins,"
   */
  plugins?: string;

  /**
   * Dedupe configuration
   * @example "dedupe: [...(midnightConfig.resolve?.dedupe || [])],"
   */
  dedupe?: string;

  /**
   * OptimizeDeps configuration
   * @example { include: "...", exclude: "..." }
   */
  optimizeDeps?: {
    include?: string;
    exclude?: string;
  };
}

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

    /**
     * Build tool dependencies required by this adapter (e.g., Vite plugins, bundler config).
     * These will be included in the `devDependencies` of the exported `package.json`.
     * Used by adapters with special build requirements (e.g., Midnight's WASM support).
     *
     * @example { "vite-plugin-wasm": "^3.3.0", "vite-plugin-top-level-await": "^1.4.4" }
     */
    build?: Record<string, string>;
  };

  /**
   * Optional Vite configuration fragments for adapters with special build requirements.
   * When present, the export system will generate a vite.config.ts that includes these configurations.
   *
   * @example
   * ```typescript
   * viteConfig: {
   *   imports: ["import wasm from 'vite-plugin-wasm';"],
   *   configInit: "const config = getAdapterConfig({ wasm });",
   *   plugins: "...config.plugins,"
   * }
   * ```
   */
  viteConfig?: ViteConfigInfo;

  /**
   * Overrides for transitive dependencies.
   * These will be included in the `overrides` section of the exported `package.json`.
   * This is useful for resolving peer dependency conflicts (e.g., with React 19).
   *
   * @example { "use-sync-external-store": "^1.2.0" }
   */
  overrides?: Record<string, string>;

  /**
   * Optional UI kits that can be used with this adapter.
   * Each UI kit can specify its own set of dependencies and overrides.
   *
   * Note: Package patches are automatically applied when the adapter is installed.
   * Adapters that require patches (e.g., Midnight SDK fixes) bundle them in their
   * package and configure pnpm.patchedDependencies in their own package.json.
   * No additional configuration is needed in exported apps.
   */
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
