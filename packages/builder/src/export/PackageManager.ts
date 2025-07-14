/**
 * PackageManager
 *
 * This class is responsible for managing dependencies in exported form projects.
 * It loads configuration from adapters and form-renderer to determine which
 * dependencies to include in the package.json of exported projects.
 */
/**
 * VIRTUAL MODULE IMPORT
 *
 * This import uses a virtual module provided by the 'form-renderer-config-provider'
 * Vite plugin defined in vite.config.ts.
 *
 * WHY THIS APPROACH:
 * Previous implementation used import.meta.glob to dynamically discover
 * this configuration file across package boundaries:
 *
 * ```
 * const formRendererConfigFile = import.meta.glob('../../form-renderer/src/config.ts', {
 *   eager: true,
 * }) as GlobImportResult;
 * ```
 *
 * However, in development mode (pnpm dev), import.meta.glob cannot reliably
 * resolve paths that cross package boundaries in a monorepo, causing the error:
 * "Export failed: No form renderer configuration file found"
 *
 * The virtual module approach works consistently in both development and production
 * environments while preserving all the build-time optimization benefits.
 *
 * TEST CONFIGURATION:
 * For tests, there's a matching plugin in vitest.config.ts that provides a minimal mock
 * implementation of this module. Most tests provide their own mock via the constructor
 * parameters, but the virtual module is necessary to satisfy this import statement.
 */
import { formRendererConfig } from 'virtual:form-renderer-config';

import type { FormRendererConfig } from '@openzeppelin/contracts-ui-builder-renderer';
import { Ecosystem, UiKitConfiguration } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { adapterPackageMap } from '../core/ecosystemManager';
import type { ExportOptions } from '../core/types/ExportTypes';
import type { BuilderFormConfig } from '../core/types/FormTypes';

import { AdapterConfigLoader } from './AdapterConfigLoader';
import { packageVersions } from './versions';

/**
 * PackageManager is responsible for managing dependencies in exported form projects.
 * It dynamically loads configuration files from adapters and the form-renderer
 * package to determine the dependencies required for different chain types and
 * field types.
 */
export class PackageManager {
  private formRendererConfig: FormRendererConfig;
  private adapterConfigLoader: AdapterConfigLoader;

  /**
   * Creates a new PackageManager instance
   * @param mockFormRendererConfig Optional form renderer config for testing
   * @param mockAdapterConfigLoader Optional adapter config loader for testing
   */
  constructor(
    mockFormRendererConfig?: FormRendererConfig,
    mockAdapterConfigLoader?: AdapterConfigLoader
  ) {
    this.formRendererConfig = mockFormRendererConfig || this.loadFormRendererConfig();
    this.adapterConfigLoader = mockAdapterConfigLoader || new AdapterConfigLoader();
  }

  /**
   * Load form-renderer configuration
   *
   * This method loads the form-renderer configuration that defines
   * which dependencies are needed for different field types.
   *
   * NOTE: This implementation uses the formRendererConfig imported
   * from the virtual module rather than trying to discover it via
   * import.meta.glob, which doesn't work reliably across package
   * boundaries in development mode.
   *
   * @returns The form-renderer configuration
   */
  private loadFormRendererConfig(): FormRendererConfig {
    // Use the imported config from the virtual module
    if (!formRendererConfig) {
      throw new Error('No form renderer configuration file found');
    }

    // Validate the config object has required properties
    if (!this.isFormRendererConfig(formRendererConfig)) {
      throw new Error(
        'Invalid form renderer configuration. ' +
          'The export "formRendererConfig" is missing required properties'
      );
    }

    return formRendererConfig;
  }

  /**
   * Check if an object appears to be a FormRendererConfig
   * @param obj The object to check
   * @returns True if the object has the required FormRendererConfig properties
   */
  private isFormRendererConfig(obj: unknown): obj is FormRendererConfig {
    if (!obj || typeof obj !== 'object') return false;

    // Check for properties required in FormRendererConfig
    const candidate = obj as Partial<FormRendererConfig>;
    return (
      candidate.fieldDependencies !== undefined &&
      candidate.coreDependencies !== undefined &&
      typeof candidate.fieldDependencies === 'object' &&
      typeof candidate.coreDependencies === 'object'
    );
  }

