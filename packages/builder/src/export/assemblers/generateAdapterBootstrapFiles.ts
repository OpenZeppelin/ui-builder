import type {
  ContractAdapter,
  ContractSchema,
  NetworkConfig,
} from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * Context for adapter bootstrap file generation
 */
export interface BootstrapContext {
  formConfig: BuilderFormConfig;
  contractSchema: ContractSchema;
  networkConfig: NetworkConfig;
  artifacts?: Record<string, unknown> | null;
  definitionOriginal?: string | null;
}

/**
 * Bootstrap information for template injection
 */
export interface BootstrapInfo {
  imports: string[];
  initAfterAdapterConstruct: string;
}

/**
 * Generates and adds adapter-specific bootstrap files to the project.
 * This enables adapters to bundle ecosystem-specific artifacts (e.g., Midnight contract artifacts)
 * into exported applications in a chain-agnostic manner.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param adapter - The active ContractAdapter instance.
 * @param context - Context information for bootstrap generation.
 * @returns Bootstrap info for template injection, or null if not supported.
 */
export async function generateAdapterBootstrapFiles(
  projectFiles: Record<string, string>,
  adapter: ContractAdapter,
  context: BootstrapContext
): Promise<BootstrapInfo | null> {
  const logSystem = 'File Assembly (generateAdapterBootstrapFiles)';

  if (typeof adapter.getExportBootstrapFiles !== 'function') {
    logger.info(logSystem, 'Adapter does not support export bootstrap files. Skipping.');
    return null;
  }

  try {
    const bootstrap = await adapter.getExportBootstrapFiles(context);

    if (!bootstrap) {
      logger.info(logSystem, 'Adapter returned no bootstrap files.');
      return null;
    }

    // Add bootstrap files to the project
    if (bootstrap.files && Object.keys(bootstrap.files).length > 0) {
      logger.info(
        logSystem,
        `Adding ${Object.keys(bootstrap.files).length} bootstrap file(s) from adapter.`
      );
      Object.assign(projectFiles, bootstrap.files);
    }

    // Return bootstrap info for template injection
    const bootstrapInfo: BootstrapInfo = {
      imports: bootstrap.imports || [],
      initAfterAdapterConstruct: bootstrap.initAfterAdapterConstruct || '',
    };

    return bootstrapInfo;
  } catch (error) {
    logger.error(logSystem, 'Error generating adapter bootstrap files:', error);
    return null;
  }
}
