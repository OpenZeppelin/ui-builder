/**
 * PackageManager
 *
 * This class is responsible for managing dependencies in exported form projects.
 * It loads configuration from adapters and form-renderer to determine which
 * dependencies to include in the package.json of exported projects.
 */

import type { FormRendererConfig } from '@form-renderer/types';

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

import type { AdapterConfig } from '../core/types/AdapterTypes';
import type { ChainType } from '../core/types/ContractSchema';
import type { ExportOptions } from '../core/types/ExportTypes';
import type { BuilderFormConfig } from '../core/types/FormTypes';

/**
 * Type for glob import results - using Record with index signature
 * to avoid hardcoding chain types, maintaining our chain-agnostic approach
 */
type GlobImportResult = Record<string, Record<string, unknown>>;

// Build-time configuration discovery using Vite's import.meta.glob
// This runs at build time and bundles the configurations directly
const adapterConfigFiles = import.meta.glob('../adapters/*/config.ts', {
  eager: true,
}) as GlobImportResult;

// For testing purposes - make file collections available to tests
export const packageTestFiles = {
  adapterConfig: adapterConfigFiles,
  formRendererConfig: { 'virtual:form-renderer-config': { formRendererConfig } },
};

/**
 * PackageManager is responsible for managing dependencies in exported form projects.
 * It dynamically loads configuration files from adapters and the form-renderer
 * package to determine the dependencies required for different chain types and
 * field types.
 */
export class PackageManager {
  private adapterConfigs: Record<string, AdapterConfig>;
  private formRendererConfig: FormRendererConfig;

  /**
   * Creates a new PackageManager instance
   * @param mockAdapterConfigs Optional adapter configs for testing
   * @param mockFormRendererConfig Optional form renderer config for testing
   */
  constructor(
    mockAdapterConfigs?: Record<string, AdapterConfig>,
    mockFormRendererConfig?: FormRendererConfig
  ) {
    this.adapterConfigs = mockAdapterConfigs || this.loadAdapterConfigs();
    this.formRendererConfig = mockFormRendererConfig || this.loadFormRendererConfig();
  }