  /**
   * Get core dependencies from form-renderer config
   * @returns Record of package names to version ranges
   */
  private getCoreDependencies(): Record<string, string> {
    return this.formRendererConfig.coreDependencies;
  }

  /**
   * Get chain-specific runtime dependencies from adapter config
   * @param ecosystem The ecosystem
   * @returns Record of package names to version ranges
   */
  private async getChainDependencies(ecosystem: Ecosystem): Promise<Record<string, string>> {
    const adapterConfig = await this.adapterConfigLoader.loadConfig(ecosystem);
    if (!adapterConfig) {
      return {};
    }
    return adapterConfig.dependencies.runtime;
  }

  /**
   * Get chain-specific development dependencies from adapter config
   * @param ecosystem The ecosystem
   * @returns Record of package names to version ranges
   */
  private async getChainDevDependencies(ecosystem: Ecosystem): Promise<Record<string, string>> {
    const adapterConfig = await this.adapterConfigLoader.loadConfig(ecosystem);
    if (!adapterConfig || !adapterConfig.dependencies.dev) {
      return {};
    }
    return adapterConfig.dependencies.dev;
  }

  /**
   * Get field-specific runtime dependencies from form-renderer config
   * @param formConfig The form configuration
   * @returns Record of package names to version ranges
   */
  private getFieldDependencies(formConfig: BuilderFormConfig): Record<string, string> {
    const dependencies: Record<string, string> = {};

    // Get unique field types used in the form
    const fieldTypes = new Set(formConfig.fields.map((field) => field.type));

    // Add dependencies for each field type
    for (const fieldType of fieldTypes) {
      const fieldDeps = this.formRendererConfig.fieldDependencies[fieldType];

      if (fieldDeps) {
        // Extract runtime dependencies
        Object.assign(dependencies, fieldDeps.runtimeDependencies);
      }
    }

    return dependencies;
  }

  /**
   * Get field-specific development dependencies from form-renderer config
   * @param formConfig The form configuration
   * @returns Record of package names to version ranges
   */
  private getFieldDevDependencies(formConfig: BuilderFormConfig): Record<string, string> {
    const devDependencies: Record<string, string> = {};

    // Check if fields exist
    if (!formConfig.fields || !Array.isArray(formConfig.fields)) {
      return devDependencies;
    }

    // Get unique field types used in the form
    const fieldTypes = new Set(formConfig.fields.map((field) => field.type));

    // Add dev dependencies for each field type
    for (const fieldType of fieldTypes) {
      const fieldDeps = this.formRendererConfig.fieldDependencies[fieldType];

      if (fieldDeps && fieldDeps.devDependencies) {
        // Merge dev dependencies
        Object.assign(devDependencies, fieldDeps.devDependencies);
      }
    }

    return devDependencies;
  }

  /**
   * Get the combined dependencies needed for a form
   *
   * @param formConfig Form configuration from the builder
   * @param ecosystem The ecosystem
   * @returns Record of dependency packages and versions
   */
  async getDependencies(
    formConfig: BuilderFormConfig,
    ecosystem: Ecosystem
  ): Promise<Record<string, string>> {
    const adapterPackageName = adapterPackageMap[ecosystem];

    // Get adapter-specific runtime dependencies
    const ecosystemDependencies = await this.getChainDependencies(ecosystem);

    // Get UI kit specific dependencies
    const uiKitDependencies = await this.getUiKitDependencies(ecosystem, formConfig.uiKitConfig);

    const combined = {
      ...this.getCoreDependencies(),
      ...this.getFieldDependencies(formConfig),
      ...ecosystemDependencies, // Include adapter's runtime dependencies
      ...uiKitDependencies,
    };

    // Add the adapter package itself if available
    if (adapterPackageName) {
      combined[adapterPackageName] = 'workspace:*'; // Use workspace protocol for now
      combined['@openzeppelin/transaction-form-types'] = 'workspace:*';
      combined['@openzeppelin/transaction-form-ui'] = 'workspace:*';
      combined['@openzeppelin/transaction-form-utils'] = 'workspace:*';
      combined['@openzeppelin/contracts-ui-builder-renderer'] = 'workspace:*';
      combined['@openzeppelin/transaction-form-react-core'] = 'workspace:*';
    }

    return combined;
  }

