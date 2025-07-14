import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * Generates and adds adapter-specific files (e.g., UI kit configs) to the project.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param adapter - The active ContractAdapter instance.
 * @param formConfig - The form configuration, containing the uiKitConfig.
 */
export async function generateAdapterSpecificFiles(
  projectFiles: Record<string, string>,
  adapter: ContractAdapter,
  formConfig: BuilderFormConfig
): Promise<void> {
  const logSystem = 'File Assembly (generateAdapterSpecificFiles)';

  if (typeof adapter.getExportableWalletConfigFiles !== 'function') {
    logger.info(logSystem, 'Adapter does not support exporting wallet config files. Skipping.');
    return;
  }

  try {
    const walletConfigFiles = await adapter.getExportableWalletConfigFiles(formConfig.uiKitConfig);

    if (Object.keys(walletConfigFiles).length > 0) {
      logger.info(
        logSystem,
        `Adding ${Object.keys(walletConfigFiles).length} wallet config file(s) from adapter.`
      );
      Object.assign(projectFiles, walletConfigFiles);
    }
  } catch (error) {
    logger.error(logSystem, 'Error generating adapter-specific wallet config files:', error);
  }
}