  /**
   * Load adapter configuration files using Vite's import.meta.glob
   * @returns A record of adapter configurations by chain type
   */
  private loadAdapterConfigs(): Record<string, AdapterConfig> {
    const configs: Record<string, AdapterConfig> = {};

    // Process all discovered config files
    for (const path in adapterConfigFiles) {
      // Extract chain type from path (e.g., '../adapters/evm/config.ts' -> 'evm')
      const match = path.match(/\/adapters\/([^/]+)\//);
      if (match) {
        const chainType = match[1];
        const module = adapterConfigFiles[path];

        // Look for {chainType}AdapterConfig (conventional naming)
        const conventionalConfigName = `${chainType}AdapterConfig`;

        if (!module[conventionalConfigName]) {
          throw new Error(
            `Missing adapter configuration for ${chainType}. ` +
              `Expected export named "${conventionalConfigName}" in ${path}`
          );
        }

        // Validate the config object has required properties
        if (!this.isAdapterConfig(module[conventionalConfigName])) {
          throw new Error(
            `Invalid adapter configuration for ${chainType}. ` +
              `The export "${conventionalConfigName}" is missing required properties`
          );
        }

        configs[chainType] = module[conventionalConfigName] as AdapterConfig;
      }
    }

    return configs;
  }

  /**
   * Check if an object appears to be an AdapterConfig
   * @param obj The object to check
   * @returns True if the object has the required AdapterConfig properties
   */
  private isAdapterConfig(obj: unknown): obj is AdapterConfig {
    if (!obj || typeof obj !== 'object') return false;

    // Check for the dependencies property which is required in AdapterConfig
    const candidate = obj as Partial<AdapterConfig>;
    return (
      candidate.dependencies !== undefined &&
      typeof candidate.dependencies === 'object' &&
      candidate.dependencies.runtime !== undefined
    );
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
   * @param chainType The blockchain type
   * @returns Record of package names to version ranges
   */
  private getChainDependencies(chainType: ChainType): Record<string, string> {
    // Get dependencies from the adapter's config
    const adapterConfig = this.adapterConfigs[chainType];

    if (!adapterConfig) {
      console.warn(`No configuration found for chain type: ${chainType}`);
      return {};
    }

    // Return runtime dependencies
    return adapterConfig.dependencies.runtime;
  }

  /**
   * Get chain-specific development dependencies from adapter config
   * @param chainType The blockchain type
   * @returns Record of package names to version ranges
   */
  private getChainDevDependencies(chainType: ChainType): Record<string, string> {
    // Get dev dependencies from the adapter's config
    const adapterConfig = this.adapterConfigs[chainType];

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
   * @param chainType The blockchain type
   * @returns Record of dependency packages and versions
   */
  getDependencies(formConfig: BuilderFormConfig, chainType: ChainType): Record<string, string> {
    // Combine dependencies from different sources
    return {
      // Core dependencies from form-renderer
      ...this.getCoreDependencies(),

      // Chain-specific dependencies from adapter
      ...this.getChainDependencies(chainType),

      // Field-specific dependencies from form-renderer
      ...this.getFieldDependencies(formConfig),
    };
  }

  /**
   * Get the combined dev dependencies needed for the project
   *
   * @param formConfig The form configuration
   * @param chainType The blockchain type
   * @returns Record of development dependency packages and versions
   */
  getDevDependencies(formConfig: BuilderFormConfig, chainType: ChainType): Record<string, string> {
    // Start with common dev dependencies (from chain adapter config)
    const devDependencies = {};

    // Add chain-specific dev dependencies
    const chainDevDependencies = this.getChainDevDependencies(chainType);

    // Add field-specific dev dependencies
    const fieldDevDependencies = this.getFieldDevDependencies(formConfig);

    // Combine them
    return {
      ...devDependencies,
      ...chainDevDependencies,
      ...fieldDevDependencies,
    };
  }

  /**
   * Apply semantic versioning strategy for dependencies
   * @param dependencies Record of package names to version ranges
   * @returns Updated record with versioning strategy applied
   */
  private applyVersioningStrategy(dependencies: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};

    // Special handling for our own packages - use caret for easier upgrades
    for (const [name, version] of Object.entries(dependencies)) {
      if (name.startsWith('@openzeppelin/transaction-form')) {
        // Use caret range to allow minor and patch updates
        result[name] = version.startsWith('^') ? version : `^${version}`;
      } else {
        // Use original version for third-party packages
        result[name] = version;
      }
    }

    return result;
  }

  /**
   * Generate a project name based on function ID
   * @param functionId The function ID
   * @returns A suitable package name
   */
  private generateProjectName(functionId: string): string {
    // Generate a suitable package name from the function ID
    const baseName = functionId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${baseName}-form`;
  }

  /**
   * Update package.json with dependencies and other adjustments
   * @param packageJsonContent Original package.json content as a string
   * @param formConfig The form configuration
   * @param chainType The blockchain type
   * @param functionId The function ID
   * @param options Export customization options
   * @returns Updated package.json content as a string
   */
  updatePackageJson(
    packageJsonContent: string,
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string,
    options: Partial<ExportOptions> = {}
  ): string {
    // Parse package.json
    const packageJson = JSON.parse(packageJsonContent);

    // Update name and description
    packageJson.name = options.projectName || this.generateProjectName(functionId);
    packageJson.description = options.description || `Form for ${functionId} function`;

    // Update author if provided
    if (options.author) {
      packageJson.author = options.author;
    }

    // Update license if provided
    if (options.license) {
      packageJson.license = options.license;
    }

    // Get dependencies and apply versioning strategy
    const dependencies = this.applyVersioningStrategy(this.getDependencies(formConfig, chainType));

    // Get dev dependencies
    const devDependencies = this.getDevDependencies(formConfig, chainType);

    // Update dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies,
      // Include any additional dependencies specified in options
      ...(options.dependencies || {}),
    };

    // Update dev dependencies
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...devDependencies,
    };

    // Add upgrade instructions
    this.addUpgradeInstructions(packageJson);

    // Return stringified package.json
    return JSON.stringify(packageJson, null, 2);
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
      'npm update @openzeppelin/transaction-form-renderer';

    // Add a script to check for outdated dependencies
    (packageJson.scripts as Record<string, string>)['check-deps'] = 'npm outdated';
  }
}