  /**
   * Get UI kit-specific runtime dependencies from adapter config
   * @param ecosystem The ecosystem
   * @param uiKitConfig The UI kit configuration
   * @returns Record of package names to version ranges
   */
  private async getUiKitDependencies(
    ecosystem: Ecosystem,
    uiKitConfig?: UiKitConfiguration
  ): Promise<Record<string, string>> {
    if (!uiKitConfig?.kitName) {
      return {};
    }
    const adapterConfig = await this.adapterConfigLoader.loadConfig(ecosystem);
    const kitName = uiKitConfig.kitName;
    if (!adapterConfig || !adapterConfig.uiKits || !adapterConfig.uiKits[kitName]) {
      return {};
    }
    return adapterConfig.uiKits[kitName].dependencies.runtime;
  }

  /**
   * Get the combined dev dependencies needed for the project
   *
   * @param formConfig The form configuration
   * @param ecosystem The ecosystem
   * @returns Record of development dependency packages and versions
   */
  async getDevDependencies(
    formConfig: BuilderFormConfig,
    ecosystem: Ecosystem
  ): Promise<Record<string, string>> {
    // Get chain-specific dev dependencies
    const ecosystemDevDependencies = await this.getChainDevDependencies(ecosystem);

    // Get field-specific dev dependencies
    const fieldDevDependencies = this.getFieldDevDependencies(formConfig);

    return {
      ...ecosystemDevDependencies,
      ...fieldDevDependencies,
    };
  }

  /**
   * Get the combined overrides needed for a form
   *
   * @param formConfig The form configuration
   * @param ecosystem The ecosystem
   * @returns Record of dependency packages and versions
   */
  private async getOverrides(
    formConfig: BuilderFormConfig,
    ecosystem: Ecosystem
  ): Promise<Record<string, string>> {
    const adapterConfig = await this.adapterConfigLoader.loadConfig(ecosystem);
    if (!adapterConfig) {
      return {};
    }

    const adapterOverrides = adapterConfig.overrides || {};

    const uiKitConfig = formConfig.uiKitConfig;
    const kitName = uiKitConfig?.kitName;
    const uiKitOverrides = (kitName && adapterConfig.uiKits?.[kitName]?.overrides) || {};

    return {
      ...adapterOverrides,
      ...uiKitOverrides,
    };
  }

