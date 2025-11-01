import type { NetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { ExportOptions } from '../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
// Temporary local import
import type { PackageManager } from '../PackageManager';

/**
 * Updates the package.json file content within projectFiles with correct dependencies and metadata.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param packageManager - Instance of PackageManager.
 * @param formConfig - The form configuration.
 * @param networkConfig - The network configuration for the exported form.
 * @param functionId - The ID of the function this form is for.
 * @param exportOptions - Export customization options.
 */
export async function updatePackageJsonFile(
  projectFiles: Record<string, string | Uint8Array | Blob>,
  packageManager: PackageManager,
  formConfig: BuilderFormConfig,
  networkConfig: NetworkConfig,
  functionId: string,
  exportOptions: ExportOptions
): Promise<void> {
  const logSystem = 'File Assembly (updatePackageJsonFile)';
  logger.info(logSystem, 'Updating package.json...');
  const originalPackageJson = projectFiles['package.json'];

  if (originalPackageJson && typeof originalPackageJson === 'string') {
    projectFiles['package.json'] = await packageManager.updatePackageJson(
      originalPackageJson,
      formConfig,
      networkConfig.ecosystem,
      functionId,
      exportOptions
    );
    logger.info(logSystem, 'package.json updated.');
  } else {
    logger.error(logSystem, 'Error: No package.json found in template files.');
    throw new Error('Template is missing package.json');
  }
}