  /**
   * Updates the package.json content with correct dependencies, metadata, and scripts.
   *
   * @param originalContent Original package.json content string
   * @param formConfig The form configuration
   * @param ecosystem The ecosystem
   * @param functionId The function ID
   * @param options Export options, including the environment (`env`)
   * @returns Updated package.json content string
   */
  async updatePackageJson(
    originalContent: string,
    formConfig: BuilderFormConfig,
    ecosystem: Ecosystem,
    functionId: string,
    options: Partial<ExportOptions> = {} // Includes 'env' field
  ): Promise<string> {
    try {
      const packageJson = JSON.parse(originalContent);

      // Ensure dependencies and devDependencies objects exist
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.devDependencies = packageJson.devDependencies || {};

      // Get all dependencies
      const dependencies = await this.getDependencies(formConfig, ecosystem);
      const devDependencies = await this.getDevDependencies(formConfig, ecosystem);
      const overrides = await this.getOverrides(formConfig, ecosystem);

      // Merge dependencies
      const finalDependencies = {
        ...packageJson.dependencies,
        ...dependencies,
        ...(options.dependencies || {}),
      };

      // Apply versioning strategy based on environment
      packageJson.dependencies = this.applyVersioningStrategy(
        finalDependencies,
        options.env // Pass env here
      );

      // Merge dev dependencies
      const originalDevDependencies = { ...(packageJson.devDependencies || {}) }; // Store original safely

      // Apply versioning to the new dev dependencies
      const versionedDevDependencies = this.applyVersioningStrategy(devDependencies, options.env);

      // Merge original dev deps with the processed new ones
      packageJson.devDependencies = {
        ...originalDevDependencies,
        ...versionedDevDependencies,
      };

      // Remove devDependencies key if the final merged object is empty
      if (Object.keys(packageJson.devDependencies).length === 0) {
        delete packageJson.devDependencies;
      }

      // Set package name and description (convert functionId to lowercase for name)
      packageJson.name = options.projectName || `${functionId.toLowerCase()}-form`;

      // Use custom description if provided, otherwise use the default format
      packageJson.description = options.description || `Transaction form for ${functionId}`;

      // Add author and license if provided
      if (options.author) {
        packageJson.author = options.author;
      }

      if (options.license) {
        packageJson.license = options.license;
      }

      // Add overrides if any exist
      if (Object.keys(overrides).length > 0) {
        packageJson.overrides = overrides;
      }

      // Add upgrade instructions if workspace dependencies are present
      this.addUpgradeInstructions(packageJson);

      // Format and return updated package.json content
      return JSON.stringify(packageJson, null, 2);
    } catch (error) {
      // Log error and re-throw to ensure failure is surfaced
      logger.error('PackageManager', 'Error updating package.json:', error); // Use logger
      throw new Error(`Error updating package.json: ${(error as Error).message}`);
    }
  }

  /**
   * Applies the versioning strategy based on the environment.
   *
   * - 'local': Uses 'workspace:*' for known internal packages.
   * - 'production' (or undefined): Uses the versions defined in config (assumed published).
   *
   * @param dependencies Original dependencies object
   * @param env The target environment ('local' or 'production')
   * @returns Dependencies object with versions adjusted based on strategy
   */
  private applyVersioningStrategy(
    dependencies: Record<string, string>,
    env: 'local' | 'production' | undefined = 'production' // Default to 'production'
  ): Record<string, string> {
    const updatedDependencies: Record<string, string> = {};
    const internalPackages = new Set([
      '@openzeppelin/contracts-ui-builder-renderer',
      '@openzeppelin/transaction-form-types',
      '@openzeppelin/transaction-form-utils',
      '@openzeppelin/transaction-form-ui',
      '@openzeppelin/transaction-form-react-core',
      ...Object.values(adapterPackageMap),
    ]);

    for (const [pkgName, version] of Object.entries(dependencies)) {
      if (internalPackages.has(pkgName) && env === 'local') {
        updatedDependencies[pkgName] = 'workspace:*';
      } else if (internalPackages.has(pkgName)) {
        // For production, use the centrally-managed version
        const managedVersion = packageVersions[pkgName as keyof typeof packageVersions] || version;
        if (managedVersion.startsWith('^') || managedVersion === 'workspace:*') {
          updatedDependencies[pkgName] = managedVersion;
        } else {
          updatedDependencies[pkgName] = `^${managedVersion}`;
        }
      } else {
        updatedDependencies[pkgName] = version;
      }
    }
    return updatedDependencies;
  }

  /**
   * Add upgrade instructions to package.json
   * @param packageJson Package.json object
   */
  private addUpgradeInstructions(packageJson: Record<string, unknown>): void {
    // Add a comment about how to update dependencies
    packageJson.scripts = packageJson.scripts || {};

    // Add a script to update the form-renderer package
    (packageJson.scripts as Record<string, string>)['update-form-renderer'] =
      'npm update @openzeppelin/contracts-ui-builder-renderer';

    // Add a script to check for outdated dependencies
    (packageJson.scripts as Record<string, string>)['check-deps'] = 'npm outdated';
  }
}
